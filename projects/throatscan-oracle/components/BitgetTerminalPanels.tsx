import type { PaperOrder, PaperTradingStatus } from "@/lib/paperTrading/types";
import type { Locale } from "@/lib/i18n/types";

function publicMarketStatus(paperStatus: PaperTradingStatus | null): {
  label: string;
  className: string;
} {
  if (paperStatus?.public_market_live) {
    return { label: "LIVE", className: "terminal-green" };
  }
  if (paperStatus) {
    return { label: "OFFLINE", className: "text-[var(--cursor-fg-subtle)]" };
  }
  return { label: "--", className: "text-[var(--cursor-fg-subtle)]" };
}

export function BitgetConnectionSidebar({
  locale,
  paperStatus,
  recentPaperOrders,
  onConfigure,
  terminalLabels,
}: {
  locale: Locale;
  paperStatus: PaperTradingStatus | null;
  recentPaperOrders: PaperOrder[];
  onConfigure: () => void;
  terminalLabels: {
    paperMode: string;
    publicMarket: string;
    tradingApi: string;
    accountBalance: string;
    configureConnection: string;
    paperOrders: string;
  };
}) {
  const market = publicMarketStatus(paperStatus);

  return (
    <div className="sidebar-connection mx-1.5 mt-4 p-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--cursor-fg-muted)]">Bitget</p>
        <span className="rounded bg-[var(--cursor-accent-dim)] px-1.5 py-0.5 text-[9px] font-semibold uppercase text-[var(--cursor-accent)]">
          {terminalLabels.paperMode}
        </span>
      </div>
      <div className="mt-3 space-y-2 text-xs">
        <div className="flex items-center justify-between gap-3 text-[var(--cursor-fg-muted)]">
          <span>{terminalLabels.publicMarket}</span>
          <span className={market.className}>{market.label}</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-[var(--cursor-fg-muted)]">
          <span>{terminalLabels.tradingApi}</span>
          <span
            className={
              paperStatus?.demo_configured
                ? "terminal-green"
                : paperStatus?.mode === "local_paper"
                  ? "terminal-amber"
                  : "text-[var(--cursor-fg-subtle)]"
            }
          >
            {paperStatus?.demo_configured ? "DEMO" : paperStatus?.mode === "local_paper" ? "PAPER" : "OFF"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 text-[var(--cursor-fg-muted)]">
          <span>{terminalLabels.accountBalance}</span>
          <span className="font-mono text-[var(--cursor-fg)]">
            {paperStatus?.balance_usdt !== undefined
              ? `${paperStatus.balance_usdt.toFixed(2)} USDT`
              : paperStatus?.mode === "local_paper"
                ? locale === "zh"
                  ? "本地纸交易"
                  : "Local paper"
                : "-- USDT"}
          </span>
        </div>
      </div>
      <button type="button" onClick={onConfigure} className="cursor-btn-ghost mt-3 w-full px-2 py-1.5 text-xs">
        {terminalLabels.configureConnection}
      </button>
      {recentPaperOrders.length > 0 ? (
        <div className="mt-3 border-t border-[var(--cursor-border)] pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--cursor-fg-subtle)]">
            {terminalLabels.paperOrders}
          </p>
          <ul className="mt-2 space-y-1 text-[10px] text-[var(--cursor-fg-muted)]">
            {recentPaperOrders.slice(0, 3).map((order) => (
              <li key={order.order_id} className="font-mono">
                {order.symbol} · {order.venue} · {order.status}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function ExecutionConsolePanel({
  locale,
  paperStatus,
  paperMessage,
  paperSubmitting,
  showExecute,
  onConfigure,
  onExecute,
  terminalLabels,
}: {
  locale: Locale;
  paperStatus: PaperTradingStatus | null;
  paperMessage: string | null;
  paperSubmitting: boolean;
  showExecute: boolean;
  onConfigure: () => void;
  onExecute: () => void;
  terminalLabels: {
    executionConsole: string;
    executionHint: string;
    publicMarket: string;
    tradingApi: string;
    accountBalance: string;
    runnabilityLevel: string;
    runnabilityBitgetDemo: string;
    runnabilityLocalPaper: string;
    runnabilityBacktest: string;
    executingPaper: string;
    executePaperBasket: string;
    configureConnection: string;
    permissionValue: string;
  };
}) {
  const market = publicMarketStatus(paperStatus);

  return (
    <aside className="execution-card rounded-xl border border-[var(--cursor-border-strong)] bg-[var(--cursor-sidebar)] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{terminalLabels.executionConsole}</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">{terminalLabels.executionHint}</p>
        </div>
        <span className="relative mt-1 flex h-2 w-2 shrink-0">
          {paperStatus?.public_market_live ? (
            <>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </>
          ) : (
            <span className="relative inline-flex h-2 w-2 rounded-full bg-zinc-600" />
          )}
        </span>
      </div>
      <div className="mt-5 space-y-1 rounded-lg border border-[var(--cursor-border)] bg-[var(--cursor-panel)] p-1">
        <div className="flex items-center justify-between rounded-md px-3 py-2.5 text-xs">
          <span className="text-zinc-500">{terminalLabels.publicMarket}</span>
          <span
            className={`font-mono font-semibold ${
              paperStatus?.public_market_live ? "text-emerald-300" : "text-zinc-600"
            }`}
          >
            {market.label}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-md px-3 py-2.5 text-xs">
          <span className="text-zinc-500">{terminalLabels.tradingApi}</span>
          <span
            className={`font-mono font-semibold ${
              paperStatus?.demo_configured
                ? "text-emerald-300"
                : paperStatus?.mode === "local_paper"
                  ? "text-amber-300"
                  : "text-zinc-600"
            }`}
          >
            {paperStatus?.demo_configured
              ? "DEMO LIVE"
              : paperStatus?.mode === "local_paper"
                ? "PAPER LIVE"
                : "OFFLINE"}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-md px-3 py-2.5 text-xs">
          <span className="text-zinc-500">{terminalLabels.accountBalance}</span>
          <span className="font-mono text-zinc-300">
            {paperStatus?.balance_usdt !== undefined
              ? `${paperStatus.balance_usdt.toFixed(2)} USDT`
              : paperStatus?.mode === "local_paper"
                ? locale === "zh"
                  ? "本地纸交易"
                  : "Local paper"
                : "-- USDT"}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-md px-3 py-2.5 text-xs">
          <span className="text-zinc-500">{terminalLabels.runnabilityLevel}</span>
          <span className="font-mono text-sky-300">
            {paperStatus?.runnability_level === "bitget_demo"
              ? terminalLabels.runnabilityBitgetDemo
              : paperStatus?.runnability_level === "local_paper"
                ? terminalLabels.runnabilityLocalPaper
                : terminalLabels.runnabilityBacktest}
          </span>
        </div>
      </div>
      {showExecute ? (
        <button
          type="button"
          onClick={onExecute}
          disabled={paperSubmitting}
          className="mt-4 w-full rounded-lg bg-emerald-400 px-3 py-2.5 text-xs font-bold text-[#03130d] transition hover:brightness-110 disabled:opacity-60"
        >
          {paperSubmitting ? terminalLabels.executingPaper : terminalLabels.executePaperBasket}
        </button>
      ) : null}
      <button
        type="button"
        onClick={onConfigure}
        className="mt-3 w-full rounded-lg border border-emerald-400/35 bg-emerald-400/10 px-3 py-2.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/15"
      >
        {terminalLabels.configureConnection}
      </button>
      {paperMessage ? (
        <p className="mt-3 text-xs leading-5 text-emerald-200/90">{paperMessage}</p>
      ) : null}
      <p className="mt-3 text-center text-[10px] leading-4 text-zinc-600">{terminalLabels.permissionValue}</p>
    </aside>
  );
}
