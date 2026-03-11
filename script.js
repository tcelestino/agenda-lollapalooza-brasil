const STAGE_COLORS = {
  "Palco Budweiser": "var(--accent-bud)",
  "Palco Samsung Galaxy": "var(--accent-sam)",
  "Palco Flying Fish": "var(--accent-fly)",
  "Palco Perry's": "var(--accent-per)",
};

const STORAGE_KEY = "lolla2026_favorites";
const STAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;

let scheduleData = null;
let activeDay = 0;
let favorites = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));

function saveFavorites() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...favorites]));
}

function toggleFavorite(actId) {
  if (favorites.has(actId)) {
    favorites.delete(actId);
  } else {
    favorites.add(actId);
  }
  saveFavorites();
  document.querySelectorAll(`.fav-btn[data-id="${actId}"]`).forEach((btn) => {
    btn.classList.toggle("active", favorites.has(actId));
  });
  renderFavorites();
}

function renderFavorites() {
  const container = document.getElementById("favoritesContainer");

  if (favorites.size === 0) {
    container.innerHTML =
      '<p class="favorites-empty">Favorite os shows que deseja acompanhar de perto.</p>';
    return;
  }

  const grouped = new Map();
  scheduleData.days.forEach((day) => {
    day.stages.forEach((stage) => {
      stage.acts.forEach((act) => {
        if (!favorites.has(act.id)) return;
        if (!grouped.has(stage.name))
          grouped.set(stage.name, { stage, acts: [] });
        grouped.get(stage.name).acts.push(act);
      });
    });
  });

  container.innerHTML = [...grouped.values()]
    .map(({ stage, acts }) => {
      const stageColor = STAGE_COLORS[stage.name] || "#888";
      return `
      <div class="fav-group">
        <section class="stage-header">
          <span class="stage-dot" style="background:${stageColor}"></span>
          <span class="stage-name">${stage.name}</span>
          <span class="stage-count">${acts.length} ${acts.length === 1 ? "show" : "shows"}</span>
        </section>
        <ul class="acts-list">
          ${acts
            .map((act) => {
              const isHL = act.headline;
              return `
              <li class="act-row${isHL ? " headline" : ""}">
                <span class="act-time">${act.start} – ${act.end}</span>
                <span class="act-artist">${act.artist}</span>
                ${isHL ? `<span class="headline-tag" style="--stage-color:${stageColor}">Headliner</span>` : "<span></span>"}
                <button class="fav-btn active" data-id="${act.id}" aria-label="Remover dos favoritos">${STAR_SVG}</button>
              </li>`;
            })
            .join("")}
        </ul>
      </div>`;
    })
    .join("");

  container.querySelectorAll(".fav-btn").forEach((btn) => {
    btn.addEventListener("click", () => toggleFavorite(Number(btn.dataset.id)));
  });
}

function init() {
  let actId = 0;
  scheduleData.days.forEach((day) => {
    day.stages.forEach((stage) => {
      stage.acts.forEach((act) => {
        act.id = actId++;
      });
    });
  });

  buildTabs();
  renderDay(0);
  setupSearch();
  renderFavorites();
}

async function loadData() {
  try {
    const res = await fetch("./data.json");
    scheduleData = await res.json();
    init();
  } catch (e) {
    document.querySelector(".error-data").style.display = "block";
    document.querySelector(".loader").style.display = "none";

    console.error(e);
  }
}

