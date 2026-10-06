import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { SITE_URL } from "@/lib/brand";
import { buildQuote, CheckoutError, publicQuote } from "@/lib/checkout";
import { checkoutRequestSchema } from "@/lib/validators/checkout";
import { composePhone } from "@/lib/validators/fields";
import { dialCodeFor } from "@/lib/countries";
import { createPaymentLink, getPayByLinkConfig } from "@/lib/paybylink";

export async function POST(request: NextRequest) {
  try {
    const body = checkoutRequestSchema.parse(await request.json());
    const payment = getPayByLinkConfig();
    if (!payment) {
      return NextResponse.json({ code: "PAYMENT_UNAVAILABLE" }, { status: 503 });
    }

    const user = await getSessionUser();
    const { form } = body;
    const email = form.contact.email.toLowerCase();
    const quote = await buildQuote({ ...body, userId: user?.id ?? null, email });

    if (Math.abs(quote.charge.total - body.expectedTotal) > 0.009) {
      return NextResponse.json({ code: "TOTAL_CHANGED", quote: publicQuote(quote) }, { status: 409 });
    }

    const phone = composePhone(form.contact.phoneCountry, form.contact.phone, dialCodeFor(form.contact.phoneCountry));
    const shippingAddress = {
      firstName: form.contact.firstName,
      lastName: form.contact.lastName,
      address1: form.delivery.street,
      address2: form.delivery.address2 || null,
      city: form.delivery.city,
      postalCode: form.delivery.postcode,
      country: form.delivery.country.toUpperCase(),
    };
    const billing = form.billingSameAsDelivery || !form.billing
      ? shippingAddress
      : {
          firstName: form.billing.firstName ?? "",
          lastName: form.billing.lastName ?? "",
          address1: form.billing.street ?? "",
          address2: form.billing.address2 || null,
          city: form.billing.city ?? "",
          postalCode: form.billing.postcode ?? "",
          country: (form.billing.country ?? "").toUpperCase(),
        };

    const order = await prisma.order.create({
      data: {
        user: user?.id ? { connect: { id: user.id } } : undefined,
        customerName: `${form.contact.firstName} ${form.contact.lastName}`,
        customerEmail: email,
        customerPhone: phone,
        shippingAddress,
        billingAddress: billing,
        shippingMethod: form.shippingMethod,
        shippingCost: quote.base.shipping,
        subtotal: quote.base.subtotal,
        taxAmount: quote.base.vat,
        discountAmount: quote.base.discount,
        discountCode: quote.discount?.code ?? null,
        discountPercent: quote.discount?.percent ?? null,
        total: quote.base.total,
        currency: quote.currency,
        exchangeRate: quote.rate,
        chargeTotal: quote.charge.total,
        termsAcceptedAt: new Date(),
        paymentMethod: "card",
        items: {
          create: quote.lines.map((line, index) => ({
            productId: line.productId,
            productName: line.name,
            productSku: line.sku,
            variantName: line.variantName,
            quantity: line.quantity,
            price: line.basePrice,
            total: quote.base.lines[index].total,
          })),
        },
      },
    });

    try {
      const link = await createPaymentLink(payment, {
        amount: quote.charge.total,
        currency: quote.currency,
        merchantTransactionId: order.orderNumber,
        shopperResultUrl: `${SITE_URL}/order/confirmed`,
        customer: { givenName: form.contact.firstName, surname: form.contact.lastName, email, mobile: phone },
        billing: { street1: billing.address1, city: billing.city, postcode: billing.postalCode, country: billing.country },
        items: quote.lines.map((line) => ({ id: line.productId, name: line.name, unit: line.unit, quantity: line.quantity, total: line.total })),
      });
      await prisma.order.update({ where: { id: order.id }, data: { paymentId: link.id } });
      return NextResponse.json({ orderId: order.id, paymentLink: link.link }, { status: 201 });
    } catch (error) {
      console.error("Payment link creation failed:", error);
      await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: "FAILED", status: "CANCELLED" } });
      return NextResponse.json({ code: "PAYMENT_LINK_FAILED" }, { status: 502 });
    }
  } catch (error) {
    if (error instanceof CheckoutError) {
      return NextResponse.json({ code: error.code, ...error.details }, { status: error.status });
    }
    if (error instanceof ZodError) {
      return NextResponse.json({ code: "INVALID_REQUEST", issues: error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) }, { status: 400 });
    }
    console.error("Checkout failed:", error);
    return NextResponse.json({ code: "SERVER_ERROR" }, { status: 500 });
  }
}
