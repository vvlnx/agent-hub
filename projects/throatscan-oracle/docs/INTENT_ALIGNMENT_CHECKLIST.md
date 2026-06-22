# 初衷对齐检查清单（Intent Alignment Checklist）

基于 `README.md`、`docs/TRACK3_GAP_AUDIT.md`、`docs/TRACK3_ROADMAP.md` 与当前代码结构整理。  
用途：评审、迭代、提交前自检——区分**核心路径**与**扩展层**，避免 Wide/Catalog/规则特例反客为主。

最后更新：2026-06-21

---

## 1. 产品初衷（不可妥协）

| # | 原则 | 一句话 |
|---|------|--------|
| P1 | **瓶颈优先，非主题选股** | 找控制稀缺层级的公司，不是蹭关键词叙事 |
| P2 | **可交易闭环** | 研究结论必须落到 Bitget 可验证的 tokenized 标的 |
| P3 | **可审计** | 推理链、约束门、被拒候选、回测、证据哈希可导出 |
| P4 | **LLM 不选股** | LLM 仅辅助行业理解；ticker 由确定性引擎 + 硬约束产生 |
| P5 | **诚实边界** | 覆盖不足、proxy、无 API 通道必须在 UI/证据里写明 |

**Track 3 评委最关心：** 真问题 → 能跑的 demo → Bitget 数据/工具 → 可验证回测或模拟交易记录 → 可下载证据。

---

## 2. 运行时主链路（核心路径）

以下顺序是「初衷」的权威实现；改功能时优先保证这条链不断。

```text
用户行业输入
  → lib/industryInference.ts          # buildIndustryProfile
  → lib/reasoning/engine.ts             # runReasoningEngine（瓶颈 + 角色匹配）
  → lib/scoring.ts                      # 结构性 throat 分
  → lib/agent.ts                        # analyzeIndustry 编排
  → lib/bitgetStocks.ts                 # attachBitgetEquityEvidence（Tier A/B/C）
  → lib/marketResearch.ts               # Agent Hub 新闻/宏观
  → lib/eventIntelligence.ts            # 事件提取 + 模拟决策
  → lib/backtest.ts                     # Bitget candles 回测（Tier A）
  → lib/thesisAudit.ts                  # 产业链论证复核
  → lib/completeness/buildCompletenessPack.ts  # 四维自评 + 诚实摘要
  → app/page.tsx                        # 展示 + 证据下载
```

**Demo 必走通的最小集合（评委 30 秒路径）：**

1. 输入 `AI chips` / `Semiconductor` / `EV Battery`
2. 看到瓶颈层 + Top 候选 + 审计理由
3. Tier A 标的带 `XXXONUSDT` 在线证据
4. 回测面板有 candles、fee、SPY 基准
5. 下载 evidence JSON，含 API 端点与时间戳

---

## 3. 模块分层地图

### 3.1 核心路径（Core）— 动之前要想清楚

| 模块 | 路径 | 职责 | 对齐原则 |
|------|------|------|----------|
| 编排入口 | `lib/agent.ts` | 单次分析全流程 | P1–P5 |
| 推理引擎 | `lib/reasoning/engine.ts` | 意图 → 四层压力 → 瓶颈 → 角色匹配 | P1, P4 |
| 瓶颈识别 | `lib/reasoning/bottleneckAnalysis.ts` | 主瓶颈层 | P1 |
| 角色匹配 | `lib/reasoning/companyMatcher.ts` | 硬约束门 + 角色排序 | P1, P4 |
| 选择约束 | `lib/reasoning/constraints.ts` | structural control 门槛 | P1 |
| 供应链角色 | `lib/reasoning/supplyRoles.ts` | 六类 supply role 打分 | P1 |
| 审计轨迹 | `lib/reasoning/auditTrail.ts` | why included / why not others | P3 |
| 策展研究库 | `lib/companyUniverse.ts` + `companyUniverseNiche.ts` | Deep 层 ~48+43 核心 + wave 合并 | P1 |
| 打分 | `lib/scoring.ts` | throat 分与 reasoning 对齐 | P1 |
| Bitget 证据 | `lib/bitgetStocks.ts`, `lib/bitgetCache.ts` | spot symbols/tickers | P2 |
| 回测 | `lib/backtest.ts` | 仅 Tier A 可执行标的 | P2, P3 |
| 事件决策 | `lib/eventIntelligence.ts`, `lib/decisionLayer.ts` | 新闻叠加 ±12 cap | P3 |
| Thesis 复核 | `lib/thesisAudit.ts` | 支持/中性/挑战 + next checks | P3 |
| 完整性自评 | `lib/completeness/*` | 四维 rubric + tradability guide | P5 |
| 产业地图 | `lib/industryMap.ts` | 链上阶段可视化 | P1, P3 |
| UI | `app/page.tsx`, `components/Equity*.tsx` | 展示 tier、discovery、证据 | P2, P5 |

### 3.2 扩展层（Expansion）— 补覆盖，不能替代核心

