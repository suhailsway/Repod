export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const audioUrl = req.body.audio_url;
    const mode = req.body.mode || 'audio';
    const sessionId = Date.now().toString();
    
    const response = await fetch('https://suhailsway.app.n8n.cloud/webhook/e57c1bcf-e93d-4e54-8851-9832520b32c3', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-audio-url': audioUrl,
        'x-content-mode': mode,
        'x-session-id': sessionId
      },
      body: JSON.stringify({ audio_url: audioUrl }),
    });
    const responseText = await response.text();
    console.log('n8n response:', response.status, responseText);
    return res.status(200).json({ success: true, sessionId: sessionId });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
