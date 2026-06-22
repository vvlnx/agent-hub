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

const SEMI = gics(
  "Information Technology",
  "Semiconductors & Semiconductor Equipment",
  "Semiconductors",
  "Semiconductors",
  { sector: "信息技术", industry_group: "半导体与半导体设备", industry: "半导体", sub_industry: "半导体" },
);
const SOFTWARE = gics(
  "Information Technology",
  "Software & Services",
  "Software",
  "Application Software",
  { sector: "信息技术", industry_group: "软件与服务", industry: "软件", sub_industry: "应用软件" },
);
const HEALTH = gics(
  "Health Care",
  "Health Care Equipment & Services",
  "Health Care Providers & Services",
  "Health Care Services",
  { sector: "医疗保健", industry_group: "医疗保健设备与服务", industry: "医疗保健提供商与服务", sub_industry: "医疗保健服务" },
);
const PHARMA = gics(
  "Health Care",
  "Pharmaceuticals, Biotechnology & Life Sciences",
  "Pharmaceuticals",
  "Pharmaceuticals",
  { sector: "医疗保健", industry_group: "制药、生物科技与生命科学", industry: "制药", sub_industry: "制药" },
);
const INDUSTRIAL = gics(
  "Industrials",
  "Capital Goods",
  "Industrial Conglomerates",
  "Industrial Conglomerates",
  { sector: "工业", industry_group: "资本货物", industry: "工业集团", sub_industry: "工业集团" },
);
const ENERGY = gics(
  "Energy",
  "Energy",
  "Oil, Gas & Consumable Fuels",
  "Oil & Gas Exploration & Production",
  { sector: "能源", industry_group: "能源", industry: "石油、天然气与 consumable 燃料", sub_industry: "石油天然气勘探与生产" },
);
const REIT = gics(
  "Real Estate",
  "Equity Real Estate Investment Trusts (REITs)",
  "Specialized REITs",
  "Specialized REITs",
  { sector: "房地产", industry_group: "股权 REIT", industry: "专业 REIT", sub_industry: "专业 REIT" },
);
const UTIL = gics(
  "Utilities",
  "Utilities",
  "Electric Utilities",
  "Electric Utilities",
  { sector: "公用事业", industry_group: "公用事业", industry: "电力公用事业", sub_industry: "电力公用事业" },
);
const FIN = gics(
  "Financials",
  "Banks",
  "Banks",
  "Diversified Banks",
  { sector: "金融", industry_group: "银行", industry: "银行", sub_industry: "多元化银行" },
);
const CONSUMER = gics(
  "Consumer Discretionary",
  "Consumer Services",
  "Hotels, Restaurants & Leisure",
  "Restaurants",
  { sector: "可选消费", industry_group: "消费者服务", industry: "酒店、餐厅与休闲", sub_industry: "餐厅" },
);
const STAPLES = gics(
  "Consumer Staples",
  "Food, Beverage & Tobacco",
  "Beverages",
  "Soft Drinks",
  { sector: "必需消费", industry_group: "食品、饮料与烟草", industry: "饮料", sub_industry: "软饮料" },
);
const TELECOM = gics(
  "Communication Services",
  "Telecommunication Services",
  "Diversified Telecommunication Services",
  "Integrated Telecommunication Services",
  { sector: "通信服务", industry_group: "电信服务", industry: "多元化电信服务", sub_industry: "综合电信服务" },
);
const CYBER = gics(
  "Information Technology",
  "Software & Services",
  "Software",
  "Systems Software",
  { sector: "信息技术", industry_group: "软件与服务", industry: "软件", sub_industry: "系统软件" },
);
const MEDIA = gics(
  "Communication Services",
  "Media & Entertainment",
  "Entertainment",
  "Movies & Entertainment",
  { sector: "通信服务", industry_group: "媒体与娱乐", industry: "娱乐", sub_industry: "电影与娱乐" },
);
const LOGISTICS = gics(
  "Industrials",
  "Transportation",
  "Air Freight & Logistics",
  "Air Freight & Logistics",
  { sector: "工业", industry_group: "运输", industry: "航空货运与物流", sub_industry: "航空货运与物流" },
);
const AG = gics(
  "Consumer Staples",
  "Food, Beverage & Tobacco",
  "Food Products",
  "Packaged Foods & Meats",
  { sector: "必需消费", industry_group: "食品、饮料与烟草", industry: "食品", sub_industry: "包装食品与肉类" },
);
const FINTECH = gics(
  "Financials",
  "Financial Services",
  "Consumer Finance",
  "Consumer Finance",
  { sector: "金融", industry_group: "金融服务", industry: "消费金融", sub_industry: "消费金融" },
);
const STORAGE = gics(
  "Information Technology",
  "Technology Hardware & Equipment",
  "Technology Hardware, Storage & Peripherals",
  "Technology Hardware, Storage & Peripherals",
  { sector: "信息技术", industry_group: "技术硬件与设备", industry: "技术硬件、存储与外设", sub_industry: "技术硬件、存储与外设" },
);
const PLATFORM = gics(
  "Communication Services",
  "Media & Entertainment",
  "Interactive Media & Services",
  "Interactive Media & Services",
  { sector: "通信服务", industry_group: "媒体与娱乐", industry: "互动媒体与服务", sub_industry: "互动媒体与服务" },
);

