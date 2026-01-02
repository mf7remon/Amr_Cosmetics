export type OrderStatus = "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export type OrderItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
};

export type Order = {
  id: string;
  userEmail: string | null;
  customerName: string;
  phone: string;
  address: string;
  city: string;

  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;

  status: OrderStatus;
  createdAt: number;
};

export const ORDERS_KEY = "amr_orders";

export function safeReadOrders(): Order[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ORDERS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Order[]) : [];
  } catch {
    return [];
  }
}

export function safeWriteOrders(items: Order[]): void {
  try {
    window.localStorage.setItem(ORDERS_KEY, JSON.stringify(items));
  } catch {}
}
