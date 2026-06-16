import type { IndustryProfile } from "./mockData";
import type { MacroVerdict, MarketResearch, NewsEvidence } from "./marketResearch";
import { clampScore, type Company, type ThroatRole } from "./types";

export type SupplyChainEventType =
  | "SUPPLY_RESTRICTION"
  | "SUBSTITUTION"
  | "CAPACITY_EXPANSION"
  | "DEMAND_ACCELERATION"
  | "DEMAND_SLOWDOWN"
  | "REGULATORY_CHANGE"
  | "GEOPOLITICAL_DISRUPTION"
  | "OTHER";

export type BottleneckImpactDirection =
  | "STRENGTHENING"
  | "WEAKENING"
  | "SUPPORTIVE"
  | "NEGATIVE"
  | "NEUTRAL";

export type EventMagnitude = "HIGH" | "MEDIUM" | "LOW";
export type EventSignal = "POSITIVE" | "NEGATIVE" | "MIXED" | "NO_EVENT_EVIDENCE";
export type SimulatedDecisionAction = "SIMULATED_BUY" | "WATCH" | "AVOID";

export interface SupplyChainEvent {
  id: string;
  title: string;
  source: string;
  published?: string;
  link?: string;
  event_type: SupplyChainEventType;
  bottleneck_impact: BottleneckImpactDirection;
  magnitude: EventMagnitude;
  matched_keywords: string[];
  affected_tickers: string[];
  extracted_signal_en: string;
  extracted_signal_zh: string;
  impact_reason_en: string;
  impact_reason_zh: string;
}

export interface CompanyEventAdjustment {
  ticker: string;
  base_score: number;
  event_delta: number;
  macro_delta: number;
  confidence_delta: number;
  adjusted_score: number;
  evidence_count: number;
  event_signal: EventSignal;
  recommended_action: SimulatedDecisionAction;
  supporting_event_ids: string[];
  explanation_en: string;
  explanation_zh: string;
}

export interface DecisionTraceStep {
  id:
    | "industry_input"
    | "credible_news_search"
    | "supply_chain_event_extraction"
    | "bottleneck_impact_assessment"
    | "candidate_confidence_adjustment"
    | "explainable_simulated_trade_decision";
  label_en: string;
  label_zh: string;
  status: "complete" | "partial" | "unavailable";
  detail_en: string;
  detail_zh: string;
}

export interface EventDrivenDecision {
  action: SimulatedDecisionAction;
  selected_tickers: string[];
  rationale_en: string;
  rationale_zh: string;
}

export interface EventIntelligence {
  status: "verified" | "partial" | "unavailable";
  events: SupplyChainEvent[];
  company_adjustments: CompanyEventAdjustment[];
  macro_verdict: MacroVerdict;
  macro_overlay: number;
  decision_trace: DecisionTraceStep[];
  simulated_decision: EventDrivenDecision;
  disclosure_en: string;
  disclosure_zh: string;
  generated_at: string;
}

interface Rule {
  type: SupplyChainEventType;
  impact: BottleneckImpactDirection;
  magnitude: EventMagnitude;
  keywords: string[];
  signalEn: string;
  signalZh: string;
  reasonEn: string;
  reasonZh: string;
}

