const STAGE_COLORS = {
  "Palco Budweiser": "var(--accent-bud)",
  "Palco Samsung Galaxy": "var(--accent-sam)",
  "Palco Flying Fish": "var(--accent-fly)",
  "Palco Perry's": "var(--accent-per)",
};

let scheduleData = null;
let activeDay = 0;

function init() {
  buildTabs();
  renderDay(0);
  setupSearch();
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

  const shortName = stage.name.replace("Palco ", "");

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
            ${isHL ? `<span class="headline-tag" style="--stage-color:${stageColor}">Headliner</span>` : ""}
          </li>`;
        })
        .join("")}
    </ul>`;

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
