const WORKER_URL = "https://throbbing-shadow-50b6.sohail31314.workers.dev";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action, filename, contentType, uploadId, key, partNumber, parts } = req.body;

  const workerRes = await fetch(`${WORKER_URL}/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, filename, contentType, uploadId, key, partNumber, parts }),
  });

  const data = await workerRes.json();
  return res.status(200).json(data);
}
