/* 共通ストレージユーティリティ（localStorage ベース） */
const STORAGE_PREFIX = "cck_";

function loadItems(key, defaults) {
  const raw = localStorage.getItem(STORAGE_PREFIX + key);
  if (raw === null) {
    saveItems(key, defaults);
    return defaults.slice();
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : defaults.slice();
  } catch (e) {
    return defaults.slice();
  }
}

function saveItems(key, items) {
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(items));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[ch]);
}

function nowForInput() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function todayForInput() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
