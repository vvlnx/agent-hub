import type { BacktestValidation } from "./backtest";
import type { EventIntelligence } from "./eventIntelligence";
import type { IndustryMap, IndustryMapCompany, IndustryMapStage } from "./industryMap";
import type { IndustryProfile } from "./mockData";
import type { MarketResearch } from "./marketResearch";
import { clampScore, type Company } from "./types";

export type ThesisAuditVerdict = "SUPPORTIVE" | "NEUTRAL" | "CHALLENGE";
export type ThesisAuditEvidenceGrade = "STRONG" | "MEDIUM" | "WEAK";
export type ThesisAuditCandidateSignal = "SUPPORTS" | "WATCH" | "CHALLENGES";

export interface ThesisAuditLayerPriority {
  stage: IndustryMapStage;
  label_en: string;
  label_zh: string;
  score: number;
  scarce_layer_reason_en: string;
  scarce_layer_reason_zh: string;
}

export interface ThesisAuditCandidateReview {
  ticker: string;
  name: string;
  stage: IndustryMapStage;
  chain_position: string;
  scarcity_score: number;
  evidence_grade: ThesisAuditEvidenceGrade;
  signal: ThesisAuditCandidateSignal;
  bitget_symbol?: string;
  reason_en: string;
  reason_zh: string;
  failure_condition_en: string;
  failure_condition_zh: string;
}

export interface ThesisAudit {
  source: "Open-source scarce-layer research methodology";
  repo_url: string;
  license: "MIT";
  verdict: ThesisAuditVerdict;
  verdict_label_en: string;
  verdict_label_zh: string;
  score: number;
  evidence_grade: ThesisAuditEvidenceGrade;
  summary_en: string;
  summary_zh: string;
  project_role_en: string;
  project_role_zh: string;
  layer_priorities: ThesisAuditLayerPriority[];
  candidate_reviews: ThesisAuditCandidateReview[];
  next_checks_en: string[];
  next_checks_zh: string[];
  limitations_en: string[];
  limitations_zh: string[];
  generated_at: string;
}

const SOURCE_REPO_URL = "https://github.com/muxuuu/serenity-skill";

function round(value: number, digits = 1): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function stageLabelEn(stage: IndustryMapStage): string {
  if (stage === "upstream") return "Upstream scarce inputs";
  if (stage === "midstream") return "Midstream conversion layer";
  return "Downstream demand layer";
}

function stageLabelZh(stage: IndustryMapStage): string {
  if (stage === "upstream") return "上游稀缺输入层";
  if (stage === "midstream") return "中游转化/平台层";
  return "下游需求层";
}

function stagePressure(profile: IndustryProfile, stage: IndustryMapStage): number {
  const layers = profile.reasoning.structured_report.section_b_supply_chain_layers.filter(
    (layer) => layer.stage === stage,
  );
  if (layers.length === 0) return 35;
  return (
    layers.reduce((sum, layer) => sum + layer.composite_pressure, 0) / layers.length
  );
}

function evidenceGrade(score: number): ThesisAuditEvidenceGrade {
  if (score >= 76) return "STRONG";
  if (score >= 52) return "MEDIUM";
  return "WEAK";
}

function evidenceGradeZh(grade: ThesisAuditEvidenceGrade): string {
  if (grade === "STRONG") return "强";
  if (grade === "MEDIUM") return "中";
  return "弱";
}

function evidenceScoreForCompany(
  company: IndustryMapCompany,
  coreCompany?: Company,
  eventIntelligence?: EventIntelligence,
): number {
  const adjustment = eventIntelligence?.company_adjustments.find(
    (row) => row.ticker === company.ticker,
  );
  let score = 28;
  if (company.stock_trend.status === "verified") score += 18;
  if (company.bitget_status === "online") score += 12;
  if ((adjustment?.evidence_count ?? 0) > 0) score += Math.min(24, adjustment!.evidence_count * 8);
  if (coreCompany?.selection_insight?.match_confidence) {
    score += Math.round(coreCompany.selection_insight.match_confidence * 14);
  }
  if (coreCompany?.event_adjustment?.event_signal === "POSITIVE") score += 8;
  if (coreCompany?.event_adjustment?.event_signal === "NEGATIVE") score -= 8;
  if (coreCompany?.throat_role === "CORE BOTTLENECK") score += 10;
  if (coreCompany?.throat_role === "STRATEGIC ENABLER") score += 6;
  return clampScore(score);
}

