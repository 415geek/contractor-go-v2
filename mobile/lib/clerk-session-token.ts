/**
 * Web 上常见：isSignedIn 已为 true，但首几次 getToken() 仍返回 null（Clerk session 尚未就绪）。
 * 所有带 Clerk JWT 的 Supabase Edge 调用应经此函数取 token，避免 401「Invalid or missing token」。
 */
export async function getClerkSessionTokenForEdge(
  getToken: () => Promise<string | null>,
): Promise<string> {
  const waits = [0, 80, 160, 320, 500, 700, 1000];
  for (const ms of waits) {
    if (ms > 0) await new Promise((r) => setTimeout(r, ms));
    const t = await getToken();
    if (t?.trim()) return t.trim();
  }
  throw new Error("登录会话未就绪，请刷新页面或重新登录后再试。");
}
