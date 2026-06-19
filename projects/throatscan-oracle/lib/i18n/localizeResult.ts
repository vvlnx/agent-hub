import type { AnalysisResult } from "../mockData";
import type { FinalDecisionLayer } from "../decisionLayer";
import type { ReasoningIntelligence } from "../reasoning/intelligenceLayer";
import type { CompanyAuditRecord } from "../reasoning/auditTrail";
import type { StructuredReasoningReport } from "../reasoning/structuredReport";
import type { Company } from "../types";
import type { IndustryMap } from "../industryMap";
import {
  translateCompanyName,
  translateCompanyNamesInText,
  translateConstraint,
  translateEngineText,
  translateLayer,
  translateSectorTag,
  translateSupplyRole,
} from "./engineText";
import type { Locale } from "./types";

function translateBacktestText(text: string): string {
  return translateEngineText(text)
    .replace(/(\d{4}-\d{2}-\d{2}) to (\d{4}-\d{2}-\d{2})/g, "$1 至 $2")
    .replace(/\((\d+) daily observations\)/g, "（$1 个日线观测）")
    .replace(/Risk-capped (\d+(?:\.\d+)?)% × (\d+) Bitget stock tokens; remainder held as cash/g, "风险上限 $1% × $2 个 Bitget 股票代币；剩余资金持有现金")
    .replace(/Every (\d+) common observations; (\d+(?:\.\d+)?)% trailing stop/g, "每 $1 个共同观测值再平衡；$2% 跟踪止损")
    .replace(/Verifiable Bitget-candle simulation returned/g, "可验证的 Bitget K 线模拟回报为")
    .replace(/Evidence hash:/g, "证据哈希：")
    .replace(/Risk-capped entry after ThroatScan selected ([A-Z0-9.]+); target weight (\d+(?:\.\d+)?)%\./g, "ThroatScan 选中 $1 后按风险上限建仓；目标权重 $2%。")
    .replace(/Current-evidence selection: ([A-Z0-9.]+) adjusted confidence ([\d.]+) \(([+-][\d.]+)\); historical validation only; target weight ([\d.]+)%\./g, "当前证据选择：$1 调整后置信度 $2（$3）；仅用于历史验证；目标权重 $4%。")
    .replace(/Periodic rebalance back to (\d+(?:\.\d+)?)% max-risk target\./g, "周期再平衡至 $1% 风险上限目标。")
    .replace(/(\d+(?:\.\d+)?)% trailing stop triggered at ([\d.]+) versus peak ([\d.]+)\./g, "触发 $1% 跟踪止损：当前价格 $2，峰值 $3。")
    .replace(/None of the selected companies map to an online Bitget tokenized-stock symbol\./g, "所选公司均未映射到在线 Bitget 股票代币交易对。")
    .replace(/Insufficient Bitget candles for/g, "Bitget K 线数据不足：")
    .replace(/Could not fetch Bitget candles for/g, "无法获取 Bitget K 线：");
}

function translateCompany(company: Company): Company {
  return {
    ...company,
    name: translateCompanyName(company.name),
    sector_tags: (company.sector_tags ?? []).map(translateSectorTag),
    chain_position: translateEngineText(company.chain_position),
    why_bottleneck_or_not: {
      scarce_resource: translateEngineText(company.why_bottleneck_or_not.scarce_resource),
      can_function_without: translateEngineText(company.why_bottleneck_or_not.can_function_without),
      replaceability_1_to_3_years: translateEngineText(
        company.why_bottleneck_or_not.replaceability_1_to_3_years,
      ),
    },
    selection_insight: company.selection_insight
      ? {
          ...company.selection_insight,
          supply_role_label: translateSupplyRole(company.selection_insight.supply_role_label),
          why_selected: translateEngineText(company.selection_insight.why_selected),
          why_not_others: translateEngineText(company.selection_insight.why_not_others),
          depends_on: translateEngineText(company.selection_insight.depends_on),
          constraints_met: company.selection_insight.constraints_met.map(translateConstraint),
          uncertainty_reason: company.selection_insight.uncertainty_reason
            ? translateEngineText(company.selection_insight.uncertainty_reason)
            : undefined,
        }
      : undefined,
  };
}

