import fs from 'fs/promises';
import path from 'path';

export interface Purchase {
  id: string;
  sessionId: string;
  customerEmail: string;
  productId: string;
  productName: string;
  amount: number;
  currency: string;
  purchaseDate: string;
  downloadToken: string;
  downloadCount: number;
  maxDownloads: number;
  expiresAt: string;
}

const PURCHASES_FILE = path.join(process.cwd(), 'src/data/purchases.json');

export async function loadPurchases(): Promise<Purchase[]> {
  try {
    const data = await fs.readFile(PURCHASES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

export async function savePurchases(purchases: Purchase[]): Promise<void> {
  await fs.writeFile(PURCHASES_FILE, JSON.stringify(purchases, null, 2));
}

export async function addPurchase(purchase: Purchase): Promise<void> {
  const purchases = await loadPurchases();
  purchases.push(purchase);
  await savePurchases(purchases);
}

export async function findPurchaseByToken(token: string): Promise<Purchase | null> {
  const purchases = await loadPurchases();
  return purchases.find(p => p.downloadToken === token) || null;
}

export async function updatePurchase(token: string, updates: Partial<Purchase>): Promise<boolean> {
  const purchases = await loadPurchases();
  const index = purchases.findIndex(p => p.downloadToken === token);
  
  if (index === -1) return false;
  
  purchases[index] = { ...purchases[index], ...updates };
  await savePurchases(purchases);
  return true;
}