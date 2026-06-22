import type { ExecutionTier } from "@/lib/equity/types";
import type { Locale } from "@/lib/i18n/types";

const tierStyles: Record<ExecutionTier, string> = {
  A: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  B: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  C: "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400",
};

const tierLabels = {
  en: {
    A: "Tier A · API",
    B: "Tier B · App",
    C: "Research only",
  },
  zh: {
    A: "Tier A · API",
    B: "Tier B · App",
    C: "仅研究",
  },
} as const;

export function EquityTierBadge({
  tier,
  locale,
  symbol,
}: {
  tier: ExecutionTier;
  locale: Locale;
  symbol?: string;
}) {
  const label = tierLabels[locale][tier];
  const suffix = symbol && tier !== "C" ? ` · ${symbol}` : "";

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tierStyles[tier]}`}>
      {label}
      {suffix}
    </span>
  );
}
