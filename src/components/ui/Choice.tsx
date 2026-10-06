"use client";

import { useEffect, useId, useRef, type InputHTMLAttributes, type ReactNode, type Ref } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { FieldError } from "./Field";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
  description?: ReactNode;
  count?: number;
  indeterminate?: boolean;
  error?: ReactNode;
  dense?: boolean;
  wrapperClassName?: string;
  ref?: Ref<HTMLInputElement>;
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (!ref) return;
  if (typeof ref === "function") ref(value);
  else (ref as { current: T | null }).current = value;
}

export function Checkbox({ label, description, count, indeterminate, error, dense, wrapperClassName, className, id, ref, ...rest }: CheckboxProps) {
  const autoId = useId();
  const fieldId = id || autoId;
  const local = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (local.current) local.current.indeterminate = Boolean(indeterminate);
  }, [indeterminate]);

  return (
    <div className={cn("flex flex-col gap-1", wrapperClassName)}>
      <label
        htmlFor={fieldId}
        className={cn(
          "group flex cursor-pointer items-start gap-2.5 text-step-0 leading-[1.4] text-ink",
          dense ? "min-h-11 items-center py-2" : "py-1",
          rest.disabled && "cursor-not-allowed text-ink-subtle",
        )}
      >
        <span className="relative mt-px grid size-5 shrink-0 place-items-center">
          <input
            ref={(node) => {
              local.current = node;
              assignRef(ref, node);
            }}
            id={fieldId}
            type="checkbox"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${fieldId}-error` : undefined}
            className={cn(
              "peer absolute inset-0 m-0 cursor-pointer appearance-none border-[1.5px] border-control bg-raised",
              "transition-colors duration-[160ms] hover-device:hover:border-ink-muted",
              "checked:border-brand checked:bg-brand indeterminate:border-brand indeterminate:bg-brand",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
              "disabled:cursor-not-allowed disabled:bg-surface-1 disabled:border-line",
              error && "border-danger",
              className,
            )}
            {...rest}
          />
          <Check size={14} strokeWidth={2} aria-hidden="true" className="pointer-events-none relative text-on-brand opacity-0 peer-checked:opacity-100 peer-indeterminate:opacity-0" />
          <span aria-hidden="true" className="pointer-events-none absolute h-0.5 w-2.5 bg-on-brand opacity-0 peer-indeterminate:opacity-100" />
        </span>
        <span className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
          <span className="min-w-0">
            {label}
            {description ? <span className="meta mt-0.5 block text-ink-muted">{description}</span> : null}
          </span>
          {typeof count === "number" ? <span className="tabular meta shrink-0 text-ink-muted">{count}</span> : null}
        </span>
      </label>
      {error ? <FieldError id={`${fieldId}-error`}>{error}</FieldError> : null}
    </div>
  );
}

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
  description?: ReactNode;
  count?: number;
  wrapperClassName?: string;
  ref?: Ref<HTMLInputElement>;
}

function RadioDot({ inputProps }: { inputProps: InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> } }) {
  return (
    <span className="relative mt-px grid size-5 shrink-0 place-items-center">
      <input
        type="radio"
        {...inputProps}
        className={cn(
          "peer absolute inset-0 m-0 cursor-pointer appearance-none rounded-full border-[1.5px] border-control bg-raised",
          "transition-colors duration-[160ms] hover-device:hover:border-ink-muted checked:border-brand",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
          "disabled:cursor-not-allowed disabled:bg-surface-1 disabled:border-line",
          inputProps.className,
        )}
      />
      <span aria-hidden="true" className="pointer-events-none relative size-2 rounded-full bg-brand opacity-0 peer-checked:opacity-100" />
    </span>
  );
}

export function Radio({ label, description, count, wrapperClassName, id, ref, ...rest }: RadioProps) {
  const autoId = useId();
  const fieldId = id || autoId;
  return (
    <label htmlFor={fieldId} className={cn("flex min-h-11 cursor-pointer items-center gap-2.5 py-2 text-step-0 leading-[1.4] text-ink", wrapperClassName)}>
      <RadioDot inputProps={{ ...rest, id: fieldId, ref }} />
      <span className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
        <span className="min-w-0">
          {label}
          {description ? <span className="meta mt-0.5 block text-ink-muted">{description}</span> : null}
        </span>
        {typeof count === "number" ? <span className="tabular meta shrink-0 text-ink-muted">{count}</span> : null}
      </span>
    </label>
  );
}

export interface RadioRowProps extends Omit<RadioProps, "count"> {
  meta?: ReactNode;
  aside?: ReactNode;
}

export function RadioRow({ label, description, meta, aside, wrapperClassName, id, ref, ...rest }: RadioRowProps) {
  const autoId = useId();
  const fieldId = id || autoId;
  return (
    <label
      htmlFor={fieldId}
      className={cn(
        "flex cursor-pointer items-start gap-3 border border-control px-4 py-4 transition-colors duration-[160ms]",
        "hover-device:hover:border-ink-muted has-checked:border-brand has-checked:bg-raised has-checked:shadow-[inset_0_0_0_1px_var(--color-accent)]",
        "has-disabled:cursor-not-allowed has-disabled:text-ink-subtle",
        wrapperClassName,
      )}
    >
      <RadioDot inputProps={{ ...rest, id: fieldId, ref }} />
      <span className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="min-w-0">
          <span className="block font-medium text-ink">{label}</span>
          {description ? <span className="meta mt-0.5 block text-ink-muted">{description}</span> : null}
          {meta ? <span className="meta mt-0.5 block text-ink-muted">{meta}</span> : null}
        </span>
        {aside ? <span className="tabular shrink-0 text-ink">{aside}</span> : null}
      </span>
    </label>
  );
}

export interface SwitchProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  lockedText?: ReactNode;
  id?: string;
  className?: string;
}

export function Switch({ checked, onChange, label, description, disabled, lockedText, id, className }: SwitchProps) {
  const autoId = useId();
  const fieldId = id || autoId;
  return (
    <div className={cn("flex items-start justify-between gap-6", className)}>
      <div className="min-w-0">
        <span id={`${fieldId}-label`} className="block text-step-0 font-medium text-ink">
          {label}
        </span>
        {description ? (
          <span id={`${fieldId}-desc`} className="meta mt-1 block text-ink-muted">
            {description}
          </span>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {lockedText ? <span className="meta text-ink-muted">{lockedText}</span> : null}
        <button
          id={fieldId}
          type="button"
          role="switch"
          aria-checked={checked}
          aria-labelledby={`${fieldId}-label`}
          aria-describedby={description ? `${fieldId}-desc` : undefined}
          disabled={disabled}
          onClick={() => onChange?.(!checked)}
          className={cn(
            "relative h-6 w-11 shrink-0 border border-control transition-colors duration-[260ms] ease-[var(--ease-std)]",
            checked ? "border-brand bg-brand" : "bg-raised hover-device:hover:border-ink-muted",
            disabled ? "cursor-not-allowed opacity-80" : "cursor-pointer",
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "absolute left-[3px] top-[3px] size-4 transition-transform duration-[260ms] ease-[var(--ease-furniture)]",
              checked ? "translate-x-5 bg-on-brand" : "translate-x-0 bg-control",
            )}
          />
        </button>
      </div>
    </div>
  );
}
