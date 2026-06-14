import type { IndustryId } from "../mockData";
import type { ThroatRole } from "../types";
import type { Locale } from "./types";

type TextPair = { en: string; zh: string };

function pick(pair: TextPair, locale: Locale): string {
  return locale === "zh" ? pair.zh : pair.en;
}

export const industrySummaries: Record<IndustryId, TextPair> = {
  Semiconductors: {
    en: "ThroatScan identifies where wafer tools, advanced packaging, and accelerator allocation bind the semiconductor supply chain.",
    zh: "ThroatScan 定位晶圆设备、先进封装与加速器分配如何卡住半导体供应链。",
  },
  "AI Data Centers": {
    en: "ThroatScan traces AI cluster deployment from accelerator allocation through fabric bandwidth and site power constraints.",
    zh: "ThroatScan 追踪 AI 集群从加速器分配、网络带宽到机房电力约束的部署瓶颈。",
  },
  "Cloud Software": {
    en: "ThroatScan maps digital bottlenecks where identity, data gravity, and control planes gate enterprise AI deployment.",
    zh: "ThroatScan 映射身份、数据重力与控制平面如何形成企业 AI 部署的数字瓶颈。",
  },
};

export const bottleneckLocations: Record<IndustryId, TextPair> = {
  Semiconductors: {
    en: "Fabless Design — AI accelerator allocation layer",
    zh: "无晶圆设计 — AI 加速器分配层",
  },
  "AI Data Centers": {
    en: "AI Compute Silicon — GPU/accelerator shipment gate",
    zh: "AI 计算芯片 — GPU/加速器出货闸门",
  },
  "Cloud Software": {
    en: "Hyperscale Infrastructure — cloud identity and control plane",
    zh: "超大规模基础设施 — 云身份与控制平面",
  },
};

export const chainNodes: Record<
  IndustryId,
  Array<{ name: TextPair; description: TextPair; stage: "upstream" | "midstream" | "downstream" }>
> = {
  Semiconductors: [
    {
      name: { en: "EDA & IP", zh: "EDA 与 IP" },
      description: {
        en: "Design entry point — limited vendors gate every advanced tape-out",
        zh: "设计入口 — 少数厂商 gate 每一次先进流片",
      },
      stage: "upstream",
    },
    {
      name: { en: "Wafer Fab Equipment", zh: "晶圆制造设备" },
      description: {
        en: "Etch/deposition/lithography tools with multi-quarter lead times",
        zh: "刻蚀/沉积/光刻设备，交期常达数个季度",
      },
      stage: "upstream",
    },
    {
      name: { en: "Foundry & IDM", zh: "代工与 IDM" },
      description: {
        en: "Advanced-node wafer starts — the physical throughput ceiling",
        zh: "先进制程晶圆投产 — 物理产能天花板",
      },
      stage: "midstream",
    },
    {
      name: { en: "Fabless Design", zh: "无晶圆设计" },
      description: {
        en: "Accelerator and networking silicon that sets downstream demand",
        zh: "决定下游需求的加速器与网络芯片设计",
      },
      stage: "midstream",
    },
    {
      name: { en: "Packaging & Test", zh: "封装与测试" },
      description: {
        en: "CoWoS, HBM stacking, and OSAT capacity for AI packages",
        zh: "CoWoS、HBM 堆叠与 OSAT 的 AI 封装产能",
      },
      stage: "downstream",
    },
  ],
  "AI Data Centers": [
    {
      name: { en: "AI Compute Silicon", zh: "AI 计算芯片" },
      description: {
        en: "GPU/accelerator supply sets the primary cluster throughput ceiling",
        zh: "GPU/加速器供给决定集群算力上限",
      },
      stage: "upstream",
    },
    {
      name: { en: "Server & Rack Systems", zh: "服务器与机架系统" },
      description: {
        en: "Integration layer translating silicon into deployable AI racks",
        zh: "将芯片集成为可部署 AI 机架的整合层",
      },
      stage: "midstream",
    },
    {
      name: { en: "Networking Fabric", zh: "网络 fabric" },
      description: {
        en: "Scale-out bandwidth — congestion here caps effective cluster size",
        zh: "横向扩展带宽 — 此处拥塞限制有效集群规模",
      },
      stage: "midstream",
    },
    {
      name: { en: "Power & Thermal", zh: "电力与散热" },
      description: {
        en: "PDU, UPS, and liquid cooling — physical site-level choke points",
        zh: "PDU、UPS 与液冷 — 机房层面的物理瓶颈",
      },
      stage: "downstream",
    },
    {
      name: { en: "Colocation & Infrastructure", zh: "托管与基础设施" },
      description: {
        en: "Power-dense floor space and cross-connect availability",
        zh: "高功率机位与互联资源可用性",
      },
      stage: "downstream",
    },
  ],
  "Cloud Software": [
    {
      name: { en: "Hyperscale Infrastructure", zh: "超大规模基础设施" },
      description: {
        en: "Compute, identity, and developer control planes that anchor workloads",
        zh: "锚定工作负载的计算、身份与开发者控制平面",
      },
      stage: "upstream",
    },
    {
      name: { en: "Data & Security Platforms", zh: "数据与安全平台" },
      description: {
        en: "Telemetry, data gravity, and zero-trust enforcement layers",
        zh: "遥测、数据重力与零信任 enforcement 层",
      },
      stage: "midstream",
    },
    {
      name: { en: "Workflow Applications", zh: "工作流应用" },
      description: {
        en: "Business process systems with high switching friction",
        zh: "切换成本高的业务流程系统",
      },
      stage: "downstream",
    },
  ],
};