| 模块 | 路径 | 职责 | 允许做什么 | 不允许做什么 |
|------|------|------|------------|--------------|
| Wave1 精策展 | `lib/companyUniverseWave1.ts` | +60 行业广度 | 扩充 Deep 池 | 替代核心 48 家叙事质量 |
| Wave2 模板包 | `lib/companyUniverseWave2.ts`, `data/universe-wave2.json` | +100 模板种子 | 广度；逐步升级 thesis | 冒充手策展 Deep |
| 服务 Deep 补丁 | `lib/companyUniverseServiceDeep.ts` | COST/WMT 等 | 补缺关键标的 | 无限堆模板 |
| 模板加载器 | `lib/universe/templateSeed.ts` | JSON → CompanySeed | 批量入库 | 默认 breakdown 当最终质量 |
| 服务业规则 | `lib/reasoning/serviceIndustryProfiles.ts` | 金融/电信/零售等 profile | 软瓶颈行业匹配 | 变成纯 sector screener |
| 行业别名 | `lib/industryAliases.ts`, `lib/universeCoverage.ts` | 中英文 canonical | 提高命中率 | 伪造 full coverage |
| GICS 扩展 | `lib/gics/tickerMapWaves.ts`, `tickerMapNiche.ts` | 行业分类展示 | UI/导出元数据 | 驱动交易决策 |
| **Equity 三层** | `lib/equity/*` | Tier A/B/C + catalog | 可交易性事实层 | 用 catalog 排名替代 thesis |
| App Catalog | `data/bitget-us-stocks-app-universe.json` | Tier B ~569 ticker | Wide tradability | 声称均有 Deep thesis |
| Sector hints | `data/catalog-sector-hints.json` | Discovery 匹配 | Wide 发现 | 进入回测/自动下单 |
| Discovery | `lib/equity/discovery.ts` | 策展库外 Bitget 名单 | 提示「还能交易谁」 | 自动进 Top5 决策 |
| Paper trading | `lib/paperTrading/*` | Demo API 路径（可选） | Phase 2 故事 | 大赛 demo 主路径 |

### 3.3 支撑 / 可选（Support）

| 模块 | 路径 | 说明 |
|------|------|------|
| LLM 增强 | `lib/llm/*`, `lib/reasoning/generativeLLM.ts` | 无 key 时 rules grounding；不选股 |
| Rules grounding | `lib/rulesModeGrounding.ts` | 策展 demo 行业 SEC/IR |
| i18n | `lib/i18n/*` | 中英文 UI |
| 样例证据 | `public/sample-evidence-ai-chips.json` | 离线评委 |
| 验证脚本 | `scripts/verify-*.mjs`, `scripts/report-matching.mjs` | CI/本地回归 |

---

## 4. Deep / Wide / Tier 对齐表

| 概念 | 代码标识 | 规模（约） | 初衷角色 | Demo 优先级 |
|------|----------|------------|----------|-------------|
| **Deep 研究库** | `analysis_grade: "deep"`, `COMPANY_UNIVERSE` | 253 | 完整瓶颈 thesis | **高** — 主叙事 |
| **Wide Catalog** | `analysis_grade: "wide"`, App JSON | 569 | 仅 tradability | **低** — 补充说明 |
| **Tier A** | `execution_tier: "A"`, `XXXONUSDT` | spot 在线 | 回测 / paper | **最高** — 可验证执行 |
| **Tier B** | `execution_tier: "B"`, App catalog | USDC 手递 | 诚实 handoff | **中** — 产品前瞻，非大赛主证据 |
| **Tier C** | `execution_tier: "C"` | 未上架 | 研究参考 | 标注不可用 |

**守卫规则：**

- [ ] 回测 `lib/backtest.ts` 仍只对 Tier A（或文档明示的 executable）开仓位
- [ ] `event_intelligence.simulated_decision.selected_tickers` 默认 Tier A；Tier B 仅 `app_handoff_tickers`
- [ ] UI 上 Deep badge ≠ 「一定能自动交易」；需同时看 Tier badge
- [ ] Discovery 结果不得 silent merge 进 `selected_tickers` 而无标注

---

## 5. 漂移风险与守卫

| 风险 | 症状 | 守卫动作 |
|------|------|----------|
| **Catalog 反客为主** | Top5 来自 Wide 而非 Deep 角色匹配 | 保持 discovery 与 scoring 路径分离；UI 分开展示 |
| **服务业变选股器** | `serviceIndustryProfiles` 规则持续堆关键词 | 新行业先尝试统一 `supplyRoles`；仅失败再加 profile |
| **Wave2 模板冒充 Deep** | `expansion pack coverage` 类 copy 进 Top3 | 优先升级 Top 命中标的的 `scarce_resource` 三件套 |
| **Tier B 盖过 Tier A** | Demo 强调 App USDC、不提 ONUSDT 回测 | 大赛脚本固定 AI chips / Semi / EV |
| **约束门形同虚设** | `relax_constraints` 扩散到制造/能源 | `relax_constraints` 仅限 `serviceIndustryProfiles` 内 |
| **LLM 越权** | ticker 来自 LLM 输出 | 保持 `companyMatcher` 为唯一选股源；grep `ticker` in llm paths |

