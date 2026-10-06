import { COMPANY } from "@/lib/company";

const DISPATCH_COUNTRY = "Spain";
const DELIVERY_DEADLINE_DAYS = 30;

export const STORE_POLICY = {
  currency: "GBP",
  supportedCurrencies: ["GBP", "EUR", "USD"],
  vatRegistered: COMPANY.vatRegistered,
  tax: {
    vatRatePercent: 20,
    pricesIncludeVat: true,
  },
  shipping: {
    standardCost: 5.99,
    freeThreshold: 75,
    processingDays: "1–2 business days",
    dispatchCountry: DISPATCH_COUNTRY,
    dispatchFrom: `our fulfilment warehouse in ${DISPATCH_COUNTRY}`,
    deliveryTimes: {
      eu: "3–6 business days after dispatch",
      uk: "4–8 business days after dispatch",
    },
    ukImportNote:
      "Orders to the United Kingdom are shipped from the EU. The carrier may charge import VAT, duty or a handling fee on delivery; these charges are not included in our prices and are payable by the recipient.",
    countries: ["United Kingdom", "European Union member states"],
  },
  returns: {
    withdrawalDays: 14,
    returnShipDays: 14,
    refundDays: 14,
    returnShippingPaidBy: "customer",
    faultyReturnShippingPaidBy: "us",
  },
  warranty: {
    months: 24,
  },
  limits: {
    maxQtyPerItem: 10,
    maxItemsPerOrder: 40,
  },
  minAge: 18,
  policiesLastUpdated: "2026-10-06",
  support: {
    replyTime: "within 1 business day",
    channels: ["email", "contact form"],
  },
  payment: {
    methods: ["Visa", "Mastercard"],
    providerName: null as string | null,
    chargeCurrencies: ["GBP", "EUR", "USD"],
  },
  orders: {
    cancelBefore: "dispatch",
    deliveryDeadlineDays: DELIVERY_DEADLINE_DAYS,
    lateDeliveryNote: `If your order is late, contact us and we trace the parcel with the carrier. If it has not been delivered within ${DELIVERY_DEADLINE_DAYS} days of the estimated delivery date, you can cancel the order for a full refund, or choose a replacement.`,
  },
  complaints: {
    acknowledgeTime: "within 1 business day",
    responseDays: 14,
  },
  processors: [
    { role: "Card payments", purpose: "Takes card payments on its own hosted page and runs 3-D Secure checks", name: null as string | null },
    { role: "Fulfilment warehouse", purpose: `Picks, packs and hands your order to the carrier in ${DISPATCH_COUNTRY}`, name: null as string | null },
    { role: "Delivery carriers", purpose: "Deliver parcels and send tracking updates", name: null as string | null },
    { role: "Website hosting and database", purpose: "Runs the store and stores account and order records", name: null as string | null },
    { role: "Email delivery", purpose: "Sends order, account and support emails", name: null as string | null },
    { role: "Image storage", purpose: "Stores and serves product photographs", name: null as string | null },
  ],
  retention: {
    orderRecordsYears: 6,
    supportMessagesMonths: 24,
    inactiveAccountYears: 3,
  },
} as const;
