/**
 * 对外公示：Telnyx / TCR 10DLC、应用商店与人工审核会查看网站。
 * 部署前请将下列占位改为与营业执照、TCR Brand、Stripe 商业信息一致的正式内容。
 */
export const COMPANY_BRAND = "Contractor GO";

/** 法律运营主体名称（若与个人品牌一致可同 BRAND） */
export const LEGAL_ENTITY_NAME = "Contractor GO";

/**
 * 客户支持与企业联络邮箱（须可收信；建议与域名一致）
 */
export const SUPPORT_EMAIL = "support@contractorgo.io";

/**
 * 登记办公地址 / 主要营业地址（多行，勿使用虚假门牌号）。
 * 生产环境建议在 Vercel（contractorgo-web）设置 EXPO_PUBLIC_LEGAL_ADDRESS_LINES，
 * 用 | 分隔多行，例如：`123 Main St|Wilmington, DE 19801|United States`
 * 未设置时仅展示兜底一行，提交 10DLC 前务必配置或改成本数组常量。
 */
function parseAddressLinesFromEnv(): string[] {
  const raw = process.env.EXPO_PUBLIC_LEGAL_ADDRESS_LINES?.trim();
  if (!raw) return ["United States"];
  return raw
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const REGISTERED_ADDRESS_LINES: string[] = parseAddressLinesFromEnv();
