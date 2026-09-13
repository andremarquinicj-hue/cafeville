# Economia e evolução — v0.4

O ciclo restaurante → preparo → balcão → atendimento → pagamento está implementado. Os detalhes e limites estão em `docs/ANALISE_E_IMPLEMENTACAO.md`.

- Inicial: 3.000 moedas; convite válido: 3.250 para o novo jogador, mais 500 para quem convidou.
- Coletar uma receita nova rende XP e porções. As moedas de venda só vêm do pagamento dos clientes.
- Moeda especial concedida por nível; não há pagamento com dinheiro real.
- Missões diárias e semanais usam horário de Brasília; conquistas usam totais.
- A economia online é controlada por transações no backend.

## Próximas evoluções

1. Conjuntos completos de animações e variações de câmera/personagem para ampliar a direção de arte.
2. Filial de praia jogável, com estado próprio, desbloqueio e novas receitas.
3. Mais categorias de funcionário e contratações.
4. Campanhas sazonais autorais com decoração e mapas exclusivos.
5. Infraestrutura para muitos jogadores simultâneos e controles antifraude adicionais por pessoa.

O código atual já contém o catálogo de filiais e a separação do motor necessária para essas evoluções. Elas não foram publicadas como telas falsas.
