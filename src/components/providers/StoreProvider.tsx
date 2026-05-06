"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BOUTIQUES as SEED_BOUTIQUES,
  COLLECTIONS as SEED_COLLECTIONS,
  JOURNAL as SEED_JOURNAL,
  PRODUCTS as SEED_PRODUCTS,
  SITE_CONTENT as SEED_SITE,
  type Boutique,
  type Collection,
  type Currency,
  type JournalArticle,
  type Product,
  type SiteContent,
} from "@/lib/catalog";
import { SHIPPING_FEE_IQD, toIqd, type GovernorateCode } from "@/lib/iraq";

const KEY_PRODUCTS = "muhra-products-v1";
const KEY_COLLECTIONS = "muhra-collections-v1";
const KEY_JOURNAL = "muhra-journal-v1";
const KEY_BOUTIQUES = "muhra-boutiques-v1";
const KEY_SITE = "muhra-site-v1";
const KEY_BAG = "muhra-bag-v1";
const KEY_WISH = "muhra-wishlist-v1";
const KEY_ORDERS = "muhra-orders-v1";
const KEY_USER = "muhra-user-v1";

export type BagItem = {
  productId: string;
  qty: number;
  size?: string;
};

export type OrderStatus =
  | "pending"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "mastercard" | "zaincash" | "cod";

export interface OrderCustomer {
  name: string;
  phone: string;
  governorate: GovernorateCode;
  city: string;
  address: string;
  notes?: string;
}

export interface OrderPayment {
  method: PaymentMethod;
  /** Last 4 digits when method = mastercard */
  cardLast4?: string;
  /** Phone number used for ZainCash demo */
  zaincashPhone?: string;
}

export interface Order {
  id: string;
  createdAt: string;
  customerName: string;
  /** Full customer details captured from the checkout form (Iraq only). */
  customer?: OrderCustomer;
  items: { productId: string; name: string; qty: number; price: number; size?: string }[];
  subtotal: number;
  /** Subtotal converted to IQD using a static demo rate. */
  subtotalIqd?: number;
  /** Flat shipping fee, in IQD (demo). */
  shippingFeeIqd?: number;
  /** Order total in IQD (subtotalIqd + shippingFeeIqd). */
  totalIqd?: number;
  currency: Currency;
  status: OrderStatus;
  payment?: OrderPayment;
}

export interface PlaceOrderInput {
  customer: OrderCustomer;
  payment: OrderPayment;
}

export interface UserProfile {
  name: string;
  email?: string;
  signedInAt: string;
}

type StoreCtx = {
  // catalog
  products: Product[];
  collections: Collection[];
  journal: JournalArticle[];
  boutiques: Boutique[];
  site: SiteContent;
  setProducts: (p: Product[]) => void;
  setCollections: (c: Collection[]) => void;
  setJournal: (j: JournalArticle[]) => void;
  setBoutiques: (b: Boutique[]) => void;
  setSite: (s: SiteContent) => void;
  resetCatalog: () => void;

  // shopping
  bag: BagItem[];
  addToBag: (p: { productId: string; size?: string; qty?: number }) => void;
  removeFromBag: (productId: string, size?: string) => void;
  setBagQty: (productId: string, qty: number, size?: string) => void;
  clearBag: () => void;
  bagCount: number;

  wishlist: string[];
  toggleWish: (productId: string) => void;
  inWishlist: (productId: string) => boolean;

  orders: Order[];
  /** Legacy quick-checkout used elsewhere in the app — keeps existing flows working. */
  placeDemoOrder: () => Order | null;
  /** Real demo checkout that captures customer + payment details. */
  placeOrder: (input: PlaceOrderInput) => Order | null;
  setOrderStatus: (id: string, status: OrderStatus) => void;
  removeOrder: (id: string) => void;

  user: UserProfile | null;
  signIn: (name: string, email?: string) => void;
  signOut: () => void;
  hydrated: boolean;
};

