import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { ORDER_VIEW_INCLUDE, orderView } from "@/lib/orders";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ code: "UNAUTHORISED" }, { status: 401 });
  const order = await prisma.order.findFirst({ where: { id, userId: user.id }, include: ORDER_VIEW_INCLUDE });
  if (!order) return NextResponse.json({ code: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ order: orderView(order) });
}