---

## 6. 提交前自检（Checklist）

### 6.1 Track 3 硬性项（来自 GAP_AUDIT）

- [ ] 公开 demo 可访问：`https://throatscan-oracle.vercel.app`
- [ ] `/api/health` 正常
- [ ] `docs/SUBMISSION.md` 200 词内项目描述仍准确
- [ ] 至少一条可验证回测/模拟记录（证据 JSON 含 candles、trades、hash）
- [ ] 使用 Bitget 公开 API（symbols / tickers / candles）且端点写入证据
- [ ] 四维 judge 自评面板与 `submission_rubric_self_assessment` 字段存在
- [ ] `honest_summary` 披露固定策展库规模与 proxy 限制
- [ ] （待办）Demo 视频 / 开发日记 / 提交表单 — 人工 deliverable

### 6.2 初衷对齐项

- [ ] `npm run verify:industries` 通过（无跨行业误选）
- [ ] 核心 demo 三行业（AI chips、Semiconductor、EV Battery）Top 候选符合瓶颈叙事
- [ ] 无 OpenAI key 时 grounding 显示 `curated_rules` 或 `none`，不伪造 live search
- [ ] Tier A 标的在 UI 可看到 spread / volume / symbol status
- [ ] Thesis audit verdict 与 event overlay 同屏可见
- [ ] 扩库后 completeness 文案中的公司数量与 `COMPANY_UNIVERSE.length` 一致

### 6.3 扩展层健康项

- [ ] `npx tsx scripts/report-matching.mjs` — 服务业查询有 Deep 结果且无明显误匹配（如 ASTS@电信）
- [ ] Wave2 中 Top 命中 ticker 已具备手策展 `scarce_resource`（见 `data/universe-wave2.json`）
- [ ] `catalog-sector-hints.json` 变更后 discovery 抽检 2–3 个行业
- [ ] 新增 wave 数据不降低核心 48+niche 的叙事质量

---

## 7. 推荐 Demo 脚本（对齐评委视角）

| 顺序 | 动作 | 证明的原则 |
|------|------|------------|
| 1 | 输入 **AI chips** | P1 瓶颈推理 |
| 2 | 展开 **Agent Workflow** + 审计轨迹 | P3、非单 prompt |
| 3 | 指 **NVDAONUSDT** Tier A + 回测 | P2 Bitget 数据 |
| 4 | 下载 **evidence JSON**，指 hash 与 API 字段 | P3 可验证 |
| 5 | 打开 **Completeness / Thesis audit** | P5 诚实边界 |
| 6 | （可选）输入 **医疗服务** 或 **银行金融** | 扩展覆盖，强调 Deep vs Discovery 分工 |
| 7 | （可选）指 Tier B handoff 面板 | 产品路线，**明确不能 API 自动交易** |

---

## 8. 迭代优先级（建议）

当时间有限时，按此顺序保初衷：

1. **保核心路径不断** — `agent.ts` → `engine.ts` → `backtest.ts` → evidence 导出  
2. **保 Tier A demo** — AI chips / Semi / EV Battery 三板斧  
3. **提质不换向** — Wave2 Top 标的补 thesis，而非继续加 ticker 数量  
4. **扩 Wide** — 仅当用户需要更多 Bitget tradability 提示  
5. **加服务业 profile** — 仅当统一 `supplyRoles` 仍无法满足且验收脚本失败  

---

## 9. 关键文件速查

```
核心：     lib/agent.ts  lib/reasoning/*  lib/backtest.ts  lib/thesisAudit.ts
Bitget：   lib/bitgetStocks.ts  lib/bitgetCache.ts  lib/equity/catalog.ts
扩展：     lib/equity/discovery.ts  lib/reasoning/serviceIndustryProfiles.ts
数据：     lib/companyUniverse*.ts  data/universe-wave2.json  data/bitget-us-stocks-app-universe.json
自评：     lib/completeness/*  docs/TRACK3_GAP_AUDIT.md  docs/NOVELTY.md
验证：     scripts/verify-industries.mjs  scripts/report-matching.mjs
```

---

## 10. 相关文档

- [README.md](../README.md) — 问题定义与功能列表  
- [TRACK3_GAP_AUDIT.md](./TRACK3_GAP_AUDIT.md) — 官方要求与完成度  
- [TRACK3_ROADMAP.md](./TRACK3_ROADMAP.md) — 交易闭环与 Bitget 集成  
- [NOVELTY.md](./NOVELTY.md) — Dimension 4 叙事  
- [THESIS_AUDIT_LAYER.md](./THESIS_AUDIT_LAYER.md) — Thesis audit 定位（非交易引擎）  
- [SUBMISSION.md](./SUBMISSION.md) — 提交文案  

---

**结论：** 项目未偏离「瓶颈研究 + Bitget 可验证交易」主轴；本清单用于确保**扩展层永远服务于核心路径**，而不是在 demo 和叙事上取代它。
