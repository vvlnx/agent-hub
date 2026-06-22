import type { BacktestValidation } from "../backtest";
import type { EventIntelligence } from "../eventIntelligence";
import type { IndustryProfile } from "../mockData";
import type { MarketResearch } from "../marketResearch";
import type { UniverseCoverage } from "../universeCoverage";
import { isLLMConfigured } from "../llm/config";
import { loadEquityCatalog } from "../equity";
import type {
  AgentWorkflowStep,
  GrowthRoadmapPhase,
  HardConstraintRule,
  NoveltyPack,
  RebalanceAgentPlan,
} from "./types";

function buildHardConstraints(): HardConstraintRule[] {
  return [
    {
      id: "ticker_allowlist",
      label_en: "Fixed company universe + role gates",
      label_zh: "固定公司库 + 角色门槛",
      enforced_en: "Only seeded companies passing role/sector/query alignment enter the candidate pool.",
      enforced_zh: "仅通过角色/行业/查询对齐的种子公司可进入候选池。",
    },
    {
      id: "llm_no_pick",
      label_en: "LLM cannot pick tickers",
      label_zh: "LLM 不能选 ticker",
      enforced_en: "LLM augments industry grounding only; deterministic engine selects companies.",
      enforced_zh: "LLM 仅辅助行业 grounding；公司选择由确定性引擎完成。",
    },
    {
      id: "bitget_gate",
      label_en: "Bitget tradability gate",
      label_zh: "Bitget 可交易性过滤",
      enforced_en: "Tier A basket = spot API executable; Tier B = App handoff only; no fake API orders.",
      enforced_zh: "Tier A 篮子 = spot API 可执行；Tier B = 仅 App 交接；禁止伪造 API 下单。",
    },
    {
      id: "confidence_cap",
      label_en: "Capped event overlay",
      label_zh: "事件叠加封顶",
      enforced_en: "News/macro/event confidence overlay capped at ±12 points on structural score.",
      enforced_zh: "新闻/宏观/事件置信叠加在结构分上封顶 ±12 分。",
    },
  ];
}

function buildAgentWorkflow(
  profile: IndustryProfile,
  marketResearch: MarketResearch,
  eventIntelligence: EventIntelligence,
  backtest: BacktestValidation,
): AgentWorkflowStep[] {
  const llmConfigured = isLLMConfigured();
  const newsOk = marketResearch.news.status === "verified";
  const macroOk = marketResearch.macro.status === "verified";
  const bitgetOk = profile.companies.some((c) => c.ticker.length > 0);

  return [
    {
      id: "industry_grounding",
      agent_en: "Industry grounding agent",
      agent_zh: "行业 grounding Agent",
      skill: profile.interpretation.inference_mode,
      tools_used: profile.interpretation.web_search_used
        ? ["openai_responses", "web_search"]
        : profile.interpretation.grounding_mode === "curated_rules"
          ? ["curated_sec_ir_links"]
          : ["constrained_rules_engine"],
      status:
        profile.interpretation.grounding_mode === "curated_rules" && !llmConfigured
          ? "partial"
          : "complete",
      detail_en: `Mode=${profile.interpretation.inference_mode}, grounding=${profile.interpretation.grounding_mode ?? "rules"}.`,
      detail_zh: `模式=${profile.interpretation.inference_mode}，grounding=${profile.interpretation.grounding_mode ?? "rules"}。`,
    },
    {
      id: "supply_chain_engine",
      agent_en: "Constrained supply-chain engine",
      agent_zh: "约束式供应链引擎",
      skill: "deterministic-reasoning",
      tools_used: ["role_matcher", "hard_constraints", "thesis_audit"],
      status: "complete",
      detail_en: "Layers, bottleneck, alternatives, and audit trail without LLM ticker selection.",
      detail_zh: "层级、瓶颈、替代假设与审计链——不由 LLM 选 ticker。",
    },
    {
      id: "agent_hub_news",
      agent_en: "Agent Hub — news-briefing",
      agent_zh: "Agent Hub — news-briefing",
      skill: "news-briefing",
      tools_used: marketResearch.tools_used.filter((t) => t.includes("news") || t === "news_feed"),
      status: newsOk ? "complete" : marketResearch.enabled ? "partial" : "skipped",
      detail_en: newsOk
        ? `${marketResearch.news.articles.length} articles @ ${marketResearch.news.fetched_at}`
        : marketResearch.news.warnings[0] ?? "News MCP unavailable.",
      detail_zh: newsOk
        ? `${marketResearch.news.articles.length} 篇文章 @ ${marketResearch.news.fetched_at}`
        : marketResearch.news.warnings[0] ?? "新闻 MCP 不可用。",
      fetched_at: marketResearch.news.fetched_at,
      source_url: marketResearch.mcp_url,
    },
    {
      id: "agent_hub_macro",
      agent_en: "Agent Hub — macro-analyst",
      agent_zh: "Agent Hub — macro-analyst",
      skill: "macro-analyst",
      tools_used: marketResearch.tools_used.filter(
        (t) => !t.includes("news") && t !== "news_feed",
      ),
      status: macroOk ? "complete" : marketResearch.enabled ? "partial" : "skipped",
      detail_en: macroOk
        ? `Verdict=${marketResearch.macro.verdict} @ ${marketResearch.macro.fetched_at}`
        : marketResearch.macro.warnings[0] ?? "Macro MCP unavailable.",
      detail_zh: macroOk
        ? `判定=${marketResearch.macro.verdict} @ ${marketResearch.macro.fetched_at}`
        : marketResearch.macro.warnings[0] ?? "宏观 MCP 不可用。",
      fetched_at: marketResearch.macro.fetched_at,
      source_url: marketResearch.mcp_url,
    },
    {
      id: "event_trace",
      agent_en: "Event intelligence agent",
      agent_zh: "事件情报 Agent",
      skill: "event-extraction",
      tools_used: ["supply_chain_events", "bottleneck_impact", "capped_overlay"],
      status: eventIntelligence.events.length > 0 ? "complete" : "partial",
      detail_en: `${eventIntelligence.events.length} events → action ${eventIntelligence.simulated_decision.action}.`,
      detail_zh: `${eventIntelligence.events.length} 个事件 → 动作 ${eventIntelligence.simulated_decision.action}。`,
    },
    {
      id: "bitget_verify",
      agent_en: "Bitget market verification",
      agent_zh: "Bitget 行情验证",
      skill: "bitget-public-api",
      tools_used: ["symbols", "tickers", "candles"],
      status: backtest.status === "verified" ? "complete" : bitgetOk ? "partial" : "skipped",
      detail_en:
        backtest.status === "verified"
          ? `Backtest verified ${backtest.period}.`
          : "Symbols attached; backtest pending or unavailable.",
      detail_zh:
        backtest.status === "verified"
          ? `回测已验证 ${backtest.period}。`
          : "已挂载 symbols；回测待定或不可用。",
    },
    {
      id: "sim_export",
      agent_en: "Sim decision + evidence export",
      agent_zh: "模拟决策 + 证据导出",
      skill: "paper-portfolio",
      tools_used: ["sim_basket", "sha256_evidence", "judge_self_assessment"],
      status: "complete",
      detail_en: `Selected: ${eventIntelligence.simulated_decision.selected_tickers.join(", ") || "none"}.`,
      detail_zh: `选中：${eventIntelligence.simulated_decision.selected_tickers.join("、") || "无"}。`,
    },
  ];
}

