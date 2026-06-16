/** English engine output → Chinese reference translation. Search/reasoning stays English. */

const SUPPLY_ROLE_ZH: Record<string, string> = {
  compute_provider: "算力提供者",
  equipment_supplier: "设备供应商",
  material_bottleneck: "材料瓶颈",
  downstream_consumer: "下游消费者",
  infrastructure_enabler: "基础设施赋能者",
  platform_controller: "平台控制者",
  "Compute provider": "算力提供者",
  "Equipment supplier": "设备供应商",
  "Material bottleneck": "材料瓶颈",
  "Downstream consumer": "下游消费者",
  "Infrastructure enabler": "基础设施赋能者",
  "Platform controller": "平台控制者",
};

const LAYER_ZH: Record<string, string> = {
  demand: "需求层",
  infrastructure: "基础设施层",
  core_technology: "核心技术层",
  materials: "材料/上游层",
  "Demand / downstream": "需求/下游",
  Infrastructure: "基础设施",
  "Core technology": "核心技术",
  "Materials / upstream": "材料/上游",
};

const SECTOR_TAG_ZH: Record<string, string> = {
  "Physical Supply Chain": "物理供应链",
  "Digital Infrastructure": "数字基础设施",
  "Regulated Workflow": "监管型工作流",
  "Open-domain Industry": "开放域行业",
};

const CONSTRAINT_ZH: Record<string, string> = {
  bottleneck_resource_control: "瓶颈资源控制力",
  irreplaceable_1_3_years: "1–3 年难替代",
  high_switching_cost: "高切换成本依赖",
  structural_position: "结构性供应链位置",
  supply: "供应约束",
  switching: "切换成本",
  capacity: "产能约束",
  "bottleneck resource control": "瓶颈资源控制力",
  "irreplaceable 1 3 years": "1–3 年内难替代",
  "high switching cost": "高切换成本",
  "structural position": "结构性供应链位置",
};

