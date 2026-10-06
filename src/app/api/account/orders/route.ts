import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { ORDER_VIEW_INCLUDE, orderView } from "@/lib/orders";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ code: "UNAUTHORISED" }, { status: 401 });
  const orders = await prisma.order.findMany({
    where: { userId: user.id, NOT: { paymentStatus: "FAILED" } },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: ORDER_VIEW_INCLUDE,
  });
  return NextResponse.json({ orders: orders.map(orderView) });
}
