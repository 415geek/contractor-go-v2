# Permit 查询 — 各城市开放数据说明

应用通过 Edge Function **`search-permit`** 调用 **市政府公开的许可 / DBI 类数据**，再用 AI 整理为统一结构。各城市数据源不同，**不可**对所有城市使用同一套 Socrata `$where=address like`（很多数据集没有 `address` 列）。

## 旧金山：Property Information Map（PIM）与 DataSF

规划局官方说明：[SF PIM Help](https://sfplanninggis.org/pim/help.html)。要点：

- **PIM 网页**：`https://sfplanninggis.org/pim/`；深链搜索与官网一致：`?search=` + 查询字符串（地址、地块、规划案号、DBI 许可号等）。
- **数据来源**：帮助页列出的大部分图层可在 [DataSF](https://data.sfgov.org/) 下载或通过 API 访问（Shapefile / CSV / KML / Socrata 等）。
- **应用内实现**：
  - **规划地图模式**：在 App 内嵌官方 PIM 页面（`WebView` / 与浏览器相同内容与交互），外层使用 Contractor GO 风格顶栏、分段切换与说明文案，并附官方帮助与 DataSF 链接。
  - **许可 AI 摘要模式**：仍由 **`search-permit`** 调用 DataSF 建筑许可等资源，**不经过** 本仓库中的 **Nova Act**（Nova Act 仅用于 `search-material` 等材料站爬虫）。

若需扩展「非地图」属性字段，可在 `_shared/permit-open-data.ts` / 新 Edge 函数中按帮助页数据集列表接入更多 Socrata `resource`。

## San Francisco（DataSF / DBI 风格建筑许可）

- **门户**：[DataSF](https://datasf.org/opendata/)（`data.sfgov.org`）
- **数据集**：Building Permit Tracking  
  - Resource：`i98e-djp9`  
  - 示例：`https://data.sfgov.org/resource/i98e-djp9.json`
- **推荐查询**：Socrata **`$q` 全文检索**（搜索多列，含 `street_number`、`street_name`、`description` 等）  
  - 文档：<https://dev.socrata.com/docs/queries/q.html>
- **可选**：注册 Socrata 应用令牌，配置 Secret **`SOCRATA_APP_TOKEN`**，请求头携带 `X-App-Token` 以提高限额。

用户地址中应包含 **San Francisco** 或 **SF**（或常见 SF 邮编 `941xx`），以便识别城市。

## San Jose（市开放数据门户 / CKAN）

- **门户**：[San Jose Open Data](https://data.sanjoseca.gov/)
- **数据集**：Active Building Permits（Datastore）
- **接口**：CKAN **`datastore_search`**（POST JSON，`resource_id` + **`q`** 全文检索，匹配含 `gx_location` 等字段）
- **示例**：`https://data.sanjoseca.gov/api/3/action/datastore_search`

用户地址中应包含 **San Jose**。

## Oakland 及其他城市

- **Oakland**：当前 **`data.oaklandca.gov` 上未发现**与本应用兼容的、可公开查询的建筑许可 Socrata 资源（旧 `building-permits` 路径已不可用）。若市政府后续发布稳定 API，可在 `_shared/permit-open-data.ts` 中按该市文档追加 `fetch` 逻辑。
- **扩展方式**：查阅目标城市 **DBI / Planning / Building** 部门的 **Open Data** 文档，确认：
  1. 基础 URL（Socrata / CKAN / ArcGIS 等）
  2. 资源 ID 与字段名
  3. 官方推荐的地址 / 全文检索参数（勿假设存在 `address` 列）

## 部署

修改 `search-permit` 或 `_shared/permit-open-data.ts` 后：

```bash
supabase functions deploy search-permit
```

可选 Secret：`SOCRATA_APP_TOKEN`（仅影响 SF Socrata 请求）。
