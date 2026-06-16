import type { IndustryInterpretation } from "../mockData";
import type { FinalDecisionLayer } from "../decisionLayer";
import type { ReasoningIntelligence } from "../reasoning/intelligenceLayer";
import type { ThroatRole } from "../types";
import type { Locale } from "./types";

export function translateSelectionRationale(
  rationale: string,
  _profileId: string | undefined,
  locale: Locale,
): string {
  if (locale === "en") {
    return rationale;
  }

  return rationale
    .replace(/^Constrained role-based selection for (.+):/, "约束式角色选择（$1）：")
    .replace(
      /^No companies passed constrained selection for "(.+)"/,
      "没有公司通过「$1」的约束式筛选",
    )
    .replace(/LOW CONFIDENCE — partial list only; do not treat as full Top 5\./, "低置信度 — 仅部分列表，不应视为完整 Top 5。")
}

export function translateReasoningChain(chain: string[], locale: Locale): string[] {
  if (locale === "en") {
    return chain;
  }

  return chain.map((step) =>
    step
      .replace(/^A — Industry interpretation:/, "A — 行业解读：")
      .replace(/^B — Supply chain layers \(fixed schema\):/, "B — 供应链层级（固定 schema）：")
      .replace(/^C — Bottleneck identification:/, "C — 瓶颈识别：")
      .replace(/^D — Company candidates \(role \+ constraint gate\):/, "D — 公司候选（角色 + 约束门）：")
      .replace(/^E — Final ranking:/, "E — 最终排名：")
      .replace(/^Uncertainty flag:/, "不确定性标记：")
      .replace(/targeting end market/g, "终端市场")
      .replace(/signals:/g, "信号：")
      .replace(/generated/g, "生成")
      .replace(/layers with peak pressure at/g, "层，峰值压力位于")
      .replace(/selected by supply-chain role fit — not fixed industry lists\./, "按供应链角色匹配选择 — 非固定行业列表。")
      .replace(/demand driver is/g, "需求驱动为")
      .replace(/with end market/g, "终端市场为")
      .replace(/sectors:/g, "行业标签：")
      .replace(/Highest composite pressure at/g, "综合压力最高位于")
      .replace(/ranked/g, "排序结果")
      .replace(/by sector overlap/g, "按行业重叠度")
      .replace(/layer fit/g, "层级匹配")
      .replace(/dependency exposure/g, "依赖暴露")
      .replace(/substitution difficulty/g, "替代难度"),
  );
}

export function translateSummary(
  summary: string,
  interpretation: IndustryInterpretation,
  locale: Locale,
): string {
  if (locale === "en") {
    return summary;
  }

  if (interpretation.end_market && interpretation.demand_driver) {
    const uncertain =
      interpretation.confidence !== undefined && interpretation.confidence < 55
        ? "（置信度较低，映射不确定）"
        : "";
    return `约束式推理分析「${interpretation.display_label}」${uncertain}：需求驱动 — ${interpretation.demand_driver}；终端市场 — ${interpretation.end_market}。`;
  }

  const tags = interpretation.sector_tags.join(" + ");
  return `推理引擎将「${interpretation.display_label}」映射为 ${tags}，并动态构建供应链瓶颈。`;
}

export function buildConclusionNarrative(
  locale: Locale,
  bottleneckLocation: string,
  primary: { ticker: string; name: string; throat_role: ThroatRole },
  nonBottlenecks: Array<{ ticker: string; throat_role: ThroatRole }>,
  getRoleLabel: (role: ThroatRole) => string,
  sectorTags: string[],
): string {
  const nonList =
    nonBottlenecks.length > 0
      ? nonBottlenecks
          .map((company) => `${company.ticker} (${getRoleLabel(company.throat_role)})`)
          .join("、")
      : locale === "zh"
        ? "Top 排名中暂无"
        : "None in the current top-ranked set";

  if (locale === "zh") {
    return [
      `主要瓶颈节点：${bottleneckLocation}。`,
      `真正瓶颈控制点：${primary.ticker} — ${primary.name}（${getRoleLabel(primary.throat_role)}）。`,
      `推理归类：${sectorTags.join(" + ")}。`,
      `高分但不是主要瓶颈控制点：${nonList}。`,
    ].join(" ");
  }

  return [
    `Primary bottleneck node: ${bottleneckLocation}.`,
    `True choke point: ${primary.ticker} — ${primary.name} (${primary.throat_role}).`,
    `Reasoning sectors: ${sectorTags.join(" + ")}.`,
    `High-ranked but not choke points: ${nonList}.`,
  ].join(" ");
}

