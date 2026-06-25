import { buildClearCookieHeader } from "../../_lib/cookies.js";

// POST /api/auth/focus/logout
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  res.setHeader("Set-Cookie", buildClearCookieHeader("wiki_session"));
  return res.status(200).json({ success: true });
}
