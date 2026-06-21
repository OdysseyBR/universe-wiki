// PKCE do lado do CLIENT (frontend da wiki). Gera o par verifier/challenge
// localmente e guarda o verifier em sessionStorage até o /callback voltar.
//
// Por que sessionStorage e não localStorage: o code_verifier só precisa
// sobreviver entre o redirect para o Focus Account e a volta — não precisa
// (e não deveria) persistir além da aba/sessão do navegador.

const STORAGE_KEY = "focus_oauth_code_verifier";

function base64url(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function generatePkcePair(): Promise<{ verifier: string; challenge: string }> {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  const verifier = base64url(randomBytes.buffer);

  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(verifier));
  const challenge = base64url(digest);

  return { verifier, challenge };
}

export function storeCodeVerifier(verifier: string): void {
  sessionStorage.setItem(STORAGE_KEY, verifier);
}

export function retrieveAndClearCodeVerifier(): string | null {
  const verifier = sessionStorage.getItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
  return verifier;
}
