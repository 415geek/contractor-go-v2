/**
 * 检测是否为文档占位符或明显无效的 Clerk Publishable Key（避免误配进 Vercel 仍能通过 trim 检查）。
 */
export function isPlaceholderClerkPublishableKey(key: string | undefined): boolean {
  const t = key?.trim() ?? "";
  if (!t) return true;
  // 文档示例：pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx（后缀全为 x）
  const m = t.match(/^pk_(test|live)_(.+)$/i);
  if (m && /^x+$/i.test(m[2])) return true;
  // 任意位置出现极长连续 x（常见复制错误）
  if (/x{24,}/i.test(t)) return true;
  return false;
}