export function buildValidationSummary(
  locale: Locale,
  metrics: {
    total_return_pct: number;
    benchmark_return_pct: number;
  },
  bottleneck_strategy_score: number,
  coreReturn: number,
  enablerReturn: number,
): string {
  const beatSpy = metrics.total_return_pct > metrics.benchmark_return_pct;
  const coreBeatEnabler = coreReturn > enablerReturn;

  if (locale === "zh") {
    return [
      `Top 5 等权组合回报 ${metrics.total_return_pct}%，SPY ${metrics.benchmark_return_pct}%（${beatSpy ? "跑赢" : "跑输"}基准）。`,
      `核心瓶颈篮子 ${coreReturn}% vs 战略赋能者 ${enablerReturn}%（${coreBeatEnabler ? "支持" : "暂不支持"}瓶颈理论）。`,
      `瓶颈策略得分：${bottleneck_strategy_score}/100。`,
    ].join(" ");
  }

  return [
    `Top-5 equal-weight portfolio returned ${metrics.total_return_pct}% vs SPY ${metrics.benchmark_return_pct}% (${beatSpy ? "outperformed" : "underperformed"} benchmark).`,
    `CORE BOTTLENECK basket returned ${coreReturn}% vs STRATEGIC ENABLER ${enablerReturn}% (${coreBeatEnabler ? "validating" : "not validating"}) bottleneck theory.`,
    `Bottleneck Strategy Score: ${bottleneck_strategy_score}/100.`,
  ].join(" ");
}

export function localizeBacktestPeriod(locale: Locale): string {
  if (locale === "zh") {
    return "2023-01-01 至 2026-01-01（3 年）";
  }
  return "2023-01-01 to 2026-01-01 (3 years)";
}

export function localizeAllocation(locale: Locale, count: number, weight: number): string {
  if (locale === "zh") {
    return `等权 ${weight}% × ${count} 只`;
  }
  return `Equal weight ${weight}% × ${count} holdings`;
}

export function localizeRebalance(locale: Locale): string {
  return locale === "zh" ? "每月" : "Monthly";
}

export function localizeFinalDecision(
  decision: FinalDecisionLayer,
  locale: Locale,
): FinalDecisionLayer {
  if (locale === "en") {
    return decision;
  }

  return {
    ...decision,
    decision_summary: {
      ...decision.decision_summary,
      one_line_conclusion: decision.decision_summary.one_line_conclusion.replace(
        /^In (.+), the real control point is (.+) \((.+)\) because (.+)\.$/,
        "在 $1 中，真正的控制点是 $2（$3），因为 $4。",
      ),
    },
    traditional_vs_throatscan: {
      traditional: {
        ...decision.traditional_vs_throatscan.traditional,
        label: "传统股票筛选",
        metrics: ["市盈率 P/E", "EPS 增长", "营收动量"],
        limitation: "按可见财务动量排序 — 往往遗漏真正控制稀缺资源的公司。",
      },
      throatscan: {
        ...decision.traditional_vs_throatscan.throatscan,
        label: "ThroatScan 瓶颈筛选",
        metrics: ["供应链控制力", "瓶颈依赖度", "可替代性（1–3 年）"],
        advantage: "揭示结构性 choke point，即使财务倍数看起来普通。",
      },
    },
    key_advantages: [
      "捕捉 P/E、EPS 筛选看不到的隐藏供应链控制点。",
      "识别非显而易见的市场权力 — 瓶颈常在上游，而非品牌终端。",
      "聚焦结构性依赖与可替代性，而非仅看价格类指标。",
    ],
  };
}

export function localizeReasoningIntelligence(
  intelligence: ReasoningIntelligence,
  locale: Locale,
): ReasoningIntelligence {
  if (locale === "en") {
    return intelligence;
  }

  return {
    ...intelligence,
    self_checks: intelligence.self_checks.map((item) => ({
      ...item,
      check:
        item.check === "Did we over-select downstream companies?"
          ? "是否过度选择下游公司？"
          : item.check === "Did we miss upstream constraints?"
            ? "是否遗漏上游约束？"
            : "瓶颈是否真正具有结构性？",
      passed: item.passed,
    })),
    transparency_panel: {
      confident_about: intelligence.transparency_panel.confident_about.map((s) =>
        s.replace(/^Demand driver:/, "需求驱动：").replace(/^Primary layer ranking:/, "Primary 层级排序："),
      ),
      uncertain_about: intelligence.transparency_panel.uncertain_about.map((s) =>
        s.replace(/^Bottleneck layer:/, "瓶颈层级："),
      ),
      could_change_conclusion: intelligence.transparency_panel.could_change_conclusion,
    },
  };
}