const RULES: Rule[] = [
  {
    type: "GEOPOLITICAL_DISRUPTION",
    impact: "STRENGTHENING",
    magnitude: "HIGH",
    keywords: ["sanction", "export control", "trade restriction", "geopolitical", "tariff"],
    signalEn: "Geopolitical or trade restrictions can tighten access to scarce inputs.",
    signalZh: "地缘政治或贸易限制可能收紧稀缺投入品的获取。",
    reasonEn: "Restricted access increases the value of incumbent supply-chain control.",
    reasonZh: "获取受限会提高现有供应链控制权的价值。",
  },
  {
    type: "SUPPLY_RESTRICTION",
    impact: "STRENGTHENING",
    magnitude: "HIGH",
    keywords: ["shortage", "supply constraint", "outage", "disruption", "delay", "scarcity"],
    signalEn: "The article indicates a supply restriction or disruption.",
    signalZh: "新闻显示供应受限或发生中断。",
    reasonEn: "Supply restrictions strengthen scarce upstream control but pressure downstream users.",
    reasonZh: "供应受限会强化稀缺上游的控制力，同时挤压下游使用者。",
  },
  {
    type: "SUBSTITUTION",
    impact: "WEAKENING",
    magnitude: "HIGH",
    keywords: ["substitute", "alternative", "replace", "diversify", "self-reliance", "competitor"],
    signalEn: "The article indicates substitution or diversification away from an incumbent.",
    signalZh: "新闻显示替代方案或降低对现有供应商依赖的多元化行动。",
    reasonEn: "Credible substitutes weaken the durability of the current bottleneck.",
    reasonZh: "可信替代方案会削弱当前瓶颈的持续性。",
  },
  {
    type: "CAPACITY_EXPANSION",
    impact: "WEAKENING",
    magnitude: "MEDIUM",
    keywords: ["capacity", "expansion", "new plant", "new fab", "factory", "investment"],
    signalEn: "The article indicates new capacity or supply-chain investment.",
    signalZh: "新闻显示新增产能或供应链投资。",
    reasonEn: "New capacity may ease scarcity over time while supporting equipment suppliers.",
    reasonZh: "新增产能可能逐步缓解稀缺性，同时利好设备供应商。",
  },
  {
    type: "DEMAND_ACCELERATION",
    impact: "SUPPORTIVE",
    magnitude: "MEDIUM",
    keywords: ["demand surge", "record demand", "orders rise", "boom", "accelerat", "growth"],
    signalEn: "The article indicates accelerating demand.",
    signalZh: "新闻显示需求正在加速。",
    reasonEn: "Faster demand increases dependency on hard-to-replace supply-chain nodes.",
    reasonZh: "需求加速会提高产业对难以替代节点的依赖。",
  },
  {
    type: "DEMAND_SLOWDOWN",
    impact: "NEGATIVE",
    magnitude: "MEDIUM",
    keywords: ["slowdown", "demand decline", "orders fall", "cuts", "cancel", "weak demand"],
    signalEn: "The article indicates weakening demand.",
    signalZh: "新闻显示需求走弱。",
    reasonEn: "Weaker demand reduces near-term monetization of structural control.",
    reasonZh: "需求走弱会降低结构性控制力的短期变现能力。",
  },
  {
    type: "REGULATORY_CHANGE",
    impact: "NEGATIVE",
    magnitude: "LOW",
    keywords: ["regulation", "regulator", "antitrust", "probe", "investigation"],
    signalEn: "The article indicates a regulatory change or investigation.",
    signalZh: "新闻显示监管变化或调查。",
    reasonEn: "Regulatory uncertainty reduces confidence until the impact is clearer.",
    reasonZh: "监管不确定性会在影响明朗前降低置信度。",
  },
];

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, " ").trim();
}

function articleText(article: NewsEvidence): string {
  return normalize(`${article.title} ${article.summary}`);
}

function macroDelta(verdict: MacroVerdict): number {
  if (verdict === "RISK_ON") return 2;
  if (verdict === "RISK_OFF") return -4;
  if (verdict === "UNAVAILABLE") return -2;
  return 0;
}