function buildTabs() {
  const tabsEl = document.getElementById("dayTabs");
  tabsEl.innerHTML = "";
  scheduleData.days.forEach((day, i) => {
    const li = document.createElement("li");
    li.className = "day-tab" + (i === 0 ? " active" : "");
    li.innerHTML = `${day.label}<small>${formatDate(day.date)}</small>`;
    li.addEventListener("click", () => switchDay(i));
    tabsEl.appendChild(li);
  });
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}`;
}

function switchDay(index) {
  activeDay = index;
  document
    .querySelectorAll(".day-tab")
    .forEach((t, i) => t.classList.toggle("active", i === index));

  // Clear search
  document.getElementById("searchInput").value = "";
  document.getElementById("searchInfo").style.display = "none";
  document.getElementById("noResults").style.display = "none";

  renderDay(index);
}

function renderDay(index) {
  const container = document.getElementById("scheduleContainer");
  const day = scheduleData.days[index];

  container.innerHTML = "";

  day.stages.forEach((stage) => {
    container.appendChild(createStageCard(stage));
  });
}

function createStageCard(stage, filterText) {
  const card = document.createElement("div");
  card.className = "stage-card";
  const stageColor = STAGE_COLORS[stage.name] || "#888";
  card.style.setProperty("--stage-color", stageColor);

  let acts = stage.acts;
  if (filterText) {
    acts = acts.filter((a) => a.artist.toLowerCase().includes(filterText));
  }
  if (acts.length === 0) return null;

  card.innerHTML = `
    <section class="stage-header">
      <span class="stage-dot" style="background:${stageColor}"></span>
      <span class="stage-name">${stage.name}</span>
      <span class="stage-count">${acts.length} ${acts.length === 1 ? "show" : "shows"}</span>
    </section>
    <ul class="acts-list">
      ${acts
        .map((act) => {
          const isHL = act.headline;
          return `
          <li class="act-row${isHL ? " headline" : ""}">
            <span class="act-time">${act.start} – ${act.end}</span>
            <span class="act-artist">${act.artist}</span>
            ${isHL ? `<span class="headline-tag" style="--stage-color:${stageColor}">Headliner</span>` : "<span></span>"}
            <button class="fav-btn${favorites.has(act.id) ? " active" : ""}" data-id="${act.id}" aria-label="Favoritar">${STAR_SVG}</button>
          </li>`;
        })
        .join("")}
    </ul>`;

  card.querySelectorAll(".fav-btn").forEach((btn) => {
    btn.addEventListener("click", () => toggleFavorite(Number(btn.dataset.id)));
  });

  return card;
}

function setupSearch() {
  const input = document.getElementById("searchInput");
  let debounce;
  input.addEventListener("input", () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => handleSearch(input.value), 200);
  });
}

function handleSearch(query) {
  const container = document.getElementById("scheduleContainer");
  const info = document.getElementById("searchInfo");
  const noResults = document.getElementById("noResults");
  const q = query.trim().toLowerCase();

  if (!q) {
    info.style.display = "none";
    noResults.style.display = "none";
    // deselect tabs highlight reset
    document
      .querySelectorAll(".day-tab")
      .forEach((t, i) => t.classList.toggle("active", i === activeDay));
    renderDay(activeDay);
    return;
  }

  // Search across all days
  document
    .querySelectorAll(".day-tab")
    .forEach((t) => t.classList.remove("active"));
  container.innerHTML = "";
  let totalFound = 0;

  scheduleData.days.forEach((day) => {
    let dayHasResults = false;
    const dayCards = [];

    day.stages.forEach((stage) => {
      const card = createStageCard(stage, q);
      if (card) {
        dayCards.push(card);
        const matchedActs = stage.acts.filter((a) =>
          a.artist.toLowerCase().includes(q),
        );
        totalFound += matchedActs.length;
        dayHasResults = true;
      }
    });

    if (dayHasResults) {
      const dayHeader = document.createElement("div");
      dayHeader.style.cssText = `
        font-family:'Unbounded',sans-serif;
        font-weight:600;
        font-size:0.8rem;
        color:var(--text-dim);
        padding:16px 0 8px;
        letter-spacing:0.06em;
        text-transform:uppercase;
      `;
      dayHeader.textContent = `${day.label} — ${formatDate(day.date)}`;
      container.appendChild(dayHeader);
      dayCards.forEach((c) => container.appendChild(c));
    }
  });

  info.style.display = "block";
  info.textContent =
    totalFound > 0
      ? `${totalFound} resultado${totalFound > 1 ? "s" : ""} para "${query.trim()}"`
      : "";
  noResults.style.display = totalFound === 0 ? "block" : "none";
}

loadData();