type CompanyContent = {
  chain_position: TextPair;
  why: {
    scarce_resource: TextPair;
    can_function_without: TextPair;
    replaceability_1_to_3_years: TextPair;
  };
};

export const companyContent: Record<string, CompanyContent> = {
  "Semiconductors|NVDA": {
    chain_position: {
      en: "Fabless Design — AI accelerator orchestration layer",
      zh: "无晶圆设计 — AI 加速器编排层",
    },
    why: {
      scarce_resource: {
        en: "Controls scarce H100/B200 GPU allocation and CUDA software stack access.",
        zh: "控制 scarce 的 H100/B200 GPU 分配与 CUDA 软件栈访问。",
      },
      can_function_without: {
        en: "Hyperscale AI training cannot run at planned scale without NVIDIA-class accelerators today.",
        zh: "当今超大规模 AI 训练若无 NVIDIA 级加速器，无法按规划规模运行。",
      },
      replaceability_1_to_3_years: {
        en: "Partial alternatives (AMD, custom ASIC) emerge in 2–3 years but cannot fully replace software + supply depth.",
        zh: "2–3 年内出现 AMD、定制 ASIC 等替代，但难以完全替代软件与供给深度。",
      },
    },
  },
  "Semiconductors|AMAT": {
    chain_position: {
      en: "Wafer Fab Equipment — deposition and materials engineering",
      zh: "晶圆设备 — 沉积与材料工程",
    },
    why: {
      scarce_resource: {
        en: "Owns critical deposition and materials steps with long install-base lock-in.",
        zh: "掌握关键沉积与材料步骤，装机基础锁定强。",
      },
      can_function_without: {
        en: "Fabs can slow ramps without AMAT tools, but multiple WFE vendors share the chain.",
        zh: "无 AMAT 设备晶圆厂扩产会放缓，但 WFE 厂商并非单一来源。",
      },
      replaceability_1_to_3_years: {
        en: "Tooling mix can shift across vendors over 2–3 years; not a single-vendor software choke.",
        zh: "2–3 年内设备组合可在厂商间调整；非单一软件型 choke。",
      },
    },
  },
  "Semiconductors|LRCX": {
    chain_position: {
      en: "Wafer Fab Equipment — etch and deposition systems",
      zh: "晶圆设备 — 刻蚀与沉积系统",
    },
    why: {
      scarce_resource: {
        en: "Etch capacity is concentrated and required for advanced 3D structures.",
        zh: "刻蚀产能集中，先进 3D 结构必需。",
      },
      can_function_without: {
        en: "Node transitions stall if etch throughput is unavailable, yet fabs can dual-source over time.",
        zh: "刻蚀产能不足会卡住制程迁移，但晶圆厂可逐步双源化。",
      },
      replaceability_1_to_3_years: {
        en: "Replaceable in portions of the fab line within 2–3 years with planning and qualification cycles.",
        zh: "经规划与认证周期，产线部分环节可在 2–3 年内替代。",
      },
    },
  },
  "Semiconductors|KLAC": {
    chain_position: {
      en: "Wafer Fab Equipment — process control and inspection",
      zh: "晶圆设备 — 制程控制与检测",
    },
    why: {
      scarce_resource: {
        en: "Inspection tools protect yield on expensive wafers but are not single-source for all steps.",
        zh: "检测工具保障昂贵晶圆良率，但并非所有步骤单一来源。",
      },
      can_function_without: {
        en: "Fabs lose yield without metrology, yet production continues at lower efficiency.",
        zh: "无计量检测良率下降，但产线仍可低效运转。",
      },
      replaceability_1_to_3_years: {
        en: "Competitive inspection vendors and reuse extend replaceability inside 1–3 years.",
        zh: "竞争厂商与复用使 1–3 年内具备一定可替代性。",
      },
    },
  },
  "Semiconductors|AVGO": {
    chain_position: {
      en: "Fabless Design — custom ASIC and networking silicon",
      zh: "无晶圆设计 — 定制 ASIC 与网络芯片",
    },
    why: {
      scarce_resource: {
        en: "Important in custom AI ASIC and networking niches with design lock-in.",
        zh: "在定制 AI ASIC 与网络细分领域有设计锁定。",
      },
      can_function_without: {
        en: "Broader AI buildout proceeds without any single Broadcom SKU.",
        zh: " broader AI 建设不依赖任一 Broadcom SKU。",
      },
      replaceability_1_to_3_years: {
        en: "Hyperscale programs can re-architect away from specific Broadcom parts in 2–3 years.",
        zh: "超大规模项目可在 2–3 年内重构，避开特定 Broadcom 部件。",
      },
    },
  },
  "Semiconductors|AMD": {
    chain_position: {
      en: "Fabless Design — GPU/CPU alternative path",
      zh: "无晶圆设计 — GPU/CPU 替代路径",
    },
    why: {
      scarce_resource: {
        en: "Consumes the same fab, packaging, and HBM capacity as the broader chain.",
        zh: "消耗与全链相同的 fab、封装与 HBM 产能。",
      },
      can_function_without: {
        en: "Acts as relief valve for GPU demand but does not control upstream scarce tools.",
        zh: "缓解 GPU 需求压力，但不控制上游 scarce 设备。",
      },
      replaceability_1_to_3_years: {
        en: "Already substituting for NVIDIA in select workloads; replaceability of AMD itself is high.",
        zh: "已在部分场景替代 NVIDIA；AMD 本身可替代性高。",
      },
    },
  },
  "Semiconductors|QCOM": {
    chain_position: {
      en: "Fabless Design — mobile and edge connectivity",
      zh: "无晶圆设计 — 移动与边缘连接",
    },
    why: {
      scarce_resource: {
        en: "No scarce resource central to hyperscale AI accelerator supply.",
        zh: "不掌握超大规模 AI 加速器供给的核心 scarce 资源。",
      },
      can_function_without: {
        en: "AI data-center and advanced-node cycles function without Qualcomm participation.",
        zh: "AI 数据中心与先进制程周期无需 Qualcomm 参与亦可运转。",
      },
      replaceability_1_to_3_years: {
        en: "Highly replaceable across mobile and edge vendors within 1–3 years.",
        zh: "1–3 年内在移动/边缘厂商间高度可替代。",
      },
    },
  },
  "Semiconductors|MRVL": {
    chain_position: {
      en: "Fabless Design — data infrastructure PHY and custom silicon",
      zh: "无晶圆设计 — 数据基础设施 PHY 与定制芯片",
    },
    why: {
      scarce_resource: {
        en: "Participates in networking silicon without controlling allocation of scarce AI GPUs or WFE.",
        zh: "参与网络芯片，但不控制 AI GPU 或 WFE 分配。",
      },
      can_function_without: {
        en: "Supply chain continues if Marvell slots are substituted in networking designs.",
        zh: "网络设计替换 Marvell 槽位后供应链仍可运转。",
      },
      replaceability_1_to_3_years: {
        en: "Design wins rotate among networking silicon vendors within 1–3 years.",
        zh: "1–3 年内网络芯片设计订单可在厂商间轮换。",
      },
    },
  },
  "AI Data Centers|NVDA": {
    chain_position: {
      en: "AI Compute Silicon — cluster throughput governor",
      zh: "AI 计算芯片 — 集群吞吐调节器",
    },
    why: {
      scarce_resource: {
        en: "Controls scarce GPU shipments that every large training cluster schedules around.",
        zh: "控制大型训练集群排期所依赖的 scarce GPU 出货。",
      },
      can_function_without: {
        en: "Clusters cannot reach designed FLOPs without allocated NVIDIA accelerators.",
        zh: "无 NVIDIA 加速器分配，集群无法达到设计 FLOPs。",
      },
      replaceability_1_to_3_years: {
        en: "AMD and custom silicon reduce but do not remove dependence within 1–3 years.",
        zh: "AMD 与定制芯片 1–3 年内可缓解但无法消除依赖。",
      },
    },
  },
  "AI Data Centers|ANET": {
    chain_position: {
      en: "Networking Fabric — AI cluster scale-out switching",
      zh: "网络 fabric — AI 集群 scale-out 交换",
    },
    why: {
      scarce_resource: {
        en: "High-radix switches are scarce for large AI fabrics but not as single-vendor as GPUs.",
        zh: "大型 AI fabric 的高 radix 交换机 scarce，但不如 GPU 单一来源。",
      },
      can_function_without: {
        en: "Clusters can deploy at reduced scale or alternate topologies without Arista specifically.",
        zh: "无 Arista 亦可降规模或换拓扑部署集群。",
      },
      replaceability_1_to_3_years: {
        en: "Switch vendors and architectures can be qualified on a 2–3 year migration path.",
        zh: "2–3 年迁移路径上可认证其他交换厂商与架构。",
      },
    },
  },
  "AI Data Centers|VRT": {
    chain_position: {
      en: "Power & Thermal — liquid cooling and rack power distribution",
      zh: "电力与散热 — 液冷与机架配电",
    },
    why: {
      scarce_resource: {
        en: "Liquid cooling and PDUs are required for dense racks but sourced from multiple vendors.",
        zh: "高密度机架需液冷与 PDU，但来源多元。",
      },
      can_function_without: {
        en: "Deployment slows without thermal capacity; it does not halt accelerator production itself.",
        zh: "散热不足拖慢部署，但不阻断加速器生产本身。",
      },
      replaceability_1_to_3_years: {
        en: "Facility vendors are interchangeable over 1–3 years with engineering lead time.",
        zh: "经工程 lead time，1–3 年内机房厂商可互换。",
      },
    },
  },
  "AI Data Centers|SMCI": {
    chain_position: {
      en: "Server & Rack Systems — AI rack integration and ODM supply",
      zh: "服务器与机架 — AI 机架整合与 ODM",
    },
    why: {
      scarce_resource: {
        en: "Integrates upstream silicon into racks without owning scarce compute allocation.",
        zh: "整合上游芯片为机架，但不拥有 scarce 算力分配权。",
      },
      can_function_without: {
        en: "Other ODMs and hyperscale self-builds can absorb rack integration demand.",
        zh: "其他 ODM 与自研可吸收机架整合需求。",
      },
      replaceability_1_to_3_years: {
        en: "ODM share shifts within 1–2 years; SMCI is not a structural choke point.",
        zh: "1–2 年内 ODM 份额可转移；SMCI 非结构性 choke。",
      },
    },
  },
  "AI Data Centers|AMD": {
    chain_position: {
      en: "AI Compute Silicon — secondary accelerator path",
      zh: "AI 计算芯片 — 次级加速器路径",
    },
    why: {
      scarce_resource: {
        en: "Provides alternative GPUs but still consumes upstream fab, HBM, and packaging capacity.",
        zh: "提供 GPU 替代但仍消耗上游 fab、HBM 与封装产能。",
      },
      can_function_without: {
        en: "Relieves NVIDIA pressure yet does not control the primary allocation throat.",
        zh: "缓解 NVIDIA 压力，但不控制 primary 分配瓶颈。",
      },
      replaceability_1_to_3_years: {
        en: "Already acting as substitute; further share gains expected within 1–3 years.",
        zh: "已在替代；预计 1–3 年份额继续提升。",
      },
    },
  },
  "AI Data Centers|EQIX": {
    chain_position: {
      en: "Colocation & Infrastructure — interconnection and floor space",
      zh: "托管与基础设施 — 互联与机位",
    },
    why: {
      scarce_resource: {
        en: "Floor space and cross-connect are localized constraints, not industry-wide scarce resources.",
        zh: "机位与互联是局部约束，非全行业 scarce 资源。",
      },
      can_function_without: {
        en: "AI buildout continues across multiple colocation and cloud regions without Equinix specifically.",
        zh: "AI 建设可在多区域托管/云中继续，无需绑定 Equinix。",
      },
      replaceability_1_to_3_years: {
        en: "Site selection rotates among operators within 1–3 years.",
        zh: "1–3 年内在运营商间轮换选址。",
      },
    },
  },
  "AI Data Centers|DELL": {
    chain_position: {
      en: "Server & Rack Systems — enterprise and hyperscale servers",
      zh: "服务器与机架 — 企业与超大规模服务器",
    },
    why: {
      scarce_resource: {
        en: "Server assembly is competitive and does not gate accelerator wafer or GPU allocation.",
        zh: "服务器组装竞争激烈，不 gate 晶圆或 GPU 分配。",
      },
      can_function_without: {
        en: "Hyperscale and ODM channels operate without Dell-specific dependence.",
        zh: "超大规模与 ODM 渠道无需依赖 Dell。",
      },
      replaceability_1_to_3_years: {
        en: "Vendor rotation for server supply is routine within 1–2 years.",
        zh: "1–2 年内服务器供应厂商轮换属常态。",
      },
    },
  },
  "Cloud Software|MSFT": {
    chain_position: {
      en: "Hyperscale Infrastructure — Azure, M365, and identity control plane",
      zh: "超大规模基础设施 — Azure、M365 与身份控制平面",
    },
    why: {
      scarce_resource: {
        en: "Controls enterprise identity, Azure tenancy, and Copilot deployment paths for most Fortune workloads.",
        zh: "控制多数 Fortune 企业的身份、Azure 租户与 Copilot 部署路径。",
      },
      can_function_without: {
        en: "Large enterprises cannot migrate AI production workloads quickly off Microsoft identity and M365 gravity.",
        zh: "大型企业难以快速脱离 Microsoft 身份与 M365 重力迁移 AI 生产负载。",
      },
      replaceability_1_to_3_years: {
        en: "Multi-cloud strategies reduce but do not eliminate dependence within 1–3 years.",
        zh: "多云策略 1–3 年内可缓解但无法消除依赖。",
      },
    },
  },
  "Cloud Software|ORCL": {
    chain_position: {
      en: "Hyperscale Infrastructure — database and OCI anchor workloads",
      zh: "超大规模基础设施 — 数据库与 OCI 锚定负载",
    },
    why: {
      scarce_resource: {
        en: "Database estates create migration friction in Oracle-heavy enterprises.",
        zh: "在 Oracle 重度企业中，数据库资产造成迁移摩擦。",
      },
      can_function_without: {
        en: "General AI cloud deployment proceeds without Oracle-specific control of identity or GPU access.",
        zh: "通用 AI 云部署无需 Oracle 控制身份或 GPU 访问。",
      },
      replaceability_1_to_3_years: {
        en: "Database and cloud substitution is painful but feasible over a 2–3 year horizon.",
        zh: "2–3 年 horizon 内数据库与云替换痛苦但可行。",
      },
    },
  },
  "Cloud Software|NOW": {
    chain_position: {
      en: "Workflow Applications — IT and enterprise service workflows",
      zh: "工作流应用 — IT 与企业服务流程",
    },
    why: {
      scarce_resource: {
        en: "Embedded in IT workflows but does not control cloud compute or identity provisioning.",
        zh: "嵌入 IT 流程，但不控制云计算或身份 provisioning。",
      },
      can_function_without: {
        en: "AI infrastructure runs without ServiceNow; it orchestrates tickets and processes downstream.",
        zh: "AI 基础设施可无 ServiceNow 运行；其 orchestrates 下游工单与流程。",
      },
      replaceability_1_to_3_years: {
        en: "Workflow platform replacements occur over 2–3 years in large IT refresh cycles.",
        zh: "大型 IT 刷新周期中，2–3 年可替换工作流平台。",
      },
    },
  },
  "Cloud Software|CRWD": {
    chain_position: {
      en: "Data & Security Platforms — endpoint and identity security layer",
      zh: "数据与安全平台 — 终端与身份安全层",
    },
    why: {
      scarce_resource: {
        en: "Endpoint agents are sticky for security compliance but not scarce like cloud identity.",
        zh: "终端 agent 合规粘性高，但不如云身份 scarce。",
      },
      can_function_without: {
        en: "Workloads can run with alternate EDR vendors after migration windows.",
        zh: "迁移窗口后可用其他 EDR 厂商运行负载。",
      },
      replaceability_1_to_3_years: {
        en: "Security vendor swaps are planned on 1–3 year enterprise cycles.",
        zh: "企业 1–3 年周期内规划安全厂商切换。",
      },
    },
  },
  "Cloud Software|CRM": {
    chain_position: {
      en: "Workflow Applications — CRM and customer data gravity",
      zh: "工作流应用 — CRM 与客户数据重力",
    },
    why: {
      scarce_resource: {
        en: "CRM data gravity is account-level, not an industry-wide scarce AI resource.",
        zh: "CRM 数据重力在账户级，非全行业 scarce AI 资源。",
      },
      can_function_without: {
        en: "Semiconductor and data-center supply chains are unaffected by Salesforce availability.",
        zh: "半导体与数据中心供应链不受 Salesforce 可用性影响。",
      },
      replaceability_1_to_3_years: {
        en: "CRM alternatives and modular SaaS stacks are available within 1–3 years.",
        zh: "1–3 年内有 CRM 替代与模块化 SaaS 栈。",
      },
    },
  },
  "Cloud Software|SNOW": {
    chain_position: {
      en: "Data & Security Platforms — cloud data warehouse gravity",
      zh: "数据与安全平台 — 云数据仓库重力",
    },
    why: {
      scarce_resource: {
        en: "Data warehouse layer is substitutable among cloud analytics platforms.",
        zh: "数据仓库层可在云分析平台间替代。",
      },
      can_function_without: {
        en: "AI compute and cloud identity bottlenecks bind before warehouse selection does.",
        zh: "AI 算力与云身份瓶颈先于仓库选型 binding。",
      },
      replaceability_1_to_3_years: {
        en: "Analytics stack migration typically completes within 1–3 years.",
        zh: "分析栈迁移通常 1–3 年内完成。",
      },
    },
  },
  "Cloud Software|DDOG": {
    chain_position: {
      en: "Data & Security Platforms — observability and telemetry",
      zh: "数据与安全平台 — 可观测性与遥测",
    },
    why: {
      scarce_resource: {
        en: "Observability is operational, not a scarce choke resource for AI deployment.",
        zh: "可观测性属运维层，非 AI 部署的 scarce choke 资源。",
      },
      can_function_without: {
        en: "Clusters deploy with alternative telemetry stacks without blocking compute access.",
        zh: "可用其他遥测栈部署集群，不阻断算力访问。",
      },
      replaceability_1_to_3_years: {
        en: "Observability vendors are highly interchangeable within 1–2 years.",
        zh: "1–2 年内可观测性厂商高度可互换。",
      },
    },
  },
};

