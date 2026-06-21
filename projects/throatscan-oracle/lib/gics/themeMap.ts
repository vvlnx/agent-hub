import { normalizeIndustryQuery } from "../industryAliases";
import { DEMO_CANONICAL_INDUSTRIES } from "../universeCoverage";
import type { GicsClassification, GicsQueryMapping } from "./types";

function theme(
  sector: string,
  industry_group: string,
  industry: string,
  sub_industry: string,
  zh: { sector: string; industry_group: string; industry: string; sub_industry: string },
  notes_en: string,
  notes_zh: string,
): { classification: GicsClassification; notes_en: string; notes_zh: string } {
  return {
    classification: {
      sector,
      industry_group,
      industry,
      sub_industry,
      sector_zh: zh.sector,
      industry_group_zh: zh.industry_group,
      industry_zh: zh.industry,
      sub_industry_zh: zh.sub_industry,
    },
    notes_en,
    notes_zh,
  };
}

/** Canonical demo queries → primary GICS path (theme mapping, not official GICS names). */
const THEME_GICS: Record<
  string,
  { classification: GicsClassification; notes_en: string; notes_zh: string }
> = {
  "ai chips": theme(
    "Information Technology",
    "Semiconductors & Semiconductor Equipment",
    "Semiconductors",
    "Semiconductors",
    {
      sector: "信息技术",
      industry_group: "半导体与半导体设备",
      industry: "半导体",
      sub_industry: "半导体",
    },
    "Theme query mapped to GICS Semiconductors; supply-chain bottleneck may sit in equipment or materials layers.",
    "主题查询映射至 GICS 半导体；供应链瓶颈可能在设备或材料层。",
  ),
  semiconductor: theme(
    "Information Technology",
    "Semiconductors & Semiconductor Equipment",
    "Semiconductors",
    "Semiconductor Materials & Equipment",
    {
      sector: "信息技术",
      industry_group: "半导体与半导体设备",
      industry: "半导体",
      sub_industry: "半导体材料与设备",
    },
    "Broad semiconductor theme spans chip designers, foundry, and WFE suppliers.",
    "广义半导体主题覆盖芯片设计、代工与设备供应商。",
  ),
  "ai data center": theme(
    "Information Technology",
    "Technology Hardware & Equipment",
    "Technology Hardware, Storage & Peripherals",
    "Technology Hardware, Storage & Peripherals",
    {
      sector: "信息技术",
      industry_group: "技术硬件与设备",
      industry: "技术硬件、存储与外围设备",
      sub_industry: "技术硬件、存储与外围设备",
    },
    "Data-center theme crosses IT hardware, software, and utilities (power/cooling).",
    "数据中心主题横跨 IT 硬件、软件与公用事业（电力/制冷）。",
  ),
  "ev battery": theme(
    "Materials",
    "Materials",
    "Chemicals",
    "Specialty Chemicals",
    {
      sector: "材料",
      industry_group: "材料",
      industry: "化工",
      sub_industry: "特种化学品",
    },
    "EV battery bottleneck often maps to Materials (lithium/chemicals) before Consumer Discretionary OEMs.",
    "电动车电池瓶颈常先映射至材料（锂/化工），再至可选消费 OEM。",
  ),
  "oil and gas": theme(
    "Energy",
    "Energy",
    "Oil, Gas & Consumable Fuels",
    "Integrated Oil & Gas",
    {
      sector: "能源",
      industry_group: "能源",
      industry: "石油、天然气与可消耗燃料",
      sub_industry: "综合性油气",
    },
    "Canonical Energy sector mapping for upstream and integrated majors.",
    "能源板块映射，覆盖上游与综合性油气公司。",
  ),
  biotech: theme(
    "Health Care",
    "Pharmaceuticals, Biotechnology & Life Sciences",
    "Biotechnology",
    "Biotechnology",
    {
      sector: "医疗保健",
      industry_group: "制药、生物科技与生命科学",
      industry: "生物科技",
      sub_industry: "生物科技",
    },
    "Biotech theme; large-cap pharma may map to Pharmaceuticals sub-industry.",
    "生物科技主题；大型制药公司可能映射至制药子行业。",
  ),
  nuclear: theme(
    "Utilities",
    "Utilities",
    "Electric Utilities",
    "Electric Utilities",
    {
      sector: "公用事业",
      industry_group: "公用事业",
      industry: "电力公用事业",
      sub_industry: "电力公用事业",
    },
    "Nuclear theme spans Utilities operators and Energy uranium suppliers.",
    "核能主题横跨公用事业运营商与能源铀矿供应商。",
  ),
  robotics: theme(
    "Industrials",
    "Capital Goods",
    "Machinery",
    "Industrial Machinery & Supplies & Components",
    {
      sector: "工业",
      industry_group: "资本货物",
      industry: "机械",
      sub_industry: "工业机械与零部件",
    },
    "Robotics theme crosses Industrials automation and IT semiconductors.",
    "机器人主题横跨工业自动化与 IT 半导体。",
  ),
  automotive: theme(
    "Consumer Discretionary",
    "Automobiles & Components",
    "Automobiles",
    "Automobile Manufacturers",
    {
      sector: "可选消费",
      industry_group: "汽车与零部件",
      industry: "汽车",
      sub_industry: "汽车制造商",
    },
    "Automotive OEM theme; Tier-1 suppliers map to Automobile Components.",
    "整车 OEM 主题；一级供应商映射至汽车零部件。",
  ),
  fintech: theme(
    "Financials",
    "Financial Services",
    "Financial Services",
    "Transaction & Payment Processing Services",
    {
      sector: "金融",
      industry_group: "金融服务",
      industry: "金融服务",
      sub_industry: "交易与支付处理服务",
    },
    "Fintech theme spans Financials payments and IT software platforms.",
    "金融科技主题横跨金融支付与 IT 软件平台。",
  ),
  defense: theme(
    "Industrials",
    "Capital Goods",
    "Aerospace & Defense",
    "Aerospace & Defense",
    {
      sector: "工业",
      industry_group: "资本货物",
      industry: "航空航天与国防",
      sub_industry: "航空航天与国防",
    },
    "Defense theme maps to Aerospace & Defense GICS industry.",
    "国防主题映射至 GICS 航空航天与国防行业。",
  ),
};

