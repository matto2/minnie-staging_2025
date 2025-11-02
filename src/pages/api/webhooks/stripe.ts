import type { APIRoute } from 'astro';
import { stripe, WEBHOOK_SECRET } from '../../../lib/stripe';
import { addPurchase } from '../../../lib/purchases';
import crypto from 'crypto';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return new Response(JSON.stringify({ error: 'No signature' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response(JSON.stringify({ error: `Webhook Error: ${err.message}` }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    try {
      // Retrieve the full session with line items
      const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ['line_items', 'line_items.data.price.product']
      });

      const lineItems = fullSession.line_items?.data || [];

      if (lineItems.length === 0) {
        console.error('No line items found in session');
        return new Response(JSON.stringify({ error: 'No line items' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Get the first line item (assuming one product per purchase)
      const lineItem = lineItems[0];
      const product = lineItem.price?.product;

      if (!product || typeof product === 'string') {
        console.error('Product not expanded properly');
        return new Response(JSON.stringify({ error: 'Product not found' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Generate download token
      const downloadToken = crypto.randomBytes(32).toString('hex');

      // Calculate expiry date (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Create purchase record
      await addPurchase({
        id: crypto.randomUUID(),
        sessionId: session.id,
        customerEmail: session.customer_details?.email || '',
        productId: typeof product === 'string' ? product : product.id,
        productName: typeof product === 'string' ? '' : product.name,
        amount: session.amount_total || 0,
        currency: session.currency || 'usd',
        purchaseDate: new Date().toISOString(),
        downloadToken,
        downloadCount: 0,
        maxDownloads: 5,
        expiresAt: expiresAt.toISOString()
      });

      console.log(`Purchase created for session ${session.id}, product: ${typeof product === 'string' ? '' : product.name}`);
    } catch (err: any) {
      console.error('Error processing checkout session:', err.message);
      return new Response(JSON.stringify({ error: `Processing Error: ${err.message}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
