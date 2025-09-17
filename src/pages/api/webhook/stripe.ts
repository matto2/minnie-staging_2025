import type { APIRoute } from 'astro';
import { stripe, WEBHOOK_SECRET } from '../../../lib/stripe';
import { addPurchase } from '../../../lib/purchases';
import { generateDownloadToken, getProductFileName } from '../../../lib/downloads';

export const POST: APIRoute = async ({ request }) => {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return new Response('Missing signature', { status: 400 });
  }

  try {
    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);

    // Handle the checkout session completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      // Retrieve line items to get product details
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        expand: ['data.price.product']
      });

      for (const item of lineItems.data) {
        const price = item.price;
        const product = price?.product;
        
        if (price && product && typeof product === 'object') {
          const fileName = getProductFileName(price.id, product.name);
          
          if (fileName) {
            // Create purchase record
            const purchase = {
              id: crypto.randomUUID(),
              sessionId: session.id,
              customerEmail: session.customer_details?.email || '',
              productId: price.id,
              productName: product.name,
              amount: price.unit_amount || 0,
              currency: price.currency,
              purchaseDate: new Date().toISOString(),
              downloadToken: generateDownloadToken(),
              downloadCount: 0,
              maxDownloads: 5, // Allow 5 downloads
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
            };

            await addPurchase(purchase);
            console.log(`Purchase recorded for ${purchase.customerEmail}: ${purchase.productName}`);
          }
        }
      }
    }

    return new Response('Success', { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Webhook error', { status: 400 });
  }
};