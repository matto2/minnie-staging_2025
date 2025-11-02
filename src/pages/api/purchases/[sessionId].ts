import type { APIRoute } from 'astro';
import { loadPurchases } from '../../../lib/purchases';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const { sessionId } = params;

  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'Session ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const purchases = await loadPurchases();
    const purchase = purchases.find(p => p.sessionId === sessionId);

    if (!purchase) {
      return new Response(JSON.stringify({ found: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if purchase is expired
    const isExpired = new Date(purchase.expiresAt) < new Date();

    // Check if downloads are exhausted
    const downloadsExhausted = purchase.downloadCount >= purchase.maxDownloads;

    return new Response(JSON.stringify({
      found: true,
      downloadToken: purchase.downloadToken,
      productName: purchase.productName,
      expiresAt: purchase.expiresAt,
      downloadCount: purchase.downloadCount,
      maxDownloads: purchase.maxDownloads,
      isExpired,
      downloadsExhausted
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Error loading purchase:', err.message);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
