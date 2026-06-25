import express from "express";
import { randomUUID } from "crypto";
import { adminDb } from "./firebaseAdmin.js";
import { signWikiSessionToken, verifyWikiSessionToken } from "./wikiSession.js";

const router = express.Router();

const FOCUS_ACCOUNT_URL = process.env.FOCUS_ACCOUNT_URL || "https://accountsfocus.xyz";
const CLIENT_ID = "focusverse-wiki";
const REDIRECT_URI = process.env.FOCUS_REDIRECT_URI || "https://focusversewiki.xyz/auth/focus/callback";

// POST /api/auth/focus/exchange
// Body: { code, codeVerifier }
//
// Troca o code por access_token, busca os dados via /oauth/userinfo, e então:
// 1. Busca em users/{uid} um documento com authProvider="focus" e focusId correspondente
// 2. Se não existir, cria um novo (focusId NUNCA é reusado como uid de outro provedor —
//    mesma regra de "portas independentes" decidida para o lucasrafael.xyz)
// 3. Assina o JWT próprio da wiki e devolve via cookie httpOnly
router.post("/exchange", async (req, res) => {
  const { code, codeVerifier } = req.body;

  if (!code || !codeVerifier) {
    return res.status(400).json({ error: "missing_fields" });
  }

  try {
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

    const userInfoResponse = await fetch(`${FOCUS_ACCOUNT_URL}/api/oauth/userinfo`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userInfoResponse.ok) {
      console.error("[focus-oauth] Falha ao buscar userinfo");
      return res.status(502).json({ error: "userinfo_failed" });
    }

    const focusUser = await userInfoResponse.json();
    // focusUser = { sub: focusId, name, email, photo }

    // Busca um usuário local já vinculado a esse focusId (login de retorno).
    const existingSnapshot = await adminDb
      .collection("users")
      .where("authProvider", "==", "focus")
      .where("focusId", "==", focusUser.sub)
      .limit(1)
      .get();

    let localUser;

    if (!existingSnapshot.empty) {
      const doc = existingSnapshot.docs[0];
      localUser = { uid: doc.id, ...doc.data() };
      // Mantém nome/foto sincronizados com o que o Focus Account reporta agora.
      await doc.ref.update({
        displayName: focusUser.name ?? localUser.displayName,
        photoURL: focusUser.photo ?? localUser.photoURL,
        lastLoginAt: new Date().toISOString(),
      });
    } else {
      // Primeiro login via Focus Account: cria um documento NOVO. Mesmo que já exista
      // um usuário com o mesmo email vindo do Google/GitHub, NÃO fundimos as contas —
      // é uma porta de entrada independente, igual decidido para o lucasrafael.xyz.
      const uid = randomUUID();
      const newUser = {
        uid,
        authProvider: "focus",
        focusId: focusUser.sub,
        displayName: focusUser.name ?? null,
        email: focusUser.email ?? null,
        photoURL: focusUser.photo ?? null,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      await adminDb.collection("users").doc(uid).set(newUser);
      localUser = newUser;
    }

    const sessionToken = await signWikiSessionToken({ uid: localUser.uid });

    res.cookie("wiki_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      user: {
        uid: localUser.uid,
        displayName: localUser.displayName,
        email: localUser.email,
        photoURL: localUser.photoURL,
        authProvider: "focus",
      },
    });
  } catch (err) {
    console.error("[focus-oauth] Erro inesperado na troca:", err);
    return res.status(500).json({ error: "internal_error" });
  }
});

// GET /api/auth/focus/me
// Lê o cookie de sessão da wiki e devolve o usuário local — usado pelo
// AuthContext.jsx para restaurar a sessão ao recarregar a página.
router.get("/me", async (req, res) => {
  const sessionToken = req.cookies?.wiki_session;
  const session = sessionToken ? await verifyWikiSessionToken(sessionToken) : null;

  if (!session) {
    return res.status(401).json({ error: "not_authenticated" });
  }

  const doc = await adminDb.collection("users").doc(session.uid).get();
  if (!doc.exists) {
    return res.status(401).json({ error: "not_authenticated" });
  }

  const data = doc.data();
  return res.json({
    user: {
      uid: doc.id,
      displayName: data.displayName,
      email: data.email,
      photoURL: data.photoURL,
      authProvider: data.authProvider,
    },
  });
});

// POST /api/auth/focus/logout
router.post("/logout", (req, res) => {
  res.clearCookie("wiki_session");
  return res.json({ success: true });
});

export default router;
