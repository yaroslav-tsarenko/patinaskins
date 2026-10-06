import Link from "next/link";
import { PolicyLayout, policyMetadata, policyTable, type PolicySection } from "@/components/layout/PolicyLayout/PolicyLayout";
import { POLICY_FACTS as F } from "@/lib/policy-facts";

export const generateMetadata = policyMetadata(
  "shipping",
  `Orders ship from Spain within ${F.processingDays}. EU delivery ${F.deliveryEu}, UK ${F.deliveryUk}. ${F.deliveryCost} per order, free from ${F.freeThreshold}.`,
);

const sections: PolicySection[] = [
  {
    id: "where",
    title: "Where we deliver",
    body: (
      <>
        <p>
          We deliver to the {F.deliveryCountries}. Checkout lists the countries we deliver to. We do not deliver to {F.restrictedCountries},
          or to {F.restrictedTerritories}.
        </p>
        <p>We deliver to street addresses. Please check the address carefully before you pay.</p>
      </>
    ),
  },
  {
    id: "dispatch",
    title: "Where orders ship from",
    body: (
      <p>
        Every order is packed and dispatched from {F.dispatchFrom}. We dispatch within {F.processingDays} of your payment being confirmed.
        Business days are Monday to Friday, excluding public holidays in Spain. Orders placed at the weekend are processed from the next
        business day.
      </p>
    ),
  },
  {
    id: "times-costs",
    title: "Delivery times and costs",
    body: (
      <>
        <div className="overflow-x-auto">
          <table className={policyTable}>
            <thead>
              <tr>
                <th scope="col">Destination</th>
                <th scope="col">Dispatch</th>
                <th scope="col">Delivery</th>
                <th scope="col">Cost</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-medium text-ink">European Union</td>
                <td>{F.processingDays}</td>
                <td>{F.deliveryEu}</td>
                <td className="tabular">{F.deliveryCost}, free from {F.freeThreshold}</td>
              </tr>
              <tr>
                <td className="font-medium text-ink">United Kingdom</td>
                <td>{F.processingDays}</td>
                <td>{F.deliveryUk}</td>
                <td className="tabular">{F.deliveryCost}, free from {F.freeThreshold}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          The delivery charge is one charge per order, shown in your selected currency at checkout before you pay. The free delivery threshold
          applies to the value of the goods after any discount. Delivery times are estimates from the carrier, not guaranteed dates.
        </p>
      </>
    ),
  },
  {
    id: "uk-duties",
    title: "Import duties for UK orders",
    body: <p>{F.ukImportNote}</p>,
  },
  {
    id: "tracking",
    title: "Tracking",
    body: (
      <p>
        When your order is dispatched we email you, with the tracking number where the carrier provides one. If you have an account, the
        order and its status are also under <Link href="/account/orders">Your orders</Link>.
      </p>
    ),
  },
  {
    id: "failed",
    title: "If delivery fails",
    body: (
      <>
        <p>
          If nobody is available, the carrier will usually leave a notice, try again or hold the parcel for collection. Follow the carrier&rsquo;s
          instructions in the tracking message.
        </p>
        <p>
          If a parcel is returned to us because it could not be delivered, for example because the address was incomplete or it was not
          collected, we contact you. We can send it again for a new delivery charge, or refund the items and the original delivery charge, less
          the return shipping cost charged to us by the carrier.
        </p>
      </>
    ),
  },
  {
    id: "late-damaged",
    title: "Late, lost or damaged parcels",
    body: (
      <>
        <p>{F.lateDeliveryNote}</p>
        <p>
          If a parcel arrives damaged, keep the packaging and email us photographs with your order number. Damaged items are replaced or
          refunded at no cost to you. See <Link href="/policies/returns">Returns and refunds</Link>.
        </p>
      </>
    ),
  },
  {
    id: "risk",
    title: "When the goods become yours",
    body: (
      <p>
        Goods are our responsibility until they are delivered to you or to a person you name. They become your property once we have received
        payment in full.
      </p>
    ),
  },
];

export default async function ShippingPage() {
  return <PolicyLayout slug="shipping" sections={sections} />;
}
