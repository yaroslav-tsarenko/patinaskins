import { STORE_POLICY } from "@/config/store-policy";
import { COMPANY } from "@/lib/company";
import { BRAND } from "@/lib/brand";
import { RESTRICTED_TERRITORIES, RESTRICTED_TERRITORIES_STATEMENT, restrictedCountriesSentence } from "@/config/restricted-countries";

function money(amount: number, currency: string = STORE_POLICY.currency) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function listJoin(items: readonly string[], conjunction = "and") {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} ${conjunction} ${items[items.length - 1]}`;
}

function longDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
}

const s = STORE_POLICY.shipping;
const r = STORE_POLICY.returns;

export const POLICY_FACTS = {
  brand: BRAND.name,
  domain: BRAND.domain,
  company: COMPANY.name,
  companyNumber: COMPANY.companyNumber,
  registeredOffice: COMPANY.registeredOffice,
  companyCountry: COMPANY.country,
  email: COMPANY.email,
  phone: COMPANY.phone,
  supportHours: COMPANY.supportHours,
  replyTime: STORE_POLICY.support.replyTime,
  vatRegistered: COMPANY.vatRegistered,
  minAge: STORE_POLICY.minAge,
  currencies: listJoin(STORE_POLICY.supportedCurrencies),
  baseCurrency: STORE_POLICY.currency,
  cardMethods: listJoin(STORE_POLICY.payment.methods),
  paymentProvider: STORE_POLICY.payment.providerName ?? "our payment provider",
  paymentProviderNamed: STORE_POLICY.payment.providerName,
  deliveryCost: money(s.standardCost),
  freeThreshold: money(s.freeThreshold),
  processingDays: s.processingDays,
  dispatchFrom: s.dispatchFrom,
  deliveryEu: s.deliveryTimes.eu,
  deliveryUk: s.deliveryTimes.uk,
  ukImportNote: s.ukImportNote,
  deliveryDeadlineDays: STORE_POLICY.orders.deliveryDeadlineDays,
  lateDeliveryNote: STORE_POLICY.orders.lateDeliveryNote,
  deliveryCountries: listJoin(s.countries),
  withdrawalDays: r.withdrawalDays,
  returnShipDays: r.returnShipDays,
  refundDays: r.refundDays,
  warrantyMonths: STORE_POLICY.warranty.months,
  maxQtyPerItem: STORE_POLICY.limits.maxQtyPerItem,
  maxItemsPerOrder: STORE_POLICY.limits.maxItemsPerOrder,
  complaintsAck: STORE_POLICY.complaints.acknowledgeTime,
  complaintsDays: STORE_POLICY.complaints.responseDays,
  retention: STORE_POLICY.retention,
  lastUpdated: longDate(STORE_POLICY.policiesLastUpdated),
  lastUpdatedIso: STORE_POLICY.policiesLastUpdated,
  governingLaw: `the laws of ${COMPANY.country}`,
  courts: `the courts of ${COMPANY.country}`,
  restrictedCountries: restrictedCountriesSentence(),
  restrictedTerritories: `the temporarily occupied territories of Ukraine (${listJoin(RESTRICTED_TERRITORIES)})`,
  restrictedTerritoriesStatement: RESTRICTED_TERRITORIES_STATEMENT,
} as const;

export { money as formatPolicyMoney, listJoin };
