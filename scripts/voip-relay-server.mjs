#!/usr/bin/env node
/**
 * Voip.ms 透明中继：在固定公网 IP 的 VPS 上运行，把该 IP 加入 Voip.ms API 白名单。
 *
 * 用法：
 *   RELAY_SECRET=your-long-random-secret PORT=8787 node scripts/voip-relay-server.mjs
 *
 * Supabase Secrets：
 *   VOIP_RELAY_URL=https://你的域名/voip   （与反代路径一致，无末尾斜杠）
 *   VOIP_RELAY_SECRET=与 RELAY_SECRET 相同
 *
 * 生产环境请在前面加 HTTPS（Nginx/Caddy），勿对公网裸 HTTP 传 API 密码。
 */

import http from "node:http";
import { URL } from "node:url";

const PORT = Number(process.env.PORT || 8787);
const RELAY_SECRET = process.env.RELAY_SECRET?.trim();
const VOIP_BASE = "https://voip.ms/api/v1/rest.php";

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
    });
    res.end();
    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "method_not_allowed" }));
    return;
  }

  if (RELAY_SECRET) {
    const auth = req.headers.authorization;
    const token = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : null;
    if (token !== RELAY_SECRET) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "unauthorized" }));
      return;
    }
  }

  const u = new URL(req.url || "/", "http://localhost");
  const qs = u.search || "";
  const target = `${VOIP_BASE}${qs}`;

  try {
    const r = await fetch(target, { method: req.method });
    const body = await r.arrayBuffer();
    const ct = r.headers.get("content-type") || "application/json";
    res.writeHead(r.status, { "Content-Type": ct });
    res.end(Buffer.from(body));
  } catch (e) {
    console.error("[voip-relay]", e);
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "bad_gateway", message: String(e?.message || e) }));
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[voip-relay] listening on 0.0.0.0:${PORT} -> ${VOIP_BASE}`);
  if (RELAY_SECRET) console.log("[voip-relay] RELAY_SECRET: enabled");
  else console.warn("[voip-relay] RELAY_SECRET: not set (open relay — not recommended)");
});
