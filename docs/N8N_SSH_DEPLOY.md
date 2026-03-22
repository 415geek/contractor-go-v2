# 使用 n8n 触发 VPS 部署（SSH）

服务器上的 Web 静态资源由 `/usr/local/bin/contractor-web-deploy.sh` 更新（见 [VPS_DEPLOY.md](./VPS_DEPLOY.md)）。

下面给出两种常见拓扑：**n8n 与站点在同一台机**、**n8n 在其它机器通过 SSH 连过去**。

---

## 一、n8n 与 72.62.82.26 在同一台 VPS（推荐）

若你的 n8n 容器跑在同一台机器上，**不必 SSH 绕一圈**，用 **Execute Command** 即可（需 n8n 有权限执行宿主机命令，或通过 `docker exec` 进能访问仓库的容器）。

### 1. Execute Command 节点

| 字段 | 值 |
|------|-----|
| Command | `bash` |
| Arguments | `-lc` 与 `/usr/local/bin/contractor-web-deploy.sh`（在 n8n 里拆成参数或写成一条字符串，视节点版本而定） |

**示例（单行命令，部分版本写在「Command」里）：**

```bash
/usr/local/bin/contractor-web-deploy.sh
```

若 n8n 跑在 Docker 里、脚本在宿主机：

```bash
docker exec -i <宿主机上装了 git+node 的容器名> /usr/local/bin/contractor-web-deploy.sh
```

或把部署脚本挂进 n8n 可访问的路径，再执行。

### 2. 前置条件

- 该环境能访问 `/opt/contractor-go-v2`、能 `git pull`、能跑 `npm run build:web`
- `/etc/contractor-deploy.env` 已配置（见 VPS_DEPLOY.md）

---

## 二、n8n 在其它机器：用 SSH 连 72.62.82.26

### 1. 在 n8n 里配置 SSH 凭据

1. **Credentials → Add Credential**
2. 类型选 **SSH**（若列表没有，在 **Community nodes** 安装 `SSH` / 或使用 **Execute Command** + 本机 `ssh`）
3. 填写：
   - **Host**: `72.62.82.26`
   - **Port**: `22`
   - **Username**: `root`（或你的部署用户）
   - **Authentication**: 选 **Private Key**，粘贴用于登录该机的 **私钥**全文（与 `~/.ssh/authorized_keys` 里公钥配对）

> 不要用密码长期放在 n8n；优先 **仅密钥**。

### 2. SSH 节点要执行的远程命令

只跑官方部署脚本即可：

```bash
/usr/local/bin/contractor-web-deploy.sh
```

部分 SSH 节点需要把「要执行的命令」填在 **Command** 字段；若只支持交互 Shell，可用：

```bash
bash -lc '/usr/local/bin/contractor-web-deploy.sh'
```

### 3. 最小工作流

```text
[Manual Trigger] 或  [Webhook / Schedule]
        →
[SSH]  (Credentials: 上面 SSH)
        Command: /usr/local/bin/contractor-web-deploy.sh
        →
[可选：Send Email / Slack 通知成功或失败]
```

构建约 **2–5 分钟**，建议在 SSH 节点调大 **Timeout**（例如 **600000 ms**）。

---

## 三、用 Schedule 定时「拉代码部署」（慎用）

- **Cron**：例如每天凌晨跑一次，或每小时一次（会重复构建，注意负载）。
- 更推荐：**GitHub Webhook → n8n Webhook** → SSH 执行部署（仅在有新 push 时跑）。

---

## 四、安全建议

1. **Webhook** 若触发部署，必须校验 **Secret**（Header 或 query），避免被扫库误触发。
2. 部署用户尽量 **非 root**，只给 `/opt/contractor-go-v2` 与 `/usr/local/bin/contractor-web-deploy.sh` 所需权限。
3. 私钥仅存在 n8n Credentials，勿写进工作流 JSON 明文。

---

## 五、排错

| 现象 | 处理 |
|------|------|
| `Permission denied (publickey)` | 检查公钥是否在服务器 `authorized_keys`，私钥是否完整 |
| `script not found` | SSH 登录后手动执行同路径，确认脚本存在 |
| 构建失败 | 看脚本输出；检查 `/opt/contractor-go-v2/mobile/.env` |
| 超时 | 将 SSH / Execute Command 超时改为 ≥ 10 分钟 |

---

## 六、与本仓库的衔接

- 部署脚本：[scripts/deploy-vps.sh](../scripts/deploy-vps.sh)（服务器上拷贝为 `/usr/local/bin/contractor-web-deploy.sh`）
- GitHub Actions 自动部署：[.github/workflows/deploy-vps.yml](../.github/workflows/deploy-vps.yml)（与 n8n 二选一或并存，避免重复触发）
