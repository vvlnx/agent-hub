/** Client-safe GICS exports — no Node/undici/catalog dependencies. */
export type { GicsClassification, GicsMappingKind, GicsQueryMapping, GicsSource } from "./types";
export { formatGicsPath } from "./types";
export type {
  GicsResearch,
  GicsCompanyReport,
  GicsWorkflowPlan,
  GicsOrgRole,
} from "./researchTypes";
