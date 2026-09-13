# CaféVille v0.3 — Nostalgia + Social

Versão visual reconstruída a partir do mockup aprovado do CaféVille, com aparência de jogo social de café da era do Orkut e identidade própria.

## O que entrou na v0.3

- Tela principal totalmente redesenhada: HUD, barra lateral, cenário, receitas, loja, funcionários, decoração e missões.
- Cenário visual baseado no conceito aprovado do CaféVille.
- Login, cadastro e landing page redesenhados.
- Comunidade com abas de sugestões, seguindo, seguidores e busca de jogadores.
- Visita ao café de outro jogador com botão Seguir / Deixar de seguir.
- Ranking redesenhado.
- Painel administrador redesenhado.
- Convite por link individual.
- Jogador que convida ganha **500 moedas** quando o convidado conclui o cadastro.
- Novo jogador que entra pelo convite ganha **250 moedas extras**, começando com **3.250 moedas**.
- Após o cadastro, os dois recebem uma sugestão para seguir o café um do outro. Ninguém é seguido automaticamente.

## Como atualizar seu GitHub

1. Extraia o ZIP da v0.3.
2. Substitua os arquivos do repositório `cafeville` pelos arquivos desta pasta.
3. Faça commit no GitHub.
4. A Vercel fará o deploy automaticamente.

As variáveis de ambiente já configuradas na Vercel continuam as mesmas da v0.2.

## Firebase

Esta versão continua usando Firebase Authentication + Firestore e o backend da Vercel com Firebase Admin.

Não é necessário criar coleções manualmente. As novas coleções (`inviteCodes`, `inviteEvents`, `followSuggestions` e `follows`) são criadas pelo backend conforme os jogadores usam os recursos.

## Regras

O arquivo `firestore.rules` permanece restritivo: dados econômicos e sociais sensíveis são alterados somente pelo backend administrativo.

## Próxima etapa sugerida

- Compra real de móveis.
- Arrastar/girar objetos no restaurante.
- Clientes e garçons com movimentação real.
- Presentes entre jogadores.
- Eventos sazonais e conquistas.
