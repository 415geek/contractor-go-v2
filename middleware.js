/**
 * 将 contractorgo.io（根域名）重定向到 https://www.contractorgo.io
 * 解决根域名访问时显示「不安全」的问题（www 子域名 SSL 正常）
 */
export default function middleware(request) {
  const url = new URL(request.url);
  if (url.hostname === "contractorgo.io") {
    return Response.redirect(`https://www.contractorgo.io${url.pathname}${url.search}`, 308);
  }
  return undefined;
}