function eventDeltaForRole(event: SupplyChainEvent, role: ThroatRole, supplyRole?: string): number {
  if (event.event_type === "SUPPLY_RESTRICTION" || event.event_type === "GEOPOLITICAL_DISRUPTION") {
    if (role === "CORE BOTTLENECK") return 5;
    if (role === "STRATEGIC ENABLER") return 3;
    if (role === "DOWNSTREAM USER") return -3;
    return -1;
  }
  if (event.event_type === "SUBSTITUTION") {
    if (role === "CORE BOTTLENECK") return -5;
    if (role === "STRATEGIC ENABLER") return -3;
    return 1;
  }
  if (event.event_type === "CAPACITY_EXPANSION") {
    if (supplyRole === "equipment_supplier") return 4;
    if (role === "CORE BOTTLENECK" || role === "STRATEGIC ENABLER") return 2;
    return 1;
  }
  if (event.event_type === "DEMAND_ACCELERATION") {
    if (role === "CORE BOTTLENECK") return 3;
    if (role === "STRATEGIC ENABLER") return 2;
    return 1;
  }
  if (event.event_type === "DEMAND_SLOWDOWN") {
    if (role === "CORE BOTTLENECK") return -3;
    if (role === "STRATEGIC ENABLER") return -2;
    return -1;
  }
  if (event.event_type === "REGULATORY_CHANGE") return -2;
  return 0;
}

function classifyArticle(
  article: NewsEvidence,
  profile: IndustryProfile,
  companies: Company[],
  index: number,
): SupplyChainEvent | null {
  const text = articleText(article);
  const textTokens = new Set(text.split(" "));
  const rule = RULES.find((candidate) =>
    candidate.keywords.some((keyword) => text.includes(normalize(keyword))),
  );
  if (!rule) return null;

  const affectedCompanies = companies
    .filter((company) => {
      const name = normalize(company.name);
      const ticker = normalize(company.ticker);
      return (
        text.includes(name) ||
        (ticker && !ticker.includes(" ") && textTokens.has(ticker)) ||
        article.matched_keyword === company.name
      );
    });
  const affected = affectedCompanies.map((company) => company.ticker);
  const industryMatch = normalize(article.matched_keyword) === normalize(profile.label);
  const incumbentExpansion =
    rule.type === "CAPACITY_EXPANSION" &&
    affectedCompanies.some(
      (company) =>
        company.throat_role === "CORE BOTTLENECK" ||
        company.throat_role === "STRATEGIC ENABLER",
    );

  return {
    id: `event-${index + 1}`,
    title: article.title,
    source: article.source,
    published: article.published,
    link: article.link,
    event_type: rule.type,
    bottleneck_impact: incumbentExpansion ? "SUPPORTIVE" : rule.impact,
    magnitude: rule.magnitude,
    matched_keywords: rule.keywords.filter((keyword) => text.includes(normalize(keyword))),
    affected_tickers: industryMatch || affected.length === 0 ? companies.map((c) => c.ticker) : affected,
    extracted_signal_en: rule.signalEn,
    extracted_signal_zh: rule.signalZh,
    impact_reason_en: incumbentExpansion
      ? "Investment by an incumbent bottleneck or strategic enabler can reinforce scale and near-term control."
      : rule.reasonEn,
    impact_reason_zh: incumbentExpansion
      ? "现有瓶颈企业或战略赋能者的投资可能强化规模优势与近期控制力。"
      : rule.reasonZh,
  };
}

function actionFor(company: Company, adjustedScore: number, delta: number): SimulatedDecisionAction {
  if (adjustedScore >= 72 && delta >= -3 && company.throat_role !== "PERIPHERAL EXPOSURE") {
    return "SIMULATED_BUY";
  }
  if (adjustedScore >= 55 && delta >= -6) return "WATCH";
  return "AVOID";
}

