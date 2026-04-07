export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const fetch = (await import('node-fetch')).default;
  const FormData = (await import('form-data')).default;

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const buffer = Buffer.concat(chunks);

  const form = new FormData();
  form.append('video', buffer, { filename: 'upload.mp4', contentType: 'video/mp4' });

  const doRes = await fetch('http://159.203.99.184:5001/upload', {
    method: 'POST',
    body: form,
    headers: form.getHeaders(),
  });

  const data = await doRes.json();
  return res.status(200).json(data);
}
