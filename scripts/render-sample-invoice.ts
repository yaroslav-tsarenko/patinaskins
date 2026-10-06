import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { renderInvoicePdf, type InvoiceSource } from "../src/lib/invoice";

const sample: InvoiceSource = {
  orderNumber: "cmsample0000000000brm4k2q7",
  customerName: "Zofia Łukasiewicz",
  customerEmail: "zofia@example.com",
  currency: "EUR",
  exchangeRate: 1.17,
  discountPercent: 10,
  shippingCost: 5.99,
  paymentMethod: "card",
  createdAt: new Date("2026-10-04T09:12:00Z"),
  paidAt: new Date("2026-10-04T09:15:00Z"),
  shippingAddress: { firstName: "Zofia", lastName: "Łukasiewicz", address1: "ul. Długa 14/3", city: "Kraków", postalCode: "31-147", country: "PL" },
  billingAddress: { firstName: "Zofia", lastName: "Łukasiewicz", address1: "ul. Długa 14/3", city: "Kraków", postalCode: "31-147", country: "PL" },
  items: [
    { productName: "Enamelled cast iron casserole, 24 cm, with self-basting lid and stainless steel knob", variantName: "Colour: Cream", quantity: 1, price: 64.95 },
    { productName: "Stoneware dinner plate, 27 cm", variantName: null, quantity: 4, price: 8.5 },
    { productName: "Borosilicate glass tumbler set (6 pieces)", variantName: "Capacity: 350 ml", quantity: 2, price: 14.99 },
  ],
};

async function main() {
  const out = resolve(process.argv[2] || "invoice-sample.pdf");
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, await renderInvoicePdf(sample));
  console.log(`Wrote ${out}`);
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
