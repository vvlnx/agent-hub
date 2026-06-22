import type { GicsClassification } from "./types";

function gics(
  sector: string,
  industry_group: string,
  industry: string,
  sub_industry: string,
  zh: { sector: string; industry_group: string; industry: string; sub_industry: string },
): GicsClassification {
  return {
    sector,
    industry_group,
    industry,
    sub_industry,
    sector_zh: zh.sector,
    industry_group_zh: zh.industry_group,
    industry_zh: zh.industry,
    sub_industry_zh: zh.sub_industry,
  };
}

const itSemi = (sub = "Semiconductors") =>
  gics(
    "Information Technology",
    "Semiconductors & Semiconductor Equipment",
    "Semiconductors",
    sub,
    {
      sector: "信息技术",
      industry_group: "半导体与半导体设备",
      industry: "半导体",
      sub_industry: sub === "Semiconductors" ? "半导体" : sub,
    },
  );

const itSoftware = (industry = "Application Software", industryZh = "应用软件") =>
  gics("Information Technology", "Software & Services", "Software", industry, {
    sector: "信息技术",
    industry_group: "软件与服务",
    industry: "软件",
    sub_industry: industryZh,
  });

/** GICS for niche universe expansion tickers. */
export const TICKER_GICS_NICHE: Record<string, GicsClassification> = {
  RKLB: gics("Industrials", "Capital Goods", "Aerospace & Defense", "Aerospace & Defense", {
    sector: "工业",
    industry_group: "资本货物",
    industry: "航空航天与国防",
    sub_industry: "航空航天与国防",
  }),
  ASTS: gics("Communication Services", "Telecommunication Services", "Wireless Telecommunication Services", "Wireless Telecommunication Services", {
    sector: "通信服务",
    industry_group: "电信服务",
    industry: "无线电信服务",
    sub_industry: "无线电信服务",
  }),
  LUNR: gics("Industrials", "Capital Goods", "Aerospace & Defense", "Aerospace & Defense", {
    sector: "工业",
    industry_group: "资本货物",
    industry: "航空航天与国防",
    sub_industry: "航空航天与国防",
  }),
  IONQ: itSoftware("Systems Software", "系统软件"),
  RGTI: itSoftware("Systems Software", "系统软件"),
  QBTS: itSoftware("Systems Software", "系统软件"),
  UEC: gics("Energy", "Energy", "Oil, Gas & Consumable Fuels", "Oil & Gas Exploration & Production", {
    sector: "能源",
    industry_group: "能源",
    industry: "石油天然气与 consumable fuels",
    sub_industry: "油气勘探与生产",
  }),
  LEU: gics("Energy", "Energy", "Oil, Gas & Consumable Fuels", "Oil & Gas Exploration & Production", {
    sector: "能源",
    industry_group: "能源",
    industry: "石油天然气",
    sub_industry: "油气勘探与生产",
  }),
  OKLO: gics("Utilities", "Utilities", "Electric Utilities", "Electric Utilities", {
    sector: "公用事业",
    industry_group: "公用事业",
    industry: "电力公用事业",
    sub_industry: "电力公用事业",
  }),
  MP: gics("Materials", "Materials", "Metals & Mining", "Diversified Metals & Mining", {
    sector: "材料",
    industry_group: "材料",
    industry: "金属与采矿",
    sub_industry: "多元化金属与采矿",
  }),
  LAC: gics("Materials", "Materials", "Metals & Mining", "Diversified Metals & Mining", {
    sector: "材料",
    industry_group: "材料",
    industry: "金属与采矿",
    sub_industry: "多元化金属与采矿",
  }),
  FCX: gics("Materials", "Materials", "Metals & Mining", "Copper", {
    sector: "材料",
    industry_group: "材料",
    industry: "金属与采矿",
    sub_industry: "铜",
  }),
  CF: gics("Materials", "Materials", "Chemicals", "Fertilizers & Agricultural Chemicals", {
    sector: "材料",
    industry_group: "材料",
    industry: "化学品",
    sub_industry: "化肥与农化",
  }),
  GEV: gics("Industrials", "Capital Goods", "Electrical Equipment", "Heavy Electrical Equipment", {
    sector: "工业",
    industry_group: "资本货物",
    industry: "电气设备",
    sub_industry: "重型电气设备",
  }),
  ENPH: gics("Information Technology", "Semiconductors & Semiconductor Equipment", "Semiconductors", "Semiconductor Materials & Equipment", {
    sector: "信息技术",
    industry_group: "半导体与半导体设备",
    industry: "半导体",
    sub_industry: "半导体材料与设备",
  }),
  FSLR: gics("Information Technology", "Semiconductors & Semiconductor Equipment", "Semiconductors", "Semiconductor Materials & Equipment", {
    sector: "信息技术",
    industry_group: "半导体与半导体设备",
    industry: "半导体",
    sub_industry: "半导体材料与设备",
  }),
  ETN: gics("Industrials", "Capital Goods", "Electrical Equipment", "Electrical Components & Equipment", {
    sector: "工业",
    industry_group: "资本货物",
    industry: "电气设备",
    sub_industry: "电气 components 与设备",
  }),
  ZS: itSoftware("Systems Software", "系统软件"),
  FTNT: itSoftware("Systems Software", "系统软件"),
  NET: itSoftware("Systems Software", "系统软件"),
  DDOG: itSoftware("Application Software", "应用软件"),
  MDB: itSoftware("Systems Software", "系统软件"),
  SNPS: itSemi("Semiconductors"),
  CDNS: itSemi("Semiconductors"),
  KLAC: itSemi("Semiconductor Materials & Equipment"),
  COHR: itSemi("Semiconductor Materials & Equipment"),
  CIEN: gics("Information Technology", "Technology Hardware & Equipment", "Communications Equipment", "Communications Equipment", {
    sector: "信息技术",
    industry_group: "技术硬件与设备",
    industry: "通信设备",
    sub_industry: "通信设备",
  }),
  MRNA: gics("Health Care", "Pharmaceuticals, Biotechnology & Life Sciences", "Biotechnology", "Biotechnology", {
    sector: "医疗保健",
    industry_group: "制药、生物科技与生命科学",
    industry: "生物科技",
    sub_industry: "生物科技",
  }),
  REGN: gics("Health Care", "Pharmaceuticals, Biotechnology & Life Sciences", "Biotechnology", "Biotechnology", {
    sector: "医疗保健",
    industry_group: "制药、生物科技与生命科学",
    industry: "生物科技",
    sub_industry: "生物科技",
  }),
  VRTX: gics("Health Care", "Pharmaceuticals, Biotechnology & Life Sciences", "Biotechnology", "Biotechnology", {
    sector: "医疗保健",
    industry_group: "制药、生物科技与生命科学",
    industry: "生物科技",
    sub_industry: "生物科技",
  }),
  ILMN: gics("Health Care", "Pharmaceuticals, Biotechnology & Life Sciences", "Life Sciences Tools & Services", "Life Sciences Tools & Services", {
    sector: "医疗保健",
    industry_group: "制药、生物科技与生命科学",
    industry: "生命科学工具与服务",
    sub_industry: "生命科学工具与服务",
  }),
  DXCM: gics("Health Care", "Health Care Equipment & Services", "Health Care Equipment & Supplies", "Health Care Equipment", {
    sector: "医疗保健",
    industry_group: "医疗保健设备与服务",
    industry: "医疗保健设备与 supplies",
    sub_industry: "医疗保健设备",
  }),
  KTOS: gics("Industrials", "Capital Goods", "Aerospace & Defense", "Aerospace & Defense", {
    sector: "工业",
    industry_group: "资本货物",
    industry: "航空航天与国防",
    sub_industry: "航空航天与国防",
  }),
  AXON: gics("Industrials", "Capital Goods", "Aerospace & Defense", "Aerospace & Defense", {
    sector: "工业",
    industry_group: "资本货物",
    industry: "航空航天与国防",
    sub_industry: "航空航天与国防",
  }),
  NOC: gics("Industrials", "Capital Goods", "Aerospace & Defense", "Aerospace & Defense", {
    sector: "工业",
    industry_group: "资本货物",
    industry: "航空航天与国防",
    sub_industry: "航空航天与国防",
  }),
  SOFI: gics("Financials", "Financial Services", "Consumer Finance", "Consumer Finance", {
    sector: "金融",
    industry_group: "金融服务",
    industry: "消费金融",
    sub_industry: "消费金融",
  }),
  HOOD: gics("Financials", "Financial Services", "Capital Markets", "Investment Banking & Brokerage", {
    sector: "金融",
    industry_group: "金融服务",
    industry: "资本市场",
    sub_industry: "投资 banking 与经纪",
  }),
  AFRM: gics("Financials", "Financial Services", "Consumer Finance", "Consumer Finance", {
    sector: "金融",
    industry_group: "金融服务",
    industry: "消费金融",
    sub_industry: "消费金融",
  }),
  EMR: gics("Industrials", "Capital Goods", "Machinery", "Industrial Machinery & Supplies & Components", {
    sector: "工业",
    industry_group: "资本货物",
    industry: "机械",
    sub_industry: "工业机械与零部件",
  }),
  HON: gics("Industrials", "Capital Goods", "Industrial Conglomerates", "Industrial Conglomerates", {
    sector: "工业",
    industry_group: "资本货物",
    industry: "工业 conglomerates",
    sub_industry: "工业 conglomerates",
  }),
  PSTG: itSoftware("Systems Software", "系统软件"),
  OXY: gics("Energy", "Energy", "Oil, Gas & Consumable Fuels", "Oil & Gas Exploration & Production", {
    sector: "能源",
    industry_group: "能源",
    industry: "石油天然气",
    sub_industry: "油气勘探与生产",
  }),
  MOS: gics("Materials", "Materials", "Chemicals", "Fertilizers & Agricultural Chemicals", {
    sector: "材料",
    industry_group: "材料",
    industry: "化学品",
    sub_industry: "化肥与农化",
  }),
};
