import { useMemo, useRef, useState, useCallback } from "react";
import {
  TOOLS,
  type Category,
  type Tool,
  CATEGORY_LABELS,
  CATEGORY_DESCRIPTIONS,
  Y_AXIS_LABELS,
  Y_CONFIG,
  FREE_KIND_LABELS,
} from "./data";
import { LOGOS, svgInner } from "./logos";

const W = 1400;
const H = 760;
const PAD = { top: 60, right: 100, bottom: 120, left: 180 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

const PRICE_MIN = 1;
const PRICE_MAX = 250;
const PRICE_TICKS = [1, 5, 20, 50, 200];

function priceX(p: number): number {
  const clamped = Math.max(PRICE_MIN, Math.min(p, PRICE_MAX));
  const t =
    (Math.log(clamped) - Math.log(PRICE_MIN)) /
    (Math.log(PRICE_MAX) - Math.log(PRICE_MIN));
  return t * PLOT_W;
}

function makeY(cat: Category) {
  const cfg = Y_CONFIG[cat];
  return (v: number): number => {
    const clamped = Math.max(cfg.min, Math.min(cfg.max, v));
    let t: number;
    if (cfg.type === "log") {
      t =
        (Math.log(clamped) - Math.log(cfg.min)) /
        (Math.log(cfg.max) - Math.log(cfg.min));
    } else {
      t = (clamped - cfg.min) / (cfg.max - cfg.min);
    }
    // invert: higher y values render near top
    return PLOT_H - t * PLOT_H;
  };
}

type Placed = Tool & { cx: number; cy: number };

// Force-directed anti-collision: iteratively push overlapping dots apart
// while keeping cx anchored (x = price, don't lie about the x axis).
function place(tools: Tool[], cat: Category): Placed[] {
  const y = makeY(cat);
  const minDist = 96; // 2 * (r=30 + ring=8) + 20 breathing room
  const minX = PAD.left + 40;
  const maxX = PAD.left + PLOT_W - 40;
  const minY = PAD.top + 40;
  const maxY = PAD.top + PLOT_H - 40;

  // seed deterministic jitter so tools with identical (price, y) don't start perfectly stacked
  function hash(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return h;
  }
  const nodes: Placed[] = tools.map((t) => {
    const h = hash(t.id);
    return {
      ...t,
      cx: PAD.left + priceX(t.price) + ((h % 7) - 3),
      cy: PAD.top + y(t.y) + (((h >> 3) % 7) - 3),
    };
  });

  // 60 relaxation passes
  for (let iter = 0; iter < 60; iter++) {
    let moved = false;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = b.cx - a.cx;
        const dy = b.cy - a.cy;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
        if (dist < minDist) {
          const overlap = (minDist - dist) / 2;
          // unit vector
          const ux = dx / dist;
          const uy = dy / dist;
          // prefer vertical separation (weight y more than x to preserve price axis fidelity)
          const wx = 0.15;
          const wy = 1;
          a.cx -= ux * overlap * wx;
          a.cy -= uy * overlap * wy;
          b.cx += ux * overlap * wx;
          b.cy += uy * overlap * wy;
          moved = true;
        }
      }
    }
    // clamp to plot bounds
    for (const n of nodes) {
      n.cx = Math.max(minX, Math.min(maxX, n.cx));
      n.cy = Math.max(minY, Math.min(maxY, n.cy));
    }
    if (!moved) break;
  }
  return nodes;
}

