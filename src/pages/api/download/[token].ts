import type { APIRoute } from 'astro';
import { findPurchaseByToken, updatePurchase } from '../../../lib/purchases';
import { getProductFileName } from '../../../lib/downloads';
import fs from 'fs';
import path from 'path';

export const GET: APIRoute = async ({ params }) => {
  const { token } = params;

  if (!token) {
    return new Response('Download token required', { status: 400 });
  }

  try {
    const purchase = await findPurchaseByToken(token);

    if (!purchase) {
      return new Response('Invalid download link', { status: 404 });
    }

    // Check if expired
    const isExpired = new Date(purchase.expiresAt) < new Date();
    if (isExpired) {
      return new Response('Download link has expired (valid for 7 days)', { status: 410 });
    }

    // Check if downloads exhausted
    if (purchase.downloadCount >= purchase.maxDownloads) {
      return new Response('Download limit reached (maximum 5 downloads)', { status: 403 });
    }

    // Get the file name for this product
    let fileName = getProductFileName(purchase.productId, purchase.productName);

    if (!fileName) {
      console.error(`No file mapping for product: ${purchase.productName}`);
      return new Response('Product file not found', { status: 404 });
    }

    // Handle complete songbook special case
    if (fileName === 'complete-songbook.pdf') {
      fileName = 'come-along-songs-all.pdf';
    }

    // Construct file path
    const filePath = path.join(process.cwd(), 'public', 'pdfs', fileName);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return new Response('PDF file not found', { status: 404 });
    }

    // Increment download count
    await updatePurchase(purchase.id, {
      downloadCount: purchase.downloadCount + 1
    });

    // Read the file
    const fileBuffer = fs.readFileSync(filePath);

    // Return the PDF with appropriate headers
    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'private, no-cache, no-store, must-revalidate'
      }
    });
  } catch (err: any) {
    console.error('Error processing download:', err.message);
    return new Response('Internal server error', { status: 500 });
  }
};
