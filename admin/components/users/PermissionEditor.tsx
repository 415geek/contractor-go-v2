"use client";

import { useState, useEffect } from "react";
import type { UserPermissions } from "@/hooks/useUsers";

type Props = {
  permissions: UserPermissions;
  onSave: (p: UserPermissions) => void;
  saving?: boolean;
};

const defaultPermissions: UserPermissions = {
  voip: { canPurchaseNumber: true, maxNumbers: 1, sms: true, voice: true },
  translation: { enabled: true, voiceEnabled: false, monthlyTokenLimit: 10000 },
  project: { maxProjects: 10, aiPlanEnabled: true, materialListEnabled: true },
  tools: {
    materialPriceCompare: true,
    houseEstimate: true,
    arMeasure: false,
    blueprint: false,
    permit: true,
  },
};

export function PermissionEditor({ permissions, onSave, saving }: Props) {
  const [local, setLocal] = useState<UserPermissions>(() => ({
    ...defaultPermissions,
    ...permissions,
  }));

  useEffect(() => {
    setLocal((prev) => ({ ...defaultPermissions, ...prev, ...permissions }));
  }, [permissions]);

  const update = <K extends keyof UserPermissions>(key: K, value: UserPermissions[K]) => {
    setLocal((p) => ({ ...p, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-3 font-medium">VOIP</h3>
        <div className="space-y-2 rounded-lg border p-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={local.voip?.canPurchaseNumber ?? false}
              onChange={(e) =>
                update("voip", { ...local.voip, canPurchaseNumber: e.target.checked })
              }
            />
            购买号码
          </label>
          <label className="flex items-center gap-2">
            最大数量
            <input
              type="number"
              min={0}
              value={local.voip?.maxNumbers ?? 0}
              onChange={(e) =>
                update("voip", { ...local.voip, maxNumbers: parseInt(e.target.value, 10) || 0 })
              }
              className="w-20 rounded border px-2 py-1"
            />
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={local.voip?.sms ?? false}
              onChange={(e) => update("voip", { ...local.voip, sms: e.target.checked })}
            />
            短信
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={local.voip?.voice ?? false}
              onChange={(e) => update("voip", { ...local.voip, voice: e.target.checked })}
            />
            语音
          </label>
        </div>
      </section>

      <section>
        <h3 className="mb-3 font-medium">翻译</h3>
        <div className="space-y-2 rounded-lg border p-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={local.translation?.enabled ?? false}
              onChange={(e) =>
                update("translation", { ...local.translation, enabled: e.target.checked })
              }
            />
            文字翻译
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={local.translation?.voiceEnabled ?? false}
              onChange={(e) =>
                update("translation", { ...local.translation, voiceEnabled: e.target.checked })
              }
            />
            语音翻译
          </label>
          <label className="flex items-center gap-2">
            月度 Token 限额
            <input
              type="number"
              min={0}
              value={local.translation?.monthlyTokenLimit ?? 0}
              onChange={(e) =>
                update("translation", {
                  ...local.translation,
                  monthlyTokenLimit: parseInt(e.target.value, 10) || 0,
                })
              }
              className="w-28 rounded border px-2 py-1"
            />
          </label>
        </div>
      </section>

      <section>
        <h3 className="mb-3 font-medium">项目</h3>
        <div className="space-y-2 rounded-lg border p-4">
          <label className="flex items-center gap-2">
            最大项目数
            <input
              type="number"
              min={0}
              value={local.project?.maxProjects ?? 0}
              onChange={(e) =>
                update("project", {
                  ...local.project,
                  maxProjects: parseInt(e.target.value, 10) || 0,
                })
              }
              className="w-20 rounded border px-2 py-1"
            />
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={local.project?.aiPlanEnabled ?? false}
              onChange={(e) =>
                update("project", { ...local.project, aiPlanEnabled: e.target.checked })
              }
            />
            AI 方案生成
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={local.project?.materialListEnabled ?? false}
              onChange={(e) =>
                update("project", { ...local.project, materialListEnabled: e.target.checked })
              }
            />
            建材清单
          </label>
        </div>
      </section>

      <section>
        <h3 className="mb-3 font-medium">工具</h3>
        <div className="space-y-2 rounded-lg border p-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={local.tools?.materialPriceCompare ?? false}
              onChange={(e) =>
                update("tools", { ...local.tools, materialPriceCompare: e.target.checked })
              }
            />
            材料价格
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={local.tools?.houseEstimate ?? false}
              onChange={(e) =>
                update("tools", { ...local.tools, houseEstimate: e.target.checked })
              }
            />
            房屋估价
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={local.tools?.arMeasure ?? false}
              onChange={(e) =>
                update("tools", { ...local.tools, arMeasure: e.target.checked })
              }
            />
            AR 测量
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={local.tools?.blueprint ?? false}
              onChange={(e) =>
                update("tools", { ...local.tools, blueprint: e.target.checked })
              }
            />
            Blueprint
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={local.tools?.permit ?? false}
              onChange={(e) =>
                update("tools", { ...local.tools, permit: e.target.checked })
              }
            />
            物业信息（Permit / PIM）
          </label>
        </div>
      </section>

      <button
        type="button"
        disabled={saving}
        onClick={() => onSave(local)}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {saving ? "保存中…" : "保存权限"}
      </button>
    </div>
  );
}
