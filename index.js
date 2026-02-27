const crimes = {};
const mods = new Set();

const SHEETS_CSV_URL = "https://docs.google.com/spreadsheets/d/1Omhul0BUKgg6_h-41L1NDfZO21ktxSfVvs_5c3GZ8bw/export?format=csv";

function toggleCh(id) {
  document.getElementById(id).classList.toggle("collapsed");
}

function tc(el) {
  const id = el.dataset.id;
  if (crimes[id]) {
    delete crimes[id];
    el.classList.remove("selected");
    el.querySelector(".crime-box").textContent = "";
  } else {
    crimes[id] = { months: +el.dataset.months, label: el.dataset.label };
    el.classList.add("selected");
    el.querySelector(".crime-box").textContent = "✓";
  }
  upd();
}

function tm(el) {
  const type = el.dataset.type;
  if (mods.has(el)) {
    mods.delete(el);
    el.classList.remove("on-green", "on-red", "on-gold");
  } else {
    mods.add(el);
    if (type === "mit") el.classList.add("on-green");
    else if (type === "agr") el.classList.add("on-red");
    else el.classList.add("on-gold");
  }
  upd();
}

function upd() {
  const arr = Object.values(crimes);
  const list = document.getElementById("selected-list");
  list.innerHTML =
    arr.length === 0
      ? '<span class="no-crimes-msg">Nenhum crime selecionado.</span>'
      : arr.map((c) => `<div class="sel-crime">${c.label}</div>`).join("");

  const base = arr.reduce((s, c) => s + c.months, 0);
  let pct = 0;
  mods.forEach((m) => {
    if (m.dataset.value) pct += parseInt(m.dataset.value);
  });
  const final = Math.max(0, Math.round(base * (1 + pct / 100)));
  document.getElementById("sentence-total").textContent = final;
  document.getElementById("sentence-breakdown").textContent =
    base > 0 && pct !== 0
      ? `Base: ${base}m  ${pct > 0 ? "+" : ""}${pct}%  →  ${final} meses`
      : "";
}

function f(v) {
  return !v || !v.trim() ? "Não informado" : v.trim();
}

function copyReport() {
  const official = f(document.getElementById("f-official").value);
  const prisoner = f(document.getElementById("f-prisoner").value);
  const rg = f(document.getElementById("f-rg").value);
  const items = f(document.getElementById("items-field").value);
  const money = document.getElementById("money-field").value.trim() || "0,00";
  const arr = Object.values(crimes);
  const sentence = document.getElementById("sentence-total").textContent;

  const obs = [...mods]
    .filter((m) => m.dataset.type === "obs")
    .map((m) => m.dataset.label);
  const aten = [...mods]
    .filter((m) => m.dataset.type === "mit")
    .map((m) => m.dataset.label);
  const agrav = [...mods]
    .filter((m) => m.dataset.type === "agr")
    .map((m) => m.dataset.label);

  let r = "";
  r += `📋 **RELATÓRIO DE PRISÃO - COLORADO**\n`;
  r += `🪖 **MILITAR QUE PRENDEU:**\n`;
  r += `Nome: ${official}\n\n`;
  r += `👤 **DADOS DO PRESO**\n`;
  r += `Nome: ${prisoner}\n`;
  r += `RG: ${rg}\n\n`;
  r += `⚖️ **CRIMES COMETIDOS**\n`;
  r +=
    arr.length === 0
      ? `Nenhum crime registrado\n`
      : arr.map((c) => `• ${c.label}`).join("\n") + "\n";
  r += `\n📦 **ITENS APREENDIDOS**\n${items}\n`;
  if (obs.length > 0) {
    r += `\n📌 **OBSERVAÇÕES**\n`;
    obs.forEach((o) => (r += `${o}\n`));
  }
  if (aten.length > 0) {
    r += `\n✅ **ATENUANTES**\n`;
    aten.forEach((a) => (r += `• ${a}\n`));
  }
  if (agrav.length > 0) {
    r += `\n❌ **AGRAVANTES**\n`;
    agrav.forEach((a) => (r += `• ${a}\n`));
  }
  r += `\n═══════════════════\n`;
  r += `⏱️ **PENA TOTAL:** ${sentence} meses\n`;
  r += `💵 **DINHEIRO SUJO:** R$ ${money}\n`;
  r += `═══════════════════`;

  navigator.clipboard.writeText(r).then(() => {
    const t = document.getElementById("toast");
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2500);
  });
}

function clearAll() {
  document.querySelectorAll(".crime-item.selected").forEach((el) => {
    el.classList.remove("selected");
    el.querySelector(".crime-box").textContent = "";
  });
  document
    .querySelectorAll(".mod-item")
    .forEach((el) => el.classList.remove("on-green", "on-red", "on-gold"));
  mods.clear();
  for (const k in crimes) delete crimes[k];
  [
    "f-official",
    "f-prisoner",
    "f-rg",
    "f-lawyer",
    "items-field",
    "money-field",
  ].forEach((id) => (document.getElementById(id).value = ""));
  upd();
}

function normalizeHeader(text) {
  return (text || "")
    .toString()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function parseCSV(content) {
  const rows = [];
  let row = [];
  let value = "";
  let insideQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const nextChar = content[index + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        value += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (!insideQuotes && char === ",") {
      row.push(value);
      value = "";
      continue;
    }

    if (!insideQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && nextChar === "\n") index += 1;
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
      continue;
    }

    value += char;
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value);
    rows.push(row);
  }

  return rows;
}

