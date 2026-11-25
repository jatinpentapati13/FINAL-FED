/**
 * SmartStock - Dashboard JavaScript
 * Handles all dashboard rendering, charts, KPIs, alerts, and interactions
 */

"use strict";

// ─── Chart instances (stored so they can be destroyed on re-render) ───────────
let healthChartInstance = null;
let valueChartInstance = null;
let categoryChartInstance = null;

// ─── Category colour palette ──────────────────────────────────────────────────
const CATEGORY_COLORS = [
  "#4f46e5",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
];

// ─────────────────────────────────────────────────────────────────────────────
// 1. INIT
// ─────────────────────────────────────────────────────────────────────────────
function initDashboard() {
  if (typeof requireAuth === "function") requireAuth();
  if (typeof initDemoData === "function") initDemoData();
  if (typeof renderSidebar === "function") renderSidebar("dashboard");
  if (typeof renderNavbar === "function") renderNavbar();

  setGreeting();
  renderKPICards();
  renderHealthChart();
  renderValueChart();
  renderCategoryChart();
  renderAlerts();
  renderRecentProducts();
  populateModalDropdowns();
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. GREETING
// ─────────────────────────────────────────────────────────────────────────────
function setGreeting() {
  const hour = new Date().getHours();
  let greeting = "Good morning";
  if (hour >= 12 && hour < 17) greeting = "Good afternoon";
  else if (hour >= 17) greeting = "Good evening";

  // Try to get user name from auth/storage
  let userName = "";
  try {
    const user =
      typeof getCurrentUser === "function"
        ? getCurrentUser()
        : JSON.parse(localStorage.getItem("smartstock_current_user") || "null");
    if (user && user.name) userName = ", " + user.name.split(" ")[0];
  } catch (_) {}

  const greetEl = document.getElementById("greetingText");
  const dateEl = document.getElementById("dashboardDate");

  if (greetEl) greetEl.textContent = greeting + userName + " 👋";

  if (dateEl) {
    const now = new Date();
    dateEl.textContent = now.toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. KPI CARDS
// ─────────────────────────────────────────────────────────────────────────────
function renderKPICards() {
  const products = getProducts();
  const suppliers = getSuppliers();

  let totalStock = 0;
  let lowStockCount = 0;
  let outOfStock = 0;
  let totalValue = 0;

  products.forEach((p) => {
    const qty = Number(p.quantity || 0);
    const minStock = Number(p.minStock || 0);
    const price = Number(p.price || 0);

    totalStock += qty;
    totalValue += price * qty;

    if (qty === 0) outOfStock++;
    else if (qty <= minStock) lowStockCount++;
  });

  const kpis = [
    {
      label: "Total Products",
      value: products.length,
      icon: "fas fa-boxes-stacked",
      color: "#4f46e5",
      bg: "rgba(79,70,229,0.12)",
      prefix: "",
      suffix: "",
    },
    {
      label: "Total Stock Units",
      value: totalStock,
      icon: "fas fa-layer-group",
      color: "#0ea5e9",
      bg: "rgba(14,165,233,0.12)",
      prefix: "",
      suffix: "",
    },
    {
      label: "Low Stock Items",
      value: lowStockCount,
      icon: "fas fa-triangle-exclamation",
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.12)",
      prefix: "",
      suffix: "",
    },
    {
      label: "Out of Stock",
      value: outOfStock,
      icon: "fas fa-circle-xmark",
      color: "#ef4444",
      bg: "rgba(239,68,68,0.12)",
      prefix: "",
      suffix: "",
    },
    {
      label: "Inventory Value",
      value: totalValue,
      icon: "fas fa-indian-rupee-sign",
      color: "#10b981",
      bg: "rgba(16,185,129,0.12)",
      prefix: "₹",
      suffix: "",
      isRupee: true,
    },
    {
      label: "Suppliers",
      value: suppliers.length,
      icon: "fas fa-truck",
      color: "#8b5cf6",
      bg: "rgba(139,92,246,0.12)",
      prefix: "",
      suffix: "",
    },
  ];

  const grid = document.getElementById("kpiGrid");
  if (!grid) return;

  grid.innerHTML = kpis
    .map(
      (k, i) => `
    <div class="kpi-card" style="animation-delay:${i * 60}ms">
      <div class="kpi-icon" style="background:${k.bg}; color:${k.color}">
        <i class="${k.icon}"></i>
      </div>
      <div class="kpi-info">
        <p class="kpi-label">${k.label}</p>
        <h3 class="kpi-value" id="kpi_val_${i}">${k.isRupee ? "₹0" : "0"}</h3>
      </div>
    </div>
  `,
    )
    .join("");

  // Animate counters after DOM paint
  requestAnimationFrame(() => {
    kpis.forEach((k, i) => {
      const el = document.getElementById(`kpi_val_${i}`);
      if (!el) return;
      if (k.isRupee) {
        animateCounter(el, k.value, "₹", "", true);
      } else {
        animateCounter(el, k.value, k.prefix, k.suffix, false);
      }
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. ANIMATE COUNTER
// ─────────────────────────────────────────────────────────────────────────────
function animateCounter(
  element,
  target,
  prefix = "",
  suffix = "",
  isCurrency = false,
) {
  if (!element) return;
  const duration = 900;
  const start = performance.now();
  const from = 0;

  function format(val) {
    if (isCurrency) {
      if (val >= 1_00_00_000)
        return prefix + (val / 1_00_00_000).toFixed(2) + " Cr";
      if (val >= 1_00_000) return prefix + (val / 1_00_000).toFixed(2) + " L";
      return prefix + Math.round(val).toLocaleString("en-IN") + suffix;
    }
    return prefix + Math.round(val).toLocaleString("en-IN") + suffix;
  }

  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = from + (target - from) * eased;
    element.textContent = format(current);
    if (progress < 1) requestAnimationFrame(step);
    else element.textContent = format(target);
  }

  requestAnimationFrame(step);
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. HEALTH CHART (Doughnut)
// ─────────────────────────────────────────────────────────────────────────────
function renderHealthChart() {
  const products = getProducts();
  let healthy = 0,
    low = 0,
    out = 0;

  products.forEach((p) => {
    const qty = Number(p.quantity || 0);
    const min = Number(p.minStock || 0);
    if (qty === 0) out++;
    else if (qty <= min) low++;
    else healthy++;
  });

  const total = products.length || 1;
  const data = [healthy, low, out];
  const colors = ["#10b981", "#f59e0b", "#ef4444"];
  const labels = ["Healthy", "Low Stock", "Out of Stock"];

  const ctx = document.getElementById("healthChart");
  if (!ctx) return;

  if (healthChartInstance) {
    healthChartInstance.destroy();
    healthChartInstance = null;
  }

  healthChartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: colors,
          borderWidth: 0,
          hoverOffset: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "70%",
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) =>
              ` ${ctx.label}: ${ctx.parsed} (${((ctx.parsed / total) * 100).toFixed(1)}%)`,
          },
        },
      },
    },
  });

  // Custom Legend
  const legend = document.getElementById("healthLegend");
  if (legend) {
    legend.innerHTML = labels
      .map(
        (lbl, i) => `
      <div class="legend-item" style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
        <span style="width:12px;height:12px;border-radius:50%;background:${colors[i]};flex-shrink:0;display:inline-block"></span>
        <div>
          <div style="font-weight:600;font-size:0.9rem;color:var(--text-primary,#1e293b)">${data[i]}</div>
          <div style="font-size:0.78rem;color:var(--text-muted,#64748b)">${lbl} &nbsp;<span style="font-weight:600">(${((data[i] / total) * 100).toFixed(1)}%)</span></div>
        </div>
      </div>
    `,
      )
      .join("");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. VALUE CHART (Line)
// ─────────────────────────────────────────────────────────────────────────────
function renderValueChart() {
  const period = document.getElementById("valueChartPeriod");
  const is12 = period && period.value.includes("12");
  const allLabels = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const baseVals = [
    420000, 385000, 510000, 475000, 560000, 620000, 590000, 670000, 710000,
    680000, 740000, 800000,
  ];

  const labels = is12 ? allLabels : allLabels.slice(0, 7);
  const rawData = (is12 ? baseVals : baseVals.slice(0, 7)).map((v) =>
    Math.round(v + (Math.random() - 0.5) * 40000),
  );

  const ctx = document.getElementById("valueChart");
  if (!ctx) return;

  if (valueChartInstance) {
    valueChartInstance.destroy();
    valueChartInstance = null;
  }

  // Gradient fill
  const gradient = ctx.getContext("2d").createLinearGradient(0, 0, 0, 200);
  gradient.addColorStop(0, "rgba(79,70,229,0.35)");
  gradient.addColorStop(1, "rgba(79,70,229,0.02)");

  valueChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Inventory Value (₹)",
          data: rawData,
          borderColor: "#4f46e5",
          backgroundColor: gradient,
          borderWidth: 2.5,
          pointRadius: 4,
          pointBackgroundColor: "#4f46e5",
          pointHoverRadius: 6,
          fill: true,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: "index" },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => " ₹" + ctx.parsed.y.toLocaleString("en-IN"),
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: "#94a3b8", font: { size: 11 } },
        },
        y: {
          grid: { color: "rgba(148,163,184,0.15)" },
          ticks: {
            color: "#94a3b8",
            font: { size: 11 },
            callback: (v) =>
              "₹" +
              (v >= 100000
                ? (v / 100000).toFixed(1) + "L"
                : v.toLocaleString("en-IN")),
          },
        },
      },
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. CATEGORY CHART (Bar)
// ─────────────────────────────────────────────────────────────────────────────
function renderCategoryChart() {
  const products = getProducts();
  const catMap = {};

  products.forEach((p) => {
    const cat = p.category || "Uncategorised";
    catMap[cat] = (catMap[cat] || 0) + 1;
  });

  const labels = Object.keys(catMap);
  const data = Object.values(catMap);
  const colors = labels.map(
    (_, i) => CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  );

  const ctx = document.getElementById("categoryChart");
  if (!ctx) return;

  if (categoryChartInstance) {
    categoryChartInstance.destroy();
    categoryChartInstance = null;
  }

  categoryChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Products",
          data: data,
          backgroundColor: colors,
          borderRadius: 6,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: "#94a3b8", font: { size: 11 } },
        },
        y: {
          grid: { color: "rgba(148,163,184,0.15)" },
          ticks: { color: "#94a3b8", font: { size: 11 }, stepSize: 1 },
          beginAtZero: true,
        },
      },
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. ALERTS
// ─────────────────────────────────────────────────────────────────────────────
function renderAlerts() {
  const products = getProducts();
  const alerts = [];

  products.forEach((p) => {
    const qty = Number(p.quantity || 0);
    const min = Number(p.minStock || 0);
    if (qty === 0) {
      alerts.push({ ...p, alertType: "danger", statusLabel: "Out of Stock" });
    } else if (qty <= min) {
      alerts.push({ ...p, alertType: "warning", statusLabel: "Low Stock" });
    }
  });

  const container = document.getElementById("alertsList");
  const badge = document.getElementById("alertCount");

  if (badge) {
    badge.textContent = alerts.length || "";
    badge.style.display = alerts.length ? "inline-flex" : "none";
  }

  if (!container) return;

  if (alerts.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:2rem;color:#64748b">
        <i class="fas fa-check-circle" style="font-size:2rem;color:#10b981;margin-bottom:0.5rem;display:block"></i>
        <p style="margin:0;font-weight:500">All items are well stocked!</p>
      </div>`;
    return;
  }

  container.innerHTML = alerts
    .map(
      (a) => `
    <div class="alert-item alert-${a.alertType}" style="
        display:flex;align-items:center;justify-content:space-between;
        padding:10px 12px;border-radius:10px;margin-bottom:8px;
        background:${a.alertType === "danger" ? "rgba(239,68,68,0.08)" : "rgba(245,158,11,0.08)"};
        border-left:4px solid ${a.alertType === "danger" ? "#ef4444" : "#f59e0b"}">
      <div style="flex:1;min-width:0">
        <p style="margin:0;font-weight:600;font-size:0.875rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(a.name)}</p>
        <p style="margin:0;font-size:0.78rem;color:#64748b">
          Qty: <strong>${a.quantity}</strong> &nbsp;|&nbsp; Min: <strong>${a.minStock}</strong>
        </p>
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
        <span class="badge badge-${a.alertType === "danger" ? "danger" : "warning"}">${a.statusLabel}</span>
        <button onclick="window.location.href='products.html'" style="
            background:transparent;border:1px solid ${a.alertType === "danger" ? "#ef4444" : "#f59e0b"};
            color:${a.alertType === "danger" ? "#ef4444" : "#d97706"};padding:3px 10px;
            border-radius:6px;font-size:0.75rem;cursor:pointer;font-weight:500">
          Review
        </button>
      </div>
    </div>
  `,
    )
    .join("");
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. RECENT PRODUCTS TABLE
// ─────────────────────────────────────────────────────────────────────────────
function renderRecentProducts() {
  const products = getProducts();
  const warehouses = getWarehouses();
  const tbody = document.getElementById("recentProductsBody");
  if (!tbody) return;

  // Show latest 5
  const recent = [...products].reverse().slice(0, 5);

  if (recent.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center;padding:2rem;color:#64748b">
          No products found. <a href="products.html" style="color:#4f46e5">Add your first product</a>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = recent
    .map((p) => {
      const qty = Number(p.quantity || 0);
      const min = Number(p.minStock || 0);
      const status = getProductStatus(qty, min);
      const wh = warehouses.find((w) => w.id === p.warehouseId);
      const whName = wh ? wh.name : p.warehouse || "—";
      const price = Number(p.price || 0);
      const category = p.category || "—";

      const catIcon = getCategoryIcon(category);

      return `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:10px">
            <div style="
                width:36px;height:36px;border-radius:8px;background:rgba(79,70,229,0.1);
                display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#4f46e5;font-size:1rem">
              <i class="${catIcon}"></i>
            </div>
            <span style="font-weight:500;font-size:0.875rem">${escapeHtml(p.name)}</span>
          </div>
        </td>
        <td style="font-size:0.8rem;color:#64748b;font-family:monospace">${escapeHtml(p.sku || "—")}</td>
        <td>
          <span style="
              background:rgba(79,70,229,0.1);color:#4f46e5;
              padding:3px 8px;border-radius:20px;font-size:0.75rem;font-weight:500">
            ${escapeHtml(category)}
          </span>
        </td>
        <td style="font-weight:600;font-size:0.875rem">₹${price.toLocaleString("en-IN")}</td>
        <td style="font-weight:600;font-size:0.875rem">${qty.toLocaleString("en-IN")}</td>
        <td>${status.badge}</td>
        <td style="font-size:0.875rem;color:#64748b">${escapeHtml(whName)}</td>
      </tr>
    `;
    })
    .join("");
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: product status
// ─────────────────────────────────────────────────────────────────────────────
function getProductStatus(qty, minStock) {
  if (qty === 0)
    return {
      label: "Out of Stock",
      badge: '<span class="badge badge-danger">Out of Stock</span>',
    };
  if (qty <= minStock)
    return {
      label: "Low Stock",
      badge: '<span class="badge badge-warning">Low Stock</span>',
    };
  return {
    label: "In Stock",
    badge: '<span class="badge badge-success">In Stock</span>',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: category icon
// ─────────────────────────────────────────────────────────────────────────────
function getCategoryIcon(cat) {
  const map = {
    Electronics: "fas fa-microchip",
    Grocery: "fas fa-apple-alt",
    Clothing: "fas fa-tshirt",
    Stationery: "fas fa-pen",
    Home: "fas fa-home",
    Other: "fas fa-box",
  };
  return map[cat] || "fas fa-box";
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: XSS safe
// ─────────────────────────────────────────────────────────────────────────────
function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. MODAL – OPEN / CLOSE
// ─────────────────────────────────────────────────────────────────────────────
function openAddProductModal() {
  const modal = document.getElementById("addProductModal");
  if (modal) {
    modal.style.display = "flex";
    populateModalDropdowns();
    // Reset form
    [
      "dp_name",
      "dp_sku",
      "dp_category",
      "dp_price",
      "dp_quantity",
      "dp_minStock",
      "dp_supplier",
      "dp_warehouse",
      "dp_description",
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
  }
}

function closeAddProductModal() {
  const modal = document.getElementById("addProductModal");
  if (modal) modal.style.display = "none";
}

// Close on overlay click
document.addEventListener("click", (e) => {
  const modal = document.getElementById("addProductModal");
  if (modal && e.target === modal) closeAddProductModal();
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. POPULATE MODAL DROPDOWNS
// ─────────────────────────────────────────────────────────────────────────────
function populateModalDropdowns() {
  const suppliers = getSuppliers();
  const warehouses = getWarehouses();

  const supSelect = document.getElementById("dp_supplier");
  if (supSelect) {
    supSelect.innerHTML =
      '<option value="">Select supplier</option>' +
      suppliers
        .map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`)
        .join("");
  }

  const whSelect = document.getElementById("dp_warehouse");
  if (whSelect) {
    whSelect.innerHTML =
      '<option value="">Select warehouse</option>' +
      warehouses
        .map((w) => `<option value="${w.id}">${escapeHtml(w.name)}</option>`)
        .join("");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. SAVE PRODUCT FROM DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function saveProductFromDashboard() {
  const name = document.getElementById("dp_name")?.value.trim();
  const sku = document.getElementById("dp_sku")?.value.trim();
  const category = document.getElementById("dp_category")?.value;
  const price = parseFloat(document.getElementById("dp_price")?.value);
  const quantity = parseInt(document.getElementById("dp_quantity")?.value, 10);
  const minStock = parseInt(document.getElementById("dp_minStock")?.value, 10);

  // Validation
  const errors = [];
  if (!name) errors.push("Product Name is required.");
  if (!sku) errors.push("SKU is required.");
  if (!category) errors.push("Category is required.");
  if (isNaN(price) || price < 0) errors.push("Valid price is required.");
  if (isNaN(quantity) || quantity < 0)
    errors.push("Valid quantity is required.");
  if (isNaN(minStock) || minStock < 0)
    errors.push("Valid minimum stock is required.");

  if (errors.length > 0) {
    showToast(errors[0], "error");
    return;
  }

  const products = getProducts();
  if (
    products.some((p) => p.sku && p.sku.toUpperCase() === sku.toUpperCase())
  ) {
    showToast(
      `SKU "${sku}" already exists. Please choose a unique SKU.`,
      "error",
    );
    return;
  }

  const newProduct = {
    id: generateId ? generateId() : "prd_" + Date.now(),
    name,
    sku,
    category,
    price,
    quantity,
    minStock,
    supplierId: document.getElementById("dp_supplier")?.value || "",
    warehouseId: document.getElementById("dp_warehouse")?.value || "",
    description: document.getElementById("dp_description")?.value.trim() || "",
    createdAt: new Date().toISOString(),
  };

  // Save product
  products.unshift(newProduct);
  localStorage.setItem("smartstock_products", JSON.stringify(products));

  // Record initial Stock In movement if quantity > 0
  if (quantity > 0) {
    try {
      const movements = JSON.parse(
        localStorage.getItem("smartstock_movements") || "[]",
      );
      const user =
        typeof getCurrentUser === "function" ? getCurrentUser() : null;
      const userName = user && user.name ? user.name : "Raj Sharma";
      movements.unshift({
        id: generateId ? generateId() : "mov_" + Date.now(),
        date: new Date().toISOString(),
        productId: newProduct.id,
        productName: newProduct.name,
        sku: newProduct.sku,
        type: "Stock In",
        quantity: quantity,
        fromWarehouseId: "",
        toWarehouseId: newProduct.warehouseId || "",
        notes: "Initial inventory on product creation",
        user: userName,
        performedBy: userName,
        status: "Completed",
      });
      localStorage.setItem("smartstock_movements", JSON.stringify(movements));
    } catch (e) {
      console.warn("[SmartStock] Failed to record initial movement:", e);
    }
  }

  closeAddProductModal();
  showToast(`"${name}" added successfully!`, "success");

  // Refresh all dashboard sections
  renderKPICards();
  renderHealthChart();
  renderCategoryChart();
  renderAlerts();
  renderRecentProducts();
}

// ─────────────────────────────────────────────────────────────────────────────
// 13. EXPORT DASHBOARD REPORT (CSV)
// ─────────────────────────────────────────────────────────────────────────────
function exportDashboardReport() {
  const products = getProducts();
  const warehouses = getWarehouses();
  const suppliers = getSuppliers();

  if (products.length === 0) {
    showToast("No products to export.", "warning");
    return;
  }

  const headers = [
    "Name",
    "SKU",
    "Category",
    "Price (₹)",
    "Quantity",
    "Min Stock",
    "Status",
    "Inventory Value (₹)",
    "Supplier",
    "Warehouse",
  ];

  const rows = products.map((p) => {
    const qty = Number(p.quantity || 0);
    const min = Number(p.minStock || 0);
    const price = Number(p.price || 0);
    const status =
      qty === 0 ? "Out of Stock" : qty <= min ? "Low Stock" : "In Stock";
    const wh = warehouses.find((w) => w.id === p.warehouseId);
    const sup = suppliers.find((s) => s.id === p.supplierId);

    return [
      csvCell(p.name),
      csvCell(p.sku),
      csvCell(p.category),
      price.toFixed(2),
      qty,
      min,
      csvCell(status),
      (price * qty).toFixed(2),
      csvCell(sup ? sup.name : ""),
      csvCell(wh ? wh.name : ""),
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `SmartStock_Dashboard_${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast("Dashboard report exported!", "success");
}

function csvCell(val) {
  const s = String(val == null ? "" : val).replace(/"/g, '""');
  return `"${s}"`;
}

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE HELPERS (fall-through if storage.js provides them)
// ─────────────────────────────────────────────────────────────────────────────
function getProducts() {
  if (
    typeof window.getProducts === "function" &&
    window.getProducts !== getProducts
  ) {
    return window.getProducts();
  }
  try {
    return JSON.parse(localStorage.getItem("smartstock_products") || "[]");
  } catch (_) {
    return [];
  }
}

function getSuppliers() {
  if (
    typeof window.getSuppliers === "function" &&
    window.getSuppliers !== getSuppliers
  ) {
    return window.getSuppliers();
  }
  try {
    return JSON.parse(localStorage.getItem("smartstock_suppliers") || "[]");
  } catch (_) {
    return [];
  }
}

function getWarehouses() {
  if (
    typeof window.getWarehouses === "function" &&
    window.getWarehouses !== getWarehouses
  ) {
    return window.getWarehouses();
  }
  try {
    return JSON.parse(localStorage.getItem("smartstock_warehouses") || "[]");
  } catch (_) {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TOAST HELPER (fall-through if app.js provides it)
// ─────────────────────────────────────────────────────────────────────────────
function showToast(message, type = "info") {
  if (
    typeof window.showToast === "function" &&
    window.showToast !== showToast
  ) {
    return window.showToast(message, type);
  }
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const colorMap = {
    success: "#10b981",
    error: "#ef4444",
    warning: "#f59e0b",
    info: "#0ea5e9",
  };

  const toast = document.createElement("div");
  toast.style.cssText = `
    background:#fff;border-left:4px solid ${colorMap[type] || colorMap.info};
    border-radius:10px;padding:12px 16px;margin-bottom:10px;
    box-shadow:0 4px 20px rgba(0,0,0,0.12);
    font-size:0.875rem;font-weight:500;color:#1e293b;
    animation:slideInRight 0.3s ease;min-width:250px;max-width:360px`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERATE ID HELPER
// ─────────────────────────────────────────────────────────────────────────────
if (typeof generateId === "undefined") {
  var generateId = () =>
    "id_" + Math.random().toString(36).substr(2, 9) + "_" + Date.now();
}

// ─────────────────────────────────────────────────────────────────────────────
// INIT ON DOM READY
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", initDashboard);
