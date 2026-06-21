const express = require("express");
const router = express.Router();

// Ajuste para o domínio real do Focus Account em produção.
const FOCUS_ACCOUNT_URL = process.env.FOCUS_ACCOUNT_URL || "https://accountsfocus.xyz";
const CLIENT_ID = "focusverse-wiki";
const REDIRECT_URI = process.env.FOCUS_REDIRECT_URI || "https://focusversewiki.xyz/auth/focus/callback";

// POST /api/auth/focus/exchange
// Body: { code, codeVerifier }
//
// Chamado pelo FocusCallbackPage.tsx depois do redirect de volta do Focus Account.
// Esta troca roda no SERVIDOR (nunca no navegador), porque é aqui que o
// code vira access_token — expor isso no front permitiria qualquer um
// interceptar e reusar o processo de troca.
router.post("/api/auth/focus/exchange", async (req, res) => {
  const { code, codeVerifier } = req.body;

  if (!code || !codeVerifier) {
    return res.status(400).json({ error: "missing_fields" });
  }

  try {
    // 1. Troca o code por um access_token
    const tokenResponse = await fetch(`${FOCUS_ACCOUNT_URL}/api/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        code_verifier: codeVerifier,
      }),
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.json().catch(() => ({}));
      console.error("[focus-oauth] Falha ao trocar code por token:", errorBody);
      return res.status(502).json({ error: "token_exchange_failed" });
    }

    const tokenData = await tokenResponse.json();

    // 2. Usa o access_token para buscar os dados do usuário
    const userInfoResponse = await fetch(`${FOCUS_ACCOUNT_URL}/api/oauth/userinfo`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userInfoResponse.ok) {
      console.error("[focus-oauth] Falha ao buscar userinfo");
      return res.status(502).json({ error: "userinfo_failed" });
    }

    const focusUser = await userInfoResponse.json();
    // focusUser = { sub: focusId, name, email, photo }

    // 3. Encontra ou cria o usuário LOCAL da wiki, vinculado pelo focusId.
    // TODO: substituir por sua lógica real de banco de dados (ex: Postgres/Mongo).
    // const localUser = await db.users.findOrCreateByFocusId(focusUser.sub, {
    //   name: focusUser.name,
    //   email: focusUser.email,
    //   authProvider: "focus",
    // });

    // 4. Cria a sessão local da wiki (cookie próprio, JWT próprio, etc.)
    // TODO: substituir pelo seu próprio sistema de sessão.
    // const sessionToken = signLocalSessionToken(localUser.id);
    // res.cookie("wiki_session", sessionToken, { httpOnly: true, secure: true, sameSite: "lax" });

    return res.json({ success: true, focusUser });
  } catch (err) {
    console.error("[focus-oauth] Erro inesperado na troca:", err);
    return res.status(500).json({ error: "internal_error" });
  }
});

module.exports = router;
