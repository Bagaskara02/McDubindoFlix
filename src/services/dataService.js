/**
 * Data Service for McDubindoFlix Web
 * Handles loading catalog JSONs, search indexing, series deduplication,
 * and episode playlist grouping.
 */

// Cache for catalog data
const cache = {
  all_content: null,
  trending: null,
  popular: null,
  boxoffice: null,
  netflix: null,
  disney: null,
  series: null,
  movies: null,
};

// Series index maps
let isSeriesIndexed = false;
const seriesMap = new Map(); // seriesKey -> Array<{ movie, season, episode, label }>
const movieToSeriesKey = new Map(); // movieId/slug -> seriesKey

/**
 * Fetch and cache JSON file from /data/
 */
async function loadJson(filename) {
  const key = filename.replace('.json', '');
  if (cache[key]) {
    return cache[key];
  }

  try {
    const res = await fetch(`/data/${filename}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data.data || []);
    cache[key] = list;
    return list;
  } catch (err) {
    console.error(`Failed to load /data/${filename}:`, err);
    return [];
  }
}

/**
 * Extract series title, season, and episode from raw title string
 */
export function extractSeriesInfo(rawTitle) {
  if (!rawTitle) return null;

  // 1. Match SxxExx or S01 E01
  const mSe = rawTitle.match(/\b[sS](\d+)\s*[eE](\d+)\b/);
  if (mSe) {
    const season = parseInt(mSe[1], 10) || 1;
    const episode = parseInt(mSe[2], 10) || 1;
    const cleanName = rawTitle.replace(/\[?[sS]\d+\s*[eE]\d+\]?/g, '');
    return { seriesName: cleanName, season, episode };
  }

  // 2. Match Season X ... Episode Y
  const mSeWords = rawTitle.match(/(?:Season|Musim)\s*(\d+).*?(?:Episode|Eps|Ep)\.?\s*(\d+)/i);
  if (mSeWords) {
    const season = parseInt(mSeWords[1], 10) || 1;
    const episode = parseInt(mSeWords[2], 10) || 1;
    const cleanName = rawTitle.replace(/(?:Season|Musim)\s*\d+.*?(?:Episode|Eps|Ep)\.?\s*\d+.*/i, '');
    return { seriesName: cleanName, season, episode };
  }

  // 3. Match Episode X ... Season Y
  const mEsWords = rawTitle.match(/(?:Episode|Eps|Ep)\.?\s*(\d+).*?(?:Season|Musim)\s*(\d+)/i);
  if (mEsWords) {
    const episode = parseInt(mEsWords[1], 10) || 1;
    const season = parseInt(mEsWords[2], 10) || 1;
    const cleanName = rawTitle.replace(/(?:Episode|Eps|Ep)\.?\s*\d+.*?(?:Season|Musim)\s*\d+.*/i, '');
    return { seriesName: cleanName, season, episode };
  }

  // 4. Match standalone Episode X / Eps X / Ep X
  const mEp = rawTitle.match(/(?:Episode|Eps|Ep)\.?\s*(\d+)/i);
  if (mEp) {
    const episode = parseInt(mEp[1], 10) || 1;
    const mS = rawTitle.match(/(?:Season|Musim)\s*(\d+)/i);
    const season = mS ? (parseInt(mS[1], 10) || 1) : 1;
    const cleanName = rawTitle.replace(/(?:Episode|Eps|Ep)\.?\s*\d+.*/i, '');
    return { seriesName: cleanName, season, episode };
  }

  return null;
}

/**
 * Clean series name for uniform hash lookup
 */
export function normalizeSeriesKey(name) {
  if (!name) return '';
  let c = name.toLowerCase();
  c = c.replace(/\b(dub\s*indo|dubbing\s*indonesia|indo\s*dub|dub\s*malay|sub\s*indo)\b/gi, '');
  c = c.replace(/\b(1080p|720p|480p|hd|web-dl|blu\s*ray|remastered|end|final|on|season|musim)\b/gi, '');
  c = c.replace(/(\[.*?\]|\(.*?\))/g, '');
  c = c.replace(/[-_–—:.,]+/g, ' ');
  c = c.replace(/\s+/g, ' ').trim();
  return c;
}

/**
 * Index all movies to extract series groups
 */
export async function initSeriesIndex() {
  if (isSeriesIndexed) return;

  const allMovies = await loadJson('all_content.json');
  const tempMap = new Map();

  for (const movie of allMovies) {
    const info = extractSeriesInfo(movie.title);
    if (info) {
      const key = normalizeSeriesKey(info.seriesName);
      if (key.length >= 3) {
        if (!tempMap.has(key)) {
          tempMap.set(key, []);
        }
        tempMap.get(key).push({
          movie,
          season: info.season,
          episode: info.episode,
          label: `Eps ${info.episode}`,
        });
      }
    }
  }

  // Filter groups with >= 2 episodes and sort ascending
  for (const [key, episodes] of tempMap.entries()) {
    if (episodes.length >= 2) {
      episodes.sort((a, b) => {
        if (a.season !== b.season) return a.season - b.season;
        return a.episode - b.episode;
      });

      seriesMap.set(key, episodes);
      for (const ep of episodes) {
        if (ep.movie.id) movieToSeriesKey.set(String(ep.movie.id), key);
        if (ep.movie.slug) movieToSeriesKey.set(ep.movie.slug, key);
      }
    }
  }

  isSeriesIndexed = true;
}

/**
 * Check if a movie is part of a series
 */
export function isSeries(movie) {
  if (!movie) return false;
  const key = movieToSeriesKey.get(String(movie.id)) || movieToSeriesKey.get(movie.slug);
  if (key && seriesMap.has(key)) {
    return (seriesMap.get(key)?.length || 0) >= 2;
  }
  const info = extractSeriesInfo(movie.title);
  if (info) {
    const k = normalizeSeriesKey(info.seriesName);
    return (seriesMap.get(k)?.length || 0) >= 2;
  }
  return false;
}

/**
 * Get total episode count
 */
export function getSeriesEpisodeCount(movie) {
  const eps = getEpisodesForMovie(movie);
  return eps.length;
}

/**
 * Get all episodes for this movie's series
 */
export function getEpisodesForMovie(movie) {
  if (!movie) return [];
  let key = movieToSeriesKey.get(String(movie.id)) || movieToSeriesKey.get(movie.slug);
  if (!key) {
    const info = extractSeriesInfo(movie.title);
    if (info) {
      key = normalizeSeriesKey(info.seriesName);
    }
  }

  if (key && seriesMap.has(key)) {
    return seriesMap.get(key) || [];
  }
  return [];
}

/**
 * Get clean readable series title without tags/noise
 */
export function getCleanSeriesTitle(movie) {
  if (!movie) return '';
  const info = extractSeriesInfo(movie.title);
  if (info && info.seriesName) {
    let name = info.seriesName;
    name = name.replace(/\b(dub\s*indo|dubbing\s*indonesia|indo\s*dub)\b/gi, '');
    name = name.replace(/(\[.*?\]|\(.*?\))/g, '');
    name = name.replace(/[-_–—:]+$/g, '');
    name = name.replace(/^\s*[-_–—:]+/g, '');
    name = name.replace(/\s+/g, ' ').trim();
    if (name.length > 2) return name;
  }

  // Default clean
  let t = movie.title || '';
  t = t.replace(/1080p|720p|480p|hd|web-dl|blu\s*ray|remastered/gi, '');
  t = t.replace(/\b(dub\s*indo|dubbing\s*indonesia)\b/gi, '');
  t = t.replace(/(\[.*?\]|\(.*?\))/g, '');
  return t.trim() || movie.title;
}

/**
 * Deduplicate series in a list: keep only Episode 1 (or earliest), with total count
 */
export function groupSeriesInList(movies) {
  if (!movies || !movies.length) return [];

  const seenSeries = new Set();
  const result = [];

  for (const movie of movies) {
    let key = movieToSeriesKey.get(String(movie.id)) || movieToSeriesKey.get(movie.slug);
    if (!key) {
      const info = extractSeriesInfo(movie.title);
      if (info) {
        key = normalizeSeriesKey(info.seriesName);
      }
    }

    const isMulti = key && seriesMap.has(key) && seriesMap.get(key).length >= 2;
    if (isMulti) {
      if (!seenSeries.has(key)) {
        seenSeries.add(key);
        const eps = seriesMap.get(key);
        const ep1 = eps.find((e) => e.episode === 1) || eps[0];
        result.push(ep1.movie);
      }
    } else {
      result.push(movie);
    }
  }

  return result;
}

/**
 * Fetch movies by category with automatic series grouping
 */
export async function getCategoryMovies(category, limit = 50) {
  await initSeriesIndex();

  let filename = 'popular.json';
  switch (category) {
    case 'trending':
      filename = 'trending.json';
      break;
    case 'popular':
      filename = 'popular.json';
      break;
    case 'boxoffice':
      filename = 'boxoffice.json';
      break;
    case 'netflix':
      filename = 'netflix.json';
      break;
    case 'disney':
      filename = 'disney.json';
      break;
    case 'series':
      filename = 'series.json';
      break;
    case 'latest':
      filename = 'latest.json';
      break;
    case 'movies':
      filename = 'movies.json';
      break;
    default:
      filename = 'popular.json';
  }

  const raw = await loadJson(filename);
  const grouped = groupSeriesInList(raw);
  return limit > 0 ? grouped.slice(0, limit) : grouped;
}

/**
 * Fast search across all 2,300+ items with token matching & series grouping
 */
export async function searchMovies(query) {
  if (!query || !query.trim()) return [];
  await initSeriesIndex();

  const all = await loadJson('all_content.json');
  const tokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean);

  const matched = all.filter((item) => {
    const title = (item.title || '').toLowerCase();
    const desc = (item.description || '').toLowerCase();
    const tags = Array.isArray(item.tags) ? item.tags.join(' ').toLowerCase() : '';
    const full = `${title} ${desc} ${tags}`;
    return tokens.every((token) => full.includes(token));
  });

  return groupSeriesInList(matched);
}

/**
 * Extract working embed code from movie slug or URL (the hash after the underscore)
 */
export function getEmbedCode(movie) {
  if (!movie) return '';
  if (movie.slug && typeof movie.slug === 'string') {
    const parts = movie.slug.split('_');
    if (parts.length > 1) {
      const last = parts[parts.length - 1].trim();
      if (last.length >= 6) return last;
    }
  }
  if (movie.url && typeof movie.url === 'string') {
    const cleanUrl = movie.url.replace('.html', '').split('?')[0];
    const parts = cleanUrl.split('_');
    if (parts.length > 1) {
      const last = parts[parts.length - 1].trim();
      if (last.length >= 6) return last;
    }
  }
  return String(movie.id || '').trim();
}

/**
 * Get related movies for the dedicated player screen
 */
export async function getRelatedMovies(currentMovie, limit = 12) {
  if (!currentMovie) return [];
  await initSeriesIndex();
  const all = await loadJson('popular.json');
  const grouped = groupSeriesInList(all);
  const filtered = grouped.filter((m) => m.id !== currentMovie.id);
  return filtered.slice(0, limit);
}

let streamSourcesCache = null;

function isValidVideoStream(url) {
  if (!url || typeof url !== 'string') return false;
  const lower = url.toLowerCase();
  if (
    lower.includes('.png') ||
    lower.includes('.jpg') ||
    lower.includes('.jpeg') ||
    lower.includes('.gif') ||
    lower.includes('.svg') ||
    lower.includes('.webp') ||
    lower.includes('logo-light')
  ) {
    return false;
  }
  return (
    lower.includes('.mp4') ||
    lower.includes('driveduo') ||
    lower.includes('uvideoweb') ||
    lower.includes('.m3u8') ||
    lower.includes('stream.dubbindo.site')
  );
}

/**
 * Get direct video stream source (MP4 / driveduo stream)
 */
export async function getStreamSource(movie) {
  if (!movie) return null;

  // 1. Try loading cached catalog mapping
  if (!streamSourcesCache) {
    try {
      const res = await fetch('/data/stream_sources.json');
      if (res.ok) {
        streamSourcesCache = await res.json();
      }
    } catch (e) {
      console.warn('Could not load stream_sources.json:', e);
    }
  }

  if (streamSourcesCache) {
    const idKey = String(movie.id);
    let val = streamSourcesCache[idKey] || (movie.slug && streamSourcesCache[movie.slug]);
    if (!val) {
      const embedCode = getEmbedCode(movie);
      if (embedCode) val = streamSourcesCache[embedCode];
    }
    if (val) {
      const u = typeof val === 'string' ? val : val.url;
      if (isValidVideoStream(u)) {
        return { url: u };
      }
    }
  }

  // 2. Fallback: Search all_content for alternative working upload of the same movie
  try {
    const all = await loadJson('all_content.json');
    const cleanCurrent = getCleanSeriesTitle(movie).toLowerCase().trim();
    if (cleanCurrent.length >= 3 && streamSourcesCache) {
      const alt = all.find((m) => {
        if (String(m.id) === String(movie.id)) return false;
        const cm = getCleanSeriesTitle(m).toLowerCase().trim();
        if (cm !== cleanCurrent && !cm.includes(cleanCurrent) && !cleanCurrent.includes(cm)) {
          return false;
        }
        const altSrc = streamSourcesCache[String(m.id)] || (m.slug && streamSourcesCache[m.slug]);
        const altUrl = typeof altSrc === 'string' ? altSrc : altSrc?.url;
        return isValidVideoStream(altUrl);
      });

      if (alt) {
        const altSrc = streamSourcesCache[String(alt.id)] || streamSourcesCache[alt.slug];
        const altUrl = typeof altSrc === 'string' ? altSrc : altSrc?.url;
        return { url: altUrl, isAlternative: true, altTitle: alt.title };
      }
    }
  } catch (_) {}

  // 3. Try serverless endpoint /api/stream if not in cache
  try {
    const embedCode = getEmbedCode(movie);
    const params = new URLSearchParams();
    if (embedCode) params.set('code', embedCode);
    if (movie.slug) params.set('slug', movie.slug);
    if (movie.url) params.set('url', movie.url);

    const apiRes = await fetch(`/api/stream?${params.toString()}`);
    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data && data.url && isValidVideoStream(data.url)) {
        return data;
      }
    }
  } catch (_) {}

  return null;
}

/**
 * Watch History (Lanjutkan Menonton) Helpers
 */
const HISTORY_STORAGE_KEY = 'mcdubindoflix_history';

export function getWatchHistory() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to parse watch history:', err);
    return [];
  }
}

export function saveWatchProgress({ movie, cleanTitle, episodeLabel, currentTime, duration }) {
  if (typeof window === 'undefined' || !movie || !currentTime || isNaN(currentTime)) return;
  try {
    const history = getWatchHistory();
    const id = String(movie.id || movie.slug);
    const validDuration = duration && !isNaN(duration) && duration > 0 ? duration : 0;
    const percent = validDuration > 0 ? Math.min(100, Math.round((currentTime / validDuration) * 100)) : 0;

    // Filter out existing item for this movie/series
    const updated = history.filter((item) => String(item.id) !== id && item.slug !== movie.slug);

    // Insert at beginning (most recently watched)
    updated.unshift({
      id,
      slug: movie.slug || '',
      movie,
      cleanTitle: cleanTitle || movie.title || '',
      episodeLabel: episodeLabel || '',
      currentTime: Math.floor(currentTime),
      duration: Math.floor(validDuration),
      percent,
      updatedAt: Date.now(),
    });

    // Limit history to 30 items
    const trimmed = updated.slice(0, 30);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(trimmed));
    return trimmed;
  } catch (err) {
    console.error('Failed to save watch history:', err);
  }
}

export function removeWatchHistory(idOrSlug) {
  if (typeof window === 'undefined') return [];
  try {
    const history = getWatchHistory();
    const updated = history.filter((item) => String(item.id) !== String(idOrSlug) && item.slug !== idOrSlug);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to remove item from history:', err);
    return [];
  }
}

export function clearWatchHistory() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear history:', err);
  }
}