function Logo({
  tool,
  cx,
  cy,
  r,
  active,
  dim,
}: {
  tool: Tool;
  cx: number;
  cy: number;
  r: number;
  active: boolean;
  dim: boolean;
}) {
  const opacity = dim ? 0.22 : 1;
  const raw = LOGOS[tool.id];
  if (raw) {
    const { viewBox, inner } = svgInner(raw);
    const [vbX, vbY, vbW, vbH] = viewBox.split(/\s+/).map(Number);
    // Fit the logo into a square inscribed in the chip circle (80% of diameter).
    // Scale uniformly by the max side so it fits, then center based on the actual viewBox origin.
    const fit = r * 1.44; // target square side in chart units
    const scale = fit / Math.max(vbW, vbH);
    const scaledW = vbW * scale;
    const scaledH = vbH * scale;
    const tx = cx - scaledW / 2 - vbX * scale;
    const ty = cy - scaledH / 2 - vbY * scale;
    return (
      <g opacity={opacity}>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill={active ? "var(--color-foreground)" : "var(--color-background)"}
          stroke="var(--color-foreground)"
          strokeWidth={1.25}
        />
        <g
          transform={`translate(${tx}, ${ty}) scale(${scale})`}
          fill={active ? "var(--color-background)" : "var(--color-foreground)"}
          color={active ? "var(--color-background)" : "var(--color-foreground)"}
          dangerouslySetInnerHTML={{ __html: inner }}
          style={{ pointerEvents: "none" }}
        />
      </g>
    );
  }
  // fallback: circle + letter
  return (
    <g opacity={opacity}>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={active ? "var(--color-foreground)" : "var(--color-background)"}
        stroke="var(--color-foreground)"
        strokeWidth={1.25}
      />
      <text
        x={cx}
        y={cy}
        fontSize={r * 0.95}
        textAnchor="middle"
        dominantBaseline="central"
        fill={active ? "var(--color-background)" : "var(--color-foreground)"}
        style={{ fontFamily: "var(--font-mono, ui-monospace)", fontWeight: 700 }}
      >
        {tool.name[0]}
      </text>
    </g>
  );
}

// Inverse of priceX: SVG x (in the [0..PLOT_W] scale) → price in USD
function xToPrice(x: number): number {
  const t = Math.max(0, Math.min(1, x / PLOT_W));
  return Math.round(
    Math.exp(Math.log(PRICE_MIN) + t * (Math.log(PRICE_MAX) - Math.log(PRICE_MIN))),
  );
}