/** Wave 1 curated GICS (60 tickers). */
export const TICKER_GICS_WAVE1: Record<string, GicsClassification> = {
  TXN: SEMI, ADI: SEMI, NXPI: SEMI, MCHP: SEMI, MRVL: SEMI, ON: SEMI, ENTG: SEMI, QRVO: SEMI, ONTO: SEMI, FORM: SEMI,
  WDC: STORAGE, STX: STORAGE, NTAP: STORAGE, CDW: SOFTWARE,
  TMO: HEALTH, DHR: HEALTH, ABT: HEALTH, AMGN: PHARMA, GILD: PHARMA, BMY: PHARMA, IQV: HEALTH, IDXX: HEALTH, SYK: HEALTH, BSX: HEALTH,
  BA: INDUSTRIAL, GD: INDUSTRIAL, HII: INDUSTRIAL, CAT: INDUSTRIAL, DE: INDUSTRIAL, CMI: INDUSTRIAL, PH: INDUSTRIAL, ITW: INDUSTRIAL,
  EOG: ENERGY, DVN: ENERGY, MPC: ENERGY, VLO: ENERGY, WMB: ENERGY, OKE: ENERGY, HAL: ENERGY, COP: ENERGY,
  DLR: REIT, AMT: REIT, CCI: REIT, SBAC: REIT,
  FDX: LOGISTICS, UPS: LOGISTICS,
  ADM: AG, BG: AG, NTR: AG,
  PYPL: FINTECH, SHOP: PLATFORM, OKTA: CYBER, TEAM: SOFTWARE, WDAY: SOFTWARE, MELI: PLATFORM,
  UBER: PLATFORM, ABNB: PLATFORM,
  TMUS: TELECOM, VZ: TELECOM, T: TELECOM,
};

/** Wave 2 template GICS by ticker. */
export const TICKER_GICS_WAVE2: Record<string, GicsClassification> = {
  JPM: FIN, BAC: FIN, GS: FIN, MS: FIN, SCHW: FIN, BLK: FIN, C: FIN, WFC: FIN, PNC: FIN, TFC: FIN,
  AXP: FINTECH, COF: FINTECH, AIG: FIN, MET: FIN, PRU: FIN, SPGI: FIN, ICE: FIN, CME: FIN, MCO: FIN, MSCI: FIN,
  NKE: CONSUMER, COST: CONSUMER, WMT: CONSUMER, SBUX: CONSUMER, CMG: CONSUMER, YUM: CONSUMER, DPZ: CONSUMER, TJX: CONSUMER, ROST: CONSUMER, LULU: CONSUMER, DECK: CONSUMER, ONON: CONSUMER,
  EL: CONSUMER, PG: STAPLES, CLX: STAPLES, KMB: STAPLES, GIS: STAPLES, K: STAPLES, HSY: STAPLES, MDLZ: STAPLES, KO: STAPLES, PEP: STAPLES,
  JNJ: PHARMA, ABBV: PHARMA, CI: HEALTH, HUM: HEALTH, ELV: HEALTH, CVS: HEALTH,
  META: PLATFORM, NFLX: MEDIA, ADBE: SOFTWARE, INTU: SOFTWARE, ADSK: SOFTWARE,
  QCOM: SEMI, SWKS: SEMI, MTSI: SEMI, ALGM: SEMI, RMBS: SEMI, CRUS: SEMI, SLAB: SEMI, SITM: SEMI, LITE: SEMI,
  DOV: INDUSTRIAL, ROP: SOFTWARE, FTV: INDUSTRIAL, IEX: INDUSTRIAL, GNRC: INDUSTRIAL, AOS: INDUSTRIAL, NDSN: INDUSTRIAL, AME: INDUSTRIAL, IT: SOFTWARE, TDY: INDUSTRIAL,
  EQT: ENERGY, AR: ENERGY, FANG: ENERGY, MTDR: ENERGY, CVI: ENERGY, DINO: ENERGY,
  PLD: REIT, SPG: REIT, WELL: REIT, EXR: REIT,
  DUK: UTIL, AEP: UTIL, EXC: UTIL, SRE: UTIL, ES: UTIL, ETR: UTIL,
  CMCSA: TELECOM, CHTR: TELECOM, WBD: MEDIA, SPOT: MEDIA, ROKU: MEDIA, PINS: PLATFORM, SNAP: PLATFORM, MTCH: PLATFORM,
  HUBS: SOFTWARE, WIX: SOFTWARE, ESTC: SOFTWARE, PATH: SOFTWARE, BILL: FINTECH, TWLO: SOFTWARE, ZM: SOFTWARE, DOCU: SOFTWARE,
  CHKP: CYBER, CYBR: CYBER, TENB: CYBER, S: CYBER, RPD: CYBER, VRNS: CYBER,
};

export const TICKER_GICS_WAVES: Record<string, GicsClassification> = {
  ...TICKER_GICS_WAVE1,
  ...TICKER_GICS_WAVE2,
};
