/**
 * Web App 正式域名，用于重定向、分享链接等。
 * 部署到 contractorgo.io 时在环境变量中设置 EXPO_PUBLIC_APP_URL=https://contractorgo.io
 */
export const WEB_APP_URL =
  typeof process !== "undefined" && process.env?.EXPO_PUBLIC_APP_URL
    ? process.env.EXPO_PUBLIC_APP_URL.replace(/\/$/, "")
    : "https://www.contractorgo.io";
