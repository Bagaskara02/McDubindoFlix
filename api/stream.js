// Vercel Serverless Function to extract direct video stream URL
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { code, slug, url } = req.query || {};

  let embedCode = code || '';
  if (!embedCode && slug && typeof slug === 'string') {
    const parts = slug.split('_');
    if (parts.length > 1) embedCode = parts[parts.length - 1];
  }
  if (!embedCode && url && typeof url === 'string') {
    const m = url.match(/_([a-zA-Z0-9]+)\.html/);
    if (m) embedCode = m[1];
  }

  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  function extractStreams(html) {
    const sources = [];
    const reSource = /<source[^>]+src=['"]([^'"]+)['"]/gi;
    let m;
    while ((m = reSource.exec(html)) !== null) {
      let src = m[1].trim();
      if (!src.startsWith('http')) src = `https://stream.dubbindo.site/${src.replace(/^\/+/, '')}`;
      sources.push(src);
    }
    const reAttr = /attr\(.+?src.+?['"]([^'"]+)['"]/gi;
    while ((m = reAttr.exec(html)) !== null) {
      let src = m[1].trim();
      if (!src.startsWith('http')) src = `https://stream.dubbindo.site/${src.replace(/^\/+/, '')}`;
      sources.push(src);
    }
    const reDD = /driveduo\/uploads\/[a-f0-9\-]+\/[a-f0-9\-]+/gi;
    while ((m = reDD.exec(html)) !== null) {
      sources.push(`https://stream.dubbindo.site/${m[0]}`);
    }
    const reUV = /uvideoweb\/movie\/[^\s"'<>]+/gi;
    while ((m = reUV.exec(html)) !== null) {
      sources.push(`https://stream.dubbindo.site/${m[0]}`);
    }
    const reDirect = /https?:\/\/stream\.dubbindo\.site\/[^\s"'<>]+\.mp4/gi;
    while ((m = reDirect.exec(html)) !== null) {
      sources.push(m[0]);
    }
    return Array.from(new Set(sources));
  }

  try {
    if (embedCode) {
      const embedUrl = `https://www.dubbindo.site/embed/${embedCode}`;
      const response = await fetch(embedUrl, {
        headers: { 'User-Agent': userAgent, 'Referer': 'https://www.dubbindo.site/' }
      });
      if (response.ok) {
        const html = await response.text();
        const sources = extractStreams(html);
        if (sources.length > 0) {
          return res.status(200).json({ success: true, url: sources[0], sources, embed_code: embedCode });
        }
      }
    }

    if (url) {
      const response = await fetch(url, {
        headers: { 'User-Agent': userAgent, 'Referer': 'https://www.dubbindo.site/' }
      });
      if (response.ok) {
        const html = await response.text();
        const sources = extractStreams(html);
        if (sources.length > 0) {
          return res.status(200).json({ success: true, url: sources[0], sources, embed_code: embedCode });
        }
      }
    }

    return res.status(404).json({ success: false, message: 'Stream not found' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