function buildGrowthRoadmap(
  demoConfigured: boolean,
  publicPaper: boolean,
  bitgetOnlineCount: number,
): GrowthRoadmapPhase[] {
  return [
    {
      phase: 1,
      title_en: "Research + sim backtest (now)",
      title_zh: "Research + 模拟回测（当前）",
      status: "live",
      items_en: [
        "Multi-agent workflow with Agent Hub MCP + constrained engine.",
        "Bitget candle backtest, local paper basket, downloadable evidence.",
        `${bitgetOnlineCount > 0 ? bitgetOnlineCount : "50+"} Bitget online stock tokens discoverable.`,
      ],
      items_zh: [
        "Agent Hub MCP + 约束引擎的多 Agent 工作流。",
        "Bitget K 线回测、本地纸交易篮子、可下载证据包。",
        `${bitgetOnlineCount > 0 ? bitgetOnlineCount : "50+"} 个 Bitget 在线 stock token 可发现。`,
      ],
    },
    {
      phase: 2,
      title_en: "Paper trading + rebalance agent",
      title_zh: "纸交易 + 再平衡 Agent",
      status: demoConfigured || publicPaper ? "partial" : "planned",
      items_en: [
        demoConfigured
          ? "Bitget Demo API configured — demo market orders via paptrading=1."
          : "Bitget Demo API ready via BITGET_DEMO_* env (optional upgrade).",
        "Local paper basket execution at live Bitget public prices (enabled).",
        "Rebalance agent plan: periodic rebalance + 15% trailing stop triggers.",
      ],
      items_zh: [
        demoConfigured
          ? "已配置 Bitget Demo API — 可通过 paptrading=1 提交 demo 市价单。"
          : "Bitget Demo API 可通过 BITGET_DEMO_* 环境变量启用。",
        "本地纸交易篮子（Bitget 公开价成交）已启用。",
        "再平衡 Agent 计划：周期性再平衡 + 15% 移动止损触发。",
      ],
    },
    {
      phase: 3,
      title_en: "Event agents + full-market universe",
      title_zh: "事件 Agent + 全市场 universe",
      status: "planned",
      items_en: [
        "Earnings/capacity event agent during reporting season.",
        "Dynamic Bitget symbol discovery beyond fixed research library.",
        "Scheduled autonomous rebalance with human approval gate.",
      ],
      items_zh: [
        "财报季 earnings/产能事件 Agent。",
        "超越固定研究库的 Bitget 动态 symbol 发现。",
        "带人工审批门的定时自主再平衡。",
      ],
    },
  ];
}

