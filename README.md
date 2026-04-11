# Universe Wiki

Wiki do universo literário — construído com React, Firebase e Vite.

## Stack

- **Frontend:** React + Vite + TailwindCSS
- **Auth:** Firebase (Google + GitHub)
- **Banco:** Firestore
- **Host:** Railway

## Setup local

### 1. Instalar dependências

```bash
npm install
```

### 2. Criar .env.local

```env
VITE_FIREBASE_API_KEY=AIzaSyCE6fEmladFgPXAT2gWvMSQWF0obyRks_Y
VITE_FIREBASE_AUTH_DOMAIN=universe-wiki.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=universe-wiki
VITE_FIREBASE_STORAGE_BUCKET=universe-wiki.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=878054427586
VITE_FIREBASE_APP_ID=1:878054427586:web:3eb7acd176749bef13e45b
VITE_ADMIN_EMAIL=dev.lucas.rafael@gmail.com
```

### 3. Rodar local

```bash
npm run dev
```

Abre em http://localhost:5173

### 4. Regras do Firestore

Copie o conteúdo de `firestore.rules` e cole em:
Firebase → Firestore → Rules → Publicar

## Deploy no Railway

1. Push pro GitHub
2. Railway → New Project → Deploy from GitHub
3. Adicionar todas as variáveis VITE_* em Settings → Variables
4. Pegar URL do Railway → Firebase → Authentication → Authorized domains → adicionar
5. GitHub OAuth App → atualizar Homepage URL e Callback URL

## Estrutura

```
src/
├── components/
│   └── Layout.jsx        # Sidebar + navbar
├── contexts/
│   └── AuthContext.jsx   # Auth global
├── lib/
│   ├── firebase.js       # Config Firebase
│   └── db.js             # Funções Firestore
├── pages/
│   ├── Home.jsx          # Página inicial
│   ├── Category.jsx      # Listagem por categoria
│   ├── Article.jsx       # Visualização de artigo
│   ├── ArticleEditor.jsx # Criar / editar artigo
│   ├── Search.jsx        # Busca
│   └── Login.jsx         # Login
└── index.css             # Estilos globais
```
