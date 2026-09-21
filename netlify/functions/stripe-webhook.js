const Stripe = require('stripe');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

exports.handler = async (event) => {
  const sig = event.headers['stripe-signature'];
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature invalid:', err.message);
    return { statusCode: 400, body: 'Webhook signature invalide' };
  }

  if (stripeEvent.type !== 'checkout.session.completed') {
    return { statusCode: 200, body: 'Événement ignoré' };
  }

  const session = stripeEvent.data.object;
  const email = session.customer_details?.email || '(email non fourni)';
  const name = session.customer_details?.name || '(nom non fourni)';
  const amount = session.amount_total / 100;
  const currency = (session.currency || 'eur').toUpperCase();
  const tier = session.metadata?.tier || 'standard';

  await sendGA4Purchase({ sessionId: session.id, amount, currency });

  console.log(
    `[purchase] ${email} · ${name} · ${tier} · ${amount}${currency} · session ${session.id}`
  );

  return { statusCode: 200, body: 'OK' };
};

async function sendGA4Purchase({ sessionId, amount, currency }) {
  const measurementId = process.env.GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;
  if (!measurementId || !apiSecret) {
    console.warn('GA4 credentials missing, skipping event.');
    return;
  }
  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`;
  const body = {
    client_id: sessionId,
    events: [
      {
        name: 'purchase',
        params: {
          transaction_id: sessionId,
          currency,
          value: amount,
        },
      },
    ],
  };
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      const text = await resp.text();
      console.error('GA4 send failed:', resp.status, text);
    }
  } catch (err) {
    console.error('GA4 send exception:', err.message);
  }
}