function buildAdjustment(
  company: Company,
  events: SupplyChainEvent[],
  macroOverlay: number,
): CompanyEventAdjustment {
  const supporting = events.filter((event) => event.affected_tickers.includes(company.ticker));
  const rawEventDelta = supporting.reduce(
    (sum, event) =>
      sum + eventDeltaForRole(event, company.throat_role, company.selection_insight?.supply_role),
    0,
  );
  const eventDelta = Math.max(-10, Math.min(10, rawEventDelta));
  const confidenceDelta = Math.max(-12, Math.min(12, eventDelta + macroOverlay));
  const adjustedScore = clampScore(company.score + confidenceDelta);
  const positive = supporting.filter(
    (event) => eventDeltaForRole(event, company.throat_role, company.selection_insight?.supply_role) > 0,
  ).length;
  const negative = supporting.filter(
    (event) => eventDeltaForRole(event, company.throat_role, company.selection_insight?.supply_role) < 0,
  ).length;
  const signal: EventSignal =
    supporting.length === 0
      ? "NO_EVENT_EVIDENCE"
      : positive > 0 && negative > 0
        ? "MIXED"
        : positive > 0
          ? "POSITIVE"
          : "NEGATIVE";
  const action = actionFor(company, adjustedScore, confidenceDelta);

  return {
    ticker: company.ticker,
    base_score: company.score,
    event_delta: eventDelta,
    macro_delta: macroOverlay,
    confidence_delta: confidenceDelta,
    adjusted_score: adjustedScore,
    evidence_count: supporting.length,
    event_signal: signal,
    recommended_action: action,
    supporting_event_ids: supporting.map((event) => event.id),
    explanation_en:
      supporting.length > 0
        ? `${supporting.length} extracted event(s) contribute ${eventDelta >= 0 ? "+" : ""}${eventDelta}; macro overlay contributes ${macroOverlay >= 0 ? "+" : ""}${macroOverlay}. Structural score remains visible as the base.`
        : `No matching supply-chain event was extracted; event delta is 0. Macro overlay contributes ${macroOverlay >= 0 ? "+" : ""}${macroOverlay}.`,
    explanation_zh:
      supporting.length > 0
        ? `${supporting.length} 个已提取事件贡献 ${eventDelta >= 0 ? "+" : ""}${eventDelta}；宏观叠加贡献 ${macroOverlay >= 0 ? "+" : ""}${macroOverlay}。结构性评分仍作为基础分保留。`
        : `未提取到匹配的供应链事件；事件增量为 0。宏观叠加贡献 ${macroOverlay >= 0 ? "+" : ""}${macroOverlay}。`,
  };
}