const UNKNOWN_THEME = theme(
  "Multi-sector theme",
  "Cross-industry query",
  "Not in canonical GICS map",
  "Theme mapping only",
  {
    sector: "跨板块主题",
    industry_group: "跨行业查询",
    industry: "未在 canonical GICS 映射中",
    sub_industry: "仅主题映射",
  },
  "Free-text query is not a standard GICS sub-industry name; ThroatScan uses supply-chain reasoning on top of this label.",
  "自由文本查询不是标准 GICS 子行业名称；ThroatScan 在此标签之上进行供应链推理。",
);

function resolveCanonicalKey(normalized: string): string | null {
  if (THEME_GICS[normalized]) return normalized;
  for (const canonical of DEMO_CANONICAL_INDUSTRIES) {
    if (normalized === canonical || normalized.includes(canonical) || canonical.includes(normalized)) {
      return canonical;
    }
  }
  return null;
}

export function resolveGicsFromQuery(rawInput: string): GicsQueryMapping {
  const normalized = normalizeIndustryQuery(rawInput).toLowerCase();
  const canonical = resolveCanonicalKey(normalized);

  if (canonical && THEME_GICS[canonical]) {
    const entry = THEME_GICS[canonical];
    return {
      classification: entry.classification,
      mapping_kind: "canonical",
      canonical_query: canonical,
      notes_en: entry.notes_en,
      notes_zh: entry.notes_zh,
    };
  }

  for (const [key, entry] of Object.entries(THEME_GICS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return {
        classification: entry.classification,
        mapping_kind: "theme",
        canonical_query: key,
        notes_en: entry.notes_en,
        notes_zh: entry.notes_zh,
      };
    }
  }

  return {
    classification: UNKNOWN_THEME.classification,
    mapping_kind: "unknown",
    canonical_query: null,
    notes_en: UNKNOWN_THEME.notes_en,
    notes_zh: UNKNOWN_THEME.notes_zh,
  };
}
