"use client";

import { useMemo, useState } from "react";
import type { AnalysisResult } from "@/lib/mockData";
import { EquityCurveChart } from "@/components/EquityCurveChart";
import {
  formatBacktestMeta,
  formatBottleneckStrategyScore,
  formatNonBottleneckEntry,
  formatPrimaryBottleneck,
  getBreakdownLabel,
  getThroatRoleLabel,
  t,
  type Locale,
} from "@/lib/i18n";
import { localizeAnalysisResult } from "@/lib/localize";
import { BilingualText } from "@/components/BilingualText";
import { BREAKDOWN_FIELDS, type Company } from "@/lib/types";
import type { IndustryMapStage, StockTrendDirection } from "@/lib/industryMap";
import type {
  ThesisAuditCandidateSignal,
  ThesisAuditEvidenceGrade,
  ThesisAuditVerdict,
} from "@/lib/thesisAudit";
import type {
  BottleneckImpactDirection,
  SupplyChainEventType,
} from "@/lib/eventIntelligence";

function tierLabel(tier: "HIGH" | "MEDIUM" | "LOW", copy: ReturnType<typeof t>): string {
  if (tier === "HIGH") return copy.tierHigh;
  if (tier === "MEDIUM") return copy.tierMedium;
  return copy.tierLow;
}

function tierStyles(tier: "HIGH" | "MEDIUM" | "LOW"): string {
  if (tier === "HIGH") {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
  }
  if (tier === "MEDIUM") {
    return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
  }
  return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
}

function stanceLabel(
  stance: "STRONG FOCUS" | "SECONDARY" | "IGNORE",
  copy: ReturnType<typeof t>,
): string {
  if (stance === "STRONG FOCUS") return copy.stanceStrongFocus;
  if (stance === "SECONDARY") return copy.stanceSecondary;
  return copy.stanceIgnore;
}

function stanceStyles(stance: "STRONG FOCUS" | "SECONDARY" | "IGNORE"): string {
  if (stance === "STRONG FOCUS") {
    return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
  }
  if (stance === "SECONDARY") {
    return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
  }
  return "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400";
}

function researchStatusLabel(
  status: "verified" | "partial" | "unavailable",
  copy: ReturnType<typeof t>,
): string {
  if (status === "verified") return copy.researchVerified;
  if (status === "partial") return copy.researchPartial;
  return copy.researchUnavailable;
}

function researchStatusStyles(status: "verified" | "partial" | "unavailable"): string {
  if (status === "verified") {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
  }
  if (status === "partial") {
    return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
  }
  return "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400";
}

function macroVerdictStyles(verdict: "RISK_ON" | "MIXED" | "RISK_OFF" | "UNAVAILABLE"): string {
  if (verdict === "RISK_ON") {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
  }
  if (verdict === "RISK_OFF") {
    return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
  }
  return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
}

function macroVerdictLabel(
  verdict: "RISK_ON" | "MIXED" | "RISK_OFF" | "UNAVAILABLE",
  copy: ReturnType<typeof t>,
): string {
  if (verdict === "RISK_ON") return copy.macroRiskOn;
  if (verdict === "RISK_OFF") return copy.macroRiskOff;
  if (verdict === "MIXED") return copy.macroMixed;
  return copy.macroUnavailable;
}

function layerIdLabel(layer: string, copy: ReturnType<typeof t>): string {
  if (layer === "demand") return copy.layerDemand;
  if (layer === "infrastructure") return copy.layerInfrastructure;
  if (layer === "core_technology") return copy.layerCoreTechnology;
  if (layer === "materials") return copy.layerMaterials;
  return layer;
}

function macroMetricLabel(locale: Locale, label: string): string {
  if (locale === "en") return label;
  const labels: Record<string, string> = {
    "Fed upper": "美联储目标利率上限",
    "US 10Y": "美国 10 年期国债",
    "10Y-2Y": "美债 10 年-2 年利差",
    "Core PCE YoY": "核心 PCE 同比",
    Unemployment: "失业率",
    VIX: "VIX 波动率",
    "Nasdaq 100": "纳斯达克 100",
    DXY: "美元指数",
  };
  return labels[label] ?? label;
}

function formatResearchValue(value?: number, suffix = ""): string {
  if (value === undefined) return "—";
  return `${Math.round(value * 100) / 100}${suffix}`;
}

function formatSigned(value: number): string {
  return `${value >= 0 ? "+" : ""}${value}`;
}

function simulatedActionLabel(
  action: "SIMULATED_BUY" | "WATCH" | "AVOID",
  copy: ReturnType<typeof t>,
): string {
  if (action === "SIMULATED_BUY") return copy.simulatedBuy;
  if (action === "WATCH") return copy.watch;
  return copy.avoid;
}

function simulatedActionStyles(action: "SIMULATED_BUY" | "WATCH" | "AVOID"): string {
  if (action === "SIMULATED_BUY") {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
  }
  if (action === "AVOID") {
    return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
  }
  return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
}

function eventTypeLabel(locale: Locale, type: SupplyChainEventType): string {
  if (locale === "en") return type.replaceAll("_", " ");
  const labels: Record<SupplyChainEventType, string> = {
    SUPPLY_RESTRICTION: "供应受限",
    SUBSTITUTION: "替代进展",
    CAPACITY_EXPANSION: "产能扩张",
    DEMAND_ACCELERATION: "需求加速",
    DEMAND_SLOWDOWN: "需求放缓",
    REGULATORY_CHANGE: "监管变化",
    GEOPOLITICAL_DISRUPTION: "地缘政治扰动",
    OTHER: "其他",
  };
  return labels[type];
}

function impactLabel(locale: Locale, impact: BottleneckImpactDirection): string {
  if (locale === "en") return impact;
  const labels: Record<BottleneckImpactDirection, string> = {
    STRENGTHENING: "强化瓶颈",
    WEAKENING: "削弱瓶颈",
    SUPPORTIVE: "支持",
    NEGATIVE: "负面",
    NEUTRAL: "中性",
  };
  return labels[impact];
}

function DecisionCompanyRow({
  company,
  copy,
  locale,
  reasonEn,
}: {
  company: {
    ticker: string;
    name: string;
    score: number;
    base_score?: number;
    confidence_delta?: number;
    investment_stance: "STRONG FOCUS" | "SECONDARY" | "IGNORE";
    supply_role_label?: string;
    reason: string;
    event_reason_en?: string;
    event_reason_zh?: string;
  };
  copy: ReturnType<typeof t>;
  locale: Locale;
  reasonEn?: string;
}) {
  return (
    <li className="rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-800">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono font-semibold">{company.ticker}</span>
        <span className="text-zinc-600 dark:text-zinc-300">{company.name}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${stanceStyles(company.investment_stance)}`}
        >
          {stanceLabel(company.investment_stance, copy)}
        </span>
      </div>
      <p className="mt-1 text-xs text-zinc-500">
        {company.supply_role_label ? `${company.supply_role_label} · ` : ""}
        {copy.baseScore}: {company.base_score ?? company.score} · {copy.adjustedScore}:{" "}
        {company.score} · Δ {formatSigned(company.confidence_delta ?? 0)}
      </p>
      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
        <BilingualText locale={locale} en={reasonEn ?? company.reason} zh={company.reason} />
      </p>
      {company.event_reason_en && company.event_reason_zh ? (
        <p className="mt-1 text-xs text-zinc-500">
          {locale === "zh" ? company.event_reason_zh : company.event_reason_en}
        </p>
      ) : null}
    </li>
  );
}
function ThroatRoleBadge({ role, locale }: { role: Company["throat_role"]; locale: Locale }) {
  const styles =
    role === "CORE BOTTLENECK"
      ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
      : role === "STRATEGIC ENABLER"
        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
        : role === "DOWNSTREAM USER"
          ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
          : "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400";

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${styles}`}>
      {getThroatRoleLabel(locale, role)}
    </span>
  );
}

function industryStageLabel(stage: IndustryMapStage, locale: Locale): string {
  if (locale === "zh") {
    if (stage === "upstream") return "上游";
    if (stage === "midstream") return "中游";
    return "下游";
  }
  if (stage === "upstream") return "Upstream";
  if (stage === "midstream") return "Midstream";
  return "Downstream";
}

function industryStageDescription(stage: IndustryMapStage, locale: Locale): string {
  if (locale === "zh") {
    if (stage === "upstream") return "原材料、设备、产能、关键输入";
    if (stage === "midstream") return "制造、平台、基础设施、转化层";
    return "需求、应用、分销、终端采用";
  }
  if (stage === "upstream") return "Inputs, equipment, capacity, scarce resources";
  if (stage === "midstream") return "Production, platforms, infrastructure, conversion";
  return "Demand, applications, distribution, adoption";
}

function stockTrendLabel(trend: StockTrendDirection, locale: Locale): string {
  if (locale === "zh") {
    if (trend === "UP") return "上涨";
    if (trend === "DOWN") return "下跌";
    if (trend === "FLAT") return "震荡";
    return "暂无走势";
  }
  if (trend === "UP") return "Up";
  if (trend === "DOWN") return "Down";
  if (trend === "FLAT") return "Flat";
  return "No trend";
}

function stockTrendStyles(trend: StockTrendDirection): string {
  if (trend === "UP") return "text-emerald-300";
  if (trend === "DOWN") return "text-red-300";
  if (trend === "FLAT") return "text-amber-300";
  return "text-zinc-500";
}

function signedPercent(value?: number): string {
  if (value === undefined) return "—";
  return `${value >= 0 ? "+" : ""}${value}%`;
}

function thesisAuditVerdictStyles(verdict: ThesisAuditVerdict): string {
  if (verdict === "SUPPORTIVE") return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  if (verdict === "CHALLENGE") return "border-red-400/30 bg-red-400/10 text-red-300";
  return "border-amber-400/30 bg-amber-400/10 text-amber-300";
}

function thesisAuditGradeLabel(grade: ThesisAuditEvidenceGrade, locale: Locale): string {
  if (locale === "zh") {
    if (grade === "STRONG") return "强";
    if (grade === "MEDIUM") return "中";
    return "弱";
  }
  return grade;
}

function thesisAuditSignalLabel(signal: ThesisAuditCandidateSignal, locale: Locale): string {
  if (locale === "zh") {
    if (signal === "SUPPORTS") return "支持";
    if (signal === "CHALLENGES") return "反对";
    return "观察";
  }
  if (signal === "SUPPORTS") return "Supports";
  if (signal === "CHALLENGES") return "Challenges";
  return "Watch";
}

function thesisAuditSignalStyles(signal: ThesisAuditCandidateSignal): string {
  if (signal === "SUPPORTS") return "bg-emerald-400/10 text-emerald-300";
  if (signal === "CHALLENGES") return "bg-red-400/10 text-red-300";
  return "bg-amber-400/10 text-amber-300";
}

