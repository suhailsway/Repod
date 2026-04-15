export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { audio_url, video_path, mode = 'audio', session_id, user_email } = req.body;
    const sessionId = session_id || Date.now().toString();
    const sourceUrl = video_path || audio_url;

    if (mode === 'audio') {
      const aaiRes = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: {
          'Authorization': process.env.ASSEMBLYAI_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audio_url, speech_models: ['universal-2'] }),
      });
      const aaiData = await aaiRes.json();
      const transcriptId = aaiData.id;

      await fetch('https://api.airtable.com/v0/appHPv16UPdsghkQt/tblaDHnsqtL3PWZk1', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.AIRTABLE_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            session_id: sessionId,
            transcript_id: transcriptId,
            ...(user_email && { user_email }),
          }
        }),
      });
    }

    if (mode === 'video') {
      const supoclipRes = await fetch('http://159.223.166.171:8000/tasks/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'user_id': 'repod-user-001' },
        body: JSON.stringify({ source: { url: sourceUrl, type: "youtube" }, font_options: { font_size: 72 } }),
      });
      const supoclipData = await supoclipRes.json();
      const taskId = supoclipData.task_id;

      await fetch('https://api.airtable.com/v0/appHPv16UPdsghkQt/tblaDHnsqtL3PWZk1', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.AIRTABLE_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            session_id: sessionId,
            task_id: taskId,
            ...(user_email && { user_email }),
          }
        }),
      });
    }

    return res.status(200).json({ success: true, sessionId });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
