import { NextRequest, NextResponse } from "next/server";
import { orderView } from "@/lib/orders";
import { loadOrder, PaymentStatusUnavailableError, settleOrderPayment } from "@/lib/payment-settlement";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentLinkId = searchParams.get("paymentLinkId") || searchParams.get("id");
    const checkoutId = searchParams.get("checkoutId");

    if (!paymentLinkId || !checkoutId) {
      return NextResponse.json({ code: "MISSING_REFERENCE" }, { status: 400 });
    }

    const order = await loadOrder({ paymentId: paymentLinkId });
    if (!order) {
      return NextResponse.json({ code: "ORDER_NOT_FOUND" }, { status: 404 });
    }

    try {
      const result = await settleOrderPayment(order, paymentLinkId, checkoutId);
      return NextResponse.json({ verification: result.verification, order: orderView(result.order) });
    } catch (error) {
      if (!(error instanceof PaymentStatusUnavailableError)) throw error;
      console.error("Payment status check failed:", error);
      return NextResponse.json({ verification: "pending", order: orderView(order) });
    }
  } catch (error) {
    console.error("Error verifying order payment:", error);
    return NextResponse.json({ code: "SERVER_ERROR" }, { status: 500 });
  }
}