const PHRASE_RULES: Array<[RegExp, string]> = [
  [/Constrained generative ThroatScan \[HIGH\]/g, "约束式生成式 ThroatScan【高置信度】"],
  [/Constrained generative ThroatScan \[LOW\]/g, "约束式生成式 ThroatScan【低置信度】"],
  [/Open-world generative ThroatScan/g, "开放域生成式 ThroatScan"],
  [/uncertain mapping/gi, "不确定映射"],
  [/LOW CONFIDENCE/g, "低置信度"],
  [/HIGH CONFIDENCE/g, "高置信度"],
  [/\bLOW\b/g, "低"],
  [/\bMEDIUM\b/g, "中"],
  [/\bHIGH\b/g, "高"],
  [/Primary choke point at/g, "Primary 控制点位于"],
  [/\bPrimary\b/g, "主要"],
  [/\bAlternative\b/g, "备选"],
  [/Top 5/g, "前 5 名"],
  [/choke points?/gi, "瓶颈点"],
  [/Physical throughput and qualified-input scale for/g, "物理吞吐与合格投入规模 —"],
  [/Digital workload growth and platform deployment for/g, "数字工作负载增长与平台部署 —"],
  [/Regulated commercialization and compliance-limited scale for/g, "监管商业化与合规限制规模 —"],
  [/End-market pull driven by/g, "终端需求拉动 —"],
  [/General industrial demand scaling for/g, "一般工业需求扩张 —"],
  [/open-domain supply chain/g, "开放域供应链"],
  [/Composite pressure:/g, "综合压力："],
  [/Highest composite pressure at/g, "综合压力最高位于"],
  [/supply is constrained/g, "供应受约束"],
  [/switching costs are highest/g, "切换成本最高"],
  [/production\/deployment capacity is limited/g, "生产/部署产能受限"],
  [/Included as/g, "纳入为"],
  [/with (\d+)\/100 role fit/g, "角色匹配 $1/100"],
  [/(\d+)\/100 role fit/g, "角色匹配 $1/100"],
  [/(\d+)\/100 sector fit/g, "行业匹配 $1/100"],
  [/for Ai Chips value chain/gi, "面向 AI 芯片价值链"],
  [/Ai Chips value chain/gi, "AI 芯片价值链"],
  [/value chain/gi, "价值链"],
  [/Hard constraints satisfied:/g, "满足硬约束："],
  [/Direct control over bottleneck resource/g, "对瓶颈资源的直接控制"],
  [/Irreplaceable in 1–3 years/g, "1–3 年内难替代"],
  [/High switching-cost dependency/g, "高切换成本依赖"],
  [/Structural supply chain position/g, "结构性供应链位置"],
  [/Excluded — fails hard constraint gate/g, "排除 — 未通过硬约束门"],
  [/Excluded — weak sector overlap/g, "排除 — 行业重叠度弱"],
  [/Excluded — lower role fit/g, "排除 — 角色匹配较低"],
  [/Excluded — lower composite score/g, "排除 — 综合分较低"],
  [/Selected for this role slot\./g, "已选入该角色槽位。"],
  [/No alternative candidates passed constraint and role thresholds for this slot\./g, "没有其他候选同时通过该位置的约束与角色阈值。"],
  [/No alternative candidates 通过 constraint and role thresholds for this slot\./g, "没有其他候选同时通过该位置的约束与角色阈值。"],
  [/met:/g, "满足："],
  [/partial list only; do not treat as full/g, "仅为部分名单；不可视为完整"],
  [/Strong role, sector, and constraint alignment\./g, "角色、行业与约束高度一致。"],
  [/weak sector overlap for this query/g, "对本查询行业重叠弱"],
  [/proxy mapping — not a direct industry fit/g, "代理映射 — 非直接行业匹配"],
  [/role sits off the primary bottleneck layer/g, "角色偏离主要瓶颈层"],
  [/moderate role fit only/g, "角色匹配仅为中等"],
  [/replaceable within 1–3 years/g, "1–3 年内可替代"],
  [/No credible alternative at current constraint focus\./g, "当前约束焦点下无可信替代理论。"],
  [/If supply\/material qualification becomes the binding constraint/g, "若供应/材料认证成为绑定约束"],
  [/If switching-cost \/ platform lock-in dominates over capacity/g, "若切换成本/平台锁定主导产能"],
  [/If deployment capacity — not technology allocation — caps output/g, "若部署产能（非技术分配）限制产出"],
  [/Captures hidden supply chain control points/g, "捕捉隐藏供应链控制点"],
  [/Identifies non-obvious market power/g, "识别非显而易见市场权力"],
  [/Focuses on structural dependency/g, "聚焦结构性依赖"],
  [/Traditional equity screening/g, "传统股票筛选"],
  [/ThroatScan bottleneck screening/g, "ThroatScan 瓶颈筛选"],
  [/Ranks visible financial momentum/g, "按可见财务动量排序"],
  [/Ranks visible financial momentum — often misses who actually controls scarce inputs\./g, "按可见财务动量排序，往往遗漏真正控制稀缺投入的公司。"],
  [/Surfaces structural choke points even when financial multiples look ordinary\./g, "即使财务估值看似普通，也能识别结构性瓶颈。"],
  [/Surfaces structural choke points/g, "揭示结构性瓶颈点"],
  [/P\/E ratio/g, "市盈率 P/E"],
  [/EPS growth/g, "EPS 增长"],
  [/Revenue momentum/g, "营收动量"],
  [/Supply chain control/g, "供应链控制力"],
  [/Bottleneck dependency/g, "瓶颈依赖度"],
  [/Replaceability \(1–3 years\)/g, "可替代性（1–3 年）"],
  [/Captures hidden supply chain control points that P\/E and EPS screens cannot see\./g, "识别传统 P/E 与 EPS 筛选无法发现的隐藏供应链控制点。"],
  [/Identifies non-obvious market power — bottlenecks are often upstream, not the brand-name end user\./g, "识别不明显的市场控制力：瓶颈通常位于上游，而非知名终端品牌。"],
  [/Focuses on structural dependency and replaceability instead of price-based metrics alone\./g, "重点分析结构性依赖与可替代性，而非只看价格和财务指标。"],
  [/In this industry, the real control point is/g, "在本行业中，真正控制点是"],
  [/because/g, "因为"],
  [/Mapped via reasoning to/g, "经推理映射至"],
  [/Context:/g, "上下文："],
  [/Controls scarce GPU allocation and the CUDA software stack for AI workloads/g, "控制稀缺 GPU 配额以及 AI 工作负载所依赖的 CUDA 软件栈"],
  [/Controls scarce/g, "控制稀缺"],
  [/cannot scale without/g, "无此难以规模化"],
  [/Primary bottleneck node:/g, "Primary 瓶颈节点："],
  [/True choke point:/g, "真正 choke point："],
  [/Reasoning sectors:/g, "推理行业标签："],
  [/High-ranked but not choke points:/g, "高分但非 choke point："],
  [/layer scores nearly tied/g, "层级分数接近"],
  [/bottleneck layer is ambiguous/g, "瓶颈层级存在歧义"],
  [/no company mapped directly to primary bottleneck layer/g, "无公司直接映射至 Primary 瓶颈层"],
  [/open-domain query — sector signals are diffuse/g, "开放域查询 — 行业信号分散"],
  [/Clear separation at/g, "清晰分离于"],
  [/(\d+)\/(\d+) downstream picks — within acceptable range\./g, "$1/$2 个候选属于下游，处于可接受范围。"],
  [/Upstream\/equipment\/compute roles are represented in the candidate set\./g, "候选集合已覆盖上游、设备或算力角色。"],
  [/([A-Z0-9.]+) shows structural control \(strength ([\d.]+), replaceability ([\d.]+)\)\./g, "$1 具备结构性控制力（瓶颈强度 $2，可替代性 $3）。"],
  [/Supply stress may sit upstream \(fab\/materials\) even while technology layer scores highest\./g, "即使技术层得分最高，供应压力仍可能位于上游晶圆厂或材料环节。"],
  [/Constraint typed as supply-limited/g, "约束类型判定为供应受限"],
  [/Bottleneck layer is core technology \(not materials\)/g, "瓶颈层位于核心技术，而不是材料层"],
  [/unfilled roles:/g, "尚未覆盖的角色："],
  [/Treat candidates as proxies;/g, "应将候选视为代理标的；"],
  [/may be incomplete/g, "可能不完整"],
  [/Did we over-select downstream companies\?/g, "是否过度选择下游公司？"],
  [/Did we miss upstream constraints\?/g, "是否遗漏上游约束？"],
  [/Is bottleneck truly structural\?/g, "瓶颈是否真正具有结构性？"],
  [/passed/g, "通过"],
  [/Needs review/g, "需复核"],
  [/Demand driver:/g, "需求驱动："],
  [/Primary layer ranking:/g, "Primary 层级排序："],
  [/layer ranking/g, "层级排序"],
  [/supply constraint/g, "供应约束"],
  [/supply-limited/g, "供应受限"],
  [/Bottleneck layer is/g, "瓶颈层级为"],
  [/Supply stress may sit upstream \(fab\/材料\/上游层\) even while technology layer scores highest\./g, "即使技术层得分最高，供应压力仍可能位于上游晶圆厂或材料环节。"],
  [/Bottleneck layer:/g, "瓶颈层级："],
  [/vs/g, "对比"],
  [/withheld/g, "暂不展示"],
  [/none/g, "无"],
  [/Top:/g, "Top："],
  [/Unknown/g, "未知"],
  [/A — Industry interpretation:/g, "A — 行业解读："],
  [/B — Supply chain layers \(fixed schema\):/g, "B — 供应链层级（固定结构）："],
  [/C — Bottleneck identification:/g, "C — 瓶颈识别："],
  [/D — Company candidates \(role \+ constraint gate\):/g, "D — 公司候选（角色与约束门）："],
  [/E — Final ranking:/g, "E — 最终排名："],
  [/end market:/g, "终端市场："],
  [/signals:/g, "信号："],
  [/run:/g, "运行："],
  [/each must satisfy ≥1 hard constraint/g, "每个候选必须满足至少 1 项硬约束"],
  [/Constrained role-based selection for/g, "基于约束与角色的候选选择，面向"],
  [/Demand Layer/g, "需求层"],
  [/Core Technology Layer/g, "核心技术层"],
  [/Materials Layer/g, "材料层"],
  [/Infrastructure Layer/g, "基础设施层"],
  [/Downstream adoption and deployment pace set effective industry output\./g, "下游采用与部署速度决定行业的有效产出。"],
  [/Deployment rails that translate ai chips value chain demand into usable capacity \(network, cloud, grid, distribution\)\./gi, "将 AI 芯片价值链需求转化为可用产能的部署基础设施，包括网络、云、供电与分发。"],
  [/Deployment rails that translate AI 芯片价值链 需求层 into usable capacity \(network, cloud, grid, distribution\)\./gi, "将 AI 芯片价值链需求转化为可用产能的部署基础设施，包括网络、云、电网与分发。"],
  [/Differentiated technology and platform control points that throttle how fast "AI Chips" can scale\./g, "差异化技术与平台控制点决定 AI 芯片扩张速度。"],
  [/Physical inputs and qualified materials feeding ai chips value chain — often the first hard constraint at scale\./gi, "为 AI 芯片价值链提供的物理投入与合格材料，通常是规模化时最先出现的硬约束。"],
  [/Controls scarce GPU allocation and the CUDA software stack for AI workloads\./g, "控制稀缺 GPU 配额以及 AI 工作负载所依赖的 CUDA 软件栈。"],
  [/Controls scarce GPU allocation and the CUDA software stack for AI workloads/g, "控制稀缺 GPU 配额以及 AI 工作负载所依赖的 CUDA 软件栈"],
  [/Large-scale AI training and inference cannot scale without NVIDIA-class accelerators today\./g, "当前大规模 AI 训练与推理离不开 NVIDIA 级加速器。"],
  [/AMD and custom ASICs reduce but do not remove dependence within 1–3 years\./g, "AMD 与定制 ASIC 可降低依赖，但未来 1–3 年内无法消除依赖。"],
  [/Leading-edge wafer starts are concentrated and gate every fabless design ramp\./g, "先进制程晶圆投片高度集中，制约所有无晶圆厂芯片设计的扩产。"],
  [/Leading-edge wafer starts are concentrated and gate every fabless design ramp/g, "先进制程晶圆投片高度集中，制约所有无晶圆厂芯片设计的扩产"],
  [/Advanced AI and mobile silicon cannot scale without foundry allocation\./g, "先进 AI 与移动芯片若无晶圆代工产能配额便难以扩产。"],
  [/Geographic diversification progresses but remains constrained over 1–3 years\./g, "地理多元化正在推进，但未来 1–3 年仍受限制。"],
  [/Important in custom AI ASIC and networking niches with design lock-in\./g, "在定制 AI ASIC 与网络领域具有重要地位，并形成设计锁定。"],
  [/Important in custom AI ASIC and networking niches with design lock-in/g, "在定制 AI ASIC 与网络领域具有重要地位，并形成设计锁定"],
  [/Broader AI buildout proceeds without any single Broadcom SKU\./g, "更广泛的 AI 建设并不依赖某一个 Broadcom 单品。"],
  [/Hyperscale programs can re-architect away from specific parts in 2–3 years\./g, "超大规模项目可在 2–3 年内重新设计以替换特定部件。"],
  [/AI Compute — accelerator allocation and CUDA stack/g, "AI 算力 — 加速器配额与 CUDA 软件栈"],
  [/Foundry — advanced-node wafer starts/g, "晶圆代工 — 先进制程投片"],
  [/Custom silicon and networking/g, "定制芯片与网络"],
];

