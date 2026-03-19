#!/usr/bin/env bash
# 在 VPS 上执行：拉取 main、构建 Expo Web、同步到 Nginx 静态目录。
# 用法：sudo /usr/local/bin/contractor-web-deploy.sh
# 依赖：Node 18+、git、nginx；仓库目录下需存在 mobile/.env（勿提交到 Git）。

set -euo pipefail

REPO_DIR="${CONTRACTOR_REPO_DIR:-/opt/contractor-go-v2}"
WEB_ROOT="${CONTRACTOR_WEB_ROOT:-/var/www/contractor-web}"
BRANCH="${CONTRACTOR_GIT_BRANCH:-main}"

log() { echo "[deploy] $*"; }

if [[ ! -d "$REPO_DIR/.git" ]]; then
  log "仓库目录不存在或不是 git 仓库: $REPO_DIR"
  exit 1
fi

if [[ ! -f "$REPO_DIR/mobile/.env" ]]; then
  log "缺少 $REPO_DIR/mobile/.env"
  log "请从本机复制：scp mobile/.env root@服务器:$REPO_DIR/mobile/.env"
  log "或：cp $REPO_DIR/mobile/.env.example $REPO_DIR/mobile/.env 后编辑"
  exit 1
fi

cd "$REPO_DIR"
log "git fetch + reset --hard origin/$BRANCH"
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"

log "npm run build:web"
npm run build:web

if [[ ! -d "$REPO_DIR/mobile/dist" ]]; then
  log "构建未生成 mobile/dist，请检查构建日志"
  exit 1
fi

mkdir -p "$WEB_ROOT"
log "rsync -> $WEB_ROOT"
rsync -a --delete "$REPO_DIR/mobile/dist/" "$WEB_ROOT/"

if command -v nginx >/dev/null 2>&1; then
  log "nginx reload"
  nginx -t && systemctl reload nginx
fi

log "完成"
