# Cliente OAuth Focus Account — Focusverse Wiki

Scaffold para integrar "Entrar com Focus" na wiki (React/Vite + Express),
seguindo o mesmo handshake de redirect + PKCE já validado no projeto accounts-focus.

## Arquivos

```
src/focusOAuthPkce.ts        — gera e guarda o code_verifier/code_challenge (PKCE)
src/startFocusLogin.ts       — função chamada pelo botão "Entrar com Focus"
src/FocusCallbackPage.tsx    — componente da rota /auth/focus/callback
server/focusOAuthRoutes.js   — rota Express que troca code por token (server-to-server)
```

## Passo a passo de integração

1. **No projeto accounts-focus**, registre este client rodando:
   ```
   node scripts/register-oauth-client.js
   ```
   (edite CLIENT_ID, REDIRECT_URIS antes de rodar — já vem pré-configurado para
   `focusverse-wiki` e `https://focusversewiki.xyz/auth/focus/callback`)

2. **Copie os arquivos `src/*` para o repositório da wiki**, ajustando os imports
   conforme a estrutura de pastas do seu projeto.

3. **Adicione a rota de callback no seu roteador** (React Router, Wouter, etc.):
   ```tsx
   <Route path="/auth/focus/callback" element={<FocusCallbackPage />} />
   ```

4. **Registre a rota Express** no seu servidor:
   ```js
   const focusOAuthRoutes = require("./server/focusOAuthRoutes");
   app.use(focusOAuthRoutes);
   ```

5. **Complete os TODOs em `server/focusOAuthRoutes.js`**: criar/encontrar o usuário
   local vinculado ao `focusId`, e criar a sessão própria da wiki (cookie, JWT, etc.)
   — isso depende do seu banco de dados e sistema de auth atuais.

6. **Adicione o botão de login**:
   ```tsx
   import { startFocusLogin } from "./startFocusLogin";
   <button onClick={startFocusLogin}>Entrar com Focus</button>
   ```

## Variáveis de ambiente (servidor da wiki)

```
FOCUS_ACCOUNT_URL=https://accountsfocus.xyz
FOCUS_REDIRECT_URI=https://focusversewiki.xyz/auth/focus/callback
```

## Testando em dev local

Troque `FOCUS_ACCOUNT_URL` no `startFocusLogin.ts` e no `.env` do servidor Express
para `http://localhost:3000` (onde o accounts-focus roda em dev), e adicione
`http://localhost:5173/auth/focus/callback` (ajuste a porta do seu Vite) na lista
de `REDIRECT_URIS` ao rodar o script de registro do client.
