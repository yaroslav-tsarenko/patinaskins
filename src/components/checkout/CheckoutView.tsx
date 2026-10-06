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
import { Checkbox } from "@/components/ui/Choice";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { AccordionItem } from "@/components/ui/Accordion";
import { ShelfLoader } from "@/components/ui/ShelfLoader";
import { EmptyState } from "@/components/shared/EmptyState/EmptyState";
import { PaymentLogos } from "@/components/shared/PaymentLogos/PaymentLogos";
import { Cubby } from "@/components/product/ShelfTile/ShelfTile";
import { PhoneField } from "@/components/account/fields/PhoneField";
import { AddressFields } from "@/components/account/fields/AddressFields";
import { SteamDelivery, useSteamAccount } from "@/components/account/SteamDelivery/SteamDelivery";
import { useCart } from "@/providers/CartProvider";
import { useAuth } from "@/providers/AuthProvider";
import { useCurrency } from "@/providers/CurrencyProvider";
import { useFieldError } from "@/lib/hooks/useFieldError";
import { checkoutFormSchema, type CheckoutFormData } from "@/lib/validators/checkout";
import { countryName, DEFAULT_COUNTRY_CODE, dialCodeFor } from "@/lib/countries";
import { formatPrice } from "@/lib/utils/format-price";
import { STORE_POLICY } from "@/config/store-policy";
import { COMPANY } from "@/lib/company";
import { CheckoutCounter } from "./CheckoutCounter";
import { MerchantInfo } from "./MerchantInfo";
import { TotalsList } from "./TotalsList";
import { quotePayloadItems, useCheckoutQuote, type QuoteProblem } from "./useCheckoutQuote";

const DRAFT_KEY = "patina-checkout-draft";
const CHECKOUT_PATH = "/checkout";

type FieldName = FieldPath<CheckoutFormData>;

const STEP_FIELDS: FieldName[][] = [
  ["contact.email", "contact.firstName", "contact.lastName", "contact.phoneCountry", "contact.phone"],
  ["billing.street", "billing.address2", "billing.city", "billing.postcode", "billing.country"],
  ["acceptedPolicies", "acceptedWaiver"],
];

const FIELD_IDS: Record<string, string> = {
  "contact.email": "co-email",
  "contact.firstName": "co-first",
  "contact.lastName": "co-last",
  "contact.phoneCountry": "co-phone-dial",
  "contact.phone": "co-phone-number",
  "billing.street": "bl-street",
  "billing.address2": "bl-address2",
  "billing.city": "bl-city",
  "billing.postcode": "bl-postcode",
  "billing.country": "bl-country",
  acceptedPolicies: "co-accept",
  acceptedWaiver: "co-waiver",
};

const EMPTY: CheckoutFormData = {
  contact: { email: "", firstName: "", lastName: "", phoneCountry: DEFAULT_COUNTRY_CODE, phone: "" },
  billing: { street: "", address2: "", city: "", country: "", postcode: "" },
  acceptedPolicies: false,
  acceptedWaiver: false,
};

const KNOWN_PROBLEMS = [
  "PAYMENT_UNAVAILABLE",
  "PAYMENT_LINK_FAILED",
  "TOTAL_CHANGED",
  "ORDER_LIMIT",
  "PRODUCT_UNAVAILABLE",
  "PRICE_UNAVAILABLE",
  "STEAM_NOT_LINKED",
  "TRADE_URL_REQUIRED",
  "CART_EMPTY",
  "INVALID_REQUEST",
  "RATE_LIMITED",
  "UNAUTHORISED",
  "NETWORK",
];

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
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...values, acceptedPolicies: undefined, acceptedWaiver: undefined }));
  } catch {}
}

function getAt(source: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) => (value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined), source);
}

