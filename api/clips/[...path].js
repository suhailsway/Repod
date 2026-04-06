export default async function handler(req, res) {
  const path = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path;
  const url = `http://159.203.99.184:8000/clips/${path}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    return res.status(response.status).json({ error: 'Failed to fetch clip' });
  }

  const contentType = response.headers.get('content-type') || 'video/mp4';
  const contentLength = response.headers.get('content-length');
  
  res.setHeader('Content-Type', contentType);
  res.setHeader('Accept-Ranges', 'bytes');
  if (contentLength) res.setHeader('Content-Length', contentLength);
  res.setHeader('Cache-Control', 'public, max-age=3600');

  const buffer = await response.arrayBuffer();
  res.send(Buffer.from(buffer));
}
