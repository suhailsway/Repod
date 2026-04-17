const SUPABASE_URL = 'https://frbziezfrpdbtrkbmlzy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyYnppZXpmcnBkYnRya2JtbHp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMDM5MDUsImV4cCI6MjA5MTc3OTkwNX0.S7ViyQgVYgxdxk2EU8470DChaD46WO20X9mdDDkQ1Hk';

const PLATFORM_PROMPTS = {
  linkedin: 'Write a professional LinkedIn post (150-300 words) that would perform well on LinkedIn.',
  twitter: 'Write 5-7 tweets as a thread, each on a new line, no numbering.',
  newsletter: 'Write a newsletter section (200-400 words) in an engaging email style.',
  shownotes: 'Write show notes (300-500 words) with key takeaways and timestamps.',
  facebook: 'Write a Facebook post (100-200 words) that encourages engagement.',
  instagram: 'Write an Instagram caption (150-200 words) with line breaks and 3-5 relevant emojis.',
  hashtags: 'Generate 30 relevant hashtags as a single space-separated string starting with #.',
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { session_id, platform, instructions, transcript } = req.body;
    if (!session_id || !platform || !transcript) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const platformPrompt = PLATFORM_PROMPTS[platform] || 'Write engaging content for this platform.';
    const instructionText = instructions ? `\n\nAdditional instructions: ${instructions}` : '';

    const prompt = `Based on this podcast transcript, ${platformPrompt}${instructionText}\n\nReturn ONLY the raw content with no explanation or preamble.\n\nTRANSCRIPT: ${transcript.slice(0, 6000)}`;

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const claudeData = await claudeRes.json();
    const newContent = claudeData.content[0].text.trim();

    // Update Supabase
    await fetch(`${SUPABASE_URL}/rest/v1/repod_jobs?session_id=eq.${session_id}`, {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ [platform]: newContent }),
    });

    return res.status(200).json({ content: newContent });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