export default function CategoryChart({
  category,
  compareMax,
}: {
  category: Category;
  compareMax: boolean;
}) {
  const [focus, setFocus] = useState<Tool | null>(null);
  const [budget, setBudget] = useState(20);
  const [dragging, setDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const handlePointer = useCallback((clientX: number) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    // convert clientX to viewBox x
    const svgX = ((clientX - rect.left) / rect.width) * W;
    const plotX = svgX - PAD.left;
    const next = xToPrice(plotX);
    setBudget(Math.max(1, Math.min(250, next)));
  }, []);
  const tools = useMemo(
    () => TOOLS.filter((t) => t.category === category),
    [category],
  );
  const placed = useMemo(() => place(tools, category), [tools, category]);
  const cfg = Y_CONFIG[category];
  const y = makeY(category);
  const budgetX = PAD.left + priceX(Math.max(PRICE_MIN, budget));

  return (
    <div className="relative flex flex-col border border-ui rounded bg-background">
      <div className="flex items-baseline justify-between px-6 pt-4 pb-1">
        <h3 className="text-base font-bold text-foreground uppercase tracking-wider">
          {CATEGORY_LABELS[category]}
          <span className="ml-2 text-xs font-mono text-foreground-3">
            {tools.length}
          </span>
        </h3>
        <span className="text-[10px] font-mono uppercase tracking-wider text-foreground-3">
          y: {Y_AXIS_LABELS[category]}
        </span>
      </div>
      <p className="px-6 pb-2 text-xs text-foreground-2">
        {CATEGORY_DESCRIPTIONS[category]}
      </p>
      <div className="px-6 pb-2 text-xs font-mono text-foreground-2 flex items-center gap-2">
        <span className="text-foreground-3 uppercase tracking-wider">Budget</span>
        <span className="text-foreground">
          ${budget}
          <span className="text-foreground-3">/mo</span>
        </span>
        <span className="text-foreground-3">· drag the line</span>
      </div>

      <div className="relative overflow-x-auto">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto select-none min-w-[720px]"
          style={{
            fontFamily: "var(--font-mono, ui-monospace)",
            overflow: "visible",
            touchAction: "none",
          }}
          onPointerDown={(e) => {
            e.preventDefault();
            setDragging(true);
            (e.target as Element).setPointerCapture?.(e.pointerId);
            handlePointer(e.clientX);
          }}
          onPointerMove={(e) => {
            if (dragging) handlePointer(e.clientX);
          }}
          onPointerUp={(e) => {
            setDragging(false);
            (e.target as Element).releasePointerCapture?.(e.pointerId);
          }}
          onPointerCancel={() => setDragging(false)}
        >
          {/* Y axis grid + labels */}
          {cfg.ticks.map((t) => (
            <g key={`y-${t}`}>
              <line
                x1={PAD.left}
                x2={PAD.left + PLOT_W}
                y1={PAD.top + y(t)}
                y2={PAD.top + y(t)}
                stroke="var(--color-ui-2)"
                strokeWidth={1.25}
                strokeDasharray="3 6"
              />
              <text
                x={PAD.left - 20}
                y={PAD.top + y(t) + 10}
                fontSize={26}
                fill="var(--color-foreground-2)"
                textAnchor="end"
              >
                {cfg.format(t)}
              </text>
            </g>
          ))}

          {/* X axis ticks */}
          {PRICE_TICKS.map((p) => (
            <g key={`x-${p}`}>
              <line
                x1={PAD.left + priceX(p)}
                x2={PAD.left + priceX(p)}
                y1={PAD.top}
                y2={PAD.top + PLOT_H}
                stroke="var(--color-ui)"
                strokeWidth={1.25}
              />
              <text
                x={PAD.left + priceX(p)}
                y={PAD.top + PLOT_H + 38}
                fontSize={26}
                fill="var(--color-foreground-2)"
                textAnchor="middle"
              >
                ${p}
              </text>
            </g>
          ))}
          <text
            x={PAD.left + PLOT_W / 2}
            y={PAD.top + PLOT_H + 74}
            fontSize={18}
            fill="var(--color-foreground-3)"
            textAnchor="middle"
            className="uppercase tracking-widest"
          >
            USD / month
          </text>

          {/* Budget line (draggable) */}
          <g style={{ cursor: "ew-resize" }}>
            {/* fat hit area */}
            <line
              x1={budgetX}
              x2={budgetX}
              y1={PAD.top - 12}
              y2={PAD.top + PLOT_H + 12}
              stroke="transparent"
              strokeWidth={36}
            />
            <line
              x1={budgetX}
              x2={budgetX}
              y1={PAD.top - 6}
              y2={PAD.top + PLOT_H + 6}
              stroke="var(--color-foreground)"
              strokeWidth={2}
              strokeDasharray="6 5"
              opacity={dragging ? 1 : 0.85}
            />
            {/* grip handles */}
            <rect
              x={budgetX - 6}
              y={PAD.top + PLOT_H / 2 - 16}
              width={12}
              height={32}
              rx={2}
              fill="var(--color-background)"
              stroke="var(--color-foreground)"
              strokeWidth={2}
            />
            <line
              x1={budgetX - 2}
              x2={budgetX - 2}
              y1={PAD.top + PLOT_H / 2 - 8}
              y2={PAD.top + PLOT_H / 2 + 8}
              stroke="var(--color-foreground)"
              strokeWidth={1}
            />
            <line
              x1={budgetX + 2}
              x2={budgetX + 2}
              y1={PAD.top + PLOT_H / 2 - 8}
              y2={PAD.top + PLOT_H / 2 + 8}
              stroke="var(--color-foreground)"
              strokeWidth={1}
            />
            {/* price badge on top */}
            <rect
              x={budgetX - 60}
              y={PAD.top - 48}
              width={120}
              height={34}
              rx={3}
              fill="var(--color-foreground)"
            />
            <text
              x={budgetX}
              y={PAD.top - 25}
              fontSize={22}
              fill="var(--color-background)"
              textAnchor="middle"
              className="uppercase tracking-wider font-bold"
            >
              ${budget}/MO
            </text>
          </g>

          {/* Price range bars */}
          {placed.map((t) => {
            if (!t.priceMax || t.priceMax <= t.price) return null;
            const x1 = PAD.left + priceX(t.price);
            const x2 = PAD.left + priceX(t.priceMax);
            const xCut = Math.max(x1, Math.min(x2, budgetX));
            return (
              <g key={`bar-${t.id}`}>
                <line
                  x1={x1}
                  x2={x2}
                  y1={t.cy}
                  y2={t.cy}
                  stroke="var(--color-foreground)"
                  strokeWidth={3.5}
                  opacity={0.16}
                  strokeLinecap="round"
                />
                {x1 < budgetX && (
                  <line
                    x1={x1}
                    x2={xCut}
                    y1={t.cy}
                    y2={t.cy}
                    stroke="var(--color-foreground)"
                    strokeWidth={3.5}
                    opacity={0.9}
                    strokeLinecap="round"
                  />
                )}
              </g>
            );
          })}

          {/* Dots + labels */}
          {placed.map((t) => {
            const compareAt = compareMax ? (t.priceMax ?? t.price) : t.price;
            const inBudget = compareAt <= budget;
            const isFocus = focus?.id === t.id;
            const r = isFocus ? 36 : 30;
            return (
              <g
                key={t.id}
                onMouseEnter={() => setFocus(t)}
                onMouseLeave={() => setFocus(null)}
                style={{ cursor: "pointer" }}
              >
                <circle cx={t.cx} cy={t.cy} r={44} fill="transparent" />
                {t.freeKind === "yes" && (
                  <circle
                    cx={t.cx}
                    cy={t.cy}
                    r={r + 8}
                    fill="none"
                    stroke="var(--color-foreground)"
                    strokeWidth={1.5}
                    opacity={inBudget ? 0.55 : 0.2}
                    strokeDasharray="2 3"
                  />
                )}
                <Logo
                  tool={t}
                  cx={t.cx}
                  cy={t.cy}
                  r={r}
                  active={inBudget}
                  dim={!inBudget && !isFocus}
                />
              </g>
            );
          })}

          {/* Plot frame */}
          <rect
            x={PAD.left}
            y={PAD.top}
            width={PLOT_W}
            height={PLOT_H}
            fill="none"
            stroke="var(--color-foreground)"
            strokeWidth={1}
          />
        </svg>

        {/* Tooltip */}
        {focus && (
          <div
            className="absolute border border-foreground bg-background p-4 text-sm w-[300px] shadow-lg pointer-events-none z-10"
            style={{
              left: `${((placed.find((p) => p.id === focus.id)?.cx ?? 0) / W) * 100}%`,
              top: `${((placed.find((p) => p.id === focus.id)?.cy ?? 0) / H) * 100}%`,
              transform: `translate(${
                (placed.find((p) => p.id === focus.id)?.cx ?? 0) > W * 0.6
                  ? "calc(-100% - 16px)"
                  : "16px"
              }, ${
                (placed.find((p) => p.id === focus.id)?.cy ?? 0) > H * 0.55
                  ? "calc(-100% - 16px)"
                  : "16px"
              })`,
            }}
          >
            <div className="font-bold text-foreground mb-1 text-base">{focus.name}</div>
            <div className="text-foreground-2 mb-3">{focus.blurb}</div>
            <div className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-1 font-mono text-xs">
              <span className="text-foreground-3">price</span>
              <span>
                {focus.priceMax && focus.priceMax > focus.price
                  ? `$${focus.price}–${focus.priceMax}/mo`
                  : `$${focus.price}/mo`}
              </span>
              <span className="text-foreground-3">
                {Y_AXIS_LABELS[category].toLowerCase()}
              </span>
              <span>{cfg.format(focus.y)}</span>
              <span className="text-foreground-3">free</span>
              <span>{FREE_KIND_LABELS[focus.freeKind]}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