export default function HomePage() {
  const [locale, setLocale] = useState<Locale>("en");
  const [industry, setIndustry] = useState("AI chips");
  const [baseResult, setBaseResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const copy = t(locale);

  const result = useMemo(() => {
    if (!baseResult) return null;
    try {
      return localizeAnalysisResult(baseResult, locale);
    } catch {
      return baseResult;
    }
  }, [baseResult, locale]);

  async function handleRunAnalysis() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ industry }),
      });

      const payload = (await response.json()) as AnalysisResult & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? copy.analysisFailed);
      }
      if (
        !payload.final_decision ||
        !payload.reasoning_intelligence ||
        !payload.structured_report ||
        !payload.event_intelligence ||
        !payload.industry_map ||
        !payload.thesis_audit
      ) {
        throw new Error(copy.analysisFailed);
      }

      setBaseResult(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.analysisFailed);
      setBaseResult(null);
    } finally {
      setLoading(false);
    }
  }

  function handleDownloadEvidence() {
    if (!baseResult) return;

    const payload = {
      schema_version: "throatscan-run-evidence-v1",
      project: "ThroatScan Oracle",
      exported_at: new Date().toISOString(),
      run_id: baseResult.structured_report.run_id,
      industry_input: baseResult.interpretation.user_input,
      confidence: {
        score: baseResult.confidence,
        level: baseResult.confidence_level,
      },
      bitget_market_evidence: baseResult.companies.map((company) => ({
        ticker: company.ticker,
        market: company.bitget_market,
      })),
      market_research: baseResult.market_research,
      event_intelligence: baseResult.event_intelligence,
      final_decision: baseResult.final_decision,
      industry_map: baseResult.industry_map,
      thesis_audit: baseResult.thesis_audit,
      backtest: baseResult.backtest,
      disclosure:
        "Simulation evidence generated from Bitget public market data. Research software, not financial advice.",
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `throatscan-${baseResult.structured_report.run_id}-evidence.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const topCompanies: Company[] = useMemo(() => {
    if (!result) return [];
    if (result.low_confidence) {
      const rankedTickers = new Set(
        result.structured_report.section_e_final_ranking.map((row) => row.ticker),
      );
      return result.companies.filter((company) => rankedTickers.has(company.ticker));
    }
    return result.companies.slice(0, 5);
  }, [result]);

  const baseCompanyByTicker = useMemo(() => {
    if (!baseResult) return new Map<string, Company>();
    return new Map(baseResult.companies.map((company) => [company.ticker, company]));
  }, [baseResult]);
  const baseIndustryCompanyByTicker = useMemo(() => {
    if (!baseResult) return new Map<string, string>();
    return new Map(
      baseResult.industry_map.layers
        .flatMap((layer) => layer.companies)
        .map((company) => [company.ticker, company.name]),
    );
  }, [baseResult]);

  const terminalLabels =
    locale === "zh"
      ? {
          desk: "Oracle 智能交易台",
          stockTokens: "美股代币",
          regime: "宏观环境",
          waitingRegime: "等待",
          publicMarketData: "Bitget 公开市场数据",
          markets: "市场",
          research: "情报研究",
          strategy: "策略验证",
          evidence: "证据中心",
          systemOnline: "系统在线",
          workspace: "工作区",
          connections: "连接状态",
          agentHub: "Agent Hub",
          bitgetApi: "Bitget API",
          llm: "LLM",
          llmOn: "启用",
          llmRules: "规则模式",
          mode: "模式",
          constrained: "约束式",
          venue: "交易场所",
          type: "类型",
          sim: "模拟",
          news: "新闻",
          macro: "宏观",
          overview: "决策总览",
          eventFlow: "事件信号",
          chain: "供应链",
          candidates: "候选标的",
          backtest: "回测验证",
          scanner: "行业瓶颈扫描器",
          scannerHint: "输入行业，生成可交易候选、实时证据和模拟交易决策。",
          hotSectors: "快捷行业",
          marketStatus: "研究数据",
          bitgetStatus: "Bitget 数据",
          decisionStatus: "模拟决策",
          confidence: "决策置信度",
          waiting: "等待扫描",
          verified: "已验证",
          live: "实时",
          simulated: "模拟",
          simpleTitle: "先看这 4 件事",
          simpleSubtitle: "这一区域是给演示和日常使用看的；专业审计信息在下方展开。",
          plainConclusion: "1. 系统结论",
          plainTradability: "2. Bitget 能不能交易",
          plainReason: "3. 为什么这么判断",
          plainEvidence: "4. 证据是否可靠",
          nextAction: "下一步",
          directTradable: "可直接进入 Bitget 模拟交易篮子",
          notDirectTradable: "核心研究标的未必都已上线 Bitget",
          evidenceOk: "新闻、宏观和 Bitget 回测证据已接入",
          evidencePartial: "部分证据可用，系统不会伪造缺失数据",
          judgePitch: "这不是普通荐股器，而是把行业研究结果转换成 Bitget 可执行/不可执行决策。",
          proxyNote: "未上线标的只作为研究结论；不能直接交易时，应转入代理标的或观察。",
          advancedTitle: "完整专业分析",
          advancedHint: "展开后可以查看新闻、宏观、事件链、供应链审计和 Bitget 回测。",
          industryMapTitle: "行业拆解地图",
          industryMapSubtitle: "先把行业拆成上游、中游、下游上市公司，再看每家公司是否有 Bitget 股票代币走势。",
          publicCompanies: "上市公司",
          bitgetOnline: "Bitget 在线",
          relatedIndustries: "涉及行业",
          englishFullName: "英文全称",
          stockTrendTitle: "股票走势快照",
          stage: "产业链位置",
          company: "公司",
          bitgetMarket: "Bitget 市场",
          trend: "走势",
          lastPrice: "最新价",
          researchOnly: "研究覆盖",
          noBitgetTrend: "未上线或暂无 K 线",
          noMappedCompanies: "这一层暂未映射到上市公司",
          auditTitle: "产业链论证复核",
          auditSubtitle: "用稀缺层研究方法复核产业链卡点：先排稀缺层，再看公司证据和反方风险。",
          auditScore: "复核分数",
          auditEvidence: "证据等级",
          auditSource: "审计方法",
          auditRole: "在项目中的作用",
          scarceLayerRanking: "稀缺层排序",
          candidateCrossCheck: "候选公司复核",
          nextChecks: "下一步验证",
          limitations: "边界说明",
        }
      : {
          desk: "Oracle Intelligence Desk",
          stockTokens: "US STOCK TOKENS",
          regime: "REGIME",
          waitingRegime: "WAITING",
          publicMarketData: "BITGET PUBLIC MARKET DATA",
          markets: "Markets",
          research: "Research",
          strategy: "Strategy Lab",
          evidence: "Evidence",
          systemOnline: "System Online",
          workspace: "Workspace",
          connections: "Connections",
          agentHub: "Agent Hub",
          bitgetApi: "Bitget API",
          llm: "LLM",
          llmOn: "ON",
          llmRules: "RULES",
          mode: "MODE",
          constrained: "CONSTRAINED",
          venue: "VENUE",
          type: "TYPE",
          sim: "SIM",
          news: "News",
          macro: "Macro",
          overview: "Decision Overview",
          eventFlow: "Event Signals",
          chain: "Supply Chain",
          candidates: "Candidates",
          backtest: "Validation",
          scanner: "Industry Bottleneck Scanner",
          scannerHint: "Enter an industry to generate tradable candidates, live evidence, and a simulated decision.",
          hotSectors: "Quick Sectors",
          marketStatus: "Research Data",
          bitgetStatus: "Bitget Data",
          decisionStatus: "Sim Decision",
          confidence: "Decision Confidence",
          waiting: "Waiting for scan",
          verified: "Verified",
          live: "Live",
          simulated: "Simulated",
          simpleTitle: "Read These 4 Things First",
          simpleSubtitle: "This is the demo-friendly layer. Full audit details are folded below.",
          plainConclusion: "1. System conclusion",
          plainTradability: "2. Bitget tradability",
          plainReason: "3. Why this result",
          plainEvidence: "4. Evidence quality",
          nextAction: "Next step",
          directTradable: "Can enter the Bitget simulated trading basket",
          notDirectTradable: "Core research names may not all be listed on Bitget",
          evidenceOk: "News, macro, and Bitget backtest evidence are connected",
          evidencePartial: "Partial evidence is available; missing data is not fabricated",
          judgePitch: "This is not a generic stock picker; it converts research into Bitget executable/non-executable decisions.",
          proxyNote: "Unlisted names stay as research conclusions; execution must use proxies or remain on watch.",
          advancedTitle: "Full Professional Analysis",
          advancedHint: "Expand for news, macro, event trace, supply-chain audit, and Bitget backtest.",
          industryMapTitle: "Industry Breakdown Map",
          industryMapSubtitle: "Break the industry into upstream, midstream, and downstream public companies before checking Bitget stock-token trends.",
          publicCompanies: "Public companies",
          bitgetOnline: "Bitget online",
          relatedIndustries: "Related industries",
          englishFullName: "English full name",
          stockTrendTitle: "Stock Trend Snapshot",
          stage: "Value-chain stage",
          company: "Company",
          bitgetMarket: "Bitget market",
          trend: "Trend",
          lastPrice: "Last price",
          researchOnly: "Research only",
          noBitgetTrend: "Not listed or no candles",
          noMappedCompanies: "No mapped public companies in this layer",
          auditTitle: "Supply-chain Thesis Audit",
          auditSubtitle: "Audit scarce layers, company evidence, and failure conditions before the simulated trading decision.",
          auditScore: "Cross-check score",
          auditEvidence: "Evidence grade",
          auditSource: "Audit method",
          auditRole: "Role in project",
          scarceLayerRanking: "Scarce Layer Ranking",
          candidateCrossCheck: "Candidate Cross-check",
          nextChecks: "Next Checks",
          limitations: "Boundaries",
        };
  const quickIndustries = [
    { value: "AI chips", label: locale === "zh" ? "AI 芯片" : "AI chips" },
    { value: "Semiconductor", label: locale === "zh" ? "半导体" : "Semiconductor" },
    { value: "Nuclear Energy", label: locale === "zh" ? "核能" : "Nuclear Energy" },
    { value: "EV Battery", label: locale === "zh" ? "电动车电池" : "EV Battery" },
  ];
  const selectedTradeTickers = result?.event_intelligence.simulated_decision.selected_tickers ?? [];
  const onlineCandidateCount =
    result?.companies.filter(
      (company) =>
        company.bitget_market?.listed &&
        company.bitget_market.status === "online",
    ).length ?? 0;
  const totalCandidateCount = result?.companies.length ?? 0;
  const evidenceReady =
    result?.market_research.macro.status !== "unavailable" &&
    result?.market_research.news.status !== "unavailable" &&
    result?.backtest.status === "verified";
  const industryMapCompanies = result?.industry_map.layers.flatMap((layer) => layer.companies) ?? [];

  return (
    <div className="exchange-terminal min-h-screen text-zinc-100">
      <header className="terminal-topbar sticky top-0 z-50">
        <div className="flex h-14 items-center gap-6 px-4 lg:px-6">
          <div className="flex min-w-fit items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-400 text-sm font-black text-[#06120d]">
              TS
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">ThroatScan</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                {terminalLabels.desk}
              </p>
            </div>
          </div>
          <nav className="hidden h-full items-center gap-1 lg:flex">
            {[terminalLabels.markets, terminalLabels.research, terminalLabels.strategy, terminalLabels.evidence].map(
              (item, index) => (
                <button
                  key={item}
                  type="button"
                  className={`h-full border-b-2 px-3 text-xs font-medium ${
                    index === 1
                      ? "border-emerald-400 text-white"
                      : "border-transparent text-zinc-500 hover:text-zinc-200"
                  }`}
                >
                  {item}
                </button>
              ),
            )}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden items-center gap-2 text-xs text-zinc-400 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#0ecb81]" />
              {terminalLabels.systemOnline}
            </div>
            <div className="flex rounded-md border border-[#273240] bg-[#0b1118] p-0.5">
              <button
                type="button"
                onClick={() => setLocale("en")}
                className={`rounded px-2.5 py-1 text-xs font-semibold ${
                  locale === "en" ? "bg-[#273240] text-white" : "text-zinc-500"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLocale("zh")}
                className={`rounded px-2.5 py-1 text-xs font-semibold ${
                  locale === "zh" ? "bg-[#273240] text-white" : "text-zinc-500"
                }`}
              >
                中文
              </button>
            </div>
          </div>
        </div>
        <div className="terminal-ticker flex h-9 items-center gap-8 overflow-x-auto border-t border-[#18212b] px-4 font-mono text-[11px] lg:px-6">
          <span className="shrink-0 text-zinc-500">{terminalLabels.stockTokens}</span>
          <span className="shrink-0 text-zinc-300">NVDAONUSDT <b className="terminal-green">+19.66%</b></span>
          <span className="shrink-0 text-zinc-300">SPYONUSDT <b className="terminal-green">+15.37%</b></span>
          <span className="shrink-0 text-zinc-300">VIX <b className="terminal-amber">{formatResearchValue(result?.market_research.macro.market_prices.vix?.value)}</b></span>
          <span className="shrink-0 text-zinc-300">US10Y <b className="terminal-amber">{formatResearchValue(result?.market_research.macro.rates.t10y?.value, "%")}</b></span>
          <span className="shrink-0 text-zinc-300">
            {terminalLabels.regime}{" "}
            <b className="terminal-amber">
              {result
                ? macroVerdictLabel(result.market_research.macro.verdict, copy)
                : terminalLabels.waitingRegime}
            </b>
          </span>
          <span className="ml-auto shrink-0 text-zinc-500">{terminalLabels.publicMarketData}</span>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-5.75rem)] lg:grid-cols-[204px_minmax(0,1fr)]">
        <aside className="terminal-sidebar sticky top-[5.75rem] h-[calc(100vh-5.75rem)] p-3">
          <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
            {terminalLabels.workspace}
          </p>
          <div className="space-y-1">
            {[
              ["01", terminalLabels.overview],
              ["02", terminalLabels.eventFlow],
              ["03", terminalLabels.chain],
              ["04", terminalLabels.candidates],
              ["05", terminalLabels.backtest],
            ].map(([number, label], index) => (
              <button
                type="button"
                key={label}
                className={`flex w-full items-center gap-3 rounded-md border px-2.5 py-2 text-left text-xs ${
                  index === 0
                    ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                    : "border-transparent text-zinc-500"
                }`}
              >
                <span className="font-mono text-[10px] opacity-60">{number}</span>
                {label}
              </button>
            ))}
          </div>
          <div className="mt-6 border-t border-[#202a36] pt-4">
            <p className="px-2 text-[10px] uppercase tracking-[0.16em] text-zinc-600">
              {terminalLabels.connections}
            </p>
            <div className="mt-3 space-y-3 px-2 text-xs">
              <div className="flex items-center justify-between text-zinc-400">
                <span>{terminalLabels.agentHub}</span><span className="terminal-green">{terminalLabels.live}</span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>{terminalLabels.bitgetApi}</span><span className="terminal-green">{terminalLabels.live}</span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>{terminalLabels.llm}</span>
                <span className="terminal-amber">
                  {result?.meta?.llm_enabled ? terminalLabels.llmOn : terminalLabels.llmRules}
                </span>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 px-3 py-4 sm:px-5 lg:px-6">
          <section className="terminal-panel overflow-hidden rounded-lg">
            <div className="border-b border-[#202a36] p-4 lg:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <h1 className="text-lg font-semibold tracking-tight">{terminalLabels.scanner}</h1>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">{terminalLabels.scannerHint}</p>
                </div>
                <div className="flex gap-5 font-mono text-[10px] text-zinc-500">
                  <span>{terminalLabels.mode} <b className="text-zinc-300">{terminalLabels.constrained}</b></span>
                  <span>{terminalLabels.venue} <b className="text-zinc-300">BITGET</b></span>
                  <span>{terminalLabels.type} <b className="text-zinc-300">{terminalLabels.sim}</b></span>
                </div>
              </div>
              <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(280px,1fr)_auto]">
                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
                    {copy.industry}
                  </span>
                  <input
                    type="text"
                    value={industry}
                    onChange={(event) => setIndustry(event.target.value)}
                    className="terminal-input w-full rounded-md px-3 py-2.5 text-sm"
                    placeholder={copy.industryPlaceholder}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => void handleRunAnalysis()}
                  disabled={loading}
                  className="terminal-run self-end rounded-md px-7 py-2.5 text-sm font-bold disabled:opacity-60"
                >
                  {loading ? copy.running : copy.runAnalysis}
                </button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="mr-1 text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                  {terminalLabels.hotSectors}
                </span>
                {quickIndustries.map((item) => (
                  <button
                    type="button"
                    key={item.value}
                    onClick={() => setIndustry(item.value)}
                    className={`rounded border px-2 py-1 text-[11px] ${
                      industry === item.value
                        ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                        : "border-[#273240] bg-[#0a0f15] text-zinc-500 hover:text-zinc-200"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 border-b border-[#202a36] sm:grid-cols-4">
              {[
                [terminalLabels.marketStatus, result ? terminalLabels.verified : terminalLabels.waiting, result ? "terminal-green" : "text-zinc-500"],
                [terminalLabels.bitgetStatus, result?.backtest.status === "verified" ? terminalLabels.live : terminalLabels.waiting, result?.backtest.status === "verified" ? "terminal-green" : "text-zinc-500"],
                [terminalLabels.decisionStatus, result ? simulatedActionLabel(result.event_intelligence.simulated_decision.action, copy) : terminalLabels.waiting, result ? "terminal-amber" : "text-zinc-500"],
                [terminalLabels.confidence, result ? `${result.confidence}/100` : "—", result ? "text-white" : "text-zinc-500"],
              ].map(([label, value, valueClass]) => (
                <div key={label} className="border-r border-[#202a36] px-4 py-3 last:border-r-0">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-600">{label}</p>
                  <p className={`mt-1 font-mono text-sm font-semibold ${valueClass}`}>{value}</p>
                </div>
              ))}
            </div>

        {error ? (
          <p className="m-4 rounded border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>
        ) : null}

        {result && baseResult ? (
          <div className="terminal-content space-y-5 p-3 sm:p-4 lg:p-5">
            {locale === "zh" && baseResult ? (
              <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                {copy.engineFootnote}
              </p>
            ) : null}
            <section className="rounded-lg border border-emerald-400/25 bg-[#0b1118] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">{terminalLabels.simpleTitle}</h2>
                  <p className="mt-1 text-xs text-zinc-400">{terminalLabels.simpleSubtitle}</p>
                </div>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                  {terminalLabels.judgePitch}
                </span>
              </div>
              <div className="mt-4 grid gap-3 lg:grid-cols-4">
                <div className="rounded-lg border border-[#263241] bg-[#0f151d] p-4">
                  <p className="text-xs font-semibold text-zinc-500">{terminalLabels.plainConclusion}</p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {result.final_decision.final_result_card.core_bottleneck}
                  </p>
                  <p className="mt-2 text-sm text-zinc-300">
                    {stanceLabel(result.final_decision.final_result_card.investment_stance, copy)} ·{" "}
                    {result.final_decision.final_result_card.confidence}
                  </p>
                </div>
                <div className="rounded-lg border border-[#263241] bg-[#0f151d] p-4">
                  <p className="text-xs font-semibold text-zinc-500">{terminalLabels.plainTradability}</p>
                  <p
                    className={`mt-2 text-xl font-semibold ${
                      selectedTradeTickers.length > 0 ? "terminal-green" : "terminal-amber"
                    }`}
                  >
                    {selectedTradeTickers.length > 0
                      ? selectedTradeTickers.join(", ")
                      : locale === "zh"
                        ? "暂不直接交易"
                        : "Watch only"}
                  </p>
                  <p className="mt-2 text-sm text-zinc-400">
                    {selectedTradeTickers.length > 0
                      ? terminalLabels.directTradable
                      : terminalLabels.notDirectTradable}
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">
                    {onlineCandidateCount}/{totalCandidateCount}{" "}
                    {locale === "zh" ? "个候选当前可映射到 Bitget" : "candidates map to Bitget now"}
                  </p>
                </div>
                <div className="rounded-lg border border-[#263241] bg-[#0f151d] p-4">
                  <p className="text-xs font-semibold text-zinc-500">{terminalLabels.plainReason}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-200">
                    {result.final_decision.final_result_card.reason}
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">{terminalLabels.proxyNote}</p>
                </div>
                <div className="rounded-lg border border-[#263241] bg-[#0f151d] p-4">
                  <p className="text-xs font-semibold text-zinc-500">{terminalLabels.plainEvidence}</p>
                  <p className={`mt-2 text-xl font-semibold ${evidenceReady ? "terminal-green" : "terminal-amber"}`}>
                    {evidenceReady ? terminalLabels.verified : terminalLabels.marketStatus}
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-zinc-400">
                    <li>{terminalLabels.news}: {researchStatusLabel(result.market_research.news.status, copy)}</li>
                    <li>{terminalLabels.macro}: {researchStatusLabel(result.market_research.macro.status, copy)}</li>
                    <li>Bitget: {result.backtest.status === "verified" ? terminalLabels.live : terminalLabels.waiting}</li>
                  </ul>
                  <p className="mt-2 text-xs text-zinc-500">
                    {evidenceReady ? terminalLabels.evidenceOk : terminalLabels.evidencePartial}
                  </p>
                </div>
              </div>
              <div className="mt-4 rounded-lg border border-[#263241] bg-[#080d13] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  {terminalLabels.nextAction}
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-200">
                  {selectedTradeTickers.length > 0
                    ? result.event_intelligence.simulated_decision.rationale_zh && locale === "zh"
                      ? result.event_intelligence.simulated_decision.rationale_zh
                      : result.event_intelligence.simulated_decision.rationale_en
                    : terminalLabels.proxyNote}
                </p>
              </div>
            </section>

            <section className="rounded-lg border border-[#263241] bg-[#0b1118] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {terminalLabels.industryMapTitle}
                  </h2>
                  <p className="mt-1 max-w-3xl text-xs leading-5 text-zinc-400">
                    {terminalLabels.industryMapSubtitle}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-right text-xs">
                  <div className="rounded-lg border border-[#263241] bg-[#0f151d] px-3 py-2">
                    <p className="text-zinc-500">{terminalLabels.publicCompanies}</p>
                    <p className="mt-1 text-base font-semibold text-white">
                      {industryMapCompanies.length}
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#263241] bg-[#0f151d] px-3 py-2">
                    <p className="text-zinc-500">{terminalLabels.bitgetOnline}</p>
                    <p className="mt-1 text-base font-semibold terminal-green">
                      {industryMapCompanies.filter((company) => company.bitget_status === "online").length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-3">
                {result.industry_map.layers.map((layer) => (
                  <div
                    key={layer.stage}
                    className="rounded-lg border border-[#263241] bg-[#0f151d] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {industryStageLabel(layer.stage, locale)}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-zinc-500">
                          {industryStageDescription(layer.stage, locale)}
                        </p>
                      </div>
                      <span className="rounded-full border border-[#344355] px-2 py-0.5 text-xs text-zinc-400">
                        {layer.companies.length} / {layer.bitget_online_count}
                      </span>
                    </div>
                    <ul className="mt-3 space-y-2">
                      {layer.companies.length === 0 ? (
                        <li className="rounded-lg border border-dashed border-[#263241] p-3 text-xs text-zinc-500">
                          {terminalLabels.noMappedCompanies}
                        </li>
                      ) : (
                        layer.companies.map((company) => {
                          const englishCompanyName = baseIndustryCompanyByTicker.get(company.ticker);
                          return (
                          <li
                            key={company.ticker}
                            className="rounded-lg border border-[#263241] bg-[#080d13] p-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-sm font-semibold text-white">
                                  {company.ticker}
                                </span>
                                <ThroatRoleBadge role={company.throat_role} locale={locale} />
                              </div>
                              <span className="text-xs font-semibold text-zinc-400">
                                {company.score}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-zinc-300">{company.name}</p>
                            {locale === "zh" && englishCompanyName ? (
                              <p className="mt-1 text-[11px] text-zinc-500">
                                {terminalLabels.englishFullName}: {englishCompanyName}
                              </p>
                            ) : null}
                            {company.sector_tags?.length > 0 ? (
                              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                <span className="text-[11px] text-zinc-500">
                                  {terminalLabels.relatedIndustries}
                                </span>
                                {company.sector_tags.slice(0, 4).map((tag) => (
                                  <span
                                    key={tag}
                                    className="rounded-full bg-[#141b24] px-2 py-0.5 text-[11px] text-zinc-300"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                            <p className="mt-1 text-xs leading-5 text-zinc-500">
                              {company.chain_position}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                              <span
                                className={`rounded-full px-2 py-0.5 font-semibold ${
                                  company.bitget_status === "online"
                                    ? "bg-cyan-400/10 text-cyan-300"
                                    : "bg-zinc-800 text-zinc-500"
                                }`}
                              >
                                {company.bitget_status === "online"
                                  ? company.bitget_symbol
                                  : terminalLabels.researchOnly}
                              </span>
                              <span className={stockTrendStyles(company.stock_trend.trend)}>
                                {company.stock_trend.status === "verified"
                                  ? `${stockTrendLabel(company.stock_trend.trend, locale)} ${signedPercent(company.stock_trend.total_return_pct)}`
                                  : terminalLabels.noBitgetTrend}
                              </span>
                            </div>
                          </li>
                          );
                        })
                      )}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="mt-4 overflow-x-auto rounded-lg border border-[#263241] bg-[#080d13]">
                <div className="border-b border-[#263241] px-3 py-2">
                  <h3 className="text-sm font-semibold text-white">
                    {terminalLabels.stockTrendTitle}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    {result.industry_map.stock_trend_note}
                  </p>
                </div>
                <table className="min-w-full text-left text-sm">
                  <thead className="text-xs text-zinc-500">
                    <tr>
                      <th className="px-3 py-2 font-medium">{terminalLabels.stage}</th>
                      <th className="px-3 py-2 font-medium">{terminalLabels.company}</th>
                      <th className="px-3 py-2 font-medium">{terminalLabels.bitgetMarket}</th>
                      <th className="px-3 py-2 font-medium">{terminalLabels.lastPrice}</th>
                      <th className="px-3 py-2 font-medium">{terminalLabels.trend}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {industryMapCompanies.map((company) => (
                      <tr key={company.ticker} className="border-t border-[#18202b]">
                        <td className="px-3 py-2 text-zinc-400">
                          {industryStageLabel(company.stage, locale)}
                        </td>
                        <td className="px-3 py-2">
                          <span className="font-mono font-semibold text-white">
                            {company.ticker}
                          </span>
                          <span className="ml-2 text-zinc-400">{company.name}</span>
                          {company.sector_tags?.length > 0 ? (
                            <span className="ml-2 text-xs text-zinc-500">
                              {company.sector_tags.slice(0, 3).join(" / ")}
                            </span>
                          ) : null}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-zinc-400">
                          {company.bitget_symbol ?? terminalLabels.researchOnly}
                        </td>
                        <td className="px-3 py-2 text-zinc-300">
                          {company.last_price ?? company.stock_trend.latest_close ?? "—"}
                        </td>
                        <td className={`px-3 py-2 font-semibold ${stockTrendStyles(company.stock_trend.trend)}`}>
                          {company.stock_trend.status === "verified"
                            ? `${stockTrendLabel(company.stock_trend.trend, locale)} ${signedPercent(company.stock_trend.total_return_pct)}`
                            : terminalLabels.noBitgetTrend}
                          {company.stock_trend.period ? (
                            <span className="ml-2 font-normal text-zinc-500">
                              {company.stock_trend.period}
                            </span>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-lg border border-violet-400/25 bg-[#0b1118] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {terminalLabels.auditTitle}
                  </h2>
                  <p className="mt-1 max-w-3xl text-xs leading-5 text-zinc-400">
                    {terminalLabels.auditSubtitle}
                  </p>
                </div>
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${thesisAuditVerdictStyles(result.thesis_audit.verdict)}`}
                >
                  {locale === "zh"
                    ? result.thesis_audit.verdict_label_zh
                    : result.thesis_audit.verdict_label_en}
                </span>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-4">
                <div className="rounded-lg border border-[#263241] bg-[#0f151d] p-4">
                  <p className="text-xs font-semibold text-zinc-500">
                    {terminalLabels.auditScore}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {result.thesis_audit.score}/100
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {locale === "zh"
                      ? result.thesis_audit.summary_zh
                      : result.thesis_audit.summary_en}
                  </p>
                </div>
                <div className="rounded-lg border border-[#263241] bg-[#0f151d] p-4">
                  <p className="text-xs font-semibold text-zinc-500">
                    {terminalLabels.auditEvidence}
                  </p>
                  <p className="mt-2 text-2xl font-semibold terminal-amber">
                    {thesisAuditGradeLabel(result.thesis_audit.evidence_grade, locale)}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {locale === "zh" ? "证据越强，越适合进入演示结论。" : "Higher evidence means stronger demo defensibility."}
                  </p>
                </div>
                <div className="rounded-lg border border-[#263241] bg-[#0f151d] p-4">
                  <p className="text-xs font-semibold text-zinc-500">
                    {terminalLabels.auditSource}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-violet-300">
                    {locale === "zh" ? "稀缺层论证审计流程" : "Scarce-layer thesis audit workflow"}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {locale === "zh"
                      ? "开源方法来源与许可证记录在证据包和项目文档中。"
                      : "Open-source methodology attribution and license are recorded in evidence and docs."}
                  </p>
                </div>
                <div className="rounded-lg border border-[#263241] bg-[#0f151d] p-4">
                  <p className="text-xs font-semibold text-zinc-500">
                    {terminalLabels.auditRole}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">
                    {locale === "zh"
                      ? result.thesis_audit.project_role_zh
                      : result.thesis_audit.project_role_en}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-lg border border-[#263241] bg-[#080d13] p-4">
                  <h3 className="text-sm font-semibold text-white">
                    {terminalLabels.scarceLayerRanking}
                  </h3>
                  <ol className="mt-3 space-y-2">
                    {result.thesis_audit.layer_priorities.map((layer, index) => (
                      <li
                        key={layer.stage}
                        className="rounded-lg border border-[#263241] bg-[#0f151d] p-3 text-sm"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold text-white">
                            #{index + 1} {locale === "zh" ? layer.label_zh : layer.label_en}
                          </span>
                          <span className="font-mono text-xs text-violet-300">
                            {layer.score}/100
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-zinc-500">
                          {locale === "zh"
                            ? layer.scarce_layer_reason_zh
                            : layer.scarce_layer_reason_en}
                        </p>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="rounded-lg border border-[#263241] bg-[#080d13] p-4">
                  <h3 className="text-sm font-semibold text-white">
                    {terminalLabels.candidateCrossCheck}
                  </h3>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    {result.thesis_audit.candidate_reviews.slice(0, 6).map((review) => (
                      <div
                        key={review.ticker}
                        className="rounded-lg border border-[#263241] bg-[#0f151d] p-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="font-mono text-sm font-semibold text-white">
                              {review.ticker}
                            </span>
                            <span className="ml-2 text-xs text-zinc-500">{review.name}</span>
                          </div>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${thesisAuditSignalStyles(review.signal)}`}
                          >
                            {thesisAuditSignalLabel(review.signal, locale)}
                          </span>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-zinc-400">
                          {locale === "zh" ? review.reason_zh : review.reason_en}
                        </p>
                        <p className="mt-2 text-xs text-zinc-500">
                          {locale === "zh" ? "反方条件：" : "Failure condition: "}
                          {locale === "zh"
                            ? review.failure_condition_zh
                            : review.failure_condition_en}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <div className="rounded-lg border border-[#263241] bg-[#080d13] p-4">
                  <h3 className="text-sm font-semibold text-white">
                    {terminalLabels.nextChecks}
                  </h3>
                  <ul className="mt-2 space-y-1 text-xs leading-5 text-zinc-400">
                    {(locale === "zh"
                      ? result.thesis_audit.next_checks_zh
                      : result.thesis_audit.next_checks_en
                    ).map((item) => (
                      <li key={item}>- {item}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg border border-[#263241] bg-[#080d13] p-4">
                  <h3 className="text-sm font-semibold text-white">
                    {terminalLabels.limitations}
                  </h3>
                  <ul className="mt-2 space-y-1 text-xs leading-5 text-zinc-400">
                    {(locale === "zh"
                      ? result.thesis_audit.limitations_zh
                      : result.thesis_audit.limitations_en
                    ).map((item) => (
                      <li key={item}>- {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <div className="terminal-result-hero rounded-lg p-4 text-white">
              <p className="text-xs font-bold uppercase tracking-widest opacity-80">
                {copy.finalResultCard}
              </p>
              <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs opacity-70">{copy.cardIndustry}</dt>
                  <dd className="text-base font-semibold">
                    {result.final_decision.final_result_card.industry}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs opacity-70">{copy.cardCoreBottleneck}</dt>
                  <dd className="text-base font-semibold">
                    {result.final_decision.final_result_card.core_bottleneck}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs opacity-70">{copy.cardConfidence}</dt>
                  <dd className="font-semibold">
                    {result.final_decision.final_result_card.confidence}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs opacity-70">{copy.cardStance}</dt>
                  <dd>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${stanceStyles(result.final_decision.final_result_card.investment_stance)}`}
                    >
                      {stanceLabel(result.final_decision.final_result_card.investment_stance, copy)}
                    </span>
                  </dd>
                </div>
              </dl>
              <p className="mt-3 border-t border-white/20 pt-3 text-sm font-medium dark:border-zinc-900/20">
                <BilingualText
                  locale={locale}
                  en={baseResult.final_decision.decision_summary.one_line_conclusion}
                  zh={result.final_decision.decision_summary.one_line_conclusion}
                  referenceClassName="mt-0.5 block text-xs opacity-60"
                />
              </p>
            </div>

            <details className="rounded-lg border border-[#263241] bg-[#0b1118] p-4">
              <summary className="cursor-pointer list-none">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-white">{terminalLabels.advancedTitle}</h2>
                    <p className="mt-1 text-xs text-zinc-400">{terminalLabels.advancedHint}</p>
                  </div>
                  <span className="rounded-full border border-[#344355] px-3 py-1 text-xs font-semibold text-zinc-300">
                    {locale === "zh" ? "点击展开" : "Click to expand"}
                  </span>
                </div>
              </summary>
              <div className="mt-4 space-y-5">

            <section className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/40">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-blue-950 dark:text-blue-100">
                    {copy.decisionLogicGuide}
                  </h2>
                  <p className="mt-1 text-xs text-blue-800/80 dark:text-blue-200/80">
                    {copy.decisionLogicDescription}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
                    {copy.llmRuntime}
                  </p>
                  <span
                    className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-bold ${
                      baseResult.meta?.llm_enabled
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    }`}
                  >
                    {baseResult.meta?.llm_enabled ? copy.llmActive : copy.llmInactive}
                  </span>
                </div>
              </div>
              <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
                {[
                  [copy.logicIndustry, copy.logicIndustryDetail],
                  [copy.logicStructural, copy.logicStructuralDetail],
                  [copy.logicEvidence, copy.logicEvidenceDetail],
                  [copy.logicTradable, copy.logicTradableDetail],
                  [copy.logicValidation, copy.logicValidationDetail],
                ].map(([title, detail]) => (
                  <div
                    key={title}
                    className="rounded-lg border border-blue-200 bg-white/70 p-3 dark:border-blue-900 dark:bg-blue-950/50"
                  >
                    <p className="text-xs font-semibold text-blue-950 dark:text-blue-100">{title}</p>
                    <p className="mt-1 text-xs text-blue-900/75 dark:text-blue-100/75">{detail}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 rounded-lg border border-blue-200 bg-white/60 p-3 text-xs text-blue-950 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-100">
                <span className="font-semibold">{copy.llmRuntime}: </span>
                {baseResult.meta?.llm_enabled
                  ? `${copy.llmActive}${baseResult.meta.llm_model ? ` · ${baseResult.meta.llm_model}` : ""}`
                  : baseResult.meta?.llm_configured
                    ? copy.llmFlagDisabled
                    : copy.llmMissingKey}{" "}
                {copy.llmResponsibility}
              </p>
            </section>

            <div className="grid gap-4 lg:grid-cols-2">
              <section className="rounded-xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-900 dark:bg-sky-950/40">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold text-sky-900 dark:text-sky-100">
                      {copy.newsEvidence}
                    </h2>
                    <p className="mt-1 text-xs text-sky-800/80 dark:text-sky-200/80">
                      {copy.newsEvidenceDescription}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${researchStatusStyles(result.market_research.news.status)}`}
                  >
                    {researchStatusLabel(result.market_research.news.status, copy)}
                  </span>
                </div>
                <p className="mt-3 text-xs text-sky-800 dark:text-sky-200">
                  {copy.officialSkill}: <span className="font-mono">news-briefing</span>
                  {" · "}
                  {copy.queryKeywords}: {result.market_research.news.query_keywords.join(", ") || "—"}
                </p>
                {result.market_research.news.articles.length > 0 ? (
                  <ol className="mt-3 space-y-3">
                    {result.market_research.news.articles.map((article, index) => (
                      <li
                        key={`${article.source}-${article.title}`}
                        className="rounded-lg border border-sky-200 bg-white/70 p-3 dark:border-sky-900 dark:bg-sky-950/50"
                      >
                        <p className="text-xs font-medium text-sky-700 dark:text-sky-300">
                          {index + 1}. {article.source}
                          {article.published ? ` · ${article.published}` : ""}
                        </p>
                        {article.link ? (
                          <a
                            href={article.link}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 block text-sm font-semibold text-sky-950 underline decoration-sky-400 underline-offset-2 dark:text-sky-100"
                          >
                            {article.title}
                          </a>
                        ) : (
                          <p className="mt-1 text-sm font-semibold text-sky-950 dark:text-sky-100">
                            {article.title}
                          </p>
                        )}
                        {article.summary ? (
                          <p className="mt-1 text-xs text-sky-900/80 dark:text-sky-100/80">
                            {article.summary}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                    {copy.noMatchingNews}
                  </p>
                )}
                <p className="mt-3 text-xs text-sky-800/70 dark:text-sky-200/70">
                  {locale === "zh" ? `${copy.originalHeadlineNote} · ` : ""}
                  {copy.fetchedAt}: {result.market_research.news.fetched_at}
                </p>
              </section>

              <section className="rounded-xl border border-purple-200 bg-purple-50 p-4 dark:border-purple-900 dark:bg-purple-950/40">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                      {copy.macroRegime}
                    </h2>
                    <p className="mt-1 text-xs text-purple-800/80 dark:text-purple-200/80">
                      {copy.macroRegimeDescription}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${researchStatusStyles(result.market_research.macro.status)}`}
                  >
                    {researchStatusLabel(result.market_research.macro.status, copy)}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-purple-800 dark:text-purple-200">
                    {copy.currentRegime}:
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${macroVerdictStyles(result.market_research.macro.verdict)}`}
                  >
                    {macroVerdictLabel(result.market_research.macro.verdict, copy)}
                  </span>
                  <span className="text-xs text-purple-800 dark:text-purple-200">
                    {copy.yieldCurve}:{" "}
                    {result.market_research.macro.yield_curve_inverted
                      ? copy.inverted
                      : copy.normal}
                  </span>
                </div>
                <p className="mt-3 text-sm text-purple-900/90 dark:text-purple-100/90">
                  {locale === "zh"
                    ? result.market_research.macro.verdict_reason_zh
                    : result.market_research.macro.verdict_reason_en}
                </p>
                <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                  {[
                    {
                      label: macroMetricLabel(locale, "Fed upper"),
                      value: formatResearchValue(
                        result.market_research.macro.rates.fed_funds_target_upper?.value,
                        "%",
                      ),
                    },
                    {
                      label: macroMetricLabel(locale, "US 10Y"),
                      value: formatResearchValue(result.market_research.macro.rates.t10y?.value, "%"),
                    },
                    {
                      label: macroMetricLabel(locale, "10Y-2Y"),
                      value: formatResearchValue(
                        result.market_research.macro.rates.spread_10y2y?.value,
                        "%",
                      ),
                    },
                    {
                      label: macroMetricLabel(locale, "Core PCE YoY"),
                      value: formatResearchValue(
                        result.market_research.macro.indicators.core_pce?.yoy_change_pct,
                        "%",
                      ),
                    },
                    {
                      label: macroMetricLabel(locale, "Unemployment"),
                      value: formatResearchValue(
                        result.market_research.macro.indicators.unemployment?.value,
                        "%",
                      ),
                    },
                    {
                      label: macroMetricLabel(locale, "VIX"),
                      value: formatResearchValue(
                        result.market_research.macro.market_prices.vix?.value,
                      ),
                    },
                    {
                      label: macroMetricLabel(locale, "Nasdaq 100"),
                      value: formatResearchValue(
                        result.market_research.macro.market_prices.nasdaq_100?.value,
                      ),
                    },
                    {
                      label: macroMetricLabel(locale, "DXY"),
                      value: formatResearchValue(
                        result.market_research.macro.market_prices.dxy?.value,
                      ),
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-lg border border-purple-200 bg-white/70 p-2 dark:border-purple-900 dark:bg-purple-950/50"
                    >
                      <dt className="text-xs text-purple-700 dark:text-purple-300">{item.label}</dt>
                      <dd className="mt-0.5 font-semibold text-purple-950 dark:text-purple-100">
                        {item.value}
                      </dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 text-xs text-purple-800/70 dark:text-purple-200/70">
                  {copy.officialSkill}: <span className="font-mono">macro-analyst</span>
                  {" · "}
                  {copy.fetchedAt}: {result.market_research.macro.fetched_at}
                </p>
              </section>
            </div>

            <section className="rounded-xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-950/40">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-orange-950 dark:text-orange-100">
                    {copy.eventDecisionTrace}
                  </h2>
                  <p className="mt-1 text-xs text-orange-800/80 dark:text-orange-200/80">
                    {copy.eventDecisionDescription}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${researchStatusStyles(result.event_intelligence.status)}`}
                >
                  {researchStatusLabel(result.event_intelligence.status, copy)}
                </span>
              </div>

              <ol className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {result.event_intelligence.decision_trace.map((step, index) => (
                  <li
                    key={step.id}
                    className="rounded-lg border border-orange-200 bg-white/70 p-3 dark:border-orange-900 dark:bg-orange-950/50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-orange-700 dark:text-orange-300">
                        {index + 1}. {locale === "zh" ? step.label_zh : step.label_en}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${researchStatusStyles(step.status === "complete" ? "verified" : step.status)}`}
                      >
                        {step.status === "complete"
                          ? copy.researchVerified
                          : researchStatusLabel(step.status, copy)}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-orange-950/80 dark:text-orange-100/80">
                      {locale === "zh" ? step.detail_zh : step.detail_en}
                    </p>
                  </li>
                ))}
              </ol>

              <div className="mt-4 grid gap-4 xl:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold text-orange-950 dark:text-orange-100">
                    {copy.extractedEvents}
                  </h3>
                  {result.event_intelligence.events.length > 0 ? (
                    <ul className="mt-2 space-y-2">
                      {result.event_intelligence.events.map((event) => (
                        <li
                          key={event.id}
                          className="rounded-lg border border-orange-200 bg-white/70 p-3 dark:border-orange-900 dark:bg-orange-950/50"
                        >
                          <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-orange-700 dark:text-orange-300">
                            <span>{event.source}</span>
                            <span>{eventTypeLabel(locale, event.event_type)}</span>
                            <span>{impactLabel(locale, event.bottleneck_impact)}</span>
                            <span>{tierLabel(event.magnitude, copy)}</span>
                          </div>
                          {event.link ? (
                            <a
                              href={event.link}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 block text-sm font-semibold text-orange-950 underline decoration-orange-400 underline-offset-2 dark:text-orange-100"
                            >
                              {event.title}
                            </a>
                          ) : (
                            <p className="mt-1 text-sm font-semibold text-orange-950 dark:text-orange-100">
                              {event.title}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-orange-950/80 dark:text-orange-100/80">
                            {locale === "zh" ? event.impact_reason_zh : event.impact_reason_en}
                          </p>
                          <p className="mt-1 text-[11px] text-orange-700 dark:text-orange-300">
                            {copy.affectedTickers}: {event.affected_tickers.join(", ")}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                      {copy.noSupplyChainEvents}
                    </p>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-orange-950 dark:text-orange-100">
                    {copy.currentSimulatedDecision}
                  </h3>
                  <div className="mt-2 rounded-lg border border-orange-200 bg-white/70 p-3 dark:border-orange-900 dark:bg-orange-950/50">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${simulatedActionStyles(result.event_intelligence.simulated_decision.action)}`}
                    >
                      {simulatedActionLabel(
                        result.event_intelligence.simulated_decision.action,
                        copy,
                      )}
                    </span>
                    <p className="mt-2 font-mono text-sm font-semibold text-orange-950 dark:text-orange-100">
                      {result.event_intelligence.simulated_decision.selected_tickers.join(", ") ||
                        "—"}
                    </p>
                    <p className="mt-2 text-xs text-orange-950/80 dark:text-orange-100/80">
                      {locale === "zh"
                        ? result.event_intelligence.simulated_decision.rationale_zh
                        : result.event_intelligence.simulated_decision.rationale_en}
                    </p>
                  </div>
                  <p className="mt-3 rounded-lg border border-orange-300 bg-orange-100/70 p-3 text-xs text-orange-950 dark:border-orange-800 dark:bg-orange-950/70 dark:text-orange-100">
                    <span className="font-semibold">{copy.liveEvidenceDisclosure}: </span>
                    {locale === "zh"
                      ? result.event_intelligence.disclosure_zh
                      : result.event_intelligence.disclosure_en}
                  </p>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto rounded-lg border border-orange-200 bg-white/70 dark:border-orange-900 dark:bg-orange-950/50">
                <h3 className="border-b border-orange-200 px-3 py-2 text-sm font-semibold text-orange-950 dark:border-orange-900 dark:text-orange-100">
                  {copy.candidateAdjustments}
                </h3>
                <table className="min-w-full text-left text-sm">
                  <thead className="text-xs text-orange-700 dark:text-orange-300">
                    <tr>
                      <th className="px-3 py-2 font-medium">{copy.ticker}</th>
                      <th className="px-3 py-2 font-medium">{copy.baseScore}</th>
                      <th className="px-3 py-2 font-medium">{copy.eventDelta}</th>
                      <th className="px-3 py-2 font-medium">{copy.macroDelta}</th>
                      <th className="px-3 py-2 font-medium">{copy.adjustedScore}</th>
                      <th className="px-3 py-2 font-medium">{copy.evidenceCount}</th>
                      <th className="px-3 py-2 font-medium">{copy.recommendedAction}</th>
                      <th className="px-3 py-2 font-medium">{copy.reason}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.event_intelligence.company_adjustments.map((adjustment) => (
                      <tr
                        key={adjustment.ticker}
                        className="border-t border-orange-100 dark:border-orange-900"
                      >
                        <td className="px-3 py-2 font-mono font-semibold">{adjustment.ticker}</td>
                        <td className="px-3 py-2">{adjustment.base_score}</td>
                        <td className="px-3 py-2">{formatSigned(adjustment.event_delta)}</td>
                        <td className="px-3 py-2">{formatSigned(adjustment.macro_delta)}</td>
                        <td className="px-3 py-2 font-semibold">{adjustment.adjusted_score}</td>
                        <td className="px-3 py-2">{adjustment.evidence_count}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${simulatedActionStyles(adjustment.recommended_action)}`}
                          >
                            {simulatedActionLabel(adjustment.recommended_action, copy)}
                          </span>
                        </td>
                        <td className="max-w-sm px-3 py-2 text-xs">
                          {locale === "zh" ? adjustment.explanation_zh : adjustment.explanation_en}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
              <h2 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">
                {copy.decisionLayer}
              </h2>
              <div className="mt-4 space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                    {copy.primaryBottleneckLabel}
                  </h3>
                  <ul className="mt-2">
                    <DecisionCompanyRow
                      company={result.final_decision.primary_bottleneck}
                      copy={copy}
                      locale={locale}
                      reasonEn={baseResult.final_decision.primary_bottleneck.reason}
                    />
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                    {copy.secondaryBottlenecks}
                  </h3>
                  <ul className="mt-2 space-y-2">
                    {result.final_decision.secondary_bottlenecks.length > 0 ? (
                      result.final_decision.secondary_bottlenecks.map((company, index) => (
                        <DecisionCompanyRow
                          key={company.ticker}
                          company={company}
                          copy={copy}
                          locale={locale}
                          reasonEn={
                            baseResult.final_decision.secondary_bottlenecks[index]?.reason
                          }
                        />
                      ))
                    ) : (
                      <li className="text-sm text-emerald-800/70 dark:text-emerald-200/70">
                        {copy.noneListed}
                      </li>
                    )}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                    {copy.nonBottleneckCompanies}
                  </h3>
                  <ul className="mt-2 space-y-2">
                    {result.final_decision.non_bottleneck_companies.map((company, index) => (
                      <DecisionCompanyRow
                        key={company.ticker}
                        company={company}
                        copy={copy}
                        locale={locale}
                        reasonEn={
                          baseResult.final_decision.non_bottleneck_companies[index]?.reason
                        }
                      />
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                <h3 className="font-semibold">{copy.traditionalApproach}</h3>
                <p className="mt-1 text-xs text-zinc-500">
                  {result.final_decision.traditional_vs_throatscan.traditional.label}
                </p>
                <ul className="mt-2 list-disc pl-5 text-sm text-zinc-600 dark:text-zinc-300">
                  {result.final_decision.traditional_vs_throatscan.traditional.metrics.map(
                    (metric) => (
                      <li key={metric}>{metric}</li>
                    ),
                  )}
                </ul>
                <p className="mt-2 text-sm font-medium">
                  {copy.topPicks}:{" "}
                  {result.final_decision.traditional_vs_throatscan.traditional.top_picks.join(", ")}
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  <BilingualText
                    locale={locale}
                    en={baseResult.final_decision.traditional_vs_throatscan.traditional.limitation}
                    zh={result.final_decision.traditional_vs_throatscan.traditional.limitation}
                  />
                </p>
              </div>
              <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-900 dark:bg-indigo-950/40">
                <h3 className="font-semibold text-indigo-900 dark:text-indigo-100">
                  {copy.throatscanApproach}
                </h3>
                <p className="mt-1 text-xs text-indigo-700/80 dark:text-indigo-200/80">
                  {result.final_decision.traditional_vs_throatscan.throatscan.label}
                </p>
                <ul className="mt-2 list-disc pl-5 text-sm text-indigo-900/90 dark:text-indigo-100/90">
                  {result.final_decision.traditional_vs_throatscan.throatscan.metrics.map(
                    (metric) => (
                      <li key={metric}>{metric}</li>
                    ),
                  )}
                </ul>
                <p className="mt-2 text-sm font-medium text-indigo-900 dark:text-indigo-100">
                  {copy.topPicks}:{" "}
                  {result.final_decision.traditional_vs_throatscan.throatscan.top_picks.join(", ")}
                </p>
                <p className="mt-2 text-xs text-indigo-800/80 dark:text-indigo-200/80">
                  <BilingualText
                    locale={locale}
                    en={baseResult.final_decision.traditional_vs_throatscan.throatscan.advantage}
                    zh={result.final_decision.traditional_vs_throatscan.throatscan.advantage}
                  />
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-900 dark:bg-violet-950/40">
              <h3 className="font-semibold text-violet-900 dark:text-violet-100">
                {copy.keyAdvantageTitle}
              </h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-violet-900/90 dark:text-violet-100/90">
                {result.final_decision.key_advantages.map((item, index) => (
                  <li key={item}>
                    <BilingualText
                      locale={locale}
                      en={baseResult.final_decision.key_advantages[index] ?? item}
                      zh={item}
                    />
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4 dark:border-cyan-900 dark:bg-cyan-950/40">
              <h2 className="text-lg font-semibold text-cyan-900 dark:text-cyan-100">
                {copy.reasoningIntelligence}
              </h2>

              {result.reasoning_intelligence && baseResult?.reasoning_intelligence ? (
              <>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-cyan-200/80 bg-white/60 p-3 dark:border-cyan-900 dark:bg-cyan-950/30">
                  <h3 className="text-sm font-medium text-cyan-900 dark:text-cyan-100">
                    {copy.alternativeHypothesis}
                  </h3>
                  <p className="mt-2 text-xs font-medium text-cyan-800 dark:text-cyan-200">
                    {copy.primaryTheory}
                  </p>
                  <p className="mt-1 text-sm text-cyan-900/90 dark:text-cyan-100/90">
                    {result.reasoning_intelligence.alternative_hypothesis.primary_theory.ticker} —{" "}
                    {result.reasoning_intelligence.alternative_hypothesis.primary_theory.thesis}
                  </p>
                  <span
                    className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${tierStyles(result.reasoning_intelligence.alternative_hypothesis.primary_theory.confidence)}`}
                  >
                    {tierLabel(
                      result.reasoning_intelligence.alternative_hypothesis.primary_theory
                        .confidence,
                      copy,
                    )}
                  </span>
                  {result.reasoning_intelligence.alternative_hypothesis.alternative_theory ? (
                    <>
                      <p className="mt-3 text-xs font-medium text-cyan-800 dark:text-cyan-200">
                        {copy.alternativeTheory}
                      </p>
                      <p className="mt-1 text-sm text-cyan-900/90 dark:text-cyan-100/90">
                        {
                          result.reasoning_intelligence.alternative_hypothesis.alternative_theory
                            .ticker
                        }{" "}
                        —{" "}
                        {
                          result.reasoning_intelligence.alternative_hypothesis.alternative_theory
                            .thesis
                        }
                      </p>
                      <span
                        className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${tierStyles(result.reasoning_intelligence.alternative_hypothesis.alternative_theory.confidence)}`}
                      >
                        {tierLabel(
                          result.reasoning_intelligence.alternative_hypothesis.alternative_theory
                            .confidence,
                          copy,
                        )}
                      </span>
                    </>
                  ) : null}
                  <p className="mt-3 text-xs text-cyan-800/80 dark:text-cyan-200/80">
                    <span className="font-medium">{copy.pivotCondition}:</span>{" "}
                    {result.reasoning_intelligence.alternative_hypothesis.pivot_condition}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="rounded-lg border border-cyan-200/80 bg-white/60 p-3 dark:border-cyan-900 dark:bg-cyan-950/30">
                    <p className="text-xs font-medium text-cyan-800 dark:text-cyan-200">
                      {copy.bottleneckUncertaintyLabel}
                    </p>
                    <span
                      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${tierStyles(result.reasoning_intelligence.bottleneck_uncertainty.confidence)}`}
                    >
                      {tierLabel(result.reasoning_intelligence.bottleneck_uncertainty.confidence, copy)}
                    </span>
                    <p className="mt-2 text-sm text-cyan-900/90 dark:text-cyan-100/90">
                      {result.reasoning_intelligence.bottleneck_uncertainty.reason}
                    </p>
                  </div>
                  <div className="rounded-lg border border-cyan-200/80 bg-white/60 p-3 dark:border-cyan-900 dark:bg-cyan-950/30">
                    <p className="text-xs font-medium text-cyan-800 dark:text-cyan-200">
                      {copy.selfCheck}
                    </p>
                    <ul className="mt-2 space-y-2 text-sm">
                      {result.reasoning_intelligence.self_checks.map((item) => (
                        <li key={item.check}>
                          <span
                            className={`mr-2 rounded px-1.5 py-0.5 text-xs font-semibold ${
                              item.passed
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            }`}
                          >
                            {item.passed ? copy.passed : copy.failed}
                          </span>
                          {item.finding}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {result.reasoning_intelligence.contradictions.length > 0 ? (
                <div className="mt-4 rounded-lg border border-cyan-200/80 bg-white/60 p-3 dark:border-cyan-900 dark:bg-cyan-950/30">
                  <h3 className="text-sm font-medium text-cyan-900 dark:text-cyan-100">
                    {copy.contradictions}
                  </h3>
                  <ul className="mt-2 space-y-2 text-sm text-cyan-900/90 dark:text-cyan-100/90">
                    {result.reasoning_intelligence.contradictions.map((row, index) => (
                      <li key={`contradiction-${index}`}>
                        <span className="font-medium">{row.signal_a}</span>
                        <span className="mx-1 text-cyan-600">{copy.vsLabel}</span>
                        <span className="font-medium">{row.signal_b}</span>
                        <span className="mt-1 block text-xs opacity-90">{row.tradeoff}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-3 dark:border-emerald-900 dark:bg-emerald-950/30">
                  <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                    {copy.confidentAbout}
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-emerald-900/90 dark:text-emerald-100/90">
                    {result.reasoning_intelligence.transparency_panel.confident_about.map((item, index) => (
                      <li key={`confident-${index}`}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 dark:border-amber-900 dark:bg-amber-950/30">
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                    {copy.uncertainAbout}
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-amber-900/90 dark:text-amber-100/90">
                    {result.reasoning_intelligence.transparency_panel.uncertain_about.map((item, index) => (
                      <li key={`uncertain-${index}`}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg border border-violet-200 bg-violet-50/80 p-3 dark:border-violet-900 dark:bg-violet-950/30">
                  <p className="text-xs font-semibold text-violet-800 dark:text-violet-200">
                    {copy.couldChange}
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-violet-900/90 dark:text-violet-100/90">
                    {result.reasoning_intelligence.transparency_panel.could_change_conclusion.map(
                      (item, index) => (
                        <li key={`change-${index}`}>{item}</li>
                      ),
                    )}
                  </ul>
                </div>
              </div>
              </>
              ) : null}
            </div>

            <div>
              <h2 className="text-lg font-semibold">{copy.industryChain}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {copy.sectorMapping}:
                </span>
                {result.interpretation.sector_tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                  >
                    {tag}
                  </span>
                ))}
                <span className="text-xs text-zinc-500">
                  ·{" "}
                  {result.interpretation.inference_mode === "constrained"
                    ? copy.inferenceRuleMatch
                    : result.interpretation.inference_mode === "constrained_llm"
                      ? copy.inferenceLlmRemote
                      : copy.inferenceLlmInferred}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    result.confidence_level === "HIGH"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
                  }`}
                >
                  {result.confidence_level === "HIGH"
                    ? copy.confidenceLevelHigh
                    : copy.confidenceLevelLow}
                </span>
                <span className="text-xs text-zinc-500">
                  · {copy.confidenceLabel}: {result.confidence}/100
                </span>
                <span className="text-xs text-zinc-500">
                  · {copy.runId}: {result.structured_report.run_id}
                </span>
              </div>
              {result.uncertain_mapping && result.uncertainty_message ? (
                <p className="mt-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                  <span className="font-medium">{copy.uncertainMapping}:</span>{" "}
                  <BilingualText
                    locale={locale}
                    en={baseResult.uncertainty_message ?? ""}
                    zh={result.uncertainty_message}
                  />
                </p>
              ) : null}
              {result.low_confidence ? (
                <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">{copy.partialRanking}</p>
              ) : null}
              {result.interpretation.demand_driver ? (
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                  <span className="font-medium">{copy.demandDriver}:</span>{" "}
                  <BilingualText
                    locale={locale}
                    en={baseResult.interpretation.demand_driver ?? ""}
                    zh={result.interpretation.demand_driver ?? ""}
                  />
                  <span className="mx-2 text-zinc-400">·</span>
                  <span className="font-medium">{copy.endMarket}:</span>{" "}
                  <BilingualText
                    locale={locale}
                    en={baseResult.interpretation.end_market ?? ""}
                    zh={result.interpretation.end_market ?? ""}
                  />
                </p>
              ) : null}
              <p className="mt-2 text-sm text-zinc-500">
                <BilingualText locale={locale} en={baseResult.summary} zh={result.summary} />
              </p>
              <div className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50 p-3 dark:border-indigo-900 dark:bg-indigo-950/40">
                <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                  {copy.structuredReport}
                </p>
                <dl className="mt-3 space-y-3 text-sm text-indigo-900/90 dark:text-indigo-100/90">
                  <div>
                    <dt className="font-medium">{copy.sectionA}</dt>
                    <dd className="mt-1">
                      {result.structured_report.section_a_industry_interpretation.display_label} ·{" "}
                      {result.structured_report.section_a_industry_interpretation.demand_driver}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium">{copy.sectionB}</dt>
                    <dd className="mt-1">
                      {result.structured_report.section_b_supply_chain_layers
                        .map((layer) => `${layerIdLabel(layer.id, copy)} (${layer.composite_pressure})`)
                        .join(" → ")}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium">{copy.sectionC}</dt>
                    <dd className="mt-1">
                      <BilingualText
                        locale={locale}
                        en={
                          baseResult.structured_report.section_c_bottleneck_identification
                            .rationale
                        }
                        zh={
                          result.structured_report.section_c_bottleneck_identification.rationale
                        }
                      />
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium">{copy.sectionD}</dt>
                    <dd className="mt-1">
                      {result.audit_trail
                        .slice(0, 5)
                        .map((row) => `${row.ticker} (${row.supply_role_label})`)
                        .join(", ") || copy.noneValue}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium">{copy.sectionE}</dt>
                    <dd className="mt-1">
                      {result.structured_report.section_e_final_ranking
                        .map((row) => `#${row.rank} ${row.ticker} (${row.confidence})`)
                        .join(" · ") || copy.withheldValue}
                    </dd>
                  </div>
                </dl>
              </div>
              <div className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50 p-3 dark:border-indigo-900 dark:bg-indigo-950/40">
                <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                  {copy.reasoningChain}
                </p>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-indigo-900/90 dark:text-indigo-100/90">
                  {result.reasoning_chain.map((step, index) => (
                    <li key={step}>
                      <BilingualText
                        locale={locale}
                        en={baseResult.reasoning_chain[index] ?? step}
                        zh={step}
                      />
                    </li>
                  ))}
                </ol>
              </div>
              <p className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                <span className="font-medium text-zinc-800 dark:text-zinc-100">
                  {copy.selectionRationale}:
                </span>{" "}
                <BilingualText
                  locale={locale}
                  en={baseResult.selection_rationale}
                  zh={result.selection_rationale}
                />
              </p>
              <ul className="mt-4 space-y-2">
                {result.chain.map((node) => (
                  <li
                    key={node.name}
                    className="rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-800"
                  >
                    <span className="font-medium">{node.name}</span>
                    <span className="mx-2 text-zinc-400">·</span>
                    <span className="text-zinc-600 dark:text-zinc-300">{node.description}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold">
                {result.low_confidence ? copy.partialRanking : copy.top5}
              </h2>
              <ul className="mt-4 space-y-2">
                {topCompanies.map((company) => {
                  const baseCompany = baseCompanyByTicker.get(company.ticker);
                  return (
                  <li
                    key={company.ticker}
                    className="rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-800"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-semibold">{company.ticker}</span>
                          <ThroatRoleBadge role={company.throat_role} locale={locale} />
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              company.bitget_market?.status === "online"
                                ? "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300"
                                : "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400"
                            }`}
                          >
                            {company.bitget_market?.status === "online"
                              ? `Bitget ${company.bitget_market.symbol}`
                              : copy.notListedOnBitget}
                          </span>
                        </div>
                        <p className="mt-1 text-zinc-600 dark:text-zinc-300">{company.name}</p>
                        {locale === "zh" && baseCompany?.name ? (
                          <p className="mt-1 text-xs text-zinc-500">
                            {terminalLabels.englishFullName}: {baseCompany.name}
                          </p>
                        ) : null}
                        {company.sector_tags?.length > 0 ? (
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <span className="text-xs text-zinc-500">
                              {terminalLabels.relatedIndustries}
                            </span>
                            {company.sector_tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        <p className="mt-1 text-xs text-zinc-500">
                          <BilingualText
                            locale={locale}
                            en={baseCompany?.chain_position ?? company.chain_position}
                            zh={company.chain_position}
                          />
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-zinc-500">{copy.throatScore}</p>
                        <p className="font-semibold">{company.score}</p>
                      </div>
                    </div>

                    <div className="mt-3 space-y-2 border-t border-zinc-100 pt-3 text-xs text-zinc-500 dark:border-zinc-900">
                      {company.selection_insight ? (
                        <>
                          <p>
                            <span className="font-medium text-zinc-700 dark:text-zinc-300">
                              {copy.supplyRole}:
                            </span>{" "}
                            {company.selection_insight.supply_role_label}
                          </p>
                          <p>
                            <span className="font-medium text-zinc-700 dark:text-zinc-300">
                              {copy.whySelected}:
                            </span>{" "}
                            <BilingualText
                              locale={locale}
                              en={
                                baseCompany?.selection_insight?.why_selected ??
                                company.selection_insight.why_selected
                              }
                              zh={company.selection_insight.why_selected}
                            />
                          </p>
                          <p>
                            <span className="font-medium text-zinc-700 dark:text-zinc-300">
                              {copy.dependsOn}:
                            </span>{" "}
                            <BilingualText
                              locale={locale}
                              en={
                                baseCompany?.selection_insight?.depends_on ??
                                company.selection_insight.depends_on
                              }
                              zh={company.selection_insight.depends_on}
                            />
                          </p>
                          <p>
                            <span className="font-medium text-zinc-700 dark:text-zinc-300">
                              {copy.whyNotOthers}:
                            </span>{" "}
                            <BilingualText
                              locale={locale}
                              en={
                                baseCompany?.selection_insight?.why_not_others ??
                                company.selection_insight.why_not_others
                              }
                              zh={company.selection_insight.why_not_others}
                            />
                          </p>
                          <p>
                            <span className="font-medium text-zinc-700 dark:text-zinc-300">
                              {copy.constraintsMet}:
                            </span>{" "}
                            {company.selection_insight.constraints_met.join("; ") || "—"}
                          </p>
                          <p>
                            <span className="font-medium text-zinc-700 dark:text-zinc-300">
                              {copy.matchConfidence}:
                            </span>{" "}
                            {company.selection_insight.match_confidence.toFixed(2)}
                          </p>
                          {company.selection_insight.uncertainty_confidence ? (
                            <>
                              <p>
                                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                                  {copy.uncertaintyConfidence}:
                                </span>{" "}
                                <span
                                  className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${tierStyles(company.selection_insight.uncertainty_confidence)}`}
                                >
                                  {tierLabel(company.selection_insight.uncertainty_confidence, copy)}
                                </span>
                              </p>
                              <p>
                                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                                  {copy.uncertaintyReason}:
                                </span>{" "}
                                <BilingualText
                                  locale={locale}
                                  en={
                                    baseCompany?.selection_insight?.uncertainty_reason ??
                                    company.selection_insight.uncertainty_reason ??
                                    ""
                                  }
                                  zh={company.selection_insight.uncertainty_reason ?? ""}
                                />
                              </p>
                            </>
                          ) : null}
                        </>
                      ) : null}
                      <p>
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                          {copy.scarceResource}:
                        </span>{" "}
                        <BilingualText
                          locale={locale}
                          en={
                            baseCompany?.why_bottleneck_or_not.scarce_resource ??
                            company.why_bottleneck_or_not.scarce_resource
                          }
                          zh={company.why_bottleneck_or_not.scarce_resource}
                        />
                      </p>
                      <p>
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                          {copy.canFunctionWithout}:
                        </span>{" "}
                        <BilingualText
                          locale={locale}
                          en={
                            baseCompany?.why_bottleneck_or_not.can_function_without ??
                            company.why_bottleneck_or_not.can_function_without
                          }
                          zh={company.why_bottleneck_or_not.can_function_without}
                        />
                      </p>
                      <p>
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                          {copy.replaceability}:
                        </span>{" "}
                        <BilingualText
                          locale={locale}
                          en={
                            baseCompany?.why_bottleneck_or_not.replaceability_1_to_3_years ??
                            company.why_bottleneck_or_not.replaceability_1_to_3_years
                          }
                          zh={company.why_bottleneck_or_not.replaceability_1_to_3_years}
                        />
                      </p>
                    </div>

                    <ul className="mt-3 space-y-1 border-t border-zinc-100 pt-3 dark:border-zinc-900">
                      {BREAKDOWN_FIELDS.map((field) => (
                        <li
                          key={field}
                          className="flex items-center justify-between text-xs text-zinc-500"
                        >
                          <span>{getBreakdownLabel(locale, field)}</span>
                          <span>{company.breakdown[field]}</span>
                        </li>
                      ))}
                    </ul>
                  </li>
                  );
                })}
              </ul>
            </div>

            <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/40">
              <h2 className="text-lg font-semibold text-red-900 dark:text-red-200">
                {copy.conclusionTitle}
              </h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="font-medium text-red-800 dark:text-red-300">
                    {copy.whereBottleneck}
                  </dt>
                  <dd className="mt-1 text-red-900/80 dark:text-red-100">
                    <BilingualText
                      locale={locale}
                      en={baseResult.conclusion.bottleneck_location}
                      zh={result.conclusion.bottleneck_location}
                    />
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-red-800 dark:text-red-300">
                    {copy.primaryBottleneck}
                  </dt>
                  <dd className="mt-1 text-red-900/80 dark:text-red-100">
                    {formatPrimaryBottleneck(
                      locale,
                      result.conclusion.primary_bottleneck.ticker,
                      result.conclusion.primary_bottleneck.name,
                      result.conclusion.primary_bottleneck.throat_role,
                      result.conclusion.primary_bottleneck.score,
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-red-800 dark:text-red-300">
                    {copy.highScoreNotChoke}
                  </dt>
                  <dd className="mt-1 text-red-900/80 dark:text-red-100">
                    {result.conclusion.high_score_non_bottlenecks.length > 0
                      ? result.conclusion.high_score_non_bottlenecks
                          .map((company) =>
                            formatNonBottleneckEntry(
                              locale,
                              company.ticker,
                              company.throat_role,
                              company.score,
                            ),
                          )
                          .join(locale === "zh" ? " · " : " · ")
                      : copy.noneInTop}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-red-800 dark:text-red-300">{copy.summary}</dt>
                  <dd className="mt-1 text-red-900/80 dark:text-red-100">
                    <BilingualText
                      locale={locale}
                      en={baseResult.conclusion.narrative}
                      zh={result.conclusion.narrative}
                    />
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-emerald-900 dark:text-emerald-200">
                  {copy.backtestTitle}
                </h2>
                {result.backtest.status === "verified" ? (
                  <button
                    type="button"
                    onClick={handleDownloadEvidence}
                    className="rounded-lg border border-emerald-700 px-3 py-1.5 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-400 dark:text-emerald-200 dark:hover:bg-emerald-900"
                  >
                    {copy.downloadEvidence}
                  </button>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-emerald-800/80 dark:text-emerald-100">
                {formatBacktestMeta(
                  result.backtest.period,
                  result.backtest.allocation,
                  result.backtest.rebalance,
                )}
              </p>
              <p className="mt-2 text-xs text-emerald-800 dark:text-emerald-200">
                {copy.dataSource}: {result.backtest.data_source}
                {" · "}
                {copy.benchmark}: {result.backtest.benchmark_symbol}
                {result.backtest.evidence_hash
                  ? ` · SHA-256: ${result.backtest.evidence_hash.slice(0, 16)}…`
                  : ""}
              </p>
              <p className="mt-2 rounded-lg border border-emerald-200 bg-white/60 p-2 text-xs text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100">
                {copy.liveEvidenceDisclosure}:{" "}
                {locale === "zh"
                  ? result.event_intelligence.disclosure_zh
                  : result.backtest.selection_context.disclosure}
              </p>

              {result.backtest.status === "unavailable" ? (
                <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                  <p>{result.backtest.validation_summary}</p>
                  {result.backtest.warnings.map((warning) => (
                    <p key={warning} className="mt-1 text-xs">
                      {warning}
                    </p>
                  ))}
                </div>
              ) : (
                <>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {[
                  { label: copy.totalReturn, value: `${result.backtest.metrics.total_return_pct}%` },
                  {
                    label: copy.spyBenchmark,
                    value: `${result.backtest.metrics.benchmark_return_pct}%`,
                  },
                  {
                    label: copy.maxDrawdown,
                    value: `${result.backtest.metrics.max_drawdown_pct}%`,
                  },
                  {
                    label: copy.volatility,
                    value: `${result.backtest.metrics.volatility_pct}%`,
                  },
                  { label: copy.alpha, value: `${result.backtest.metrics.alpha_pct}%` },
                  { label: copy.sharpeRatio, value: `${result.backtest.metrics.sharpe_ratio}` },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-lg border border-emerald-200 bg-white/70 p-3 dark:border-emerald-900 dark:bg-emerald-950/60"
                  >
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">{stat.label}</p>
                    <p className="mt-1 text-lg font-semibold text-emerald-900 dark:text-emerald-100">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-lg border border-emerald-200 bg-white/70 p-3 dark:border-emerald-900 dark:bg-emerald-950/60">
                <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                  {formatBottleneckStrategyScore(
                    locale,
                    result.backtest.bottleneck_strategy_score,
                  )}
                </p>
                <p className="mt-1 text-xs text-emerald-800 dark:text-emerald-200">
                  {result.backtest.validation_summary}
                </p>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    label: copy.maxPositionWeight,
                    value: `${result.backtest.risk_policy.max_position_weight_pct}%`,
                  },
                  {
                    label: copy.trailingStop,
                    value: `${result.backtest.risk_policy.trailing_stop_loss_pct}%`,
                  },
                  {
                    label: copy.rebalanceEvents,
                    value: result.backtest.risk_summary.rebalance_events,
                  },
                  {
                    label: copy.finalCashWeight,
                    value: `${result.backtest.risk_summary.final_cash_weight_pct}%`,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-lg border border-emerald-200 bg-white/70 p-3 dark:border-emerald-900 dark:bg-emerald-950/60"
                  >
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">{item.label}</p>
                    <p className="mt-1 font-semibold text-emerald-900 dark:text-emerald-100">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-lg border border-emerald-200 bg-white/70 p-3 dark:border-emerald-900 dark:bg-emerald-950/60">
                <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                  {copy.equityCurve}
                </h3>
                <EquityCurveChart
                  data={result.backtest.equity_curve}
                  portfolioLabel={copy.portfolioLine}
                  benchmarkLabel={copy.benchmarkLine}
                />
              </div>

              <div className="mt-4 overflow-x-auto rounded-lg border border-emerald-200 bg-white/70 dark:border-emerald-900 dark:bg-emerald-950/60">
                <h3 className="border-b border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-900 dark:border-emerald-900 dark:text-emerald-100">
                  {copy.performanceTable}
                </h3>
                <table className="min-w-full text-left text-sm">
                  <thead className="text-xs text-emerald-700 dark:text-emerald-300">
                    <tr>
                      <th className="px-3 py-2 font-medium">{copy.ticker}</th>
                      <th className="px-3 py-2 font-medium">{copy.bitgetSymbol}</th>
                      <th className="px-3 py-2 font-medium">{copy.role}</th>
                      <th className="px-3 py-2 font-medium">{copy.weight}</th>
                      <th className="px-3 py-2 font-medium">{copy.totalReturn}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.backtest.holdings.map((holding) => (
                      <tr
                        key={holding.ticker}
                        className="border-t border-emerald-100 dark:border-emerald-900"
                      >
                        <td className="px-3 py-2 font-mono">{holding.ticker}</td>
                        <td className="px-3 py-2 font-mono text-xs">{holding.bitget_symbol}</td>
                        <td className="px-3 py-2 text-xs">
                          {getThroatRoleLabel(locale, holding.throat_role)}
                        </td>
                        <td className="px-3 py-2">{holding.weight_pct}%</td>
                        <td className="px-3 py-2">{holding.total_return_pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 overflow-x-auto rounded-lg border border-emerald-200 bg-white/70 dark:border-emerald-900 dark:bg-emerald-950/60">
                <h3 className="border-b border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-900 dark:border-emerald-900 dark:text-emerald-100">
                  {copy.bottleneckVsNon}
                </h3>
                <table className="min-w-full text-left text-sm">
                  <thead className="text-xs text-emerald-700 dark:text-emerald-300">
                    <tr>
                      <th className="px-3 py-2 font-medium">{copy.roleGroup}</th>
                      <th className="px-3 py-2 font-medium">{copy.tickers}</th>
                      <th className="px-3 py-2 font-medium">{copy.basketReturn}</th>
                      <th className="px-3 py-2 font-medium">{copy.avgMonthly}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.backtest.role_comparison.map((row) => (
                      <tr
                        key={row.role}
                        className="border-t border-emerald-100 dark:border-emerald-900"
                      >
                        <td className="px-3 py-2 font-medium">
                          {getThroatRoleLabel(locale, row.role)}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs">
                          {row.tickers.length > 0 ? row.tickers.join(", ") : "—"}
                        </td>
                        <td className="px-3 py-2">{row.total_return_pct}%</td>
                        <td className="px-3 py-2">{row.avg_monthly_return_pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 overflow-x-auto rounded-lg border border-emerald-200 bg-white/70 dark:border-emerald-900 dark:bg-emerald-950/60">
                <h3 className="border-b border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-900 dark:border-emerald-900 dark:text-emerald-100">
                  {copy.simulatedTradeLog}
                </h3>
                <table className="min-w-full text-left text-sm">
                  <thead className="text-xs text-emerald-700 dark:text-emerald-300">
                    <tr>
                      <th className="px-3 py-2 font-medium">{copy.time}</th>
                      <th className="px-3 py-2 font-medium">{copy.symbol}</th>
                      <th className="px-3 py-2 font-medium">{copy.side}</th>
                      <th className="px-3 py-2 font-medium">{copy.action}</th>
                      <th className="px-3 py-2 font-medium">{copy.quantity}</th>
                      <th className="px-3 py-2 font-medium">{copy.price}</th>
                      <th className="px-3 py-2 font-medium">{copy.fee}</th>
                      <th className="px-3 py-2 font-medium">{copy.portfolioAfter}</th>
                      <th className="px-3 py-2 font-medium">{copy.reason}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.backtest.trade_log.map((trade) => (
                      <tr
                        key={`${trade.timestamp}-${trade.symbol}`}
                        className="border-t border-emerald-100 dark:border-emerald-900"
                      >
                        <td className="px-3 py-2 text-xs">{trade.timestamp.slice(0, 10)}</td>
                        <td className="px-3 py-2 font-mono text-xs">{trade.symbol}</td>
                        <td className="px-3 py-2">
                          {trade.side === "BUY" ? copy.buy : copy.sell}
                        </td>
                        <td className="px-3 py-2">
                          {trade.action === "ENTRY"
                            ? copy.entry
                            : trade.action === "REBALANCE"
                              ? copy.rebalanceAction
                              : copy.stopLoss}
                        </td>
                        <td className="px-3 py-2">{trade.quantity}</td>
                        <td className="px-3 py-2">{trade.price}</td>
                        <td className="px-3 py-2">{trade.fee_usdt} USDT</td>
                        <td className="px-3 py-2">{trade.portfolio_value_after_usdt} USDT</td>
                        <td className="max-w-xs px-3 py-2 text-xs">{trade.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
                </>
              )}
            </div>
              </div>
            </details>
          </div>
        ) : null}
          </section>
        </main>
      </div>
    </div>
  );
}
