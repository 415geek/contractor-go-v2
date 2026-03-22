import { router } from "expo-router";
/**
 * 应用内跳转一律走 Expo Router，避免 Web 上使用 `location.assign` 整页刷新
 * （会导致返回栈丢失、底部 Tab 消失、Clerk/路由状态异常）。
 */
export function pushPath(path: string) {
  router.push(path as never);
}

export function replacePath(path: string) {
  router.replace(path as never);
}

export function replaceSignedInHome() {
  replacePath("/home");
}
