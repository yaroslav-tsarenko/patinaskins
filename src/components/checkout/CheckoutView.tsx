"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock } from "lucide-react";
import { DrawerStepper, type StepperErrorSummary } from "@/components/ui/Stepper";
import { Input } from "@/components/ui/Field";
import { Checkbox, RadioRow } from "@/components/ui/Choice";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { AccordionItem } from "@/components/ui/Accordion";
import { EmptyState } from "@/components/shared/EmptyState/EmptyState";
import { PaymentLogos } from "@/components/shared/PaymentLogos/PaymentLogos";
import { Cubby } from "@/components/product/ShelfTile/ShelfTile";
import { PhoneField } from "@/components/account/fields/PhoneField";
import { AddressFields } from "@/components/account/fields/AddressFields";
import { useCart } from "@/providers/CartProvider";
import { useAuth } from "@/providers/AuthProvider";
import { useCurrency } from "@/providers/CurrencyProvider";
import { useFieldError } from "@/lib/hooks/useFieldError";
import { checkoutAddressSchema, checkoutFormSchema, type CheckoutFormData } from "@/lib/validators/checkout";
import { countryName, DEFAULT_COUNTRY_CODE, dialCodeFor, isUkCountry } from "@/lib/countries";
import { deliveryEstimate } from "@/lib/orders";
import { formatPrice } from "@/lib/utils/format-price";
import { STORE_POLICY } from "@/config/store-policy";
import { COMPANY } from "@/lib/company";
import { CheckoutCounter } from "./CheckoutCounter";
import { MerchantInfo } from "./MerchantInfo";
import { TotalsList } from "./TotalsList";
import { quotePayloadItems, useCheckoutQuote, type QuoteProblem } from "./useCheckoutQuote";

const DRAFT_KEY = "brasmora-checkout-draft";

type FieldName = FieldPath<CheckoutFormData>;

const STEP_FIELDS: FieldName[][] = [
  ["contact.email", "contact.firstName", "contact.lastName", "contact.phoneCountry", "contact.phone"],
  ["delivery.street", "delivery.address2", "delivery.city", "delivery.postcode", "delivery.country", "shippingMethod", "billingSameAsDelivery"],
  ["acceptedPolicies"],
];

const BILLING_FIELDS = ["firstName", "lastName", "street", "city", "postcode", "country"] as const;

const FIELD_IDS: Record<string, string> = {
  "contact.email": "co-email",
  "contact.firstName": "co-first",
  "contact.lastName": "co-last",
  "contact.phoneCountry": "co-phone-dial",
  "contact.phone": "co-phone-number",
  "delivery.street": "dl-street",
  "delivery.address2": "dl-address2",
  "delivery.city": "dl-city",
  "delivery.postcode": "dl-postcode",
  "delivery.country": "dl-country",
  "billing.firstName": "bl-first",
  "billing.lastName": "bl-last",
  "billing.street": "bl-street",
  "billing.city": "bl-city",
  "billing.postcode": "bl-postcode",
  "billing.country": "bl-country",
  acceptedPolicies: "co-accept",
};

const EMPTY: CheckoutFormData = {
  contact: { email: "", firstName: "", lastName: "", phoneCountry: DEFAULT_COUNTRY_CODE, phone: "" },
  delivery: { street: "", address2: "", city: "", country: "", postcode: "" },
  shippingMethod: "standard",
  billingSameAsDelivery: true,
  billing: { firstName: "", lastName: "", street: "", address2: "", city: "", country: "", postcode: "" },
  acceptedPolicies: false,
};

interface SubmitProblem extends QuoteProblem {
  total?: number;
}

function readDraft(): Partial<CheckoutFormData> | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Partial<CheckoutFormData>) : null;
  } catch {
    return null;
  }
}

function writeDraft(values: CheckoutFormData) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...values, acceptedPolicies: undefined }));
  } catch {}
}

function getAt(source: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) => (value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined), source);
}

