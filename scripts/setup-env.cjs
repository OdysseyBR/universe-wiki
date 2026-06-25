#!/usr/bin/env node
/**
 * Gera (ou atualiza) o .env.local da Universe Wiki a partir do JSON da
 * service account do PROJETO FIREBASE DA WIKI (não o do Focus Account).
 *
 * Uso:
 *   node scripts/setup-env.js /caminho/para/service-account-da-wiki.json
 *
 * Preenche: FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL,
 * FIREBASE_ADMIN_PRIVATE_KEY, e gera WIKI_SESSION_JWT_SECRET automaticamente
 * se ainda não existir. As variáveis FOCUS_ACCOUNT_URL, FOCUS_REDIRECT_URI e
 * VITE_FOCUS_ACCOUNT_URL não são preenchidas aqui — são sobre o Focus Account,
 * não sobre o Firebase da wiki, então o script avisa o que falta ao final.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ENV_PATH = path.join(process.cwd(), ".env.local");
const ENV_EXAMPLE_PATH = path.join(process.cwd(), ".env.example");

function fail(message) {
  console.error(`\n❌ ${message}\n`);
  process.exit(1);
}

const serviceAccountPath = process.argv[2];
if (!serviceAccountPath) {
  fail(
    "Faltou o caminho do arquivo JSON.\nUso: node scripts/setup-env.js /caminho/para/service-account-da-wiki.json"
  );
}

if (!fs.existsSync(serviceAccountPath)) {
  fail(`Arquivo não encontrado: ${serviceAccountPath}`);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
} catch {
  fail("O arquivo não é um JSON válido. Confirme que é o arquivo baixado em Contas de serviço > Gerar nova chave privada.");
}

const { project_id, client_email, private_key } = serviceAccount;
if (!project_id || !client_email || !private_key) {
  fail(
    "O JSON não tem os campos esperados (project_id, client_email, private_key).\n" +
      "Confirme que é o arquivo da Service Account, não outro JSON do Firebase."
  );
}

// AVISO DE SEGURANÇA: confere se esse projeto não é por acidente o do Focus Account.
// Não temos como saber o project_id exato do accounts-focus aqui, mas alertamos
// se o nome sugerir isso, para evitar misturar os dois Firebase por engano.
if (/focus.?account/i.test(project_id)) {
  console.warn(
    `\n⚠️  Atenção: o project_id "${project_id}" parece ser do Focus Account, não da wiki.` +
      `\n   Confirme que você baixou a service account do projeto Firebase CORRETO (da wiki) antes de continuar.\n`
  );
}

const privateKeyEscaped = private_key.replace(/\r?\n/g, "\\n");

let existingLines = [];
if (fs.existsSync(ENV_PATH)) {
  existingLines = fs.readFileSync(ENV_PATH, "utf8").split("\n");
} else if (fs.existsSync(ENV_EXAMPLE_PATH)) {
  existingLines = fs.readFileSync(ENV_EXAMPLE_PATH, "utf8").split("\n");
}

const updates = {
  FIREBASE_ADMIN_PROJECT_ID: project_id,
  FIREBASE_ADMIN_CLIENT_EMAIL: client_email,
  FIREBASE_ADMIN_PRIVATE_KEY: privateKeyEscaped,
};

function alreadyHasValue(lines, key) {
  const line = lines.find((l) => l.startsWith(`${key}=`));
  return line && line.split("=")[1]?.trim().length > 0;
}

if (!alreadyHasValue(existingLines, "WIKI_SESSION_JWT_SECRET")) {
  updates.WIKI_SESSION_JWT_SECRET = crypto.randomBytes(32).toString("base64");
}

const seenKeys = new Set();
const newLines = existingLines.map((line) => {
  const key = line.split("=")[0];
  if (updates[key] !== undefined) {
    seenKeys.add(key);
    return `${key}=${updates[key]}`;
  }
  return line;
});

for (const [key, value] of Object.entries(updates)) {
  if (!seenKeys.has(key)) {
    newLines.push(`${key}=${value}`);
  }
}

fs.writeFileSync(ENV_PATH, newLines.join("\n"));

console.log("\n✅ .env.local atualizado com sucesso a partir da service account da wiki.\n");
console.log(`   Projeto Firebase: ${project_id}`);
console.log(`   Client email: ${client_email}\n`);

const stillMissing = ["FOCUS_ACCOUNT_URL", "FOCUS_REDIRECT_URI", "VITE_FOCUS_ACCOUNT_URL"].filter(
  (key) => !alreadyHasValue(newLines, key)
);

if (stillMissing.length > 0) {
  console.log("⚠️  Ainda falta preencher manualmente (são sobre o Focus Account, não o Firebase da wiki):");
  stillMissing.forEach((key) => console.log(`   - ${key}`));
  console.log("");
}
