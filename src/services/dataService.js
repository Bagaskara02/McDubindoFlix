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
 * Clean series title removing technical tags, season/episode and metadata
 */
export function cleanSeriesName(name) {
  if (!name) return '';
  let c = name;
  c = c.replace(/[\u200B-\u200D\uFEFF\u2060]/g, '');
  c = c.replace(/\b(1080p|720p|480p|hd|web-dl|blu\s*ray|remastered|end|final|on|full\s*movie)\b/gi, '');
  c = c.replace(/\b(dub\s*indo|dubbing\s*indonesia|indo\s*dub|dub\s*malay|sub\s*indo|dub\s*indonesia|bahasa\s*indonesia|dubb\s*indonesia)\b/gi, '');
  c = c.replace(/\b(season\s*\d+|musim\s*\d+)\b/gi, '');
  c = c.replace(/(\(\s*\d{4}\s*\)|\[\s*\d{4}\s*\])/g, '');
  c = c.replace(/(\[.*?\]|\(.*?\))/g, '');
  c = c.replace(/[-_–—:.,\s]+$/g, '');
  c = c.replace(/^[-_–—:.,\s]+/g, '');
  c = c.replace(/\s+/g, ' ').trim();
  return c;
}

/**
 * Extract series title, season, and episode from raw title string
 */
export function extractSeriesInfo(rawTitle) {
  if (!rawTitle) return null;
  let t = rawTitle.replace(/[\u200B-\u200D\uFEFF\u2060]/g, '').trim();

  // Pattern A: SxxExx or S01 E01
  let m = t.match(/^(.*?)\s*\[?[sS](\d+)\s*[eE](\d+)\]?(.*)$/i);
  if (m) {
    return {
      seriesName: cleanSeriesName(m[1]),
      season: parseInt(m[2], 10),
      episode: parseInt(m[3], 10),
      epTitle: m[4].trim(),
    };
  }

  // Pattern B: Season X / Musim X ... Episode Y / Eps Y / Ep Y
  m = t.match(/^(.*?)\s*(?:Season|Musim)\s*(\d+).*?(?:Episode|Eps|Ep)\.?\s*(\d+)(.*)$/i);
  if (m) {
    return {
      seriesName: cleanSeriesName(m[1]),
      season: parseInt(m[2], 10),
      episode: parseInt(m[3], 10),
      epTitle: m[4].trim(),
    };
  }

  // Pattern C: Episode X ... Season Y
  m = t.match(/^(.*?)\s*(?:Episode|Eps|Ep)\.?\s*(\d+).*?(?:Season|Musim)\s*(\d+)(.*)$/i);
  if (m) {
    return {
      seriesName: cleanSeriesName(m[1]),
      season: parseInt(m[3], 10),
      episode: parseInt(m[2], 10),
      epTitle: m[4].trim(),
    };
  }

  // Pattern D: Musim X - YY (e.g. Rainbow Bubblegem Musim 2 - 09)
  m = t.match(/^(.*?)\s*(?:Season|Musim)\s*(\d+)\s*[-–:]\s*(\d+)(.*)$/i);
  if (m) {
    return {
      seriesName: cleanSeriesName(m[1]),
      season: parseInt(m[2], 10),
      episode: parseInt(m[3], 10),
      epTitle: m[4].trim(),
    };
  }

  // Pattern E: Title Episode / Eps / Ep XX (Numbered) (e.g. Marvel Ultimate Spider-man (2012) Dub Indo Episode 26)
  m = t.match(/^(.*?)(?:\s+(?:dub\s*indo|dubbing\s*indonesia))?\s+(?:Episode|Eps|Ep)\.?\s*(\d+)(.*)$/i);
  if (m) {
    return {
      seriesName: cleanSeriesName(m[1]),
      season: 1,
      episode: parseInt(m[2], 10),
      epTitle: m[3].trim(),
    };
  }

  // Pattern F: Named Episodes like: 'Spongebob Eps - Snooze You Lose Dubb Indonesia'
  m = t.match(/^(.*?)\s+(?:Episode|Eps|Ep)\.?\s*[-–:]\s*(.+)$/i);
  if (m) {
    let epPart = m[2]
      .replace(/\b(dub\s*indo|dubbing\s*indonesia|indo\s*dub|dubb\s*indonesia|bahasa\s*indonesia|720p?|1080p?|480p?)\b/gi, '')
      .trim()
      .replace(/[-_–—:.,\s]+$/g, '');
    return {
      seriesName: cleanSeriesName(m[1]),
      season: 1,
      episode: 0,
      epTitle: epPart,
    };
  }

  // Pattern G: Dash Number e.g. 'Marine Book - 08' or 'Marine Book- 10'
  m = t.match(/^(.*?)\s*[-–]\s*(\d+)(.*)$/);
  if (m && !/^(19|20)\d{2}/.test(m[2])) {
    return {
      seriesName: cleanSeriesName(m[1]),
      season: 1,
      episode: parseInt(m[2], 10),
      epTitle: m[3].trim(),
    };
  }

  // Pattern H: Specific well-known multi-episode shows
  if (/^spongebob\b/i.test(t)) {
    return {
      seriesName: 'SpongeBob SquarePants',
      season: 1,
      episode: 0,
      epTitle: t.replace(/^spongebob\s*(?:eps?|episode)?\s*[-–:]*\s*/i, '').replace(/\b(dub\s*indo|dubbing\s*indonesia|indo\s*dub|dubb\s*indonesia|bahasa\s*indonesia)\b/gi, '').trim(),
    };
  }
  if (/^(?:little\s*)?kris(?:hna)?\b/i.test(t)) {
    return {
      seriesName: 'Little Krishna',
      season: 1,
      episode: 0,
      epTitle: t.replace(/^(?:little\s*)?kris(?:hna)?\s*(?:eps?|episode)?\s*[-–:]*\s*/i, '').trim(),
    };
  }
  if (/^marvel\s*ultimate\s*spider[\s-]*man/i.test(t)) {
    return {
      seriesName: 'Marvel Ultimate Spider-Man',
      season: 1,
      episode: 0,
      epTitle: t,
    };
  }

  return null;
}