const StoreContext = createContext<StoreCtx | null>(null);

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);

  const [products, setProductsState] = useState<Product[]>(SEED_PRODUCTS);
  const [collections, setCollectionsState] = useState<Collection[]>(SEED_COLLECTIONS);
  const [journal, setJournalState] = useState<JournalArticle[]>(SEED_JOURNAL);
  const [boutiques, setBoutiquesState] = useState<Boutique[]>(SEED_BOUTIQUES);
  const [site, setSiteState] = useState<SiteContent>(SEED_SITE);

  const [bag, setBag] = useState<BagItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);

  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    setProductsState(readJSON<Product[]>(KEY_PRODUCTS, SEED_PRODUCTS));
    setCollectionsState(readJSON<Collection[]>(KEY_COLLECTIONS, SEED_COLLECTIONS));
    setJournalState(readJSON<JournalArticle[]>(KEY_JOURNAL, SEED_JOURNAL));
    setBoutiquesState(readJSON<Boutique[]>(KEY_BOUTIQUES, SEED_BOUTIQUES));
    setSiteState(readJSON<SiteContent>(KEY_SITE, SEED_SITE));
    setBag(readJSON<BagItem[]>(KEY_BAG, []));
    setWishlist(readJSON<string[]>(KEY_WISH, []));
    setOrders(readJSON<Order[]>(KEY_ORDERS, []));
    setUser(readJSON<UserProfile | null>(KEY_USER, null));
    setHydrated(true);
  }, []);

  const setProducts = useCallback((p: Product[]) => {
    setProductsState(p);
    writeJSON(KEY_PRODUCTS, p);
  }, []);
  const setCollections = useCallback((c: Collection[]) => {
    setCollectionsState(c);
    writeJSON(KEY_COLLECTIONS, c);
  }, []);
  const setJournal = useCallback((j: JournalArticle[]) => {
    setJournalState(j);
    writeJSON(KEY_JOURNAL, j);
  }, []);
  const setBoutiques = useCallback((b: Boutique[]) => {
    setBoutiquesState(b);
    writeJSON(KEY_BOUTIQUES, b);
  }, []);
  const setSite = useCallback((s: SiteContent) => {
    setSiteState(s);
    writeJSON(KEY_SITE, s);
  }, []);

  const resetCatalog = useCallback(() => {
    setProducts(SEED_PRODUCTS);
    setCollections(SEED_COLLECTIONS);
    setJournal(SEED_JOURNAL);
    setBoutiques(SEED_BOUTIQUES);
    setSite(SEED_SITE);
  }, [setProducts, setCollections, setJournal, setBoutiques, setSite]);

  const addToBag = useCallback(
    ({ productId, size, qty = 1 }: { productId: string; size?: string; qty?: number }) => {
      setBag((curr) => {
        const idx = curr.findIndex(
          (i) => i.productId === productId && (i.size ?? "") === (size ?? ""),
        );
        let next: BagItem[];
        if (idx >= 0) {
          next = curr.slice();
          next[idx] = { ...next[idx], qty: next[idx].qty + qty };
        } else {
          next = [...curr, { productId, size, qty }];
        }
        writeJSON(KEY_BAG, next);
        return next;
      });
    },
    [],
  );

  const removeFromBag = useCallback((productId: string, size?: string) => {
    setBag((curr) => {
      const next = curr.filter(
        (i) => !(i.productId === productId && (i.size ?? "") === (size ?? "")),
      );
      writeJSON(KEY_BAG, next);
      return next;
    });
  }, []);

  const setBagQty = useCallback((productId: string, qty: number, size?: string) => {
    setBag((curr) => {
      const next = curr
        .map((i) =>
          i.productId === productId && (i.size ?? "") === (size ?? "")
            ? { ...i, qty: Math.max(1, qty) }
            : i,
        )
        .filter((i) => i.qty > 0);
      writeJSON(KEY_BAG, next);
      return next;
    });
  }, []);

  const clearBag = useCallback(() => {
    setBag([]);
    writeJSON(KEY_BAG, []);
  }, []);

  const bagCount = useMemo(() => bag.reduce((sum, i) => sum + i.qty, 0), [bag]);

  const toggleWish = useCallback((productId: string) => {
    setWishlist((curr) => {
      const next = curr.includes(productId)
        ? curr.filter((id) => id !== productId)
        : [...curr, productId];
      writeJSON(KEY_WISH, next);
      return next;
    });
  }, []);

  const inWishlist = useCallback(
    (productId: string) => wishlist.includes(productId),
    [wishlist],
  );

  const buildOrderId = () => {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let s = "";
    for (let i = 0; i < 6; i += 1) {
      s += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return `MUHRA-${s}`;
  };

  const buildOrderItems = useCallback(() => {
    const lookup = new Map(products.map((p) => [p.id, p]));
    const items = bag
      .map((b) => {
        const p = lookup.get(b.productId);
        if (!p) return null;
        return {
          productId: p.id,
          name: p.name,
          price: p.price,
          qty: b.qty,
          size: b.size,
          currency: p.currency,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
    return items;
  }, [bag, products]);

  const placeDemoOrder = useCallback((): Order | null => {
    if (bag.length === 0) return null;
    const items = buildOrderItems();
    if (items.length === 0) return null;
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const currency: Currency = items[0].currency;
    const subtotalIqd = toIqd(subtotal, currency);
    const order: Order = {
      id: buildOrderId(),
      createdAt: new Date().toISOString(),
      customerName: user?.name ?? "Guest",
      items: items.map(({ currency: _c, ...rest }) => {
        void _c;
        return rest;
      }),
      subtotal,
      subtotalIqd,
      shippingFeeIqd: SHIPPING_FEE_IQD,
      totalIqd: subtotalIqd + SHIPPING_FEE_IQD,
      currency,
      status: "pending",
    };
    setOrders((curr) => {
      const next = [order, ...curr];
      writeJSON(KEY_ORDERS, next);
      return next;
    });
    setBag([]);
    writeJSON(KEY_BAG, []);
    return order;
  }, [bag, buildOrderItems, user]);

  const placeOrder = useCallback(
    (input: PlaceOrderInput): Order | null => {
      if (bag.length === 0) return null;
      const items = buildOrderItems();
      if (items.length === 0) return null;
      const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
      const currency: Currency = items[0].currency;
      const subtotalIqd = toIqd(subtotal, currency);
      const order: Order = {
        id: buildOrderId(),
        createdAt: new Date().toISOString(),
        customerName: input.customer.name,
        customer: input.customer,
        items: items.map(({ currency: _c, ...rest }) => {
          void _c;
          return rest;
        }),
        subtotal,
        subtotalIqd,
        shippingFeeIqd: SHIPPING_FEE_IQD,
        totalIqd: subtotalIqd + SHIPPING_FEE_IQD,
        currency,
        status: "pending",
        payment: input.payment,
      };
      setOrders((curr) => {
        const next = [order, ...curr];
        writeJSON(KEY_ORDERS, next);
        return next;
      });
      setBag([]);
      writeJSON(KEY_BAG, []);
      return order;
    },
    [bag, buildOrderItems],
  );

  const setOrderStatus = useCallback((id: string, status: OrderStatus) => {
    setOrders((curr) => {
      const next = curr.map((o) => (o.id === id ? { ...o, status } : o));
      writeJSON(KEY_ORDERS, next);
      return next;
    });
  }, []);

  const removeOrder = useCallback((id: string) => {
    setOrders((curr) => {
      const next = curr.filter((o) => o.id !== id);
      writeJSON(KEY_ORDERS, next);
      return next;
    });
  }, []);

  const signIn = useCallback((name: string, email?: string) => {
    const profile: UserProfile = {
      name: name.trim() || "Guest",
      email: email?.trim() || undefined,
      signedInAt: new Date().toISOString(),
    };
    setUser(profile);
    writeJSON(KEY_USER, profile);
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    writeJSON(KEY_USER, null);
  }, []);

  const value = useMemo<StoreCtx>(
    () => ({
      products,
      collections,
      journal,
      boutiques,
      site,
      setProducts,
      setCollections,
      setJournal,
      setBoutiques,
      setSite,
      resetCatalog,
      bag,
      addToBag,
      removeFromBag,
      setBagQty,
      clearBag,
      bagCount,
      wishlist,
      toggleWish,
      inWishlist,
      orders,
      placeDemoOrder,
      placeOrder,
      setOrderStatus,
      removeOrder,
      user,
      signIn,
      signOut,
      hydrated,
    }),
    [
      products,
      collections,
      journal,
      boutiques,
      site,
      setProducts,
      setCollections,
      setJournal,
      setBoutiques,
      setSite,
      resetCatalog,
      bag,
      addToBag,
      removeFromBag,
      setBagQty,
      clearBag,
      bagCount,
      wishlist,
      toggleWish,
      inWishlist,
      orders,
      placeDemoOrder,
      placeOrder,
      setOrderStatus,
      removeOrder,
      user,
      signIn,
      signOut,
      hydrated,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
