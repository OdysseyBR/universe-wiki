// Vercel Serverless Functions (Node puro) não vêm com `req.cookies` como o
// Express + cookie-parser tinha — precisamos parsear o header manualmente.

export function parseCookies(req) {
  const header = req.headers.cookie;
  if (!header) return {};

  return header.split(";").reduce((acc, pair) => {
    const [key, ...rest] = pair.trim().split("=");
    acc[key] = decodeURIComponent(rest.join("="));
    return acc;
  }, {});
}

export function buildSetCookieHeader(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.secure) parts.push("Secure");
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  return parts.join("; ");
}

export function buildClearCookieHeader(name) {
  return `${name}=; Path=/; Max-Age=0`;
}