function translateStructuredReport(report: StructuredReasoningReport): StructuredReasoningReport {
  return {
    ...report,
    section_a_industry_interpretation: {
      ...report.section_a_industry_interpretation,
      display_label: translateEngineText(
        report.section_a_industry_interpretation.display_label,
      ),
      demand_driver: translateEngineText(report.section_a_industry_interpretation.demand_driver),
      end_market: translateEngineText(report.section_a_industry_interpretation.end_market),
      sector_signals: report.section_a_industry_interpretation.sector_signals.map(translateSectorTag),
    },
    section_b_supply_chain_layers: report.section_b_supply_chain_layers.map((layer) => ({
      ...layer,
      name: translateEngineText(layer.name),
      description: translateEngineText(layer.description),
    })),
    section_c_bottleneck_identification: {
      ...report.section_c_bottleneck_identification,
      location_description: translateEngineText(
        report.section_c_bottleneck_identification.location_description,
      ),
      rationale: translateEngineText(report.section_c_bottleneck_identification.rationale),
      layer_ranking: report.section_c_bottleneck_identification.layer_ranking.map((row) => ({
        ...row,
        name: translateEngineText(row.name),
      })),
    },
    section_d_company_candidates: report.section_d_company_candidates.map((row) => ({
      ...row,
      supply_role_label: translateSupplyRole(row.supply_role_label),
      why_included: translateEngineText(row.why_included),
      why_not_others: translateEngineText(row.why_not_others),
      depends_on: translateEngineText(row.depends_on),
      constraint_labels: row.constraint_labels.map(translateConstraint),
    })),
  };
}

function translateAuditTrail(rows: CompanyAuditRecord[]): CompanyAuditRecord[] {
  return rows.map((row) => ({
    ...row,
    supply_role_label: translateSupplyRole(row.supply_role_label),
    why_included: translateEngineText(row.why_included),
    why_not_others: translateEngineText(row.why_not_others),
    depends_on: translateEngineText(row.depends_on),
    constraint_labels: row.constraint_labels.map(translateConstraint),
  }));
}

function translateFinalDecision(decision: FinalDecisionLayer): FinalDecisionLayer {
  const translatedIndustry = translateEngineText(decision.final_result_card.industry);
  const mapCompany = (c: FinalDecisionLayer["primary_bottleneck"]) => ({
    ...c,
    name: translateCompanyName(c.name),
    supply_role_label: c.supply_role_label
      ? translateSupplyRole(c.supply_role_label)
      : undefined,
    reason: translateCompanyNamesInText(translateEngineText(c.reason)),
  });
  const translatedPrimaryName = translateCompanyName(decision.primary_bottleneck.name);

  return {
    ...decision,
    primary_bottleneck: mapCompany(decision.primary_bottleneck),
    secondary_bottlenecks: decision.secondary_bottlenecks.map(mapCompany),
    non_bottleneck_companies: decision.non_bottleneck_companies.map(mapCompany),
    decision_summary: {
      ...decision.decision_summary,
      one_line_conclusion: `在 ${translatedIndustry} 中，真正的控制点是 ${decision.primary_bottleneck.ticker}（${translatedPrimaryName}），原因是${translateCompanyNamesInText(translateEngineText(decision.primary_bottleneck.reason))}。`,
    },
    traditional_vs_throatscan: {
      traditional: {
        ...decision.traditional_vs_throatscan.traditional,
        label: translateEngineText(decision.traditional_vs_throatscan.traditional.label),
        metrics: ["市盈率 P/E", "EPS 增长", "营收动量"],
        limitation: "按可见财务动量排序，往往遗漏真正控制稀缺投入的公司。",
      },
      throatscan: {
        ...decision.traditional_vs_throatscan.throatscan,
        label: translateEngineText(decision.traditional_vs_throatscan.throatscan.label),
        metrics: ["供应链控制力", "瓶颈依赖度", "可替代性（1–3 年）"],
        advantage: "即使财务估值看似普通，也能识别结构性瓶颈。",
      },
    },
    key_advantages: [
      "识别传统 P/E 与 EPS 筛选无法发现的隐藏供应链控制点。",
      "识别不明显的市场控制力：瓶颈通常位于上游，而非知名终端品牌。",
      "重点分析结构性依赖与可替代性，而非只看价格和财务指标。",
    ],
    final_result_card: {
      ...decision.final_result_card,
      industry: translatedIndustry,
      core_bottleneck: translateCompanyNamesInText(decision.final_result_card.core_bottleneck),
      reason: translateCompanyNamesInText(translateEngineText(decision.final_result_card.reason)),
      confidence: translateEngineText(decision.final_result_card.confidence),
    },
  };
}