/**
 * Clean series name for uniform hash lookup
 */
export function normalizeSeriesKey(name) {
  if (!name) return '';
  let c = name.toLowerCase().replace(/[\u200B-\u200D\uFEFF\u2060]/g, '').trim();
  c = c.replace(/^(?:nonton|download)\s+/i, '');

  if (/spongebob/i.test(c)) return 'spongebob squarepants';
  if (/ultimate\s*spider/i.test(c)) return 'marvel ultimate spider man';
  if (/spiderman\s*the\s*new\s*animated/i.test(c)) return 'spiderman the new animated series';
  if (/avatar.*(?:legend of aang|aang)/i.test(c)) return 'avatar the legend of aang';
  if (/avatar.*last airbender/i.test(c)) return 'avatar the last airbender';
  if (/penguins\s*of\s*madagascar/i.test(c)) return 'the penguins of madagascar';
  if (/little\s*kris/i.test(c)) return 'little krishna';
  if (/bubblegem/i.test(c)) return 'rainbow bubblegem';
  if (/marine\s*book/i.test(c)) return 'marine book';

  c = c.replace(/\b(dub\s*indo|dubbing\s*indonesia|indo\s*dub|dub\s*malay|sub\s*indo|dub\s*indonesia|bahasa\s*indonesia|dubb\s*indonesia)\b/gi, '');
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

  const [allMovies, latestMovies] = await Promise.all([
    loadJson('all_content.json'),
    loadJson('latest.json').catch(() => []),
  ]);

  const tempMap = new Map();

  function addMovieToTemp(movie) {
    if (!movie || !movie.title) return;
    const info = extractSeriesInfo(movie.title);
    if (info) {
      const key = normalizeSeriesKey(info.seriesName);
      if (key.length >= 3) {
        if (!tempMap.has(key)) {
          tempMap.set(key, []);
        }
        const existing = tempMap.get(key);
        if (!existing.some((e) => e.movie.id === movie.id || (movie.slug && e.movie.slug === movie.slug))) {
          existing.push({
            movie,
            season: info.season,
            episode: info.episode,
            label: info.episode > 0 ? `Eps ${info.episode}` : (info.epTitle ? `Eps: ${info.epTitle}` : 'Eps'),
          });
        }
      }
    }
  }

  for (const movie of allMovies) {
    addMovieToTemp(movie);
  }
  for (const movie of latestMovies) {
    addMovieToTemp(movie);
  }

  // Filter groups with >= 2 episodes and sort ascending
  for (const [key, episodes] of tempMap.entries()) {
    if (episodes.length >= 2) {
      episodes.sort((a, b) => {
        if (a.season !== b.season) return a.season - b.season;
        if (a.episode > 0 && b.episode > 0) return a.episode - b.episode;
        return (a.label || '').localeCompare(b.label || '');
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
 * Helper to parse duration string to total seconds
 */
export function parseDurationToSeconds(durationStr) {
  if (!durationStr || typeof durationStr !== 'string') return 0;
  const parts = durationStr.trim().split(':').map((p) => parseInt(p, 10));
  if (parts.some(isNaN)) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

/**
 * Filter out Short Videos (< 10 mins), Anime, non-Netflix Indonesian films, and Indian content
 */
const animeKeywords = [
  'anime', 'aikatsu', 'naruto', 'boruto', 'one piece', 'dragon ball', 'doraemon',
  'shinchan', 'crayon shin', 'bleach', 'jujutsu', 'demon slayer', 'kimetsu',
  'attack on titan', 'shingeki', 'detective conan', 'conan', 'pokemon', 'pokémon',
  'digimon', 'black clover', 'haikyuu', 'my hero academia', 'boku no hero',
  'tokyo ghoul', 'hunter x hunter', 'hunterxhunter', 'chainsaw man', 'solo leveling',
  'inuyasha', 'fairy tail', 'death note', 'spy x family', 'sailor moon', 'gundam',
  'captain tsubasa', 'tsubasa', 'slam dunk', 'one punch man', 'sword art online',
  'tokyo revengers', 'danmachi', 'overlord', 're:zero', 'yu-gi-oh', 'yugioh',
  'beyblade', 'inazuma', 'kuroko', 'blue lock', 'kaiju no', 'oshi no ko',
  'dr. stone', 'dr stone', 'vinland', 'mashle', 'frieren', 'dungeon meshi',
  'shangri-la', 'wind breaker', 'isekai', 'mecha', 'otaku', 'versi televisi',
  'liar game', 'keroro', 'zenki', 'yokoso yoko',
];

const indoLocalKeywords = [
  'sengkolo', 'tuhan, benarkah', 'kuntilanak', 'reuni z', 'lawang sewu',
  'modal nekad', 'jomblo (2006)', 'tentang dia', 'bulan terbelah', 'cewek gue katrok',
  'pamali', 'ftv sctv', 'bioskop indonesia', 'special dokumenter', 'al-bahjah',
  'film indonesia', 'bioskop indonesia', 'sinetron', 'ftv', 'film nasional'
];

const indoLocalUploaders = [
  'senada', 'fachrya895', 'theodorus fabian lunel', 'lukipurwanto', 'joharman hutabalian', 'dimas 227'
];

const indianKeywords = [
  'india', 'indian', 'bollywood', 'hindi', 'tamil', 'telugu', 'malayalam',
  'punjabi', 'kollywood', 'tollywood', 'krishna', 'krisna', 'little krishna',
  'little krisna', 'radha', 'mahabharata', 'ramayana', 'shiva', 'bheem',
  'chhota bheem', 'motu patlu', 'grand masti', 'masti', 'krrish', 'dhoom',
  'shah rukh', 'shahrukh', 'salman khan', 'aamir khan', 'deepika',
  'ranbir', 'katrina kaif', 'kareena', 'akshay kumar', 'hrithik',
  'amitabh bachchan', 'baahubali', 'dangal', 'pushpa', 'kgf', 'pathaan',
  'jawan', 'chennai express', 'kuch kuch', 'kabhi khushi'
];

export function isAllowedInLatest(movie) {
  if (!movie) return false;

  const title = (movie.title || '').toLowerCase();
  const desc = (movie.description || '').toLowerCase();
  const cat = (movie.category || '').toLowerCase();
  const tags = Array.isArray(movie.tags) ? movie.tags.map((t) => String(t).toLowerCase()).join(' ') : '';
  const uploader = (movie.uploader || '').toLowerCase();

  // 1. FILTER SHORT VIDEOS (Under 10 minutes / 600s)
  const seconds = parseDurationToSeconds(movie.duration);
  if (seconds > 0 && seconds < 600) {
    return false;
  }
  if (/\b(trailer|teaser|clip|cuplikan|live\s*action|parodi|skit|short)\b/i.test(title)) {
    return false;
  }

  // 2. FILTER ANIME
  if (cat.includes('anime') || tags.includes('anime')) {
    return false;
  }
  if (animeKeywords.some((k) => title.includes(k) || tags.includes(k) || desc.includes(k))) {
    return false;
  }

  // 3. FILTER FILM INDONESIA YANG BUKAN NETFLIX
  const isIndoLocal =
    indoLocalKeywords.some((k) => title.includes(k) || tags.includes(k)) ||
    indoLocalUploaders.includes(uploader);

  if (isIndoLocal) {
    const isNetflix =
      title.includes('netflix') ||
      desc.includes('netflix') ||
      tags.includes('netflix') ||
      cat.includes('netflix');

    if (!isNetflix) {
      return false;
    }
  }

  // 4. FILTER FILM & SERIAL INDIA / BOLLYWOOD
  if (cat.includes('india') || tags.includes('india') || cat.includes('bollywood') || tags.includes('bollywood')) {
    return false;
  }
  if (indianKeywords.some((k) => title.includes(k) || tags.includes(k) || desc.includes(k))) {
    return false;
  }

  return true;
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

  let raw = await loadJson(filename);
  if (category === 'latest') {
    raw = raw.filter(isAllowedInLatest);
  }
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


