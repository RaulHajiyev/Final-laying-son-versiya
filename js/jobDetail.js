import { fetchJobById } from "./api.js";
import { qs, getParam } from "./utils.js";

const detailBox = qs("#detailBox");
const detailStatus = qs("#detailStatus");

init();

async function init() {
  const id = getParam("id");
  if (!id) return show("Missing id in URL (?id=...)", true);

  show("Loading...", false);

  try {
    const job = await fetchJobById(id);
    if (!job) return show("Job not found.", true);

    detailStatus.style.display = "none";
    detailBox.innerHTML = render(job);

    const applyBtn = qs("#applyBtn");
    applyBtn.addEventListener("click", () => {
      const url = new URL("contact.html", window.location.href);
      url.searchParams.set("jobId", String(job.id));
      url.searchParams.set("title", job.title);
      url.searchParams.set("company", job.company);
      window.location.href = url.toString();
    });
  } catch (e) {
    show(`Error: ${e.message}`, true);
  }
}

function render(j) {
  return `
    <h2 style="margin:0 0 10px;">${esc(j.title)}</h2>

    <div class="meta" style="margin-bottom:10px;">
      <span class="tag">${esc(j.company)}</span>
      <span class="tag">${esc(j.location)}</span>
      <span class="tag">${esc(j.type)}</span>
      <span class="tag">${esc(j.category)}</span>
      <span class="tag">$${Number(j.salary)}/mo</span>
    </div>

    <p class="note">${esc(j.desc)}</p>

    <hr class="sep" />

    <div class="actions">
      <button id="applyBtn" class="btn" type="button">Apply now</button>
    </div>
  `;
}

function show(msg, danger) {
  detailStatus.style.display = "block";
  detailStatus.className = danger ? "alert danger" : "alert";
  detailStatus.textContent = msg;
}

function esc(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