function buildRebalanceAgentPlan(
  backtest: BacktestValidation,
  selectedTickers: string[],
): RebalanceAgentPlan {
  const interval =
    backtest.risk_policy?.rebalance_interval_observations ?? 20;
  const stopPct = backtest.risk_policy?.trailing_stop_loss_pct ?? 15;

  return {
    agent_id: "throatscan-rebalance-scheduler-v1",
    status: selectedTickers.length > 0 ? "ready" : "idle",
    policy_en: `Rebalance every ${interval} shared observations; ${stopPct}% trailing stop; 40% max position.`,
    policy_zh: `每 ${interval} 个共同观测日再平衡；${stopPct}% 移动止损；单仓上限 40%。`,
    triggers_en: [
      "Periodic rebalance to max-risk target weights",
      `${stopPct}% trailing stop on open positions`,
      "Paper basket fill after sim decision",
    ],
    triggers_zh: [
      "周期性再平衡至最大风险目标权重",
      `持仓 ${stopPct}% 移动止损`,
      "模拟决策后执行纸交易篮子",
    ],
    next_action_en:
      selectedTickers.length > 0
        ? `Monitor ${selectedTickers.join(", ")} — next rebalance on observation boundary or stop trigger.`
        : "Await sim decision with tradable Bitget symbols.",
    next_action_zh:
      selectedTickers.length > 0
        ? `监控 ${selectedTickers.join("、")} — 下一再平衡在观测边界或止损触发。`
        : "等待含 Bitget 可交易标的的模拟决策。",
    backtest_rebalance_events: backtest.risk_summary?.rebalance_events ?? 0,
  };
}

export async function buildNoveltyPack({
  profile,
  marketResearch,
  eventIntelligence,
  backtest,
  universeCoverage,
  paperDemoConfigured,
  publicPaperEnabled,
  discoveryCandidateCount = 0,
}: {
  profile: IndustryProfile;
  marketResearch: MarketResearch;
  eventIntelligence: EventIntelligence;
  backtest: BacktestValidation;
  universeCoverage: UniverseCoverage;
  paperDemoConfigured: boolean;
  publicPaperEnabled: boolean;
  discoveryCandidateCount?: number;
}): Promise<NoveltyPack> {
  const catalog = await loadEquityCatalog();
  const bitgetOnlineCount = catalog.snapshot.counts.ondo_spot_online;
  const bitgetCatalogTickerCount = catalog.snapshot.counts.total_unique_tickers;
  const bitgetTierACount = catalog.snapshot.counts.ondo_spot_online + catalog.snapshot.counts.rtoken_online;
  const bitgetTierBCount = catalog.snapshot.counts.us_stocks_app;
  const agent_workflow = buildAgentWorkflow(
    profile,
    marketResearch,
    eventIntelligence,
    backtest,
  );
  const hard_constraints = buildHardConstraints();
  const growth_roadmap = buildGrowthRoadmap(
    paperDemoConfigured,
    publicPaperEnabled,
    bitgetOnlineCount,
  );
  const rebalance_agent = buildRebalanceAgentPlan(
    backtest,
    eventIntelligence.simulated_decision.selected_tickers,
  );

  const why_agent_only_en =
    "ThroatScan is not a single LLM prompt or theme screener. It orchestrates parallel Agent Hub news/macro research, constrained supply-chain reasoning, Bitget tradability verification, and risk-managed simulation — with hard gates the LLM cannot bypass.";
  const why_agent_only_zh =
    "ThroatScan 不是单次 LLM 问答或主题筛选器。它并行编排 Agent Hub 新闻/宏观调研、约束式供应链推理、Bitget 可交易性验证与风控模拟——LLM 无法绕过硬约束门槛。";

  const vs_screener_en = [
    "Parallel live MCP research while reasoning runs (not sequential chat).",
    "Structural bottleneck thesis with rejected alternatives — not popularity ranking.",
    "Tradability and evidence export wired to Bitget public API endpoints.",
  ];
  const vs_screener_zh = [
    "推理运行时并行拉取 live MCP 调研（非顺序聊天）。",
    "结构性瓶颈 thesis 含被排除替代方案——非热度排序。",
    "可交易性与证据导出直连 Bitget 公开 API。",
  ];

  return {
    why_agent_only_en,
    why_agent_only_zh,
    vs_traditional_screener_en: vs_screener_en,
    vs_traditional_screener_zh: vs_screener_zh,
    agent_workflow,
    hard_constraints,
    growth_roadmap,
    rebalance_agent,
    bitget_online_stock_token_count: bitgetOnlineCount,
    bitget_catalog_ticker_count: bitgetCatalogTickerCount,
    bitget_tier_a_count: bitgetTierACount,
    bitget_tier_b_count: bitgetTierBCount,
    discovery_candidate_count: discoveryCandidateCount,
    fixed_universe_size: universeCoverage.universe_size,
    mcp_url: marketResearch.mcp_url,
    mcp_tools_used: marketResearch.tools_used,
  };
}
