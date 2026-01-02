export const CATEGORIES_KEY = "amr_categories";

export const DEFAULT_CATEGORIES = [
  "Clothing",
  "Bags",
  "Jewellery",
  "Beauty care",
  "Footwear",
  "Gift",
  "Tech Accessories",
];

export function safeReadCategories(): string[] {
  if (typeof window === "undefined") return DEFAULT_CATEGORIES;

  try {
    const raw = window.localStorage.getItem(CATEGORIES_KEY);
    if (!raw) return DEFAULT_CATEGORIES;

    const parsed: unknown = JSON.parse(raw);
    const extras = Array.isArray(parsed)
      ? parsed.filter((x) => typeof x === "string").map((s) => s.trim()).filter(Boolean)
      : [];

    const merged = Array.from(new Set([...DEFAULT_CATEGORIES, ...extras]));
    return merged;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export function safeWriteCategories(categories: string[]): void {
  if (typeof window === "undefined") return;

  try {
    const cleaned = categories
      .filter((x) => typeof x === "string")
      .map((x) => x.trim())
      .filter(Boolean);

    const unique = Array.from(new Set(cleaned));
    window.localStorage.setItem(CATEGORIES_KEY, JSON.stringify(unique));
    window.dispatchEvent(new Event("amr-categories-updated"));
  } catch {
    // ignore
  }
}