function layerPriority(
  profile: IndustryProfile,
  layer: IndustryMap["layers"][number],
): ThesisAuditLayerPriority {
  const averageScore =
    layer.companies.reduce((sum, company) => sum + company.score, 0) /
    Math.max(layer.companies.length, 1);
  const verifiedTrendCount = layer.companies.filter(
    (company) => company.stock_trend.status === "verified",
  ).length;
  const pressure = stagePressure(profile, layer.stage);
  const score = clampScore(
    pressure * 0.45 +
      averageScore * 0.32 +
      layer.bottleneck_count * 7 +
      layer.bitget_online_count * 3 +
      verifiedTrendCount * 2,
  );
  const topTickers = layer.companies.slice(0, 4).map((company) => company.ticker);

  return {
    stage: layer.stage,
    label_en: stageLabelEn(layer.stage),
    label_zh: stageLabelZh(layer.stage),
    score,
    scarce_layer_reason_en:
      topTickers.length > 0
        ? `${stageLabelEn(layer.stage)} scores ${score}/100 because it contains ${topTickers.join(", ")} and has ${layer.bottleneck_count} core bottleneck candidate(s).`
        : `${stageLabelEn(layer.stage)} has no mapped public-company candidate yet, so the audit layer treats it as under-verified.`,
    scarce_layer_reason_zh:
      topTickers.length > 0
        ? `${stageLabelZh(layer.stage)}得分 ${score}/100，因为这一层包含 ${topTickers.join("、")}，且有 ${layer.bottleneck_count} 个核心瓶颈候选。`
        : `${stageLabelZh(layer.stage)}暂未映射到上市公司候选，因此复核层将其视为证据不足。`,
  };
}

function failureCondition(company: IndustryMapCompany): {
  en: string;
  zh: string;
} {
  if (company.throat_role === "CORE BOTTLENECK") {
    return {
      en: "Downgrade if customers can qualify credible substitutes faster than expected or if capacity expansion removes scarcity.",
      zh: "如果客户能更快认证替代方案，或新增产能消除稀缺性，应下调判断。",
    };
  }
  if (company.throat_role === "STRATEGIC ENABLER") {
    return {
      en: "Downgrade if the company remains a beneficiary but does not control the scarce layer.",
      zh: "如果公司只是受益者，但并不控制稀缺层，应下调判断。",
    };
  }
  if (company.stage === "downstream") {
    return {
      en: "Downgrade if demand slows or upstream scarcity prevents this company from capturing the theme.",
      zh: "如果需求放缓，或上游稀缺限制其兑现主题，应下调判断。",
    };
  }
  return {
    en: "Downgrade if evidence remains narrative-only without filings, orders, capacity data, or customer proof.",
    zh: "如果证据仍停留在叙事层，没有公告、订单、产能或客户验证，应下调判断。",
  };
}

function candidateSignal(
  company: IndustryMapCompany,
  topStage: IndustryMapStage,
  grade: ThesisAuditEvidenceGrade,
): ThesisAuditCandidateSignal {
  if (company.stage === topStage && grade !== "WEAK") return "SUPPORTS";
  if (company.throat_role === "CORE BOTTLENECK" && grade !== "WEAK") return "SUPPORTS";
  if (company.stage === "downstream" && topStage !== "downstream") return "WATCH";
  if (grade === "WEAK") return "WATCH";
  return "SUPPORTS";
}

function candidateReview(
  company: IndustryMapCompany,
  topStage: IndustryMapStage,
  coreCompany: Company | undefined,
  eventIntelligence: EventIntelligence,
): ThesisAuditCandidateReview {
  const evidenceScore = evidenceScoreForCompany(company, coreCompany, eventIntelligence);
  const grade = evidenceGrade(evidenceScore);
  const scarcityScore = clampScore(
    company.score * 0.7 +
      evidenceScore * 0.2 +
      (company.throat_role === "CORE BOTTLENECK" ? 10 : 0),
  );
  const signal = candidateSignal(company, topStage, grade);
  const failure = failureCondition(company);
  const bitgetNoteEn = company.bitget_symbol
    ? ` Bitget execution evidence exists via ${company.bitget_symbol}.`
    : " It is research-only until Bitget lists a stock-token market.";
  const bitgetNoteZh = company.bitget_symbol
    ? ` 已有 Bitget 执行证据：${company.bitget_symbol}。`
    : " 在 Bitget 未上线前，只能作为研究标的。";

  return {
    ticker: company.ticker,
    name: company.name,
    stage: company.stage,
    chain_position: company.chain_position,
    scarcity_score: round(scarcityScore),
    evidence_grade: grade,
    signal,
    bitget_symbol: company.bitget_symbol,
    reason_en: `${company.ticker} sits in ${stageLabelEn(company.stage)} with scarcity score ${round(scarcityScore)}/100.${bitgetNoteEn}`,
    reason_zh: `${company.ticker} 位于${stageLabelZh(company.stage)}，稀缺层得分 ${round(scarcityScore)}/100。${bitgetNoteZh}`,
    failure_condition_en: failure.en,
    failure_condition_zh: failure.zh,
  };
}

function verdictLabel(verdict: ThesisAuditVerdict): { en: string; zh: string } {
  if (verdict === "SUPPORTIVE") {
    return { en: "Supports current bottleneck thesis", zh: "支持当前瓶颈判断" };
  }
  if (verdict === "CHALLENGE") {
    return { en: "Challenges current bottleneck thesis", zh: "挑战当前瓶颈判断" };
  }
  return { en: "Neutral, needs more evidence", zh: "中性，需要更多证据" };
}