export function buildEventIntelligence(
  profile: IndustryProfile,
  companies: Company[],
  research: MarketResearch,
): { intelligence: EventIntelligence; companies: Company[] } {
  const events = research.news.articles
    .map((article, index) => classifyArticle(article, profile, companies, index))
    .filter((event): event is SupplyChainEvent => event !== null);
  const overlay = macroDelta(research.macro.verdict);
  const adjustments = companies.map((company) => buildAdjustment(company, events, overlay));
  const adjustmentByTicker = new Map(adjustments.map((adjustment) => [adjustment.ticker, adjustment]));
  const adjustedCompanies = companies
    .map((company) => ({
      ...company,
      score: adjustmentByTicker.get(company.ticker)?.adjusted_score ?? company.score,
      event_adjustment: adjustmentByTicker.get(company.ticker),
    }))
    .sort((a, b) => b.score - a.score || a.ticker.localeCompare(b.ticker));
  const selected = adjustedCompanies
    .filter(
      (company) =>
        company.event_adjustment?.recommended_action === "SIMULATED_BUY" &&
        company.bitget_market?.listed &&
        company.bitget_market.status === "online",
    )
    .slice(0, 5);
  const action: SimulatedDecisionAction =
    selected.length > 0 ? "SIMULATED_BUY" : adjustedCompanies.some((c) => c.score >= 55) ? "WATCH" : "AVOID";
  const selectedTickers = selected.map((company) => company.ticker);
  const eventStatus = research.news.status === "unavailable" ? "unavailable" : events.length > 0 ? "verified" : "partial";
  const traceEventStatus = eventStatus === "verified" ? "complete" : eventStatus;
  const intelligence: EventIntelligence = {
    status: eventStatus,
    events,
    company_adjustments: adjustments.sort(
      (a, b) => b.adjusted_score - a.adjusted_score || a.ticker.localeCompare(b.ticker),
    ),
    macro_verdict: research.macro.verdict,
    macro_overlay: overlay,
    decision_trace: [
      {
        id: "industry_input",
        label_en: "Industry Input",
        label_zh: "行业输入",
        status: "complete",
        detail_en: `Mapped “${profile.interpretation.user_input}” to ${profile.label}.`,
        detail_zh: `已将“${profile.interpretation.user_input}”映射至 ${profile.label}。`,
      },
      {
        id: "credible_news_search",
        label_en: "Credible News Search",
        label_zh: "搜索近期可信新闻",
        status: research.news.status === "unavailable" ? "unavailable" : research.news.articles.length > 0 ? "complete" : "partial",
        detail_en: `${research.news.articles.length} recent article(s) returned by Agent Hub news-briefing.`,
        detail_zh: `Agent Hub news-briefing 返回 ${research.news.articles.length} 条近期新闻。`,
      },
      {
        id: "supply_chain_event_extraction",
        label_en: "Supply Chain Event Extraction",
        label_zh: "提取供应链事件",
        status: events.length > 0 ? "complete" : traceEventStatus,
        detail_en: `${events.length} auditable supply-chain event(s) extracted with deterministic keyword rules.`,
        detail_zh: `通过确定性关键词规则提取 ${events.length} 个可审计供应链事件。`,
      },
      {
        id: "bottleneck_impact_assessment",
        label_en: "Bottleneck Impact Assessment",
        label_zh: "评估瓶颈影响",
        status: events.length > 0 ? "complete" : traceEventStatus,
        detail_en: `${events.length} event(s) mapped to bottleneck-strengthening, weakening, supportive, or negative impact.`,
        detail_zh: `已将 ${events.length} 个事件映射为强化瓶颈、削弱瓶颈、支持或负面影响。`,
      },
      {
        id: "candidate_confidence_adjustment",
        label_en: "Candidate Confidence Adjustment",
        label_zh: "调整候选置信度",
        status: "complete",
        detail_en: `${adjustments.length} candidates adjusted within a capped ±12-point evidence overlay.`,
        detail_zh: `${adjustments.length} 个候选在最高 ±12 分的证据叠加范围内完成调整。`,
      },
      {
        id: "explainable_simulated_trade_decision",
        label_en: "Explainable Simulated Trade Decision",
        label_zh: "生成可解释的模拟交易决策",
        status: selectedTickers.length > 0 ? "complete" : "partial",
        detail_en: selectedTickers.length > 0 ? `Current Bitget-tradable simulated basket: ${selectedTickers.join(", ")}.` : "No Bitget-tradable candidate currently clears the simulated-buy threshold.",
        detail_zh: selectedTickers.length > 0 ? `当前可在 Bitget 交易的模拟篮子：${selectedTickers.join(", ")}。` : "当前没有可在 Bitget 交易的候选达到模拟买入阈值。",
      },
    ],
    simulated_decision: {
      action,
      selected_tickers: selectedTickers,
      rationale_en:
        selectedTickers.length > 0
          ? `Select ${selectedTickers.join(", ")} using structural bottleneck scores plus capped event and macro overlays.`
          : "Keep candidates on watch because no Bitget-tradable candidate currently supports a simulated entry.",
      rationale_zh:
        selectedTickers.length > 0
          ? `基于结构性瓶颈评分，并叠加受限幅度的事件与宏观调整，选择 ${selectedTickers.join(", ")}。`
          : "当前没有可在 Bitget 交易的候选支持模拟建仓，候选维持观察。",
    },
    disclosure_en:
      "Current news and macro evidence select today's candidate basket. Historical Bitget candles validate that basket only; current evidence is not back-propagated into historical dates.",
    disclosure_zh:
      "当前新闻与宏观证据仅用于选择今天的候选篮子。历史 Bitget K 线只用于验证该篮子，不会把当前证据倒灌到历史日期。",
    generated_at: new Date().toISOString(),
  };

  return { intelligence, companies: adjustedCompanies };
}
