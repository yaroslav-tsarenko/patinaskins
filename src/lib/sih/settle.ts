import { prisma } from "@/lib/prisma";
import { scheduleEmail } from "@/lib/email-jobs";
import { sendOrderConfirmationEmail, sendOrderInvoiceEmail } from "@/lib/email";
import { sendAlert } from "@/lib/alerts/telegram";
import { displayOrderNumber, toNumber } from "@/lib/orders";
import type { TransfermitWebhook } from "@/lib/payments/transfermit";
import { logSihEvent } from "./orders";
import { submitOrderToSih } from "./checkout";
import { loadOrderForEmail, notifyItemRefunded, orderEmailPayload, refreshOrderStatus } from "./order-status";

export type SettlementOutcome = "paid" | "already_paid" | "failed" | "refunded" | "review" | "ignored" | "recorded";

async function logAll(orderId: string, payload: Record<string, unknown>) {
  const items = await prisma.sihOrder.findMany({ where: { orderId }, select: { id: true } });
  for (const item of items) await logSihEvent({ orderId: item.id, source: "payment", payload });
}

export async function settleTransfermitEvent(event: TransfermitWebhook): Promise<SettlementOutcome> {
  const { id: paymentId, state, referenceId, paymentType } = event;
  if (!referenceId) return "ignored";
  const order = await prisma.order.findUnique({ where: { id: referenceId }, include: { sihOrders: { select: { id: true, status: true } } } });
  if (!order) return "ignored";

  await logAll(order.id, { paymentId, state, paymentType, amount: event.amount ?? null, currency: event.currency ?? null });

  if (paymentType === "REFUND") {
    if (state !== "COMPLETED") return "recorded";
    const refundable = order.sihOrders.filter((s) => s.status === "refund_pending" || s.status === "rolled_back");
    for (const item of refundable) {
      const claim = await prisma.sihOrder.updateMany({
        where: { id: item.id, status: { in: ["refund_pending", "rolled_back"] } },
        data: { status: "refunded", refundedAt: new Date() },
      });
      if (claim.count > 0) {
        await logSihEvent({ orderId: item.id, source: "payment", fromStatus: item.status, toStatus: "refunded" });
        await notifyItemRefunded(item.id);
      }
    }
    await refreshOrderStatus(order.id);
    return "refunded";
  }

  switch (state) {
    case "COMPLETED": {
      if (order.paymentId && paymentId && order.paymentId !== paymentId) {
        await sendAlert(`Payment ${paymentId} completed for order <b>${order.id}</b> but the order expects payment ${order.paymentId}. Held for review.`, "critical");
        return "review";
      }
      const expected = toNumber(order.chargeTotal ?? order.total);
      const amount = event.amount != null && event.amount !== "" ? Number(event.amount) : null;
      const amountOk = amount === null || (Number.isFinite(amount) && Math.round(amount * 100) === Math.round(expected * 100));
      const currencyOk = !event.currency || event.currency.toUpperCase() === order.currency.toUpperCase();
      if (!amountOk || !currencyOk) {
        const note = `Payment ${paymentId ?? "?"} reported ${amount ?? "?"} ${event.currency ?? "?"}; expected ${expected.toFixed(2)} ${order.currency}. Held for review.`;
        if (!order.notes?.includes(note)) {
          await prisma.order.update({ where: { id: order.id }, data: { notes: [order.notes, note].filter(Boolean).join("\n") } });
        }
        await sendAlert(`Order <b>${displayOrderNumber(order.orderNumber)}</b>: ${note}`, "critical");
        return "review";
      }

      const claimed = await prisma.order.updateMany({
        where: { id: order.id, paymentStatus: { not: "PAID" }, status: { not: "REFUNDED" } },
        data: { paymentStatus: "PAID", status: "CONFIRMED", paidAt: new Date(), ...(paymentId ? { paymentId } : {}) },
      });
      if (claimed.count > 0) {
        const paidAt = new Date();
        const items = await prisma.sihOrder.findMany({
          where: { orderId: order.id, OR: [{ status: "awaiting_payment" }, { status: "failed", sihError: { startsWith: "payment_" } }] },
          select: { id: true, status: true },
        });
        for (const item of items) {
          const flip = await prisma.sihOrder.updateMany({ where: { id: item.id, status: item.status }, data: { status: "paid", paidAt, sihError: null } });
          if (flip.count > 0) await logSihEvent({ orderId: item.id, source: "payment", fromStatus: item.status, toStatus: "paid" });
        }
        const full = await loadOrderForEmail(order.id);
        if (full) {
          const payload = orderEmailPayload(full);
          scheduleEmail(`order confirmation ${full.orderNumber}`, () => sendOrderConfirmationEmail(payload));
          scheduleEmail(`order invoice ${full.orderNumber}`, () => sendOrderInvoiceEmail(payload));
        }
      }
      const toSubmit = await prisma.sihOrder.findMany({ where: { orderId: order.id, status: "paid" }, select: { id: true } });
      for (const item of toSubmit) await submitOrderToSih(item.id);
      await refreshOrderStatus(order.id);
      return claimed.count > 0 ? "paid" : "already_paid";
    }
    case "DECLINED":
    case "ERROR":
    case "CANCELLED": {
      const flipped = await prisma.order.updateMany({
        where: { id: order.id, paymentStatus: "PENDING" },
        data: { paymentStatus: "FAILED", status: "CANCELLED" },
      });
      if (flipped.count > 0) {
        const reason = `payment_${String(state).toLowerCase()}`;
        for (const item of order.sihOrders.filter((s) => s.status === "awaiting_payment")) {
          const flip = await prisma.sihOrder.updateMany({ where: { id: item.id, status: "awaiting_payment" }, data: { status: "failed", sihError: reason } });
          if (flip.count > 0) await logSihEvent({ orderId: item.id, source: "payment", fromStatus: "awaiting_payment", toStatus: "failed" });
        }
      }
      return "failed";
    }
    default:
      return "recorded";
  }
}
