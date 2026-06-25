# Correção: integração Focus Account adaptada para Vercel

A integração original foi pensada para um servidor Express tradicional
(Railway). Como o deploy real da wiki é na **Vercel**, que não roda um
processo Node continuamente — ela usa Serverless Functions — as 3 rotas de
API precisaram ser reescritas no formato que a Vercel espera nativamente:
arquivos `.js`/`.ts` dentro de uma pasta `/api` na raiz do projeto, cada um
exportando um `default async function handler(req, res)`.

## O que copiar para o repositório da wiki

```
api/_lib/cookies.js          — parse/build de cookies (Vercel Functions não tem cookie-parser)
api/_lib/firebaseAdmin.js    — idêntico ao server/firebaseAdmin.js original
api/_lib/wikiSession.js      — idêntico ao server/wikiSession.js original
api/auth/focus/exchange.js   — equivalente ao POST /api/auth/focus/exchange do Express
api/auth/focus/me.js         — equivalente ao GET /api/auth/focus/me
api/auth/focus/logout.js     — equivalente ao POST /api/auth/focus/logout
vercel.json                  — garante que rotas que não começam com /api caem no index.html (SPA)
```

A pasta `server/` (Express) **pode continuar existindo** no repositório — ela
não interfere com o deploy na Vercel, e ainda é útil se você quiser testar
localmente com `npm run dev:server` + `npm run dev`, como já validamos antes.
A Vercel simplesmente ignora `server/` e usa `/api` em produção.

## Bug real encontrado e corrigido nesta versão

Os imports relativos (`../_lib/...`) nas funções de `api/auth/focus/*.js`
estavam errados — apontavam para `api/auth/_lib/` (um nível acima), quando
o `_lib` real está em `api/_lib/` (dois níveis acima). Corrigido para
`../../_lib/...`. Isso foi pego rodando os handlers diretamente em Node antes
de qualquer deploy, simulando o req/res que a Vercel passaria.

## Configuração necessária na Vercel

No painel do projeto (Settings → Environment Variables), adicione:

```
FOCUS_ACCOUNT_URL=https://accountsfocus.xyz
FOCUS_REDIRECT_URI=https://focusversewiki.xyz/auth/focus/callback
WIKI_SESSION_JWT_SECRET=<o mesmo que você já gerou localmente, ou um novo>
FIREBASE_ADMIN_PROJECT_ID=<projeto Firebase DESTA wiki>
FIREBASE_ADMIN_CLIENT_EMAIL=<...>
FIREBASE_ADMIN_PRIVATE_KEY=<...>
VITE_FOCUS_ACCOUNT_URL=https://accountsfocus.xyz
```

(as mesmas variáveis que você já tinha configurado para o teste local —
reaproveite os mesmos valores, exceto as URLs que devem ser as de produção)

## Depois de configurar

1. Faça commit e push destes arquivos para o repositório
2. A Vercel deve redeployar automaticamente (ou force um redeploy manual)
3. Acesse `focusversewiki.xyz/login` — o botão "Entrar com Focus" deve aparecer
   (ele já existe no código desde a integração original; só não funcionava
   porque as rotas de API não existiam no formato certo para a Vercel)
