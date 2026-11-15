# Pokédex

Aplicação front-end que consome a [PokéAPI](https://pokeapi.co/) e gera **cards de personagens dinamicamente** com JavaScript.
Projeto da disciplina **Web Development Front-End** da UniFECAF, com o tema "desenhos de sucesso dos anos 90 e 2000".

**🔗 Site no ar:** https://devdanilooliveira.github.io/TrabalhoFrontEnd/

## Tecnologias

- HTML5 semântico
- CSS3 puro, sem frameworks (Grid, Flexbox, variáveis CSS, media queries)
- JavaScript puro (`fetch`, `then`, `Promise.all`, `createElement`, `appendChild`)

## Funcionalidades

- Cards criados 100% via JavaScript: o HTML só tem o contêiner vazio `#cards-container`
- Cada card mostra número, nome, imagem oficial, tipos, altura, peso e status base (HP, Ataque, Defesa, Velocidade)
- Favoritar com ♥ (salvo no `localStorage`) e ver só os favoritos
- Busca por nome ou número
- Filtro por tipo (lista de tipos também vem da API)
- Paginação com o botão "Carregar mais" (20 por vez)
- Skeleton de carregamento e mensagens de erro
- Layout responsivo (desktop, tablet e celular)

## Como executar

Não precisa instalar nada. Abra o `index.html` no navegador, ou rode um servidor local:

```bash
python3 -m http.server 8000
# acesse http://localhost:8000
```

Também funciona com a extensão **Live Server** do VS Code.

## Estrutura

```
├── index.html            # estrutura da página
├── css/style.css         # estilos e responsividade
├── js/script.js          # consumo da API e criação dos cards
├── assets/pokeball.svg   # ícone
└── docs/                 # parte teórica (PDF) e roteiro do vídeo
```

## API utilizada

| Endpoint | Uso |
|---|---|
| `GET /api/v2/pokemon?limit=20&offset=0` | lista paginada |
| `GET /api/v2/pokemon/{nome ou id}` | detalhes de um Pokémon |
| `GET /api/v2/type` e `/type/{tipo}` | filtro por tipo |

A API não exige token. Pede apenas uso consciente (cache e poucas requisições).

---

Pokémon e nomes relacionados são marcas de Nintendo, Game Freak e The Pokémon Company. Projeto sem fins comerciais.
