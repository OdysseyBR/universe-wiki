# Universe Wiki — integração Focus Account

Login via Focus Account adicionado como **terceiro provedor**, ao lado do Google e
GitHub já existentes. Mesma regra do lucasrafael.xyz: são três portas
independentes — um login via Focus não funde com uma conta já existente via
Google/GitHub, mesmo que o email seja o mesmo.

## O que mudou

**Antes**: a wiki só usava o Firebase Auth nativo (`onAuthStateChanged`), sem
nenhum documento próprio de usuário no Firestore. `isAdmin` comparava
`user.email` direto contra `VITE_ADMIN_EMAIL`.

**Agora**: existe uma sessão paralela e própria para o login via Focus
(JWT assinado pelo servidor da wiki, cookie httpOnly), porque o Focus Account
não usa Firebase Custom Token de propósito — mesma decisão arquitetural do
lucasrafael.xyz. O `AuthContext.jsx` unifica os dois mundos num único shape de
usuário (`{ uid, displayName, email, photoURL, authProvider }`), então o resto
do app (`Layout.jsx`, etc.) não precisou mudar nada.

## Por que agora existe um servidor Express

A troca de `code` por `access_token` (handshake OAuth) precisa rodar no
backend — nunca no navegador, ou qualquer um no devtools poderia interceptar
o processo. O projeto antes só rodava `vite preview` em produção (sem
servidor de verdade). Agora `npm start` builda e roda `server/index.js`,
que serve o build estático do Vite E expõe `/api/auth/focus/*`.

```
server/index.js        — servidor Express: serve dist/ + monta as rotas de API
server/focusAuth.js     — troca code→token, cria/busca usuário no Firestore, sessão
server/wikiSession.js   — assina/verifica o JWT próprio da wiki
server/firebaseAdmin.js — inicialização do Firebase Admin SDK
```

```
src/lib/focusOAuth.js     — PKCE + início do redirect (chamado pelo botão de login)
src/pages/FocusCallback.jsx — recebe a volta do redirect, valida state, chama /exchange
```

## Configuração necessária

**Passo a passo recomendado, usando o script automático:**

1. No [console do Firebase](https://console.firebase.google.com), selecione o
   projeto **da wiki** (não o do Focus Account) → Configurações do projeto →
   Contas de serviço → Gerar nova chave privada → baixa o `.json`.

2. Rode (na raiz do projeto da wiki):
   ```
   node scripts/setup-env.cjs /caminho/para/o/arquivo-baixado.json
   ```
   Isso preenche `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL` e
   `FIREBASE_ADMIN_PRIVATE_KEY` já formatados corretamente, e gera um
   `WIKI_SESSION_JWT_SECRET` novo automaticamente (diferente do secret de
   sessão do Focus Account — são domínios de confiança separados).
   O script avisa se o `project_id` do arquivo parecer ser por engano o do
   Focus Account em vez do da wiki.

3. Complete manualmente no `.env.local` o que o script não preenche (são sobre
   o Focus Account, não sobre o Firebase da wiki):
   ```
   FOCUS_ACCOUNT_URL=https://accountsfocus.xyz
   FOCUS_REDIRECT_URI=https://focusversewiki.xyz/auth/focus/callback
   VITE_FOCUS_ACCOUNT_URL=https://accountsfocus.xyz
   ```

**Variáveis envolvidas, para referência:**

No `.env` do servidor (Railway → Variables):
```
FOCUS_ACCOUNT_URL=https://accountsfocus.xyz
FOCUS_REDIRECT_URI=https://focusversewiki.xyz/auth/focus/callback
WIKI_SESSION_JWT_SECRET=<gerar com: openssl rand -base64 32>
FIREBASE_ADMIN_PROJECT_ID=<projeto Firebase DESTA wiki, não o do Focus Account>
FIREBASE_ADMIN_CLIENT_EMAIL=<...>
FIREBASE_ADMIN_PRIVATE_KEY=<...>
```

No `.env.local` do Vite (build-time):
```
VITE_FOCUS_ACCOUNT_URL=https://accountsfocus.xyz
```

**No projeto accounts-focus**, registre este client (uma vez só) rodando:
```
node scripts/register-oauth-client.js
```
(já vem pré-configurado para `client_id: "focusverse-wiki"` e
`https://focusversewiki.xyz/auth/focus/callback` — edite o script se mudar
o domínio ou quiser adicionar a URL de localhost para teste em dev)

## Estrutura de dados criada no Firestore desta wiki

Documento novo em `users/{uid}` quando alguém loga via Focus por aqui:
```js
{
  uid: "...",              // gerado pela wiki, NÃO é o focusId
  authProvider: "focus",
  focusId: "...",          // referência ao usuário no Focus Account
  displayName: "...",
  email: "...",
  photoURL: "...",
  createdAt: "...",
  lastLoginAt: "...",
}
```
Esse índice composto (`authProvider` + `focusId`) é usado para encontrar o
usuário em logins de retorno — se aparecer erro de índice faltando no Firestore,
o próprio erro traz o link para criar automaticamente no console.

## Rodando localmente

Em dev, o `npm run dev` do Vite (porta 5173) só serve o frontend — as rotas
`/api/auth/focus/*` vivem no servidor Express, que precisa rodar em paralelo
numa porta separada. O `vite.config.js` já tem um proxy configurado para
mandar `/api/*` para `http://localhost:4000` automaticamente.

**Terminal 1** — Focus Account (projeto separado):
```
cd accounts-focus
npm run dev
```

**Terminal 2** — API da wiki (modo dev, só as rotas /api/*):
```
npm run dev:server
```

**Terminal 3** — frontend da wiki:
```
npm run dev
```

Acesse `http://localhost:5173/login` e clique em "Entrar com Focus".

Para testar o fluxo completo como em produção (Express servindo o build
inteiro, sem proxy do Vite):
```
npm run build
npm run server
```

