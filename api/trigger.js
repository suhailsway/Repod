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
      // Step 1: Transcribe with Deepgram
      let transcript = '';
      try {
        const dgRes = await fetch('https://api.deepgram.com/v1/listen?punctuate=true&paragraphs=true&utterances=false', {
          method: 'POST',
          headers: {
            'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: audio_url }),
        });
        const dgData = await dgRes.json();
        transcript = dgData?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
      } catch (dgErr) {
        return res.status(500).json({ error: 'Deepgram failed: ' + dgErr.message });
      }

      // Step 2: Generate content with Claude
      let content = {};
      try {
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
            messages: [{
              role: 'user',
              content: `You are a professional podcast content repurposer. Match the creator tone exactly. TRANSCRIPT: ${transcript} Return ONLY a JSON object with 4 keys: linkedin, twitter, newsletter, shownotes. No preamble, no markdown fences.`
            }]
          }),
        });
        const claudeData = await claudeRes.json();
        if (!claudeData.content || !claudeData.content[0]) {
          return res.status(500).json({ error: 'Claude returned no content', claudeData });
        }
        const raw = claudeData.content[0].text.replace(/```json|```/g, '').trim();
        content = JSON.parse(raw);
      } catch (claudeErr) {
        return res.status(500).json({ error: 'Claude failed: ' + claudeErr.message });
      }

      // Step 3: Save to Airtable
      try {
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
      } catch (atErr) {
        return res.status(500).json({ error: 'Airtable failed: ' + atErr.message });
      }
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