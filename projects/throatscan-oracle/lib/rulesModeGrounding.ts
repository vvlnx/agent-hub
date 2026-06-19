import { normalizeIndustryQuery } from "./industryAliases";
import type { LLMResearchSource } from "./llm/types";
import type { IndustryIntent } from "./reasoning/types";

export type GroundingMode = "live_web_search" | "curated_rules" | "none";

interface CuratedGrounding {
  canonical_key: string;
  research_queries: string[];
  research_sources: LLMResearchSource[];
}

/** Authoritative public sources for canonical industries when LLM web search is unavailable. */
const CURATED_GROUNDING: CuratedGrounding[] = [
  {
    canonical_key: "ai chips",
    research_queries: ["AI GPU supply chain bottleneck", "semiconductor fab capacity 2025"],
    research_sources: [
      {
        url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&search_text=NVDA&type=10-K",
        title: "SEC EDGAR — NVIDIA 10-K filings",
        cited: true,
      },
      {
        url: "https://www.semiconductors.org/resources/",
        title: "SIA — Semiconductor Industry Association resources",
        cited: true,
      },
      {
        url: "https://www.iea.org/reports",
        title: "IEA — Energy and data-centre demand reports",
        cited: false,
      },
    ],
  },
  {
    canonical_key: "semiconductor",
    research_queries: ["semiconductor equipment bottleneck", "wafer fab capacity"],
    research_sources: [
      {
        url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&search_text=ASML&type=20-F",
        title: "SEC EDGAR — ASML filings",
        cited: true,
      },
      {
        url: "https://www.semiconductors.org/resources/",
        title: "SIA industry data",
        cited: true,
      },
    ],
  },
  {
    canonical_key: "ai data center",
    research_queries: ["AI data center power demand", "hyperscale capex cycle"],
    research_sources: [
      {
        url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&search_text=EQIX&type=10-K",
        title: "SEC EDGAR — Equinix 10-K",
        cited: true,
      },
      {
        url: "https://www.eia.gov/electricity/data.php",
        title: "EIA — US electricity data",
        cited: true,
      },
    ],
  },
  {
    canonical_key: "ev battery",
    research_queries: ["lithium supply chain", "EV battery cathode capacity"],
    research_sources: [
      {
        url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&search_text=ALB&type=10-K",
        title: "SEC EDGAR — Albemarle 10-K",
        cited: true,
      },
      {
        url: "https://www.iea.org/reports/global-ev-outlook-2024",
        title: "IEA — Global EV Outlook",
        cited: true,
      },
    ],
  },
  {
    canonical_key: "oil and gas",
    research_queries: ["upstream oil supply constraint", "refining capacity utilization"],
    research_sources: [
      {
        url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&search_text=XOM&type=10-K",
        title: "SEC EDGAR — ExxonMobil 10-K",
        cited: true,
      },
      {
        url: "https://www.eia.gov/petroleum/data.php",
        title: "EIA — Petroleum data",
        cited: true,
      },
    ],
  },
  {
    canonical_key: "biotech",
    research_queries: ["pharma pipeline bottleneck", "GLP-1 manufacturing capacity"],
    research_sources: [
      {
        url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&search_text=LLY&type=10-K",
        title: "SEC EDGAR — Eli Lilly 10-K",
        cited: true,
      },
      {
        url: "https://www.fda.gov/drugs",
        title: "FDA — Drug approvals and manufacturing",
        cited: false,
      },
    ],
  },
  {
    canonical_key: "nuclear",
    research_queries: ["uranium supply chain", "nuclear fuel enrichment capacity"],
    research_sources: [
      {
        url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&search_text=CCJ&type=40-F",
        title: "SEC EDGAR — Cameco filings",
        cited: true,
      },
      {
        url: "https://www.eia.gov/nuclear/",
        title: "EIA — Nuclear energy overview",
        cited: true,
      },
    ],
  },
  {
    canonical_key: "robotics",
    research_queries: ["industrial robotics supply chain", "automation capex cycle"],
    research_sources: [
      {
        url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&search_text=ISRG&type=10-K",
        title: "SEC EDGAR — Intuitive Surgical 10-K",
        cited: true,
      },
      {
        url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&search_text=ROK&type=10-K",
        title: "SEC EDGAR — Rockwell Automation 10-K",
        cited: false,
      },
    ],
  },
  {
    canonical_key: "automotive",
    research_queries: ["automotive OEM supply chain", "EV platform bottleneck"],
    research_sources: [
      {
        url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&search_text=GM&type=10-K",
        title: "SEC EDGAR — General Motors 10-K",
        cited: true,
      },
      {
        url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&search_text=TSLA&type=10-K",
        title: "SEC EDGAR — Tesla 10-K",
        cited: true,
      },
    ],
  },
  {
    canonical_key: "fintech",
    research_queries: ["payment network switching costs", "fintech platform regulation"],
    research_sources: [
      {
        url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&search_text=V&type=10-K",
        title: "SEC EDGAR — Visa 10-K",
        cited: true,
      },
      {
        url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&search_text=COIN&type=10-K",
        title: "SEC EDGAR — Coinbase 10-K",
        cited: false,
      },
    ],
  },
  {
    canonical_key: "defense",
    research_queries: ["defense prime backlog", "aerospace supply chain constraints"],
    research_sources: [
      {
        url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&search_text=LMT&type=10-K",
        title: "SEC EDGAR — Lockheed Martin 10-K",
        cited: true,
      },
      {
        url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&search_text=RTX&type=10-K",
        title: "SEC EDGAR — RTX 10-K",
        cited: true,
      },
    ],
  },
];

function resolveCuratedGrounding(rawInput: string): CuratedGrounding | null {
  const normalized = normalizeIndustryQuery(rawInput).toLowerCase();

  const exact = CURATED_GROUNDING.find((entry) => entry.canonical_key === normalized);
  if (exact) return exact;

  return (
    CURATED_GROUNDING.find(
      (entry) =>
        normalized.includes(entry.canonical_key) || entry.canonical_key.includes(normalized),
    ) ?? null
  );
}

export function enrichIntentWithRulesGrounding(
  intent: IndustryIntent,
  inferenceMode: "constrained" | "constrained_llm",
): IndustryIntent & { grounding_mode: GroundingMode } {
  if (inferenceMode === "constrained_llm" && intent.web_search_used && intent.research_sources?.length) {
    return { ...intent, grounding_mode: "live_web_search" };
  }

  const curated = resolveCuratedGrounding(intent.raw_input);
  if (!curated) {
    return { ...intent, grounding_mode: "none" };
  }

  return {
    ...intent,
    research_sources: curated.research_sources,
    research_queries: curated.research_queries,
    web_search_used: false,
    grounding_mode: "curated_rules",
  };
}
