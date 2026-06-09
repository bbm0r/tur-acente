import { Star } from "lucide-react";

export function Stars({ value = 0, count }: { value?: number | null; count?: number }) {
  const v = value ?? 0;
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i <= Math.round(v) ? "fill-accent-400 text-accent-400" : "text-slate-300"}`}
          />
        ))}
      </span>
      {count != null && (
        <span className="text-ink-muted">
          {v.toFixed(1)} <span className="text-slate-400">({count})</span>
        </span>
      )}
    </span>
  );
}
