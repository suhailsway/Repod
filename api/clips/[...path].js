export default async function handler(req, res) {
  const path = req.query.path.join('/');
  const response = await fetch(`http://159.203.99.184:8000/clips/${path}`);
  const buffer = await response.arrayBuffer();
  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Accept-Ranges', 'bytes');
  res.send(Buffer.from(buffer));
}
