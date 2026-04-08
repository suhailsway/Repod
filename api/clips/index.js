export default async function handler(req, res) {
  const file = req.query.file;
  const url = `http://159.203.99.184:8000/clips/${file}`;

  const headers = {};
  if (req.headers.range) {
    headers['Range'] = req.headers.range;
  }

  const response = await fetch(url, { headers });

  const contentType = response.headers.get('content-type') || 'video/mp4';
  const contentLength = response.headers.get('content-length');
  const contentRange = response.headers.get('content-range');

  res.setHeader('Content-Type', contentType);
  res.setHeader('Accept-Ranges', 'bytes');
  if (contentLength) res.setHeader('Content-Length', contentLength);
  if (contentRange) res.setHeader('Content-Range', contentRange);
  res.setHeader('Cache-Control', 'public, max-age=3600');

  res.status(response.status);

  const buffer = await response.arrayBuffer();
  res.send(Buffer.from(buffer));
}}
