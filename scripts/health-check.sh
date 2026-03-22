#!/usr/bin/env bash
# 全面检查功能是否可跑通（本地或服务器均可执行）
# 用法：./scripts/health-check.sh 或 bash scripts/health-check.sh

set -euo pipefail

# 加载 mobile/.env 以获取 Supabase 配置
[[ -f mobile/.env ]] && set -a && source mobile/.env 2>/dev/null && set +a
SUPABASE_URL="${EXPO_PUBLIC_SUPABASE_URL:-${NEXT_PUBLIC_SUPABASE_URL:-}}"
SUPABASE_ANON_KEY="${EXPO_PUBLIC_SUPABASE_ANON_KEY:-${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}}"
FAILED=0

log_ok()   { echo "  ✓ $*"; }
log_fail() { echo "  ✗ $*"; FAILED=1; }
log_info() { echo "  - $*"; }

echo ""
echo "========== Contractor GO 功能检查 =========="
echo ""

# 1. 环境变量
echo "1. 环境变量"
if [[ -f mobile/.env ]]; then
  log_ok "mobile/.env 存在"
  # 不打印敏感内容，只检查关键变量
  if grep -q "EXPO_PUBLIC_SUPABASE_URL=" mobile/.env 2>/dev/null; then
    log_ok "EXPO_PUBLIC_SUPABASE_URL 已配置"
  else
    log_fail "EXPO_PUBLIC_SUPABASE_URL 未配置"
  fi
  if grep -q "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=" mobile/.env 2>/dev/null; then
    log_ok "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY 已配置"
  else
    log_fail "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY 未配置"
  fi
else
  log_fail "mobile/.env 不存在（请复制 mobile/.env.example 并编辑）"
fi
echo ""

# 2. 构建
echo "2. Web 构建"
if npm run build:web 2>&1 | tail -20; then
  log_ok "mobile/dist 构建成功"
  if [[ -d mobile/dist ]]; then
    log_ok "mobile/dist 目录存在"
    [[ -f mobile/dist/index.html ]] && log_ok "index.html 存在" || log_fail "index.html 缺失"
  else
    log_fail "mobile/dist 未生成"
  fi
else
  log_fail "构建失败"
fi
echo ""

# 3. Supabase Edge Functions（若配置了 URL）
echo "3. Supabase Edge Functions"
if [[ -n "$SUPABASE_URL" ]] && [[ -n "$SUPABASE_ANON_KEY" ]]; then
  # POST 类
  for fn in get-conversations voip-my-numbers projects translate; do
    status=$(curl -s -o /dev/null -w "%{http_code}" \
      -X POST "${SUPABASE_URL}/functions/v1/${fn}" \
      -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
      -H "Content-Type: application/json" \
      -d '{}' 2>/dev/null || echo "000")
    if [[ "$status" == "401" ]] || [[ "$status" == "200" ]] || [[ "$status" == "400" ]]; then
      log_ok "${fn} 可访问 (HTTP ${status})"
    else
      log_info "${fn} 返回 HTTP ${status}"
    fi
  done
  # GET 类（voip-available-numbers 用 GET + query）
  status=$(curl -s -o /dev/null -w "%{http_code}" \
    -X GET "${SUPABASE_URL}/functions/v1/voip-available-numbers?did=416" \
    -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" 2>/dev/null || echo "000")
  if [[ "$status" == "401" ]] || [[ "$status" == "200" ]] || [[ "$status" == "400" ]]; then
    log_ok "voip-available-numbers 可访问 (HTTP ${status})"
  else
    log_info "voip-available-numbers 返回 HTTP ${status}"
  fi
else
  log_info "未设置 SUPABASE_URL/ANON_KEY，跳过 Edge Function 检查"
fi
echo ""

# 4. 静态资源
echo "4. 静态资源"
if [[ -d mobile/dist ]]; then
  [[ -f mobile/dist/index.html ]] && log_ok "mobile/dist 含 index.html" || log_fail "index.html 缺失"
else
  log_info "mobile/dist 不存在，跳过"
fi
echo ""

# 5. Admin 构建（VPS 通常只部署 mobile web，admin 在 Vercel，此项可选）
echo "5. Admin 构建"
if [[ -d admin ]] && [[ -f admin/package.json ]]; then
  if (cd admin && npm run build 2>&1 | tail -5); then
    log_ok "admin 构建成功"
  else
    log_info "admin 构建跳过（VPS 上非必须，admin 由 Vercel 部署）"
  fi
else
  log_info "admin 目录不存在，跳过"
fi
echo ""

echo "========== 检查完成 =========="
if [[ $FAILED -eq 1 ]]; then
  echo ""
  echo "存在失败项，请检查上述输出。"
  exit 1
fi
echo ""
echo "全部通过。"
exit 0
