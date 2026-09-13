# Atualizar Firebase e Vercel

## 1. Use o projeto existente

O projeto continua usando as variáveis da v0.3. A atualização não exige um novo banco nem recriar usuários. No Firebase Console, mantenha **Authentication → Sign-in method → E-mail/senha** habilitado.

Em **Authentication → Settings → Authorized domains**, confira seu domínio da Vercel e os domínios de desenvolvimento usados. Para login local, inclua `localhost` se necessário.

## 2. Variáveis na Vercel

Em Project → Settings → Environment Variables, mantenha as configurações reais do seu Firebase:

| Nome | Origem | Uso |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Configuração do app Web | Navegador |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Configuração do app Web | Navegador |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Configuração do app Web | Navegador |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Configuração do app Web | Navegador |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Configuração do app Web | Navegador |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Configuração do app Web | Navegador |
| `FIREBASE_ADMIN_PROJECT_ID` | ID do mesmo projeto | Somente servidor |
| `FIREBASE_CLIENT_EMAIL` | Conta de serviço já utilizada | Somente servidor |
| `FIREBASE_PRIVATE_KEY` | Chave da conta de serviço | Somente servidor |

A chave privada deve ser fornecida completa, com BEGIN/END e quebras de linha, ou com `\n` literal. O servidor faz a conversão. Não adicione prefixo `NEXT_PUBLIC_` às variáveis administrativas. Não coloque o JSON da conta de serviço no projeto.

Selecione os ambientes Production e Preview conforme a necessidade. Ao mudar variáveis do navegador, faça um novo deploy: elas entram no bundle na compilação. As credenciais não foram anexadas a esta entrega.

## 3. Regras

Firebase Console → Firestore Database → Rules:

1. Abra `firestore.rules` deste pacote.
2. Substitua o texto das regras pelo conteúdo completo.
3. Clique em Publish/Publicar.

As escritas são feitas pelo Firebase Admin nas APIs. O fato de o navegador não poder escrever no banco é intencional. Não troque as regras por `allow read, write: if true` para contornar erros.

## 4. Índices

### Pelo Firebase CLI

Se você já usa o CLI, entre na pasta do projeto e execute:

```bash
firebase login
firebase deploy --only firestore:rules,firestore:indexes --project SEU_PROJECT_ID
```

Esse comando publica as configurações sem apagar os dados. O projeto Firebase é informado explicitamente; o pacote não define um ID de projeto de terceiros.

### Pelo Console

Firestore Database → Indexes → Composite → Create index. Scope: Collection.

| Coleção | Campo 1 | Ordem 1 | Campo 2 | Ordem 2 |
|---|---|---|---|---|
| `publicProfiles` | `level` | Descending | `xp` | Descending |
| `publicProfiles` | `weekKey` | Ascending | `weekScore` | Descending |
| `cookJobs` | `ownerId` | Ascending | `status` | Ascending |

Espere o status Ready/Enabled. O primeiro índice pode já existir. Se a consulta de dois filtros de igualdade em `cookJobs` for atendida por índices automáticos, mantenha a configuração do arquivo para uniformidade.

O arquivo inclui também exclusões de indexação de mapas grandes. Essas exclusões melhoram custos e tamanho dos índices; publique pelo CLI para aplicar o conjunto completo.

## 5. Vercel

- Framework: **Next.js**.
- Root Directory: pasta que contém `package.json`.
- Install Command: `npm install` (ou padrão da Vercel, que usa o lockfile).
- Build Command: `npm run build`.
- Output Directory: deixe o padrão do Next.js.
- Node.js: 22 LTS recomendado; mínimo 20.19.

Copie o conteúdo de `cafeville/` para a raiz do repositório e faça commit. O deploy automático ocorrerá quando a integração GitHub/Vercel já estiver configurada. Se houver mais de 100 arquivos no upload Web do GitHub, use lotes por pasta ou GitHub Desktop.

## 6. Administrador

Com uma conta sua já cadastrada, encontre seu UID em Authentication. No documento `users/SEU_UID` do Firestore, altere **somente** o campo `role` para a string `admin` usando o Console do proprietário do Firebase. Depois abra `/admin`.

Nenhuma chave é necessária no navegador. Não altere o UID, o documento de outro jogador nem o saldo manualmente para concluir a instalação.

## 7. Se aparecer um erro

- **Conclua seu perfil:** o usuário Auth existe, mas o bootstrap anterior não terminou. Abra `/cadastro`, mantenha o mesmo e-mail e conclua o perfil. A conta não é apagada.
- **Erro ao salvar:** confirme as três variáveis administrativas e o Project ID. Veja os logs da função na Vercel; nenhum segredo precisa ser enviado ao suporte.
- **Ranking vazio:** a semana começou agora, não há jogadores ativos, ou um índice ainda está sendo criado.
- **Imagem do café não mudou:** confirme que `src/components/CafeGame.tsx`, `src/game/` e `public/assets/game/` foram enviados. Faça um novo deploy e atualize o navegador.
- **Café fechado depois de decorar:** clique no botão Fechado para reabrir. O modo de edição suspende os clientes para mudar a planta com segurança.
- **Presente não aparece imediatamente:** abra a aba Presentes novamente. Conteúdo de catálogo pode demorar até 30 s entre instâncias.

Teste primeiro com contas de teste. O roteiro completo está em `TESTES.md`.