export function getIndustrySummary(industryId: IndustryId, locale: Locale): string {
  return pick(industrySummaries[industryId], locale);
}

export function getBottleneckLocation(industryId: IndustryId, locale: Locale): string {
  return pick(bottleneckLocations[industryId], locale);
}

export function getLocalizedChain(industryId: IndustryId, locale: Locale) {
  return chainNodes[industryId].map((node) => ({
    name: pick(node.name, locale),
    description: pick(node.description, locale),
    stage: node.stage,
  }));
}

export function getCompanyLocalizedFields(
  industryId: IndustryId,
  ticker: string,
  locale: Locale,
  fallback: {
    chain_position: string;
    why_bottleneck_or_not: {
      scarce_resource: string;
      can_function_without: string;
      replaceability_1_to_3_years: string;
    };
  },
) {
  const content = companyContent[`${industryId}|${ticker}`];
  if (!content || locale === "en") {
    return {
      chain_position: fallback.chain_position,
      why_bottleneck_or_not: fallback.why_bottleneck_or_not,
    };
  }

  return {
    chain_position: pick(content.chain_position, locale),
    why_bottleneck_or_not: {
      scarce_resource: pick(content.why.scarce_resource, locale),
      can_function_without: pick(content.why.can_function_without, locale),
      replaceability_1_to_3_years: pick(content.why.replaceability_1_to_3_years, locale),
    },
  };
}

export function buildConclusionNarrative(
  locale: Locale,
  bottleneckLocation: string,
  primary: { ticker: string; name: string; throat_role: ThroatRole },
  nonBottlenecks: Array<{ ticker: string; throat_role: ThroatRole }>,
  getRoleLabel: (role: ThroatRole) => string,
): string {
  const nonList =
    nonBottlenecks.length > 0
      ? nonBottlenecks.map((c) => `${c.ticker} (${getRoleLabel(c.throat_role)})`).join(locale === "zh" ? "、" : ", ")
      : locale === "zh"
        ? "Top 排名中暂无"
        : "None in the current top-ranked set";

  if (locale === "zh") {
    return [
      `主要瓶颈节点：${bottleneckLocation}。`,
      `真正 choke point：${primary.ticker} — ${primary.name}（${getRoleLabel(primary.throat_role)}）。`,
      `高分但非 choke point：${nonList}。`,
    ].join(" ");
  }

  return [
    `Primary bottleneck node: ${bottleneckLocation}.`,
    `True choke point: ${primary.ticker} — ${primary.name} (${primary.throat_role}).`,
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