function nextChecks(profile: IndustryProfile, topStage: IndustryMapStage): { en: string[]; zh: string[] } {
  const topic = profile.label;
  return {
    en: [
      `Verify ${stageLabelEn(topStage).toLowerCase()} with filings, capacity data, lead times, and customer qualification evidence.`,
      `Check whether the top public companies actually control scarcity or only benefit from the ${topic} narrative.`,
      "Compare Bitget-listed proxies against stronger research-only names before presenting a simulated trade basket.",
    ],
    zh: [
      `用公告、产能、交期和客户认证证据验证${stageLabelZh(topStage)}。`,
      `确认排名靠前的上市公司是真正控制稀缺性，还是只是在受益于 ${topic} 叙事。`,
      "在展示模拟交易篮子前，把 Bitget 已上线代理标的与更强但未上线的研究标的分开比较。",
    ],
  };
}

export function buildThesisAudit({
  profile,
  companies,
  industryMap,
  marketResearch,
  eventIntelligence,
  backtest,
}: {
  profile: IndustryProfile;
  companies: Company[];
  industryMap: IndustryMap;
  marketResearch: MarketResearch;
  eventIntelligence: EventIntelligence;
  backtest: BacktestValidation;
}): ThesisAudit {
  const layerPriorities = industryMap.layers
    .map((layer) => layerPriority(profile, layer))
    .sort((a, b) => b.score - a.score || a.stage.localeCompare(b.stage));
  const topLayer = layerPriorities[0];
  const companyByTicker = new Map(companies.map((company) => [company.ticker, company]));
  const candidatePool = industryMap.layers
    .flatMap((layer) => layer.companies)
    .sort((a, b) => b.score - a.score || a.ticker.localeCompare(b.ticker))
    .slice(0, 8);
  const reviews = candidatePool.map((company) =>
    candidateReview(
      company,
      topLayer?.stage ?? "midstream",
      companyByTicker.get(company.ticker),
      eventIntelligence,
    ),
  );
  const averageEvidence =
    reviews.reduce((sum, review) => {
      if (review.evidence_grade === "STRONG") return sum + 85;
      if (review.evidence_grade === "MEDIUM") return sum + 62;
      return sum + 35;
    }, 0) / Math.max(reviews.length, 1);
  const bitgetVerified = backtest.status === "verified" ? 8 : -4;
  const researchVerified =
    marketResearch.news.status === "verified" || marketResearch.news.status === "partial" ? 6 : -6;
  const score = clampScore((topLayer?.score ?? 50) * 0.55 + averageEvidence * 0.35 + bitgetVerified + researchVerified);
  const grade = evidenceGrade(score);
  const primaryTicker = profile.primary_bottleneck_ticker;
  const primaryReview = reviews.find((review) => review.ticker === primaryTicker);
  const verdict: ThesisAuditVerdict =
    grade === "WEAK"
      ? "NEUTRAL"
      : primaryReview?.signal === "SUPPORTS" || score >= 72
        ? "SUPPORTIVE"
        : score < 48
          ? "CHALLENGE"
          : "NEUTRAL";
  const labels = verdictLabel(verdict);
  const checks = nextChecks(profile, topLayer?.stage ?? "midstream");

  return {
    source: "Open-source scarce-layer research methodology",
    repo_url: SOURCE_REPO_URL,
    license: "MIT",
    verdict,
    verdict_label_en: labels.en,
    verdict_label_zh: labels.zh,
    score: round(score),
    evidence_grade: grade,
    summary_en: `The thesis audit ranks ${topLayer?.label_en ?? "the mapped value chain"} first and ${labels.en.toLowerCase()} with evidence grade ${grade}.`,
    summary_zh: `论证复核优先关注${topLayer?.label_zh ?? "已映射产业链"}，结论为「${labels.zh}」，证据等级为${evidenceGradeZh(grade)}。`,
    project_role_en:
      "This layer turns an open-source scarce-layer research workflow into an audit layer for ThroatScan: rank scarce layers first, challenge the thesis, then separate research-only names from Bitget-executable names.",
    project_role_zh:
      "这一层把开源稀缺层研究流程转成 ThroatScan 的审计层：先排稀缺层，再挑战结论，最后把研究标的和 Bitget 可执行标的分开。",
    layer_priorities: layerPriorities,
    candidate_reviews: reviews,
    next_checks_en: checks.en,
    next_checks_zh: checks.zh,
    limitations_en: [
      "The thesis audit is research support, not trade execution.",
      "It does not override Bitget listing status or verified candle availability.",
      "It uses public-methodology scoring and should be strengthened with primary-source filings before submission claims.",
    ],
    limitations_zh: [
      "论证复核只提供研究支持，不执行交易。",
      "它不会覆盖 Bitget 上线状态或已验证 K 线数据。",
      "当前为公开方法论评分，正式提交前应继续补充公告、财报、订单等一手证据。",
    ],
    generated_at: new Date().toISOString(),
  };
}
