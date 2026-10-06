import Link from "next/link";
import { PolicyLayout, policyMetadata, type PolicySection } from "@/components/layout/PolicyLayout/PolicyLayout";
import { POLICY_FACTS as F } from "@/lib/policy-facts";

export const generateMetadata = policyMetadata(
  "returns",
  `Cancel within ${F.withdrawalDays} days of delivery, return within ${F.returnShipDays} days, refund within ${F.refundDays} days to the card you paid with. Faulty items are returned at our cost.`,
);

const sections: PolicySection[] = [
  {
    id: "summary",
    title: "In short",
    body: (
      <ul>
        <li>You can cancel within {F.withdrawalDays} days of receiving your order, without giving a reason.</li>
        <li>Send the items back within {F.returnShipDays} days of telling us.</li>
        <li>You pay for the return unless the item is faulty, damaged or not what you ordered.</li>
        <li>We refund within {F.refundDays} days of receiving the items, or of your proof of return if that comes first, to the card you paid with.</li>
      </ul>
    ),
  },
  {
    id: "right-to-cancel",
    title: "Your right to cancel",
    body: (
      <>
        <p>
          The Consumer Contracts Regulations 2013 (UK) and the Consumer Rights Directive (EU) give you {F.withdrawalDays} days to cancel an
          online order. The period starts the day after you, or someone you name, receive the goods. If an order arrives in more than one
          parcel, it starts the day after the last one arrives.
        </p>
        <p>
          The right covers everything we sell. We do not make an exception for hygiene-sealed goods: none of our products is sold sealed for
          health reasons.
        </p>
        <p>You can also cancel an order before it is dispatched. If it has not left the warehouse, we cancel it and refund the full amount.</p>
      </>
    ),
  },
  {
    id: "how-to-return",
    title: "How to return an item",
    body: (
      <ol>
        <li>
          Email {F.email} or use the <Link href="/contact">contact form</Link> within {F.withdrawalDays} days of delivery. Give your order
          number and the items you are returning. A reason is optional.
        </li>
        <li>We reply {F.replyTime} with the return address and what to write on the parcel.</li>
        <li>
          Pack the items securely, in the original packaging if you still have it, and send them within {F.returnShipDays} days of your
          message. Use a tracked service and keep the receipt: it is your proof of return.
        </li>
        <li>We inspect the items when they arrive and email you to confirm the refund.</li>
      </ol>
    ),
  },
  {
    id: "return-costs",
    title: "Return costs",
    body: (
      <>
        <p>
          If you change your mind, you pay the cost of sending the items back. Returns go to the address we give you, which may be in Spain,
          so the cost depends on where you send from and the service you choose.
        </p>
        <p>
          If an item is faulty, damaged in transit or not what you ordered, we pay the return cost. Tell us first and we will arrange the
          return or refund your postage.
        </p>
      </>
    ),
  },
  {
    id: "condition",
    title: "Condition of returned items",
    body: (
      <>
        <p>
          You may handle an item as you would in a shop to check what it is like. Please do not cook with, bake in, wash in a dishwasher or
          store food in an item you might return.
        </p>
        <p>
          If an item comes back used, or damaged because it was handled more than necessary, we may reduce the refund by the loss in value.
          We tell you the amount and the reason before we refund. We never reduce a refund for a faulty item.
        </p>
      </>
    ),
  },
  {
    id: "refunds",
    title: "Refunds",
    body: (
      <>
        <p>
          We refund within {F.refundDays} days of the day we receive the items back or, if earlier, the day you send us proof that you have
          returned them. For an order cancelled before dispatch, we refund within {F.refundDays} days of your cancellation.
        </p>
        <p>
          The refund includes the price of the items and the standard delivery charge you paid for them. If you return only part of an
          order, the delivery charge is not refunded unless the whole order is returned.
        </p>
        <p>
          Refunds go to the same card you paid with, in the same currency. We do not charge any fee. Your bank may take a few working days
          to show the refund on your statement.
        </p>
      </>
    ),
  },
  {
    id: "faulty",
    title: "Faulty, damaged or wrong items",
    body: (
      <>
        <p>
          If an item arrives damaged, has a fault, or is not what you ordered, email us with your order number and photographs of the item
          and its packaging. Please do so as soon as you can after delivery.
        </p>
        <p>
          You can choose a replacement or a refund. We pay the return cost. These rights come from the law and are not limited by the{" "}
          {F.withdrawalDays}-day period. Defects that show up later are covered by our{" "}
          <Link href="/policies/warranty">{F.warrantyMonths}-month warranty</Link> and your statutory rights.
        </p>
      </>
    ),
  },
  {
    id: "refused",
    title: "Refused or undelivered parcels",
    body: (
      <p>
        If you refuse a delivery or a parcel comes back to us because it could not be delivered, we treat it as a cancellation once it reaches
        the warehouse. We refund the items and the delivery charge, less the actual cost of the return shipment charged to us by the carrier.
        See our <Link href="/policies/shipping">Delivery policy</Link>.
      </p>
    ),
  },
];

export default async function ReturnsPage() {
  return <PolicyLayout slug="returns" sections={sections} />;
}
