export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const audioUrl = req.body.audio_url;
    const n8nUrl = `https://suhailsway.app.n8n.cloud/webhook/e57c1bcf-e93d-4e54-8851-9832520b32c3?audio_url=${encodeURIComponent(audioUrl)}`;
    
    const response = await fetch(n8nUrl, {
      method: 'GET',
    });
    const responseText = await response.text();
    console.log('n8n response:', response.status, responseText);
    return res.status(200).json({ success: true, n8nStatus: response.status });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
