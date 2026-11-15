/* =========================================================
   Pokédex — consumo da PokéAPI com fetch
   e criação DINÂMICA dos cards (createElement + appendChild)
   ========================================================= */

// ----- Configurações -----
const API_URL = "https://pokeapi.co/api/v2";
const PAGE_SIZE = 20;            // quantos Pokémon carregar por vez
const MAX_POKEMON_ID = 1025;     // ignora formas alternativas (ids 10000+)
const FAVORITES_KEY = "pokedex:favoritos";

// ----- Referências aos elementos do HTML -----
const cardsContainer = document.getElementById("cards-container");
const statusMessage = document.getElementById("status-message");
const loadMoreBtn = document.getElementById("load-more-btn");
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const typeSelect = document.getElementById("type-select");
const favoritesBtn = document.getElementById("favorites-btn");
const favoritesCount = document.getElementById("favorites-count");

// Tradução dos tipos e atributos para exibição em português
const TYPE_NAMES = {
  normal: "Normal", fire: "Fogo", water: "Água", electric: "Elétrico",
  grass: "Planta", ice: "Gelo", fighting: "Lutador", poison: "Venenoso",
  ground: "Terra", flying: "Voador", psychic: "Psíquico", bug: "Inseto",
  rock: "Pedra", ghost: "Fantasma", dragon: "Dragão", dark: "Sombrio",
  steel: "Aço", fairy: "Fada",
};
const STAT_NAMES = { hp: "HP", attack: "Ataque", defense: "Defesa", speed: "Veloc." };

// ----- Estado da aplicação -----
const state = {
  mode: "all",        // "all" | "type" | "search" | "favorites"
  offset: 0,          // posição atual na lista paginada
  typeUrls: [],       // lista de URLs quando filtrando por tipo
  requestId: 0,       // evita que respostas antigas sobrescrevam novas
};

/* =========================================================
   1) CONSUMO DA API
   ========================================================= */

// Função genérica: faz o fetch, valida a resposta e converte para JSON.
function fetchJSON(url) {
  return fetch(url).then((response) => {
    if (!response.ok) {
      throw new Error(`Erro ${response.status} ao acessar ${url}`);
    }
    return response.json(); // também retorna uma Promise
  });
}

// Busca os detalhes completos de vários Pokémon em paralelo.
function fetchPokemonDetails(urls) {
  return Promise.all(urls.map((url) => fetchJSON(url)));
}

// Extrai o número (id) do Pokémon a partir da URL retornada pela API.
function idFromUrl(url) {
  return Number(url.split("/").filter(Boolean).pop());
}

/* =========================================================
   2) CRIAÇÃO DINÂMICA DOS CARDS (DOM manipulation)
   ========================================================= */

// Atalho para criar um elemento com classe e texto.
function createEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

// Recebe o JSON de um Pokémon e devolve um <article> pronto (o card).
function createCard(pokemon) {
  const card = createEl("article", "card");
  card.dataset.id = pokemon.id;

  // --- Número + Nome do personagem ---
  const number = createEl("p", "card__number", `#${String(pokemon.id).padStart(4, "0")}`);
  const name = createEl("h3", "card__name", pokemon.name.replace(/-/g, " "));

  // --- Botão de favorito (coração) ---
  const favBtn = createEl("button", "card__fav");
  favBtn.type = "button";
  updateFavButton(favBtn, isFavorite(pokemon.id), pokemon.name);
  favBtn.addEventListener("click", () => toggleFavorite(pokemon.id, favBtn, pokemon.name));

  // --- Imagem ---
  const imageWrap = createEl("div", "card__image-wrap");
  const img = document.createElement("img");
  img.className = "card__image";
  img.src =
    pokemon.sprites.other["official-artwork"].front_default ||
    pokemon.sprites.front_default ||
    "assets/pokeball.svg";
  img.alt = `Imagem de ${pokemon.name}`;
  img.loading = "lazy";
  img.width = 200;
  img.height = 200;
  imageWrap.appendChild(img);

  // --- Tipos (badges coloridos) ---
  const types = createEl("div", "card__types");
  pokemon.types.forEach(({ type }) => {
    const badge = createEl("span", `type type--${type.name}`, TYPE_NAMES[type.name] || type.name);
    types.appendChild(badge);
  });

  // --- Informações adicionais: altura e peso ---
  // A API devolve altura em decímetros e peso em hectogramas.
  const info = createEl("dl", "card__info");
  info.append(
    createEl("dt", "", "Altura"),
    createEl("dd", "", `${(pokemon.height / 10).toFixed(1)} m`),
    createEl("dt", "", "Peso"),
    createEl("dd", "", `${(pokemon.weight / 10).toFixed(1)} kg`),
  );

  // --- Status base (barras) ---
  const stats = createEl("ul", "stats");
  pokemon.stats
    .filter(({ stat }) => STAT_NAMES[stat.name])
    .forEach(({ base_stat, stat }) => {
      const li = createEl("li", "stat");
      const bar = createEl("span", "stat__bar");
      const fill = createEl("span", "stat__fill");
      fill.style.width = `${Math.min(base_stat / 150, 1) * 100}%`;
      bar.appendChild(fill);
      li.append(
        createEl("span", "stat__label", STAT_NAMES[stat.name]),
        createEl("span", "stat__value", base_stat),
        bar,
      );
      stats.appendChild(li);
    });

  // Monta o card na ordem do layout: nome + coração, imagem, informações
  card.append(number, name, favBtn, imageWrap, types, info, stats);
  return card;
}

