# Verificação da entrega 0.4

Verificações realizadas em 13/09/2026, sobre o projeto incluído neste ZIP.

## Instalação e compilação

| Verificação | Resultado |
|---|---|
| `npm install` | Concluído; dependências registradas em `package-lock.json` |
| `npm run typecheck` | Aprovado, sem erros TypeScript |
| `npm run build` | Aprovado, Next.js 15.5.25; páginas e APIs compiladas |
| `npm test` | 12 testes aprovados |

O build e `/demo` funcionam sem credenciais Firebase. O jogo online precisa das variáveis descritas em `.env.example`.

## Testes automatizados da lógica

O arquivo `tests/game.test.ts` cobre:

1. Layout inicial navegável, quatro assentos e conversão isométrica.
2. Capacidade dos fogões, nível exigido por receita e saldo insuficiente.
3. Tempo de preparo, coleta única e ausência de pagamento imediato na coleta.
4. Comida estragada após ausência e limpeza do fogão.
5. Ciclo de cliente, garçom, consumo, pagamento e limpeza da mesa.
6. Efeito da falta de comida na popularidade.
7. Colisões, limites do terreno, acesso à entrada e restrições para guardar móveis ocupados.
8. Compra, posicionamento, rotação, armazenamento e venda de móveis.
9. Ausência longa sem renda artificial e devolução de porções reservadas.
10. Resgate único de missões e virada do dia/semana no horário brasileiro.
11. Expansões, requisitos e limites de melhorias dos funcionários.
12. Caminhos que contornam objetos da grade.

Os testes usam o mesmo núcleo de regras empregado pela API online e pela demonstração. Não substituem testes de integração com Firestore.

## Conferência no navegador

Executada com Chromium headless e o servidor de produção (`npm start`), usando `/demo`:

- Cena Phaser renderizada em canvas, com móveis e personagens.
- Preparo de espresso, espera do tempo real, coleta no balcão, atendimento e pagamento após a refeição. No primeiro pagamento, o saldo observado foi 2.989: 3.000 iniciais − 15 de preparo + 4 pela porção consumida.
- Compra de decoração, posicionamento na célula (7, 7), arraste até (6, 7) e rotação; todas as alterações conferidas no estado salvo.
- Saldo preservado após recarregar a página; decoração mantida na cena recarregada.
- Interface de computador (1512×982) e celular (390×844), sem rolagem horizontal indevida.
- Páginas inicial, login e cadastro renderizadas.
- Requisição de jogo sem autenticação rejeitada com HTTP 401.
- Nenhuma exceção JavaScript ou erro de console no fluxo aprovado.

Uma falha de renderização do WebGL encontrada nesse ambiente foi corrigida usando o renderizador Canvas do próprio Phaser. A cena continua com câmera, entrada, sprites e ciclo de atualização do Phaser 3.

Capturas reais da demonstração estão em `docs/capturas/`: restaurante, atendimento, edição e celular. Elas mostram a implementação entregue, sem montagem de interface.

## Conferência necessária no Firebase do proprietário

Não foram fornecidas credenciais do projeto. Portanto, cadastro/login reais, migração de contas existentes, transações concorrentes, convites, presentes, ranking e administração **não foram executados contra o seu Firebase**. Essas rotas foram implementadas e compiladas; a resposta 401 sem autenticação foi verificada no navegador.

Depois de configurar o ambiente, publique as regras e índices e confira este roteiro com duas contas de teste:

| Fluxo | Resultado esperado |
|---|---|
| Entrar com conta da v0.3 | Mesmo UID, saldo e progresso; layout editável criado sem apagar o perfil |
| Coletar preparo pendente da v0.3 | Resgate original uma única vez |
| Criar conta sem convite | 3.000 moedas iniciais |
| Criar conta com convite válido | Convidado recebe 3.250; quem convidou recebe 500; ninguém é seguido automaticamente |
| Reenviar bootstrap e ação com o mesmo ID | Nenhum bônus ou gasto duplicado |
| Preparar e atender online | Custo descontado uma vez; porções consumidas; moedas recebidas após comer |
| Recarregar e abrir outra sessão | Layout, inventário, saldo e horários retornam do servidor |
| Visitar a outra conta | Layout do dono, curtida persistente, seguir opcional e mural |
| Dar e aceitar um presente | Item sai do inventário do remetente e é concedido uma única vez ao destinatário |
| Ranking | Ordenação correta e índices do Firestore concluídos |
| Conta comum em rota admin | HTTP 403 |
| Conta com `role: "admin"` | Busca, concessões, catálogo, eventos e log das alterações |
| Alterar moedas/XP enviados pelo navegador | Valores enviados não são usados como saldo ou recompensa |

Não foram realizados teste de carga, auditoria externa de segurança ou testes em aparelhos físicos. A verificação responsiva usa o viewport do navegador; não equivale a certificar todos os modelos de celular.
