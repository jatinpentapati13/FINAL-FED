/**
 * SmartStock - Stock Movement Module
 * Handles inventory audit transactions: Stock In, Stock Out, Adjustment, Transfer.
 * Automatically synchronizes product stock levels and warehouse allocations.
 */

"use strict";

let allMovements = [];
let mvProducts = [];
let mvWarehouses = [];

// ─── Initialisation ───────────────────────────────────────────────────────────
function initMovements() {
  if (typeof requireAuth === "function") requireAuth();
  if (typeof initDemoData === "function") initDemoData();
  if (typeof renderSidebar === "function") renderSidebar("movements");
  if (typeof renderNavbar === "function") renderNavbar();

  loadMovements();
}

// ─── Data Loading & Metrics ───────────────────────────────────────────────────
function loadMovements() {
  allMovements = JSON.parse(
    localStorage.getItem("smartstock_movements") || "[]",
  );
  mvProducts = JSON.parse(localStorage.getItem("smartstock_products") || "[]");
  mvWarehouses = JSON.parse(
    localStorage.getItem("smartstock_warehouses") || "[]",
  );

  renderSummaryCards();
  filterMovements();
}

function renderSummaryCards() {
  const totalCount = allMovements.length;
  let stockInTotal = 0;
  let stockOutTotal = 0;
  let transferCount = 0;

  allMovements.forEach((m) => {
    const qty = Number(m.quantity) || 0;
    if (m.type === "Stock In") stockInTotal += qty;
    else if (m.type === "Stock Out") stockOutTotal += qty;
    else transferCount++;
  });

  const tcEl = document.getElementById("mvTotalCount");
  const inEl = document.getElementById("mvStockInCount");
  const outEl = document.getElementById("mvStockOutCount");
  const trEl = document.getElementById("mvTransferCount");

  if (typeof animateCounter === "function") {
    animateCounter(tcEl, totalCount);
    animateCounter(inEl, stockInTotal);
    animateCounter(outEl, stockOutTotal);
    animateCounter(trEl, transferCount);
  } else {
    if (tcEl) tcEl.textContent = totalCount.toLocaleString("en-IN");
    if (inEl) inEl.textContent = stockInTotal.toLocaleString("en-IN");
    if (outEl) outEl.textContent = stockOutTotal.toLocaleString("en-IN");
    if (trEl) trEl.textContent = transferCount.toLocaleString("en-IN");
  }
}

// ─── Filtering ────────────────────────────────────────────────────────────────
function filterMovements() {
  const query = (document.getElementById("searchMovements")?.value || "")
    .toLowerCase()
    .trim();
  const typeFilter = document.getElementById("filterType")?.value || "";
  const dateFilter = document.getElementById("filterDateRange")?.value || "all";

  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000;
  const oneWeek = 7 * oneDay;
  const oneMonth = 30 * oneDay;

  const filtered = allMovements.filter((m) => {
    const matchQuery =
      !query ||
      (m.productName && m.productName.toLowerCase().includes(query)) ||
      (m.sku && m.sku.toLowerCase().includes(query)) ||
      (m.notes && m.notes.toLowerCase().includes(query)) ||
      (m.user && m.user.toLowerCase().includes(query));

    const matchType = !typeFilter || m.type === typeFilter;

    let matchDate = true;
    if (dateFilter !== "all" && m.date) {
      const itemDate = new Date(m.date);
      const diff = now - itemDate;
      if (dateFilter === "today") matchDate = diff <= oneDay;
      else if (dateFilter === "week") matchDate = diff <= oneWeek;
      else if (dateFilter === "month") matchDate = diff <= oneMonth;
    }

    return matchQuery && matchType && matchDate;
  });

  renderMovementsTable(filtered);
}

