const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const branchData = {
  Company: { title: "Company", description: "The shared memory of Northstar Co. — one trusted layer for every team." },
  Sales: { title: "Sales", description: "The team building durable customer relationships and sustainable growth." },
  "Product & Tech": { title: "Product & Tech", description: "The people and systems turning customer needs into a better product." },
  Service: { title: "Service", description: "The team that keeps customers moving. Support, incidents, and everything in between." },
  B2B: { title: "B2B", description: "Helping ambitious teams get more value from Northstar." },
  "Customer success": { title: "Customer success", description: "Making sure every customer reaches their next milestone." },
  Engineering: { title: "Engineering", description: "Building thoughtful systems that stay useful as we grow." },
  Finance: { title: "Finance", description: "The numbers, guardrails, and decisions behind a healthy company." },
  Leadership: { title: "Leadership", description: "The small set of decisions that give every team room to do great work." },
};

function showToast(message) {
  $("#toast-message").textContent = message;
  $("#toast").classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => $("#toast").classList.remove("show"), 3200);
}

function setView(viewName) {
  const view = viewName === "tree" ? "branch" : viewName;
  $$(".view").forEach((item) => item.classList.toggle("active", item.id === `${view}-view`));
  $$(".nav-item[data-view]").forEach((item) => item.classList.toggle("active", item.dataset.view === viewName || (viewName === "tree" && item.dataset.view === "tree")));
  $("#breadcrumb-current").textContent = viewName === "tree" ? "Knowledge tree" : viewName.charAt(0).toUpperCase() + viewName.slice(1);
  $("#sidebar").classList.remove("open");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openBranch(branchName) {
  const data = branchData[branchName] || branchData.Service;
  $("#branch-title").textContent = data.title;
  $("#branch-description").textContent = data.description;
  $("#breadcrumb-current").textContent = data.title;
  setView("tree");
  $$(".mini-tree-row").forEach((row) => row.classList.toggle("selected", row.dataset.branch === branchName));
}

function openModal(id) { $(id).classList.add("open"); }
function closeModal(id) { $(id).classList.remove("open"); }

// Navigation works for both sidebar items and lightweight text links.
document.addEventListener("click", (event) => {
  const viewTrigger = event.target.closest("[data-view]");
  if (viewTrigger) {
    event.preventDefault();
    setView(viewTrigger.dataset.view);
    return;
  }
  const branchTrigger = event.target.closest("[data-branch]");
  if (branchTrigger) {
    event.preventDefault();
    openBranch(branchTrigger.dataset.branch);
  }
});

// Branch detail tabs.
$$('.tab[data-tab]').forEach((tab) => {
  tab.addEventListener("click", () => {
    const parent = tab.closest(".branch-main");
    $$(".tab[data-tab]", parent).forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");
    $$(".branch-tab-content", parent).forEach((content) => content.classList.toggle("hidden", content.id !== tab.dataset.tab));
  });
});

// Expand/collapse affordances in the mini tree.
$$('.mini-tree .tree-toggle').forEach((toggle) => {
  toggle.addEventListener("click", (event) => {
    event.stopPropagation();
    const row = toggle.closest(".mini-tree-row");
    const group = row.nextElementSibling;
    if (!group || !group.classList.contains("mini-tree-grandchildren") && !group.classList.contains("mini-tree-children")) return;
    const hidden = group.style.display === "none";
    group.style.display = hidden ? "" : "none";
    toggle.textContent = hidden ? "⌄" : "›";
  });
});

// Search modal and keyboard shortcut.
$("#search-trigger").addEventListener("click", () => { openModal("#search-modal"); setTimeout(() => $("#global-search").focus(), 30); });
document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); openModal("#search-modal"); setTimeout(() => $("#global-search").focus(), 30); }
  if (event.key === "Escape") $$(".modal-backdrop.open").forEach((modal) => modal.classList.remove("open"));
  if (event.key === "Enter" && event.target === $("#prompt-input") && !event.shiftKey) { event.preventDefault(); submitPrompt(); }
});
$("#global-search").addEventListener("input", (event) => {
  const term = event.target.value.toLowerCase().trim();
  $$(".search-results button").forEach((result) => { result.style.display = !term || result.textContent.toLowerCase().includes(term) ? "flex" : "none"; });
});

