/**
 * 1. HTTP -> HTTPS 重定向（contractorgo.io 及 www）
 * 2. 根域名 contractorgo.io -> https://www.contractorgo.io
 */
export default function middleware(request) {
  const url = new URL(request.url);
  const host = url.hostname;
  const isHttp = url.protocol === "http:";

  // HTTP -> HTTPS
  if (isHttp && (host === "contractorgo.io" || host === "www.contractorgo.io")) {
    return Response.redirect(`https://www.contractorgo.io${url.pathname}${url.search}`, 308);
  }
  // 根域名 -> www
  if (host === "contractorgo.io") {
    return Response.redirect(`https://www.contractorgo.io${url.pathname}${url.search}`, 308);
  }
  return undefined;
}
