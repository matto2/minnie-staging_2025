import crypto from 'crypto';

export function generateDownloadToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function createSignedDownloadUrl(token: string, baseUrl: string): string {
  const secret = process.env.DOWNLOAD_SECRET || 'fallback-secret';
  const timestamp = Date.now();
  const data = `${token}:${timestamp}`;
  const signature = crypto.createHmac('sha256', secret).update(data).digest('hex');
  
  return `${baseUrl}/download/${token}?t=${timestamp}&s=${signature}`;
}

export function verifyDownloadSignature(token: string, timestamp: string, signature: string): boolean {
  const secret = process.env.DOWNLOAD_SECRET || 'fallback-secret';
  const data = `${token}:${timestamp}`;
  const expectedSignature = crypto.createHmac('sha256', secret).update(data).digest('hex');
  
  // Check if signature matches and link hasn't expired (24 hours)
  const isValidSignature = crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
  
  const isNotExpired = Date.now() - parseInt(timestamp) < 24 * 60 * 60 * 1000; // 24 hours
  
  return isValidSignature && isNotExpired;
}

// Map Stripe price IDs to file names
// TODO: Replace these with your actual Stripe price IDs from Dashboard
export const PRODUCT_FILES: Record<string, string> = {
  // Replace with your actual price IDs from Stripe Dashboard
  // Example: 'price_1ABC123def456GHI': 'caring.pdf',
};

// Fallback mapping by product name for initial setup
export function getProductFileName(priceId: string, productName?: string): string | null {
  // First try direct price ID mapping
  if (PRODUCT_FILES[priceId]) {
    return PRODUCT_FILES[priceId];
  }
  
  // Fallback: map by product name
  if (productName) {
    const nameMap: Record<string, string> = {
      'Caring': 'caring.pdf',
      'Come Along': 'come-along.pdf', 
      'I Want To Be The Best I Can Be': 'i-want-to-be-the-best-i-can-be.pdf',
      'Listening': 'listening.pdf',
      'Most Valuable Player': 'most-valuable-player.pdf',
      'Put Down Blues': 'put-down-blues.pdf',
      'Shine Like a Star': 'shine-like-a-star.pdf',
      'The Nicest Person': 'the-nicest-person.pdf',
      'Treasure Chests': 'treasure-chests.pdf',
      'Complete Song Book': 'complete-songbook.pdf',
      'Complete songbook (9 songs)': 'complete-songbook.pdf',
    };
    
    return nameMap[productName] || null;
  }
  
  return null;
}