// Ask flow: intentionally makes the permission-aware context visible in the response.
function submitPrompt(prompt) {
  const input = $("#prompt-input");
  const value = (prompt || input.value).trim();
  if (!value) { input.focus(); return; }
  const panel = $("#prompt-box");
  panel.classList.add("is-loading");
  input.disabled = true;
  input.value = value;
  setTimeout(() => {
    panel.classList.remove("is-loading");
    input.disabled = false;
    input.value = "";
    showToast("Answer ready · based on your authorized context");
    const answer = document.createElement("div");
    answer.className = "answer-preview";
    answer.innerHTML = `<strong>Company Brain found a verified answer.</strong><span>Sources: Service handbook · Decision #42 · Customer success policy</span>`;
    panel.parentElement.insertBefore(answer, panel.nextSibling);
    setTimeout(() => answer.remove(), 6500);
  }, 850);
}
function submitFromSuggestion(button) { submitPrompt(button.textContent.replace("→", "").trim()); }
$("#send-prompt").addEventListener("click", () => submitPrompt());
$$('.suggestion').forEach((button) => button.addEventListener("click", () => submitFromSuggestion(button)));
$("#ask-hero").addEventListener("click", () => { $("#prompt-input").focus(); $("#prompt-box").scrollIntoView({ behavior: "smooth", block: "center" }); });

// Knowledge creation modal.
$("#new-knowledge").addEventListener("click", () => openModal("#knowledge-modal"));
$("#new-knowledge-top").addEventListener("click", () => openModal("#knowledge-modal"));
$$('.close-modal').forEach((button) => button.addEventListener("click", () => button.closest(".modal-backdrop").classList.remove("open")));
$("#save-knowledge").addEventListener("click", () => {
  const title = $("#new-title").value.trim() || "New knowledge contribution";
  closeModal("#knowledge-modal");
  showToast(`“${title}” saved for review`);
  $("#new-title").value = "";
});
$$('.modal-backdrop').forEach((backdrop) => backdrop.addEventListener("click", (event) => { if (event.target === backdrop) backdrop.classList.remove("open"); }));

// Demo review actions update the queue count and preserve a clear state change.
$$('.approve-action').forEach((button) => button.addEventListener("click", () => {
  const item = button.closest(".review-item");
  item.classList.add("approved");
  button.textContent = "Approved ✓";
  button.disabled = true;
  const count = $(".review-tabs .tab span");
  if (count) count.textContent = Math.max(0, Number(count.textContent) - 1);
  showToast("Knowledge promoted to shared team context");
}));
$$('.reject-action').forEach((button) => button.addEventListener("click", () => {
  const item = button.closest(".review-item");
  item.classList.add("rejected");
  button.textContent = "Rejected";
  button.disabled = true;
  showToast("Contribution rejected and kept private");
}));

$("#context-details").addEventListener("click", () => showToast("Access: Company · Product & Tech · Service"));
$("#menu-toggle").addEventListener("click", () => $("#sidebar").classList.add("open"));
$("#sidebar-close").addEventListener("click", () => $("#sidebar").classList.remove("open"));
$("#add-branch").addEventListener("click", () => showToast("Branch creation is available to Company Admins"));

// Small search affordance in the knowledge inventory.
$("#knowledge-filter").addEventListener("input", (event) => {
  const term = event.target.value.toLowerCase();
  $$(".full-table .table-row").forEach((row) => { row.style.display = row.textContent.toLowerCase().includes(term) ? "grid" : "none"; });
});