// ─── Table Rendering ─────────────────────────────────────────────────────────
function renderMovementsTable(movements) {
  const tbody = document.getElementById("movementsTableBody");
  const emptyState = document.getElementById("movementsEmptyState");
  const countEl = document.getElementById("movementsCount");
  if (!tbody) return;

  if (countEl) {
    countEl.textContent = `Showing ${movements.length} of ${allMovements.length} movements`;
  }

  if (movements.length === 0) {
    tbody.innerHTML = "";
    if (emptyState) emptyState.style.display = "block";
    return;
  }

  if (emptyState) emptyState.style.display = "none";

  const warehouseMap = {};
  mvWarehouses.forEach((w) => {
    warehouseMap[w.id] = w.name;
  });

  tbody.innerHTML = movements
    .map((m) => {
      let dateStr = "—";
      if (m.date) {
        const d = new Date(m.date);
        dateStr = d.toLocaleDateString("en-IN", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }

      // Type badge & symbol
      let badgeClass = "badge-info";
      let qtyPrefix = "";
      let qtyColor = "var(--text-primary)";

      if (m.type === "Stock In") {
        badgeClass = "badge-success";
        qtyPrefix = "+";
        qtyColor = "var(--success)";
      } else if (m.type === "Stock Out") {
        badgeClass = "badge-danger";
        qtyPrefix = "-";
        qtyColor = "var(--danger)";
      } else if (m.type === "Transfer") {
        badgeClass = "badge-primary";
        qtyColor = "var(--primary)";
      } else if (m.type === "Adjustment") {
        badgeClass = "badge-warning";
        qtyColor = "var(--warning)";
      }

      const fromWh =
        warehouseMap[m.fromWarehouseId] ||
        (m.fromWarehouseId ? m.fromWarehouseId : "—");
      const toWh =
        warehouseMap[m.toWarehouseId] ||
        (m.toWarehouseId ? m.toWarehouseId : "—");

      return `
      <tr>
        <td style="font-size:0.8rem; color:var(--text-secondary); white-space:nowrap">${dateStr}</td>
        <td>
          <div style="font-weight:600; color:var(--text-primary)">${escapeHtml(m.productName || "Unknown Product")}</div>
        </td>
        <td>
          <span style="font-family:monospace; font-size:0.8rem; font-weight:700; background:var(--gray-100); padding:2px 6px; border-radius:4px">
            ${escapeHtml(m.sku || "—")}
          </span>
        </td>
        <td><span class="badge ${badgeClass}">${escapeHtml(m.type)}</span></td>
        <td style="font-weight:700; color:${qtyColor}">
          ${qtyPrefix}${Number(m.quantity || 0).toLocaleString("en-IN")} units
        </td>
        <td style="color:var(--text-secondary); font-size:0.85rem">
          ${fromWh !== "—" ? `<i class="fas fa-arrow-up-from-bracket me-1 text-muted"></i>` : ""}${escapeHtml(fromWh)}
        </td>
        <td style="color:var(--text-secondary); font-size:0.85rem">
          ${toWh !== "—" ? `<i class="fas fa-arrow-down-to-bracket me-1 text-muted"></i>` : ""}${escapeHtml(toWh)}
        </td>
        <td style="font-size:0.8rem; color:var(--text-secondary); max-width:220px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap">
          ${escapeHtml(m.notes || "—")}
        </td>
        <td>
          <span style="font-size:0.8rem; background:var(--gray-100); padding:3px 8px; border-radius:50px; color:var(--gray-700)">
            <i class="fas fa-user-circle me-1"></i>${escapeHtml(m.user || "Admin")}
          </span>
        </td>
      </tr>
    `;
    })
    .join("");
}

// ─── Modal Operations ─────────────────────────────────────────────────────────
function openMovementModal() {
  populateProductDropdown();
  populateWarehouseDropdowns();

  document.getElementById("mv_product").value = "";
  document.getElementById("mv_type").value = "Stock In";
  document.getElementById("mv_quantity").value = "";
  document.getElementById("mv_notes").value = "";
  document.getElementById("mv_stockInfo").style.display = "none";

  clearErrors();
  onTypeChange();

  document.getElementById("movementModal").style.display = "flex";
}

function closeMovementModal() {
  document.getElementById("movementModal").style.display = "none";
  clearErrors();
}

function clearErrors() {
  ["mv_product", "mv_quantity", "mv_toWarehouse"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.remove("is-invalid");
  });
  ["mv_product_err", "mv_qty_err", "mv_toWh_err"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = "";
  });
}

function populateProductDropdown() {
  const select = document.getElementById("mv_product");
  if (!select) return;
  select.innerHTML =
    '<option value="">Select product</option>' +
    mvProducts
      .map(
        (p) =>
          `<option value="${p.id}">${escapeHtml(p.name)} (${p.sku})</option>`,
      )
      .join("");
}

function populateWarehouseDropdowns() {
  const fromSelect = document.getElementById("mv_fromWarehouse");
  const toSelect = document.getElementById("mv_toWarehouse");

  const options = mvWarehouses
    .map((w) => `<option value="${w.id}">${escapeHtml(w.name)}</option>`)
    .join("");

  if (fromSelect)
    fromSelect.innerHTML =
      '<option value="">Select source warehouse</option>' + options;
  if (toSelect)
    toSelect.innerHTML =
      '<option value="">Select destination warehouse</option>' + options;
}

function onProductSelect() {
  const productId = document.getElementById("mv_product").value;
  const infoBox = document.getElementById("mv_stockInfo");
  const stockEl = document.getElementById("mv_currentStock");

  if (!productId) {
    infoBox.style.display = "none";
    return;
  }

  const p = mvProducts.find((item) => item.id === productId);
  if (p) {
    infoBox.style.display = "block";
    stockEl.textContent = `${p.quantity} units`;

    // Auto-select current warehouse as From Warehouse
    const fromWh = document.getElementById("mv_fromWarehouse");
    if (fromWh && p.warehouseId) {
      fromWh.value = p.warehouseId;
    }
  }
}

