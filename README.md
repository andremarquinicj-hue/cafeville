# CaféVille v0.2

Base funcional do CaféVille: jogo social de gerenciamento de café inspirado na nostalgia dos jogos sociais de navegador, com identidade própria.

## Arquitetura desta versão

- **Next.js / Vercel**: interface + rotas de servidor protegidas.
- **Firebase Authentication**: cadastro e login por e-mail/senha.
- **Cloud Firestore**: jogadores, cafés, ranking, preparos e inventário.
- **Firebase Admin SDK (somente no servidor)**: alterações protegidas de moedas, XP, nível e presentes.
- **Phaser**: protótipo do restaurante 2D.

Esta versão não depende de Cloud Functions do Firebase e pode continuar no plano Spark durante o desenvolvimento, respeitando as cotas do Firebase.

## O que já existe

- Cadastro com e-mail, senha, nome e `@usuario` único.
- Login individual.
- Criação automática do jogador com **3.000 moedas**.
- Perfil privado + perfil público.
- Café inicial de cada jogador.
- Livro de receitas.
- Preparo com cronômetro persistente no Firestore.
- Servir prato, receber moedas e XP.
- Level up automático e bônus de moedas.
- Busca de jogadores por `@usuario`.
- Visita ao café de outro jogador.
- Contagem básica de visitas.
- Ranking por nível e XP.
- Painel administrativo.
- Admin pode enviar moedas ou presentes.
- Log administrativo.
- Regras do Firestore bloqueiam escrita direta de moedas, XP, nível e inventário.

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha as 6 variáveis públicas do Firebase Web App.

Para as rotas seguras do servidor, gere uma chave da conta de serviço no Firebase e use apenas estas três variáveis privadas:

```env
FIREBASE_ADMIN_PROJECT_ID=cafeville-...
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@cafeville-....iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"
```

**Nunca** coloque essas três variáveis em arquivos enviados ao GitHub. Na Vercel, cadastre-as em **Settings > Environment Variables**.

## Rodar localmente

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

## Primeiro administrador

1. Cadastre a sua conta normalmente.
2. Firebase Console > Firestore > `users` > seu UID.
3. Altere `role` de `player` para `admin`.
4. Atualize `/admin`.

## Segurança

O navegador não recebe a chave privada da conta de serviço. As rotas em `/api/*` validam o token do Firebase Authentication e usam o Firebase Admin SDK apenas no servidor da Vercel.
