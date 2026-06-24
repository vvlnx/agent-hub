import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

const candidates = [
  process.env.GICS_EXPORT_SCRIPT?.trim(),
  join(projectRoot, "../../../GICS_industry/export_for_throatscan.py"),
  join(projectRoot, "../../GICS_industry/export_for_throatscan.py"),
].filter(Boolean);

const script = candidates.find((path) => existsSync(path));

if (!script) {
  console.error("Could not find export_for_throatscan.py.");
  console.error("");
  console.error("Optional sync paths tried:");
  for (const path of candidates) {
    console.error(`  - ${path}`);
  }
  console.error("");
  console.error("Set GICS_EXPORT_SCRIPT to the full path of export_for_throatscan.py,");
  console.error("or clone GICS_industry beside this repo.");
  console.error("Bundled data/gics-sp500-map.json is already checked in; sync is optional.");
  process.exit(1);
}

console.log(`Running ${script}`);
const result = spawnSync("python3", [script], { stdio: "inherit", cwd: projectRoot });
process.exit(result.status ?? 1);
