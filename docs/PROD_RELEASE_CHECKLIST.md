# 生产上线验收记录（Contractor GO）

- 日期：2026-03-23
- 执行人：c8geek
- 分支/提交：main / 995bd10（基线提交，待本次提交后更新）
- 环境：Production
- Vercel 项目：contractorgo-web
- Supabase Project Ref：待填写

## A. 配置核对（发布前）

- [ ] `CLERK_SECRET_KEY` 或 `CLERK_JWT_KEY` 已配置（至少其一）
- [ ] `EXPO_PUBLIC_SUPABASE_URL` 与 Supabase Dashboard 完全一致
- [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY` 与同项目匹配
- [ ] `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` 与后端 Clerk 应用同环境（live/test 一致）
- [ ] `EXPO_PUBLIC_APP_URL=https://www.contractorgo.io`

## B. 部署执行记录

- [ ] `git push` 完成
  - 结果：待执行
- [ ] `supabase functions deploy` 完成
  - 结果：待执行
- [ ] Vercel Redeploy 完成
  - 结果：待执行
- [ ] 域名访问正常（`www.contractorgo.io`）
  - 结果：待执行

## C. 关键功能冒烟（发布后 5~10 分钟）

### 1) 登录后立即操作（1~2 秒内）

- [ ] 购号流程可进入确认并成功/合理失败提示
- [ ] 发消息成功
- [ ] 订阅 checkout 可拉起
- [ ] 创建项目 + 解析可走通

### 2) 错误体验

- [ ] 未出现 `Invalid or missing token`
- [ ] 会话未就绪时提示文案可理解（不是空白/无响应）

## D. 日志观察（发布后 30 分钟）

- [ ] Edge Logs 无持续鉴权报错风暴
- [ ] 错误量趋势下降（对比发布前）
- [ ] 无新增高频 5xx

- 关键日志摘要（贴 3~5 条）：
  1. 待填写
  2. 待填写
  3. 待填写

## E. 最终放量结论

- [ ] 通过，继续全量
- [ ] 有条件通过，继续观察
- [ ] 不通过，执行回滚

- 结论说明：待填写
- 后续动作：待填写

---

## 本次上线目标（已预填）

- 核心目标：修复 Web 首次登录后短时间内 `getToken()` 可能为空导致的 Edge 401 问题。
- 涉及范围：项目创建/解析、订阅、VoIP 购号、消息与多个 hooks 的会话就绪判断。
- 风险提示：若 Supabase Edge 缺少 `CLERK_SECRET_KEY`/`CLERK_JWT_KEY`，仍会出现鉴权失败。
