"use client";

import { useId } from "react";
import { VariantOption } from "@/components/ui/Chip";

export interface ProductVariantOption {
  id: string;
  name: string;
  sku: string;
  price: number | null;
  quantity: number;
  options: Record<string, string>;
}

export function variantAxes(variants: ProductVariantOption[]): { name: string; values: string[] }[] {
  const axes = new Map<string, string[]>();
  for (const v of variants) {
    for (const [key, value] of Object.entries(v.options)) {
      const list = axes.get(key) ?? [];
      if (!list.includes(value)) list.push(value);
      axes.set(key, list);
    }
  }
  return [...axes.entries()].map(([name, values]) => ({ name, values }));
}

export function matchVariant(variants: ProductVariantOption[], chosen: Record<string, string>): ProductVariantOption | null {
  const axes = variantAxes(variants);
  if (axes.some((axis) => !chosen[axis.name])) return null;
  return variants.find((v) => axes.every((axis) => v.options[axis.name] === chosen[axis.name])) ?? null;
}

export function VariantSelector({
  variants,
  chosen,
  onChoose,
}: {
  variants: ProductVariantOption[];
  chosen: Record<string, string>;
  onChoose: (axis: string, value: string) => void;
}) {
  const baseId = useId();
  const axes = variantAxes(variants);
  return (
    <div className="flex flex-col gap-5">
      {axes.map((axis) => {
        const labelId = `${baseId}-${axis.name}`;
        return (
          <div key={axis.name} className="flex flex-col gap-2.5">
            <p id={labelId} className="text-ui-sm font-medium text-ink">
              {axis.name}
              {chosen[axis.name] ? <span className="font-normal text-ink-muted">: {chosen[axis.name]}</span> : null}
            </p>
            <div role="group" aria-labelledby={labelId} className="flex flex-wrap gap-2 pb-2">
              {axis.values.map((value) => {
                const candidate = { ...chosen, [axis.name]: value };
                const reachable = variants.some((v) => v.quantity > 0 && Object.entries(candidate).every(([k, val]) => v.options[k] === val));
                return (
                  <VariantOption
                    key={value}
                    label={value}
                    selected={chosen[axis.name] === value}
                    unavailable={!reachable}
                    onClick={() => onChoose(axis.name, value)}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
