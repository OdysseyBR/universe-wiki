import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import focusAuthRouter from "./focusAuth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());
app.use(cookieParser());

// Rotas de API (precisam vir ANTES do static, senão o catch-all do SPA as engoliria)
app.use("/api/auth/focus", focusAuthRouter);

const distPath = path.join(__dirname, "..", "dist");
const distExists = fs.existsSync(path.join(distPath, "index.html"));

// DEV_API_ONLY=true: roda só as rotas /api/*, sem servir nem buildar o frontend.
// Usado em paralelo ao `npm run dev` do Vite (que serve o frontend na porta 5173
// e faz proxy de /api/* para este servidor) — ver vite.config.js.
const apiOnly = process.env.DEV_API_ONLY === "true";

if (!apiOnly) {
  if (!distExists) {
    console.warn(
      "\n⚠️  dist/ não encontrado. Rode `npm run build` antes de `npm run server`," +
        " ou use `npm run dev:server` para rodar só a API em paralelo ao `npm run dev`.\n"
    );
  }
  app.use(express.static(distPath));

  // Catch-all do SPA: qualquer rota que não bateu em /api/* ou em um arquivo estático
  // cai aqui, devolvendo index.html — é o React Router que decide o resto no cliente.
  // Express 5 mudou a sintaxe de wildcard: "*" sozinho não é mais válido, precisa
  // nomear o parâmetro (ex: "/*splat"). Ver https://expressjs.com/en/guide/migrating-5.html
  app.get("/*splat", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

const PORT = process.env.PORT || (apiOnly ? 4000 : 4173);
app.listen(PORT, () => {
  console.log(`Universe Wiki ${apiOnly ? "(API apenas, modo dev)" : ""} rodando na porta ${PORT}`);
});
