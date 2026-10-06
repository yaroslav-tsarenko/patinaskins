import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

export const PAYMENT_METHOD_LABEL = "Card payment (Visa or Mastercard) on the secure payment page";

export interface CreatePaymentCustomer {
  referenceId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  ip: string;
}

export interface CreatePaymentBillingAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  countryCode: string;
  postalCode: string;
  state?: string;
}

export interface CreatePaymentPayload {
  amount: number;
  currency: string;
  referenceId: string;
  description: string;
  customer: CreatePaymentCustomer;
  billingAddress: CreatePaymentBillingAddress;
  returnUrl: string;
  webhookUrl: string;
}

export interface CreatePaymentResponse {
  result?: {
    id: string;
    redirectUrl?: string;
    state: string;
    paymentMethod: string;
    amount: number;
    currency: string;
  };
  error?: string;
  message?: string;
}

export interface TransfermitWebhook {
  id?: string;
  state?: string;
  referenceId?: string;
  paymentType?: string;
  amount?: number | string;
  currency?: string;
}

export function transfermitSafeName(raw: string | null | undefined, fallback: string): string {
  const cleaned = (raw ?? "").replace(/[^\p{L} ]/gu, " ").replace(/\s+/g, " ").trim();
  return cleaned || fallback;
}

export async function createTransfermitPayment(data: CreatePaymentPayload): Promise<CreatePaymentResponse> {
  const payload = {
    paymentType: "DEPOSIT",
    paymentMethod: "BASIC_CARD",
    amount: data.amount,
    currency: data.currency,
    description: data.description,
    referenceId: data.referenceId,
    customer: data.customer,
    billingAddress: data.billingAddress,
    returnUrl: data.returnUrl,
    webhookUrl: data.webhookUrl,
  };

  const response = await fetch(env.TRANSFERMIT_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.TRANSFERMIT_API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(20_000),
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(`Transfermit request failed with status ${response.status}: ${responseText.slice(0, 300)}`);
  }
  return JSON.parse(responseText) as CreatePaymentResponse;
}

export function verifyTransfermitSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", env.TRANSFERMIT_WEBHOOK_SECRET).update(rawBody).digest("hex");
  const a = Buffer.from(signature.trim());
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
