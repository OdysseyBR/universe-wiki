import { SignJWT, jwtVerify } from "jose";

// JWT PRÓPRIO da wiki — paralelo ao FOCUS_SESSION_JWT_SECRET do accounts-focus,
// mas é um secret DIFERENTE e DESTA wiki, não compartilhado com o Focus Account.
// Decisão deliberada (mesma do lucasrafael.xyz): não usamos Firebase Custom Token
// aqui, para manter consistência arquitetural entre os projetos.

const SESSION_SECRET = new TextEncoder().encode(process.env.WIKI_SESSION_JWT_SECRET);
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 dias

export async function signWikiSessionToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(SESSION_SECRET);
}

export async function verifyWikiSessionToken(token) {
  try {
    const { payload } = await jwtVerify(token, SESSION_SECRET);
    return payload;
  } catch {
    return null;
  }
}
