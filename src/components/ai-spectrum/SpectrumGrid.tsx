import { useState } from "react";
import type { Category } from "./data";
import CategoryChart from "./CategoryChart";

const CATEGORIES: Category[] = ["chat", "ide", "cli", "builder", "infra"];

export default function SpectrumGrid() {
  const [compareMax, setCompareMax] = useState(false);

  return (
    <div className="not-prose flex flex-col gap-8">
      {/* ── Global toggle ───────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 border border-ui rounded-md px-4 py-3 bg-background-2/40">
        <div className="inline-flex items-center border border-ui-2 rounded overflow-hidden text-xs font-mono">
          <button
            type="button"
            onClick={() => setCompareMax(false)}
            className={`px-3 py-1.5 transition-colors ${
              !compareMax
                ? "bg-foreground text-background"
                : "text-foreground-2 hover:text-foreground"
            }`}
          >
            Entry tier
          </button>
          <button
            type="button"
            onClick={() => setCompareMax(true)}
            className={`px-3 py-1.5 transition-colors border-l border-ui-2 ${
              compareMax
                ? "bg-foreground text-background"
                : "text-foreground-2 hover:text-foreground"
            }`}
          >
            Max tier
          </button>
        </div>
        <span className="text-xs text-foreground-3 sm:ml-auto">
          each chart has its own budget · drag the vertical line
        </span>
      </div>

      {/* ── Stacked full-width charts ───────── */}
      <div className="flex flex-col gap-8">
        {CATEGORIES.map((cat) => (
          <CategoryChart
            key={cat}
            category={cat}
            compareMax={compareMax}
          />
        ))}
      </div>

      {/* ── Legend ──────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono text-foreground-2">
        <span className="flex items-center gap-2">
          <svg width={18} height={18} viewBox="-9 -9 18 18">
            <circle
              cx={0}
              cy={0}
              r={8}
              fill="none"
              stroke="currentColor"
              strokeWidth={1}
              strokeDasharray="1.5 1.5"
            />
            <circle cx={0} cy={0} r={5} fill="currentColor" />
          </svg>
          Genuinely free
        </span>
        <span className="flex items-center gap-2">
          <svg width={24} height={12} viewBox="0 0 24 12">
            <line
              x1={1}
              x2={11}
              y1={6}
              y2={6}
              stroke="currentColor"
              strokeWidth={2}
              opacity={0.85}
              strokeLinecap="round"
            />
            <line
              x1={11}
              x2={23}
              y1={6}
              y2={6}
              stroke="currentColor"
              strokeWidth={2}
              opacity={0.14}
              strokeLinecap="round"
            />
          </svg>
          Price range (entry → max)
        </span>
        <span className="ml-auto text-foreground-3">
          hover a logo for details · drag the budget
        </span>
      </div>
    </div>
  );
}
