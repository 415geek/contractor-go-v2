/**
 * NPA 数据来源：npm `us-area-codes` (MIT) data/codes.json，复制为 npa-regions.json
 */
import npaRegions from "./data/npa-regions.json" with { type: "json" };
import { US_REGION_NAME_TO_STATE } from "./us-state-names.ts";

const NPA = npaRegions as Record<string, string>;

/** 美国（及 PR）Voip 用州代码；加拿大等返回 null */
export function npaToVoipUsState(npa: string): string | null {
  const key = npa.replace(/\D/g, "").slice(0, 3);
  if (key.length !== 3) return null;
  const regionName = NPA[key];
  if (!regionName) return null;
  return US_REGION_NAME_TO_STATE[regionName] ?? null;
}

export function didMatchesNpa(did: string, npa: string): boolean {
  const d = did.replace(/\D/g, "");
  const n = npa.replace(/\D/g, "");
  if (n.length !== 3) return false;
  if (d.length === 11 && d.startsWith("1")) return d.slice(1, 4) === n;
  if (d.length >= 10) return d.slice(0, 3) === n;
  return false;
}
