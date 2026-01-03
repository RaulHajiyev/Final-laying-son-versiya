import { fetchJobs } from "./api.js";
import { qs, debounce } from "./utils.js";

const jobsGrid = qs("#jobsGrid");
const statusBox = qs("#statusBox");
const resultCount = qs("#resultCount");

const searchInput = qs("#searchInput");
const categorySelect = qs("#categorySelect");
const locationSelect = qs("#locationSelect");
const workTypeSelect = qs("#workTypeSelect");
const salaryMinSelect = qs("#salaryMinSelect");
const salaryMaxSelect = qs("#salaryMaxSelect");
const sortSelect = qs("#sortSelect");
const clearBtn = qs("#clearBtn");

const prevBtn = qs("#prevBtn");
const nextBtn = qs("#nextBtn");
const pageNo = qs("#pageNo");
const pageTotal = qs("#pageTotal");

let page = 1;
const pageSize = 9;

let allJobs = [];

init();

const onChange = debounce(() => {
  page = 1;
  updateUrlFromControls();
  render(applyAll(allJobs));
}, 250);

searchInput.addEventListener("input", onChange);
categorySelect.addEventListener("change", onChange);
locationSelect.addEventListener("change", onChange);
workTypeSelect.addEventListener("change", onChange);
salaryMinSelect.addEventListener("change", onChange);
salaryMaxSelect.addEventListener("change", onChange);
sortSelect.addEventListener("change", onChange);

clearBtn.addEventListener("click", () => {
  resetControls();
  page = 1;
  updateUrlFromControls();
  render(applyAll(allJobs));
});

prevBtn.addEventListener("click", () => {
  page = Math.max(1, page - 1);
  render(applyAll(allJobs));
});

nextBtn.addEventListener("click", () => {
  const total = Math.max(1, Math.ceil(applyAll(allJobs).length / pageSize));
  page = Math.min(total, page + 1);
  render(applyAll(allJobs));
});

async function init() {
  setControlsFromUrl();

  renderSkeleton(6);
  showStatus("Loading jobs...");

  try {
    allJobs = await fetchJobs();

    hydrateSelects(allJobs);

    hideStatus();
    render(applyAll(allJobs));
  } catch (e) {
    showStatus(`Error: ${e.message}`, true);
  }
}

function applyAll(list) {
  let out = [...list];

  const q = searchInput.value.trim().toLowerCase();
  if (q) {
    out = out.filter(
      (j) =>
        j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q)
    );
  }

  const cat = categorySelect.value;
  if (cat !== "all") out = out.filter((j) => j.category === cat);

  const loc = locationSelect.value;
  if (loc !== "all")
    out = out.filter((j) => String(j.location) === String(loc));

  const wt = workTypeSelect.value;
  if (wt !== "all") out = out.filter((j) => j.type === wt);

  let min = toNum(salaryMinSelect.value);
  let max = toNum(salaryMaxSelect.value);

  if (min !== null && max !== null && min > max) {
    const t = min;
    min = max;
    max = t;
    salaryMinSelect.value = String(min);
    salaryMaxSelect.value = String(max);
  }

  if (min !== null) out = out.filter((j) => Number(j.salary) >= min);
  if (max !== null) out = out.filter((j) => Number(j.salary) <= max);

  const sort = sortSelect.value;
  if (sort === "az") out.sort((a, b) => a.title.localeCompare(b.title));
  if (sort === "newest") out.sort((a, b) => Number(b.id) - Number(a.id));
  if (sort === "salaryHigh")
    out.sort((a, b) => Number(b.salary) - Number(a.salary));
  if (sort === "salaryLow")
    out.sort((a, b) => Number(a.salary) - Number(b.salary));

  return out;
}

function render(list) {
  resultCount.textContent = String(list.length);

  const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
  page = Math.min(page, totalPages);

  pageNo.textContent = String(page);
  pageTotal.textContent = String(totalPages);

  prevBtn.disabled = page <= 1;
  nextBtn.disabled = page >= totalPages;
  prevBtn.style.opacity = prevBtn.disabled ? "0.5" : "1";
  nextBtn.style.opacity = nextBtn.disabled ? "0.5" : "1";

  const start = (page - 1) * pageSize;
  const pageItems = list.slice(start, start + pageSize);

  if (!pageItems.length) {
    jobsGrid.innerHTML = `<div class="alert">No results found. Try changing filters.</div>`;
    return;
  }

  jobsGrid.innerHTML = pageItems.map(jobCard).join("");
}

