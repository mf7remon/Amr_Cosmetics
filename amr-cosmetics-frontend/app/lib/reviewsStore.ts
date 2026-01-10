// app/lib/reviewsStore.ts
export type Review = {
  id: string;
  productId: string;
  userEmail: string;
  userName: string;
  content: string;
  createdAt: number;
};

export const REVIEWS_KEY = "amr_reviews_v1";

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function normalizeEmail(email: string) {
  return String(email || "").trim().toLowerCase();
}

function makeId() {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `id-${Math.random().toString(16).slice(2)}-${Date.now()}`;
  return `rev-${rand}`;
}

function normalizeReview(x: unknown): Review | null {
  if (!x || typeof x !== "object") return null;
  const o = x as Record<string, unknown>;

  const id = typeof o.id === "string" ? o.id : "";
  const productId = typeof o.productId === "string" ? o.productId : "";
  const userEmail = typeof o.userEmail === "string" ? normalizeEmail(o.userEmail) : "";
  const userName = typeof o.userName === "string" ? o.userName : "User";
  const content = typeof o.content === "string" ? o.content : "";
  const createdAt = typeof o.createdAt === "number" ? o.createdAt : Number(o.createdAt);

  if (!id || !productId || !userEmail || !content || !Number.isFinite(createdAt)) return null;

  return { id, productId, userEmail, userName, content, createdAt };
}

export function safeReadReviews(): Review[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(REVIEWS_KEY);
  const arr = safeJsonParse<unknown>(raw, []);
  if (!Array.isArray(arr)) return [];

  return arr
    .map(normalizeReview)
    .filter((x): x is Review => x !== null)
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
}

export function safeWriteReviews(items: Review[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(REVIEWS_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("amr-reviews-updated"));
  } catch {
    // ignore
  }
}

export function getReviewsByProduct(productId: string): Review[] {
  const pid = String(productId || "").trim();
  if (!pid) return [];
  return safeReadReviews().filter((r) => r.productId === pid);
}

export function addReviewToStorage(args: {
  productId: string;
  userEmail: string;
  userName: string;
  content: string;
}): { ok: boolean; message: string } {
  const productId = String(args.productId || "").trim();
  const userEmail = normalizeEmail(args.userEmail || "");
  const userName = String(args.userName || "User").trim() || "User";
  const content = String(args.content || "").trim();

  if (!productId) return { ok: false, message: "Missing product." };
  if (!userEmail) return { ok: false, message: "Missing user." };
  if (!content) return { ok: false, message: "Write something first." };

  const all = safeReadReviews();
  const next: Review = {
    id: makeId(),
    productId,
    userEmail,
    userName,
    content,
    createdAt: Date.now(),
  };

  safeWriteReviews([next, ...all]);
  return { ok: true, message: "Review added." };
}

export function deleteReviewFromStorage(args: {
  reviewId: string;
  requesterEmail: string;
  isAdmin: boolean;
}): { ok: boolean; message: string } {
  const reviewId = String(args.reviewId || "").trim();
  const requesterEmail = normalizeEmail(args.requesterEmail || "");
  const isAdmin = !!args.isAdmin;

  if (!reviewId) return { ok: false, message: "Missing review id." };
  if (!requesterEmail && !isAdmin) return { ok: false, message: "Not allowed." };

  const all = safeReadReviews();
  const target = all.find((r) => r.id === reviewId);
  if (!target) return { ok: false, message: "Review not found." };

  const canDelete = isAdmin || normalizeEmail(target.userEmail) === requesterEmail;
  if (!canDelete) return { ok: false, message: "You can only delete your own review." };

  const next = all.filter((r) => r.id !== reviewId);
  safeWriteReviews(next);
  return { ok: true, message: "Review deleted." };
}
