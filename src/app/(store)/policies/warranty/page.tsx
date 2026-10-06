import Link from "next/link";
import { PolicyLayout, policyMetadata, type PolicySection } from "@/components/layout/PolicyLayout/PolicyLayout";
import { POLICY_FACTS as F } from "@/lib/policy-facts";

export const generateMetadata = policyMetadata(
  "warranty",
  `Every ${F.brand} product carries a ${F.warrantyMonths}-month warranty against manufacturing defects, in addition to your statutory rights in the UK and EU.`,
);

const sections: PolicySection[] = [
  {
    id: "two-kinds",
    title: "Your legal rights and our warranty",
    body: (
      <>
        <p>
          You have two kinds of protection when you buy from {F.brand}. The first is your statutory rights, which come from the law and which
          our warranty does not replace or limit. The second is our own {F.warrantyMonths}-month warranty, which we add on top.
        </p>
        <h3>Statutory rights</h3>
        <ul>
          <li>
            <strong>United Kingdom:</strong> under the Consumer Rights Act 2015, goods must be as described, of satisfactory quality and fit
            for purpose. If they are not, you can reject them for a full refund within 30 days of delivery. After that, you can ask for a
            repair or replacement, and if that does not fix the problem, a price reduction or refund. You can claim for up to six years
            (five in Scotland).
          </li>
          <li>
            <strong>European Union:</strong> the legal guarantee of conformity lasts at least two years from delivery. A lack of conformity that
            appears within the first year is presumed to have existed at delivery.
          </li>
        </ul>
        <h3>Our warranty</h3>
        <p>
          For {F.warrantyMonths} months from delivery, we replace or refund any product that develops a manufacturing defect in its materials
          or workmanship during normal domestic use, following the care instructions.
        </p>
      </>
    ),
  },
  {
    id: "covered",
    title: "What the warranty covers",
    body: (
      <ul>
        <li>Handles, knobs or rivets that come loose or break without misuse.</li>
        <li>Non-stick or enamel coatings that blister, flake or peel through a manufacturing fault.</li>
        <li>Pans or bakeware that warp under the heat and hob types the product page says they are suitable for.</li>
        <li>Glaze crazing, cracks or seams in ceramics and glassware that were not caused by impact or sudden temperature change.</li>
        <li>Lids, seals and closures on storage containers that do not fit or close as they should.</li>
        <li>Stitching or hems on kitchen and table linen that come apart under normal washing.</li>
      </ul>
    ),
  },
  {
    id: "not-covered",
    title: "What it does not cover",
    body: (
      <>
        <ul>
          <li>Normal wear: scratches, dulling of finishes, gradual wear of non-stick coatings, and colour changes on stainless steel or copper from heat.</li>
          <li>Damage from dropping, knocking or chipping, or from sudden temperature changes such as putting hot glass into cold water.</li>
          <li>Damage from use outside the care instructions, for example a hand-wash-only item put in the dishwasher, metal utensils on non-stick surfaces, or overheating an empty pan.</li>
          <li>Rust on cast iron or carbon steel that has not been dried and oiled as instructed. Re-seasoning restores it.</li>
          <li>Commercial or professional use.</li>
        </ul>
        <p>These exclusions apply to our warranty only. They do not reduce your statutory rights where a product was faulty when delivered.</p>
      </>
    ),
  },
  {
    id: "claim",
    title: "How to make a claim",
    body: (
      <ol>
        <li>Email {F.email} or use the <Link href="/contact">contact form</Link>, with your order number.</li>
        <li>Describe the problem and attach photographs that show it, including any marking on the base of the item.</li>
        <li>We reply {F.replyTime}. If we need the item back to look at it, we tell you how to send it and pay the return cost.</li>
        <li>If the claim is accepted, we send a replacement of the same product, or a comparable one if it is no longer available, or refund the price you paid.</li>
      </ol>
    ),
  },
  {
    id: "who",
    title: "Who gives the warranty",
    body: (
      <p>
        The warranty is given by {F.company}, trading as {F.brand}, to the person who bought the product from us. It applies to products
        delivered to the United Kingdom and the European Union. A replacement item is covered for the rest of the original warranty period.
      </p>
    ),
  },
];

export default async function WarrantyPage() {
  return <PolicyLayout slug="warranty" sections={sections} />;
}
