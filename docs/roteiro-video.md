# Roteiro do vídeo pitch (até 4 min)

> Dica: grave a tela com OBS ou com a gravação do Windows (Win + Alt + R). Deixe o navegador e o VS Code abertos lado a lado.

## 0:00 – 0:20 · Abertura
"Olá, sou [nome]. Esta é a Pokédex, um site em HTML, CSS e JavaScript puro que consome a PokéAPI.
Escolhi Pokémon porque é um dos desenhos de maior sucesso dos anos 90."

## 0:20 – 1:10 · Projeto funcionando (requisito 1)
- Recarregue a página (F5) e mostre os cards aparecendo, com o skeleton antes.
- Role pelos cards: nome, imagem, tipos, altura, peso e barras de status.
- Clique em **Carregar mais**.
- Busque `pikachu`, depois `25`, depois um nome inexistente (mostra a mensagem de erro).
- Filtre pelo tipo **Fogo**.
- Favorite 2 Pokémon (♥), clique em **Favoritos** e recarregue a página para mostrar que eles continuam salvos.
- Rapidamente, reduza a janela (ou F12 → modo celular) para mostrar a responsividade.

## 1:10 – 1:50 · Consumo da API no navegador (requisito 2)
- F12 → aba **Network (Rede)** → filtre por **Fetch/XHR** → F5.
- Clique na requisição `pokemon?limit=20&offset=0` → aba **Preview/Resposta**: mostre `results` com `name` e `url`.
- Clique em uma requisição de detalhe (ex: `1`) e mostre `name`, `sprites`, `types` e `stats`.
- Opcional: na aba **Console**, digite
  `fetch("https://pokeapi.co/api/v2/pokemon/pikachu").then(r => r.json()).then(console.log)`

## 1:50 – 3:20 · Explicação do código (requisitos 3 e 4)
**HTML (`index.html`)**: mostre a `<div id="cards-container">` **vazia**: "nenhum card está escrito no HTML".

**CSS (`style.css`)**: variáveis de cor no `:root`, o grid `.cards` com `auto-fill/minmax` (responsivo sem frameworks) e as classes `.type--fire` etc.

**JavaScript (`script.js`)**:
1. `fetchJSON`: "o `fetch` faz a requisição, o `then` recebe a resposta, confiro `response.ok` e converto com `.json()`".
2. `loadNextPage`: "busco a lista, depois os detalhes em paralelo com `Promise.all`, e chamo `renderCards`".
3. `createCard`: "aqui crio o card com `document.createElement`, preencho com `textContent` e `src`, e monto com `appendChild`/`append`".
4. `renderCards`: `cardsContainer.appendChild(createCard(pokemon))`, "é aqui que o card entra na página".

## 3:20 – 3:50 · Prova de que os cards são dinâmicos (requisito 4)
- F12 → aba **Elements**: expanda `#cards-container` e mostre os `<article class="card">` gerados.
- Clique com o botão direito → **Exibir código-fonte da página** (Ctrl+U): o contêiner está vazio no HTML original.

## 3:50 – 4:00 · Encerramento
"Essa foi a Pokédex. O link do GitHub está na descrição. Obrigado!"
