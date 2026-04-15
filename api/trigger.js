const SUPABASE_URL = 'https://frbziezfrpdbtrkbmlzy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyYnppZXpmcnBkYnRya2JtbHp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMDM5MDUsImV4cCI6MjA5MTc3OTkwNX0.S7ViyQgVYgxdxk2EU8470DChaD46WO20X9mdDDkQ1Hk';

async function insertJob(fields) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/repod_jobs`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(fields),
  });
  return res.json();
}

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

      await insertJob({ session_id: sessionId, transcript_id: transcriptId, user_email: user_email || '' });
    }

    if (mode === 'video') {
      const supoclipRes = await fetch('http://159.223.166.171:8000/tasks/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'user_id': 'repod-user-001' },
        body: JSON.stringify({ source: { url: sourceUrl, type: "youtube" }, font_options: { font_size: 72 } }),
      });
      const supoclipData = await supoclipRes.json();
      const taskId = supoclipData.task_id;

      await insertJob({ session_id: sessionId, task_id: taskId, user_email: user_email || '' });
    }

    return res.status(200).json({ success: true, sessionId });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
