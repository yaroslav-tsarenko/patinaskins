"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Button } from "./Button";
import { Plate } from "./Plate";
import { Alert } from "./Alert";

export interface StepperStep {
  id: string;
  title: string;
  summary?: ReactNode;
  content: ReactNode;
}

export interface StepperErrorSummary {
  fields: { id: string; label: string }[];
  message?: string;
}

export interface DrawerStepperProps {
  steps: StepperStep[];
  current: number;
  label: string;
  onEdit?: (index: number) => void;
  onContinue?: () => void;
  onBack?: () => void;
  continueLabel?: string | ((index: number) => string);
  continueDisabled?: boolean;
  continueLoading?: boolean;
  continueType?: "button" | "submit";
  errorSummary?: StepperErrorSummary | null;
  hideActions?: boolean;
  className?: string;
}

export function DrawerStepper({
  steps,
  current,
  label,
  onEdit,
  onContinue,
  onBack,
  continueLabel = "Continue",
  continueDisabled,
  continueLoading,
  continueType = "button",
  errorSummary,
  hideActions,
  className,
}: DrawerStepperProps) {
  const baseId = useId();
  const headingRefs = useRef<(HTMLHeadingElement | null)[]>([]);
  const summaryRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    headingRefs.current[current]?.focus();
  }, [current]);

  useEffect(() => {
    if (errorSummary && errorSummary.fields.length > 0) summaryRef.current?.focus();
  }, [errorSummary]);

  const resolvedContinue = typeof continueLabel === "function" ? continueLabel(current) : continueLabel;
  const active = steps[current];

  return (
    <div className={className}>
      <p aria-live="polite" className="sr-only">
        {active ? `Step ${current + 1} of ${steps.length}, ${active.title}` : ""}
      </p>
      <ol aria-label={label} className="m-0 list-none border-t border-line p-0">
        {steps.map((step, index) => {
          const state = index < current ? "complete" : index === current ? "current" : "upcoming";
          const open = state === "current";
          return (
            <li
              key={step.id}
              data-drawer=""
              data-state={state}
              aria-current={open ? "step" : undefined}
              className="border-b border-line"
            >
              <div className="flex min-h-14 flex-wrap items-center gap-x-4 gap-y-2 py-3 sm:min-h-16">
                <span aria-hidden="true" className={cn("tabular w-7 shrink-0 font-display text-step-2 leading-none", state === "upcoming" ? "text-ink-subtle" : "text-ink")}>
                  {index + 1}
                </span>
                <h2
                  ref={(node) => {
                    headingRefs.current[index] = node;
                  }}
                  tabIndex={open ? -1 : undefined}
                  id={`${baseId}-${step.id}-title`}
                  className={cn(
                    "m-0 min-w-0 flex-1 font-sans text-step-1 font-semibold tracking-normal focus-visible:outline-offset-4 max-sm:min-w-[55%]",
                    state === "upcoming" ? "text-ink-subtle" : "text-ink",
                  )}
                >
                  <span className="sr-only">Step {index + 1}: </span>
                  {step.title}
                </h2>
                {state === "complete" ? (
                  <span className="flex min-w-0 max-w-full items-center gap-4 pl-11 sm:pl-0">
                    {step.summary ? (
                      <Plate variant="brass" className="max-w-[min(60vw,320px)]">
                        {step.summary}
                      </Plate>
                    ) : null}
                    {onEdit ? (
                      <button
                        type="button"
                        onClick={() => onEdit(index)}
                        className="min-h-11 cursor-pointer text-ui-sm font-semibold text-ink underline decoration-1 underline-offset-4 hover-device:hover:decoration-2"
                      >
                        Change<span className="sr-only"> {step.title}</span>
                      </button>
                    ) : null}
                  </span>
                ) : null}
                {state === "upcoming" ? <Plate variant="neutral">Next</Plate> : null}
              </div>
              <div
                inert={!open}
                aria-labelledby={`${baseId}-${step.id}-title`}
                role="group"
                className={cn(
                  "grid transition-[grid-template-rows] duration-[260ms] ease-[var(--ease-furniture)]",
                  open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                )}
              >
                <div className="min-h-0 overflow-hidden">
                  <div className="bg-raised px-4 py-6 sm:px-6">
                    {open && errorSummary && errorSummary.fields.length > 0 ? (
                      <div ref={summaryRef} tabIndex={-1} className="mb-6 focus-visible:outline-offset-2">
                        <Alert tone="danger" title={errorSummary.message ?? `Check ${errorSummary.fields.length} ${errorSummary.fields.length === 1 ? "field" : "fields"}`}>
                          <ul className="m-0 flex list-none flex-col gap-1 p-0">
                            {errorSummary.fields.map((field) => (
                              <li key={field.id}>
                                <a href={`#${field.id}`} className="underline underline-offset-4">
                                  {field.label}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </Alert>
                      </div>
                    ) : null}
                    {step.content}
                    {!hideActions && open ? (
                      <div className="mt-8 flex flex-wrap-reverse items-center justify-between gap-4">
                        {index > 0 && onBack ? (
                          <Button variant="ghost" onPress={onBack}>
                            Back
                          </Button>
                        ) : (
                          <span />
                        )}
                        <Button
                          size="lg"
                          type={continueType}
                          onPress={continueType === "button" ? onContinue : undefined}
                          isDisabled={continueDisabled}
                          isLoading={continueLoading}
                          className="max-sm:w-full"
                        >
                          {resolvedContinue}
                        </Button>
                      </div>
                    ) : null}
                  </div>
                  <span aria-hidden="true" className="shelf-rule" />
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
