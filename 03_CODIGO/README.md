# CaféVille 0.4 — Restaurante vivo

Projeto completo para GitHub, Vercel e Firebase. Next.js cuida da interface e das APIs; Phaser 3 desenha o restaurante e os personagens. A economia do jogo online é calculada pelo servidor.

## Comece aqui

1. Leia `ATUALIZAR_GITHUB.txt`.
2. Publique as regras e os índices de `firestore.rules` e `firestore.indexes.json`.
3. Substitua o conteúdo do repositório pelo conteúdo desta pasta, incluindo `package-lock.json`.
4. Mantenha as variáveis de ambiente do projeto atual na Vercel. Os nomes não mudaram.
5. Faça o deploy e entre em `/jogo`. `/demo` abre uma demonstração local sem cadastro.

Não envie `.env.local`, chaves privadas ou a conta de serviço ao GitHub.

## Rodar no computador

Node.js 20.19 ou superior (recomendado: Node 22 LTS).

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000/demo`. Para jogar online, copie `.env.example` para `.env.local` e preencha com as configurações do seu próprio Firebase. Não é preciso configurar Firebase para testar a demonstração.

```bash
npm test
npm run typecheck
npm run build
npm start
```

O modo `/demo` salva somente no navegador e não participa de convites, ranking ou presentes. Ele não é usado como fallback de uma conta online. Na versão online não se aceitam moedas, XP, preços, popularidade ou inventário enviados pelo cliente.

## Como jogar

- Clique em um fogão ou use **Receitas**. Um fogão comporta um preparo.
- Quando aparecer **Pronto**, clique para transferir as porções ao balcão.
- O garçom busca as porções, atende os clientes e eles pagam depois de comer.
- Deixe uma cadeira encostada em cada mesa, com espaço livre para circular.
- Receitas continuam preparando quando você sai. Se passar o prazo para recolher, será preciso limpar o fogão.
- Use **Loja → Comprar**, depois **Decorar → Posicionar**. Arraste móveis, gire, guarde ou venda.
- Em **Equipe**, melhore chef, garçom e faxineiro. Em **Missões**, resgate recompensas reais.
- Clique em **Aberto** para fechar temporariamente. O atendimento é reiniciado sem cobrar clientes interrompidos; porções reservadas retornam aos balcões.
- Visite os vizinhos, siga quem quiser, curta, limpe mesas, troque presentes e deixe recados.
- Áudio é sintetizado no navegador e só começa quando você toca no botão de som.

## Contas existentes

O mesmo projeto Firebase, os UIDs, os e-mails, as senhas gerenciadas pelo Firebase Authentication, o saldo, o nível, o XP, as relações sociais e os convites são mantidos. Não há exclusão de coleções nem redefinição do saldo inicial de jogadores existentes.

A v0.3 não possuía posições de móveis. No primeiro acesso à v0.4, somente a estrutura do café recebe o layout inicial editável. Receitas pendentes da v0.3 aparecem em **Preparos da versão anterior**, com o resgate original uma única vez. Essa compatibilidade é a única exceção à regra nova de pagamento por cliente. Presentes antigos dos tipos conhecidos são incorporados ao inventário; registros originais são preservados.

## Documentação

- `docs/ANALISE_E_IMPLEMENTACAO.md`: análise da base, decisões, o que está pronto e limites.
- `docs/ARQUITETURA.md`: simulação, transações, coleções, migração e extensão para filiais.
- `docs/FIREBASE_E_VERCEL.md`: configuração passo a passo, índices e admin.
- `docs/TESTES.md`: verificações realizadas e roteiro para testar no seu Firebase.
- `docs/REFERENCIAS.md`: pesquisa histórica e fontes técnicas.
- `scripts/create-assets.py`: fontes geradoras das ilustrações originais em SVG.

As filiais jogáveis, contratações de novos tipos de funcionário e grandes campanhas sazonais com mapas exclusivos são etapas futuras documentadas. O ciclo principal já é implementado. A v0.4 usa arte vetorial própria; não promete igualdade pixel a pixel com uma imagem conceitual nem reprodução integral de todas as versões do Café Mania.
