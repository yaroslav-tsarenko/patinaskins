import { prisma } from "@/lib/prisma";
import { STORE_POLICY } from "@/config/store-policy";
import { computeTotals, itemQuantityCap, rateConverter, type Totals } from "@/lib/pricing";
import { getRate, isSupportedCurrency, type SupportedCurrency } from "@/lib/exchange-rates";
import { resolveDiscount, type ResolvedDiscount } from "@/lib/discounts";

export class CheckoutError extends Error {
  constructor(
    public code: string,
    public status = 400,
    public details?: Record<string, unknown>,
  ) {
    super(code);
  }
}

export interface QuoteInput {
  items: { productId: string; quantity: number; variantName?: string | null }[];
  currency?: string;
  discountCode?: string | null;
  userId?: string | null;
  email?: string | null;
}

export interface QuoteLine {
  productId: string;
  name: string;
  sku: string;
  variantName: string | null;
  quantity: number;
  basePrice: number;
  unit: number;
  total: number;
}

export interface Quote {
  currency: SupportedCurrency;
  rate: number;
  discount: ResolvedDiscount | null;
  codeRejected: boolean;
  lines: QuoteLine[];
  base: Totals;
  charge: Totals;
}

export async function buildQuote(input: QuoteInput): Promise<Quote> {
  const currency: SupportedCurrency = isSupportedCurrency(input.currency) ? input.currency : (STORE_POLICY.currency as SupportedCurrency);
  if (input.items.length === 0) throw new CheckoutError("CART_EMPTY");

  const ids = Array.from(new Set(input.items.map((item) => item.productId)));
  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, sku: true, price: true, quantity: true, trackInventory: true, status: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const perProduct = new Map<string, number>();
  let itemCount = 0;
  for (const item of input.items) {
    const product = byId.get(item.productId);
    if (!product || product.status !== "ACTIVE") {
      throw new CheckoutError("PRODUCT_UNAVAILABLE", 409, { productId: item.productId, name: product?.name ?? null });
    }
    perProduct.set(item.productId, (perProduct.get(item.productId) ?? 0) + item.quantity);
    itemCount += item.quantity;
  }
  if (itemCount > STORE_POLICY.limits.maxItemsPerOrder) {
    throw new CheckoutError("ORDER_LIMIT", 409, { max: STORE_POLICY.limits.maxItemsPerOrder });
  }
  for (const [productId, quantity] of perProduct) {
    const product = byId.get(productId)!;
    const cap = itemQuantityCap(product.trackInventory ? product.quantity : null);
    if (quantity > cap) {
      throw new CheckoutError(product.trackInventory && product.quantity < STORE_POLICY.limits.maxQtyPerItem ? "OUT_OF_STOCK" : "ITEM_LIMIT", 409, {
        productId,
        name: product.name,
        available: cap,
      });
    }
  }

  const code = input.discountCode?.trim() || null;
  const discount = await resolveDiscount({ userId: input.userId ?? null, email: input.email ?? null, code });
  const codeRejected = code !== null && !(discount && discount.source === "code" && discount.code === code.toUpperCase());
  const discountPercent = discount?.percent ?? 0;

  const rate = await getRate(currency);
  const pricingLines = input.items.map((item) => ({ price: Number(byId.get(item.productId)!.price), quantity: item.quantity }));
  const base = computeTotals(pricingLines, { discountPercent });
  const charge = computeTotals(pricingLines, { discountPercent, convert: rateConverter(rate) });

  const lines: QuoteLine[] = input.items.map((item, index) => {
    const product = byId.get(item.productId)!;
    return {
      productId: product.id,
      name: product.name,
      sku: product.sku,
      variantName: item.variantName ?? null,
      quantity: item.quantity,
      basePrice: pricingLines[index].price,
      unit: charge.lines[index].unit,
      total: charge.lines[index].total,
    };
  });

  return { currency, rate, discount, codeRejected, lines, base, charge };
}

export function publicQuote(quote: Quote) {
  return {
    currency: quote.currency,
    discount: quote.discount ? { type: quote.discount.type, percent: quote.discount.percent, code: quote.discount.code, source: quote.discount.source } : null,
    codeRejected: quote.codeRejected,
    lines: quote.lines.map(({ productId, name, variantName, quantity, unit, total }) => ({ productId, name, variantName, quantity, unit, total })),
    totals: quote.charge,
  };
}

export type PublicQuote = ReturnType<typeof publicQuote>;
