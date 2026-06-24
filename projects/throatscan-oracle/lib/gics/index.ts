export type { GicsClassification, GicsMappingKind, GicsQueryMapping, GicsSource } from "./types";
export { formatGicsPath } from "./types";
export { getTickerGics, getTickerGicsSource, TICKER_GICS, TICKER_GICS_COUNT } from "./tickerMap";
export { enrichCompaniesWithGics } from "./enrich";
export {
  fetchRemoteGicsBatch,
  gicsApiBase,
  isGicsApiConfigured,
  probeGicsApiHealth,
} from "./remoteClient";
export {
  getSp500Gics,
  GICS_SP500_COUNT,
  GICS_SP500_EXPORTED_AT,
  GICS_SP500_SOURCE_MODE,
} from "./sp500Map";
export { resolveGicsFromQuery, resolveGicsFromQueryAsync } from "./queryResolver";
export type { ResolvedGicsQuery, GicsQuerySource } from "./queryResolver";
export {
  discoverBitgetCandidatesByGicsPrefix,
  mergeDiscoveryResults,
} from "./gicsDiscovery";
export type { GicsDiscoveryResult } from "./gicsDiscovery";
export { buildGicsResearch } from "./research";
export type {
  GicsResearch,
  GicsCompanyReport,
  GicsWorkflowPlan,
  GicsOrgRole,
} from "./researchTypes";
export {
  getCatalogEntry,
  listCompaniesByGicsPrefix,
  searchGicsByQuery,
  GICS_CATALOG_TICKER_COUNT,
  industryGroupsAlign,
  sectorsAlign,
} from "./staticCatalog";
