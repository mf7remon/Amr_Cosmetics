export type Product = {
  id: string;
  title: string;
  slug: string;
  price: number;
  imageUrl?: string;
  description?: string;
  category?: string;

  // ✅ NEW: stock quantity (0 => out of stock)
  stock?: number;

  createdAt: number;
};

export const PRODUCTS_KEY = "amr_products";

function normalizeProduct(x: unknown): Product | null {
  if (!x || typeof x !== "object") return null;
  const o = x as Record<string, unknown>;

  const id = typeof o.id === "string" ? o.id : "";
  const title = typeof o.title === "string" ? o.title : "";
  const slug = typeof o.slug === "string" ? o.slug : "";
  const price = typeof o.price === "number" ? o.price : Number(o.price);

  const imageUrl = typeof o.imageUrl === "string" ? o.imageUrl : undefined;
  const description = typeof o.description === "string" ? o.description : undefined;
  const category = typeof o.category === "string" ? o.category : undefined;

  const createdAt = typeof o.createdAt === "number" ? o.createdAt : Number(o.createdAt);

  // ✅ stock: if missing -> default (keeps old products working)
  const stockRaw = o.stock;
  const stockNum =
    typeof stockRaw === "number" ? stockRaw : typeof stockRaw === "string" ? Number(stockRaw) : 999;

  const stock = Number.isFinite(stockNum) ? Math.max(0, Math.floor(stockNum)) : 999;

  if (!id || !title || !slug || !Number.isFinite(price) || !Number.isFinite(createdAt)) return null;

  return {
    id,
    title,
    slug,
    price,
    imageUrl,
    description,
    category,
    stock,
    createdAt,
  };
}

export function safeReadProducts(): Product[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PRODUCTS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return (parsed as unknown[])
      .map(normalizeProduct)
      .filter((p): p is Product => p !== null);
  } catch {
    return [];
  }
}

export function safeWriteProducts(items: Product[]): void {
  try {
    window.localStorage.setItem(PRODUCTS_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("amr-products-updated"));
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

export function makeUniqueSlug(base: string, existingSlugs: string[]): string {
  if (!existingSlugs.includes(base)) return base;

  let i = 2;
  while (existingSlugs.includes(`${base}-${i}`)) i += 1;
  return `${base}-${i}`;
}
