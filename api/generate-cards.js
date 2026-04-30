async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).end(); return; }

  const linkedin = req.body.linkedin || '';
  const podcastName = req.body.podcastName || 'Your Podcast';

  const sentences = linkedin.split(/[.!?]/).filter(s => s.trim().length > 20);
  const bestQuote = (sentences[0] || 'Great insights from this episode').trim().substring(0, 120);
  const words = bestQuote.split(' ');
  const midWord = words[Math.floor(words.length / 2)] || '';
  const statMatch = linkedin.match(/[0-9]+[^.!?]*/);
  const keyStat = statMatch ? statMatch[0].trim().substring(0, 80) : bestQuote.substring(0, 60);
  const context = (sentences[1] || '').trim().substring(0, 120);

  const BASE = 'http://159.223.166.171:3002';
  const encode = (s) => encodeURIComponent(s);

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
