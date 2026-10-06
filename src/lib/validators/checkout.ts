import { z } from "zod";
import { STORE_POLICY } from "@/config/store-policy";
import { addressFields, dialCountryField, emailField, nameField, phoneNumberField } from "./fields";

export const checkoutAddressSchema = z.object({
  firstName: nameField("firstNameRequired"),
  lastName: nameField("lastNameRequired"),
  ...addressFields,
});

export type CheckoutAddress = z.infer<typeof checkoutAddressSchema>;

export const checkoutFormSchema = z
  .object({
    contact: z.object({
      email: emailField,
      firstName: nameField("firstNameRequired"),
      lastName: nameField("lastNameRequired"),
      phoneCountry: dialCountryField,
      phone: phoneNumberField,
    }),
    delivery: z.object({
      street: addressFields.street,
      address2: addressFields.address2,
      city: addressFields.city,
      country: addressFields.country,
      postcode: addressFields.postcode,
    }),
    shippingMethod: z.literal("standard"),
    billingSameAsDelivery: z.boolean(),
    billing: z
      .object({
        firstName: z.string().trim().optional(),
        lastName: z.string().trim().optional(),
        street: z.string().trim().optional(),
        address2: z.string().trim().optional(),
        city: z.string().trim().optional(),
        country: z.string().trim().optional(),
        postcode: z.string().trim().optional(),
      })
      .optional(),
    acceptedPolicies: z.boolean().refine((v) => v === true, "policiesRequired"),
  })
  .superRefine((data, ctx) => {
    if (data.billingSameAsDelivery) return;
    const result = checkoutAddressSchema.safeParse(data.billing ?? {});
    if (result.success) return;
    for (const issue of result.error.issues) {
      ctx.addIssue({ code: "custom", message: issue.message, path: ["billing", ...issue.path] });
    }
  });

export type CheckoutFormData = z.infer<typeof checkoutFormSchema>;

export const checkoutItemsSchema = z
  .array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().min(1).max(STORE_POLICY.limits.maxQtyPerItem),
      variantName: z.string().max(200).optional().nullable(),
    }),
  )
  .min(1, "cartEmpty")
  .max(STORE_POLICY.limits.maxItemsPerOrder);

export const checkoutQuoteSchema = z.object({
  items: checkoutItemsSchema,
  currency: z.string().optional(),
  discountCode: z.string().trim().max(40).optional().nullable(),
});

export const checkoutRequestSchema = checkoutQuoteSchema.extend({
  form: checkoutFormSchema,
  expectedTotal: z.number().nonnegative(),
});

export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;
