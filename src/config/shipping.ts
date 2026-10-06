import { STORE_POLICY } from "@/config/store-policy";

export const SHIPPING = {
  statement: "Delivery to the UK and EU",
  dispatchCountry: STORE_POLICY.shipping.dispatchCountry,
  cartNote: "Delivery calculated at checkout",
} as const;
