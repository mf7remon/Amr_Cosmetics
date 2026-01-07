// app/lib/blogsStore.ts
import { slugify } from "@/app/lib/productsStore";

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string; // url or /path
  category: string;
  dateISO: string; // YYYY-MM-DD
  readTime: string; // e.g. "5 min read"
  content: string; // full content (paragraphs separated by blank line)
  createdAt: number;
  updatedAt: number;
};

export const BLOGS_KEY = "amr_blogs";

const DEFAULT_BLOGS: BlogPost[] = [
  {
    id: "blog-1",
    title: "How to Build a Simple Skincare Routine",
    slug: "how-to-build-a-simple-skincare-routine",
    excerpt:
      "A clean routine does not need 10 steps, here is a simple way to get consistent results without wasting time.",
    coverImage: "/logo.png",
    category: "Beauty care",
    dateISO: "2026-01-07",
    readTime: "5 min read",
    content: [
      "A good skincare routine is about consistency, not complexity. If you are new to skincare, start small and build slowly.",
      "Step 1: Cleanser. Use a gentle cleanser that does not strip your skin. Cleanser removes dirt, oil, and leftover product.",
      "Step 2: Moisturizer. Moisturizer helps your skin barrier stay strong. Choose a lightweight moisturizer for oily skin and a richer one for dry skin.",
      "Step 3: Sunscreen (morning only). Sunscreen is the most important anti aging product. Use it every day even when it is cloudy.",
      "Optional step: Treatment. If you have acne or dark spots, you can add a treatment like niacinamide or salicylic acid. Add one at a time and give it 2 to 3 weeks.",
      "Quick tip: If your skin feels irritated, stop adding new products. Go back to cleanser, moisturizer, and sunscreen until your skin feels normal again.",
    ].join("\n\n"),
    createdAt: 1736200000000,
    updatedAt: 1736200000000,
  },
  {
    id: "blog-2",
    title: "5 Makeup Tips for a Soft Natural Look",
    slug: "5-makeup-tips-for-a-soft-natural-look",
    excerpt:
      "Want a polished look that still feels natural? These simple steps make your makeup look clean and modern.",
    coverImage: "/logo.png",
    category: "Beauty care",
    dateISO: "2026-01-06",
    readTime: "6 min read",
    content: [
      "A soft natural look is all about skin, light coverage, and clean edges. You do not need heavy layers.",
      "Tip 1: Prep your skin. A light moisturizer and a small amount of primer makes makeup sit better.",
      "Tip 2: Use a light base. Use a tinted moisturizer or a thin layer of foundation. Spot conceal only where needed.",
      "Tip 3: Cream products look more natural. Cream blush and cream highlighter blend into the skin and do not look powdery.",
      "Tip 4: Keep brows soft. Brush brows upward and fill gaps lightly. Avoid very sharp brows for this style.",
      "Tip 5: One focus only. If you do a bold lip, keep eyes simple. If you do defined eyes, keep lips soft.",
    ].join("\n\n"),
    createdAt: 1736110000000,
    updatedAt: 1736110000000,
  },
  {
    id: "blog-3",
    title: "How to Choose the Right Gift in 5 Minutes",
    slug: "how-to-choose-the-right-gift-in-5-minutes",
    excerpt:
      "Candles, perfumes, and small lifestyle picks can feel premium when you choose the right vibe, here is a fast method.",
    coverImage: "/logo.png",
    category: "Gift",
    dateISO: "2026-01-05",
    readTime: "4 min read",
    content: [
      "Gift shopping is easier when you pick based on personality, not price. The goal is to match the vibe of the person.",
      "Step 1: Choose the category. For a safe premium feel, go with a candle, perfume, body mist, or a small beauty set.",
      "Step 2: Match the scent style. Fresh for simple people, sweet for fun people, woody for mature people.",
      "Step 3: Add one small extra. A small charm, mini lip balm, or a travel size item makes it feel thoughtful.",
      "Step 4: Keep packaging clean. Simple wrapping always looks premium. Avoid too many colors.",
      "If you are unsure, choose a neutral option with a clean scent and minimal design. It works for most people.",
    ].join("\n\n"),
    createdAt: 1736020000000,
    updatedAt: 1736020000000,
  },
];

function safeParseArray(raw: string | null): unknown[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizePost(x: unknown): BlogPost | null {
  if (!x || typeof x !== "object") return null;
  const o = x as Record<string, unknown>;

  const id = typeof o.id === "string" ? o.id : "";
  const title = typeof o.title === "string" ? o.title : "";
  const slug = typeof o.slug === "string" ? o.slug : "";
  const excerpt = typeof o.excerpt === "string" ? o.excerpt : "";
  const coverImage = typeof o.coverImage === "string" ? o.coverImage : "/logo.png";
  const category = typeof o.category === "string" ? o.category : "Blog";
  const dateISO = typeof o.dateISO === "string" ? o.dateISO : new Date().toISOString().slice(0, 10);
  const readTime = typeof o.readTime === "string" ? o.readTime : "3 min read";
  const content = typeof o.content === "string" ? o.content : "";
  const createdAt = typeof o.createdAt === "number" ? o.createdAt : Date.now();
  const updatedAt = typeof o.updatedAt === "number" ? o.updatedAt : createdAt;

  if (!id || !title || !slug) return null;

  return {
    id,
    title,
    slug,
    excerpt,
    coverImage,
    category,
    dateISO,
    readTime,
    content,
    createdAt,
    updatedAt,
  };
}

export function estimateReadTime(text: string): string {
  const words = String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean).length;

  const mins = Math.max(2, Math.round(words / 180));
  return `${mins} min read`;
}

export function splitParagraphs(content: string): string[] {
  return String(content || "")
    .split(/\n\s*\n/g)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function safeReadBlogs(): BlogPost[] {
  if (typeof window === "undefined") return DEFAULT_BLOGS;

  try {
    const raw = window.localStorage.getItem(BLOGS_KEY);
    const arr = safeParseArray(raw);
    const normalized = arr.map(normalizePost).filter((p): p is BlogPost => p !== null);

    if (normalized.length > 0) {
      return normalized.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    }

    // Seed once if empty
    window.localStorage.setItem(BLOGS_KEY, JSON.stringify(DEFAULT_BLOGS));
    return [...DEFAULT_BLOGS].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  } catch {
    return [...DEFAULT_BLOGS].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  }
}

export function safeWriteBlogs(items: BlogPost[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BLOGS_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("amr-blogs-updated"));
  } catch {
    // ignore
  }
}

export function createBlogSlug(title: string): string {
  const base = slugify(title);
  return base || `blog-${Date.now()}`;
}

export function ensureUniqueSlug(items: BlogPost[], desiredSlug: string, editingId?: string | null): string {
  const clean = desiredSlug.trim().toLowerCase();
  const exists = (s: string) =>
    items.some((b) => b.slug.toLowerCase() === s.toLowerCase() && b.id !== (editingId ?? ""));

  if (!exists(clean)) return clean;

  let i = 2;
  while (exists(`${clean}-${i}`)) i += 1;
  return `${clean}-${i}`;
}

export function getBlogBySlug(items: BlogPost[], slug: string): BlogPost | null {
  const clean = String(slug || "").trim().toLowerCase();
  return items.find((b) => b.slug.toLowerCase() === clean) ?? null;
}
