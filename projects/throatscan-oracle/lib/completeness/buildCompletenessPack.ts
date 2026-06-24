import type { BacktestValidation } from "../backtest";
import type { EventIntelligence } from "../eventIntelligence";
import type { IndustryProfile } from "../mockData";
import type { MarketResearch } from "../marketResearch";
import type { UniverseCoverage } from "../universeCoverage";
import { isLLMConfigured } from "../llm/config";
import type { Company } from "../types";
import { companyHasBitgetListing } from "../equity/resolver";
import { buildTradabilityGuide } from "./tradabilityGuide";
import { buildNoveltyPack } from "./buildNoveltyPack";
import { getPaperTradingStatus } from "../paperTrading/service";
import type {
  CompletenessPack,
  EndToEndStage,
  JudgeRubricRow,
} from "./types";

const DEFAULT_DEMO_URL = "https://throatscan-oracle.vercel.app";

function publicDemoUrl(): string {
  return process.env.THROATSCAN_PUBLIC_DEMO_URL?.trim() || DEFAULT_DEMO_URL;
}

function githubRepoUrl(): string | null {
  return (
    process.env.THROATSCAN_GITHUB_REPO_URL?.trim() ||
    "https://github.com/vvlnx/agent-hub"
  );
}

function stage(
  id: string,
  label_en: string,
  label_zh: string,
  status: EndToEndStage["status"],
  detail_en: string,
  detail_zh: string,
): EndToEndStage {
  return { id, label_en, label_zh, status, detail_en, detail_zh };
}

function buildEndToEndStages(
  marketResearch: MarketResearch,
  backtest: BacktestValidation,
  eventIntelligence: EventIntelligence,
  companies: Company[],
): EndToEndStage[] {
  const newsStatus = marketResearch.news.status;
  const macroStatus = marketResearch.macro.status;
  const researchStatus: EndToEndStage["status"] =
    newsStatus === "verified" && macroStatus === "verified"
      ? "complete"
      : newsStatus === "unavailable" && macroStatus === "unavailable"
        ? "skipped"
        : "partial";

  const bitgetOnline = companies.some((company) => companyHasBitgetListing(company));

  return [
    stage(
      "industry_input",
      "Industry input → intent",
      "行业输入 → 意图解析",
      "complete",
      "User query normalized with aliases and constrained intent analysis.",
      "用户查询经别名归一化与约束式意图解析。",
    ),
    stage(
      "supply_chain",
      "Supply-chain reasoning",
      "供应链推理",
      "complete",
      "Layers, bottleneck, hard constraints, and audit trail generated.",
      "已生成层级、瓶颈、硬约束与审计链。",
    ),
    stage(
      "agent_hub_research",
      "Agent Hub news + macro",
      "Agent Hub 新闻 + 宏观",
      researchStatus,
      `News=${newsStatus}, macro=${macroStatus}.`,
      `新闻=${newsStatus}，宏观=${macroStatus}。`,
    ),
    stage(
      "bitget_market",
      "Bitget market verification",
      "Bitget 行情验证",
      bitgetOnline ? "complete" : "partial",
      bitgetOnline
        ? "Public symbols/tickers attached to candidates."
        : "Bitget public API unreachable or no online matches.",
      bitgetOnline
        ? "公开 symbols/tickers 已挂载到候选。"
        : "Bitget 公开 API 不可达或无在线匹配。",
    ),
    stage(
      "event_sim",
      "Event trace → sim decision",
      "事件链 → 模拟决策",
      eventIntelligence.simulated_decision.action === "AVOID" ? "partial" : "complete",
      `Action=${eventIntelligence.simulated_decision.action}, tier_a=${eventIntelligence.simulated_decision.selected_tickers.join(", ") || "none"}, tier_b=${eventIntelligence.simulated_decision.app_handoff_tickers.join(", ") || "none"}.`,
      `动作=${eventIntelligence.simulated_decision.action}，Tier A=${eventIntelligence.simulated_decision.selected_tickers.join("、") || "无"}，Tier B=${eventIntelligence.simulated_decision.app_handoff_tickers.join("、") || "无"}。`,
    ),
    stage(
      "backtest",
      "Bitget candle backtest",
      "Bitget K 线回测",
      backtest.status === "verified" ? "complete" : "partial",
      backtest.status === "verified"
        ? `Verified period ${backtest.period}.`
        : "Backtest unavailable for current basket.",
      backtest.status === "verified"
        ? `已验证区间 ${backtest.period}。`
        : "当前篮子无法完成回测。",
    ),
    stage(
      "evidence_export",
      "Evidence bundle export",
      "证据包导出",
      "complete",
      "UI download includes candles, trades, research, thesis audit, and self-assessment.",
      "UI 下载包含 K 线、交易、调研、论证复核与自评。",
    ),
  ];
}

