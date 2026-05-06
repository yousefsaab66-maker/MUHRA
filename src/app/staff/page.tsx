"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArchiveRestore,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  Gem,
  KeyRound,
  LayoutDashboard,
  Newspaper,
  Pencil,
  Plus,
  RotateCcw,
  Settings,
  ShoppingBag,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { SectionTitle } from "@/components/Section";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useStore, type OrderStatus, type PaymentMethod } from "@/components/providers/StoreProvider";
import type {
  Category,
  Collection,
  Currency,
  JournalArticle,
  Material,
  Product,
  SiteContent,
  Stone,
} from "@/lib/catalog";
import { formatDate, formatPrice, slugify } from "@/lib/format";
import { formatIqd } from "@/lib/iraq";
import { ensureProductOrderable, productGallerySources, productImageAt } from "@/lib/product-media";

const MAX_IMAGE_BYTES = Math.floor(2.5 * 1024 * 1024);
const MAX_HERO_VIDEO_BYTES = 25 * 1024 * 1024;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error ?? new Error("Read error"));
    reader.readAsDataURL(file);
  });
}

type TabId = "dashboard" | "products" | "orders" | "collections" | "journal" | "site" | "security";

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }> }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "products", label: "Products", icon: Gem },
  { id: "orders", label: "Orders", icon: ClipboardList },
  { id: "collections", label: "Collections", icon: ArchiveRestore },
  { id: "journal", label: "Journal", icon: Newspaper },
  { id: "site", label: "Site copy", icon: Settings },
  { id: "security", label: "Security", icon: KeyRound },
];