// Adiciona uma lista de Pokémon na tela.
function renderCards(pokemonList) {
  pokemonList.forEach((pokemon) => {
    cardsContainer.appendChild(createCard(pokemon));
  });
}

// Cards "esqueleto" que aparecem enquanto a API responde.
function showSkeletons(amount) {
  for (let i = 0; i < amount; i++) {
    const card = createEl("div", "card card--skeleton");
    card.setAttribute("aria-hidden", "true");
    card.append(
      createEl("div", "skeleton-line skeleton-line--short"),
      createEl("div", "card__image-wrap"),
      createEl("div", "skeleton-line"),
      createEl("div", "skeleton-line skeleton-line--short"),
    );
    cardsContainer.appendChild(card);
  }
}

function removeSkeletons() {
  cardsContainer.querySelectorAll(".card--skeleton").forEach((el) => el.remove());
}

function clearCards() {
  cardsContainer.replaceChildren();
}

function setStatus(text, isError = false) {
  statusMessage.textContent = text;
  statusMessage.classList.toggle("status--error", isError);
}

/* =========================================================
   3) CARREGAMENTO E PAGINAÇÃO
   ========================================================= */

// Descobre quais URLs carregar na próxima página, conforme o modo atual.
function getNextUrls() {
  if (state.mode === "type") {
    return Promise.resolve(state.typeUrls.slice(state.offset, state.offset + PAGE_SIZE));
  }
  // Modo "all": usa a paginação nativa da API (limit/offset)
  const url = `${API_URL}/pokemon?limit=${PAGE_SIZE}&offset=${state.offset}`;
  return fetchJSON(url).then((data) => data.results.map((p) => p.url));
}

function hasMore() {
  if (state.mode === "type") return state.offset < state.typeUrls.length;
  if (state.mode === "all") return state.offset < MAX_POKEMON_ID;
  return false;
}

// Carrega a próxima página de Pokémon e cria os cards.
function loadNextPage() {
  const currentRequest = ++state.requestId;
  loadMoreBtn.hidden = true;
  showSkeletons(PAGE_SIZE / 2);
  setStatus("Carregando Pokémon...");

  getNextUrls()
    .then((urls) => {
      const validUrls = urls.filter((u) => idFromUrl(u) <= MAX_POKEMON_ID);
      return fetchPokemonDetails(validUrls);
    })
    .then((pokemonList) => {
      if (currentRequest !== state.requestId) return; // resposta antiga: ignora
      removeSkeletons();
      renderCards(pokemonList);
      state.offset += PAGE_SIZE;
      setStatus(`${cardsContainer.children.length} Pokémon exibidos`);
      loadMoreBtn.hidden = !hasMore();
    })
    .catch((error) => handleError(error, currentRequest));
}

// Reinicia a lista (usado ao trocar de filtro).
function resetAndLoad() {
  state.offset = 0;
  clearCards();
  loadNextPage();
}

function handleError(error, requestId) {
  if (requestId !== state.requestId) return;
  console.error(error);
  removeSkeletons();
  setStatus("Não foi possível carregar os dados da API. Verifique sua conexão e tente novamente.", true);
  loadMoreBtn.hidden = false;
  loadMoreBtn.textContent = "Tentar novamente";
}

/* =========================================================
   4) BUSCA, FILTRO POR TIPO E FAVORITOS
   ========================================================= */

