/**
 * 旧金山湾区及邻近可购号码区号（Voip.ms / 美国本土 NPA）
 * 进入购号页时由 Edge `voip-available-numbers?bay_area=1` 拉取库存，再在客户端按区域与数字筛选。
 * 与 `supabase/functions/voip-available-numbers/index.ts` 内 `BAY_AREA_NPAS` 须保持一致。
 */
export const BAY_AREA_NPAS_ORDERED = [
  "415",
  "628",
  "510",
  "341",
  "650",
  "408",
  "669",
  "925",
  "707",
  "831",
] as const;

export type BayAreaNpa = (typeof BAY_AREA_NPAS_ORDERED)[number];

/** 分组用于筛选芯片 */
export const BAY_AREA_REGIONS = [
  { key: "all", label: "全部" },
  { key: "sf", label: "旧金山" },
  { key: "east", label: "东湾" },
  { key: "peninsula", label: "半岛" },
  { key: "south", label: "南湾" },
  { key: "tri", label: "925 郊区" },
  { key: "north", label: "北湾" },
  { key: "near", label: "邻近" },
] as const;

export type BayAreaRegionFilterKey = (typeof BAY_AREA_REGIONS)[number]["key"];

const NPA_TO_REGION: Record<string, BayAreaRegionFilterKey> = {
  "415": "sf",
  "628": "sf",
  "510": "east",
  "341": "east",
  "650": "peninsula",
  "408": "south",
  "669": "south",
  "925": "tri",
  "707": "north",
  "831": "near",
};

/** 从 E.164 / 10 位号码取 NPA（前三位） */
export function getNpaFromDid(did: string): string {
  const d = did.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1")) return d.slice(1, 4);
  if (d.length >= 10) return d.slice(0, 3);
  return "";
}

export function getBayAreaRegionKeyForDid(did: string): BayAreaRegionFilterKey | null {
  const npa = getNpaFromDid(did);
  return NPA_TO_REGION[npa] ?? null;
}

/** 展示用：区域中文 + Voip rate center */
export function formatDidRegionLabel(did: string, ratecenter?: string): string {
  const npa = getNpaFromDid(did);
  const labels: Record<string, string> = {
    "415": "旧金山",
    "628": "旧金山",
    "510": "东湾",
    "341": "东湾",
    "650": "半岛",
    "408": "南湾",
    "669": "南湾",
    "925": "925 郊区",
    "707": "北湾",
    "831": "蒙特雷/邻近",
  };
  const area = labels[npa] ?? `区号 ${npa}`;
  const rc = ratecenter?.trim();
  return rc ? `${area} · ${rc}` : area;
}

export function didMatchesRegionFilter(did: string, filter: BayAreaRegionFilterKey): boolean {
  if (filter === "all") return true;
  const key = getBayAreaRegionKeyForDid(did);
  return key === filter;
}
