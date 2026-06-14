import type { CompanyBreakdown, ThroatRole } from "../types";
import type { Locale } from "./types";

const ui = {
  en: {
    subtitle:
      "Supply Chain Bottleneck Intelligence System — detect choke points, not stock ratings.",
    industry: "Industry",
    industryPlaceholder: "e.g. Semiconductors",
    runAnalysis: "Run Analysis",
    running: "Running...",
    industryChain: "Industry Chain",
    top5: "Top 5 Companies",
    throatScore: "Throat Score",
    scarceResource: "Scarce resource",
    canFunctionWithout: "Can chain function without it",
    replaceability: "Replaceability (1–3 years)",
    conclusionTitle: "ThroatScan Conclusion",
    whereBottleneck: "Where is the bottleneck?",
    primaryBottleneck: "Primary Bottleneck Company",
    highScoreNotChoke: "High score but NOT choke points",
    noneInTop: "None in the top-ranked set.",
    summary: "Summary",
    backtestTitle: "Backtest & Validation",
    rebalancing: "rebalancing",
    totalReturn: "Total Return",
    spyBenchmark: "SPY Benchmark",
    maxDrawdown: "Max Drawdown",
    volatility: "Volatility (ann.)",
    alpha: "Alpha vs SPY",
    bottleneckStrategyScore: "Bottleneck Strategy Score",
    equityCurve: "Equity Curve",
    portfolioLine: "Top 5 Portfolio",
    benchmarkLine: "SPY Benchmark",
    performanceTable: "Performance Table",
    ticker: "Ticker",
    role: "Role",
    weight: "Weight",
    bottleneckVsNon: "Bottleneck vs Non-Bottleneck",
    roleGroup: "Role Group",
    tickers: "Tickers",
    basketReturn: "Basket Return",
    avgMonthly: "Avg Monthly",
    langEn: "EN",
    langZh: "中文",
  },
  zh: {
    subtitle: "供应链瓶颈情报系统 — 识别 choke point，而非普通股票评分。",
    industry: "行业",
    industryPlaceholder: "例如：Semiconductors（半导体）",
    runAnalysis: "运行分析",
    running: "分析中...",
    industryChain: "产业链",
    top5: "Top 5 公司",
    throatScore: "瓶颈评分",
    scarceResource: "稀缺资源",
    canFunctionWithout: "无此公司，产业链能否运转",
    replaceability: "可替代性（1–3 年）",
    conclusionTitle: "ThroatScan 结论",
    whereBottleneck: "瓶颈在哪里？",
    primaryBottleneck: "Primary 瓶颈公司",
    highScoreNotChoke: "高分但非 choke point",
    noneInTop: "Top 排名中暂无。",
    summary: "总结",
    backtestTitle: "回测与验证",
    rebalancing: "再平衡",
    totalReturn: "总回报",
    spyBenchmark: "SPY 基准",
    maxDrawdown: "最大回撤",
    volatility: "波动率（年化）",
    alpha: "相对 SPY Alpha",
    bottleneckStrategyScore: "瓶颈策略得分",
    equityCurve: "净值曲线",
    portfolioLine: "Top 5 组合",
    benchmarkLine: "SPY 基准",
    performanceTable: "绩效表",
    ticker: "代码",
    role: "角色",
    weight: "权重",
    bottleneckVsNon: "瓶颈 vs 非瓶颈",
    roleGroup: "角色分组",
    tickers: "标的",
    basketReturn: "篮子回报",
    avgMonthly: "月均回报",
    langEn: "EN",
    langZh: "中文",
  },
} as const;

const breakdownLabels: Record<Locale, Record<keyof CompanyBreakdown, string>> = {
  en: {
    bottleneck_strength: "Bottleneck Strength",
    supply_chain_control: "Supply Chain Control",
    replaceability: "Replaceability (high = easy to replace)",
    industry_dependency: "Industry Dependency",
  },
  zh: {
    bottleneck_strength: "瓶颈强度",
    supply_chain_control: "供应链控制力",
    replaceability: "可替代性（越高越易替代）",
    industry_dependency: "行业依赖度",
  },
};

const throatRoles: Record<Locale, Record<ThroatRole, string>> = {
  en: {
    "CORE BOTTLENECK": "CORE BOTTLENECK",
    "STRATEGIC ENABLER": "STRATEGIC ENABLER",
    "DOWNSTREAM USER": "DOWNSTREAM USER",
    "PERIPHERAL EXPOSURE": "PERIPHERAL EXPOSURE",
  },
  zh: {
    "CORE BOTTLENECK": "核心瓶颈",
    "STRATEGIC ENABLER": "战略赋能者",
    "DOWNSTREAM USER": "下游使用者",
    "PERIPHERAL EXPOSURE": "边缘暴露",
  },
};

const stageLabels: Record<Locale, Record<string, string>> = {
  en: {
    upstream: "upstream",
    midstream: "midstream",
    downstream: "downstream",
  },
  zh: {
    upstream: "上游",
    midstream: "中游",
    downstream: "下游",
  },
};

export function t(locale: Locale) {
  return ui[locale];
}

export function getBreakdownLabel(
  locale: Locale,
  field: keyof CompanyBreakdown,
): string {
  return breakdownLabels[locale][field];
}

export function getThroatRoleLabel(locale: Locale, role: ThroatRole): string {
  return throatRoles[locale][role];
}

export function getStageLabel(locale: Locale, stage: string): string {
  return stageLabels[locale][stage] ?? stage;
}

export function formatPrimaryBottleneck(
  locale: Locale,
  ticker: string,
  name: string,
  role: ThroatRole,
  score: number,
): string {
  if (locale === "zh") {
    return `${ticker} — ${name}（${getThroatRoleLabel(locale, role)}，瓶颈评分 ${score}）`;
  }
  return `${ticker} — ${name} (${getThroatRoleLabel(locale, role)}, Throat Score ${score})`;
}

export function formatNonBottleneckEntry(
  locale: Locale,
  ticker: string,
  role: ThroatRole,
  score: number,
): string {
  if (locale === "zh") {
    return `${ticker}（${getThroatRoleLabel(locale, role)}，${score}）`;
  }
  return `${ticker} (${getThroatRoleLabel(locale, role)}, ${score})`;
}

export function formatBacktestMeta(
  locale: Locale,
  period: string,
  allocation: string,
  rebalance: string,
): string {
  if (locale === "zh") {
    return `${period} · ${allocation} · ${rebalance}${t(locale).rebalancing}`;
  }
  return `${period} · ${allocation} · ${rebalance} ${t(locale).rebalancing}`;
}

export function formatBottleneckStrategyScore(locale: Locale, score: number): string {
  if (locale === "zh") {
    return `${t(locale).bottleneckStrategyScore}：${score}/100`;
  }
  return `${t(locale).bottleneckStrategyScore}: ${score}/100`;
}
