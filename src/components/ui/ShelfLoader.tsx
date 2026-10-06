import { cn } from "@/lib/utils/cn";

export interface ShelfLoaderProps {
  label?: string;
  block?: boolean;
  className?: string;
}

export function ShelfLoader({ label = "Loading", block = false, className }: ShelfLoaderProps) {
  const loader = (
    <span role="status" className={cn("inline-flex flex-col items-center", className)}>
      <span aria-hidden="true" className="inline-flex flex-col items-stretch motion-reduce:hidden">
        <span className="flex gap-1.5 px-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="size-2 border border-brand [animation:shelf-loader_480ms_steps(1,end)_infinite]"
              style={{ animationDelay: `${i * 160}ms` }}
            />
          ))}
        </span>
        <span className="shelf-rule-solid mt-1" />
      </span>
      <span className="meta hidden text-ink-muted motion-reduce:inline">{label}…</span>
      <span className="sr-only motion-reduce:hidden">{label}</span>
    </span>
  );
  if (!block) return loader;
  return <div className="flex items-center justify-center px-4 py-16">{loader}</div>;
}

export function SkeletonBar({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn("block h-3 bg-surface-2", className)} />;
}