function jobCard(j) {
  const applyUrl = new URL("contact.html", window.location.href);
  applyUrl.searchParams.set("jobId", String(j.id));
  applyUrl.searchParams.set("title", j.title);
  applyUrl.searchParams.set("company", j.company);

  return `
    <article class="card job">
      <div class="job-top">
        <div>
          <h3>${escapeHtml(j.title)}</h3>
          <div class="meta">
            <span class="tag">${escapeHtml(j.company)}</span>
            <span class="tag">${escapeHtml(j.location)}</span>
            <span class="tag">${escapeHtml(j.type)}</span>
            <span class="tag">${escapeHtml(j.category)}</span>
            <span class="tag">$${Number(j.salary)}/mo</span>
          </div>
        </div>
      </div>

      <div class="note">${escapeHtml(j.desc)}</div>

      <div class="actions">
        <a class="btn secondary" href="job-detail.html?id=${
          j.id
        }">View details</a>
        <a class="btn" href="${applyUrl.toString()}">Apply now</a>
      </div>
    </article>
  `;
}

function hydrateSelects(jobs) {
  fillSelect(
    categorySelect,
    unique(jobs.map((j) => j.category)),
    "All categories"
  );
  fillSelect(
    locationSelect,
    unique(jobs.map((j) => String(j.location))),
    "All locations"
  );
  fillSelect(workTypeSelect, unique(jobs.map((j) => j.type)), "All types");

  const salaries = unique(jobs.map((j) => Number(j.salary))).sort(
    (a, b) => a - b
  );
  const presets = unique(
    [
      salaries[0],
      salaries[Math.floor(salaries.length * 0.25)],
      salaries[Math.floor(salaries.length * 0.5)],
      salaries[Math.floor(salaries.length * 0.75)],
      salaries[salaries.length - 1],
    ].filter(Number.isFinite)
  );

  fillSelect(salaryMinSelect, presets.map(String), "Min salary", true);
  fillSelect(salaryMaxSelect, presets.map(String), "Max salary", true);
}

function fillSelect(select, values, allLabel, allowEmpty = false) {
  const current = select.value;
  const firstOpt = allowEmpty
    ? `<option value="">${escapeHtml(allLabel)}</option>`
    : `<option value="all">${escapeHtml(allLabel)}</option>`;

  const opts = values
    .map((v) => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`)
    .join("");
  select.innerHTML = firstOpt + opts;

  if (current) select.value = current;
}

function unique(arr) {
  return [...new Set(arr)].filter((v) => String(v).trim().length > 0);
}

function renderSkeleton(count = 6) {
  jobsGrid.innerHTML = Array.from({ length: count })
    .map(
      () => `
    <article class="card job" style="opacity:.6">
      <div class="job-top">
        <div style="width:70%">
          <div class="tag" style="width:60%; height:14px;"></div>
          <div class="tag" style="width:40%; height:14px; margin-top:8px;"></div>
        </div>
        <div class="tag" style="width:80px; height:14px;"></div>
      </div>
      <div class="tag" style="width:100%; height:14px;"></div>
      <div class="tag" style="width:80%; height:14px;"></div>
    </article>
  `
    )
    .join("");
}

function showStatus(msg, danger = false) {
  statusBox.style.display = "block";
  statusBox.className = danger ? "alert danger" : "alert";
  statusBox.textContent = msg;
}

function hideStatus() {
  statusBox.style.display = "none";
}

function setControlsFromUrl() {
  const url = new URL(window.location.href);

  const q = url.searchParams.get("q");
  const cat = url.searchParams.get("cat");
  const loc = url.searchParams.get("loc");
  const wt = url.searchParams.get("type");
  const min = url.searchParams.get("min");
  const max = url.searchParams.get("max");
  const sort = url.searchParams.get("sort");

  if (q !== null) searchInput.value = q;
  if (cat) categorySelect.value = cat;
  if (loc) locationSelect.value = loc;
  if (wt) workTypeSelect.value = wt;
  if (min) salaryMinSelect.value = min;
  if (max) salaryMaxSelect.value = max;
  if (sort) sortSelect.value = sort;
}

function updateUrlFromControls() {
  const url = new URL(window.location.href);

  const q = searchInput.value.trim();
  setOrDelete(url, "q", q);

  setOrDelete(
    url,
    "cat",
    categorySelect.value !== "all" ? categorySelect.value : ""
  );
  setOrDelete(
    url,
    "loc",
    locationSelect.value !== "all" ? locationSelect.value : ""
  );
  setOrDelete(
    url,
    "type",
    workTypeSelect.value !== "all" ? workTypeSelect.value : ""
  );
  setOrDelete(url, "min", salaryMinSelect.value);
  setOrDelete(url, "max", salaryMaxSelect.value);
  setOrDelete(
    url,
    "sort",
    sortSelect.value !== "newest" ? sortSelect.value : ""
  );

  window.history.replaceState({}, "", url.toString());
}

function setOrDelete(url, key, value) {
  if (value && String(value).length > 0) url.searchParams.set(key, value);
  else url.searchParams.delete(key);
}

function resetControls() {
  searchInput.value = "";
  categorySelect.value = "all";
  locationSelect.value = "all";
  workTypeSelect.value = "all";
  salaryMinSelect.value = "";
  salaryMaxSelect.value = "";
  sortSelect.value = "newest";
}

function toNum(v) {
  if (v === null || v === undefined || String(v).trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
