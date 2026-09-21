const Stripe = require('stripe');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const PRODUCT_SLUG = 'lentre-saison-workbook';
const EARLYBIRD_LIMIT = 20;
const SITE = process.env.URL || 'https://meilleurebook.com';

exports.handler = async () => {
  try {
    const sessions = await stripe.checkout.sessions.list({ limit: 100 });
    const paidCount = sessions.data.filter(
      (s) => s.metadata?.product_slug === PRODUCT_SLUG && s.payment_status === 'paid'
    ).length;

    const isEarlyBird = paidCount < EARLYBIRD_LIMIT;
    const priceId = isEarlyBird
      ? process.env.STRIPE_PRICE_LENTRE_SAISON_EARLYBIRD
      : process.env.STRIPE_PRICE_LENTRE_SAISON_STANDARD;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'link'],
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        product_slug: PRODUCT_SLUG,
        tier: isEarlyBird ? 'early_bird' : 'standard',
      },
      success_url: `${SITE}/merci-achat.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE}/#ebooks`,
      locale: 'fr',
      billing_address_collection: 'auto',
      customer_creation: 'always',
      consent_collection: {
        terms_of_service: 'required',
      },
      custom_text: {
        terms_of_service_acceptance: {
          message:
            "J'ai lu et j'accepte les [Conditions Générales de Vente](https://meilleurebook.com/cgv.html). Je demande expressément que l'exécution du contrat commence immédiatement, et je renonce à mon droit de rétractation dès le début du téléchargement du workbook.",
        },
      },
    });

    return {
      statusCode: 302,
      headers: { Location: session.url },
      body: '',
    };
  } catch (err) {
    console.error('Checkout creation failed:', err.message);
    return {
      statusCode: 500,
      body: 'Erreur lors de la création du paiement. Réessaie ou contacte support@meilleurebook.com.',
    };
  }
};
