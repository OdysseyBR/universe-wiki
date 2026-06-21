import { generatePkcePair, storeCodeVerifier } from "./focusOAuthPkce";

// Configuração do client — ajuste para produção vs dev.
// O client_id precisa ser exatamente o registrado no Focus Account
// (ver scripts/register-oauth-client.js no projeto accounts-focus).
const FOCUS_ACCOUNT_URL = "https://accountsfocus.xyz"; // troque por http://localhost:3000 em dev local
const CLIENT_ID = "focusverse-wiki";
const REDIRECT_URI = `${window.location.origin}/auth/focus/callback`;
const SCOPE = "profile email";

function randomState(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// Chamado pelo botão "Entrar com Focus" — gera o PKCE, guarda o verifier,
// e redireciona o navegador (sem popup, conforme decidido) para o Focus Account.
export async function startFocusLogin(): Promise<void> {
  const { verifier, challenge } = await generatePkcePair();
  storeCodeVerifier(verifier);

  const state = randomState();
  sessionStorage.setItem("focus_oauth_state", state);

  const url = new URL(`${FOCUS_ACCOUNT_URL}/api/oauth/authorize`);
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", state);
  url.searchParams.set("scope", SCOPE);

  window.location.href = url.toString();
}
