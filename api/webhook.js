import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const SUPABASE_URL = 'https://frbziezfrpdbtrkbmlzy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyYnppZXpmcnBkYnRya2JtbHp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMDM5MDUsImV4cCI6MjA5MTc3OTkwNX0.S7ViyQgVYgxdxk2EU8470DChaD46WO20X9mdDDkQ1Hk';

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'resolution=merge-duplicates',
};

async function upsertSubscriber(email, customerId, subscriptionId, status) {
  await fetch(`${SUPABASE_URL}/rest/v1/repod_subscribers`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      user_email: email,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      status,
      updated_at: new Date().toISOString(),
    }),
  });
}

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = req.headers['stripe-signature'];
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks);

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  const { type, data } = event;

  if (type === 'checkout.session.completed') {
    const session = data.object;
    const email = session.customer_details?.email;
    const customerId = session.customer;
    const subscriptionId = session.subscription;
    if (email) await upsertSubscriber(email, customerId, subscriptionId, 'active');
  }

  if (type === 'customer.subscription.deleted' || type === 'customer.subscription.paused') {
    const subscription = data.object;
    const customerId = subscription.customer;
    const customer = await stripe.customers.retrieve(customerId);
    const email = customer.email;
    if (email) await upsertSubscriber(email, customerId, subscription.id, 'cancelled');
  }

  if (type === 'customer.subscription.updated') {
    const subscription = data.object;
    const status = subscription.status === 'active' ? 'active' : 'inactive';
    const customerId = subscription.customer;
    const customer = await stripe.customers.retrieve(customerId);
    const email = customer.email;
    if (email) await upsertSubscriber(email, customerId, subscription.id, status);
  }

  return res.status(200).json({ received: true });
}
