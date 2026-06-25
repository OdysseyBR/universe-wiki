import { adminDb } from "../../_lib/firebaseAdmin.js";
import { verifyWikiSessionToken } from "../../_lib/wikiSession.js";
import { parseCookies } from "../../_lib/cookies.js";

// GET /api/auth/focus/me
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const cookies = parseCookies(req);
  const sessionToken = cookies.wiki_session;
  const session = sessionToken ? await verifyWikiSessionToken(sessionToken) : null;

  if (!session) {
    return res.status(401).json({ error: "not_authenticated" });
  }

  const doc = await adminDb.collection("users").doc(session.uid).get();
  if (!doc.exists) {
    return res.status(401).json({ error: "not_authenticated" });
  }

  const data = doc.data();
  return res.status(200).json({
    user: {
      uid: doc.id,
      displayName: data.displayName,
      email: data.email,
      photoURL: data.photoURL,
      authProvider: data.authProvider,
    },
  });
}
