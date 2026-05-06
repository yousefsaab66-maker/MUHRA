"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CreditCard, Smartphone, Truck } from "lucide-react";
import { SectionTitle } from "@/components/Section";
import { SafeImage } from "@/components/SafeImage";
import { useLocale } from "@/components/providers/LocaleProvider";
import {
  useStore,
  type BagItem,
  type OrderCustomer,
  type OrderPayment,
  type PaymentMethod,
} from "@/components/providers/StoreProvider";
import { formatPrice } from "@/lib/format";
import {
  IRAQ_GOVERNORATES,
  IRAQI_PHONE_REGEX,
  formatIqd,
  normalizeIraqiPhone,
  toIqd,
  type GovernorateCode,
} from "@/lib/iraq";

type FieldErrors = Partial<{
  name: string;
  phone: string;
  governorate: string;
  city: string;
  address: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
  zaincashPhone: string;
}>;

const DIGITS_ONLY = /\D+/g;

function luhnValid(num: string) {
  const digits = num.replace(DIGITS_ONLY, "");
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let dbl = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = Number(digits[i]);
    if (dbl) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

function expiryValid(raw: string) {
  const m = raw.match(/^\s*(\d{2})\s*\/\s*(\d{2})\s*$/);
  if (!m) return false;
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return false;
  const now = new Date();
  const exp = new Date(year, month, 0, 23, 59, 59);
  return exp.getTime() >= now.getTime();
}

function formatCardNumber(raw: string) {
  return raw
    .replace(DIGITS_ONLY, "")
    .slice(0, 19)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function formatExpiry(raw: string) {
  const digits = raw.replace(DIGITS_ONLY, "").slice(0, 4);
  if (digits.length < 3) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { t, locale } = useLocale();
  const { bag, products, placeOrder, hydrated } = useStore();

  const items = useMemo(
    () =>
      bag
        .map((b) => ({ b, p: products.find((p) => p.id === b.productId) }))
        .filter((x): x is { b: BagItem; p: NonNullable<typeof x.p> } => Boolean(x.p)),
    [bag, products],
  );
  const subtotal = items.reduce((s, { b, p }) => s + p.price * b.qty, 0);
  const currency = items[0]?.p.currency ?? "EUR";
  const subtotalIqd = toIqd(subtotal, currency);
  const shippingFeeIqd = 5000;
  const totalIqd = subtotalIqd + shippingFeeIqd;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [governorate, setGovernorate] = useState<GovernorateCode | "">("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cod");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [zaincashPhone, setZaincashPhone] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // If the bag is empty after hydration, redirect back to /bag for the empty state.
  useEffect(() => {
    if (hydrated && items.length === 0 && !submitting) {
      // Allow the empty state below to render; no redirect — keeps /checkout addressable.
    }
  }, [hydrated, items.length, submitting]);

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!name.trim()) next.name = t("v.required");
    if (!phone.trim()) next.phone = t("v.required");
    else if (!IRAQI_PHONE_REGEX.test(phone.replace(/[\s\-().]/g, "")))
      next.phone = t("v.phone");
    if (!governorate) next.governorate = t("v.governorate");
    if (!city.trim()) next.city = t("v.required");
    if (!address.trim()) next.address = t("v.required");
    if (method === "mastercard") {
      if (!luhnValid(cardNumber)) next.cardNumber = t("v.cardNumber");
      if (!expiryValid(cardExpiry)) next.cardExpiry = t("v.cardExpiry");
      if (!/^\d{3,4}$/.test(cardCvv.trim())) next.cardCvv = t("v.cardCvv");
    }
    if (method === "zaincash") {
      if (!IRAQI_PHONE_REGEX.test(zaincashPhone.replace(/[\s\-().]/g, "")))
        next.zaincashPhone = t("v.zaincash");
    }
    return next;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) {
      const firstKey = Object.keys(next)[0];
      const el = document.querySelector<HTMLElement>(`[data-field="${firstKey}"]`);
      el?.focus();
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!governorate) return;
    setSubmitting(true);
    const customer: OrderCustomer = {
      name: name.trim(),
      phone: normalizeIraqiPhone(phone) ?? phone.trim(),
      governorate: governorate as GovernorateCode,
      city: city.trim(),
      address: address.trim(),
      notes: notes.trim() || undefined,
    };
    const payment: OrderPayment = (() => {
      if (method === "mastercard") {
        const digits = cardNumber.replace(DIGITS_ONLY, "");
        return {
          method,
          cardLast4: digits.slice(-4),
        };
      }
      if (method === "zaincash") {
        return {
          method,
          zaincashPhone: normalizeIraqiPhone(zaincashPhone) ?? zaincashPhone.trim(),
        };
      }
      return { method };
    })();
    const order = placeOrder({ customer, payment });
    if (!order) {
      setSubmitting(false);
      return;
    }
    router.push(`/checkout/success?orderId=${encodeURIComponent(order.id)}` as never);
  };

  if (!hydrated) {
    return <div className="px-6 py-32 text-center opacity-60">…</div>;
  }

  if (items.length === 0) {
    return (
      <div className="page-gutter py-20 md:py-28">
        <SectionTitle eyebrow={t("checkout.eyebrow")} title={t("checkout.heading")} />
        <div className="mx-auto mt-12 max-w-md text-center">
          <p className="font-display text-3xl">{t("checkout.empty.title")}</p>
          <p className="mt-3 opacity-75">{t("checkout.empty.body")}</p>
          <Link href={"/products" as never} className="btn-primary mt-8 inline-flex">
            {t("checkout.empty.cta")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-gutter py-16 md:py-24">
      <SectionTitle eyebrow={t("checkout.eyebrow")} title={t("checkout.heading")} />
      <p className="mt-4 text-center text-[12px] tracking-eyebrow uppercase opacity-70">
        {t("delivery.iraqOnly")}
      </p>

      <form
        onSubmit={onSubmit}
        className="mx-auto mt-12 grid max-w-[1300px] gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-14"
        noValidate
      >
        <div className="space-y-10">
          <section>
            <h3 className="font-display text-2xl">{t("checkout.contact")}</h3>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <CheckoutField label={t("checkout.fullName")} error={errors.name}>
                <input
                  data-field="name"
                  className="input-luxe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </CheckoutField>
              <CheckoutField
                label={t("checkout.phone")}
                hint={t("checkout.phoneHint")}
                error={errors.phone}
              >
                <input
                  data-field="phone"
                  type="tel"
                  inputMode="tel"
                  dir="ltr"
                  className="input-luxe"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07XXXXXXXXX"
                  required
                />
              </CheckoutField>
            </div>
          </section>

          <section>
            <h3 className="font-display text-2xl">{t("checkout.shippingAddress")}</h3>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <CheckoutField label={t("checkout.governorate")} error={errors.governorate}>
                <select
                  data-field="governorate"
                  className="input-luxe"
                  value={governorate}
                  onChange={(e) => setGovernorate(e.target.value as GovernorateCode | "")}
                  required
                >
                  <option value="">{t("checkout.governorate.placeholder")}</option>
                  {IRAQ_GOVERNORATES.map((code) => (
                    <option key={code} value={code}>
                      {t(`governorate.${code}`)}
                    </option>
                  ))}
                </select>
              </CheckoutField>
              <CheckoutField label={t("checkout.city")} error={errors.city}>
                <input
                  data-field="city"
                  className="input-luxe"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </CheckoutField>
            </div>
            <div className="mt-4">
              <CheckoutField label={t("checkout.address")} error={errors.address}>
                <input
                  data-field="address"
                  className="input-luxe"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </CheckoutField>
            </div>
            <div className="mt-4">
              <CheckoutField label={t("checkout.notes")}>
                <textarea
                  className="input-luxe"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </CheckoutField>
            </div>
          </section>

          <section>
            <h3 className="font-display text-2xl">{t("checkout.payment")}</h3>
            <p className="mt-2 text-[11px] tracking-eyebrow uppercase opacity-65">
              {t("pay.method")}
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <PaymentRadio
                value="mastercard"
                current={method}
                onChange={setMethod}
                label={t("pay.mastercard")}
                desc={t("pay.mastercard.desc")}
                icon={<CreditCard className="h-5 w-5" strokeWidth={1.4} />}
              />
              <PaymentRadio
                value="zaincash"
                current={method}
                onChange={setMethod}
                label={t("pay.zaincash")}
                desc={t("pay.zaincash.desc")}
                icon={<Smartphone className="h-5 w-5" strokeWidth={1.4} />}
              />
              <PaymentRadio
                value="cod"
                current={method}
                onChange={setMethod}
                label={t("pay.cod")}
                desc={t("pay.cod.desc")}
                icon={<Truck className="h-5 w-5" strokeWidth={1.4} />}
              />
            </div>

            {method === "mastercard" && (
              <div
                className="mt-6 grid gap-4 p-5"
                style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
              >
                <CheckoutField label={t("pay.cardNumber")} error={errors.cardNumber}>
                  <input
                    data-field="cardNumber"
                    inputMode="numeric"
                    dir="ltr"
                    className="input-luxe font-mono tracking-widest"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    placeholder="•••• •••• •••• ••••"
                  />
                </CheckoutField>
                <div className="grid gap-4 md:grid-cols-3">
                  <CheckoutField label={t("pay.cardName")}>
                    <input
                      className="input-luxe"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                    />
                  </CheckoutField>
                  <CheckoutField label={t("pay.cardExpiry")} error={errors.cardExpiry}>
                    <input
                      data-field="cardExpiry"
                      inputMode="numeric"
                      dir="ltr"
                      className="input-luxe"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      placeholder="MM/YY"
                    />
                  </CheckoutField>
                  <CheckoutField label={t("pay.cardCvv")} error={errors.cardCvv}>
                    <input
                      data-field="cardCvv"
                      inputMode="numeric"
                      dir="ltr"
                      className="input-luxe"
                      value={cardCvv}
                      onChange={(e) =>
                        setCardCvv(e.target.value.replace(DIGITS_ONLY, "").slice(0, 4))
                      }
                      placeholder="•••"
                    />
                  </CheckoutField>
                </div>
              </div>
            )}

            {method === "zaincash" && (
              <div
                className="mt-6 grid gap-3 p-5"
                style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
              >
                <CheckoutField label={t("pay.zaincashPhone")} error={errors.zaincashPhone}>
                  <input
                    data-field="zaincashPhone"
                    type="tel"
                    inputMode="tel"
                    dir="ltr"
                    className="input-luxe"
                    value={zaincashPhone}
                    onChange={(e) => setZaincashPhone(e.target.value)}
                    placeholder="07XXXXXXXXX"
                  />
                </CheckoutField>
                <p className="text-xs opacity-70">{t("pay.zaincashNote")}</p>
              </div>
            )}

            {method === "cod" && (
              <div
                className="mt-6 p-5"
                style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
              >
                <p className="text-sm opacity-80">{t("pay.codNote")}</p>
              </div>
            )}
          </section>
        </div>

        <aside
          className="self-start lg:sticky lg:top-28"
          style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
        >
          <div className="p-7">
            <h3 className="font-display text-2xl">{t("checkout.summary")}</h3>
            <ul className="mt-6 flex flex-col gap-4">
              {items.map(({ b, p }) => (
                <li
                  key={p.id + (b.size ?? "")}
                  className="grid grid-cols-[64px_1fr_auto] items-center gap-4"
                >
                  <div
                    className="relative aspect-square overflow-hidden"
                    style={{ background: "var(--surface-2)" }}
                  >
                    {p.images[0] && (
                      <SafeImage
                        src={p.images[0]}
                        alt={p.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-display text-base leading-tight">{p.name}</p>
                    <p className="mt-0.5 text-[10px] tracking-eyebrow uppercase opacity-65">
                      {b.qty} × {formatPrice(p.price, p.currency, locale)}
                      {b.size ? ` · ${b.size}` : ""}
                    </p>
                  </div>
                  <p className="text-sm">{formatPrice(p.price * b.qty, p.currency, locale)}</p>
                </li>
              ))}
            </ul>
            <div className="hairline my-6" />
            <div className="flex items-center justify-between text-sm">
              <span className="opacity-75">{t("common.subtotal")}</span>
              <span>{formatPrice(subtotal, currency, locale)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs opacity-70">
              <span>{t("checkout.iqdEquivalent")}</span>
              <span>{formatIqd(subtotalIqd, locale)}</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="opacity-75">{t("checkout.shipping")}</span>
              <span>{formatIqd(shippingFeeIqd, locale)}</span>
            </div>
            <div className="hairline my-6" />
            <div className="flex items-center justify-between">
              <span className="eyebrow">{t("checkout.total")}</span>
              <div className="text-end">
                <p className="font-display text-2xl">
                  {formatPrice(subtotal, currency, locale)}
                </p>
                <p className="text-[11px] opacity-65">≈ {formatIqd(totalIqd, locale)}</p>
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary mt-8 w-full"
            >
              {submitting ? t("checkout.placing") : t("checkout.placeOrder")}
            </button>
            <p className="mt-4 text-[11px] opacity-65 text-center">
              {t("delivery.iraqOnly")}
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}

function CheckoutField({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {children}
      {hint && !error && (
        <span className="mt-1 block text-[11px] opacity-65">{hint}</span>
      )}
      {error && (
        <span
          className="mt-1 block text-[11px]"
          style={{ color: "var(--color-bordeaux)" }}
        >
          {error}
        </span>
      )}
    </label>
  );
}

function PaymentRadio({
  value,
  current,
  onChange,
  label,
  desc,
  icon,
}: {
  value: PaymentMethod;
  current: PaymentMethod;
  onChange: (v: PaymentMethod) => void;
  label: string;
  desc: string;
  icon: React.ReactNode;
}) {
  const active = value === current;
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      aria-pressed={active}
      className="text-start p-5 transition-colors"
      style={{
        border: active ? "1px solid var(--color-gold)" : "1px solid var(--line-strong)",
        background: active ? "var(--surface)" : "transparent",
      }}
    >
      <div className="flex items-center gap-3">
        <span
          className="inline-flex h-9 w-9 items-center justify-center"
          style={{
            background: active ? "var(--color-onyx)" : "transparent",
            color: active ? "var(--color-ivory)" : "inherit",
            border: "1px solid var(--line-strong)",
          }}
          aria-hidden
        >
          {icon}
        </span>
        <span className="font-display text-lg leading-tight">{label}</span>
      </div>
      <p className="mt-3 text-[12px] leading-relaxed opacity-75">{desc}</p>
    </button>
  );
}
