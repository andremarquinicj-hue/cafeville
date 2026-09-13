# CaféVille v0.1

Primeira base funcional do CaféVille: jogo social de gerenciamento de café inspirado na nostalgia dos jogos sociais de navegador, com identidade própria.

## O que já existe

- Cadastro com e-mail, senha, nome e `@usuario` único.
- Login individual com Firebase Authentication.
- Criação automática do jogador com 3.000 moedas.
- Perfil privado + perfil público separado (o e-mail nunca aparece na comunidade).
- Café inicial de cada jogador.
- Protótipo visual do restaurante em Phaser.
- Livro de receitas.
- Início de preparo seguro via Cloud Functions.
- Cronômetro persistente no servidor.
- Servir prato, receber receita e XP.
- Level up automático e bônus de moedas.
- Busca de outros jogadores por `@usuario`.
- Visita ao café de outro jogador.
- Contagem básica de visitas.
- Ranking por nível e XP.
- Painel administrativo.
- Admin pode enviar moedas ou presentes.
- Log de todas as concessões administrativas.
- Firestore Rules bloqueando alterações diretas de moedas, XP, nível e inventário.

## Economia v0.1

Jogador começa com **3.000 moedas**.

| Receita | Custo | Venda | XP | Tempo |
|---|---:|---:|---:|---:|
| Café Espresso | 15 | 40 | 5 | 15 s |
| Pão de Queijo | 35 | 90 | 12 | 30 s |
| Brigadeiro | 55 | 160 | 20 | 60 s |
| Pizza Marguerita | 100 | 300 | 45 | 120 s |

Os tempos são curtos propositalmente nesta versão de desenvolvimento. Depois serão rebalanceados para minutos/horas.

Para subir de nível, o jogador precisa de `nível atual × 100 XP`. Ao subir, recebe `500 + novo nível × 100` moedas. O excedente de XP continua valendo para a progressão seguinte.

## 1. Instalar o projeto

Requer Node.js 22 recomendado.

```bash
npm install
```

## 2. Criar o Firebase

No Firebase Console:

1. Crie um projeto chamado `cafeville` (ou outro nome).
2. Authentication > Sign-in method > ative **Email/Password**.
3. Crie o Firestore Database.
4. Adicione um Web App.
5. Copie as credenciais do `firebaseConfig`.

Crie `.env.local` na raiz usando `.env.example`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

## 3. Firebase CLI

```bash
npm install -g firebase-tools
firebase login
firebase use --add
```

Escolha o projeto criado.

## 4. Instalar dependências das Functions

```bash
cd functions
npm install
cd ..
```

## 5. Publicar regras, índices e funções

```bash
firebase deploy --only firestore:rules,firestore:indexes,functions
```

As Cloud Functions usam a região `southamerica-east1`.

## 6. Rodar localmente

```bash
npm run dev
```

Abra `http://localhost:3000`.

## 7. Criar o administrador

1. Cadastre normalmente a sua conta no CaféVille.
2. No Firebase Console, abra Firestore > `users` > documento com seu UID.
3. Altere o campo `role` de `player` para `admin`.
4. Atualize `/admin` no jogo.

Isso só precisa ser feito manualmente para o primeiro administrador. Jogadores comuns não têm permissão para alterar esse campo.

## 8. Vercel

Suba a pasta para um repositório GitHub e importe na Vercel. Cadastre na Vercel as mesmas variáveis de `.env.local`.

## Próxima versão sugerida — v0.2

- Editor isométrico real por grade.
- Comprar, mover, girar e guardar móveis.
- Fogões ocupando posições do cenário.
- Chef andando até o fogão.
- Balcões com quantidade de porções.
- Clientes entrando e sentando.
- Garçom servindo automaticamente.
- Popularidade real.
- Persistência completa do layout do café.
- Sistema de amigos e solicitações.
- Presentes entre jogadores.
- Curtidas e mural/recados.
