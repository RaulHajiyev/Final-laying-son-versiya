import { qs, getParam } from "./utils.js";
import { isRequired, isEmail, minLen } from "./validators.js";

const form = qs("#contactForm");
const jobInput = qs("#jobInput");
const nameInput = qs("#nameInput");
const emailInput = qs("#emailInput");
const messageInput = qs("#messageInput");
const formStatus = qs("#formStatus");

initPrefill();

function initPrefill() {
  const jobId = getParam("jobId");
  const title = getParam("title");
  const company = getParam("company");

  if (title && company) {
    jobInput.value = `${title} — ${company}`;
  } else if (title) {
    jobInput.value = title;
  } else if (jobId) {
    jobInput.value = `Selected job #${jobId}`;
  } else {
    jobInput.value = "";
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const nameOk = isRequired(nameInput.value);
  const emailOk = isEmail(emailInput.value);
  const msgOk = minLen(messageInput.value, 10);

  if (!nameOk || !emailOk || !msgOk) {
    show(
      "Please check the form: name is required, email must be valid, and the message must be at least 10 characters.",
      true
    );
    mark(nameInput, nameOk);
    mark(emailInput, emailOk);
    mark(messageInput, msgOk);
    return;
  }

  show(
    "Thanks! Your message has been sent successfully. We’ll get back to you soon.",
    false
  );

  form.reset();
  initPrefill(); 
  [nameInput, emailInput, messageInput].forEach(
    (i) => (i.style.borderColor = "rgba(255,255,255,.10)")
  );
});

function show(msg, danger) {
  formStatus.style.display = "block";
  formStatus.className = danger ? "alert danger" : "alert";
  formStatus.textContent = msg;
}

function mark(el, ok) {
  el.style.borderColor = ok ? "rgba(93,214,193,.6)" : "rgba(255,107,107,.7)";
}
