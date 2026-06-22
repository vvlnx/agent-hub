"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AnalysisResult } from "@/lib/mockData";
import type { PaperOrder, PaperTradingStatus } from "@/lib/paperTrading/types";
import { EquityCurveChart } from "@/components/EquityCurveChart";
import { EquityTierBadge } from "@/components/EquityTierBadge";
import { EquityTradabilityPanel } from "@/components/EquityTradabilityPanel";
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
import { formatGicsPath, type GicsMappingKind } from "@/lib/gics";

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

function gicsMappingKindLabel(kind: GicsMappingKind, copy: ReturnType<typeof t>): string {
  if (kind === "canonical") return copy.gicsMappingCanonical;
  if (kind === "theme") return copy.gicsMappingTheme;
  return copy.gicsMappingUnknown;
}

function universeCoverageLabel(
  level: AnalysisResult["universe_coverage"]["level"],
  copy: ReturnType<typeof t>,
): string {
  if (level === "full") return copy.universeCoverageFull;
  if (level === "partial") return copy.universeCoveragePartial;
  return copy.universeCoverageOut;
}

function universeCoverageStyles(level: AnalysisResult["universe_coverage"]["level"]): string {
  if (level === "full") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (level === "partial") return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-red-200 bg-red-50 text-red-900";
}

type WorkspaceSection =
  | "scanner"
  | "decision-overview"
  | "industry-map"
  | "professional-analysis"
  | "agent-workflow";

