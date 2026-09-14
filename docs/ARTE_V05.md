# Arte do CaféVille 0.5

Esta atualização aplica ao jogo personagens e móveis ilustrados com rostos expressivos, contornos definidos, cores mais vivas e materiais detalhados. As ilustrações foram criadas com a geração de imagens integrada (modo nativo). O desenho é original do CaféVille, inspirado na linguagem dos jogos sociais de restaurante da época do Orkut.

## Conteúdo aplicado

| Atlas em `public/assets/game/nostalgia-v5/` | Conteúdo |
|---|---|
| `staff.png` | Chef, garçom e faxineira; quatro quadros de caminhada para cada um |
| `guests-a.png` | Três clientes; quatro quadros de caminhada para cada um |
| `guests-b.png` | Outros três clientes; quatro quadros de caminhada para cada um |
| `seated.png` | Seis poses sentadas para os clientes |
| `furniture.png` | Doze móveis e decorações |

Os cinco PNGs têm transparência real. Eles são preservados inteiros; o jogo usa coordenadas de quadros registradas em `src/game/art/atlas.json`. O recorte exibido acontece no Phaser e no componente `GameArt`, sem editar os pixels dos arquivos gerados.

## Personagens e decoração

- Chef de bigode, uniforme branco, lenço vermelho e chapéu alto.
- Garçom com colete, gravata borboleta e avental.
- Faxineira com coque, roupa verde e vassoura.
- Seis clientes com cabelos, tons de pele e roupas diferentes.
- Mesa com toalha xadrez, mesa redonda de mármore, cadeiras de madeira curvada, fogões creme e verde/dourado, balcão de madeira, geladeira retrô, sofá, costela-de-adão, luminária e floreira.

O personagem anda usando os quadros de caminhada e usa a pose sentada quando espera ou come. Balões compactos de espera/satisfação substituem os textos grandes sobre os rostos. A mesa retrô e o fogão dourado agora têm aparência própria. A cadeira Riviera e a floreira de gerânios foram incluídas na loja a partir do nível 2.

## Integração e compatibilidade

`nostalgia.ts` relaciona os IDs existentes dos itens e as URLs SVG antigas com os novos quadros. Layout, inventário e preparos existentes mantêm seus registros. A grade e as regras de atendimento/economia continuam iguais.

`next.config.ts` leva uma cópia compactada das 110 imagens necessárias: 105 SVGs de compatibilidade/interface/comidas e cinco atlas PNG. O build restaura arquivos ausentes; os atlas versionados são conferidos por SHA-256. Isso permite instalar a atualização visual enviando apenas o pacote de código, mesmo quando `public` foi enviado incompleto. A recuperação só roda nas fases de build e desenvolvimento.

Para atualizar intencionalmente o pacote depois de alterar artes, execute `python3 scripts/build-art-pack.py`. Esse script empacota bytes existentes; ele não refaz os desenhos. Os originais PNG incluídos no ZIP são a fonte da arte ilustrada.

## Direção dos prompts usados

Estilo comum: “polished classic 2010 social restaurant Flash-game cartoon; large expressive eyes, outlined sculpted hair, small adult bodies, warm cel shading and subtle gradients; original characters; isometric three-quarter camera; transparent alpha background”.

Para a equipe e clientes, foi solicitado um atlas de quatro colunas por três linhas, uma identidade por linha, com quadros de contato, passo, passagem e passo oposto. Foram definidos individualmente roupa, cabelo, tom de pele e acessórios de cada personagem. Para a equipe: chef branco/vermelho com bigode, garçom de colete e faxineira verde com vassoura. Para os clientes: camisa vermelha e jeans; cardigan violeta e vestido creme; blusa amarela e calça verde; vestido floral coral; senhor de cardigan azul e óculos; polo azul e calça bege.

Para os móveis: “original isometric restaurant furniture, nostalgic colorful bistro decoration, clean dark brown outlines, rounded substantial forms, brass highlights, wood grain, fabric seams; transparent background; four columns and three rows”. Foram pedidos os doze objetos na ordem registrada no atlas. Para as poses sentadas: seis personagens separados, três colunas por duas linhas, sentados em cadeiras invisíveis, preservando os conjuntos de roupas e cabelos. O móvel é desenhado separadamente pelo jogo.

As proporções e a direção de arte foram conferidas a partir de capturas históricas, incluindo o [registro de Café Mania publicado em 2011](https://girlsfashioons.blogspot.com/2011/04/cafe-mania.html). Essa referência não foi incorporada aos arquivos gráficos do projeto.

## Limites do conjunto

São animações em quadros e poses, com espelhamento horizontal para direção. Não há rig 3D nem uma vista exclusiva para cada um dos quatro ângulos dos móveis. O conjunto busca a atmosfera nostálgica com desenhos próprios, sem prometer igualdade com os personagens ou com o catálogo completo do jogo de referência.
