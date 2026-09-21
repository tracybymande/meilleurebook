const Stripe = require('stripe');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const PRODUCT_SLUG = 'lentre-saison-workbook';
const SITE = process.env.URL || 'https://meilleurebook.com';

// MVP : on livre temporairement le mini-diagnostic à la place du workbook.
// Quand le workbook final sera prêt et uploadé, remplacer par le vrai fichier.
const PLACEHOLDER_PDF_URL = `${SITE}/assets/downloads/dans-quelle-saison-est-ton-business.pdf`;

exports.handler = async (event) => {
  const sessionId = event.queryStringParameters?.session_id;

  if (!sessionId) {
    return { statusCode: 400, body: 'Paramètre session_id manquant.' };
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return { statusCode: 402, body: 'Paiement non validé.' };
    }
    if (session.metadata?.product_slug !== PRODUCT_SLUG) {
      return { statusCode: 404, body: 'Produit inconnu.' };
    }

    return {
      statusCode: 302,
      headers: { Location: PLACEHOLDER_PDF_URL },
      body: '',
    };
  } catch (err) {
    console.error('Download failed:', err.message);
    return {
      statusCode: 500,
      body: 'Erreur téléchargement. Contacte support@meilleurebook.com.',
    };
  }
};
