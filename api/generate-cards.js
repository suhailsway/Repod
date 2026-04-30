const encode = (s) => encodeURIComponent(s);

async function extractBestQuote(linkedin, transcript) {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `Extract the single most shareable, punchy quote from this podcast content. It should be 10-20 words, standalone, and work as a visual quote card. Do NOT use em dashes (—). Return ONLY the quote text, nothing else.

Content: ${(linkedin || '').substring(0, 1000)}`
        }]
      })
    });
    const data = await res.json();
    return data.content[0].text.trim().replace(/^["']|["']$/g, '').replace(/—/g, ' ').replace(/–/g, ' ').replace(/\s+/g, ' ').trim();
  } catch(e) {
    const sentences = (linkedin || '').split(/[.!?]/).filter(s => s.trim().length > 30);
    return (sentences[1] || sentences[0] || 'Great insights from this episode').trim().substring(0, 120);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).end(); return; }

  const linkedin = req.body.linkedin || '';
  const podcastName = req.body.podcastName || 'Your Podcast';

  const bestQuote = await extractBestQuote(linkedin);
  const words = bestQuote.split(' ');
  const midWord = words[Math.floor(words.length / 2)] || '';

  const sentences = linkedin.split(/[.!?]/).filter(s => s.trim().length > 20);
  const statMatch = linkedin.match(/[0-9]+[^.!?]*/);
  const keyStat = statMatch ? statMatch[0].trim().substring(0, 80) : bestQuote.substring(0, 60);
  const context = (sentences[1] || '').trim().substring(0, 120);

  const BASE = 'http://159.223.166.171:3002';

  try {
    const [quoteRes, episodeRes, insightRes] = await Promise.all([
      fetch(`${BASE}/QuoteCard.png?quote=${encode(bestQuote)}&highlightWord=${encode(midWord)}&podcastName=${encode(podcastName)}&episode=KEY+QUOTE`),
      fetch(`${BASE}/EpisodeCard.png?episodeTitle=${encode(bestQuote)}&podcastName=${encode(podcastName)}&guestName=&episodeNumber=&description=`),
      fetch(`${BASE}/KeyInsightCard.png?stat=${encode(keyStat)}&context=${encode(context)}&podcastName=${encode(podcastName)}&accentColor=%23E8FF47`),
    ]);

    const toDataUrl = async (r) => {
      const buf = await r.arrayBuffer();
      const b64 = Buffer.from(buf).toString('base64');
      return 'data:image/png;base64,' + b64;
    };

    const [quoteCard, episodeCard, insightCard] = await Promise.all([
      toDataUrl(quoteRes),
      toDataUrl(episodeRes),
      toDataUrl(insightRes),
    ]);

    res.status(200).json({ quoteCard, episodeCard, insightCard });
  } catch (e) {
    console.error('Card generation error:', e.message);
    res.status(500).json({ error: e.message });
  }
}