// Busca um Pokémon pelo nome ou número.
function searchPokemon(term) {
  const query = term.trim().toLowerCase().replace(/^#/, "").replace(/^0+(?=\d)/, "");
  if (!query) {
    showAll();
    return;
  }

  state.mode = "search";
  typeSelect.value = "";
  setFavoritesMode(false);
  const currentRequest = ++state.requestId;
  clearCards();
  loadMoreBtn.hidden = true;
  showSkeletons(1);
  setStatus(`Buscando "${term}"...`);

  fetchJSON(`${API_URL}/pokemon/${encodeURIComponent(query)}`)
    .then((pokemon) => {
      if (currentRequest !== state.requestId) return;
      removeSkeletons();
      renderCards([pokemon]);
      setStatus(`Resultado para "${term}"`);
    })
    .catch(() => {
      if (currentRequest !== state.requestId) return;
      removeSkeletons();
      setStatus(`Nenhum Pokémon encontrado para "${term}".`, true);
    });
}

// Filtra por tipo usando o endpoint /type/{nome}.
function filterByType(typeName) {
  searchInput.value = "";
  setFavoritesMode(false);
  if (!typeName) {
    showAll();
    return;
  }

  const currentRequest = ++state.requestId;
  clearCards();
  showSkeletons(PAGE_SIZE / 2);
  setStatus(`Carregando Pokémon do tipo ${TYPE_NAMES[typeName]}...`);

  fetchJSON(`${API_URL}/type/${typeName}`)
    .then((data) => {
      if (currentRequest !== state.requestId) return;
      state.mode = "type";
      state.typeUrls = data.pokemon
        .map((entry) => entry.pokemon.url)
        .filter((url) => idFromUrl(url) <= MAX_POKEMON_ID);
      resetAndLoad();
    })
    .catch((error) => handleError(error, currentRequest));
}

function showAll() {
  state.mode = "all";
  typeSelect.value = "";
  searchInput.value = "";
  setFavoritesMode(false);
  loadMoreBtn.textContent = "Carregar mais";
  resetAndLoad();
}

// Preenche o <select> de tipos com dados da própria API.
function loadTypeOptions() {
  fetchJSON(`${API_URL}/type`)
    .then((data) => {
      data.results
        .filter((t) => TYPE_NAMES[t.name])
        .sort((a, b) => TYPE_NAMES[a.name].localeCompare(TYPE_NAMES[b.name]))
        .forEach((t) => {
          const option = document.createElement("option");
          option.value = t.name;
          option.textContent = TYPE_NAMES[t.name];
          typeSelect.appendChild(option);
        });
    })
    .catch((error) => console.error("Falha ao carregar tipos:", error));
}

// --- Favoritos (salvos no localStorage do navegador) ---
function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
  } catch {
    return [];
  }
}

function saveFavorites(list) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
  } catch {
    /* navegador sem localStorage: favoritos valem só nesta sessão */
  }
  favoritesCount.textContent = list.length;
}

function isFavorite(id) {
  return getFavorites().includes(id);
}

function updateFavButton(button, active, name) {
  button.textContent = active ? "♥" : "♡";
  button.setAttribute("aria-pressed", String(active));
  button.setAttribute("aria-label", `${active ? "Remover" : "Adicionar"} ${name} ${active ? "dos" : "aos"} favoritos`);
}

function toggleFavorite(id, button, name) {
  const favorites = getFavorites();
  const active = !favorites.includes(id);
  const updated = active ? [...favorites, id] : favorites.filter((fav) => fav !== id);
  saveFavorites(updated);
  updateFavButton(button, active, name);
  button.classList.toggle("card__fav--active", active);

  // Se estamos vendo só os favoritos, remove o card desmarcado da tela
  if (state.mode === "favorites" && !active) {
    button.closest(".card").remove();
    if (updated.length === 0) setStatus("Você ainda não favoritou nenhum Pokémon.");
  }
}

function setFavoritesMode(active) {
  favoritesBtn.setAttribute("aria-pressed", String(active));
}

function showFavorites() {
  const favorites = getFavorites();
  state.mode = "favorites";
  typeSelect.value = "";
  searchInput.value = "";
  setFavoritesMode(true);
  clearCards();
  loadMoreBtn.hidden = true;

  if (favorites.length === 0) {
    state.requestId++;
    setStatus("Você ainda não favoritou nenhum Pokémon. Clique no ♡ de um card!");
    return;
  }

  const currentRequest = ++state.requestId;
  showSkeletons(Math.min(favorites.length, PAGE_SIZE / 2));
  setStatus("Carregando seus favoritos...");

  fetchPokemonDetails(favorites.map((id) => `${API_URL}/pokemon/${id}`))
    .then((pokemonList) => {
      if (currentRequest !== state.requestId) return;
      removeSkeletons();
      renderCards(pokemonList);
      setStatus(`${pokemonList.length} favorito(s)`);
    })
    .catch((error) => handleError(error, currentRequest));
}

/* =========================================================
   5) EVENTOS
   ========================================================= */

searchForm.addEventListener("submit", (event) => {
  event.preventDefault(); // impede o recarregamento da página
  searchPokemon(searchInput.value);
});

typeSelect.addEventListener("change", () => filterByType(typeSelect.value));

favoritesBtn.addEventListener("click", () => {
  if (state.mode === "favorites") showAll();
  else showFavorites();
});

loadMoreBtn.addEventListener("click", () => {
  loadMoreBtn.textContent = "Carregar mais";
  if (state.mode === "all" || state.mode === "type") loadNextPage();
  else showAll();
});

// ----- Inicialização -----
favoritesCount.textContent = getFavorites().length;
loadTypeOptions();
loadNextPage();
