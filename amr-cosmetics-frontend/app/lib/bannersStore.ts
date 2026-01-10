// app/lib/bannersStore.ts
export type Banner = {
  id: string;
  title: string;
  imageUrl: string; // imgbb / hostinger / cloud url
  linkUrl?: string; // optional (click করলে কোথায় যাবে)
  active: boolean;
  createdAt: number;
  updatedAt: number;
};

export const BANNERS_KEY = "amr_banners";

function safeParseArray(raw: string | null): unknown[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeBanner(x: unknown): Banner | null {
  if (!x || typeof x !== "object") return null;
  const o = x as Record<string, unknown>;

  const id = typeof o.id === "string" ? o.id : "";
  const title = typeof o.title === "string" ? o.title : "";
  const imageUrl = typeof o.imageUrl === "string" ? o.imageUrl : "";
  const linkUrl = typeof o.linkUrl === "string" ? o.linkUrl : undefined;
  const active = typeof o.active === "boolean" ? o.active : true;

  const createdAt = typeof o.createdAt === "number" ? o.createdAt : Date.now();
  const updatedAt = typeof o.updatedAt === "number" ? o.updatedAt : createdAt;

  if (!id || !imageUrl) return null;

  return {
    id,
    title: title || "Banner",
    imageUrl,
    linkUrl: linkUrl?.trim() ? linkUrl.trim() : undefined,
    active,
    createdAt,
    updatedAt,
  };
}

export function safeReadBanners(): Banner[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(BANNERS_KEY);
    const arr = safeParseArray(raw);
    const normalized = arr.map(normalizeBanner).filter((b): b is Banner => b !== null);
    return normalized.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  } catch {
    return [];
  }
}

export function safeWriteBanners(items: Banner[]): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(BANNERS_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("amr-banners-updated"));
  } catch {
    // ignore
  }
}
