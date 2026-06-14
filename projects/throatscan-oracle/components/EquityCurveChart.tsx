import type { EquityPoint } from "@/lib/backtest";

interface EquityCurveChartProps {
  data: EquityPoint[];
  portfolioLabel: string;
  benchmarkLabel: string;
}

export function EquityCurveChart({
  data,
  portfolioLabel,
  benchmarkLabel,
}: EquityCurveChartProps) {
  if (data.length === 0) {
    return null;
  }

  const width = 640;
  const height = 220;
  const padding = { top: 16, right: 16, bottom: 28, left: 44 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const values = data.flatMap((point) => [point.portfolio, point.benchmark]);
  const minValue = Math.min(...values) * 0.98;
  const maxValue = Math.max(...values) * 1.02;

  const x = (index: number) =>
    padding.left + (index / Math.max(data.length - 1, 1)) * chartWidth;
  const y = (value: number) =>
    padding.top + chartHeight - ((value - minValue) / Math.max(maxValue - minValue, 1)) * chartHeight;

  const toPath = (key: "portfolio" | "benchmark") =>
    data
      .map((point, index) => `${index === 0 ? "M" : "L"} ${x(index)} ${y(point[key])}`)
      .join(" ");

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full min-w-[320px]">
        <line
          x1={padding.left}
          y1={padding.top + chartHeight}
          x2={width - padding.right}
          y2={padding.top + chartHeight}
          stroke="currentColor"
          className="text-zinc-300 dark:text-zinc-700"
        />
        <path
          d={toPath("benchmark")}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-zinc-400"
        />
        <path
          d={toPath("portfolio")}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="text-emerald-600 dark:text-emerald-400"
        />
        <text
          x={padding.left}
          y={padding.top - 2}
          className="fill-emerald-700 text-[10px] dark:fill-emerald-300"
        >
          {portfolioLabel}
        </text>
        <text
          x={padding.left + 110}
          y={padding.top - 2}
          className="fill-zinc-500 text-[10px]"
        >
          {benchmarkLabel}
        </text>
        <text x={padding.left} y={height - 8} className="fill-zinc-500 text-[10px]">
          {data[0]?.date}
        </text>
        <text
          x={width - padding.right - 72}
          y={height - 8}
          className="fill-zinc-500 text-[10px]"
        >
          {data[data.length - 1]?.date}
        </text>
      </svg>
    </div>
  );
}
