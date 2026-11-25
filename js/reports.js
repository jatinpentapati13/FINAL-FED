/**
 * SmartStock - Reports & Analytics Module
 * Comprehensive business intelligence, cross-dimensional aggregations,
 * interactive Chart.js visualizations, and automated CSV / Print generation.
 */

"use strict";

let currentReportTab = "overview";
let repProducts = [];
let repSuppliers = [];
let repWarehouses = [];
let repMovements = [];
let repOrders = [];

let repCategoryValueChartInstance = null;
let repCategoryCountChartInstance = null;

// ─── Initialisation ───────────────────────────────────────────────────────────
function initReports() {
  if (typeof requireAuth === "function") requireAuth();
  if (typeof initDemoData === "function") initDemoData();
  if (typeof renderSidebar === "function") renderSidebar("reports");
  if (typeof renderNavbar === "function") renderNavbar();

  loadReportData();
}

function loadReportData() {
  repProducts = JSON.parse(localStorage.getItem("smartstock_products") || "[]");
  repSuppliers = JSON.parse(
    localStorage.getItem("smartstock_suppliers") || "[]",
  );
  repWarehouses = JSON.parse(
    localStorage.getItem("smartstock_warehouses") || "[]",
  );
  repMovements = JSON.parse(
    localStorage.getItem("smartstock_movements") || "[]",
  );
  repOrders = JSON.parse(
    localStorage.getItem("smartstock_purchase_orders") || "[]",
  );

  renderOverviewKPIs();
  renderOverviewCharts();
  renderInventoryReport();
  renderLowStockReport();
  renderSuppliersReport();
  renderWarehousesReport();
}

// ─── Tab Switching ────────────────────────────────────────────────────────────
function switchReportTab(tabId) {
  currentReportTab = tabId;

  // Update tab buttons
  document
    .querySelectorAll(".report-tab-btn")
    .forEach((btn) => btn.classList.remove("active"));
  const activeBtn = document.getElementById(`tab-${tabId}`);
  if (activeBtn) activeBtn.classList.add("active");

  // Update tab sections
  document
    .querySelectorAll(".report-section")
    .forEach((sec) => (sec.style.display = "none"));
  const activeSec = document.getElementById(`reportSection-${tabId}`);
  if (activeSec) activeSec.style.display = "block";

  if (tabId === "overview") {
    renderOverviewCharts();
  }
}

