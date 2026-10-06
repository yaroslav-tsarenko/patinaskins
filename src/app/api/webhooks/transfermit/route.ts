import { NextResponse } from "next/server";
import { hasEnv } from "@/lib/env";
import { verifyTransfermitSignature, type TransfermitWebhook } from "@/lib/payments/transfermit";
import { settleTransfermitEvent } from "@/lib/sih/settle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  if (!hasEnv("TRANSFERMIT_WEBHOOK_SECRET")) {
    return NextResponse.json({ code: "WEBHOOK_NOT_CONFIGURED" }, { status: 503 });
  }
  const rawBody = await req.text();
  const signature = req.headers.get("signature") || req.headers.get("x-signature");
  if (!verifyTransfermitSignature(rawBody, signature)) {
    return NextResponse.json({ code: "INVALID_SIGNATURE" }, { status: 401 });
  }

  let payload: TransfermitWebhook;
  try {
    payload = JSON.parse(rawBody) as TransfermitWebhook;
  } catch {
    return NextResponse.json({ code: "INVALID_JSON" }, { status: 400 });
  }
  if (!payload.referenceId) return NextResponse.json({ code: "MISSING_REFERENCE" }, { status: 400 });

  try {
    const result = await settleTransfermitEvent(payload);
    return NextResponse.json({ received: true, result });
  } catch (error) {
    console.error("[transfermit-webhook] processing failed:", error);
    return NextResponse.json({ code: "SERVER_ERROR" }, { status: 500 });
  }
}
