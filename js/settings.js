/**
 * SmartStock - Settings Module
 * Handles application theme selection, alert toggles, default catalog settings,
 * full workspace JSON data backup, and verified data reset.
 */

"use strict";

let appSettings = {};

// ─── Initialisation ───────────────────────────────────────────────────────────
function initSettings() {
  if (typeof requireAuth === "function") requireAuth();
  if (typeof initDemoData === "function") initDemoData();
  if (typeof renderSidebar === "function") renderSidebar("settings");
  if (typeof renderNavbar === "function") renderNavbar();

  loadSettings();
}

function loadSettings() {
  appSettings = JSON.parse(localStorage.getItem("smartstock_settings") || "{}");

  // Appearance Theme
  const currentTheme =
    appSettings.theme ||
    document.documentElement.getAttribute("data-theme") ||
    "light";
  updateThemeSelectionUI(currentTheme);

  // Notifications
  const lowAlert = document.getElementById("set_lowStockAlerts");
  if (lowAlert) lowAlert.checked = appSettings.lowStockAlerts !== false;

  const outAlert = document.getElementById("set_outOfStockAlerts");
  if (outAlert) outAlert.checked = appSettings.outOfStockAlerts !== false;

  const poAlert = document.getElementById("set_poAlerts");
  if (poAlert) poAlert.checked = appSettings.purchaseOrderAlerts !== false;

  // Inventory Defaults
  const defMinStock = document.getElementById("set_defaultMinStock");
  if (defMinStock) defMinStock.value = appSettings.defaultMinStock || 10;
}

// ─── Theme Management ────────────────────────────────────────────────────────
function selectTheme(theme) {
  if (typeof applyTheme === "function") {
    applyTheme(theme);
  } else {
    document.documentElement.setAttribute("data-theme", theme);
  }

  appSettings.theme = theme;
  localStorage.setItem("smartstock_settings", JSON.stringify(appSettings));

  updateThemeSelectionUI(theme);
  showToast(`Theme changed to ${theme} mode.`, "info");
}

function updateThemeSelectionUI(theme) {
  const lightCard = document.getElementById("themeCardLight");
  const darkCard = document.getElementById("themeCardDark");
  const lightCheck = document.getElementById("themeCheckLight");
  const darkCheck = document.getElementById("themeCheckDark");

  if (theme === "dark") {
    if (lightCard) lightCard.classList.remove("active");
    if (darkCard) darkCard.classList.add("active");
    if (lightCheck) lightCheck.style.display = "none";
    if (darkCheck) darkCheck.style.display = "block";
  } else {
    if (darkCard) darkCard.classList.remove("active");
    if (lightCard) lightCard.classList.add("active");
    if (darkCheck) darkCheck.style.display = "none";
    if (lightCheck) lightCheck.style.display = "block";
  }
}

// ─── Save Notification Settings ──────────────────────────────────────────────
function saveNotificationPreferences(event) {
  event.preventDefault();

  appSettings.lowStockAlerts =
    document.getElementById("set_lowStockAlerts").checked;
  appSettings.outOfStockAlerts = document.getElementById(
    "set_outOfStockAlerts",
  ).checked;
  appSettings.purchaseOrderAlerts =
    document.getElementById("set_poAlerts").checked;

  localStorage.setItem("smartstock_settings", JSON.stringify(appSettings));
  showToast("Notification preferences saved successfully.", "success");
}

// ─── Save Inventory Defaults ──────────────────────────────────────────────────
function saveInventoryDefaults(event) {
  event.preventDefault();

  const minStock = parseInt(
    document.getElementById("set_defaultMinStock").value,
    10,
  );
  if (isNaN(minStock) || minStock < 1) {
    showToast("Please enter a valid threshold (at least 1).", "error");
    return;
  }

  appSettings.defaultMinStock = minStock;
  localStorage.setItem("smartstock_settings", JSON.stringify(appSettings));
  showToast(
    `Default minimum stock threshold set to ${minStock} units.`,
    "success",
  );
}

// ─── Full Data Backup Export ──────────────────────────────────────────────────
function exportAllDataBackup() {
  const backup = {
    app: "SmartStock",
    version: "1.0.0",
    exportedAt: new Date().toISOString(),
    data: {
      products: JSON.parse(localStorage.getItem("smartstock_products") || "[]"),
      suppliers: JSON.parse(
        localStorage.getItem("smartstock_suppliers") || "[]",
      ),
      warehouses: JSON.parse(
        localStorage.getItem("smartstock_warehouses") || "[]",
      ),
      movements: JSON.parse(
        localStorage.getItem("smartstock_movements") || "[]",
      ),
      purchaseOrders: JSON.parse(
        localStorage.getItem("smartstock_purchase_orders") || "[]",
      ),
      notifications: JSON.parse(
        localStorage.getItem("smartstock_notifications") || "[]",
      ),
      settings: JSON.parse(localStorage.getItem("smartstock_settings") || "{}"),
    },
  };

  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "smartstock-backup.json");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast("Workspace backup downloaded successfully.", "success");
}

// ─── Clear All Data Confirmation ──────────────────────────────────────────────
function openClearDataModal() {
  const input = document.getElementById("confirmDeleteInput");
  const btn = document.getElementById("confirmClearBtn");
  if (input) input.value = "";
  if (btn) btn.disabled = true;

  document.getElementById("clearDataModal").style.display = "flex";
}

function closeClearDataModal() {
  document.getElementById("clearDataModal").style.display = "none";
}

function validateDeleteWord() {
  const input = document.getElementById("confirmDeleteInput");
  const btn = document.getElementById("confirmClearBtn");
  if (input && btn) {
    btn.disabled = input.value.trim().toUpperCase() !== "DELETE";
  }
}

function executeClearData() {
  const input = document.getElementById("confirmDeleteInput");
  if (!input || input.value.trim().toUpperCase() !== "DELETE") return;

  // Clear business data keys while preserving user session
  localStorage.removeItem("smartstock_products");
  localStorage.removeItem("smartstock_suppliers");
  localStorage.removeItem("smartstock_warehouses");
  localStorage.removeItem("smartstock_movements");
  localStorage.removeItem("smartstock_purchase_orders");
  localStorage.removeItem("smartstock_notifications");

  // Re-seed demo data
  if (typeof initDemoData === "function") {
    initDemoData();
  }

  closeClearDataModal();
  showToast("Workspace reset! Fresh demo data initialized.", "success");

  setTimeout(() => {
    window.location.href = "dashboard.html";
  }, 1000);
}

// DOM Ready
document.addEventListener("DOMContentLoaded", initSettings);
