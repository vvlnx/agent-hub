export type PrimaryEvidenceCategory =
  | "sec_filings"
  | "investor_relations"
  | "regulatory_data"
  | "capacity_orders";

export interface PrimaryEvidenceLink {
  ticker: string;
  category: PrimaryEvidenceCategory;
  label_en: string;
  label_zh: string;
  url: string;
  check_hint_en: string;
  check_hint_zh: string;
}

const CATEGORY_LABELS: Record<
  PrimaryEvidenceCategory,
  { en: string; zh: string }
> = {
  sec_filings: { en: "SEC filings", zh: "SEC 公告/财报" },
  investor_relations: { en: "Investor relations", zh: "投资者关系" },
  regulatory_data: { en: "Regulatory / industry data", zh: "监管/行业数据" },
  capacity_orders: { en: "Capacity & orders check", zh: "产能与订单核查" },
};

function secSearchUrl(ticker: string, form = "10-K"): string {
  return `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&search_text=${encodeURIComponent(ticker)}&type=${encodeURIComponent(form)}&dateb=&owner=include&count=10`;
}

/** Curated primary-source entry points per ticker — links only, no scraped claims. */
const TICKER_EVIDENCE: Record<
  string,
  Array<Omit<PrimaryEvidenceLink, "ticker">>
> = {
  NVDA: [
    {
      category: "sec_filings",
      label_en: "NVIDIA 10-K / 10-Q",
      label_zh: "NVIDIA 10-K / 10-Q",
      url: secSearchUrl("NVDA"),
      check_hint_en: "Review Data Center revenue mix, supply commitments, and customer concentration.",
      check_hint_zh: "查看数据中心收入结构、供应承诺与客户集中度。",
    },
    {
      category: "investor_relations",
      label_en: "NVIDIA Investor Relations",
      label_zh: "NVIDIA 投资者关系",
      url: "https://investor.nvidia.com/",
      check_hint_en: "Cross-check earnings call commentary on allocation and lead times.",
      check_hint_zh: "对照财报电话会中关于分配与交期的表述。",
    },
  ],
  ASML: [
    {
      category: "sec_filings",
      label_en: "ASML 20-F",
      label_zh: "ASML 20-F",
      url: secSearchUrl("ASML", "20-F"),
      check_hint_en: "Verify EUV shipment backlog and capacity guidance.",
      check_hint_zh: "核实 EUV 出货 backlog 与产能指引。",
    },
    {
      category: "investor_relations",
      label_en: "ASML IR",
      label_zh: "ASML 投资者关系",
      url: "https://www.asml.com/en/investors",
      check_hint_en: "Check quarterly order book and lead-time disclosures.",
      check_hint_zh: "查看季度订单与交期披露。",
    },
  ],
  ALB: [
    {
      category: "sec_filings",
      label_en: "Albemarle 10-K",
      label_zh: "Albemarle 10-K",
      url: secSearchUrl("ALB"),
      check_hint_en: "Review lithium pricing, conversion capacity, and offtake contracts.",
      check_hint_zh: "查看锂价、转化产能与长单情况。",
    },
    {
      category: "regulatory_data",
      label_en: "USGS mineral commodities — lithium",
      label_zh: "USGS 锂矿商品数据",
      url: "https://www.usgs.gov/centers/national-minerals-information-center/lithium-statistics-and-information",
      check_hint_en: "Compare upstream supply growth vs EV demand assumptions.",
      check_hint_zh: "对比上游供给增速与 EV 需求假设。",
    },
  ],
  XOM: [
    {
      category: "sec_filings",
      label_en: "ExxonMobil 10-K",
      label_zh: "ExxonMobil 10-K",
      url: secSearchUrl("XOM"),
      check_hint_en: "Review upstream production, refining utilization, and capex plans.",
      check_hint_zh: "查看上游产量、炼化利用率与资本开支计划。",
    },
    {
      category: "regulatory_data",
      label_en: "EIA petroleum supply",
      label_zh: "EIA 石油供应数据",
      url: "https://www.eia.gov/petroleum/supply/weekly/",
      check_hint_en: "Validate macro supply/demand against company guidance.",
      check_hint_zh: "用宏观供需数据验证公司指引。",
    },
  ],
  LLY: [
    {
      category: "sec_filings",
      label_en: "Eli Lilly 10-K",
      label_zh: "Eli Lilly 10-K",
      url: secSearchUrl("LLY"),
      check_hint_en: "Check GLP-1 manufacturing capacity and pipeline milestones.",
      check_hint_zh: "查看 GLP-1 产能与管线里程碑。",
    },
    {
      category: "regulatory_data",
      label_en: "FDA drug approvals database",
      label_zh: "FDA 药品批准数据库",
      url: "https://www.accessdata.fda.gov/scripts/cder/daf/",
      check_hint_en: "Confirm regulatory milestones that affect supply scarcity.",
      check_hint_zh: "确认影响供应稀缺性的监管节点。",
    },
  ],
  CCJ: [
    {
      category: "sec_filings",
      label_en: "Cameco 40-F",
      label_zh: "Cameco 40-F",
      url: secSearchUrl("CCJ", "40-F"),
      check_hint_en: "Review contracted volumes, production guidance, and enrichment exposure.",
      check_hint_zh: "查看合同量、产量指引与浓缩环节暴露。",
    },
    {
      category: "regulatory_data",
      label_en: "EIA nuclear overview",
      label_zh: "EIA 核能概览",
      url: "https://www.eia.gov/nuclear/",
      check_hint_en: "Cross-check reactor restarts and fuel demand trends.",
      check_hint_zh: "对照反应堆重启与燃料需求趋势。",
    },
  ],
  TSLA: [
    {
      category: "sec_filings",
      label_en: "Tesla 10-K",
      label_zh: "Tesla 10-K",
      url: secSearchUrl("TSLA"),
      check_hint_en: "Review delivery growth, battery supply agreements, and margin bridge.",
      check_hint_zh: "查看交付增长、电池供应协议与利润率变化。",
    },
    {
      category: "investor_relations",
      label_en: "Tesla IR",
      label_zh: "Tesla 投资者关系",
      url: "https://ir.tesla.com/",
      check_hint_en: "Check production and deployment updates.",
      check_hint_zh: "查看产量与部署更新。",
    },
  ],
  LMT: [
    {
      category: "sec_filings",
      label_en: "Lockheed Martin 10-K",
      label_zh: "Lockheed Martin 10-K",
      url: secSearchUrl("LMT"),
      check_hint_en: "Review backlog, program milestones, and supply-chain risk factors.",
      check_hint_zh: "查看 backlog、项目节点与供应链风险因素。",
    },
  ],
  V: [
    {
      category: "sec_filings",
      label_en: "Visa 10-K",
      label_zh: "Visa 10-K",
      url: secSearchUrl("V"),
      check_hint_en: "Review payment volume growth and network fee structure.",
      check_hint_zh: "查看支付量增长与网络费率结构。",
    },
  ],
};

