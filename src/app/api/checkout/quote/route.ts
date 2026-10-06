import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getSessionUser } from "@/lib/auth";
import { buildQuote, CheckoutError, publicQuote } from "@/lib/checkout";
import { checkoutQuoteSchema } from "@/lib/validators/checkout";

export async function POST(request: NextRequest) {
  try {
    const body = checkoutQuoteSchema.parse(await request.json());
    const user = await getSessionUser();
    const quote = await buildQuote({ ...body, userId: user?.id ?? null, email: user?.email ?? null });
    return NextResponse.json(publicQuote(quote));
  } catch (error) {
    if (error instanceof CheckoutError) {
      return NextResponse.json({ code: error.code, ...error.details }, { status: error.status });
    }
    if (error instanceof ZodError) {
      return NextResponse.json({ code: "INVALID_REQUEST" }, { status: 400 });
    }
    console.error("Checkout quote failed:", error);
    return NextResponse.json({ code: "SERVER_ERROR" }, { status: 500 });
  }
}
