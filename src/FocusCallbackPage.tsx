import { useEffect, useState } from "react";
import { retrieveAndClearCodeVerifier } from "./focusOAuthPkce";

// Tela em /auth/focus/callback (a mesma URL passada como redirect_uri).
// Faz a validação de `state` (anti-CSRF) e entrega code+verifier para o
// BACKEND da wiki trocar por um access_token — essa troca NUNCA acontece
// aqui no componente, porque exporia o processo no devtools do navegador.

type Status = "exchanging" | "success" | "error";

export function FocusCallbackPage() {
  const [status, setStatus] = useState<Status>("exchanging");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const state = params.get("state");
      const oauthError = params.get("error");

      if (oauthError === "access_denied") {
        setStatus("error");
        setErrorMessage("Login com Focus cancelado.");
        return;
      }

      const expectedState = sessionStorage.getItem("focus_oauth_state");
      sessionStorage.removeItem("focus_oauth_state");

      if (!code || !state || state !== expectedState) {
        setStatus("error");
        setErrorMessage("Não foi possível validar o login. Tente novamente.");
        return;
      }

      const verifier = retrieveAndClearCodeVerifier();
      if (!verifier) {
        setStatus("error");
        setErrorMessage("Sessão de login expirou. Tente novamente.");
        return;
      }

      try {
        // Chama o NOSSO backend (Express), que por sua vez chama o
        // /api/oauth/token do Focus Account — nunca direto do front.
        const response = await fetch("/api/auth/focus/exchange", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, codeVerifier: verifier }),
        });

        if (!response.ok) {
          setStatus("error");
          setErrorMessage("Não foi possível completar o login.");
          return;
        }

        setStatus("success");
        window.location.href = "/";
      } catch {
        setStatus("error");
        setErrorMessage("Não foi possível conectar ao servidor.");
      }
    }

    handleCallback();
  }, []);

  if (status === "error") {
    return (
      <div>
        <p>{errorMessage}</p>
        <a href="/login">Voltar para o login</a>
      </div>
    );
  }

  return <p>Entrando com Focus Account...</p>;
}