function translateIntelligence(intelligence: ReasoningIntelligence): ReasoningIntelligence {
  return {
    bottleneck_uncertainty: {
      confidence: intelligence.bottleneck_uncertainty.confidence,
      reason: translateEngineText(intelligence.bottleneck_uncertainty.reason),
    },
    company_uncertainties: intelligence.company_uncertainties.map((row) => ({
      ...row,
      reason: translateEngineText(row.reason),
    })),
    alternative_hypothesis: {
      primary_theory: {
        ...intelligence.alternative_hypothesis.primary_theory,
        layer_label: translateLayer(intelligence.alternative_hypothesis.primary_theory.layer_label),
        thesis: translateEngineText(intelligence.alternative_hypothesis.primary_theory.thesis),
        confidence_reason: translateEngineText(
          intelligence.alternative_hypothesis.primary_theory.confidence_reason,
        ),
      },
      alternative_theory: intelligence.alternative_hypothesis.alternative_theory
        ? {
            ...intelligence.alternative_hypothesis.alternative_theory,
            layer_label: translateLayer(
              intelligence.alternative_hypothesis.alternative_theory.layer_label,
            ),
            thesis: translateEngineText(
              intelligence.alternative_hypothesis.alternative_theory.thesis,
            ),
            confidence_reason: translateEngineText(
              intelligence.alternative_hypothesis.alternative_theory.confidence_reason,
            ),
          }
        : null,
      pivot_condition: translateEngineText(intelligence.alternative_hypothesis.pivot_condition),
    },
    self_checks: intelligence.self_checks.map((item) => ({
      ...item,
      check: translateEngineText(item.check),
      finding: translateEngineText(item.finding),
      correction: item.correction ? translateEngineText(item.correction) : undefined,
    })),
    contradictions: intelligence.contradictions.map((row) => ({
      signal_a: translateEngineText(row.signal_a),
      signal_b: translateEngineText(row.signal_b),
      tradeoff: translateEngineText(row.tradeoff),
    })),
    transparency_panel: {
      confident_about: intelligence.transparency_panel.confident_about.map(translateEngineText),
      uncertain_about: intelligence.transparency_panel.uncertain_about.map(translateEngineText),
      could_change_conclusion:
        intelligence.transparency_panel.could_change_conclusion.map(translateEngineText),
    },
  };
}

function translateIndustryMap(map: IndustryMap): IndustryMap {
  return {
    ...map,
    thesis: translateEngineText(map.thesis),
    scope_note: translateEngineText(map.scope_note),
    stock_trend_note: translateEngineText(map.stock_trend_note),
    layers: map.layers.map((layer) => ({
      ...layer,
      title: translateEngineText(layer.title),
      purpose: translateEngineText(layer.purpose),
      companies: layer.companies.map((company) => ({
        ...company,
        name: translateCompanyName(company.name),
        sector_tags: (company.sector_tags ?? []).map(translateSectorTag),
        chain_position: translateEngineText(company.chain_position),
        supply_role_label: company.supply_role_label
          ? translateSupplyRole(company.supply_role_label)
          : undefined,
        stock_trend: {
          ...company.stock_trend,
          reason: translateEngineText(company.stock_trend.reason),
        },
      })),
    })),
  };
}