// ─── 1. Overview Tab ─────────────────────────────────────────────────────────
function renderOverviewKPIs() {
  let totalValue = 0;
  let totalUnits = 0;
  let healthyCount = 0;
  let criticalCount = 0;

  repProducts.forEach((p) => {
    const qty = Number(p.quantity) || 0;
    const price = Number(p.price) || 0;
    const min = Number(p.minStock) || 0;

    totalUnits += qty;
    totalValue += qty * price;

    if (qty === 0 || qty <= min) {
      criticalCount++;
    } else {
      healthyCount++;
    }
  });

  const healthPercent =
    repProducts.length > 0
      ? Math.round((healthyCount / repProducts.length) * 100)
      : 100;

  const valEl = document.getElementById("repTotalValue");
  const unitEl = document.getElementById("repTotalUnits");
  const healthEl = document.getElementById("repHealthIndex");
  const critEl = document.getElementById("repCriticalItems");

  if (valEl)
    valEl.textContent = `₹${totalValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  if (unitEl) unitEl.textContent = totalUnits.toLocaleString("en-IN");
  if (healthEl) healthEl.textContent = `${healthPercent}%`;
  if (critEl) critEl.textContent = criticalCount;
}

function renderOverviewCharts() {
  // Aggregate by Category
  const catMap = {};
  repProducts.forEach((p) => {
    const cat = p.category || "Other";
    const qty = Number(p.quantity) || 0;
    const price = Number(p.price) || 0;
    const val = qty * price;

    if (!catMap[cat]) catMap[cat] = { count: 0, value: 0 };
    catMap[cat].count++;
    catMap[cat].value += val;
  });

  const categories = Object.keys(catMap);
  const values = categories.map((c) => catMap[c].value);
  const counts = categories.map((c) => catMap[c].count);

  const colors = [
    "#4f46e5",
    "#0ea5e9",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
  ];

  // Value Bar Chart
  const ctxVal = document.getElementById("repCategoryValueChart");
  if (ctxVal && window.Chart) {
    if (repCategoryValueChartInstance) repCategoryValueChartInstance.destroy();

    repCategoryValueChartInstance = new Chart(ctxVal, {
      type: "bar",
      data: {
        labels: categories,
        datasets: [
          {
            label: "Inventory Value (₹)",
            data: values,
            backgroundColor: colors.slice(0, categories.length),
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `Value: ₹${ctx.parsed.y.toLocaleString("en-IN")}`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (val) => "₹" + Number(val).toLocaleString("en-IN"),
            },
          },
        },
      },
    });
  }

  // Count Doughnut Chart
  const ctxCount = document.getElementById("repCategoryCountChart");
  if (ctxCount && window.Chart) {
    if (repCategoryCountChartInstance) repCategoryCountChartInstance.destroy();

    repCategoryCountChartInstance = new Chart(ctxCount, {
      type: "doughnut",
      data: {
        labels: categories,
        datasets: [
          {
            data: counts,
            backgroundColor: colors.slice(0, categories.length),
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "right" },
        },
      },
    });
  }
}

// ─── 2. Inventory Ledger Tab ─────────────────────────────────────────────────
function renderInventoryReport() {
  const tbody = document.getElementById("repInventoryTableBody");
  if (!tbody) return;

  const supplierMap = {};
  repSuppliers.forEach((s) => {
    supplierMap[s.id] = s.name;
  });

  const warehouseMap = {};
  repWarehouses.forEach((w) => {
    warehouseMap[w.id] = w.name;
  });

  let grandUnits = 0;
  let grandTotal = 0;

  tbody.innerHTML = repProducts
    .map((p) => {
      const qty = Number(p.quantity) || 0;
      const price = Number(p.price) || 0;
      const min = Number(p.minStock) || 0;
      const totalVal = qty * price;

      grandUnits += qty;
      grandTotal += totalVal;

      let statusBadge = '<span class="badge badge-success">In Stock</span>';
      if (qty === 0)
        statusBadge = '<span class="badge badge-danger">Out of Stock</span>';
      else if (qty <= min)
        statusBadge = '<span class="badge badge-warning">Low Stock</span>';

      return `
      <tr>
        <td><strong>${escapeHtml(p.name)}</strong></td>
        <td><span style="font-family:monospace; background:var(--gray-100); padding:2px 6px; border-radius:4px">${escapeHtml(p.sku)}</span></td>
        <td><span class="badge badge-info">${escapeHtml(p.category)}</span></td>
        <td>₹${price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
        <td style="font-weight:700">${qty}</td>
        <td style="font-weight:700; color:var(--success)">₹${totalVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
        <td>${escapeHtml(warehouseMap[p.warehouseId] || "—")}</td>
        <td>${escapeHtml(supplierMap[p.supplierId] || "—")}</td>
        <td>${statusBadge}</td>
      </tr>
    `;
    })
    .join("");

  const countBadge = document.getElementById("repInvCount");
  if (countBadge) countBadge.textContent = `${repProducts.length} Products`;

  const grandUnitsEl = document.getElementById("repInvGrandUnits");
  if (grandUnitsEl)
    grandUnitsEl.textContent = `${grandUnits.toLocaleString("en-IN")} units`;

  const grandTotalEl = document.getElementById("repInvGrandTotal");
  if (grandTotalEl)
    grandTotalEl.textContent = `₹${grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

// ─── 3. Low Stock Tab ────────────────────────────────────────────────────────
function renderLowStockReport() {
  const tbody = document.getElementById("repLowStockTableBody");
  if (!tbody) return;

  const supplierMap = {};
  repSuppliers.forEach((s) => {
    supplierMap[s.id] = s.name;
  });

  const lowProducts = repProducts.filter((p) => {
    const qty = Number(p.quantity) || 0;
    const min = Number(p.minStock) || 0;
    return qty <= min;
  });

  const countBadge = document.getElementById("repLowCountBadge");
  if (countBadge)
    countBadge.textContent = `${lowProducts.length} Attention Required`;

  if (lowProducts.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:2rem; color:var(--success)">
      <i class="fas fa-check-circle me-2"></i> All inventory products are currently above minimum stock thresholds!
    </td></tr>`;
    return;
  }

  tbody.innerHTML = lowProducts
    .map((p) => {
      const qty = Number(p.quantity) || 0;
      const min = Number(p.minStock) || 0;
      const deficit = Math.max(min - qty, 0);

      let status = '<span class="badge badge-warning">Low Stock</span>';
      if (qty === 0)
        status = '<span class="badge badge-danger">Out of Stock</span>';

      return `
      <tr>
        <td><strong>${escapeHtml(p.name)}</strong></td>
        <td><span style="font-family:monospace; font-size:0.8rem">${escapeHtml(p.sku)}</span></td>
        <td><span class="badge badge-info">${escapeHtml(p.category)}</span></td>
        <td style="font-weight:700; color:${qty === 0 ? "var(--danger)" : "var(--warning)"}">${qty}</td>
        <td>${min}</td>
        <td style="font-weight:700; color:var(--danger)">-${deficit} units</td>
        <td>${escapeHtml(supplierMap[p.supplierId] || "—")}</td>
        <td>${status}</td>
        <td style="text-align:right">
          <button class="btn-sm btn-primary" onclick="window.location.href='purchase-orders.html'">
            <i class="fas fa-cart-plus me-1"></i> Order Now
          </button>
        </td>
      </tr>
    `;
    })
    .join("");
}

// ─── 4. Suppliers Tab ────────────────────────────────────────────────────────
function renderSuppliersReport() {
  const tbody = document.getElementById("repSuppliersTableBody");
  if (!tbody) return;

  tbody.innerHTML = repSuppliers
    .map((s) => {
      const suppliedProds = repProducts.filter((p) => p.supplierId === s.id);
      let totalVal = 0;
      suppliedProds.forEach((p) => {
        totalVal += (Number(p.quantity) || 0) * (Number(p.price) || 0);
      });

      return `
      <tr>
        <td><strong>${escapeHtml(s.name)}</strong></td>
        <td>${escapeHtml(s.contactPerson || "—")}</td>
        <td style="font-size:0.85rem; color:var(--text-secondary)">
          ${escapeHtml(s.phone || "")} ${s.email ? `<br><small>${escapeHtml(s.email)}</small>` : ""}
        </td>
        <td style="font-weight:600">${suppliedProds.length} products</td>
        <td style="font-weight:700; color:var(--success)">₹${totalVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
        <td><span class="badge ${s.status === "Active" ? "badge-success" : "badge-secondary"}">${escapeHtml(s.status || "Active")}</span></td>
      </tr>
    `;
    })
    .join("");
}

// ─── 5. Warehouses Tab ───────────────────────────────────────────────────────
function renderWarehousesReport() {
  const tbody = document.getElementById("repWarehousesTableBody");
  if (!tbody) return;

  tbody.innerHTML = repWarehouses
    .map((w) => {
      const prods = repProducts.filter((p) => p.warehouseId === w.id);
      let totalUnits = 0;
      prods.forEach((p) => {
        totalUnits += Number(p.quantity) || 0;
      });

      const capacity = Number(w.capacity) || 5000;
      const occupancy = Math.min(
        Math.round((totalUnits / capacity) * 100),
        100,
      );

      let barColor = "var(--success)";
      if (occupancy > 85) barColor = "var(--danger)";
      else if (occupancy > 65) barColor = "var(--warning)";

      return `
      <tr>
        <td><strong>${escapeHtml(w.name)}</strong></td>
        <td>${escapeHtml(w.location || "—")}</td>
        <td>${escapeHtml(w.manager || "—")}</td>
        <td style="font-weight:600">${prods.length} SKUs</td>
        <td style="font-weight:700">${totalUnits.toLocaleString("en-IN")} units</td>
        <td>${capacity.toLocaleString("en-IN")} units</td>
        <td style="min-width:140px">
          <div style="display:flex; align-items:center; gap:8px">
            <div class="stock-bar" style="width:80px">
              <div class="stock-bar-fill" style="width:${occupancy}%; background:${barColor}"></div>
            </div>
            <span style="font-size:0.8rem; font-weight:600">${occupancy}%</span>
          </div>
        </td>
      </tr>
    `;
    })
    .join("");
}

// ─── CSV Export Functionality ─────────────────────────────────────────────────
function exportCurrentReportCSV() {
  let filename = `smartstock-${currentReportTab}-report.csv`;
  let csvRows = [];

  const supplierMap = {};
  repSuppliers.forEach((s) => {
    supplierMap[s.id] = s.name;
  });

  const warehouseMap = {};
  repWarehouses.forEach((w) => {
    warehouseMap[w.id] = w.name;
  });

  if (currentReportTab === "overview" || currentReportTab === "inventory") {
    filename = "smartstock-inventory-valuation-report.csv";
    csvRows.push([
      "Product Name",
      "SKU",
      "Category",
      "Unit Price (INR)",
      "Stock Quantity",
      "Min Stock Threshold",
      "Total Value (INR)",
      "Warehouse",
      "Supplier",
      "Status",
    ]);

    repProducts.forEach((p) => {
      const qty = Number(p.quantity) || 0;
      const price = Number(p.price) || 0;
      const min = Number(p.minStock) || 0;
      const status =
        qty === 0 ? "Out of Stock" : qty <= min ? "Low Stock" : "In Stock";

      csvRows.push([
        escapeCsv(p.name),
        escapeCsv(p.sku),
        escapeCsv(p.category),
        price,
        qty,
        min,
        qty * price,
        escapeCsv(warehouseMap[p.warehouseId] || ""),
        escapeCsv(supplierMap[p.supplierId] || ""),
        status,
      ]);
    });
  } else if (currentReportTab === "lowstock") {
    filename = "smartstock-low-stock-alerts-report.csv";
    csvRows.push([
      "Product Name",
      "SKU",
      "Category",
      "Current Quantity",
      "Min Stock",
      "Shortage Deficit",
      "Supplier",
      "Status",
    ]);

    const lowItems = repProducts.filter(
      (p) => Number(p.quantity) <= Number(p.minStock),
    );
    lowItems.forEach((p) => {
      const qty = Number(p.quantity) || 0;
      const min = Number(p.minStock) || 0;
      const status = qty === 0 ? "Out of Stock" : "Low Stock";

      csvRows.push([
        escapeCsv(p.name),
        escapeCsv(p.sku),
        escapeCsv(p.category),
        qty,
        min,
        Math.max(min - qty, 0),
        escapeCsv(supplierMap[p.supplierId] || ""),
        status,
      ]);
    });
  } else if (currentReportTab === "suppliers") {
    filename = "smartstock-supplier-performance-report.csv";
    csvRows.push([
      "Supplier Name",
      "Contact Person",
      "Email",
      "Phone",
      "Address",
      "Products Supplied",
      "Total Valuation (INR)",
      "Status",
    ]);

    repSuppliers.forEach((s) => {
      const prods = repProducts.filter((p) => p.supplierId === s.id);
      let val = 0;
      prods.forEach((p) => {
        val += (Number(p.quantity) || 0) * (Number(p.price) || 0);
      });

      csvRows.push([
        escapeCsv(s.name),
        escapeCsv(s.contactPerson),
        escapeCsv(s.email),
        escapeCsv(s.phone),
        escapeCsv(s.address),
        prods.length,
        val,
        escapeCsv(s.status || "Active"),
      ]);
    });
  } else if (currentReportTab === "warehouses") {
    filename = "smartstock-warehouse-distribution-report.csv";
    csvRows.push([
      "Warehouse Name",
      "Location",
      "Manager",
      "Product SKUs Count",
      "Total Units Stored",
      "Maximum Capacity",
      "Utilization %",
      "Status",
    ]);

    repWarehouses.forEach((w) => {
      const prods = repProducts.filter((p) => p.warehouseId === w.id);
      let units = 0;
      prods.forEach((p) => {
        units += Number(p.quantity) || 0;
      });
      const cap = Number(w.capacity) || 5000;
      const pct = Math.round((units / cap) * 100);

      csvRows.push([
        escapeCsv(w.name),
        escapeCsv(w.location),
        escapeCsv(w.manager),
        prods.length,
        units,
        cap,
        `${pct}%`,
        escapeCsv(w.status || "Active"),
      ]);
    });
  }

  // Convert array to CSV string
  const csvContent = csvRows.map((row) => row.join(",")).join("\r\n");
  downloadCsvFile(filename, csvContent);
  showToast(`Exported "${filename}" successfully.`, "success");
}

function escapeCsv(field) {
  if (field === null || field === undefined) return '""';
  const str = String(field).replace(/"/g, '""');
  return `"${str}"`;
}

function downloadCsvFile(filename, content) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ─── Print Report ─────────────────────────────────────────────────────────────
function printReport() {
  window.print();
}

// DOM Ready
document.addEventListener("DOMContentLoaded", initReports);