function buildJudgeSelfAssessment(
  coverage: UniverseCoverage,
  backtest: BacktestValidation,
  tradabilityDirect: boolean,
  llmConfigured: boolean,
  groundingMode: string | undefined,
  novelty: import("./types").NoveltyPack,
  paperDemoConfigured: boolean,
  publicPaperEnabled: boolean,
): JudgeRubricRow[] {
  const demoUrl = publicDemoUrl();
  const hasPublicDemo = Boolean(demoUrl);

  return [
    {
      id: "thesis_depth",
      title_en: "Depth of thesis",
      title_zh: "论证深度",
      achieved_en: [
        "Supply-chain bottleneck thesis with alternative hypothesis and thesis audit.",
        "Universe coverage banner shows full/partial/out-of-scope honestly.",
        "Primary-source SEC/IR links in thesis audit.",
        "GICS industry alignment check + Bitget peer discovery via GICS prefix.",
      ],
      achieved_zh: [
        "供应链瓶颈 thesis，含替代假设与论证复核。",
        "覆盖度横幅诚实展示 full/partial/out-of-scope。",
        "论证复核含 SEC/IR 一手证据入口。",
        "GICS 行业对齐校验 + 按 GICS 前缀发现 Bitget 同业。",
      ],
      gaps_en: [
        "Fixed curated research universe (~253 companies); niche queries may be proxy-only.",
        llmConfigured
          ? "LLM web search available when API key is set."
          : "LLM runs in rules/curated grounding mode without live web search.",
        "No automated filing parse — human review still required.",
      ],
      gaps_zh: [
        "固定策展研究库（约 253 家）；冷门行业可能仅为代理映射。",
        llmConfigured
          ? "配置 API Key 后可启用 LLM 联网搜索。"
          : "无 API Key 时为规则/精选 grounding 模式。",
        "尚未自动解析公告——仍需人工阅读。",
      ],
      rating_en: coverage.level === "full" ? "Strong for canonical industries" : "Honest but partial for niche queries",
      rating_zh: coverage.level === "full" ? "已验证行业较强" : "冷门查询诚实但偏部分覆盖",
    },
    {
      id: "runnability",
      title_en: "Runnability",
      title_zh: "可运行性",
      achieved_en: [
        `Public demo: ${demoUrl}`,
        "Bitget public API + backtest + downloadable evidence with SHA-256.",
        "Local paper basket execution at live Bitget prices.",
        "One-click AI chips demo and /api/health verification.",
      ],
      achieved_zh: [
        `公网 Demo：${demoUrl}`,
        "Bitget 公开 API + 回测 + 可下载 SHA-256 证据包。",
        "本地纸交易篮子（Bitget 公开价成交）。",
        "一键 AI chips 与 /api/health 验证。",
      ],
      gaps_en: [
        hasPublicDemo ? "Demo video URL not yet attached in submission pack." : "Public demo URL missing.",
        "Live trading intentionally locked; Bitget Demo API optional (server env).",
      ],
      gaps_zh: [
        hasPublicDemo ? "提交包中尚未附 demo 视频链接。" : "缺少公网 demo URL。",
        "实盘交易刻意锁定；Bitget Demo API 为可选（服务端 env）。",
      ],
      rating_en: "Backtest + local paper (Tier 2); not live trading",
      rating_zh: "回测 + 本地纸交易（Tier 2）；非实盘",
    },
    {
      id: "completeness",
      title_en: "Completeness",
      title_zh: "完整度",
      achieved_en: [
        "End-to-end: input → reasoning → research → Bitget → events → sim → backtest → export.",
        "Low-confidence paths withhold Top 5; missing data not fabricated.",
        "Tradability guide separates research-only vs executable names.",
      ],
      achieved_zh: [
        "端到端：输入 → 推理 → 调研 → Bitget → 事件 → 模拟 → 回测 → 导出。",
        "低置信度不强制 Top 5；缺失数据不伪造。",
        "可交易性指南区分研究结论与可执行标的。",
      ],
      gaps_en: [
        "Submission form, dev diary, and demo video still manual deliverables.",
        tradabilityDirect
          ? "Current run has direct Bitget tradability."
          : "Current run has research-only names without direct Bitget basket.",
      ],
      gaps_zh: [
        "提交表单、开发日记、demo 视频仍为人工交付项。",
        tradabilityDirect
          ? "本次运行有直接 Bitget 可交易标的。"
          : "本次运行仅有研究结论，无直接 Bitget 篮子。",
      ],
      rating_en: "MVP complete with honest boundary disclosure",
      rating_zh: "MVP 完整，边界披露诚实",
    },
    {
      id: "novelty_potential",
      title_en: "Novelty & potential",
      title_zh: "新颖性与潜力",
      achieved_en: [
        novelty.why_agent_only_en,
        `In-app Agent Workflow timeline (${novelty.agent_workflow.length} steps) with MCP tools_used and fetch timestamps.`,
        `Hard constraints enforced: ${novelty.hard_constraints.map((r) => r.id).join(", ")}.`,
        `Growth roadmap Phase 1 live; Phase 2 ${paperDemoConfigured || publicPaperEnabled ? "partial (paper)" : "planned"}.`,
        `Rebalance agent plan ready — ${novelty.rebalance_agent.backtest_rebalance_events} rebalance events in backtest.`,
        `${novelty.bitget_online_stock_token_count} Bitget online stock tokens discoverable beyond ${novelty.fixed_universe_size}-company research library.`,
        githubRepoUrl() ? `Public repo: ${githubRepoUrl()}` : "Public demo with reproducible evidence chain.",
      ],
      achieved_zh: [
        novelty.why_agent_only_zh,
        `应用内 Agent 工作流时间线（${novelty.agent_workflow.length} 步），含 MCP tools_used 与抓取时间。`,
        `硬约束已执行：${novelty.hard_constraints.map((r) => r.id).join("、")}。`,
        `成长路线 Phase 1 已上线；Phase 2 ${paperDemoConfigured || publicPaperEnabled ? "部分（纸交易）" : "规划中"}。`,
        `再平衡 Agent 计划就绪——回测中 ${novelty.rebalance_agent.backtest_rebalance_events} 次再平衡事件。`,
        `${novelty.bitget_online_stock_token_count} 个 Bitget 在线 stock token 可发现，超越 ${novelty.fixed_universe_size} 家公司研究库。`,
        githubRepoUrl() ? `公开仓库：${githubRepoUrl()}` : "公网 Demo + 可复现证据链。",
      ],
      gaps_en: [
        "Autonomous live trading intentionally disabled for hackathon safety.",
        "Phase 3 earnings-season event agent remains on roadmap (scheduled Q3 extension).",
      ],
      gaps_zh: [
        "自主实盘交易因黑客松安全考虑刻意未启用。",
        "Phase 3 财报季事件 Agent 仍在路线图中（计划 Q3 扩展）。",
      ],
      rating_en: "Agent-native research-to-execution — not a single LLM prompt",
      rating_zh: "Agent 原生 research-to-execution — 非单次 LLM 问答",
    },
  ];
}