function translateThesisAudit(audit: AnalysisResult["thesis_audit"]): AnalysisResult["thesis_audit"] {
  return {
    ...audit,
    summary_zh: translateCompanyNamesInText(translateEngineText(audit.summary_zh)),
    project_role_zh: translateEngineText(audit.project_role_zh),
    layer_priorities: audit.layer_priorities.map((layer) => ({
      ...layer,
      label_zh: translateEngineText(layer.label_zh),
      scarce_layer_reason_zh: translateCompanyNamesInText(
        translateEngineText(layer.scarce_layer_reason_zh),
      ),
    })),
    candidate_reviews: audit.candidate_reviews.map((review) => ({
      ...review,
      name: translateCompanyName(review.name),
      chain_position: translateEngineText(review.chain_position),
      reason_zh: translateCompanyNamesInText(translateEngineText(review.reason_zh)),
      failure_condition_zh: translateCompanyNamesInText(
        translateEngineText(review.failure_condition_zh),
      ),
    })),
    next_checks_zh: audit.next_checks_zh.map((item) =>
      translateCompanyNamesInText(translateEngineText(item)),
    ),
    limitations_zh: audit.limitations_zh.map(translateEngineText),
    next_checks: audit.next_checks.map((check) => ({
      ...check,
      text_zh: translateCompanyNamesInText(translateEngineText(check.text_zh)),
      url_label_zh: check.url_label_zh
        ? translateCompanyNamesInText(translateEngineText(check.url_label_zh))
        : undefined,
    })),
  };
}

export function translateAnalysisContent(
  result: AnalysisResult,
  locale: Locale,
): AnalysisResult {
  if (locale === "en") return result;

  return {
    ...result,
    industry: translateEngineText(result.industry),
    summary: translateEngineText(result.summary),
    selection_rationale: translateEngineText(result.selection_rationale),
    reasoning_chain: result.reasoning_chain.map(translateEngineText),
    uncertainty_message: result.uncertainty_message
      ? translateEngineText(result.uncertainty_message)
      : undefined,
    interpretation: {
      ...result.interpretation,
      display_label: translateEngineText(result.interpretation.display_label),
      demand_driver: translateEngineText(result.interpretation.demand_driver ?? ""),
      end_market: translateEngineText(result.interpretation.end_market ?? ""),
      sector_tags: result.interpretation.sector_tags.map(translateSectorTag),
      selection_rationale: result.interpretation.selection_rationale
        ? translateEngineText(result.interpretation.selection_rationale)
        : undefined,
      bottleneck_hint: result.interpretation.bottleneck_hint
        ? translateEngineText(result.interpretation.bottleneck_hint)
        : undefined,
    },
    chain: result.chain.map((node) => ({
      ...node,
      name: translateEngineText(node.name),
      description: translateEngineText(node.description),
    })),
    companies: result.companies.map(translateCompany),
    conclusion: {
      ...result.conclusion,
      bottleneck_location: translateEngineText(result.conclusion.bottleneck_location),
      narrative: translateEngineText(result.conclusion.narrative),
      primary_bottleneck: translateCompany(result.conclusion.primary_bottleneck),
      high_score_non_bottlenecks: result.conclusion.high_score_non_bottlenecks.map(translateCompany),
    },
    structured_report: translateStructuredReport(result.structured_report),
    audit_trail: translateAuditTrail(result.audit_trail),
    final_decision: translateFinalDecision(result.final_decision),
    reasoning_intelligence: result.reasoning_intelligence
      ? translateIntelligence(result.reasoning_intelligence)
      : result.reasoning_intelligence,
    industry_map: translateIndustryMap(result.industry_map),
    universe_coverage:
      locale === "zh"
        ? {
            ...result.universe_coverage,
            summary_zh: translateEngineText(result.universe_coverage.summary_zh),
          }
        : result.universe_coverage,
    thesis_audit: translateThesisAudit(result.thesis_audit),
    backtest: {
      ...result.backtest,
      period: translateBacktestText(result.backtest.period),
      allocation: translateBacktestText(result.backtest.allocation),
      rebalance: translateBacktestText(result.backtest.rebalance),
      validation_summary: translateBacktestText(result.backtest.validation_summary),
      warnings: result.backtest.warnings.map(translateBacktestText),
      trade_log: result.backtest.trade_log.map((trade) => ({
        ...trade,
        reason: translateBacktestText(trade.reason),
      })),
    },
  };
}