const CLEANUP_RULES: Array<[RegExp, string]> = [
  [/\bPrimary\b/g, "主要"],
  [/\bChips\b/g, "芯片"],
  [/\bDigital\b/g, "数字"],
  [/Physical Supply Chain/g, "物理供应链"],
  [/Digital Infrastructure/g, "数字基础设施"],
  [/Regulated Workflow/g, "监管型工作流"],
  [/Open-domain Industry/g, "开放域行业"],
  [/\bconf\b/g, "置信度"],
  [/\b([A-Z][A-Z0-9.]*) as /g, "$1 作为 "],
  [/bottleneck_resource_control/g, "瓶颈资源控制力"],
  [/irreplaceable_1_3_years/g, "1–3 年内难替代"],
  [/high_switching_cost/g, "高切换成本依赖"],
  [/structural_position/g, "结构性供应链位置"],
  [/Uncertainty flag:/g, "不确定性标记："],
  [/Constrained role-based selection\s*面向/g, "基于硬约束和角色进行候选选择，面向"],
  [/Constrained role-based selection/g, "基于硬约束和角色进行候选选择"],
  [/platform or technology allocation with high switching friction/gi, "平台或技术配额具有较高切换阻力"],
  [/Deployment rails that translate AI 芯片价值链 需求层 into usable capacity \(network, cloud, grid, distribution\)/gi, "将 AI 芯片价值链需求转化为可用产能的部署基础设施，包括网络、云、电网与分发"],
  [/Physical inputs and qualified 材料\/上游层 feeding AI 芯片价值链 — often the first hard constraint at scale/gi, "为 AI 芯片价值链提供的物理投入与合格材料，通常是规模化时最先出现的硬约束"],
  [/Large-scale AI training and inference 无此难以规模化 NVIDIA-class accelerators today/gi, "当前大规模 AI 训练与推理离不开 NVIDIA 级加速器"],
  [/Advanced AI and mobile silicon 无此难以规模化 foundry allocation/gi, "先进 AI 与移动芯片若无晶圆代工产能配额便难以扩产"],
  [/True choke point/gi, "真正瓶颈控制点"],
  [/choke point/gi, "瓶颈控制点"],
  [/主要 层级排序/g, "主要瓶颈层排序"],
  [/通过(\d+\/\d+)/g, "通过：$1"],
  [/for "([^"]+)":/g, "面向“$1”："],
];

export function translateSupplyRole(label: string): string {
  return SUPPLY_ROLE_ZH[label] ?? label;
}

export function translateLayer(label: string): string {
  return LAYER_ZH[label] ?? label;
}

export function translateSectorTag(tag: string): string {
  return SECTOR_TAG_ZH[tag] ?? translateEngineText(tag);
}

export function translateConstraint(label: string): string {
  return CONSTRAINT_ZH[label] ?? label.replace(/_/g, " ");
}

export function translateEngineText(text: string): string {
  if (!text) return text;
  let out = text;
  for (const [pattern, replacement] of PHRASE_RULES) {
    out = out.replace(pattern, replacement);
  }
  for (const [en, zh] of Object.entries(SUPPLY_ROLE_ZH)) {
    if (en.length > 3) out = out.replaceAll(en, zh);
  }
  for (const [en, zh] of Object.entries(LAYER_ZH)) {
    if (en.length > 3) out = out.replaceAll(en, zh);
  }
  for (const [pattern, replacement] of CLEANUP_RULES) {
    out = out.replace(pattern, replacement);
  }
  return out;
}
