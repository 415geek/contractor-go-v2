/**
 * San Francisco Planning — Property Information Map (PIM)
 * 官方说明：https://sfplanninggis.org/pim/help.html
 *
 * 深链格式（与官网一致）：`?search=` + 查询文本（地址、地块、规划案号、DBI 许可号等）
 * 底层数据集多来自 DataSF 开放门户，与本应用 Edge `search-permit` 使用的许可 API 同源理念。
 */

export const SF_PIM_HELP_URL = "https://sfplanninggis.org/pim/help.html";
export const SF_PIM_BASE_URL = "https://sfplanninggis.org/pim/";

/** 构建与官网「Link」功能等效的 URL */
export function buildSfPimSearchUrl(searchText: string): string {
  const q = searchText.trim();
  if (!q) return SF_PIM_BASE_URL;
  return `${SF_PIM_BASE_URL}?search=${encodeURIComponent(q)}`;
}

export const SF_PIM_ATTRIBUTION =
  "地图与属性数据由旧金山规划局 Property Information Map（PIM）提供，数据集多来自 DataSF 开放数据门户。";
