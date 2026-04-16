const SUPABASE_URL = 'https://frbziezfrpdbtrkbmlzy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyYnppZXpmcnBkYnRya2JtbHp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMDM5MDUsImV4cCI6MjA5MTc3OTkwNX0.S7ViyQgVYgxdxk2EU8470DChaD46WO20X9mdDDkQ1Hk';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { session_id } = req.body;
    if (!session_id) return res.status(400).json({ error: 'session_id required' });

    // Get the existing record
    const getRes = await fetch(
      `${SUPABASE_URL}/rest/v1/repod_jobs?session_id=eq.${session_id}&limit=1&select=*`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    const records = await getRes.json();
    if (!records || records.length === 0) return res.status(404).json({ error: 'Job not found' });

    const record = records[0];

    // Reset fields for retry
    const resetFields = {
      status: 'pending',
      task_id: null,
      transcript_id: null,
      video_clips: null,
      linkedin: null,
      twitter: null,
      newsletter: null,
      shownotes: null,
      facebook: null,
      instagram: null,
      hashtags: null,
      transcript: null,
      clips_status: null,
    };

    // For audio mode, create a new AssemblyAI transcript
    if (record.transcript_id && !record.video_path) {
      const aaiRes = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: {
          'Authorization': process.env.ASSEMBLYAI_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audio_url: record.audio_url, speech_models: ['universal-2'] }),
      });
      const aaiData = await aaiRes.json();
      resetFields.transcript_id = aaiData.id;
    }

    // Update the record
    await fetch(
      `${SUPABASE_URL}/rest/v1/repod_jobs?id=eq.${record.id}`,
      {
        method: 'PATCH',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resetFields),
      }
    );

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
