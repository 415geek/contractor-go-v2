import { US_REGION_NAME_TO_STATE } from "@/lib/us-region-to-state";

export type IpLocationHint = { stateCode: string; regionLabel: string };

/**
 * 无需定位权限：用出口 IP 粗判美国州（ip-api.com，非商业用途请遵守其条款）。
 */
export async function guessUsStateFromIp(): Promise<IpLocationHint | null> {
  try {
    const res = await fetch("https://ip-api.com/json/?fields=status,message,countryCode,regionName");
    const j = (await res.json()) as { status?: string; countryCode?: string; regionName?: string };
    if (j.status !== "success" || j.countryCode !== "US" || !j.regionName) return null;
    const stateCode = US_REGION_NAME_TO_STATE[j.regionName];
    if (!stateCode) return null;
    return { stateCode, regionLabel: j.regionName };
  } catch {
    return null;
  }
}
