import { renderStillOnLambda } from '@remotion/lambda/client';

const FUNCTION_NAME = 'remotion-render-4-0-454-mem2048mb-disk2048mb-120sec';
const SERVE_URL = 'https://remotionlambda-useast1-w1jtdngfga.s3.us-east-1.amazonaws.com/sites/repod-cards/index.html';
const REGION = 'us-east-1';

export default async function handler(req, res) {
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

  try {
    process.env.AWS_ACCESS_KEY_ID = process.env.REMOTION_AWS_ACCESS_KEY_ID;
    process.env.AWS_SECRET_ACCESS_KEY = process.env.REMOTION_AWS_SECRET_ACCESS_KEY;
    process.env.AWS_REGION = REGION;

    const [quoteRender, episodeRender, insightRender] = await Promise.all([
      renderStillOnLambda({
        region: REGION, functionName: FUNCTION_NAME, serveUrl: SERVE_URL,
        composition: 'QuoteCard',
        inputProps: { quote: bestQuote, highlightWord: midWord, podcastName, episode: 'KEY QUOTE' },
        imageFormat: 'png', privacy: 'public',
      }),
      renderStillOnLambda({
        region: REGION, functionName: FUNCTION_NAME, serveUrl: SERVE_URL,
        composition: 'EpisodeCard',
        inputProps: { episodeTitle: bestQuote, episodeNumber: '', podcastName, guestName: '', description: '' },
        imageFormat: 'png', privacy: 'public',
      }),
      renderStillOnLambda({
        region: REGION, functionName: FUNCTION_NAME, serveUrl: SERVE_URL,
        composition: 'KeyInsightCard',
        inputProps: { stat: keyStat, context, podcastName, accentColor: '#E8FF47' },
        imageFormat: 'png', privacy: 'public',
      }),
    ]);

    res.status(200).json({
      quoteCard: quoteRender.url,
      episodeCard: episodeRender.url,
      insightCard: insightRender.url,
    });
  } catch (e) {
    console.error('Card generation error:', e.message);
    res.status(500).json({ error: e.message });
  }
}
