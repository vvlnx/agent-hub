import { getCachedBitgetSymbols } from "../bitgetCache";
import type { EventIntelligence } from "../eventIntelligence";
import type { IndustryProfile } from "../mockData";
import type { Company } from "../types";
import type { TradabilityGuide, TradabilityProxyOption } from "./types";

const PROXY_SYMBOLS: Array<{
  bitget_symbol: string;
  ticker: string;
  role_en: string;
  role_zh: string;
}> = [
  { bitget_symbol: "SPYONUSDT", ticker: "SPY", role_en: "Broad US equity proxy", role_zh: "美股宽基代理" },
  { bitget_symbol: "QQQONUSDT", ticker: "QQQ", role_en: "Nasdaq / growth proxy", role_zh: "纳斯达克/成长代理" },
];

function isOnline(company: Company): boolean {
  return company.bitget_market?.status === "online" && Boolean(company.bitget_market.symbol);
}

async function listedProxySymbols(): Promise<Set<string>> {
  try {
    const symbols = await getCachedBitgetSymbols<Array<{ symbol: string; status: string }>>();
    return new Set(
      symbols
        .filter((row) => row.status?.toLowerCase() === "online")
        .map((row) => row.symbol.toUpperCase()),
    );
  } catch {
    return new Set();
  }
}

export async function buildTradabilityGuide(
  profile: IndustryProfile,
  companies: Company[],
  eventIntelligence: EventIntelligence,
): Promise<TradabilityGuide> {
  const selected = eventIntelligence.simulated_decision.selected_tickers;
  const direct_execution_available = selected.length > 0;
  const research_conclusion_valid = Boolean(profile.primary_bottleneck_ticker);

  const onlineCompanies = companies
    .filter(isOnline)
    .sort((a, b) => b.score - a.score || a.ticker.localeCompare(b.ticker));

  const researchOnly = companies
    .filter((company) => !isOnline(company))
    .sort((a, b) => b.score - a.score || a.ticker.localeCompare(b.ticker))
    .slice(0, 5)
    .map((company) => company.ticker);

  const proxyOptions: TradabilityProxyOption[] = [];
  const listed = await listedProxySymbols();

  for (const proxy of PROXY_SYMBOLS) {
    if (!listed.has(proxy.bitget_symbol)) continue;
    proxyOptions.push({
      ticker: proxy.ticker,
      bitget_symbol: proxy.bitget_symbol,
      role_en: proxy.role_en,
      role_zh: proxy.role_zh,
      reason_en: `Use ${proxy.bitget_symbol} when the research bottleneck is not directly listed on Bitget.`,
      reason_zh: `当研究瓶颈标的未在 Bitget 上线时，可使用 ${proxy.bitget_symbol} 作为方向性代理。`,
    });
  }

  for (const company of onlineCompanies) {
    if (proxyOptions.some((option) => option.ticker === company.ticker)) continue;
    if (selected.includes(company.ticker)) continue;
    proxyOptions.push({
      ticker: company.ticker,
      bitget_symbol: company.bitget_market!.symbol!,
      role_en: "Sector-related Bitget-listed proxy",
      role_zh: "与主题相关的 Bitget 已上线代理",
      reason_en: `${company.ticker} is online on Bitget but was not selected for the current simulated basket.`,
      reason_zh: `${company.ticker} 已在 Bitget 上线，但未进入当前模拟篮子。`,
    });
    if (proxyOptions.length >= 5) break;
  }

  let recommended_action_en: string;
  let recommended_action_zh: string;
  let summary_en: string;
  let summary_zh: string;

  if (direct_execution_available) {
    summary_en = `Direct Bitget execution is available for ${selected.join(", ")}.`;
    summary_zh = `可直接在 Bitget 执行：${selected.join("、")}。`;
    recommended_action_en =
      "Proceed with paper basket execution or download the evidence bundle for audit.";
    recommended_action_zh = "可执行纸交易篮子，或下载证据包供审计。";
  } else if (research_conclusion_valid) {
    summary_en =
      "Research conclusion is valid, but no selected candidate is currently tradable as a Bitget stock token.";
    summary_zh = "研究结论成立，但当前选中的候选均未作为 Bitget 股票代币可交易。";
    recommended_action_en =
      proxyOptions.length > 0
        ? `Keep research names as conclusions; for execution use a listed proxy such as ${proxyOptions[0]!.bitget_symbol}, or remain on watch.`
        : "Keep results as research-only until Bitget lists a matching stock token.";
    recommended_action_zh =
      proxyOptions.length > 0
        ? `研究标的保留为结论；如需执行，可使用已上线代理如 ${proxyOptions[0]!.bitget_symbol}，或继续观察。`
        : "在 Bitget 上线匹配标的前，仅保留为研究结论。";
  } else {
    summary_en = "Mapping confidence is too low for a tradable or research-grade conclusion.";
    summary_zh = "映射置信度过低，暂无法形成可交易或研究级结论。";
    recommended_action_en = "Try a canonical demo industry or wait for broader universe coverage.";
    recommended_action_zh = "请尝试已验证的演示行业，或等待更广的 universe 覆盖。";
  }

  return {
    direct_execution_available,
    research_conclusion_valid,
    summary_en,
    summary_zh,
    research_only_tickers: researchOnly,
    online_proxy_options: proxyOptions,
    recommended_action_en,
    recommended_action_zh,
  };
}