export function CheckoutView() {
  const t = useTranslations("checkout");
  const tf = useTranslations("forms");
  const fe = useFieldError();
  const searchParams = useSearchParams();
  const { cart, displayTotals, isHydrated } = useCart();
  const { user } = useAuth();
  const { currency } = useCurrency();
  const [step, setStep] = useState(0);
  const [discountCode, setDiscountCode] = useState<string | null>(null);
  const [errorSummary, setErrorSummary] = useState<StepperErrorSummary | null>(null);
  const [submitProblem, setSubmitProblem] = useState<SubmitProblem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const prefilled = useRef(false);

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutFormSchema),
    mode: "onTouched",
    defaultValues: EMPTY,
  });
  const { register, watch, trigger, getValues, setValue, setError, clearErrors, getFieldState, formState } = form;

  const { quote, setQuote, problem, loading } = useCheckoutQuote(cart.items, currency, discountCode, isHydrated);
  const quoteReady = Boolean(quote && quote.currency === currency && !loading && !problem);
  const totals = quote && quote.currency === currency ? quote.totals : displayTotals;

  useEffect(() => {
    if (searchParams.get("payment") === "failed") setPaymentFailed(true);
  }, [searchParams]);

  useEffect(() => {
    if (prefilled.current) return;
    prefilled.current = true;
    const draft = readDraft();
    if (draft) {
      form.reset({ ...EMPTY, ...draft, contact: { ...EMPTY.contact, ...draft.contact }, delivery: { ...EMPTY.delivery, ...draft.delivery }, billing: { ...EMPTY.billing, ...draft.billing }, acceptedPolicies: false });
    }
  }, [form]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetch("/api/account/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.profile) return;
        const profile = data.profile as { email: string; firstName: string | null; lastName: string | null; phoneCountry: string | null; phoneNational: string | null };
        const address = (data.addresses as { address1: string; address2: string | null; city: string; postalCode: string; country: string; isDefault: boolean }[] | undefined)?.find((a) => a.isDefault) ?? data.addresses?.[0];
        const fill = (name: FieldName, value: string | null | undefined) => {
          if (value && !getValues(name)) setValue(name, value as never, { shouldDirty: false });
        };
        fill("contact.email", profile.email);
        fill("contact.firstName", profile.firstName);
        fill("contact.lastName", profile.lastName);
        fill("contact.phone", profile.phoneNational);
        if (profile.phoneCountry && !getFieldState("contact.phone").isDirty) setValue("contact.phoneCountry", profile.phoneCountry);
        if (address) {
          fill("delivery.street", address.address1);
          fill("delivery.address2", address.address2);
          fill("delivery.city", address.city);
          fill("delivery.postcode", address.postalCode);
          fill("delivery.country", address.country);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user, getValues, setValue, getFieldState]);

  const values = watch();
  const sameBilling = values.billingSameAsDelivery;
  const deliveryCountry = values.delivery?.country;
  const estimate = deliveryEstimate(deliveryCountry || DEFAULT_COUNTRY_CODE);
  const fieldLabel = useCallback(
    (name: string) => {
      const key = name.split(".").pop() as string;
      const map: Record<string, string> = {
        email: tf("email"),
        firstName: tf("firstName"),
        lastName: tf("lastName"),
        phoneCountry: tf("dialCode"),
        phone: tf("phone"),
        street: tf("street"),
        address2: tf("address2"),
        city: tf("city"),
        postcode: tf("postcode"),
        country: tf("country"),
        acceptedPolicies: t("review.acceptLabelShort"),
      };
      const prefix = name.startsWith("billing.") ? `${t("delivery.billingTitle")}: ` : "";
      return `${prefix}${map[key] ?? key}`;
    },
    [t, tf],
  );

  const buildSummary = useCallback(
    (names: string[]): StepperErrorSummary | null => {
      const failed = names.filter((name) => getFieldState(name as FieldName).error);
      if (failed.length === 0) return null;
      return {
        message: t("errors.checkFields", { count: failed.length }),
        fields: failed.map((name) => ({ id: FIELD_IDS[name] ?? name, label: fieldLabel(name) })),
      };
    },
    [getFieldState, fieldLabel, t],
  );

  const validateBilling = useCallback(() => {
    if (getValues("billingSameAsDelivery")) return true;
    const result = checkoutAddressSchema.safeParse(getValues("billing") ?? {});
    if (result.success) return true;
    for (const issue of result.error.issues) {
      setError(`billing.${issue.path.join(".")}` as FieldName, { type: "manual", message: issue.message });
    }
    return false;
  }, [getValues, setError]);

  const goTo = useCallback(
    (next: number) => {
      writeDraft(getValues());
      setErrorSummary(null);
      setStep(next);
    },
    [getValues],
  );

  const handleContinue = async () => {
    const names = STEP_FIELDS[step];
    const valid = await trigger(names);
    const billingValid = step === 1 ? validateBilling() : true;
    if (!valid || !billingValid) {
      const billingNames = step === 1 && !getValues("billingSameAsDelivery") ? BILLING_FIELDS.map((f) => `billing.${f}`) : [];
      setErrorSummary(buildSummary([...names, ...billingNames]));
      return;
    }
    goTo(Math.min(step + 1, 2));
  };

  const pay = form.handleSubmit(
    async (data) => {
      if (!quote || !quoteReady) return;
      setSubmitting(true);
      setSubmitProblem(null);
      writeDraft(data);
      try {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: quotePayloadItems(cart.items), currency, discountCode, form: data, expectedTotal: quote.totals.total }),
        });
        const body = await res.json().catch(() => ({ code: "SERVER_ERROR" }));
        if (res.ok && typeof body.paymentLink === "string" && (/^https:\/\//.test(body.paymentLink) || (process.env.NODE_ENV !== "production" && /^http:\/\/localhost[:/]/.test(body.paymentLink)))) {
          window.location.assign(body.paymentLink);
          return;
        }
        if (body.code === "TOTAL_CHANGED" && body.quote) {
          setQuote(body.quote);
          setSubmitProblem({ code: "TOTAL_CHANGED", total: body.quote.totals.total });
        } else {
          setSubmitProblem(res.ok ? { code: "SERVER_ERROR" } : body);
        }
      } catch {
        setSubmitProblem({ code: "NETWORK" });
      }
      setSubmitting(false);
    },
    (errors) => {
      const order = [0, 1, 2];
      const firstStep = order.find((index) => STEP_FIELDS[index].some((name) => getAt(errors, name)));
      const target = firstStep ?? (errors.billing ? 1 : 2);
      if (target !== step) setStep(target);
      const names = [...STEP_FIELDS[target], ...(target === 1 ? BILLING_FIELDS.map((f) => `billing.${f}`) : [])];
      setErrorSummary(buildSummary(names));
    },
  );

  const problemText = (p: SubmitProblem | QuoteProblem | null) => {
    if (!p) return null;
    const known = ["PAYMENT_UNAVAILABLE", "PAYMENT_LINK_FAILED", "TOTAL_CHANGED", "OUT_OF_STOCK", "ITEM_LIMIT", "ORDER_LIMIT", "PRODUCT_UNAVAILABLE", "CART_EMPTY", "INVALID_REQUEST", "NETWORK"];
    const code = known.includes(p.code) ? p.code : "SERVER_ERROR";
    return t(`problems.${code}`, {
      name: p.name ?? "",
      available: p.available ?? 0,
      max: p.max ?? STORE_POLICY.limits.maxItemsPerOrder,
      total: formatPrice((p as SubmitProblem).total ?? totals.total, currency),
      email: COMPANY.email,
    });
  };

  const contactSummary = [values.contact?.firstName, values.contact?.lastName].filter(Boolean).join(" ");
  const deliverySummary = t("delivery.summary", { place: [values.delivery?.city, values.delivery?.postcode?.toUpperCase()].filter(Boolean).join(" ") });

  const imageFor = useMemo(() => new Map(cart.items.map((item) => [item.productId, item.imageUrl])), [cart.items]);

  if (!isHydrated) {
    return <div className="min-h-[60vh]" aria-busy="true" />;
  }

  if (cart.items.length === 0 && !submitting) {
    return (
      <div className="mx-auto max-w-narrow px-gutter py-12">
        <h1 className="m-0 text-step-4 leading-[1.1] text-ink">{t("title")}</h1>
        <EmptyState
          title={t("empty.title")}
          subtitle={t("empty.subtitle")}
          actionLabel={t("empty.action")}
          actionHref="/catalog"
          align="start"
          className="px-0"
        />
      </div>
    );
  }

  const counterProps = {
    items: cart.items,
    totals,
    currency,
    quote,
    deliveryPending: step === 0,
    discountCode,
    onApplyCode: setDiscountCode,
    loading,
  };

  const contactPanel = (
    <div className="flex flex-col gap-5">
      {!user ? (
        <p className="m-0 text-ui-sm text-ink-muted">
          {t.rich("contact.signInPrompt", {
            link: (chunks) => (
              <Link href="/auth/login?next=/checkout" className="font-semibold text-ink underline underline-offset-4">
                {chunks}
              </Link>
            ),
          })}
        </p>
      ) : null}
      <Input
        id="co-email"
        type="email"
        label={tf("email")}
        required
        autoComplete="email"
        hint={t("contact.emailHint")}
        error={fe(formState.errors.contact?.email?.message)}
        {...register("contact.email")}
      />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input id="co-first" label={tf("firstName")} required autoComplete="given-name" error={fe(formState.errors.contact?.firstName?.message)} {...register("contact.firstName")} />
        <Input id="co-last" label={tf("lastName")} required autoComplete="family-name" error={fe(formState.errors.contact?.lastName?.message)} {...register("contact.lastName")} />
      </div>
      <PhoneField
        idPrefix="co-phone"
        dialRegister={register("contact.phoneCountry")}
        numberRegister={register("contact.phone")}
        error={fe(formState.errors.contact?.phone?.message)}
        dialError={fe(formState.errors.contact?.phoneCountry?.message)}
      />
    </div>
  );

  const deliveryPanel = (
    <div className="flex flex-col gap-8">
      <AddressFields
        idPrefix="dl"
        registers={{
          street: register("delivery.street"),
          address2: register("delivery.address2"),
          city: register("delivery.city"),
          postcode: register("delivery.postcode"),
          country: register("delivery.country"),
        }}
        errors={{
          street: fe(formState.errors.delivery?.street?.message),
          address2: fe(formState.errors.delivery?.address2?.message),
          city: fe(formState.errors.delivery?.city?.message),
          postcode: fe(formState.errors.delivery?.postcode?.message),
          country: fe(formState.errors.delivery?.country?.message),
        }}
      />
      <fieldset className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0">
        <legend className="mb-3 p-0 text-step-1 font-semibold text-ink">{t("delivery.methodTitle")}</legend>
        <RadioRow
          value="standard"
          label={t("delivery.standard")}
          description={t("delivery.standardTime", { processing: estimate.processing, transit: estimate.transit })}
          meta={t("delivery.dispatch", { from: STORE_POLICY.shipping.dispatchFrom })}
          aside={totals.shipping === 0 && totals.itemCount > 0 ? t("totals.free") : formatPrice(totals.shipping, currency)}
          {...register("shippingMethod")}
        />
        {totals.amountToFreeShipping > 0 ? (
          <p className="meta m-0 text-ink-muted">{t("delivery.freeOver", { amount: formatPrice(totals.amountToFreeShipping, currency), threshold: formatPrice(STORE_POLICY.shipping.freeThreshold, STORE_POLICY.currency) })}</p>
        ) : null}
        {isUkCountry(deliveryCountry) ? <p className="meta m-0 text-ink-muted">{STORE_POLICY.shipping.ukImportNote}</p> : null}
      </fieldset>
      <div className="flex flex-col gap-5">
        <Checkbox
          label={t("delivery.billingSame")}
          {...register("billingSameAsDelivery", {
            onChange: () => {
              clearErrors("billing");
            },
          })}
        />
        {!sameBilling ? (
          <fieldset className="m-0 flex min-w-0 flex-col gap-5 border-0 border-t border-line p-0 pt-5">
            <legend className="sr-only">{t("delivery.billingTitle")}</legend>
            <p aria-hidden="true" className="m-0 text-step-1 font-semibold text-ink">{t("delivery.billingTitle")}</p>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Input id="bl-first" label={tf("firstName")} required autoComplete="billing given-name" error={fe(formState.errors.billing?.firstName?.message)} {...register("billing.firstName")} />
              <Input id="bl-last" label={tf("lastName")} required autoComplete="billing family-name" error={fe(formState.errors.billing?.lastName?.message)} {...register("billing.lastName")} />
            </div>
            <AddressFields
              idPrefix="bl"
              autoCompleteSection="billing"
              registers={{
                street: register("billing.street"),
                address2: register("billing.address2"),
                city: register("billing.city"),
                postcode: register("billing.postcode"),
                country: register("billing.country"),
              }}
              errors={{
                street: fe(formState.errors.billing?.street?.message),
                city: fe(formState.errors.billing?.city?.message),
                postcode: fe(formState.errors.billing?.postcode?.message),
                country: fe(formState.errors.billing?.country?.message),
              }}
            />
          </fieldset>
        ) : null}
      </div>
    </div>
  );

  const payLabel = quoteReady && quote ? t("review.pay", { amount: formatPrice(quote.totals.total, quote.currency) }) : t("review.payPending");
  const accepted = Boolean(values.acceptedPolicies);
  const deliveryLines = [
    values.delivery?.street,
    values.delivery?.address2,
    [values.delivery?.city, values.delivery?.postcode?.toUpperCase()].filter(Boolean).join(" "),
    countryName(values.delivery?.country),
  ].filter(Boolean);
  const billingLines = sameBilling
    ? null
    : [
        [values.billing?.firstName, values.billing?.lastName].filter(Boolean).join(" "),
        values.billing?.street,
        [values.billing?.city, values.billing?.postcode?.toUpperCase()].filter(Boolean).join(" "),
        countryName(values.billing?.country),
      ].filter(Boolean);

  const reviewPanel = (
    <div className="flex flex-col gap-8">
      <dl className="m-0 grid grid-cols-1 gap-x-8 gap-y-5 border-b border-line pb-6 sm:grid-cols-2">
        <div className="min-w-0">
          <dt className="eyebrow mb-2 flex items-center justify-between gap-4 text-ink-muted">
            {t("review.contactTitle")}
            <button type="button" onClick={() => goTo(0)} className="min-h-9 cursor-pointer text-ui-sm font-semibold normal-case tracking-normal text-ink underline underline-offset-4">
              {t("review.change")}
              <span className="sr-only"> {t("review.contactTitle")}</span>
            </button>
          </dt>
          <dd className="m-0 text-ui-sm leading-[1.6] text-ink">
            {contactSummary}
            <br />
            {values.contact?.email}
            <br />
            <span className="tabular">{`${dialCodeFor(values.contact?.phoneCountry)} ${values.contact?.phone ?? ""}`}</span>
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="eyebrow mb-2 flex items-center justify-between gap-4 text-ink-muted">
            {t("review.deliveryTitle")}
            <button type="button" onClick={() => goTo(1)} className="min-h-9 cursor-pointer text-ui-sm font-semibold normal-case tracking-normal text-ink underline underline-offset-4">
              {t("review.change")}
              <span className="sr-only"> {t("review.deliveryTitle")}</span>
            </button>
          </dt>
          <dd className="m-0 text-ui-sm leading-[1.6] text-ink">
            {deliveryLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
            <span className="meta mt-1 block text-ink-muted">{t("review.billing", { address: billingLines ? billingLines.join(", ") : t("review.billingSame") })}</span>
          </dd>
        </div>
      </dl>

      <div>
        <h3 className="eyebrow m-0 mb-3 text-ink-muted">{t("review.itemsTitle")}</h3>
        <ul className="m-0 flex list-none flex-col divide-y divide-line p-0">
          {(quote && quote.currency === currency ? quote.lines : cart.items.map((item, index) => ({ productId: item.productId, name: item.name, variantName: item.variantName ?? null, quantity: item.quantity, unit: totals.lines[index]?.unit ?? 0, total: totals.lines[index]?.total ?? 0 }))).map((line, index) => (
            <li key={`${line.productId}-${index}`} className="flex items-center gap-4 py-3">
              <Cubby src={imageFor.get(line.productId) ?? null} alt="" size="compact" sizes="48px" className="w-12 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="m-0 line-clamp-2 text-ui-sm font-medium text-ink">{line.name}</p>
                <p className="meta m-0 tabular text-ink-muted">
                  {t("review.lineQty", { count: line.quantity, unit: formatPrice(line.unit, currency) })}
                </p>
              </div>
              <p className="tabular m-0 shrink-0 text-ui-sm text-ink">{formatPrice(line.total, currency)}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-1 gap-6 border-t border-line pt-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <MerchantInfo />
        <TotalsList totals={totals} currency={currency} showCurrencyCode totalSize="md" />
      </div>

      <Checkbox
        id="co-accept"
        label={t.rich("review.accept", {
          terms: (chunks) => (
            <Link href="/policies/terms" target="_blank" className="font-semibold underline underline-offset-4">
              {chunks}
            </Link>
          ),
          refunds: (chunks) => (
            <Link href="/policies/returns" target="_blank" className="font-semibold underline underline-offset-4">
              {chunks}
            </Link>
          ),
        })}
        error={fe(formState.errors.acceptedPolicies?.message)}
        {...register("acceptedPolicies")}
      />

      {submitProblem ? (
        <Alert tone={submitProblem.code === "TOTAL_CHANGED" ? "warning" : "danger"} title={t(submitProblem.code === "TOTAL_CHANGED" ? "problems.totalChangedTitle" : "problems.title")}>
          {problemText(submitProblem)}
        </Alert>
      ) : null}
      {problem ? <Alert tone="danger" title={t("problems.title")}>{problemText(problem)}</Alert> : null}

      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap-reverse items-center justify-between gap-4">
          <Button variant="ghost" onPress={() => goTo(1)}>
            {t("back")}
          </Button>
          <Button type="submit" size="lg" isDisabled={!accepted || !quoteReady} isLoading={submitting} startContent={<Lock size={18} aria-hidden="true" />} className="max-sm:w-full">
            {payLabel}
          </Button>
        </div>
        <div className="flex flex-col gap-3 border-t border-line pt-5">
          <PaymentLogos height={28} />
          <p className="meta m-0 text-ink-muted">{t("review.hosted")}</p>
          <p className="meta m-0 text-ink-muted">
            {STORE_POLICY.payment.providerName ? t("review.processedBy", { provider: STORE_POLICY.payment.providerName }) : t("review.processedByProvider")}
          </p>
          <p className="meta m-0 text-ink-muted">{t("review.threeDs")}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-narrow px-gutter pb-20 pt-8 lg:pt-12">
      <h1 className="m-0 mb-6 text-step-4 leading-[1.05] text-ink lg:mb-10">{t("title")}</h1>

      <div className="mb-6 border-y border-line lg:hidden">
        <AccordionItem
          title={t("counter.toggle", { total: formatPrice(totals.total, currency) })}
          open={summaryOpen}
          onOpenChange={setSummaryOpen}
          headingLevel={2}
          className="border-b-0"
        >
          <CheckoutCounter {...counterProps} headingLevel={3} />
        </AccordionItem>
      </div>

      {paymentFailed ? (
        <Alert
          tone="danger"
          title={t("paymentFailed.title")}
          className="mb-6"
          action={
            <Button variant="outline" size="sm" onPress={() => { setPaymentFailed(false); goTo(2); }}>
              {t("paymentFailed.retry")}
            </Button>
          }
        >
          {t("paymentFailed.body")}
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-10">
        <form noValidate onSubmit={pay} className="min-w-0 lg:col-span-7" aria-label={t("title")}>
          <DrawerStepper
            label={t("stepsLabel")}
            current={step}
            onEdit={(index) => goTo(index)}
            onContinue={handleContinue}
            onBack={() => goTo(Math.max(0, step - 1))}
            continueLabel={t("continue")}
            hideActions={step === 2}
            errorSummary={errorSummary}
            steps={[
              { id: "contact", title: t("contact.title"), summary: contactSummary || undefined, content: contactPanel },
              { id: "delivery", title: t("delivery.title"), summary: deliverySummary, content: deliveryPanel },
              { id: "review", title: t("review.title"), content: reviewPanel },
            ]}
          />
        </form>
        <aside aria-label={t("counter.title")} className="hidden lg:col-span-5 lg:block">
          <div className="sticky top-6 border border-line bg-raised p-6">
            <CheckoutCounter {...counterProps} />
          </div>
        </aside>
      </div>
    </div>
  );
}