export async function buildCompletenessPack({
  profile,
  companies,
  marketResearch,
  eventIntelligence,
  backtest,
  universeCoverage,
  discoveryCandidateCount,
  gicsResearch,
}: {
  profile: IndustryProfile;
  companies: Company[];
  marketResearch: MarketResearch;
  eventIntelligence: EventIntelligence;
  backtest: BacktestValidation;
  universeCoverage: UniverseCoverage;
  discoveryCandidateCount?: number;
  gicsResearch?: import("../gics/researchTypes").GicsResearch;
}): Promise<CompletenessPack> {
  const tradability_guide = await buildTradabilityGuide(profile, companies, eventIntelligence);
  const paperStatus = await getPaperTradingStatus();
  const novelty = await buildNoveltyPack({
    profile,
    marketResearch,
    eventIntelligence,
    backtest,
    universeCoverage,
    paperDemoConfigured: paperStatus.demo_configured,
    publicPaperEnabled: paperStatus.mode === "local_paper" || paperStatus.mode === "bitget_demo",
    discoveryCandidateCount,
    gicsResearch,
  });
  const end_to_end_stages = buildEndToEndStages(
    marketResearch,
    backtest,
    eventIntelligence,
    companies,
  );
  const judge_self_assessment = buildJudgeSelfAssessment(
    universeCoverage,
    backtest,
    tradability_guide.direct_execution_available,
    isLLMConfigured(),
    profile.interpretation.grounding_mode,
    novelty,
    paperStatus.demo_configured,
    paperStatus.mode === "local_paper" || paperStatus.mode === "bitget_demo",
  );

  const completeStages = end_to_end_stages.filter((s) => s.status === "complete").length;
  const honest_summary_en = `ThroatScan completed ${completeStages}/${end_to_end_stages.length} end-to-end stages. ${tradability_guide.summary_en} This is research software with verifiable Bitget evidence — not financial advice.`;
  const honest_summary_zh = `ThroatScan 完成 ${completeStages}/${end_to_end_stages.length} 个端到端阶段。${tradability_guide.summary_zh} 这是带可验证 Bitget 证据的研究软件——不构成投资建议。`;

  return {
    schema_version: "throatscan-completeness-v1",
    public_demo_url: publicDemoUrl(),
    github_repo_url: githubRepoUrl(),
    end_to_end_stages,
    judge_self_assessment,
    tradability_guide,
    novelty,
    honest_summary_en,
    honest_summary_zh,
    generated_at: new Date().toISOString(),
  };
}
