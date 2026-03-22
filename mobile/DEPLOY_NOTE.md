# 关于用 `mobile/` 跑 `vercel deploy`

**生产站点（www.contractorgo.io）不要以本目录为 Vercel Root Directory 部署**，除非你有意做独立预览。

团队约定：用户端在 Vercel 上的项目名为 **`contractorgo-web`**，连接**仓库根目录**（Root Directory **留空**），由根目录 `vercel.json` 执行 `npm run build:web` 生成 `mobile/dist`。

在本目录执行 `vercel` CLI 会关联到**另一个** Vercel 项目，环境变量与 `contractorgo-web` **不共享**。

详见仓库根目录 **`docs/DEPLOY_QUICKSTART.md`**、**`docs/VERCEL_SETUP.md`**。
