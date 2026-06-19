/** Map user phrasing (incl. Chinese) to canonical English industry queries. */
const EXACT_ALIASES: Record<string, string> = {
  汽车: "automotive",
  汽车行业: "automotive",
  整车: "automotive",
  造车: "automotive",
  新能源车: "ev battery",
  新能源汽车: "ev battery",
  电动汽车: "ev battery",
  电动车: "ev battery",
  电池: "ev battery",
  半导体: "semiconductor",
  芯片: "semiconductor",
  人工智能: "ai data center",
  数据中心: "ai data center",
  生物科技: "biotech",
  制药: "biotech",
  石油: "oil and gas",
  天然气: "oil and gas",
  能源: "oil and gas",
  核能: "nuclear",
  机器人: "robotics",
  国防: "defense",
  金融科技: "fintech",
  量子: "quantum computing",
  量子计算: "quantum computing",
  太空: "space",
  航天: "space",
  碳中和: "carbon capture",
};

const PARTIAL_ALIASES: Array<{ pattern: RegExp; canonical: string }> = [
  { pattern: /汽车|整车|造车|主机厂|乘用车|商用车/, canonical: "automotive" },
  { pattern: /电动|锂电|储能|电池/, canonical: "ev battery" },
  { pattern: /半导体|芯片|晶圆|代工/, canonical: "semiconductor" },
  { pattern: /人工智能|大模型|算力|数据中心/, canonical: "ai data center" },
  { pattern: /生物|制药|医药|临床/, canonical: "biotech" },
  { pattern: /石油|天然气|油气|炼油/, canonical: "oil and gas" },
  { pattern: /核能|核电|铀/, canonical: "nuclear" },
  { pattern: /机器人|自动化/, canonical: "robotics" },
];

export function normalizeIndustryQuery(input: string): string {
  const trimmed = input.trim().replace(/\s+/g, " ");
  if (!trimmed) {
    return "general industry";
  }

  const lower = trimmed.toLowerCase();
  if (EXACT_ALIASES[trimmed]) {
    return EXACT_ALIASES[trimmed];
  }
  if (EXACT_ALIASES[lower]) {
    return EXACT_ALIASES[lower];
  }

  for (const { pattern, canonical } of PARTIAL_ALIASES) {
    if (pattern.test(trimmed)) {
      return canonical;
    }
  }

  return trimmed;
}

export function tokenizeIndustry(input: string): string[] {
  const normalized = normalizeIndustryQuery(input).toLowerCase();
  const latin = normalized.split(/[^a-z0-9\u4e00-\u9fff]+/).filter((token) => token.length > 1);
  const cjkBlocks = normalized.match(/[\u4e00-\u9fff]{2,}/g) ?? [];
  return [...new Set([...latin, ...cjkBlocks])];
}
