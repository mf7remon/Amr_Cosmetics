export type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type OrderItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
};

export type OrderCoupon = {
  code: string;
  type: "PERCENT";
  value: number;
} | null;

export type Order = {
  id: string;

  customerName: string;
  customerEmail: string; // user email or "guest"
  phone: string;
  address: string;
  city: string;

  paymentMethod: string;

  items: OrderItem[];

  subtotal: number;
  discountAmount: number;
  total: number;

  coupon: OrderCoupon;

  status: OrderStatus;
  createdAt: number;
  updatedAt: number;
};

const ORDERS_PREFIX = "amr_orders_v1";

function makeAllOrdersKey() {
  return `${ORDERS_PREFIX}:all`;
}

function makeUserOrdersKey(email?: string | null) {
  const clean = (email ?? "").trim().toLowerCase();
  return clean ? `${ORDERS_PREFIX}:user:${clean}` : `${ORDERS_PREFIX}:user:guest`;
}

function safeParseOrders(raw: string | null): Order[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return (parsed as unknown[])
      .map((o) => {
        if (!o || typeof o !== "object") return null;
        const obj = o as Record<string, unknown>;

        const id = typeof obj.id === "string" ? obj.id : "";
        const customerName = typeof obj.customerName === "string" ? obj.customerName : "";
        const customerEmail = typeof obj.customerEmail === "string" ? obj.customerEmail : "guest";
        const phone = typeof obj.phone === "string" ? obj.phone : "";
        const address = typeof obj.address === "string" ? obj.address : "";
        const city = typeof obj.city === "string" ? obj.city : "";
        const paymentMethod = typeof obj.paymentMethod === "string" ? obj.paymentMethod : "SSLCommerz";

        const status = ((): OrderStatus => {
          const s = typeof obj.status === "string" ? obj.status : "PENDING";
          if (
            s === "PENDING" ||
            s === "PROCESSING" ||
            s === "SHIPPED" ||
            s === "DELIVERED" ||
            s === "CANCELLED"
          )
            return s;
          return "PENDING";
        })();

        const createdAt = typeof obj.createdAt === "number" ? obj.createdAt : 0;
        const updatedAt = typeof obj.updatedAt === "number" ? obj.updatedAt : createdAt;

        const subtotal = typeof obj.subtotal === "number" ? obj.subtotal : Number(obj.subtotal);
        const discountAmount =
          typeof obj.discountAmount === "number" ? obj.discountAmount : Number(obj.discountAmount);
        const total = typeof obj.total === "number" ? obj.total : Number(obj.total);

        const itemsRaw = obj.items;
        const items: OrderItem[] = Array.isArray(itemsRaw)
          ? itemsRaw
              .map((it: unknown) => {
                if (!it || typeof it !== "object") return null;
                const t = it as Record<string, unknown>;
                const iid = typeof t.id === "string" ? t.id : "";
                const name = typeof t.name === "string" ? t.name : "";
                const price = typeof t.price === "number" ? t.price : Number(t.price);
                const qty = typeof t.qty === "number" ? t.qty : Number(t.qty);
                if (!iid || !name || !Number.isFinite(price) || !Number.isFinite(qty)) return null;
                return { id: iid, name, price, qty };
              })
              .filter((x): x is OrderItem => x !== null)
          : [];

        const couponObj = obj.coupon as any;
        let coupon: OrderCoupon = null;
        if (couponObj && typeof couponObj === "object") {
          const code = typeof couponObj.code === "string" ? couponObj.code : "";
          const type = couponObj.type === "PERCENT" ? "PERCENT" : null;
          const value =
            typeof couponObj.value === "number" ? couponObj.value : Number(couponObj.value);
          if (code && type && Number.isFinite(value)) {
            coupon = { code, type, value };
          }
        }

        if (!id || !customerName || items.length === 0 || !Number.isFinite(total)) return null;

        return {
          id,
          customerName,
          customerEmail,
          phone,
          address,
          city,
          paymentMethod,
          items,
          subtotal: Number.isFinite(subtotal) ? subtotal : 0,
          discountAmount: Number.isFinite(discountAmount) ? discountAmount : 0,
          total,
          coupon,
          status,
          createdAt,
          updatedAt,
        } satisfies Order;
      })
      .filter((x): x is Order => x !== null);
  } catch {
    return [];
  }
}

function safeRead(key: string): Order[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    return safeParseOrders(raw);
  } catch {
    return [];
  }
}

function safeWrite(key: string, orders: Order[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(orders));
  } catch {
    // ignore
  }
}

export function safeReadAllOrders(): Order[] {
  return safeRead(makeAllOrdersKey());
}

export function safeReadUserOrders(email?: string | null): Order[] {
  return safeRead(makeUserOrdersKey(email));
}

export function addOrderToStorage(order: Order) {
  const allKey = makeAllOrdersKey();
  const userKey = makeUserOrdersKey(order.customerEmail === "guest" ? null : order.customerEmail);

  const all = safeRead(allKey);
  const user = safeRead(userKey);

  const nextAll = [order, ...all];
  const nextUser = [order, ...user];

  safeWrite(allKey, nextAll);
  safeWrite(userKey, nextUser);

  try {
    window.dispatchEvent(new Event("amr-orders-updated"));
  } catch {}
}

export function updateOrderStatusInStorage(orderId: string, status: OrderStatus) {
  const allKey = makeAllOrdersKey();
  const all = safeRead(allKey);

  const target = all.find((o) => o.id === orderId);
  if (!target) return;

  const updatedOrder: Order = { ...target, status, updatedAt: Date.now() };

  const nextAll = all.map((o) => (o.id === orderId ? updatedOrder : o));
  safeWrite(allKey, nextAll);

  // also update user's list
  const userKey =
    updatedOrder.customerEmail === "guest"
      ? makeUserOrdersKey(null)
      : makeUserOrdersKey(updatedOrder.customerEmail);

  const userList = safeRead(userKey);
  const nextUser = userList.map((o) => (o.id === orderId ? updatedOrder : o));
  safeWrite(userKey, nextUser);

  try {
    window.dispatchEvent(new Event("amr-orders-updated"));
  } catch {}
}

export function makeOrderId(): string {
  const d = new Date();
  const yyyy = String(d.getFullYear());
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");

  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8).toUpperCase()
      : String(Math.random()).slice(2, 10).toUpperCase();

  return `AMR-${yyyy}${mm}${dd}-${rand}`;
}