export default function HomePage() {
  const [locale, setLocale] = useState<Locale>("en");
  const [industry, setIndustry] = useState("AI chips");
  const [baseResult, setBaseResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBitgetSetup, setShowBitgetSetup] = useState(false);
  const [paperStatus, setPaperStatus] = useState<PaperTradingStatus | null>(null);
  const [recentPaperOrders, setRecentPaperOrders] = useState<PaperOrder[]>([]);
  const [paperSubmitting, setPaperSubmitting] = useState(false);
  const [paperMessage, setPaperMessage] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const [scannerExpanded, setScannerExpanded] = useState(true);
  const [activeSection, setActiveSection] = useState<WorkspaceSection>("scanner");
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const mainScrollRef = useRef<HTMLElement>(null);
  const copy = t(locale);

  useEffect(() => {
    if (loading) {
      setScannerExpanded(true);
    }
  }, [loading]);

  function scrollToSection(
    sectionId: WorkspaceSection,
    options?: { openEvidence?: boolean },
  ) {
    setActiveSection(sectionId);
    if (options?.openEvidence || sectionId === "professional-analysis") {
      setEvidenceOpen(true);
    }
    requestAnimationFrame(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  const analysisSteps = useMemo(
    () =>
      locale === "zh"
        ? [
            "解析行业与供应链层级…",
            "匹配上市公司与硬约束…",
            "拉取 Bitget 公开行情…",
            "并行请求 Agent Hub 新闻/宏观…",
            "生成事件信号与模拟决策…",
            "运行 Bitget 回测与证据包…",
          ]
        : [
            "Parsing industry and supply-chain layers…",
            "Matching public companies and hard constraints…",
            "Fetching Bitget public market data…",
            "Running Agent Hub news/macro research in parallel…",
            "Building event signals and simulated decision…",
            "Running Bitget backtest and evidence bundle…",
          ],
    [locale],
  );

  async function refreshPaperStatus() {
    try {
      const response = await fetch("/api/paper/status", { cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as PaperTradingStatus & {
        recent_orders?: PaperOrder[];
      };
      setPaperStatus(payload);
      setRecentPaperOrders(payload.recent_orders ?? []);
    } catch {
      /* ignore transient status failures */
    }
  }

  useEffect(() => {
    void fetch("/api/warmup", { cache: "no-store" }).catch(() => undefined);
    void refreshPaperStatus();
  }, []);

  useEffect(() => {
    if (!loading) {
      setLoadingStep(0);
      return;
    }
    let step = 0;
    setLoadingStep(0);
    const timer = setInterval(() => {
      step = Math.min(step + 1, analysisSteps.length - 1);
      setLoadingStep(step);
    }, 2800);
    return () => clearInterval(timer);
  }, [loading, analysisSteps.length]);

  const result = useMemo(() => {
    if (!baseResult) return null;
    try {
      return localizeAnalysisResult(baseResult, locale);
    } catch {
      return baseResult;
    }
  }, [baseResult, locale]);

  async function handleRunAnalysis(nextIndustry?: string) {
    if (nextIndustry) {
      setIndustry(nextIndustry);
    }
    const query = (nextIndustry ?? industry).trim();
    if (!query) return;

    setLoading(true);
    setError(null);
    setPaperMessage(null);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ industry: query }),
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
        !payload.thesis_audit ||
        !payload.completeness
      ) {
        throw new Error(copy.analysisFailed);
      }

      setBaseResult(payload);
      setScannerExpanded(false);
      scrollToSection("decision-overview");
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.analysisFailed);
      setBaseResult(null);
    } finally {
      setLoading(false);
    }
  }

  async function handlePaperExecute() {
    if (!baseResult) return;
    const tickers = baseResult.event_intelligence.simulated_decision.selected_tickers;
    if (tickers.length === 0) {
      setPaperMessage(
        locale === "zh"
          ? "当前没有 Bitget 可执行的模拟篮子标的。"
          : "No Bitget-tradable tickers in the current simulated basket.",
      );
      return;
    }

    setPaperSubmitting(true);
    setPaperMessage(null);
    try {
      const response = await fetch("/api/paper/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          run_id: baseResult.structured_report.run_id,
          industry: baseResult.industry,
          tickers,
          rationale:
            baseResult.event_intelligence.simulated_decision.rationale_en ??
            "ThroatScan simulated basket",
        }),
      });
      const payload = (await response.json()) as {
        summary_en?: string;
        summary_zh?: string;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? copy.analysisFailed);
      }
      setPaperMessage(locale === "zh" ? payload.summary_zh ?? "" : payload.summary_en ?? "");
      await refreshPaperStatus();
    } catch (err) {
      setPaperMessage(err instanceof Error ? err.message : copy.analysisFailed);
    } finally {
      setPaperSubmitting(false);
    }
  }

  function handleDownloadEvidence() {
    if (!baseResult) return;

    const payload = {
      schema_version: "throatscan-run-evidence-v2",
      project: "ThroatScan Oracle",
      exported_at: new Date().toISOString(),
      run_id: baseResult.structured_report.run_id,
      industry_input: baseResult.interpretation.user_input,
      confidence: {
        score: baseResult.confidence,
        level: baseResult.confidence_level,
      },
      llm_industry_research: {
        api: baseResult.meta?.llm_api ?? "responses",
        model: baseResult.meta?.llm_model,
        inference_mode: baseResult.interpretation.inference_mode,
        grounding_mode: baseResult.interpretation.grounding_mode ?? "none",
        web_search_used: baseResult.interpretation.web_search_used ?? false,
        queries: baseResult.interpretation.research_queries ?? [],
        sources: baseResult.interpretation.research_sources ?? [],
      },
      bitget_market_evidence: baseResult.companies.map((company) => ({
        ticker: company.ticker,
        analysis_grade: company.analysis_grade,
        bitget_equity: company.bitget_equity,
        market: company.bitget_market,
      })),
      bitget_discovery: baseResult.bitget_discovery,
      market_research: baseResult.market_research,
      event_intelligence: baseResult.event_intelligence,
      final_decision: baseResult.final_decision,
      industry_map: baseResult.industry_map,
      universe_coverage: baseResult.universe_coverage,
      gics_query: baseResult.interpretation.gics,
      paper_trading: {
        status: paperStatus,
        recent_orders: recentPaperOrders,
      },
      completeness: baseResult.completeness,
      submission_rubric_self_assessment: baseResult.completeness.judge_self_assessment,
      agent_workflow: baseResult.completeness.novelty.agent_workflow,
      novelty_pitch: {
        why_agent_only_en: baseResult.completeness.novelty.why_agent_only_en,
        why_agent_only_zh: baseResult.completeness.novelty.why_agent_only_zh,
        growth_roadmap: baseResult.completeness.novelty.growth_roadmap,
        rebalance_agent: baseResult.completeness.novelty.rebalance_agent,
      },
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
          productLabel: "BITGET 智能研究终端",
          researchDesk: "研究台",
          portfolio: "模拟篮子",
          activity: "执行记录",
          publicDataConnected: "公开行情已连接",
          tradingNotConnected: "交易账户未连接",
          connectBitget: "连接 Bitget",
          executionConsole: "Bitget 执行连接台",
          executionHint: "研究数据已接入；账户、余额和下单能力需单独授权。",
          publicMarket: "公开市场数据",
          tradingApi: "交易 API",
          accountBalance: "账户余额",
          notConnected: "未连接",
          paperMode: "模拟模式",
          liveLocked: "实盘锁定",
          runnabilityLevel: "可运行层级",
          runnabilityBacktest: "回测 + 证据",
          runnabilityLocalPaper: "本地纸交易",
          runnabilityBitgetDemo: "Bitget Demo",
          executePaperBasket: "执行纸交易篮子",
          executingPaper: "提交纸交易中…",
          demoRunAiChips: "一键演示：AI chips",
          loadingPipeline: "分析流水线",
          paperOrders: "纸交易记录",
          testPaperConnection: "检测纸交易连接",
          configureConnection: "配置连接",
          workflow: "研究到执行流程",
          workflowResearch: "行业研究",
          workflowMap: "标的映射",
          workflowVerify: "行情验证",
          workflowSimulate: "模拟决策",
          setupTitle: "连接 Bitget 交易账户",
          setupSubtitle: "当前页面仅使用公开行情。交易凭证应只保存在服务端。",
          permissions: "建议权限",
          permissionValue: "只读 + 交易，不启用提现",
          setupStepOne: "在 Bitget 创建独立 API Key，并绑定服务器 IP。",
          setupStepTwo: "仅开启读取与交易权限，保持提现权限关闭。",
          setupStepThree: "通过服务端环境变量保存密钥，再运行连接测试。",
          secretWarning: "不要在浏览器或前端代码中保存 API Secret 与 Passphrase。",
          close: "关闭",
          emptyTitle: "选择一个行业，生成第一份执行研究",
          emptyHint: "系统会先识别产业链瓶颈，再核对 Bitget 可交易标的，最后生成模拟篮子。",
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
          productLabel: "BITGET INTELLIGENCE TERMINAL",
          researchDesk: "Research Desk",
          portfolio: "Sim Basket",
          activity: "Execution Log",
          publicDataConnected: "Public data connected",
          tradingNotConnected: "Trading account not connected",
          connectBitget: "Connect Bitget",
          executionConsole: "Bitget Execution Console",
          executionHint: "Research data is live. Account, balance, and order access require separate authorization.",
          publicMarket: "Public market data",
          tradingApi: "Trading API",
          accountBalance: "Account balance",
          notConnected: "Not connected",
          paperMode: "Paper mode",
          liveLocked: "Live locked",
          runnabilityLevel: "Runnability level",
          runnabilityBacktest: "Backtest + evidence",
          runnabilityLocalPaper: "Local paper",
          runnabilityBitgetDemo: "Bitget Demo",
          executePaperBasket: "Execute paper basket",
          executingPaper: "Submitting paper orders…",
          demoRunAiChips: "One-click demo: AI chips",
          loadingPipeline: "Analysis pipeline",
          paperOrders: "Paper orders",
          testPaperConnection: "Test paper connection",
          configureConnection: "Configure connection",
          workflow: "Research-to-execution flow",
          workflowResearch: "Industry research",
          workflowMap: "Symbol mapping",
          workflowVerify: "Market verify",
          workflowSimulate: "Sim decision",
          setupTitle: "Connect a Bitget trading account",
          setupSubtitle: "This page currently uses public market data only. Trading credentials belong on the server.",
          permissions: "Recommended scope",
          permissionValue: "Read + trade, withdrawals disabled",
          setupStepOne: "Create a dedicated API key in Bitget and bind the server IP.",
          setupStepTwo: "Enable read and trade only; keep withdrawal access disabled.",
          setupStepThree: "Store credentials in server environment variables, then run a connection test.",
          secretWarning: "Never store the API secret or passphrase in browser or frontend code.",
          close: "Close",
          emptyTitle: "Choose an industry to create an execution-ready research brief",
          emptyHint: "The system finds the bottleneck, verifies Bitget-listed symbols, then builds a simulated basket.",
        };
  const quickIndustries = [
    { value: "AI chips", label: locale === "zh" ? "AI 芯片" : "AI chips" },
    { value: "Semiconductor", label: locale === "zh" ? "半导体" : "Semiconductor" },
    { value: "Space", label: locale === "zh" ? "商业航天" : "Space" },
    { value: "Quantum computing", label: locale === "zh" ? "量子计算" : "Quantum" },
    { value: "Rare earth", label: locale === "zh" ? "稀土/关键矿物" : "Rare earth" },
    { value: "Nuclear Energy", label: locale === "zh" ? "核能/铀" : "Nuclear" },
    { value: "Cybersecurity", label: locale === "zh" ? "网络安全" : "Cybersecurity" },
    { value: "EV Battery", label: locale === "zh" ? "电动车电池" : "EV Battery" },
    { value: "Healthcare services", label: locale === "zh" ? "医疗服务" : "Healthcare" },
    { value: "Financials banking", label: locale === "zh" ? "银行金融" : "Financials" },
    { value: "Telecom broadband", label: locale === "zh" ? "电信宽带" : "Telecom" },
    { value: "Logistics shipping", label: locale === "zh" ? "物流运输" : "Logistics" },
  ];
  const selectedTradeTickers = result?.event_intelligence.simulated_decision.selected_tickers ?? [];
  const appHandoffTickers = result?.event_intelligence.simulated_decision.app_handoff_tickers ?? [];
  const onlineCandidateCount =
    result?.companies.filter(
      (company) =>
        company.bitget_equity?.execution_tier === "A" ||
        company.bitget_equity?.execution_tier === "B" ||
        (company.bitget_market?.listed && company.bitget_market.status === "online"),
    ).length ?? 0;
  const totalCandidateCount = result?.companies.length ?? 0;
  const evidenceReady =
    result?.market_research.macro.status !== "unavailable" &&
    result?.market_research.news.status !== "unavailable" &&
    result?.backtest.status === "verified";
  const industryMapCompanies = result?.industry_map.layers.flatMap((layer) => layer.companies) ?? [];

  return (
    <div className="cursor-workbench flex h-screen flex-col overflow-hidden">
      <header className="cursor-titlebar shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="hidden gap-1.5 sm:flex" aria-hidden="true">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="brand-mark flex h-6 w-6 items-center justify-center text-[10px] font-bold">TS</div>
          <span className="text-xs font-medium">ThroatScan Oracle</span>
        </div>
        <div className="cursor-titlebar-title">{terminalLabels.productLabel}</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowBitgetSetup(true)}
            className="cursor-btn-ghost hidden px-2.5 py-1 text-[11px] sm:block"
          >
            {terminalLabels.connectBitget}
          </button>
          <div className="flex rounded border border-[var(--cursor-border-strong)] bg-[var(--cursor-panel)] p-0.5">
            <button
              type="button"
              onClick={() => setLocale("en")}
              className={`rounded px-2 py-0.5 text-[11px] font-medium ${
                locale === "en" ? "bg-[var(--cursor-selection)] text-[var(--cursor-fg)]" : "text-[var(--cursor-fg-muted)]"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLocale("zh")}
              className={`rounded px-2 py-0.5 text-[11px] font-medium ${
                locale === "zh" ? "bg-[var(--cursor-selection)] text-[var(--cursor-fg)]" : "text-[var(--cursor-fg-muted)]"
              }`}
            >
              中文
            </button>
          </div>
        </div>
      </header>

      <div className="cursor-tabstrip shrink-0" aria-label="Primary navigation">
        {(
          [
            ["scanner", terminalLabels.researchDesk],
            ["decision-overview", terminalLabels.portfolio],
            ["professional-analysis", terminalLabels.evidence],
            ["agent-workflow", locale === "zh" ? "Agent 工作流" : "Agent workflow"],
          ] as const
        ).map(([sectionId, label]) => (
          <button
            key={sectionId}
            type="button"
            onClick={() =>
              scrollToSection(sectionId, {
                openEvidence: sectionId === "professional-analysis",
              })
            }
            className={`cursor-tab ${activeSection === sectionId ? "active" : ""}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1">
        <nav className="cursor-activity-bar shrink-0" aria-label="Views">
          <button
            type="button"
            onClick={() => scrollToSection("scanner")}
            className={`cursor-activity-btn ${activeSection === "scanner" ? "active" : ""}`}
            title={terminalLabels.workspace}
            aria-label={terminalLabels.workspace}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("decision-overview")}
            className={`cursor-activity-btn ${activeSection === "decision-overview" ? "active" : ""}`}
            title={terminalLabels.portfolio}
            aria-label={terminalLabels.portfolio}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M3 3v18h18M7 16l4-4 4 4 5-6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("professional-analysis", { openEvidence: true })}
            className={`cursor-activity-btn ${activeSection === "professional-analysis" ? "active" : ""}`}
            title={terminalLabels.evidence}
            aria-label={terminalLabels.evidence}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("agent-workflow")}
            className={`cursor-activity-btn ${activeSection === "agent-workflow" ? "active" : ""}`}
            title={locale === "zh" ? "Agent 工作流" : "Agent workflow"}
            aria-label={locale === "zh" ? "Agent 工作流" : "Agent workflow"}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7L12 16.8 5.7 21l2.3-7-6-4.6h7.6L12 2z" />
            </svg>
          </button>
        </nav>

        <aside className="cursor-sidebar terminal-sidebar shrink-0 p-2">
          <p className="cursor-sidebar-section">{terminalLabels.workspace}</p>
          <div>
            {(
              [
                ["01", terminalLabels.overview, "decision-overview"],
                ["02", terminalLabels.eventFlow, "professional-analysis"],
                ["03", terminalLabels.chain, "industry-map"],
                ["04", terminalLabels.candidates, "industry-map"],
                ["05", terminalLabels.backtest, "professional-analysis"],
                ["06", locale === "zh" ? "Agent 工作流" : "Agent workflow", "agent-workflow"],
              ] as const
            ).map(([number, label, sectionId]) => (
              <button
                type="button"
                key={label}
                onClick={() =>
                  scrollToSection(sectionId, {
                    openEvidence: sectionId === "professional-analysis",
                  })
                }
                className={`cursor-sidebar-item w-full border-0 bg-transparent text-left ${
                  activeSection === sectionId ? "active" : ""
                }`}
              >
                <span className="font-mono text-[10px] opacity-50">{number}</span>
                {label}
              </button>
            ))}
          </div>
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
                <span className="terminal-green">LIVE</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-[var(--cursor-fg-muted)]">
                <span>{terminalLabels.tradingApi}</span>
                <span className={paperStatus?.demo_configured ? "terminal-green" : paperStatus?.mode === "local_paper" ? "terminal-amber" : "text-[var(--cursor-fg-subtle)]"}>
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
            <button type="button" onClick={() => setShowBitgetSetup(true)} className="cursor-btn-ghost mt-3 w-full px-2 py-1.5 text-xs">
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
        </aside>

        <main ref={mainScrollRef} className="cursor-editor flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto scroll-smooth">
          <section id="scanner" className="cursor-composer shrink-0">
            {!scannerExpanded && result && !loading ? (
              <>
                <div className="flex flex-wrap items-center gap-2 border-b border-[var(--cursor-border)] px-3 py-2.5 sm:px-4">
                  <span className="text-xs font-semibold text-[var(--cursor-fg)]">{terminalLabels.scanner}</span>
                  <label className="min-w-[10rem] flex-1">
                    <span className="sr-only">{copy.industry}</span>
                    <input
                      type="text"
                      value={industry}
                      onChange={(event) => setIndustry(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !loading) void handleRunAnalysis();
                      }}
                      className="terminal-input w-full px-2.5 py-1.5 text-xs"
                      placeholder={copy.industryPlaceholder}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => void handleRunAnalysis()}
                    disabled={loading}
                    className="cursor-btn-primary shrink-0 px-3 py-1.5 text-xs disabled:opacity-60"
                  >
                    {copy.runAnalysis}
                  </button>
                  <button
                    type="button"
                    onClick={() => setScannerExpanded(true)}
                    className="cursor-btn-ghost shrink-0 px-2.5 py-1.5 text-xs"
                  >
                    {locale === "zh" ? "展开研究台" : "Expand desk"}
                  </button>
                </div>
                <div className="status-grid grid grid-cols-2 border-b border-[var(--cursor-border)] sm:grid-cols-4">
                  {[
                    [terminalLabels.marketStatus, result ? terminalLabels.verified : terminalLabels.waiting, result ? "terminal-green" : "text-[var(--cursor-fg-muted)]"],
                    [terminalLabels.bitgetStatus, result?.backtest.status === "verified" ? terminalLabels.live : terminalLabels.waiting, result?.backtest.status === "verified" ? "terminal-green" : "text-[var(--cursor-fg-muted)]"],
                    [terminalLabels.decisionStatus, result ? simulatedActionLabel(result.event_intelligence.simulated_decision.action, copy) : terminalLabels.waiting, result ? "terminal-amber" : "text-[var(--cursor-fg-muted)]"],
                    [terminalLabels.confidence, result ? `${result.confidence}/100` : "—", result ? "text-[var(--cursor-fg)]" : "text-[var(--cursor-fg-muted)]"],
                  ].map(([label, value, valueClass]) => (
                    <div key={label} className="status-cell border-r border-[var(--cursor-border)] px-3 py-2 last:border-r-0">
                      <p className="text-[10px] uppercase tracking-wide text-[var(--cursor-fg-subtle)]">{label}</p>
                      <p className={`mt-0.5 font-mono text-xs font-medium ${valueClass}`}>{value}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
            <div className="scanner-hero p-4 sm:p-5">
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--cursor-fg-muted)]">
                        Research → Verify → Execute
                      </p>
                      <h1 className="mt-1 text-lg font-semibold tracking-tight text-[var(--cursor-fg)]">
                        {terminalLabels.scanner}
                      </h1>
                      <p className="mt-1 max-w-2xl text-xs leading-5 text-[var(--cursor-fg-muted)]">{terminalLabels.scannerHint}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex rounded-md border border-[var(--cursor-border)] bg-[var(--cursor-panel)] p-0.5 text-[10px] font-medium">
                        <span className="rounded px-2.5 py-1 text-[var(--cursor-accent)]">{terminalLabels.paperMode}</span>
                        <span className="px-2.5 py-1 text-[var(--cursor-fg-subtle)]">{terminalLabels.liveLocked}</span>
                      </div>
                      {result && !loading ? (
                        <button
                          type="button"
                          onClick={() => setScannerExpanded(false)}
                          className="cursor-btn-ghost px-2.5 py-1 text-[11px]"
                        >
                          {locale === "zh" ? "收起研究台" : "Collapse desk"}
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
                    <label className="block flex-1">
                      <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-wide text-[var(--cursor-fg-muted)]">
                        {copy.industry}
                      </span>
                      <div className="cursor-composer-input-wrap">
                        <input
                          type="text"
                          value={industry}
                          onChange={(event) => setIndustry(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && !loading) void handleRunAnalysis();
                          }}
                          className="terminal-input w-full border-0 bg-transparent px-3 py-2.5 text-sm outline-none"
                          placeholder={copy.industryPlaceholder}
                        />
                      </div>
                    </label>
                    <button
                      type="button"
                      onClick={() => void handleRunAnalysis()}
                      disabled={loading}
                      className="cursor-btn-primary shrink-0 px-5 py-2.5 text-sm disabled:opacity-60"
                    >
                      {loading ? copy.running : copy.runAnalysis}
                    </button>
                  </div>
                  {loading ? (
                    <div className="mt-3 rounded-lg border border-[var(--cursor-border)] bg-[var(--cursor-sidebar)] px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
                        {terminalLabels.loadingPipeline}
                      </p>
                      <p className="mt-1 text-sm text-emerald-300">{analysisSteps[loadingStep]}</p>
                      <div className="mt-2 h-1 overflow-hidden rounded bg-[var(--cursor-selection)]">
                        <div
                          className="h-full bg-emerald-400 transition-all duration-500"
                          style={{
                            width: `${Math.round(((loadingStep + 1) / analysisSteps.length) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void handleRunAnalysis("AI chips")}
                      disabled={loading}
                      className="rounded-md border border-emerald-400/35 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-300 transition hover:bg-emerald-400/15 disabled:opacity-60"
                    >
                      {terminalLabels.demoRunAiChips}
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
                        className={`rounded-md border px-2.5 py-1.5 text-[11px] transition ${
                          industry === item.value
                            ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                            : "border-[var(--cursor-border)] bg-[var(--cursor-sidebar)] text-zinc-500 hover:text-zinc-200"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-6">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">{terminalLabels.workflow}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
                      {[terminalLabels.workflowResearch, terminalLabels.workflowMap, terminalLabels.workflowVerify, terminalLabels.workflowSimulate].map((label, index) => (
                        <div key={label} className="workflow-step rounded-lg border border-[var(--cursor-border)] bg-[var(--cursor-panel)] p-3">
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10 font-mono text-[9px] text-emerald-300">0{index + 1}</span>
                            <span className="text-xs font-medium text-zinc-300">{label}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <aside className="execution-card rounded-xl border border-[var(--cursor-border-strong)] bg-[var(--cursor-sidebar)] p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{terminalLabels.executionConsole}</p>
                      <p className="mt-1 text-xs leading-5 text-zinc-500">{terminalLabels.executionHint}</p>
                    </div>
                    <span className="relative mt-1 flex h-2 w-2 shrink-0">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                    </span>
                  </div>
                  <div className="mt-5 space-y-1 rounded-lg border border-[var(--cursor-border)] bg-[var(--cursor-panel)] p-1">
                    <div className="flex items-center justify-between rounded-md px-3 py-2.5 text-xs">
                      <span className="text-zinc-500">{terminalLabels.publicMarket}</span>
                      <span className="font-mono font-semibold text-emerald-300">LIVE</span>
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
                  {result && selectedTradeTickers.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => void handlePaperExecute()}
                      disabled={paperSubmitting}
                      className="mt-4 w-full rounded-lg bg-emerald-400 px-3 py-2.5 text-xs font-bold text-[#03130d] transition hover:brightness-110 disabled:opacity-60"
                    >
                      {paperSubmitting
                        ? terminalLabels.executingPaper
                        : terminalLabels.executePaperBasket}
                    </button>
                  ) : null}
                  <button type="button" onClick={() => setShowBitgetSetup(true)} className="mt-3 w-full rounded-lg border border-emerald-400/35 bg-emerald-400/10 px-3 py-2.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/15">
                    {terminalLabels.configureConnection}
                  </button>
                  {paperMessage ? (
                    <p className="mt-3 text-xs leading-5 text-emerald-200/90">{paperMessage}</p>
                  ) : null}
                  <p className="mt-3 text-center text-[10px] leading-4 text-zinc-600">{terminalLabels.permissionValue}</p>
                </aside>
              </div>
            </div>

            <div className="status-grid grid grid-cols-2 border-t border-[var(--cursor-border)] sm:grid-cols-4">
              {[
                [terminalLabels.marketStatus, result ? terminalLabels.verified : terminalLabels.waiting, result ? "terminal-green" : "text-[var(--cursor-fg-muted)]"],
                [terminalLabels.bitgetStatus, result?.backtest.status === "verified" ? terminalLabels.live : terminalLabels.waiting, result?.backtest.status === "verified" ? "terminal-green" : "text-[var(--cursor-fg-muted)]"],
                [terminalLabels.decisionStatus, result ? simulatedActionLabel(result.event_intelligence.simulated_decision.action, copy) : terminalLabels.waiting, result ? "terminal-amber" : "text-[var(--cursor-fg-muted)]"],
                [terminalLabels.confidence, result ? `${result.confidence}/100` : "—", result ? "text-[var(--cursor-fg)]" : "text-[var(--cursor-fg-muted)]"],
              ].map(([label, value, valueClass]) => (
                <div key={label} className="status-cell border-r border-[var(--cursor-border)] px-4 py-3 last:border-r-0">
                  <p className="text-[10px] uppercase tracking-wide text-[var(--cursor-fg-subtle)]">{label}</p>
                  <p className={`mt-0.5 font-mono text-sm font-medium ${valueClass}`}>{value}</p>
                </div>
              ))}
            </div>
              </>
            )}
          </section>

          <div className="px-3 py-4 pb-10 sm:px-5">
        {error ? (
          <p className="m-4 rounded border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>
        ) : null}

        {!result && !loading && !error ? (
          <div className="empty-workspace m-4 rounded-xl border border-dashed border-[var(--cursor-border-strong)] px-5 py-10 text-center sm:m-5">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-400/25 bg-emerald-400/10 font-mono text-xs font-bold text-emerald-300">TS</div>
            <h2 className="mt-4 text-base font-semibold text-white">{terminalLabels.emptyTitle}</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-zinc-500">{terminalLabels.emptyHint}</p>
            <div className="mx-auto mt-5 flex flex-wrap items-center justify-center gap-2">
              <a
                href="https://throatscan-oracle.vercel.app"
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-sky-400/35 bg-sky-400/10 px-3 py-2 text-xs font-semibold text-sky-300"
              >
                {copy.tryPublicDemo}
              </a>
              <a
                href="/sample-evidence-ai-chips.json"
                className="rounded-md border border-[var(--cursor-border)] bg-[var(--cursor-sidebar)] px-3 py-2 text-xs font-semibold text-zinc-300"
              >
                {copy.sampleEvidence}
              </a>
              <button
                type="button"
                onClick={() => void handleRunAnalysis("AI chips")}
                className="rounded-md border border-emerald-400/35 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-300"
              >
                {terminalLabels.demoRunAiChips}
              </button>
            </div>
          </div>
        ) : null}

        {result && baseResult ? (
          <div className="terminal-content space-y-5 p-3 sm:p-4 lg:p-5">
            {locale === "zh" && baseResult ? (
              <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                {copy.engineFootnote}
              </p>
            ) : null}
            <section id="decision-overview" className="scroll-mt-4 rounded-lg border border-emerald-400/25 bg-[var(--cursor-panel)] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">{terminalLabels.simpleTitle}</h2>
                  <p className="mt-1 text-xs text-zinc-400">{terminalLabels.simpleSubtitle}</p>
                </div>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                  {terminalLabels.judgePitch}
                </span>
              </div>
              <div
                className={`mt-4 rounded-lg border px-4 py-3 ${universeCoverageStyles(result.universe_coverage.level)}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">
                      {copy.universeCoverage}
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      {universeCoverageLabel(result.universe_coverage.level, copy)} ·{" "}
                      {result.universe_coverage.matched_count}/{result.universe_coverage.universe_size}{" "}
                      {locale === "zh" ? "匹配" : "matched"} ·{" "}
                      {locale === "zh" ? "对齐" : "alignment"}{" "}
                      {result.universe_coverage.avg_query_alignment}/100
                    </p>
                    <p className="mt-2 text-xs leading-5 opacity-90">
                      {locale === "zh"
                        ? result.universe_coverage.summary_zh
                        : result.universe_coverage.summary_en}
                    </p>
                    <p className="mt-1 text-xs opacity-75">{copy.universeCoverageHint}</p>
                  </div>
                  {result.universe_coverage.level !== "full" ? (
                    <div className="min-w-[12rem] rounded-md border border-white/10 bg-black/20 px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] opacity-70">
                        {copy.recommendedDemoInputs}
                      </p>
                      <p className="mt-1 text-xs leading-5">
                        {result.universe_coverage.recommended_demo_inputs.slice(0, 4).join(" · ")}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
              {result.interpretation.gics ? (
                <div className="mt-4 rounded-lg border border-[var(--cursor-border)] bg-[var(--cursor-sidebar)] px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--cursor-fg-muted)]">
                        {copy.gicsClassification}
                      </p>
                      <p className="mt-1 text-sm font-medium leading-6">
                        {formatGicsPath(result.interpretation.gics.classification, locale === "zh" ? "zh" : "en")}
                      </p>
                      <p className="mt-1 text-xs text-[var(--cursor-fg-muted)]">{copy.gicsHint}</p>
                    </div>
                    <span className="rounded-full border border-[var(--cursor-accent)]/25 bg-[var(--cursor-accent-dim)] px-2.5 py-1 text-[10px] font-semibold text-[var(--cursor-accent)]">
                      {gicsMappingKindLabel(result.interpretation.gics.mapping_kind, copy)}
                    </span>
                  </div>
                  <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      [copy.gicsSector, locale === "zh" ? result.interpretation.gics.classification.sector_zh : result.interpretation.gics.classification.sector],
                      [copy.gicsIndustryGroup, locale === "zh" ? result.interpretation.gics.classification.industry_group_zh : result.interpretation.gics.classification.industry_group],
                      [copy.gicsIndustry, locale === "zh" ? result.interpretation.gics.classification.industry_zh : result.interpretation.gics.classification.industry],
                      [copy.gicsSubIndustry, locale === "zh" ? result.interpretation.gics.classification.sub_industry_zh : result.interpretation.gics.classification.sub_industry],
                    ].map(([label, value]) =>
                      value ? (
                        <div key={label} className="rounded-md border border-[var(--cursor-border)] px-2.5 py-2">
                          <dt className="text-[10px] uppercase tracking-wide text-[var(--cursor-fg-subtle)]">{label}</dt>
                          <dd className="mt-0.5 font-medium">{value}</dd>
                        </div>
                      ) : null,
                    )}
                  </dl>
                  <p className="mt-3 text-xs leading-5 text-[var(--cursor-fg-muted)]">
                    <span className="font-semibold">{copy.gicsThemeNote}: </span>
                    {locale === "zh" ? result.interpretation.gics.notes_zh : result.interpretation.gics.notes_en}
                  </p>
                </div>
              ) : null}
              <div className="mt-4 grid gap-3 lg:grid-cols-4">
                <div className="rounded-lg border border-[var(--cursor-border)] bg-[var(--cursor-sidebar)] p-4">
                  <p className="text-xs font-semibold text-zinc-500">{terminalLabels.plainConclusion}</p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {result.final_decision.final_result_card.core_bottleneck}
                  </p>
                  <p className="mt-2 text-sm text-zinc-300">
                    {stanceLabel(result.final_decision.final_result_card.investment_stance, copy)} ·{" "}
                    {result.final_decision.final_result_card.confidence}
                  </p>
                </div>
                <div className="rounded-lg border border-[var(--cursor-border)] bg-[var(--cursor-sidebar)] p-4">
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
                <div className="rounded-lg border border-[var(--cursor-border)] bg-[var(--cursor-sidebar)] p-4">
                  <p className="text-xs font-semibold text-zinc-500">{terminalLabels.plainReason}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-200">
                    {result.final_decision.final_result_card.reason}
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">{terminalLabels.proxyNote}</p>
                </div>
                <div className="rounded-lg border border-[var(--cursor-border)] bg-[var(--cursor-sidebar)] p-4">
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
              <div className="mt-4 rounded-lg border border-[var(--cursor-border)] bg-[var(--cursor-sidebar)] p-4">
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
                {selectedTradeTickers.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => void handlePaperExecute()}
                    disabled={paperSubmitting}
                    className="mt-4 rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-bold text-[#03130d] transition hover:brightness-110 disabled:opacity-60"
                  >
                    {paperSubmitting
                      ? terminalLabels.executingPaper
                      : terminalLabels.executePaperBasket}
                  </button>
                ) : null}
                {paperMessage ? (
                  <p className="mt-3 text-xs leading-5 text-emerald-300">{paperMessage}</p>
                ) : null}
              </div>

              <section
                id="agent-workflow"
                className="mt-4 scroll-mt-4 rounded-lg border border-[var(--cursor-border)] bg-[var(--cursor-panel)] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold">{copy.agentWorkflow}</h3>
                    <p className="mt-1 text-xs text-[var(--cursor-fg-muted)]">{copy.agentWorkflowHint}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.completeness.novelty.mcp_tools_used.map((tool) => (
                      <span
                        key={tool}
                        className="rounded-full border border-[var(--cursor-accent)]/25 bg-[var(--cursor-accent-dim)] px-2 py-0.5 font-mono text-[10px] text-[var(--cursor-accent)]"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 rounded-lg border border-[var(--cursor-border)] bg-[var(--cursor-sidebar)] p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--cursor-fg-subtle)]">
                    {copy.whyAgentOnly}
                  </p>
                  <p className="mt-2 text-sm leading-6">
                    {locale === "zh"
                      ? result.completeness.novelty.why_agent_only_zh
                      : result.completeness.novelty.why_agent_only_en}
                  </p>
                  <ul className="mt-3 space-y-1 text-xs text-[var(--cursor-fg-muted)]">
                    {(locale === "zh"
                      ? result.completeness.novelty.vs_traditional_screener_zh
                      : result.completeness.novelty.vs_traditional_screener_en
                    ).map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>

                <ol className="mt-4 space-y-2">
                  {result.completeness.novelty.agent_workflow.map((step, index) => (
                    <li
                      key={step.id}
                      className="rounded-lg border border-[var(--cursor-border)] bg-[var(--cursor-sidebar)] p-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[10px] font-mono text-[var(--cursor-fg-subtle)]">
                            {copy.workflowStep} {String(index + 1).padStart(2, "0")}
                          </p>
                          <p className="mt-0.5 text-sm font-semibold">
                            {locale === "zh" ? step.agent_zh : step.agent_en}
                          </p>
                          <p className="mt-1 font-mono text-[10px] text-[var(--cursor-accent)]">
                            {step.skill}
                          </p>
                        </div>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                            step.status === "complete"
                              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-600"
                              : step.status === "partial"
                                ? "border-amber-400/30 bg-amber-400/10 text-amber-700"
                                : "border-zinc-400/30 bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {step.status === "complete"
                            ? copy.stageComplete
                            : step.status === "partial"
                              ? copy.stagePartial
                              : copy.stageSkipped}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-[var(--cursor-fg-muted)]">
                        {locale === "zh" ? step.detail_zh : step.detail_en}
                      </p>
                      {step.tools_used.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {step.tools_used.map((tool) => (
                            <span
                              key={`${step.id}-${tool}`}
                              className="rounded border border-[var(--cursor-border)] px-1.5 py-0.5 font-mono text-[9px] text-[var(--cursor-fg-subtle)]"
                            >
                              {tool}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {step.fetched_at ? (
                        <p className="mt-2 text-[10px] text-[var(--cursor-fg-subtle)]">
                          {copy.fetchedAt}: {step.fetched_at}
                          {step.source_url ? (
                            <>
                              {" · "}
                              <a
                                href={step.source_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[var(--cursor-accent)] underline"
                              >
                                MCP
                              </a>
                            </>
                          ) : null}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ol>

                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <div className="rounded-lg border border-[var(--cursor-border)] p-3">
                    <p className="text-xs font-semibold">{copy.hardConstraints}</p>
                    <ul className="mt-2 space-y-2">
                      {result.completeness.novelty.hard_constraints.map((rule) => (
                        <li key={rule.id} className="text-xs">
                          <p className="font-medium">
                            {locale === "zh" ? rule.label_zh : rule.label_en}
                          </p>
                          <p className="mt-0.5 text-[var(--cursor-fg-muted)]">
                            {locale === "zh" ? rule.enforced_zh : rule.enforced_en}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-lg border border-[var(--cursor-border)] p-3">
                    <p className="text-xs font-semibold">{copy.rebalanceAgent}</p>
                    <p className="mt-1 font-mono text-[10px] text-[var(--cursor-fg-subtle)]">
                      {result.completeness.novelty.rebalance_agent.agent_id}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-[var(--cursor-fg-muted)]">
                      {locale === "zh"
                        ? result.completeness.novelty.rebalance_agent.policy_zh
                        : result.completeness.novelty.rebalance_agent.policy_en}
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-[var(--cursor-fg-muted)]">
                      {(locale === "zh"
                        ? result.completeness.novelty.rebalance_agent.triggers_zh
                        : result.completeness.novelty.rebalance_agent.triggers_en
                      ).map((trigger) => (
                        <li key={trigger}>• {trigger}</li>
                      ))}
                    </ul>
                    <p className="mt-3 text-xs font-medium">
                      {locale === "zh"
                        ? result.completeness.novelty.rebalance_agent.next_action_zh
                        : result.completeness.novelty.rebalance_agent.next_action_en}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-semibold">{copy.growthRoadmap}</p>
                  <div className="mt-3 grid gap-3 lg:grid-cols-3">
                    {result.completeness.novelty.growth_roadmap.map((phase) => (
                      <div
                        key={phase.phase}
                        className="rounded-lg border border-[var(--cursor-border)] bg-[var(--cursor-sidebar)] p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold">
                            Phase {phase.phase}
                          </p>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              phase.status === "live"
                                ? "bg-emerald-400/10 text-emerald-700"
                                : phase.status === "partial"
                                  ? "bg-amber-400/10 text-amber-700"
                                  : "bg-zinc-200 text-zinc-600"
                            }`}
                          >
                            {phase.status === "live"
                              ? copy.phaseLive
                              : phase.status === "partial"
                                ? copy.phasePartial
                                : copy.phasePlanned}
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-medium">
                          {locale === "zh" ? phase.title_zh : phase.title_en}
                        </p>
                        <ul className="mt-2 space-y-1 text-[11px] leading-5 text-[var(--cursor-fg-muted)]">
                          {(locale === "zh" ? phase.items_zh : phase.items_en).map((item) => (
                            <li key={item}>• {item}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {result.completeness.github_repo_url ? (
                  <p className="mt-4 text-xs text-[var(--cursor-fg-muted)]">
                    GitHub:{" "}
                    <a
                      href={result.completeness.github_repo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--cursor-accent)] underline"
                    >
                      {result.completeness.github_repo_url}
                    </a>
                  </p>
                ) : null}
              </section>

              <section className="mt-4 rounded-lg border border-[var(--cursor-border)] bg-[var(--cursor-sidebar)] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white">{copy.judgeSelfAssessment}</h3>
                    <p className="mt-1 text-xs text-zinc-500">{copy.judgeSelfAssessmentHint}</p>
                  </div>
                  <a
                    href={result.completeness.public_demo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-sky-400/30 bg-sky-400/10 px-2.5 py-1 text-xs font-semibold text-sky-300"
                  >
                    {copy.publicDemo}
                  </a>
                </div>
                <p className="mt-3 text-sm leading-6 text-zinc-300">
                  {locale === "zh"
                    ? result.completeness.honest_summary_zh
                    : result.completeness.honest_summary_en}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {result.completeness.end_to_end_stages.map((pipeStage) => (
                    <span
                      key={pipeStage.id}
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                        pipeStage.status === "complete"
                          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                          : pipeStage.status === "partial"
                            ? "border-amber-400/30 bg-amber-400/10 text-amber-300"
                            : "border-zinc-600 bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {locale === "zh" ? pipeStage.label_zh : pipeStage.label_en}
                    </span>
                  ))}
                </div>
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  {result.completeness.judge_self_assessment.map((row) => (
                    <div
                      key={row.id}
                      className="rounded-lg border border-[var(--cursor-border)] bg-[var(--cursor-sidebar)] p-4"
                    >
                      <p className="text-sm font-semibold text-white">
                        {locale === "zh" ? row.title_zh : row.title_en}
                      </p>
                      <p className="mt-1 text-xs text-violet-300">
                        {locale === "zh" ? row.rating_zh : row.rating_en}
                      </p>
                      <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                        {copy.achieved}
                      </p>
                      <ul className="mt-1 space-y-1 text-xs leading-5 text-zinc-400">
                        {(locale === "zh" ? row.achieved_zh : row.achieved_en).map((item) => (
                          <li key={item}>- {item}</li>
                        ))}
                      </ul>
                      <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                        {copy.gaps}
                      </p>
                      <ul className="mt-1 space-y-1 text-xs leading-5 text-zinc-500">
                        {(locale === "zh" ? row.gaps_zh : row.gaps_en).map((item) => (
                          <li key={item}>- {item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>

              <EquityTradabilityPanel result={result} locale={locale} />
            </section>

            <section id="industry-map" className="scroll-mt-4 rounded-lg border border-[var(--cursor-border)] bg-[var(--cursor-panel)] p-4">
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
                  <div className="rounded-lg border border-[var(--cursor-border)] bg-[var(--cursor-sidebar)] px-3 py-2">
                    <p className="text-zinc-500">{terminalLabels.publicCompanies}</p>
                    <p className="mt-1 text-base font-semibold text-white">
                      {industryMapCompanies.length}
                    </p>
                  </div>
                  <div className="rounded-lg border border-[var(--cursor-border)] bg-[var(--cursor-sidebar)] px-3 py-2">
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
                    className="rounded-lg border border-[var(--cursor-border)] bg-[var(--cursor-sidebar)] p-4"
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
                      <span className="rounded-full border border-[var(--cursor-border-strong)] px-2 py-0.5 text-xs text-zinc-400">
                        {layer.companies.length} / {layer.bitget_online_count}
                      </span>
                    </div>
                    <ul className="mt-3 space-y-2">
                      {layer.companies.length === 0 ? (
                        <li className="rounded-lg border border-dashed border-[var(--cursor-border)] p-3 text-xs text-zinc-500">
                          {terminalLabels.noMappedCompanies}
                        </li>
                      ) : (
                        layer.companies.map((company) => {
                          const englishCompanyName = baseIndustryCompanyByTicker.get(company.ticker);
                          return (
                          <li
                            key={company.ticker}
                            className="rounded-lg border border-[var(--cursor-border)] bg-[var(--cursor-sidebar)] p-3"
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
                                    className="rounded-full bg-[var(--cursor-selection)] px-2 py-0.5 text-[11px] text-zinc-300"
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

              <div className="mt-4 overflow-x-auto rounded-lg border border-[var(--cursor-border)] bg-[var(--cursor-sidebar)]">
                <div className="border-b border-[var(--cursor-border)] px-3 py-2">
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
                      <tr key={company.ticker} className="border-t border-[var(--cursor-border)]">
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

            <section className="rounded-lg border border-violet-400/25 bg-[var(--cursor-panel)] p-4">
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
                <div className="rounded-lg border border-[var(--cursor-border)] bg-[var(--cursor-sidebar)] p-4">
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
                <div className="rounded-lg border border-[var(--cursor-border)] bg-[var(--cursor-sidebar)] p-4">
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
                <div className="rounded-lg border border-[var(--cursor-border)] bg-[var(--cursor-sidebar)] p-4">
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
                <div className="rounded-lg border border-[var(--cursor-border)] bg-[var(--cursor-sidebar)] p-4">
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
                <div className="rounded-lg border border-[var(--cursor-border)] bg-[var(--cursor-sidebar)] p-4">
                  <h3 className="text-sm font-semibold text-white">
                    {terminalLabels.scarceLayerRanking}
                  </h3>
                  <ol className="mt-3 space-y-2">
                    {result.thesis_audit.layer_priorities.map((layer, index) => (
                      <li
                        key={layer.stage}
                        className="rounded-lg border border-[var(--cursor-border)] bg-[var(--cursor-sidebar)] p-3 text-sm"
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

                <div className="rounded-lg border border-[var(--cursor-border)] bg-[var(--cursor-sidebar)] p-4">
                  <h3 className="text-sm font-semibold text-white">
                    {terminalLabels.candidateCrossCheck}
                  </h3>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    {result.thesis_audit.candidate_reviews.slice(0, 6).map((review) => (
                      <div
                        key={review.ticker}
                        className="rounded-lg border border-[var(--cursor-border)] bg-[var(--cursor-sidebar)] p-3"
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
                        {review.primary_evidence.length > 0 ? (
                          <ul className="mt-2 space-y-1">
                            {review.primary_evidence.slice(0, 2).map((link) => (
                              <li key={`${review.ticker}-${link.url}`}>
                                <a
                                  href={link.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-sky-300 underline decoration-sky-700 underline-offset-2 hover:text-sky-200"
                                >
                                  {locale === "zh" ? link.label_zh : link.label_en}
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <div className="rounded-lg border border-[var(--cursor-border)] bg-[var(--cursor-sidebar)] p-4">
                  <h3 className="text-sm font-semibold text-white">
                    {copy.primaryEvidence}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500">{copy.primaryEvidenceHint}</p>
                  <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto text-xs leading-5 text-zinc-400">
                    {result.thesis_audit.primary_evidence.slice(0, 8).map((link) => (
                      <li key={`${link.ticker}-${link.url}`}>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-sky-300 underline decoration-sky-700 underline-offset-2 hover:text-sky-200"
                        >
                          {link.ticker} · {locale === "zh" ? link.label_zh : link.label_en}
                        </a>
                        <p className="mt-0.5 text-zinc-500">
                          {locale === "zh" ? link.check_hint_zh : link.check_hint_en}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg border border-[var(--cursor-border)] bg-[var(--cursor-sidebar)] p-4">
                  <h3 className="text-sm font-semibold text-white">
                    {terminalLabels.nextChecks}
                  </h3>
                  <ul className="mt-2 space-y-2 text-xs leading-5 text-zinc-400">
                    {result.thesis_audit.next_checks.map((check, index) => (
                      <li key={`${check.text_en}-${index}`}>
                        <p>
                          {locale === "zh" ? check.text_zh : check.text_en}
                        </p>
                        {check.url ? (
                          <a
                            href={check.url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-block text-sky-300 underline decoration-sky-700 underline-offset-2 hover:text-sky-200"
                          >
                            {locale === "zh"
                              ? check.url_label_zh ?? copy.openPrimarySource
                              : check.url_label_en ?? copy.openPrimarySource}
                          </a>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-1">
                <div className="rounded-lg border border-[var(--cursor-border)] bg-[var(--cursor-sidebar)] p-4">
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

            <details
              id="professional-analysis"
              open={evidenceOpen}
              onToggle={(event) => setEvidenceOpen(event.currentTarget.open)}
              className="scroll-mt-4 rounded-lg border border-[var(--cursor-border)] bg-[var(--cursor-panel)] p-4"
            >
              <summary className="cursor-pointer list-none">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-white">{terminalLabels.advancedTitle}</h2>
                    <p className="mt-1 text-xs text-zinc-400">{terminalLabels.advancedHint}</p>
                  </div>
                  <span className="rounded-full border border-[var(--cursor-border-strong)] px-3 py-1 text-xs font-semibold text-zinc-300">
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
                      {selectedTradeTickers.length > 0
                        ? `${copy.tierAExecutable}: ${selectedTradeTickers.join(", ")}`
                        : appHandoffTickers.length > 0
                          ? `${copy.tierBAppHandoff}: ${appHandoffTickers.join(", ")}`
                          : "—"}
                    </p>
                    {selectedTradeTickers.length > 0 && appHandoffTickers.length > 0 ? (
                      <p className="mt-1 font-mono text-xs text-orange-900/80 dark:text-orange-100/80">
                        {copy.tierBAppHandoff}: {appHandoffTickers.join(", ")}
                      </p>
                    ) : null}
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
              {result.interpretation.research_sources?.length ? (
                <div className="mt-3 border-t border-[var(--cursor-border)] pt-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-zinc-200">
                        {result.interpretation.grounding_mode === "curated_rules"
                          ? copy.rulesGroundingSources
                          : result.interpretation.grounding_mode === "live_web_search"
                            ? copy.liveWebGroundingSources
                            : copy.llmWebSources}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {result.interpretation.grounding_mode === "curated_rules"
                          ? copy.rulesGroundingDescription
                          : copy.llmWebSourcesDescription}
                      </p>
                    </div>
                    <span className="rounded border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 font-mono text-[10px] text-emerald-300">
                      {result.interpretation.research_sources.length} URLs
                    </span>
                  </div>
                  {result.interpretation.research_queries?.length ? (
                    <p className="mt-2 text-xs text-zinc-500">
                      <span className="font-medium text-zinc-400">{copy.llmSearchQueries}:</span>{" "}
                      {result.interpretation.research_queries.join(" · ")}
                    </p>
                  ) : null}
                  <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto pr-1 text-xs">
                    {result.interpretation.research_sources.map((source) => (
                      <li key={source.url} className="flex min-w-0 items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="min-w-0 break-all text-sky-300 underline decoration-sky-700 underline-offset-2 hover:text-sky-200"
                        >
                          {source.title || source.url}
                        </a>
                        {source.cited ? (
                          <span className="shrink-0 font-mono text-[10px] text-emerald-400">
                            {copy.citedSource}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
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
                          <EquityTierBadge
                            tier={company.bitget_equity?.execution_tier ?? "C"}
                            locale={locale}
                            symbol={
                              company.bitget_equity?.execution_instrument?.symbol ??
                              company.bitget_market?.symbol
                            }
                          />
                        </div>
                        <p className="mt-1 text-zinc-600 dark:text-zinc-300">{company.name}</p>
                        {locale === "zh" && baseCompany?.name ? (
                          <p className="mt-1 text-xs text-zinc-500">
                            {terminalLabels.englishFullName}: {baseCompany.name}
                          </p>
                        ) : null}
                        {company.gics ? (
                          <p className="mt-1 text-xs text-zinc-500">
                            {copy.gicsCompanyLabel}:{" "}
                            {formatGicsPath(company.gics, locale === "zh" ? "zh" : "en")}
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
          </div>
        </main>
      </div>

      <footer className="cursor-statusbar shrink-0">
        <span className="cursor-statusbar-item">{terminalLabels.publicDataConnected}</span>
        <span className="cursor-statusbar-item hidden sm:inline">
          VIX {formatResearchValue(result?.market_research.macro.market_prices.vix?.value)}
        </span>
        <span className="cursor-statusbar-item hidden md:inline">
          US10Y {formatResearchValue(result?.market_research.macro.rates.t10y?.value, "%")}
        </span>
        <span className="cursor-statusbar-item hidden lg:inline">
          {terminalLabels.regime}{" "}
          {result
            ? macroVerdictLabel(result.market_research.macro.verdict, copy)
            : terminalLabels.waitingRegime}
        </span>
        <span className="ml-auto cursor-statusbar-item">
          {paperStatus?.demo_configured ? "Bitget Demo" : paperStatus?.mode === "local_paper" ? "Local Paper" : terminalLabels.paperMode}
        </span>
      </footer>

      {showBitgetSetup ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm" role="presentation">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="bitget-setup-title"
            className="connection-dialog w-full max-w-lg rounded-2xl border border-[var(--cursor-border-strong)] bg-[var(--cursor-panel)] p-5 shadow-2xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Server-side connection
                </div>
                <h2 id="bitget-setup-title" className="text-xl font-semibold text-white">{terminalLabels.setupTitle}</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{terminalLabels.setupSubtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowBitgetSetup(false)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--cursor-border-strong)] text-lg text-zinc-500 transition hover:text-white"
                aria-label={terminalLabels.close}
              >
                ×
              </button>
            </div>

            <div className="mt-5 rounded-xl border border-[var(--cursor-border)] bg-[var(--cursor-sidebar)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-zinc-500">{terminalLabels.permissions}</span>
                <span className="font-semibold text-emerald-300">{terminalLabels.permissionValue}</span>
              </div>
              <ol className="mt-4 space-y-3">
                {[terminalLabels.setupStepOne, terminalLabels.setupStepTwo, terminalLabels.setupStepThree].map((step, index) => (
                  <li key={step} className="flex gap-3 text-sm leading-5 text-zinc-300">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--cursor-border-strong)] bg-[var(--cursor-selection)] font-mono text-[10px] text-emerald-300">{index + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-4 flex gap-3 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-xs leading-5 text-amber-200/80">
              <span className="font-bold text-amber-300">!</span>
              <p>{terminalLabels.secretWarning}</p>
            </div>

            <div className="mt-4 rounded-xl border border-[var(--cursor-border)] bg-[var(--cursor-sidebar)] p-4 text-xs leading-5 text-zinc-400">
              <p className="font-semibold text-zinc-200">
                {locale === "zh" ? "纸交易层级（无需密钥也可用）" : "Paper trading tiers (no key required for tier 1)"}
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-4">
                <li>
                  {locale === "zh"
                    ? "Tier 1：本地纸交易 — 使用 Bitget 公开价格记录模拟成交（默认启用）"
                    : "Tier 1: Local paper — records fills at live Bitget public prices (enabled by default)"}
                </li>
                <li>
                  {locale === "zh"
                    ? "Tier 2：Bitget Demo API — 配置 BITGET_DEMO_* 后提交 demo 市价单（paptrading=1）"
                    : "Tier 2: Bitget Demo API — set BITGET_DEMO_* env vars to submit demo market orders (paptrading=1)"}
                </li>
              </ul>
              {paperStatus ? (
                <p className="mt-3 text-zinc-500">
                  {locale === "zh" ? paperStatus.message_zh : paperStatus.message_en}
                </p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => void refreshPaperStatus()}
              className="mt-4 w-full rounded-lg border border-[var(--cursor-border-strong)] bg-[var(--cursor-selection)] px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:border-emerald-400/40 hover:text-emerald-300"
            >
              {terminalLabels.testPaperConnection}
            </button>
            <button type="button" onClick={() => setShowBitgetSetup(false)} className="mt-3 w-full rounded-lg bg-emerald-400 px-4 py-3 text-sm font-bold text-[#03130d] transition hover:brightness-110">
              {terminalLabels.close}
            </button>
          </section>
        </div>
      ) : null}
    </div>
  );
}
