import { NextRequest, NextResponse } from "next/server";
import { decryptWebhookNotification, getPayByLinkWebhookSecret } from "@/lib/paybylink";
import { loadOrder, PaymentStatusUnavailableError, settleOrderPayment } from "@/lib/payment-settlement";

function acknowledge(result: string) {
  return NextResponse.json({ received: true, result });
}

export async function POST(request: NextRequest) {
  const key = getPayByLinkWebhookSecret();
  if (!key) {
    return NextResponse.json({ code: "WEBHOOK_NOT_CONFIGURED" }, { status: 503 });
  }

  const notification = decryptWebhookNotification(
    key,
    await request.text(),
    request.headers.get("x-initialization-vector"),
    request.headers.get("x-authentication-tag"),
  );
  if (!notification) {
    return NextResponse.json({ code: "INVALID_SIGNATURE" }, { status: 401 });
  }

  if (notification.type !== "PAYMENT") return acknowledge("ignored");

  const reference = notification.payload?.merchantTransactionId;
  const checkoutId = notification.payload?.ndc || notification.payload?.checkoutId;
  if (!reference || !checkoutId) {
    console.error("Payment webhook without merchantTransactionId or checkout id");
    return acknowledge("ignored");
  }

  try {
    const order = await loadOrder({ orderNumber: reference });
    if (!order?.paymentId) {
      console.error(`Payment webhook for unknown order ${reference}`);
      return acknowledge("unknown-order");
    }

    const result = await settleOrderPayment(order, order.paymentId, checkoutId);
    return acknowledge(result.verification);
  } catch (error) {
    console.error("Payment webhook processing failed:", error);
    const retryable = error instanceof PaymentStatusUnavailableError;
    return NextResponse.json({ code: retryable ? "STATUS_UNAVAILABLE" : "SERVER_ERROR" }, { status: retryable ? 503 : 500 });
  }
}
