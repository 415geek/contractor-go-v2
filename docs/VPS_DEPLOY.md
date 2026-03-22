# VPS 自动部署（72.62.82.26 等）

用户端 Web 为 **Expo 静态导出**（与 Vercel `build:web` 一致），部署到 Nginx 目录。

## 一、服务器一次性准备

已在仓库提供 `scripts/deploy-vps.sh`。在 VPS 上建议：

```bash
# 1. 克隆（公开仓库可用 HTTPS）
sudo mkdir -p /opt
sudo git clone https://github.com/415geek/contractor-go-v2.git /opt/contractor-go-v2

# 2. 环境变量（勿提交 Git）
sudo cp /opt/contractor-go-v2/mobile/.env.example /opt/contractor-go-v2/mobile/.env
sudo nano /opt/contractor-go-v2/mobile/.env   # 填入真实 Clerk / Supabase 等

# 3. 安装部署脚本
sudo cp /opt/contractor-go-v2/scripts/deploy-vps.sh /usr/local/bin/contractor-web-deploy.sh
sudo chmod +x /usr/local/bin/contractor-web-deploy.sh

# 4. 首次构建与发布
sudo /usr/local/bin/contractor-web-deploy.sh
```

## 二、Nginx

静态根目录默认：`/var/www/contractor-web`。

示例站点（SPA 回退 `index.html`）：

```nginx
server {
    listen 80;
    server_name 72.62.82.26;   # 或你的域名
    root /var/www/contractor-web;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
}
```

启用后：`nginx -t && systemctl reload nginx`。

## 三、GitHub 自动部署（推 main 触发）

1. 在 GitHub 仓库 → **Settings → Secrets and variables → Actions** 新建：

   | Secret | 说明 |
   |--------|------|
   | `VPS_HOST` | `72.62.82.26` |
   | `VPS_USER` | `root`（或专用 deploy 用户） |
   | `VPS_SSH_KEY` | 私钥全文（`-----BEGIN ...` 到 `END ...`） |
   | `VPS_SSH_PORT` | 可选，默认 22 |

2. 在 VPS 上把对应**公钥**写入 `~/.ssh/authorized_keys`（GitHub Actions 用该私钥 SSH 登录）。

3. **每次向 `main` 推送**（任意文件）都会触发工作流，在 VPS 上执行 `/usr/local/bin/contractor-web-deploy.sh`（直接部署）。也可在 Actions 里手动 **Run workflow**。

## 四、环境变量覆盖（可选）

```bash
export CONTRACTOR_REPO_DIR=/opt/contractor-go-v2
export CONTRACTOR_WEB_ROOT=/var/www/contractor-web
export CONTRACTOR_GIT_BRANCH=main
```

## 五、已有 Docker + Traefik（如 72.62.82.26）

若 `contractorgov2-web` 容器已挂载 `.../mobile/dist`，把构建结果同步到该目录即可，无需占用宿主机 80 端口。

```bash
sudo tee /etc/contractor-deploy.env << 'EOF'
CONTRACTOR_REPO_DIR=/opt/contractor-go-v2
CONTRACTOR_WEB_ROOT=/opt/contractorgov2/current/mobile/dist
CONTRACTOR_GIT_BRANCH=main
CONTRACTOR_RESTART_DOCKER=contractorgov2-web
EOF

sudo /usr/local/bin/contractor-web-deploy.sh
```

`releases/current` 若由其他发布系统管理，也可把 `CONTRACTOR_WEB_ROOT` 指到实际被挂载的 `mobile/dist` 路径。

## 六、管理后台（Next.js）

本脚本只部署 **Mobile Web 静态站**。Admin 需单独用 Node 运行或仍用 Vercel，参见 [VERCEL_SETUP.md](./VERCEL_SETUP.md)。
