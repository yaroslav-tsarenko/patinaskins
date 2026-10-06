import Link from "next/link";
import { PolicyLayout, SellerBlock, policyMetadata, type PolicySection } from "@/components/layout/PolicyLayout/PolicyLayout";
import { POLICY_FACTS as F } from "@/lib/policy-facts";

export const generateMetadata = policyMetadata(
  "terms",
  `The terms ${F.company} trades on as ${F.brand}: who can order, prices, payment, delivery from Spain, the ${F.withdrawalDays}-day right to cancel, refunds and complaints.`,
);

const sections: PolicySection[] = [
  {
    id: "about",
    title: "About these terms",
    body: (
      <>
        <p>
          These terms apply to every order placed on {F.domain}. {F.brand} is a trading name of {F.company}. When these terms say
          &ldquo;we&rdquo;, &ldquo;us&rdquo; or &ldquo;our&rdquo;, they mean {F.company}. &ldquo;You&rdquo; means the person placing the order.
        </p>
        <SellerBlock />
        <p>
          These terms work together with our <Link href="/policies/shipping">Delivery policy</Link>,{" "}
          <Link href="/policies/returns">Returns and refunds policy</Link>, <Link href="/policies/payment">Payment policy</Link>,{" "}
          <Link href="/policies/warranty">Warranty</Link>, <Link href="/policies/privacy">Privacy policy</Link> and{" "}
          <Link href="/policies/cookies">Cookie policy</Link>. Nothing in them reduces the rights you have by law as a consumer.
        </p>
      </>
    ),
  },
  {
    id: "who-can-order",
    title: "Who can order",
    body: (
      <>
        <p>
          You must be at least {F.minAge} years old to create an account or place an order. We ask for your date of birth when you
          register and do not open accounts for anyone under {F.minAge}.
        </p>
        <p>
          We sell to consumers buying for their own household. Our products are kitchen and table goods for domestic use. If you
          buy them for resale or commercial use, the consumer rights described in these terms do not apply to that purchase.
        </p>
        <p>The details you give us (name, email, phone, delivery and billing address) must be accurate and your own.</p>
      </>
    ),
  },
  {
    id: "where-we-sell",
    title: "Where we sell and deliver",
    body: (
      <>
        <p>We deliver to the {F.deliveryCountries}. Checkout only offers destinations we deliver to.</p>
        <p>
          We do not sell to, deliver to or accept orders or accounts from {F.restrictedCountries}, or from{" "}
          {F.restrictedTerritories}. These countries and territories are excluded from registration and checkout. If we find that
          an order is connected to one of them, for example through the delivery address, billing address or payment card, we
          cancel it and refund the full amount paid.
        </p>
      </>
    ),
  },
  {
    id: "products",
    title: "Products",
    body: (
      <>
        <p>
          We sell cookware, bakeware, utensils, tableware, cutlery, glassware, kitchen and table linen, food storage, coffee and
          tea accessories, and bar and wine accessories. We do not sell electrical appliances or knives.
        </p>
        <p>
          Each product page states the materials, dimensions and care instructions we have for that item. Photographs are of the
          product, but colours can look slightly different on different screens, and handmade or glazed pieces can vary a little
          from piece to piece. Dimensions are approximate unless stated otherwise.
        </p>
        <p>
          Please follow the care instructions on the product page and on the packaging, for example whether an item is dishwasher
          safe, oven safe or suitable for induction hobs.
        </p>
      </>
    ),
  },
  {
    id: "orders",
    title: "How an order becomes a contract",
    body: (
      <>
        <ol>
          <li>You add products to your bag and go to checkout.</li>
          <li>You enter your contact details and delivery address and choose a delivery method.</li>
          <li>You review the order, tick the box to confirm you agree to these terms, and select Pay.</li>
          <li>You are taken to our payment provider&rsquo;s hosted page to pay by card.</li>
          <li>Once the payment provider confirms the payment to us, we email you an order confirmation. The contract between you and {F.company} is formed when we send that email.</li>
        </ol>
        <p>
          You can buy up to {F.maxQtyPerItem} units of one product and up to {F.maxItemsPerOrder} items in one order. We may decline
          an order before the contract is formed, or cancel it afterwards with a full refund, if the product is no longer available,
          if the price or description shown was clearly wrong, if the destination is one we do not deliver to, or if the payment
          appears fraudulent. We tell you by email if this happens.
        </p>
      </>
    ),
  },
  {
    id: "prices",
    title: "Prices, currencies and tax",
    body: (
      <>
        <p>
          Prices are shown in {F.currencies}. Our prices are set in {F.baseCurrency}; prices in other currencies are converted at
          our current exchange rate. You pay in the currency selected when you place the order, and the total shown before you pay is the
          amount charged. Your card issuer may add its own foreign exchange fee if your card is in a different currency.
        </p>
        {F.vatRegistered ? (
          <p>Prices include VAT at the rate that applies to your order.</p>
        ) : (
          <p>
            {F.company} is not registered for VAT. We do not charge VAT, no VAT is added at checkout and no VAT is shown on your
            order confirmation or invoice.
          </p>
        )}
        <p>
          Delivery costs {F.deliveryCost} per order and is free on orders of {F.freeThreshold} or more. The delivery charge is shown at
          checkout before you pay.
        </p>
        <p>{F.ukImportNote}</p>
      </>
    ),
  },
  {
    id: "payment",
    title: "Payment",
    body: (
      <>
        <p>
          We accept {F.cardMethods} cards. Card details are entered on the hosted payment page of {F.paymentProvider}, which is PCI
          DSS compliant. We never see or store your full card number. Your bank may ask you to confirm the payment with 3-D Secure,
          for example in your banking app.
        </p>
        <p>
          Your card is charged when you complete payment. If the payment is declined, no order is created. More detail is in our{" "}
          <Link href="/policies/payment">Payment policy</Link>.
        </p>
      </>
    ),
  },
  {
    id: "delivery",
    title: "Delivery",
    body: (
      <>
        <p>
          Orders are packed and dispatched from {F.dispatchFrom} within {F.processingDays}. Estimated delivery after dispatch is{" "}
          {F.deliveryEu} to EU addresses and {F.deliveryUk} to the United Kingdom. These are estimates, not guaranteed dates.
        </p>
        <p>
          The goods are your responsibility from the moment they are delivered to you or to a person you name. They become yours once
          we have received payment in full.
        </p>
        <p>
          {F.lateDeliveryNote} Full detail is in our <Link href="/policies/shipping">Delivery policy</Link>.
        </p>
      </>
    ),
  },
  {
    id: "cancel",
    title: "Your right to cancel",
    body: (
      <>
        <p>
          Under the Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013 in the UK, and the
          Consumer Rights Directive in the EU, you can cancel your order within {F.withdrawalDays} days without giving a reason. The{" "}
          {F.withdrawalDays} days start on the day after you, or someone you name, receive the goods. If your order arrives in
          several parcels, they start the day after the last parcel arrives.
        </p>
        <p>
          You can also cancel before the order is dispatched. Email us with your order number and, if it has not left the
          warehouse, we cancel it and refund the full amount.
        </p>
        <p>
          To cancel after delivery, tell us within the {F.withdrawalDays} days by email to {F.email} or through the{" "}
          <Link href="/contact">contact form</Link>, quoting your order number. You do not have to use a particular form, but you may
          use this wording: &ldquo;I hereby give notice that I cancel my contract for the sale of the following goods: [items], ordered
          on [date] / received on [date], order number [number], name, address.&rdquo;
        </p>
        <p>
          You must send the goods back within {F.returnShipDays} days of telling us you are cancelling. You pay the cost of returning
          them unless they are faulty or not what you ordered. The full process is in our{" "}
          <Link href="/policies/returns">Returns and refunds policy</Link>.
        </p>
        <p>
          You may handle the goods as you would in a shop to check them. If an item has been used, for example a pan that has been
          heated or a container that has held food, we may reduce the refund to reflect the loss in value.
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
          When you cancel, we refund the price of the goods and the standard delivery charge you paid. We refund within{" "}
          {F.refundDays} days of the day we receive the goods back or, if earlier, the day you send us proof that you have returned
          them. If you cancel before dispatch, we refund within {F.refundDays} days of your cancellation.
        </p>
        <p>
          Refunds go to the card you paid with, in the currency you paid in. We do not charge a fee for refunds. Your bank may take a few
          further working days to show the money on your statement.
        </p>
      </>
    ),
  },
  {
    id: "faulty",
    title: "Faulty or incorrect goods",
    body: (
      <>
        <p>
          Goods must be as described, of satisfactory quality and fit for purpose. If an item arrives damaged, faulty or is not what you
          ordered, contact us with your order number and photographs. We pay the return cost in these cases and offer a replacement or a
          refund.
        </p>
        <p>
          In addition to these legal rights, we give a {F.warrantyMonths}-month warranty against manufacturing defects, described in our{" "}
          <Link href="/policies/warranty">Warranty</Link>.
        </p>
      </>
    ),
  },
  {
    id: "chargebacks",
    title: "Chargebacks",
    body: (
      <>
        <p>
          If something is wrong with an order, please contact us first. Most problems are solved faster by us than through a card
          dispute.
        </p>
        <p>
          If you open a chargeback with your card issuer, we will respond to the issuer with the order details, delivery tracking and our
          correspondence with you. If the chargeback is decided in your favour, we do not also refund you directly for the same amount. If a
          chargeback is raised for an order that was delivered and not returned, we may suspend the account while the dispute is open.
          This does not limit any right you have under card scheme rules or consumer law.
        </p>
      </>
    ),
  },
  {
    id: "account",
    title: "Your account",
    body: (
      <>
        <p>
          You are responsible for keeping your password private and for activity on your account. Tell us straight away if you think
          someone else has used it.
        </p>
        <p>
          We may suspend or close an account that breaks our <Link href="/policies/acceptable-use">Acceptable use policy</Link>, gives
          false details or is linked to a restricted country or territory. You can ask us to close your account at any time.
        </p>
      </>
    ),
  },
  {
    id: "liability",
    title: "Our responsibility to you",
    body: (
      <>
        <p>
          If we break these terms, we are responsible for loss or damage you suffer that is a foreseeable result of that breach. We are not
          responsible for loss that was not foreseeable when the contract was formed.
        </p>
        <p>
          We do not exclude or limit our liability for death or personal injury caused by our negligence, for fraud, or for breach of your
          legal rights in relation to the goods.
        </p>
        <p>
          We supply our products for domestic and private use. We are not liable to you for loss of profit, loss of business or business
          interruption.
        </p>
      </>
    ),
  },
  {
    id: "outside-control",
    title: "Events outside our control",
    body: (
      <p>
        If an event outside our control, such as a carrier disruption, strike, severe weather or a warehouse closure, delays your order, we
        tell you as soon as we can and do what we reasonably can to reduce the delay. If the delay is likely to be long, you can cancel and
        we refund the full amount for goods not yet delivered.
      </p>
    ),
  },
  {
    id: "data",
    title: "Your personal data",
    body: (
      <p>
        We use your personal data as set out in our <Link href="/policies/privacy">Privacy policy</Link>.
      </p>
    ),
  },
  {
    id: "complaints",
    title: "Complaints",
    body: (
      <p>
        If you are unhappy with anything about an order, email {F.email}. We acknowledge complaints {F.complaintsAck} and reply in full
        within {F.complaintsDays} days. The process and where you can take a complaint next are in our{" "}
        <Link href="/policies/complaints">Complaints policy</Link>.
      </p>
    ),
  },
  {
    id: "law",
    title: "Governing law",
    body: (
      <>
        <p>
          These terms are governed by {F.governingLaw}, and disputes may be brought before {F.courts}.
        </p>
        <p>
          If you live in the United Kingdom or in an EU member state, you keep the protection of the mandatory consumer laws of the country
          where you live, and you can bring proceedings in the courts of that country.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "Changes to these terms",
    body: (
      <p>
        We may update these terms. The version published when you place an order applies to that order. The date at the top of this page
        shows when the terms last changed.
      </p>
    ),
  },
];

export default async function TermsPage() {
  return <PolicyLayout slug="terms" sections={sections} />;
}