export default function StaffPage() {
  const { signedInAs, signOut, hydrated } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("dashboard");

  useEffect(() => {
    if (hydrated && !signedInAs.staff) router.replace("/staff/login");
  }, [hydrated, signedInAs.staff, router]);

  if (!hydrated) return <div className="px-6 py-32 text-center opacity-70">…</div>;
  if (!signedInAs.staff) return null;

  return (
    <div className="page-gutter py-12">
      <div className="mx-auto max-w-[1500px]">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">MUHRA · {signedInAs.staff}</p>
            <h1 className="font-display mt-3 text-4xl md:text-5xl">Staff Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href={"/" as never} className="text-[11px] tracking-eyebrow uppercase gold-underline">
              View site →
            </Link>
            <button type="button" onClick={() => signOut("staff")} className="btn-ghost">
              Sign out
            </button>
          </div>
        </header>

        <div className="mt-10 grid gap-8 lg:grid-cols-[220px_1fr] lg:gap-12">
          <nav className="lg:sticky lg:top-28 self-start">
            <ul className="flex gap-2 overflow-x-auto no-scrollbar lg:flex-col lg:gap-1">
              {TABS.map((tabDef) => (
                <li key={tabDef.id}>
                  <button
                    type="button"
                    onClick={() => setTab(tabDef.id)}
                    aria-pressed={tab === tabDef.id}
                    className="staff-tab"
                    data-active={tab === tabDef.id}
                  >
                    <tabDef.icon className="h-4 w-4" strokeWidth={1.4} />
                    <span>{tabDef.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            {tab === "dashboard" && <DashboardPane />}
            {tab === "products" && <ProductsPane />}
            {tab === "orders" && <OrdersPane />}
            {tab === "collections" && <CollectionsPane />}
            {tab === "journal" && <JournalPane />}
            {tab === "site" && <SitePane />}
            {tab === "security" && <SecurityPane />}
          </div>
        </div>
      </div>
      <style jsx global>{`
        .staff-tab {
          display: inline-flex;
          align-items: center;
          gap: 0.7rem;
          padding: 0.7rem 1rem;
          font-size: 0.7rem;
          letter-spacing: 0.32em;
          text-transform: uppercase;
          border: 1px solid var(--line);
          background: transparent;
          white-space: nowrap;
          transition: background 0.35s var(--ease-luxe), color 0.35s var(--ease-luxe), border-color 0.35s var(--ease-luxe);
        }
        .staff-tab:hover { border-color: var(--color-gold); }
        .staff-tab[data-active="true"] {
          background: var(--color-onyx);
          color: var(--color-ivory);
          border-color: var(--color-onyx);
        }
        [data-theme="dark"] .staff-tab[data-active="true"] {
          background: var(--color-ivory);
          color: var(--color-onyx);
          border-color: var(--color-ivory);
        }
        .staff-card { background: var(--surface); border: 1px solid var(--line); padding: 1.5rem; }
        .staff-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
        .staff-table th, .staff-table td { text-align: start; padding: 0.85rem 0.75rem; border-bottom: 1px solid var(--line); }
        .staff-table th { font-size: 0.66rem; letter-spacing: 0.32em; text-transform: uppercase; opacity: 0.7; }
        .staff-input { width: 100%; padding: 0.7rem 0.9rem; border: 1px solid var(--line-strong); background: transparent; color: var(--foreground); font-size: 0.85rem; outline: none; transition: border-color 0.3s var(--ease-luxe); }
        .staff-input:focus { border-color: var(--color-gold); }
        .staff-label { display: block; font-size: 0.66rem; letter-spacing: 0.32em; text-transform: uppercase; margin-bottom: 0.4rem; opacity: 0.75; }
      `}</style>
    </div>
  );
}

function DashboardPane() {
  const { products, orders, collections, journal } = useStore();
  const pending = orders.filter((o) => o.status === "pending").length;
  const shipped = orders.filter((o) => o.status === "shipped" || o.status === "delivered").length;
  const revenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + o.subtotal, 0);
  const stats = [
    { label: "Products", value: products.length },
    { label: "Collections", value: collections.length },
    { label: "Journal", value: journal.length },
    { label: "Orders", value: orders.length },
    { label: "Pending", value: pending },
    { label: "Shipped", value: shipped },
  ];
  return (
    <section>
      <SectionTitle eyebrow="MUHRA" title="Overview" align="center" />
      <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="staff-card text-center">
            <p className="eyebrow">{s.label}</p>
            <p className="font-display mt-3 text-4xl">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 staff-card">
        <p className="eyebrow">Demo revenue (excl. cancelled)</p>
        <p className="font-display mt-3 text-4xl">{formatPrice(revenue, "EUR", "en")}</p>
      </div>
    </section>
  );
}

function emptyProduct(): Product {
  return {
    id: "tmp-" + Math.random().toString(36).slice(2),
    slug: "",
    name: "",
    collection: "muhra-heritage",
    category: "necklaces",
    price: 0,
    currency: "EUR",
    materials: ["gold"],
    stones: ["none"],
    images: [],
    description: "",
    story: "",
    related: [],
  };
}

function ProductsPane() {
  const { products, setProducts, collections, addToBag } = useStore();
  const { t } = useLocale();
  const router = useRouter();
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [orderHint, setOrderHint] = useState<Product | null>(null);

  const onSave = (p: Product) => {
    const fixed = ensureProductOrderable(p);
    if (creating) {
      const next = { ...fixed, id: "p-" + Date.now() };
      setProducts([next, ...products]);
      setOrderHint(next);
    } else {
      const next = { ...fixed, id: p.id };
      setProducts(products.map((x) => (x.id === p.id ? next : x)));
      setOrderHint(next);
    }
    setEditing(null);
    setCreating(false);
  };

  const onDelete = (id: string) => {
    if (typeof window !== "undefined" && !window.confirm("Delete this product?")) return;
    setProducts(products.filter((p) => p.id !== id));
  };

  return (
    <section>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-3xl">Products ({products.length})</h2>
        <button
          type="button"
          onClick={() => {
            setEditing(emptyProduct());
            setCreating(true);
          }}
          className="btn-ghost"
        >
          <Plus className="h-4 w-4" strokeWidth={1.4} /> New product
        </button>
      </header>

      {orderHint && (
        <div
          className="mt-6 flex flex-col gap-4 staff-card md:flex-row md:items-center md:justify-between"
          role="status"
        >
          <p className="max-w-xl text-sm leading-relaxed opacity-90">{t("staff.product.savedBanner")}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/products/${orderHint.slug}` as never}
              className="btn-ghost inline-flex items-center gap-2 text-[11px] tracking-eyebrow uppercase"
            >
              <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.4} />
              {t("staff.product.viewPage")}
            </Link>
            <button
              type="button"
              className="btn-ghost inline-flex items-center gap-2 text-[11px] tracking-eyebrow uppercase"
              onClick={() => {
                addToBag({ productId: orderHint.id, qty: 1 });
                router.push("/bag" as never);
              }}
            >
              <ShoppingBag className="h-3.5 w-3.5" strokeWidth={1.4} />
              {t("staff.product.addToBag")}
            </button>
            <button
              type="button"
              className="btn-primary inline-flex items-center gap-2 text-[11px] tracking-eyebrow uppercase"
              onClick={() => {
                addToBag({ productId: orderHint.id, qty: 1 });
                router.push("/checkout" as never);
              }}
            >
              {t("staff.product.goCheckout")}
            </button>
            <button
              type="button"
              className="ms-1 text-[11px] uppercase tracking-eyebrow opacity-60 hover:opacity-100"
              onClick={() => setOrderHint(null)}
            >
              {t("staff.product.dismiss")}
            </button>
          </div>
        </div>
      )}
      <div className="mt-6 overflow-x-auto staff-card p-0">
        <table className="staff-table">
          <thead>
            <tr>
              <th className="w-16">{t("staff.table.photo")}</th>
              <th>Name</th>
              <th>Collection</th>
              <th>Category</th>
              <th>{t("staff.table.sizes")}</th>
              <th>Price</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={productImageAt(p, 0)}
                    alt=""
                    className="h-12 w-12 shrink-0 border object-cover"
                    style={{ borderColor: "var(--line)" }}
                  />
                </td>
                <td className="font-display text-base">{p.name}</td>
                <td className="opacity-80">{p.collection}</td>
                <td className="opacity-80 capitalize">{p.category}</td>
                <td className="max-w-[140px] text-sm opacity-90">
                  {p.sizes?.length ? p.sizes.join(", ") : "—"}
                </td>
                <td>{formatPrice(p.price, p.currency, "en")}</td>
                <td>
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/products/${p.slug}` as never}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-9 w-9 items-center justify-center opacity-70 hover:opacity-100"
                      aria-label={t("staff.product.viewPage")}
                      title={t("staff.product.viewPage")}
                    >
                      <ExternalLink className="h-4 w-4" strokeWidth={1.4} />
                    </Link>
                    <button
                      type="button"
                      className="flex h-9 w-9 items-center justify-center opacity-70 hover:opacity-100"
                      aria-label={t("staff.product.quickOrder")}
                      title={t("staff.product.quickOrder")}
                      onClick={() => {
                        addToBag({ productId: p.id, qty: 1 });
                        router.push("/checkout" as never);
                      }}
                    >
                      <ShoppingBag className="h-4 w-4" strokeWidth={1.4} />
                    </button>
                    <button type="button" aria-label="Edit" onClick={() => { setEditing(p); setCreating(false); }} className="opacity-70 hover:opacity-100">
                      <Pencil className="h-4 w-4" strokeWidth={1.4} />
                    </button>
                    <button type="button" aria-label="Delete" onClick={() => onDelete(p.id)} className="opacity-70 hover:opacity-100">
                      <Trash2 className="h-4 w-4" strokeWidth={1.4} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <ProductEditor
          key={editing.id}
          product={editing}
          collections={collections}
          isCreating={creating}
          onCancel={() => { setEditing(null); setCreating(false); }}
          onSave={onSave}
        />
      )}
    </section>
  );
}

function ProductEditor({
  product,
  collections,
  isCreating,
  onCancel,
  onSave,
}: {
  product: Product;
  collections: Collection[];
  isCreating: boolean;
  onCancel: () => void;
  onSave: (p: Product) => void;
}) {
  const [draft, setDraft] = useState<Product>(product);
  const update = <K extends keyof Product>(k: K, v: Product[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));
  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end">
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.55)" }} onClick={onCancel} aria-hidden />
      <div
        className="relative z-10 flex max-h-full w-full max-w-6xl flex-col overflow-hidden md:flex-row"
        style={{ background: "var(--background)", borderInlineStart: "1px solid var(--line)" }}
      >
        <aside
          className="max-h-[38vh] shrink-0 overflow-y-auto border-b p-5 sm:p-6 md:max-h-none md:w-[min(100%,380px)] md:border-b-0 md:border-e"
          style={{ borderColor: "var(--line)", background: "var(--surface)" }}
        >
          <ProductStaffPreview key={draft.id} draft={draft} collections={collections} />
        </aside>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
          <div className="flex shrink-0 items-center justify-between p-6" style={{ borderBottom: "1px solid var(--line)" }}>
            <h3 className="font-display text-2xl">{isCreating ? "New product" : "Edit product"}</h3>
            <button type="button" onClick={onCancel} aria-label="Close">
              <X className="h-5 w-5" strokeWidth={1.4} />
            </button>
          </div>
          <form
            className="space-y-5 p-6"
            onSubmit={(e) => {
              e.preventDefault();
              onSave(draft);
            }}
          >
          <Field label="Name">
            <input className="staff-input" value={draft.name} onChange={(e) => update("name", e.target.value)} required />
          </Field>
          <Field label="Slug">
            <input className="staff-input" value={draft.slug} onChange={(e) => update("slug", slugify(e.target.value))} placeholder="auto-generated from name" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Price">
              <input type="number" className="staff-input" min="0" value={draft.price} onChange={(e) => update("price", Number(e.target.value))} required />
            </Field>
            <Field label="Currency">
              <select className="staff-input" value={draft.currency} onChange={(e) => update("currency", e.target.value as Currency)}>
                {(["EUR", "USD", "AED", "JPY"] as const).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Collection">
              <select className="staff-input" value={draft.collection} onChange={(e) => update("collection", e.target.value)}>
                {collections.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Category">
              <select className="staff-input" value={draft.category} onChange={(e) => update("category", e.target.value as Category)}>
                {(["necklaces", "rings", "earrings", "bracelets", "watches", "bridal"] as const).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Materials (comma separated)">
            <input
              className="staff-input"
              value={draft.materials.join(", ")}
              onChange={(e) =>
                update("materials", e.target.value.split(",").map((s) => s.trim()).filter(Boolean) as Material[])
              }
            />
          </Field>
          <Field label="Stones (comma separated)">
            <input
              className="staff-input"
              value={draft.stones.join(", ")}
              onChange={(e) =>
                update("stones", e.target.value.split(",").map((s) => s.trim()).filter(Boolean) as Stone[])
              }
            />
          </Field>
          <ImagesField
            images={draft.images}
            onChange={(next) => update("images", next)}
          />
          <Field label="Description">
            <textarea className="staff-input" rows={3} value={draft.description} onChange={(e) => update("description", e.target.value)} />
          </Field>
          <Field label="Story">
            <textarea className="staff-input" rows={5} value={draft.story} onChange={(e) => update("story", e.target.value)} />
          </Field>
          <div className="border-t pt-5" style={{ borderColor: "var(--line)" }}>
            <SizesEditor sizes={draft.sizes} onChange={(next) => update("sizes", next)} />
          </div>
          <Field label="Related slugs/ids (comma separated)">
            <input
              className="staff-input"
              value={(draft.related ?? []).join(", ")}
              onChange={(e) => update("related", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
            />
          </Field>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!draft.isNew} onChange={(e) => update("isNew", e.target.checked)} />
              New
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!draft.isHighJewelry} onChange={(e) => update("isHighJewelry", e.target.checked)} />
              High jewelry
            </label>
          </div>
          <div className="flex items-center justify-end gap-3 pt-4">
            <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
            <button type="submit" className="btn-primary">Save</button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}

function ProductStaffPreview({
  draft,
  collections,
}: {
  draft: Product;
  collections: Collection[];
}) {
  const { t, locale } = useLocale();
  const [imgIdx, setImgIdx] = useState(0);
  const collectionName = collections.find((c) => c.slug === draft.collection)?.name ?? draft.collection;
  const gallery = productGallerySources(draft);
  const safeIdx = Math.min(imgIdx, Math.max(0, gallery.length - 1));
  const mainSrc = gallery[safeIdx] ?? productImageAt(draft, 0);
  const sizeVals = Array.isArray(draft.sizes) ? draft.sizes.filter(Boolean) : [];

  return (
    <div className="space-y-4 sm:space-y-5">
      <div>
        <p className="staff-label !mb-1">{t("staff.preview.title")}</p>
        <p className="text-xs leading-relaxed opacity-70">{t("staff.preview.hint")}</p>
      </div>
      <div className="overflow-hidden border" style={{ borderColor: "var(--line)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mainSrc}
          alt=""
          className="aspect-[4/5] max-h-[min(52vh,420px)] w-full bg-[var(--background)] object-cover md:max-h-[min(70vh,520px)]"
        />
      </div>
      {gallery.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {gallery.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              className="overflow-hidden border-2 transition-opacity"
              style={{
                borderColor: i === safeIdx ? "var(--color-gold)" : "var(--line)",
                opacity: i === safeIdx ? 1 : 0.75,
              }}
              onClick={() => setImgIdx(i)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-12 w-12 object-cover" />
            </button>
          ))}
        </div>
      )}
      <div className="space-y-3 text-sm">
        <h4 className="font-display text-xl leading-snug sm:text-2xl">{draft.name.trim() || "—"}</h4>
        <p className="font-display text-lg opacity-90">{formatPrice(draft.price || 0, draft.currency, locale)}</p>
        <dl className="space-y-1.5 text-[11px] uppercase tracking-[0.2em] opacity-75">
          <div className="flex flex-wrap gap-x-2 gap-y-0.5">
            <dt className="shrink-0 opacity-60">{t("staff.preview.slug")}</dt>
            <dd className="min-w-0 break-all font-normal normal-case tracking-normal">{draft.slug.trim() || "—"}</dd>
          </div>
          <div className="flex flex-wrap gap-x-2 gap-y-0.5">
            <dt className="shrink-0 opacity-60">{t("staff.preview.collection")}</dt>
            <dd className="min-w-0 font-normal normal-case tracking-normal">{collectionName}</dd>
          </div>
          <div className="flex flex-wrap gap-x-2 gap-y-0.5">
            <dt className="shrink-0 opacity-60">{t("filter.category")}</dt>
            <dd className="font-normal">{t(`category.${draft.category}`)}</dd>
          </div>
        </dl>
        {!!draft.materials?.length && (
          <p className="text-xs leading-relaxed">
            <span className="block uppercase tracking-eyebrow opacity-60">{t("common.materials")}</span>
            <span className="text-sm opacity-90">{draft.materials.map((m) => t(`material.${m}`)).join(" · ")}</span>
          </p>
        )}
        {!!draft.stones?.length && draft.stones.some((s) => s !== "none") && (
          <p className="text-xs leading-relaxed">
            <span className="block uppercase tracking-eyebrow opacity-60">{t("common.stones")}</span>
            <span className="text-sm opacity-90">
              {draft.stones.filter((s) => s !== "none").map((s) => t(`stone.${s}`)).join(" · ")}
            </span>
          </p>
        )}
        <div className="border-t pt-3" style={{ borderColor: "var(--line)" }}>
          <p className="staff-label !mb-2">{t("common.size")}</p>
          {!Array.isArray(draft.sizes) && <p className="text-sm leading-relaxed opacity-75">{t("staff.preview.noSizes")}</p>}
          {Array.isArray(draft.sizes) && sizeVals.length === 0 && (
            <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-400/95">{t("staff.preview.sizesEmpty")}</p>
          )}
          {sizeVals.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {sizeVals.map((s) => (
                <span
                  key={s}
                  className="border px-2.5 py-1 text-xs sm:text-sm"
                  style={{ borderColor: "var(--line)" }}
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
        {draft.description?.trim() && (
          <p
            className="border-t pt-3 text-sm leading-relaxed opacity-85 line-clamp-6"
            style={{ borderColor: "var(--line)" }}
          >
            {draft.description}
          </p>
        )}
      </div>
    </div>
  );
}

function SizesEditor({
  sizes,
  onChange,
}: {
  sizes: string[] | undefined;
  onChange: (next: string[] | undefined) => void;
}) {
  const { t } = useLocale();
  const [input, setInput] = useState("");
  const enabled = Array.isArray(sizes);
  const list = enabled ? sizes.filter(Boolean) : [];

  return (
    <div className="space-y-4">
      <label className="flex cursor-pointer items-start gap-3 text-sm">
        <input
          type="checkbox"
          className="mt-1"
          checked={enabled}
          onChange={(e) => {
            if (e.target.checked) onChange([]);
            else onChange(undefined);
          }}
        />
        <span>
          <span className="staff-label !mb-0 block">{t("staff.sizes.enable")}</span>
          <span className="mt-1 block text-xs opacity-75">{t("staff.sizes.hint")}</span>
        </span>
      </label>
      {enabled && (
        <>
          <div className="flex flex-wrap gap-2">
            <input
              className="staff-input min-w-[140px] flex-1"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("staff.sizes.placeholder")}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const v = input.trim();
                  if (v && !list.includes(v)) onChange([...list, v]);
                  setInput("");
                }
              }}
            />
            <button
              type="button"
              className="btn-ghost whitespace-nowrap px-4 text-[11px] tracking-eyebrow uppercase"
              onClick={() => {
                const v = input.trim();
                if (v && !list.includes(v)) onChange([...list, v]);
                setInput("");
              }}
            >
              {t("staff.sizes.add")}
            </button>
          </div>
          {list.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {list.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 border px-2.5 py-1 text-sm"
                  style={{ borderColor: "var(--line)" }}
                >
                  {s}
                  <button
                    type="button"
                    aria-label={`${t("staff.sizes.remove")}: ${s}`}
                    className="opacity-70 hover:opacity-100"
                    onClick={() => onChange(list.filter((x) => x !== s))}
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={1.4} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <button
            type="button"
            className="text-[11px] uppercase tracking-eyebrow opacity-70 hover:opacity-100"
            onClick={() => onChange([])}
          >
            {t("staff.sizes.clearAll")}
          </button>
        </>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="staff-label">{label}</span>
      {children}
    </label>
  );
}

function ImagesField({
  images,
  onChange,
}: {
  images: string[];
  onChange: (next: string[]) => void;
}) {
  const { t } = useLocale();
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    const accepted: string[] = [];
    const errors: string[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        errors.push(t("staff.images.notImage").replace("{name}", file.name));
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        errors.push(t("staff.images.tooLarge").replace("{name}", file.name));
        continue;
      }
      try {
        const dataUrl = await readFileAsDataUrl(file);
        if (dataUrl) accepted.push(dataUrl);
      } catch {
        errors.push(file.name);
      }
    }
    if (accepted.length > 0) onChange([...images, ...accepted]);
    if (errors.length > 0) setError(errors.join(" "));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAt = (idx: number) => {
    const next = images.slice();
    next.splice(idx, 1);
    onChange(next);
  };

  return (
    <div>
      <p className="staff-label">{t("staff.images.title")}</p>
      <Field label={t("staff.images.urls")}>
        <textarea
          className="staff-input"
          rows={3}
          value={images.join("\n")}
          onChange={(e) =>
            onChange(
              e.target.value
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean),
            )
          }
        />
      </Field>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files)}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="btn-ghost"
        >
          <Upload className="h-4 w-4" strokeWidth={1.4} /> {t("staff.images.upload")}
        </button>
        <span className="text-[11px] opacity-65">{t("staff.images.uploadHint")}</span>
      </div>
      {error && (
        <p className="mt-2 text-xs" style={{ color: "var(--color-bordeaux)" }}>
          {error}
        </p>
      )}
      {images.length > 0 && (
        <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {images.map((src, idx) => (
            <li
              key={src + idx}
              className="relative aspect-square overflow-hidden"
              style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
              <button
                type="button"
                aria-label={t("staff.images.remove")}
                onClick={() => removeAt(idx)}
                className="absolute end-1 top-1 flex h-7 w-7 items-center justify-center rounded-full"
                style={{
                  background: "color-mix(in srgb, var(--background) 85%, transparent)",
                  border: "1px solid var(--line)",
                }}
              >
                <X className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  mastercard: "Mastercard",
  zaincash: "ZainCash",
  cod: "COD",
};

const STATUS_OPTIONS = ["pending", "preparing", "shipped", "delivered", "cancelled"] as const;

function OrdersPane() {
  const { orders, products, setOrderStatus, removeOrder } = useStore();
  const { t, locale } = useLocale();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpanded((curr) => {
      const next = new Set(curr);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (!ql) return true;
      const haystacks = [
        o.id,
        o.customerName,
        o.customer?.phone ?? "",
        o.customer?.governorate ?? "",
        o.customer?.city ?? "",
        o.customer?.address ?? "",
        o.payment?.method ?? "",
      ];
      return haystacks.some((h) => h.toLowerCase().includes(ql));
    });
  }, [orders, q, statusFilter]);

  return (
    <section>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-3xl">Orders ({orders.length})</h2>
        <div className="flex flex-wrap items-center gap-3">
          <select
            className="staff-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "all")}
            style={{ padding: "0.55rem 0.7rem" }}
          >
            <option value="all">{t("staff.orders.filterAll")}</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <input
            className="staff-input max-w-xs"
            placeholder={t("staff.orders.searchPlaceholder")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </header>
      <div className="mt-6 overflow-x-auto staff-card p-0">
        <table className="staff-table">
          <thead>
            <tr>
              <th></th>
              <th>{t("staff.orders.id")}</th>
              <th>{t("staff.orders.date")}</th>
              <th>{t("staff.orders.customer")}</th>
              <th>{t("staff.orders.location")}</th>
              <th>{t("staff.orders.phone")}</th>
              <th>{t("staff.orders.payment")}</th>
              <th>{t("staff.orders.total")}</th>
              <th>{t("staff.orders.status")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="py-12 text-center opacity-60">
                  No orders yet — try a demo checkout from the bag.
                </td>
              </tr>
            )}
            {filtered.map((o) => {
              const isOpen = expanded.has(o.id);
              const govLabel = o.customer?.governorate
                ? t(`governorate.${o.customer.governorate}`)
                : "—";
              return (
                <FragmentRow key={o.id}>
                  <tr
                    className="cursor-pointer"
                    onClick={() => toggleExpand(o.id)}
                  >
                    <td style={{ width: 28 }}>
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 opacity-60" strokeWidth={1.5} />
                      ) : (
                        <ChevronRight className="h-4 w-4 opacity-60" strokeWidth={1.5} />
                      )}
                    </td>
                    <td className="font-mono text-xs">{o.id}</td>
                    <td className="opacity-80">{formatDate(o.createdAt, locale)}</td>
                    <td>{o.customerName}</td>
                    <td className="opacity-80">
                      {govLabel}
                      {o.customer?.city ? ` · ${o.customer.city}` : ""}
                    </td>
                    <td className="opacity-80 font-mono text-xs">{o.customer?.phone ?? "—"}</td>
                    <td>
                      {o.payment?.method ? (
                        <span
                          className="inline-block px-2 py-0.5 text-[10px] tracking-eyebrow uppercase"
                          style={{
                            border: "1px solid var(--line-strong)",
                            background: "var(--surface)",
                          }}
                        >
                          {PAYMENT_LABELS[o.payment.method]}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span>{formatPrice(o.subtotal, o.currency, locale)}</span>
                        {typeof o.totalIqd === "number" && (
                          <span className="text-[10px] opacity-65">
                            ≈ {formatIqd(o.totalIqd, locale)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <select
                        className="staff-input"
                        value={o.status}
                        onChange={(e) => setOrderStatus(o.id, e.target.value as OrderStatus)}
                        style={{ padding: "0.4rem 0.5rem" }}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          aria-label="Remove"
                          onClick={() => removeOrder(o.id)}
                          className="opacity-70 hover:opacity-100"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.4} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr>
                      <td colSpan={10} style={{ background: "var(--surface)" }}>
                        <div className="p-6 grid gap-6 md:grid-cols-2">
                          <div>
                            <p className="eyebrow">{t("staff.orders.address")}</p>
                            <p className="mt-2 text-sm leading-relaxed">
                              <span className="font-medium">{o.customerName}</span>
                              <br />
                              {o.customer?.phone}
                              <br />
                              {o.customer?.address}
                              {o.customer?.city ? `, ${o.customer.city}` : ""}
                              <br />
                              {govLabel} — Iraq
                            </p>
                            {o.customer?.notes && (
                              <>
                                <p className="eyebrow mt-4">{t("staff.orders.notes")}</p>
                                <p className="mt-2 text-sm opacity-80">{o.customer.notes}</p>
                              </>
                            )}
                            <p className="eyebrow mt-4">{t("staff.orders.payment")}</p>
                            <p className="mt-2 text-sm">
                              {o.payment?.method
                                ? PAYMENT_LABELS[o.payment.method]
                                : "—"}
                              {o.payment?.cardLast4 ? ` · •••• ${o.payment.cardLast4}` : ""}
                              {o.payment?.zaincashPhone ? ` · ${o.payment.zaincashPhone}` : ""}
                            </p>
                          </div>
                          <div>
                            <p className="eyebrow">{t("staff.orders.items")}</p>
                            <ul className="mt-2 space-y-2">
                              {o.items.map((it, idx) => {
                                const p = products.find((x) => x.id === it.productId);
                                return (
                                  <li
                                    key={idx}
                                    className="flex items-center justify-between gap-3"
                                  >
                                    <div>
                                      <p className="text-sm">{it.name}</p>
                                      <p className="text-[11px] opacity-65">
                                        {it.qty} × {formatPrice(it.price, o.currency, locale)}
                                        {it.size ? ` · ${it.size}` : ""}
                                        {p ? ` · /${p.slug}` : ""}
                                      </p>
                                    </div>
                                    <p className="text-sm">
                                      {formatPrice(it.qty * it.price, o.currency, locale)}
                                    </p>
                                  </li>
                                );
                              })}
                            </ul>
                            <div className="hairline my-4" />
                            <div className="flex items-center justify-between text-sm">
                              <span className="opacity-75">{t("common.subtotal")}</span>
                              <span>{formatPrice(o.subtotal, o.currency, locale)}</span>
                            </div>
                            {typeof o.shippingFeeIqd === "number" && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="opacity-75">{t("checkout.shipping")}</span>
                                <span>{formatIqd(o.shippingFeeIqd, locale)}</span>
                              </div>
                            )}
                            {typeof o.totalIqd === "number" && (
                              <div className="flex items-center justify-between text-sm font-medium">
                                <span className="opacity-75">{t("checkout.total")}</span>
                                <span>{formatIqd(o.totalIqd, locale)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </FragmentRow>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FragmentRow({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function CollectionsPane() {
  const { collections, setCollections } = useStore();
  return (
    <section>
      <h2 className="font-display text-3xl">Collections ({collections.length})</h2>
      <p className="mt-2 opacity-70 text-sm">Edit existing collection metadata. Slugs are read-only.</p>
      <div className="mt-6 grid gap-4">
        {collections.map((c) => (
          <details key={c.id} className="staff-card">
            <summary className="cursor-pointer">
              <span className="font-display text-xl">{c.name}</span>
              <span className="ms-3 opacity-60 text-sm">/{c.slug}</span>
            </summary>
            <div className="mt-4 grid gap-4">
              <Field label="Name">
                <input
                  className="staff-input"
                  value={c.name}
                  onChange={(e) =>
                    setCollections(collections.map((x) => (x.id === c.id ? { ...x, name: e.target.value } : x)))
                  }
                />
              </Field>
              <Field label="Tagline">
                <input
                  className="staff-input"
                  value={c.tagline}
                  onChange={(e) =>
                    setCollections(collections.map((x) => (x.id === c.id ? { ...x, tagline: e.target.value } : x)))
                  }
                />
              </Field>
              <Field label="Description">
                <textarea
                  className="staff-input"
                  rows={4}
                  value={c.description}
                  onChange={(e) =>
                    setCollections(collections.map((x) => (x.id === c.id ? { ...x, description: e.target.value } : x)))
                  }
                />
              </Field>
              <Field label="Cover image URL">
                <input
                  className="staff-input"
                  value={c.coverImage}
                  onChange={(e) =>
                    setCollections(collections.map((x) => (x.id === c.id ? { ...x, coverImage: e.target.value } : x)))
                  }
                />
              </Field>
              <Field label="Editorial image URL">
                <input
                  className="staff-input"
                  value={c.editorialImage}
                  onChange={(e) =>
                    setCollections(collections.map((x) => (x.id === c.id ? { ...x, editorialImage: e.target.value } : x)))
                  }
                />
              </Field>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

function JournalPane() {
  const { journal, setJournal } = useStore();
  const onAdd = () => {
    const article: JournalArticle = {
      id: "j-" + Date.now(),
      slug: `chapter-${Date.now()}`,
      title: "Untitled chapter",
      excerpt: "",
      body: "",
      image: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=1600&q=80",
      author: "MUHRA Editorial",
      date: new Date().toISOString().slice(0, 10),
      category: "Maison",
    };
    setJournal([article, ...journal]);
  };
  const onDelete = (id: string) => {
    if (typeof window !== "undefined" && !window.confirm("Delete this article?")) return;
    setJournal(journal.filter((a) => a.id !== id));
  };
  return (
    <section>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-3xl">Journal ({journal.length})</h2>
        <button type="button" onClick={onAdd} className="btn-ghost">
          <Plus className="h-4 w-4" strokeWidth={1.4} /> New article
        </button>
      </header>
      <div className="mt-6 grid gap-4">
        {journal.map((a) => (
          <details key={a.id} className="staff-card">
            <summary className="cursor-pointer">
              <span className="font-display text-xl">{a.title}</span>
              <span className="ms-3 opacity-60 text-sm">/{a.slug}</span>
            </summary>
            <div className="mt-4 grid gap-4">
              <Field label="Title">
                <input
                  className="staff-input"
                  value={a.title}
                  onChange={(e) =>
                    setJournal(journal.map((x) => (x.id === a.id ? { ...x, title: e.target.value } : x)))
                  }
                />
              </Field>
              <Field label="Slug">
                <input
                  className="staff-input"
                  value={a.slug}
                  onChange={(e) =>
                    setJournal(journal.map((x) => (x.id === a.id ? { ...x, slug: slugify(e.target.value) } : x)))
                  }
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Author">
                  <input className="staff-input" value={a.author} onChange={(e) => setJournal(journal.map((x) => (x.id === a.id ? { ...x, author: e.target.value } : x)))} />
                </Field>
                <Field label="Date">
                  <input type="date" className="staff-input" value={a.date} onChange={(e) => setJournal(journal.map((x) => (x.id === a.id ? { ...x, date: e.target.value } : x)))} />
                </Field>
              </div>
              <Field label="Category">
                <input className="staff-input" value={a.category} onChange={(e) => setJournal(journal.map((x) => (x.id === a.id ? { ...x, category: e.target.value } : x)))} />
              </Field>
              <Field label="Image URL">
                <input className="staff-input" value={a.image} onChange={(e) => setJournal(journal.map((x) => (x.id === a.id ? { ...x, image: e.target.value } : x)))} />
              </Field>
              <Field label="Excerpt">
                <textarea className="staff-input" rows={2} value={a.excerpt} onChange={(e) => setJournal(journal.map((x) => (x.id === a.id ? { ...x, excerpt: e.target.value } : x)))} />
              </Field>
              <Field label="Body">
                <textarea className="staff-input" rows={8} value={a.body} onChange={(e) => setJournal(journal.map((x) => (x.id === a.id ? { ...x, body: e.target.value } : x)))} />
              </Field>
              <div className="flex justify-end">
                <button type="button" onClick={() => onDelete(a.id)} className="btn-ghost">
                  <Trash2 className="h-4 w-4" strokeWidth={1.4} /> Delete
                </button>
              </div>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

function SitePane() {
  const { site, setSite, resetCatalog } = useStore();
  const { t } = useLocale();
  const [draft, setDraft] = useState<SiteContent>(site);
  const [saved, setSaved] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(site);
  }, [site]);

  const onVideoFile = async (files: FileList | null) => {
    setVideoError(null);
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      setVideoError(t("staff.hero.notVideo"));
      return;
    }
    if (file.size > MAX_HERO_VIDEO_BYTES) {
      setVideoError(t("staff.hero.tooLarge"));
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      if (dataUrl) setDraft((d) => ({ ...d, heroVideo: dataUrl }));
    } catch {
      setVideoError(t("staff.hero.tooLarge"));
    } finally {
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  };

  return (
    <section>
      <h2 className="font-display text-3xl">Site copy</h2>
      <p className="mt-2 opacity-70 text-sm">These values appear on the public site.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSite(draft);
          setSaved(true);
          setTimeout(() => setSaved(false), 2200);
        }}
        className="mt-6 staff-card grid gap-4"
      >
        <Field label="Brand name">
          <input className="staff-input" value={draft.brandName} onChange={(e) => setDraft({ ...draft, brandName: e.target.value })} />
        </Field>
        <Field label="Tagline">
          <input className="staff-input" value={draft.tagline} onChange={(e) => setDraft({ ...draft, tagline: e.target.value })} />
        </Field>
        <Field label="Hero headline">
          <input className="staff-input" value={draft.heroHeadline} onChange={(e) => setDraft({ ...draft, heroHeadline: e.target.value })} />
        </Field>
        <Field label="Hero subhead">
          <textarea className="staff-input" rows={2} value={draft.heroSubhead} onChange={(e) => setDraft({ ...draft, heroSubhead: e.target.value })} />
        </Field>
        <Field label="Support email">
          <input className="staff-input" type="email" value={draft.supportEmail} onChange={(e) => setDraft({ ...draft, supportEmail: e.target.value })} />
        </Field>

        <div className="hairline my-2" />
        <div>
          <p className="staff-label">{t("staff.hero.title")}</p>
          <Field label={t("staff.hero.url")}>
            <input
              className="staff-input"
              value={draft.heroVideo ?? ""}
              placeholder="https://…/clip.mp4"
              onChange={(e) => setDraft({ ...draft, heroVideo: e.target.value })}
            />
          </Field>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              className="hidden"
              onChange={(e) => void onVideoFile(e.target.files)}
            />
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="btn-ghost"
            >
              <Upload className="h-4 w-4" strokeWidth={1.4} /> {t("staff.hero.upload")}
            </button>
            <button
              type="button"
              onClick={() => setDraft({ ...draft, heroVideo: "" })}
              className="btn-ghost"
            >
              <RotateCcw className="h-4 w-4" strokeWidth={1.4} /> {t("staff.hero.reset")}
            </button>
            <span className="text-[11px] opacity-65 max-w-md">{t("staff.hero.uploadHint")}</span>
          </div>
          {videoError && (
            <p className="mt-2 text-xs" style={{ color: "var(--color-bordeaux)" }}>
              {videoError}
            </p>
          )}
          {draft.heroVideo && draft.heroVideo.trim() !== "" && (
            <div className="mt-4">
              <p className="text-[11px] tracking-eyebrow uppercase opacity-65 mb-2">
                {t("staff.hero.preview")}
              </p>
              <video
                src={draft.heroVideo}
                controls
                playsInline
                muted
                className="w-full max-w-lg"
                style={{ background: "var(--color-onyx)", maxHeight: 320, objectFit: "cover" }}
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button type="button" onClick={() => { if (confirm("Reset all catalog data to seed?")) resetCatalog(); }} className="btn-ghost">
            Reset catalog to seed
          </button>
          <button type="submit" className="btn-primary">{saved ? "Saved ✓" : "Save"}</button>
        </div>
      </form>
    </section>
  );
}

function SecurityPane() {
  const { changeCredentials } = useAuth();
  const [current, setCurrent] = useState("");
  const [user, setUser] = useState("");
  const [pwd, setPwd] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  return (
    <section>
      <h2 className="font-display text-3xl">Security</h2>
      <p className="mt-2 opacity-70 text-sm">Change your staff credentials. Hashes are kept locally.</p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setErr(null); setMsg(null);
          const ok = await changeCredentials("staff", current, user, pwd);
          if (ok) {
            setMsg("Credentials updated.");
            setCurrent(""); setPwd("");
          } else {
            setErr("Current password incorrect.");
          }
        }}
        className="mt-6 staff-card grid gap-4 max-w-md"
      >
        <Field label="Current password">
          <input className="staff-input" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
        </Field>
        <Field label="New username (optional)">
          <input className="staff-input" value={user} onChange={(e) => setUser(e.target.value)} placeholder="leave blank to keep" />
        </Field>
        <Field label="New password">
          <input className="staff-input" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} required />
        </Field>
        {err && <p className="text-sm" style={{ color: "var(--color-bordeaux)" }}>{err}</p>}
        {msg && <p className="text-sm" style={{ color: "var(--color-gold-deep)" }}>{msg}</p>}
        <div className="flex justify-end">
          <button type="submit" className="btn-primary">Update</button>
        </div>
      </form>
    </section>
  );
}
