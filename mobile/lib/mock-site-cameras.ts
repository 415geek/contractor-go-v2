/** 工地监控演示数据；后续可替换为真实设备 / 流媒体 API */

export type SiteCamera = {
  id: string;
  siteName: string;
  cameraLabel: string;
  status: "online" | "offline" | "weak";
  lastSeen?: string;
};

export type ConstructionSite = {
  id: string;
  name: string;
  address: string;
  cameras: SiteCamera[];
};

export const MOCK_CONSTRUCTION_SITES: ConstructionSite[] = [
  {
    id: "site-1",
    name: "Oak Ave 厨房翻新",
    address: "1200 Oak Ave, San Jose",
    cameras: [
      { id: "cam-1a", siteName: "Oak Ave 厨房翻新", cameraLabel: "大门入口", status: "online" },
      { id: "cam-1b", siteName: "Oak Ave 厨房翻新", cameraLabel: "作业区", status: "online" },
    ],
  },
  {
    id: "site-2",
    name: "Maple St 卫浴改造",
    address: "88 Maple St, SF",
    cameras: [{ id: "cam-2a", siteName: "Maple St 卫浴改造", cameraLabel: "主卫", status: "weak", lastSeen: "2分钟前" }],
  },
];

export function findCameraById(id: string): SiteCamera | undefined {
  for (const s of MOCK_CONSTRUCTION_SITES) {
    const c = s.cameras.find((x) => x.id === id);
    if (c) return c;
  }
  return undefined;
}
