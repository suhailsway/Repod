export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { audio_url, video_path, mode = 'audio', session_id } = req.body;
    const sessionId = session_id || Date.now().toString();
    const sourceUrl = video_path || audio_url;

    if (mode === 'audio') {
      const dgRes = await fetch('https://api.deepgram.com/v1/listen?punctuate=true&paragraphs=true', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: audio_url }),
      });
      const dgData = await dgRes.json();
      const transcript = dgData?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';

      const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 2000,
          system: 'You are a JSON generator. You only output raw valid JSON. No explanations, no markdown, no backticks, no preamble. Just a JSON object.',
          messages: [{
            role: 'user',
            content: `Generate content from this podcast transcript. Return ONLY a raw JSON object with exactly these 4 keys: "linkedin" (150-300 word post), "twitter" (numbered thread 1/ 2/ etc), "newsletter" (300-500 words), "shownotes" (summary + bullet takeaways). TRANSCRIPT: ${transcript}`,
          }],
        }),
      });
      const claudeData = await claudeRes.json();
      const raw = claudeData.content?.[0]?.text || '{}';
      const content = JSON.parse(raw);

      await fetch('https://api.airtable.com/v0/appHPv16UPdsghkQt/tblaDHnsqtL3PWZk1', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.AIRTABLE_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            session_id: sessionId,
            linkedin: content.linkedin || '',
            twitter: content.twitter || '',
            newsletter: content.newsletter || '',
            shownotes: content.shownotes || '',
          }
        }),
      });
    }

    if (mode === 'video') {
      const supoclipRes = await fetch('http://159.203.99.184:8000/tasks/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'user_id': 'lW7aCYzHDCJtp3pJ5TqSD0xXsa8zXjSd' },
        body: JSON.stringify({ source: { url: sourceUrl, type: "youtube" } }),
      });
      const supoclipData = await supoclipRes.json();
      const taskId = supoclipData.task_id;

      await fetch('https://api.airtable.com/v0/appHPv16UPdsghkQt/tblaDHnsqtL3PWZk1', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.AIRTABLE_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields: { session_id: sessionId, task_id: taskId } }),
      });
    }

    return res.status(200).json({ success: true, sessionId });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
