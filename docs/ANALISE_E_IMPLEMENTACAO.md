# Análise da base e entregas 0.4 / 0.5

## O que existia na v0.3

Foram revisados os arquivos do ZIP original: configuração, documentos, páginas, componentes, autenticação, APIs, receitas, regras e quatro imagens.

| Área | Diagnóstico | Ação |
|---|---|---|
| Stack | Next.js 15, React 19, TypeScript, Firebase cliente e Admin | Preservada; Next atualizado para 15.5.25 no lockfile |
| Phaser | Dependência instalada, mas não utilizada | Cena real com renderização em canvas, câmera e entrada |
| Restaurante | Uma imagem PNG com elementos HTML sobrepostos | Grade isométrica com móveis individuais e personagens |
| Receitas | Custo no backend; coleta pagava receita integral; sem capacidade de fogão nem nível validado no servidor | Fogões reais, validação de nível, tempo, validade, balcões e venda por cliente |
| Loja, inventário, equipe, missões | Botões e contagens de exemplo | Ações e progresso efetivos, salvos no café |
| Visitas | Todos viam a mesma imagem; curtir apenas alterava mensagem | Carregamento do layout do dono, curtidas persistentes, presentes, ajuda e mural |
| Convites | Bônus e sugestões já existentes | Mantidos; criação do evento e concessão atômicas, ID por convidado, código validado |
| Cadastro | Exclusão do usuário Auth quando bootstrap falhava | Removida a exclusão; é possível retomar a criação de perfil |
| Ranking | Nível e XP | Global/nível, amigos, popularidade e semana |
| Admin | Busca simples e concessão; log fora da transação | Admin por função, operações e logs atômicos, catálogo, eventos e campanhas |
| Dados | Firebase existente com UIDs, saldos e relações | Migração aditiva; os registros originais não são apagados |

## Recursos que estão implementados

- Restaurante inicial 8×8, duas unidades de fogão, três balcões, quatro pares mesa/cadeira, plantas, geladeira e trio de funcionários.
- NPCs com chegada, deslocamento na grade, espera, refeição, pagamento e saída. Garçom busca uma porção no balcão e a leva à mesa. Faxineiro limpa mesas após o atendimento.
- Busca de caminho na grade. Colisões com móveis e validação de acesso a fogões e balcões. Mesa sem cadeira adjacente e acessível não recebe clientes.
- Oito receitas básicas; pratos adicionais podem ser cadastrados pelo administrador a partir das ilustrações disponíveis.
- Preparos com timestamps, comida pronta/estragada, limpeza, estoque de porções e preço por unidade fixado no preparo.
- Compra, inventário, posicionamento, arrastar, girar, guardar, vender e persistir. Acabamentos e temas aplicáveis.
- Expansões 10×10, 12×12, 14×14 e 16×16, com nível e saldo exigidos.
- Melhorias de chef, garçom e faxineiro, até nível 5. Popularidade influenciada por espera, disponibilidade de assentos, atendimento, limpeza e decoração.
- XP, níveis, bônus, moeda especial acumulada por nível e animação de celebração.
- Missões diárias, semanais e conquistas com progresso real, proteção contra resgate repetido e recompensa de moedas/XP/itens.
- Convites com 500/250 moedas, autoconvite rejeitado, evento único por conta e sugestões com Visitar/Seguir/Agora não.
- Busca, seguir/deixar de seguir, visitas, curtidas, presente de item guardado, aceitação, ajuda diária e mural com limite de frequência.
- Ranking semanal por XP ganho na semana; global/nível por nível e XP; popularidade; e amigos.
- Admin: totais de jogadores/moedas, busca por usuário/e-mail, informações privadas de jogadores, moedas, presentes, desativação/reativação, edição/criação de receitas, itens, eventos e campanhas para todos, missões e histórico.
- Câmera com pan, zoom, pinça, centralização, menus responsivos, demonstração local e música sintetizada original.

## Limites explícitos desta entrega

1. **Arte:** na v0.5, os personagens e móveis são ilustrações PNG originais organizadas em atlas; os SVGs continuam como compatibilidade e em elementos da interface. A imagem conceitual anexada é uma referência de linguagem visual, não um conjunto de sprites recortados. O resultado não é pixel a pixel igual ao mockup. Alguns móveis simétricos compartilham a mesma aparência em orientações opostas.
2. **Offline:** preparos avançam mesmo com o site fechado; não há vendas automáticas durante ausências longas. Ao voltar, pedidos incompletos são descartados sem pagamento e as porções reservadas são restituídas. Isso evita vender sem mostrar atendimento e limita a carga da Vercel.
3. **Filiais:** tipos de filial e limiares constam no catálogo e no modelo, mas somente o café principal é jogável. Praia, montanha e internacional não estão liberados.
4. **Funcionários futuros:** atendente, ajudante e gerente não estão implementados como NPCs contratáveis.
5. **Eventos:** o admin cria período, objetivo de clientes na semana, recompensas e associa item/receita. Não há campanhas de Natal/Halloween já publicadas nem mapas exclusivos. O objetivo considera a semana corrente, inclusive atendimentos anteriores à abertura do evento.
6. **Moeda especial:** é concedida ao subir de nível. Não há compra por dinheiro real nem loja premium nesta versão.
7. **Animações:** quatro quadros de caminhada para cada um dos nove personagens, seis poses sentadas e efeitos leves por estado; não há o volume de animações de um jogo comercial com equipe de arte dedicada.
8. **Escala:** a simulação é por jogador, em requisições periódicas, com um documento de café. Isso é adequado ao início do produto; alta concorrência exige revisão de frequência/custos, filas e separação de documentos. Não há promessa de escala ilimitada.
9. **Verificação online:** testes de produção exigem as configurações Firebase/Vercel do proprietário. Nenhuma conta real foi criada ou alterada durante a entrega.

## Economia e balanceamento

Mantidos 3.000 de início e bônus de convite. O pão de queijo usa o exemplo solicitado: custo 30, 20 porções × 4 moedas, 10 XP e 30 segundos. Valores e duração dos demais pratos pertencem ao CaféVille. Vender móveis devolve 40% do preço atual do catálogo. As expansões e receitas são desbloqueadas pelo nível. Não há monetização real.

## Atualização visual 0.5

As artes básicas do restaurante foram substituídas na apresentação por ilustrações mais expressivas, com rostos, cabelos, vestimentas, contornos e materiais detalhados. A integração usa cinco atlas PNG transparentes, compartilhados entre Phaser e os componentes da loja/inventário/admin. Os IDs e URLs legados são resolvidos por `src/game/art/nostalgia.ts`, preservando os dados salvos. O arquivo `next.config.ts` inclui o pacote de imagens para que um envio incompleto de public não impeça o deploy.