function onTypeChange() {
  const type = document.getElementById("mv_type").value;
  const fromGroup = document.getElementById("mv_fromWh_group");
  const toGroup = document.getElementById("mv_toWh_group");
  const qtyLabel = document.getElementById("mv_qtyLabel");

  if (type === "Stock In") {
    fromGroup.style.display = "none";
    toGroup.style.display = "block";
    qtyLabel.textContent = "Units Received *";
  } else if (type === "Stock Out") {
    fromGroup.style.display = "block";
    toGroup.style.display = "none";
    qtyLabel.textContent = "Units Dispatched *";
  } else if (type === "Transfer") {
    fromGroup.style.display = "block";
    toGroup.style.display = "block";
    qtyLabel.textContent = "Units to Transfer *";
  } else {
    // Adjustment
    fromGroup.style.display = "block";
    toGroup.style.display = "none";
    qtyLabel.textContent = "New Total Count / Units *";
  }
}

// ─── Save Movement ────────────────────────────────────────────────────────────
function saveMovement() {
  clearErrors();
  let isValid = true;

  const productId = document.getElementById("mv_product").value;
  const type = document.getElementById("mv_type").value;
  const qtyRaw = document.getElementById("mv_quantity").value;
  const fromWh = document.getElementById("mv_fromWarehouse").value;
  const toWh = document.getElementById("mv_toWarehouse").value;
  const notes = document.getElementById("mv_notes").value.trim();

  // Validate product
  if (!productId) {
    document.getElementById("mv_product").classList.add("is-invalid");
    document.getElementById("mv_product_err").textContent =
      "Please select a product.";
    isValid = false;
  }

  // Validate quantity
  const qty = parseInt(qtyRaw, 10);
  if (isNaN(qty) || (qty <= 0 && type !== "Adjustment")) {
    document.getElementById("mv_quantity").classList.add("is-invalid");
    document.getElementById("mv_qty_err").textContent =
      "Quantity must be greater than zero.";
    isValid = false;
  }

  const product = mvProducts.find((p) => p.id === productId);
  if (!product) return;

  const currentQty = Number(product.quantity) || 0;

  // Check sufficient stock for Stock Out / Transfer
  if ((type === "Stock Out" || type === "Transfer") && qty > currentQty) {
    document.getElementById("mv_quantity").classList.add("is-invalid");
    document.getElementById("mv_qty_err").textContent =
      `Insufficient stock! Only ${currentQty} units available.`;
    isValid = false;
  }

  // Check destination warehouse for Transfer
  if (type === "Transfer" && !toWh) {
    document.getElementById("mv_toWarehouse").classList.add("is-invalid");
    document.getElementById("mv_toWh_err").textContent =
      "Please select a destination warehouse.";
    isValid = false;
  }

  if (type === "Transfer" && fromWh && fromWh === toWh) {
    document.getElementById("mv_toWarehouse").classList.add("is-invalid");
    document.getElementById("mv_toWh_err").textContent =
      "Source and destination warehouses must be different.";
    isValid = false;
  }

  if (!isValid) return;

  // Calculate new product quantity
  let newQuantity = currentQty;
  if (type === "Stock In") {
    newQuantity = currentQty + qty;
  } else if (type === "Stock Out") {
    newQuantity = currentQty - qty;
  } else if (type === "Adjustment") {
    newQuantity = qty;
  }
  // For Transfer, quantity remains same unless cross-warehouse quantities are split,
  // but we update the product's assigned warehouseId to toWh
  if (type === "Transfer") {
    product.warehouseId = toWh;
  }

  product.quantity = newQuantity;
  product.updatedAt = new Date().toISOString();

  // Save updated product
  localStorage.setItem("smartstock_products", JSON.stringify(mvProducts));

  // Create movement record
  const currentUser = JSON.parse(
    localStorage.getItem("smartstock_current_user") || "{}",
  );
  const newMovement = {
    id: "mov_" + generateId(),
    date: new Date().toISOString(),
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    type,
    quantity: type === "Adjustment" ? Math.abs(qty - currentQty) : qty,
    fromWarehouseId: fromWh,
    toWarehouseId: toWh,
    notes,
    user: currentUser.name || "System Admin",
    status: "Completed",
  };

  allMovements.unshift(newMovement);
  localStorage.setItem("smartstock_movements", JSON.stringify(allMovements));

  showToast(
    `Recorded ${type} of ${qty} units for "${product.name}".`,
    "success",
  );
  closeMovementModal();
  loadMovements();
}

// DOM Ready
document.addEventListener("DOMContentLoaded", initMovements);
