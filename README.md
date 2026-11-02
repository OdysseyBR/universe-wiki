# Vaha Wiki

Enciclopédia colaborativa do universo Vaha. SPA em React construída com Vite,
estilo Wikipédia, com artigos por categoria e múltiplos universos.

- **Domínio:** https://vahawiki.xyz
- **Deploy:** Vercel (site estático — não há backend próprio)

## Stack

- **Frontend:** React 18 + Vite + Tailwind CSS + React Router v6
- **Editor de artigos:** TipTap (rich text com imagens, infoboxes e listas)
- **Banco de dados:** Firebase Firestore (acesso direto do client)
- **Autenticação:** Firebase Auth — login exclusivo via **Google**
- **Imagens:** Cloudinary (upload unsigned)

## Rodando localmente

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Configure o ambiente. Copie `.env.example` para `.env.local` e preencha com
   as chaves do seu projeto Firebase, do Cloudinary e o e-mail de admin:

   ```bash
   cp .env.example .env.local
   ```

3. Suba o dev server:

   ```bash
   npm run dev
   ```

   O site abre em http://localhost:5173.

4. (Opcional) Para um preview do build de produção:

   ```bash
   npm run build
   npm run preview
   ```

## Build e deploy

O build é gerado com `npm run build` (saída em `dist/`). A **Vercel** detecta o
projeto Vite e faz o deploy automaticamente a cada push. Como todo o acesso a
dados e autenticação acontece no browser via Firebase, não há funções de API —
o `vercel.json` apenas redireciona todas as rotas para o `index.html` (SPA).

## Permissões

- **Leitura** de artigos e categorias: liberada para todos.
- **Escrita** (criar/editar/deletar artigos e categorias): restrita ao e-mail
  definido em `VITE_ADMIN_EMAIL`, controlada pelas regras do Firestore
  (`firestore.rules`).

> **Atenção:** o `firestore.rules` atual ainda referencia um e-mail fixo.
> Ao publicar, garanta que a regra de escrita usa o mesmo e-mail do
> `VITE_ADMIN_EMAIL`, ou o admin não conseguirá salvar alterações.

## Estrutura

```
src/
  components/   Layout, modais e editores reutilizáveis
  contexts/     AuthContext (estado de login Google)
  lib/          firebase, db (Firestore), categoryIcons, cloudinary, universes, wikilink
  pages/        Home, Category, Article, ArticleEditor, Search, Login, ManageCategories
public/         logo.svg (branca) e logo-black.svg (preta)
marca/          arquivos de marca originais (SVG)
```
