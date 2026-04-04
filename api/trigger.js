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

    if (mode === 'video') {
      await fetch('https://suhailsway.app.n8n.cloud/webhook/61c99a9b-2cbe-47c5-898f-1865e351734d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_url: audioUrl, record_id: sessionId }),
      });
    } else {
      await fetch('https://suhailsway.app.n8n.cloud/webhook/e57c1bcf-e93d-4e54-8851-9832520b32c3', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-audio-url': audioUrl,
          'x-content-mode': 'audio'
        },
        body: JSON.stringify({ audio_url: audioUrl, session_id: sessionId }),
      });
    }

    return res.status(200).json({ success: true, sessionId });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}