function getByAliases(record, aliases) {
  for (const alias of aliases) {
    if (
      record[alias] !== undefined &&
      record[alias] !== null &&
      `${record[alias]}`.trim() !== ""
    ) {
      return `${record[alias]}`.trim();
    }
  }
  return "";
}

function toCrimeRows(csvText) {
  const table = parseCSV(csvText).filter((row) =>
    row.some((cell) => `${cell || ""}`.trim() !== ""),
  );
  if (table.length < 2) return [];

  const headers = table[0].map((header) => normalizeHeader(header));

  return table.slice(1).map((row, index) => {
    const record = {};
    headers.forEach((header, headerIndex) => {
      record[header] = row[headerIndex] || "";
    });

    const chapterTitle = getByAliases(record, [
      "capitulo",
      "chapter",
      "chapternome",
      "titulocapitulo",
      "chaptertitle",
    ]);
    const chapterNum = getByAliases(record, [
      "numerocapitulo",
      "capitulonumero",
      "capnum",
      "chapternumber",
      "chapterid",
    ]);
    const article = getByAliases(record, [
      "artigo",
      "article",
      "art",
      "codartigo",
      "codigoartigo",
    ]);
    const crimeName = getByAliases(record, [
      "crime",
      "nomecrime",
      "descricao",
      "descricaocrime",
      "nome",
    ]);
    const id =
      getByAliases(record, ["id", "crimeid", "codigo", "code"]) ||
      `crime-${index + 1}`;

    const monthsRaw = getByAliases(record, [
      "meses",
      "months",
      "pena",
      "penameses",
      "penameses",
      "sentenca",
    ]);
    const months = Number((monthsRaw || "").replace(",", "."));

    const labelFromSheet = getByAliases(record, ["label", "rotulo", "titulo"]);
    const builtLabel =
      `${article ? `ART.${article} - ` : ""}${crimeName}`.trim();
    const label = labelFromSheet || builtLabel || `Crime ${index + 1}`;

    return {
      id,
      chapterTitle: chapterTitle || "Sem capítulo",
      chapterNum: chapterNum || "-",
      article,
      crimeName: crimeName || label,
      months: Number.isFinite(months) ? months : 0,
      label,
      sortIndex: index,
    };
  });
}

function createCrimeItemElement(crime) {
  const item = document.createElement("div");
  item.className = "crime-item";
  item.dataset.months = `${crime.months}`;
  item.dataset.id = crime.id;
  item.dataset.label = crime.label;
  item.setAttribute("onclick", "tc(this)");

  const box = document.createElement("div");
  box.className = "crime-box";

  const text = document.createElement("div");
  text.className = "crime-text";

  const article = document.createElement("div");
  article.className = "crime-art";
  article.textContent = crime.article
    ? `Art. ${crime.article}`
    : "Artigo não informado";

  text.appendChild(article);
  text.append(crime.crimeName);
  item.appendChild(box);
  item.appendChild(text);

  return item;
}

function renderCrimes(crimeRows) {
  const root = document.getElementById("crimes-dynamic-root");
  if (!root) return;

  root.innerHTML = "";

  if (!crimeRows.length) {
    root.innerHTML =
      '<div class="loading-crimes-msg">Nenhum crime encontrado na tabela.</div>';
    return;
  }

  const chapters = new Map();

  crimeRows.forEach((crime) => {
    const key = `${crime.chapterNum}::${crime.chapterTitle}`;
    if (!chapters.has(key)) {
      chapters.set(key, {
        num: crime.chapterNum,
        title: crime.chapterTitle,
        crimes: [],
      });
    }
    chapters.get(key).crimes.push(crime);
  });

  let chapterIndex = 1;
  chapters.forEach((chapter) => {
    const chapterEl = document.createElement("div");
    chapterEl.className = "chapter";
    chapterEl.id = `ch-sheet-${chapterIndex}`;

    const header = document.createElement("div");
    header.className = "chapter-header";
    header.setAttribute("onclick", `toggleCh('${chapterEl.id}')`);
    header.innerHTML = `<span class="ch-num">${chapter.num}</span> ${chapter.title} <span class="ch-arrow">▾</span>`;

    const body = document.createElement("div");
    body.className = "chapter-body";

    chapter.crimes.forEach((crime) => {
      body.appendChild(createCrimeItemElement(crime));
    });

    chapterEl.appendChild(header);
    chapterEl.appendChild(body);
    root.appendChild(chapterEl);
    chapterIndex += 1;
  });
}

function resetCrimeSelections() {
  document.querySelectorAll(".crime-item.selected").forEach((el) => {
    el.classList.remove("selected");
    const box = el.querySelector(".crime-box");
    if (box) box.textContent = "";
  });
  for (const key in crimes) delete crimes[key];
  upd();
}

async function loadCrimesFromSheet() {
  const root = document.getElementById("crimes-dynamic-root");
  if (!root) return;

  if (!SHEETS_CSV_URL.trim()) {
    root.innerHTML =
      '<div class="loading-crimes-msg">Defina a variável <strong>SHEETS_CSV_URL</strong> no arquivo JS para carregar os crimes da planilha.</div>';
    resetCrimeSelections();
    return;
  }

  try {
    root.innerHTML =
      '<div class="loading-crimes-msg">Carregando crimes da tabela...</div>';
    const response = await fetch(SHEETS_CSV_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const csvText = await response.text();
    const crimeRows = toCrimeRows(csvText);
    renderCrimes(crimeRows);
    resetCrimeSelections();
  } catch (error) {
    root.innerHTML =
      '<div class="loading-crimes-msg">Não foi possível carregar a tabela. Verifique se o Google Sheets está publicado em CSV e se o link está correto.</div>';
  }
}

loadCrimesFromSheet();