function SignInGate() {
  const t = useTranslations("checkout.signIn");
  return (
    <div className="mx-auto flex max-w-narrow flex-col gap-5 px-gutter py-12">
      <h1 className="m-0 text-step-4 leading-[1.1] text-ink">{t("title")}</h1>
      <p className="measure m-0 text-ui-md text-ink-muted">{t("body")}</p>
      <div className="flex flex-wrap gap-3">
        <Button as="a" href={`/api/auth/steam?next=${encodeURIComponent(CHECKOUT_PATH)}`} size="lg">
          {t("steam")}
        </Button>
        <Button as={Link} href={`/auth/login?next=${encodeURIComponent(CHECKOUT_PATH)}`} size="lg" variant="outline">
          {t("email")}
        </Button>
      </div>
    </div>
  );
}

export function CheckoutView() {
  const t = useTranslations("checkout");
  const tf = useTranslations("forms");
  const fe = useFieldError();
  const searchParams = useSearchParams();
  const { cart, displayTotals, isHydrated } = useCart();
  const { user, loading: authLoading } = useAuth();
  const { currency } = useCurrency();
  const steamAccount = useSteamAccount(Boolean(user));
  const [step, setStep] = useState(0);
  const [errorSummary, setErrorSummary] = useState<StepperErrorSummary | null>(null);
  const [submitProblem, setSubmitProblem] = useState<SubmitProblem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [steamMissing, setSteamMissing] = useState(false);
  const prefilled = useRef(false);

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutFormSchema),
    mode: "onTouched",
    defaultValues: EMPTY,
  });
  const { register, watch, trigger, getValues, setValue, getFieldState, formState } = form;

  const { quote, setQuote, problem, loading } = useCheckoutQuote(cart.items, currency, isHydrated);
  const quoteReady = Boolean(quote && quote.currency === currency && !loading && !problem);
  const totals = quote && quote.currency === currency ? quote.totals : displayTotals;
  const steamReady = Boolean(steamAccount.steam?.tradeUrlVerified);

  useEffect(() => {
    if (searchParams.get("payment") === "failed") setPaymentFailed(true);
  }, [searchParams]);

  useEffect(() => {
    if (prefilled.current) return;
    prefilled.current = true;
    const draft = readDraft();
    if (draft) {
      form.reset({ ...EMPTY, ...draft, contact: { ...EMPTY.contact, ...draft.contact }, billing: { ...EMPTY.billing, ...draft.billing }, acceptedPolicies: false, acceptedWaiver: false });
    }
  }, [form]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetch("/api/account/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.profile) return;
        const profile = data.profile as { email: string | null; firstName: string | null; lastName: string | null; phoneCountry: string | null; phoneNational: string | null };
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
          fill("billing.street", address.address1);
          fill("billing.address2", address.address2);
          fill("billing.city", address.city);
          fill("billing.postcode", address.postalCode);
          fill("billing.country", address.country);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user, getValues, setValue, getFieldState]);

  const values = watch();
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
        acceptedWaiver: t("review.waiverLabelShort"),
      };
      return map[key] ?? key;
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
    if (!valid) {
      setErrorSummary(buildSummary(names));
      return;
    }
    if (step === 1 && !steamReady) {
      setSteamMissing(true);
      setErrorSummary({ message: t("delivery.steamRequired"), fields: [{ id: "steam-trade-url", label: t("delivery.steamTitle") }] });
      return;
    }
    setSteamMissing(false);
    goTo(Math.min(step + 1, 2));
  };

  const pay = form.handleSubmit(
    async (data) => {
      if (!quote || !quoteReady || !steamReady) return;
      setSubmitting(true);
      setSubmitProblem(null);
      writeDraft(data);
      try {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: quotePayloadItems(cart.items), currency, form: data, expectedTotal: quote.totals.total }),
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
      const firstStep = [0, 1, 2].find((index) => STEP_FIELDS[index].some((name) => getAt(errors, name)));
      const target = firstStep ?? 2;
      if (target !== step) setStep(target);
      setErrorSummary(buildSummary(STEP_FIELDS[target]));
    },
  );

  const problemText = (p: SubmitProblem | QuoteProblem | null) => {
    if (!p) return null;
    const code = KNOWN_PROBLEMS.includes(p.code) ? p.code : "SERVER_ERROR";
    return t(`problems.${code}`, {
      name: p.name ?? "",
      max: p.max ?? STORE_POLICY.limits.maxItemsPerOrder,
      total: formatPrice((p as SubmitProblem).total ?? totals.total, currency),
      email: COMPANY.email,
    });
  };

  const contactSummary = [values.contact?.firstName, values.contact?.lastName].filter(Boolean).join(" ");
  const billingSummary = [values.billing?.city, countryName(values.billing?.country)].filter(Boolean).join(", ");
  const imageFor = useMemo(() => new Map(cart.items.map((item) => [item.productId, item.imageUrl])), [cart.items]);

  if (!isHydrated || authLoading) {
    return <ShelfLoader block />;
  }

  if (cart.items.length === 0 && !submitting) {
    return (
      <div className="mx-auto max-w-narrow px-gutter py-12">
        <h1 className="m-0 text-step-4 leading-[1.1] text-ink">{t("title")}</h1>
        <EmptyState title={t("empty.title")} subtitle={t("empty.subtitle")} actionLabel={t("empty.action")} actionHref="/catalog" align="start" className="px-0" />
      </div>
    );
  }

  if (!user) return <SignInGate />;

  const counterProps = { items: cart.items, totals, currency, quote, loading };

  const contactPanel = (
    <div className="flex flex-col gap-5">
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
      <p className="meta m-0 text-ink-muted">{t("contact.phoneOptional")}</p>
    </div>
  );

  const deliveryPanel = (
    <div className="flex flex-col gap-8">
      <fieldset className="m-0 flex min-w-0 flex-col gap-4 border-0 p-0">
        <legend className="mb-3 p-0 text-step-1 font-semibold text-ink">{t("delivery.billingTitle")}</legend>
        <p className="meta m-0 text-ink-muted">{t("delivery.billingHint")}</p>
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
            address2: fe(formState.errors.billing?.address2?.message),
            city: fe(formState.errors.billing?.city?.message),
            postcode: fe(formState.errors.billing?.postcode?.message),
            country: fe(formState.errors.billing?.country?.message),
          }}
        />
      </fieldset>
      <section aria-labelledby="co-steam" className="flex flex-col gap-4 border-t border-line pt-6">
        <h3 id="co-steam" className="m-0 text-step-1 font-semibold text-ink">
          {t("delivery.steamTitle")}
        </h3>
        <p className="meta m-0 text-ink-muted">{t("delivery.steamLead", { method: STORE_POLICY.delivery.method, usual: STORE_POLICY.delivery.usualTime })}</p>
        {steamMissing && !steamReady ? <Alert tone="danger">{t("delivery.steamRequired")}</Alert> : null}
        <SteamDelivery
          nextPath={CHECKOUT_PATH}
          steam={steamAccount.steam}
          loading={steamAccount.loading}
          failed={steamAccount.failed}
          onSaved={(next) => {
            steamAccount.setSteam(next);
            setSteamMissing(false);
          }}
          onRetry={steamAccount.reload}
          headingLevel={3}
        />
      </section>
    </div>
  );

  const payLabel = quoteReady && quote ? t("review.pay", { amount: formatPrice(quote.totals.total, quote.currency) }) : t("review.payPending");
  const accepted = Boolean(values.acceptedPolicies) && Boolean(values.acceptedWaiver);
  const billingLines = [
    values.billing?.street,
    values.billing?.address2,
    [values.billing?.city, values.billing?.postcode?.toUpperCase()].filter(Boolean).join(" "),
    countryName(values.billing?.country),
  ].filter(Boolean);
  const lines =
    quote && quote.currency === currency
      ? quote.lines
      : cart.items.map((item, index) => ({ productId: item.productId, name: item.name, variantName: item.variantName ?? null, quantity: item.quantity, unit: totals.lines[index]?.unit ?? 0, total: totals.lines[index]?.total ?? 0 }));

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
            {values.contact?.phone ? (
              <>
                <br />
                <span className="tabular">{`${dialCodeFor(values.contact?.phoneCountry)} ${values.contact.phone}`}</span>
              </>
            ) : null}
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
            <span className="block">{t("review.steamTo", { name: steamAccount.steam?.personaName ?? steamAccount.steam?.steamId64 ?? "" })}</span>
            <span className="meta mt-1 block text-ink-muted">{t("review.billing", { address: billingLines.join(", ") })}</span>
          </dd>
        </div>
      </dl>

      <div>
        <h3 className="eyebrow m-0 mb-3 text-ink-muted">{t("review.itemsTitle")}</h3>
        <ul className="m-0 flex list-none flex-col divide-y divide-line p-0">
          {lines.map((line, index) => (
            <li key={`${line.productId}-${index}`} className="flex items-center gap-4 py-3">
              <Cubby src={imageFor.get(line.productId) ?? null} alt="" size="compact" sizes="48px" className="w-12 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="m-0 line-clamp-2 text-ui-sm font-medium text-ink">{line.name}</p>
                {line.variantName ? <p className="meta m-0 text-ink-muted">{line.variantName}</p> : null}
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

      <div className="flex flex-col gap-4">
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
        <Checkbox id="co-waiver" label={STORE_POLICY.waiver.text} error={fe(formState.errors.acceptedWaiver?.message)} {...register("acceptedWaiver")} />
        <p className="meta m-0 text-ink-muted">
          {t.rich("review.waiverNote", {
            days: STORE_POLICY.returns.withdrawalDays,
            link: (chunks) => (
              <Link href="/policies/returns#withdrawal" target="_blank" className="underline underline-offset-4">
                {chunks}
              </Link>
            ),
          })}
        </p>
      </div>

      {submitProblem ? (
        <Alert tone={submitProblem.code === "TOTAL_CHANGED" ? "warning" : "danger"} title={t(submitProblem.code === "TOTAL_CHANGED" ? "problems.totalChangedTitle" : "problems.title")}>
          {problemText(submitProblem)}
        </Alert>
      ) : null}
      {problem ? (
        <Alert tone="danger" title={t("problems.title")}>
          {problemText(problem)}
        </Alert>
      ) : null}

      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap-reverse items-center justify-between gap-4">
          <Button variant="ghost" onPress={() => goTo(1)}>
            {t("back")}
          </Button>
          <Button type="submit" size="lg" isDisabled={!accepted || !quoteReady || !steamReady} isLoading={submitting} startContent={<Lock size={18} aria-hidden="true" />} className="max-sm:w-full">
            {payLabel}
          </Button>
        </div>
        <div className="flex flex-col gap-3 border-t border-line pt-5">
          <PaymentLogos height={28} />
          <p className="meta m-0 text-ink-muted">{t("review.hosted")}</p>
          <p className="meta m-0 text-ink-muted">{STORE_POLICY.payment.providerName ? t("review.processedBy", { provider: STORE_POLICY.payment.providerName }) : t("review.processedByProvider")}</p>
          <p className="meta m-0 text-ink-muted">{t("review.threeDs")}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-narrow px-gutter pb-20 pt-8 lg:pt-12">
      <h1 className="m-0 mb-6 text-step-4 leading-[1.05] text-ink lg:mb-10">{t("title")}</h1>

      <div className="mb-6 border-y border-line lg:hidden">
        <AccordionItem title={t("counter.toggle", { total: formatPrice(totals.total, currency) })} open={summaryOpen} onOpenChange={setSummaryOpen} headingLevel={2} className="border-b-0">
          <CheckoutCounter {...counterProps} headingLevel={3} />
        </AccordionItem>
      </div>

      {paymentFailed ? (
        <Alert
          tone="danger"
          title={t("paymentFailed.title")}
          className="mb-6"
          action={
            <Button
              variant="outline"
              size="sm"
              onPress={() => {
                setPaymentFailed(false);
                goTo(2);
              }}
            >
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
              { id: "delivery", title: t("delivery.title"), summary: billingSummary || undefined, content: deliveryPanel },
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