function genericEvidence(ticker: string, name: string): PrimaryEvidenceLink[] {
  return [
    {
      ticker,
      category: "sec_filings",
      label_en: `${name} SEC filings`,
      label_zh: `${name} SEC 公告`,
      url: secSearchUrl(ticker),
      check_hint_en: "Start with the latest 10-K risk factors, segment mix, and customer/supplier disclosures.",
      check_hint_zh: "从最新 10-K 的风险因素、分部结构与上下游披露开始核查。",
    },
    {
      ticker,
      category: "capacity_orders",
      label_en: `${ticker} capacity / orders checklist`,
      label_zh: `${ticker} 产能/订单核查清单`,
      url: secSearchUrl(ticker, "8-K"),
      check_hint_en: "Scan recent 8-K items for capacity expansions, major contracts, or supply disruptions.",
      check_hint_zh: "检索近期 8-K 中的产能扩张、重大合同或供应扰动。",
    },
  ];
}

export function getPrimaryEvidenceForTicker(ticker: string, name: string): PrimaryEvidenceLink[] {
  const curated = TICKER_EVIDENCE[ticker];
  if (curated) {
    return curated.map((entry) => ({ ticker, ...entry }));
  }
  return genericEvidence(ticker, name);
}

export function getPrimaryEvidenceForTickers(
  tickers: Array<{ ticker: string; name: string }>,
): PrimaryEvidenceLink[] {
  const seen = new Set<string>();
  const links: PrimaryEvidenceLink[] = [];

  for (const { ticker, name } of tickers) {
    for (const link of getPrimaryEvidenceForTicker(ticker, name)) {
      const key = `${link.ticker}:${link.url}`;
      if (seen.has(key)) continue;
      seen.add(key);
      links.push(link);
    }
  }

  return links;
}

export function categoryLabel(
  category: PrimaryEvidenceCategory,
  locale: "en" | "zh",
): string {
  return locale === "zh" ? CATEGORY_LABELS[category].zh : CATEGORY_LABELS[category].en;
}
