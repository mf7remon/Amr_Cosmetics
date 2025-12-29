export type Product = {
  id: string;
  title: string;
  slug: string;
  price: number;
  imageUrl?: string;
  description?: string;
  category?: string;
  createdAt: number;
};

export const PRODUCTS_KEY = "amr_products";

export function safeReadProducts(): Product[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PRODUCTS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Product[]) : [];
  } catch {
    return [];
  }
}

export function safeWriteProducts(items: Product[]): void {
  try {
    window.localStorage.setItem(PRODUCTS_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
