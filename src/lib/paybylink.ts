import { createDecipheriv } from "crypto";

export type PaymentOutcome = "paid" | "pending" | "failed";

const SUCCESS = /^(000\.000\.|000\.100\.1|000\.[36])/;
const PENDING = /^(000\.200|800\.400\.5|100\.400\.500)/;

export const PAYMENT_METHOD_LABEL = "Card payment (Visa or Mastercard) on the secure payment page";

interface PayByLinkConfig {
  baseUrl: string;
  entityId: string;
  token: string;
}

export function getPayByLinkConfig(): PayByLinkConfig | null {
  const baseUrl = process.env.PAYBYLINK_BASE_URL?.trim();
  const entityId = process.env.PAYBYLINK_ENTITY_ID?.trim();
  const token = process.env.PAYBYLINK_AUTH_TOKEN?.trim();
  if (!baseUrl || !entityId || !token) return null;
  return { baseUrl: baseUrl.replace(/\/+$/, ""), entityId, token };
}

export function classifyResultCode(code: string | undefined | null): PaymentOutcome {
  const value = code ?? "";
  if (SUCCESS.test(value)) return "paid";
  if (PENDING.test(value)) return "pending";
  return "failed";
}

export interface PaymentLinkRequest {
  amount: number;
  currency: string;
  merchantTransactionId: string;
  shopperResultUrl: string;
  customer: { givenName: string; surname: string; email: string; mobile?: string | null };
  billing: { street1: string; city: string; postcode: string; country: string };
  items: { id: string; name: string; unit: number; quantity: number; total: number }[];
}

export async function createPaymentLink(config: PayByLinkConfig, req: PaymentLinkRequest): Promise<{ id: string; link: string }> {
  const params = new URLSearchParams();
  params.append("entityId", config.entityId);
  params.append("amount", req.amount.toFixed(2));
  params.append("currency", req.currency);
  params.append("paymentType", "DB");
  params.append("merchantTransactionId", req.merchantTransactionId);
  params.append("shopperResultUrl", req.shopperResultUrl);
  params.append("customer.givenName", req.customer.givenName);
  params.append("customer.surname", req.customer.surname);
  params.append("customer.email", req.customer.email);
  if (req.customer.mobile) params.append("customer.mobile", req.customer.mobile);
  params.append("collectBilling", "street1,postcode,city,country");
  params.append("mandatoryBilling", "street1,postcode,city,country");
  params.append("billing.street1", req.billing.street1);
  params.append("billing.city", req.billing.city);
  params.append("billing.postcode", req.billing.postcode);
  params.append("billing.country", req.billing.country);
  req.items.forEach((item, index) => {
    params.append(`cart.items[${index}].currency`, req.currency);
    params.append(`cart.items[${index}].description`, item.name);
    params.append(`cart.items[${index}].merchantItemId`, item.id);
    params.append(`cart.items[${index}].name`, item.name);
    params.append(`cart.items[${index}].price`, item.unit.toFixed(2));
    params.append(`cart.items[${index}].quantity`, String(item.quantity));
    params.append(`cart.items[${index}].totalAmount`, item.total.toFixed(2));
  });

  const res = await fetch(`${config.baseUrl}/paybylink/v1`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Bearer ${config.token}`,
    },
    body: params.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Payment link request failed (${res.status}): ${text.slice(0, 300)}`);
  }
  const data = (await res.json()) as { id?: string; link?: string };
  if (!data.id || !data.link) throw new Error("Payment link response is missing id or link");
  return { id: data.id, link: data.link };
}

export interface PaymentStatus {
  outcome: PaymentOutcome;
  code: string;
  amount: number | null;
  currency: string | null;
}

export async function fetchPaymentStatus(config: PayByLinkConfig, paymentLinkId: string, checkoutId: string): Promise<PaymentStatus> {
  const url = `${config.baseUrl}/paybylink/v1/${encodeURIComponent(paymentLinkId)}/checkouts/${encodeURIComponent(checkoutId)}/payment?entityId=${encodeURIComponent(config.entityId)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${config.token}` }, cache: "no-store" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Payment status request failed (${res.status}): ${text.slice(0, 300)}`);
  }
  const data = (await res.json()) as { result?: { code?: string }; amount?: string | number; currency?: string };
  const code = data.result?.code ?? "";
  return {
    outcome: classifyResultCode(code),
    code,
    amount: data.amount != null && data.amount !== "" ? Number(data.amount) : null,
    currency: data.currency ?? null,
  };
}

const HEX = /^[0-9a-f]+$/i;

export function getPayByLinkWebhookSecret(): Buffer | null {
  const secret = process.env.PAYBYLINK_WEBHOOK_SECRET?.trim();
  if (!secret || secret.length !== 64 || !HEX.test(secret)) return null;
  return Buffer.from(secret, "hex");
}

export interface WebhookNotification {
  type?: string;
  payload?: {
    id?: string;
    ndc?: string;
    checkoutId?: string;
    merchantTransactionId?: string;
    result?: { code?: string };
  };
}

export function decryptWebhookNotification(key: Buffer, body: string, iv: string | null, tag: string | null): WebhookNotification | null {
  const cipherText = body.trim();
  if (!iv || !tag || !HEX.test(iv) || !HEX.test(tag) || !cipherText || !HEX.test(cipherText)) return null;
  try {
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "hex"));
    decipher.setAuthTag(Buffer.from(tag, "hex"));
    const plain = Buffer.concat([decipher.update(Buffer.from(cipherText, "hex")), decipher.final()]).toString("utf8");
    const parsed: unknown = JSON.parse(plain);
    return parsed && typeof parsed === "object" ? (parsed as WebhookNotification) : null;
  } catch {
    return null;
  }
}
