# Arquitetura

## Separação de responsabilidades

`src/game/core` contém tipos de comportamento, grade, navegação, catálogo, transições de estado, economia e progressão. É JavaScript determinístico com TypeScript, independente do DOM e do Phaser.

`src/game/scenes/CafeScene.ts` renderiza a simulação no Phaser. Converte a grade para isometria, ordena objetos por profundidade, anima sprites e recebe clique/arraste/pinça. A cena faz uma previsão visual entre respostas do servidor, usando uma cópia do estado; essa cópia nunca é enviada para alterar o saldo.

`src/components/GameView.tsx` desenha HUD, receitas, loja, inventário, equipe, missões e modais. `src/services/use-game.ts` envia somente intenções, serializa ações, guarda um identificador para tentar novamente quando uma resposta se perde e atualiza o estado confirmado.

`src/services/server-game.ts` autentica, carrega catálogo, migra se necessário, executa simulação e ação em transação e devolve o estado. `src/app/api` expõe as rotas Next.js com Firebase Admin, em runtime Node.js. O banco continua sendo Firestore.

## Modelo

| Coleção | Uso |
|---|---|
| `users/{uid}` | Perfil privado, função, saldo, XP e restrição de conta |
| `publicProfiles/{uid}` | Nome, café, progressão e estatísticas públicas |
| `cafes/{uid}` | Tamanho, móveis, inventário, estilos, fogões, porções, funcionários, simulação e missões |
| `cookJobs` | Preparos legados da v0.3, somente para resgate compatível |
| `inventories/{uid}/items` | Presentes antigos, preservados na migração |
| `gameRequests/{uid}_{requestId}` | Registro permanente da ação econômica e deduplicação |
| `usernames` | Reserva exclusiva de usuário |
| `inviteCodes`, `inviteEvents` | Convites; evento com ID do convidado |
| `followSuggestions/{uid}/items`, `follows` | Sugestões opcionais e relações |
| `cafes/{uid}/wall`, `/likes`, `/visitors` | Mural, curtidas únicas e visita diária |
| `gifts/{uid}/items`, `giftReceipts` | Transferências e resgates individuais |
| `socialHelps` | Limite de uma ajuda por par de jogadores/dia |
| `gameItems`, `gameRecipes`, `events`, `campaigns` | Catálogo e conteúdo criados pelo admin |
| `adminLogs` | Registro da operação na mesma transação de sua alteração |

O modelo `Cafe.branch`, os identificadores em `BRANCHES` e o isolamento do motor permitem introduzir `cafes/{uid}/branches/{branchId}` posteriormente. Nenhuma rota de uma filial ainda inexistente é apresentada como pronta.

## Tempo e atendimento

O navegador não envia a hora oficial. O servidor escolhe `now`. Cada preparo contém `startedAt`, `readyAt`, `spoilsAt` e uma cópia da receita usada naquele momento. Mudanças de catálogo posteriores não recalculam o preparo em andamento.

O servidor avança a simulação em passos de 250 ms. Uma consulta normal de presença ocorre aproximadamente a cada 4 s enquanto a aba está visível. O backend não avança duas vezes o mesmo intervalo e descarta pedidos de pulso muito próximos. Ausência acima de 15 s reinicia o atendimento sem renda offline. Fogões usam seus timestamps e não reiniciam.

A navegação considera cada célula ocupada do móvel, inclusive objetos 2×1 rotacionados. Clientes têm prazo de espera, mesa, cadeira e percurso. O garçom reserva a porção somente ao chegar ao balcão; a venda ocorre após a refeição. Nenhuma rota pública recebe uma quantidade de moedas por venda enviada pelo cliente.

## Segurança e concorrência

- Firebase Auth fornece o token Bearer. O servidor valida o token, revogação e desativação da conta.
- Todas as escritas do navegador no Firestore são negadas pelas regras fornecidas.
- Ações de jogo mudam perfil e café em uma transação. Moedas/nível/custo/preço vêm do estado e do catálogo do servidor.
- `gameRequests` rejeita reexecução da mesma ação já confirmada. Missões, convites e presentes têm, adicionalmente, seus próprios recibos únicos.
- Alterações administrativas e logs são gravados juntos. Nenhuma tela permite promover um usuário a admin.
- IDs de rotas sociais são validados e o conteúdo do mural é texto React, sem HTML injetado.
- O cadastro não apaga o usuário Auth ao falhar; o bootstrap pode ser retomado com o mesmo UID.
- O catálogo é armazenado em cache por até 30 s em cada instância. Alterações administrativas podem levar esse intervalo para aparecer em outras instâncias.
- A exclusão de uma sugestão não cria relação de seguimento.

A regra de uma recompensa por conta não prova que contas diferentes pertencem a pessoas diferentes. Para campanhas públicas de maior valor, adicionar App Check, verificação de e-mail e controles antifraude de cadastro é uma evolução separada.

## Migração

Migração ocorre quando `schemaVersion !== 4`. Usa o nome/visitas/curtidas existentes, cria a planta porque a base não possuía móveis posicionados e importa presentes antigos reconhecidos (até 200 documentos, até 20 unidades de cada registro). Dados desconhecidos ou além desse limite permanecem nos documentos originais e devem ser tratados com uma migração específica se existirem.

O perfil não é recriado. Preparos legados não são apagados nem iniciados novamente. O painel consulta até 100 pendentes por vez; após resgatar e atualizar, os próximos podem aparecer. O endpoint antigo de iniciar receita foi redirecionado para as validações novas, fechando o caminho econômico antigo.

## Desempenho

Arte SVG local; nenhuma imagem remota é necessária ao gameplay. Phaser é carregado dinamicamente apenas nas telas de restaurante. Cada café tem no máximo 12 clientes simultâneos e três trabalhadores. Não se consulta o histórico completo de preparos antigos a cada quadro. Campos grandes do café não são indexados. O cenário é redesenhado quando layout/tema mudam; posições de sprites são atualizadas no loop de renderização.
