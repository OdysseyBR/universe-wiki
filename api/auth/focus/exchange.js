import { randomUUID } from "crypto";
import { adminDb } from "../../_lib/firebaseAdmin.js";
import { signWikiSessionToken } from "../../_lib/wikiSession.js";
import { buildSetCookieHeader } from "../../_lib/cookies.js";

const FOCUS_ACCOUNT_URL = process.env.FOCUS_ACCOUNT_URL || "https://accountsfocus.xyz";
const CLIENT_ID = "focusverse-wiki";
const REDIRECT_URI = process.env.FOCUS_REDIRECT_URI || "https://focusversewiki.xyz/auth/focus/callback";

// POST /api/auth/focus/exchange
// (Vercel Serverless Function — equivalente ao antigo server/focusAuth.js,
// adaptado porque a Vercel não roda o processo Express continuamente.)
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const { code, codeVerifier } = req.body ?? {};

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
      await doc.ref.update({
        displayName: focusUser.name ?? localUser.displayName,
        photoURL: focusUser.photo ?? localUser.photoURL,
        lastLoginAt: new Date().toISOString(),
      });
    } else {
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

    res.setHeader(
      "Set-Cookie",
      buildSetCookieHeader("wiki_session", sessionToken, {
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      })
    );

    return res.status(200).json({
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
}
