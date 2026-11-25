/**
 * SmartStock - Inventory Management Module
 * Handles inventory overview, stock metrics, real-time stock bar computation,
 * and quick stock in / stock out / adjustment transactions.
 */

"use strict";

let invProducts = [];
let invWarehouses = [];
let invSuppliers = [];

// ─── Initialisation ───────────────────────────────────────────────────────────
function initInventory() {
  if (typeof requireAuth === "function") requireAuth();
  if (typeof initDemoData === "function") initDemoData();
  if (typeof renderSidebar === "function") renderSidebar("inventory");
  if (typeof renderNavbar === "function") renderNavbar();

  loadInventory();
  populateWarehouseFilter();

  // Attach live calculation listener on modal
  const qtyInput = document.getElementById("su_qty");
  if (qtyInput) {
    qtyInput.addEventListener("input", calculateProjectedStock);
  }
}

// ─── Data Loading & Metrics ───────────────────────────────────────────────────
function loadInventory() {
  invProducts = JSON.parse(localStorage.getItem("smartstock_products") || "[]");
  invWarehouses = JSON.parse(
    localStorage.getItem("smartstock_warehouses") || "[]",
  );
  invSuppliers = JSON.parse(
    localStorage.getItem("smartstock_suppliers") || "[]",
  );

  renderInventorySummary();
  filterInventory();
}

function renderInventorySummary() {
  const totalProducts = invProducts.length;
  let totalUnits = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  invProducts.forEach((p) => {
    const qty = Number(p.quantity) || 0;
    const min = Number(p.minStock) || 0;
    totalUnits += qty;

    if (qty === 0) outOfStockCount++;
    else if (qty <= min) lowStockCount++;
  });

  const tpEl = document.getElementById("invTotalProducts");
  const tuEl = document.getElementById("invTotalUnits");
  const lsEl = document.getElementById("invLowStock");
  const osEl = document.getElementById("invOutOfStock");

  if (typeof animateCounter === "function") {
    animateCounter(tpEl, totalProducts);
    animateCounter(tuEl, totalUnits);
    animateCounter(lsEl, lowStockCount);
    animateCounter(osEl, outOfStockCount);
  } else {
    if (tpEl) tpEl.textContent = totalProducts.toLocaleString("en-IN");
    if (tuEl) tuEl.textContent = totalUnits.toLocaleString("en-IN");
    if (lsEl) lsEl.textContent = lowStockCount.toLocaleString("en-IN");
    if (osEl) osEl.textContent = outOfStockCount.toLocaleString("en-IN");
  }
}

function populateWarehouseFilter() {
  const select = document.getElementById("filterWarehouse");
  if (!select) return;
  const current = select.value;
  select.innerHTML =
    '<option value="">All Warehouses</option>' +
    invWarehouses
      .map((w) => `<option value="${w.id}">${escapeHtml(w.name)}</option>`)
      .join("");
  select.value = current;
}

// ─── Filtering ────────────────────────────────────────────────────────────────
function filterInventory() {
  const query = (document.getElementById("searchInventory")?.value || "")
    .toLowerCase()
    .trim();
  const category = document.getElementById("filterCategory")?.value || "";
  const status = document.getElementById("filterStatus")?.value || "";
  const warehouse = document.getElementById("filterWarehouse")?.value || "";

  const filtered = invProducts.filter((p) => {
    const matchQuery =
      !query ||
      (p.name && p.name.toLowerCase().includes(query)) ||
      (p.sku && p.sku.toLowerCase().includes(query)) ||
      (p.category && p.category.toLowerCase().includes(query));

    const matchCategory = !category || p.category === category;
    const matchWarehouse = !warehouse || p.warehouseId === warehouse;

    let itemStatus = "In Stock";
    if (Number(p.quantity) === 0) itemStatus = "Out of Stock";
    else if (Number(p.quantity) <= Number(p.minStock)) itemStatus = "Low Stock";

    const matchStatus = !status || itemStatus === status;

    return matchQuery && matchCategory && matchWarehouse && matchStatus;
  });

  renderInventoryTable(filtered);
}

// ─── Table Rendering ─────────────────────────────────────────────────────────
function renderInventoryTable(products) {
  const tbody = document.getElementById("inventoryTableBody");
  const emptyState = document.getElementById("inventoryEmptyState");
  const countEl = document.getElementById("inventoryCount");
  if (!tbody) return;

  if (countEl) {
    countEl.textContent = `Showing ${products.length} of ${invProducts.length} items`;
  }

  if (products.length === 0) {
    tbody.innerHTML = "";
    if (emptyState) emptyState.style.display = "block";
    return;
  }

  if (emptyState) emptyState.style.display = "none";

  const warehouseMap = {};
  invWarehouses.forEach((w) => {
    warehouseMap[w.id] = w.name;
  });

  const catIcons = {
    Electronics: "fas fa-laptop",
    Grocery: "fas fa-bowl-rice",
    Clothing: "fas fa-shirt",
    Stationery: "fas fa-pen-ruler",
    Home: "fas fa-house",
    Other: "fas fa-box",
  };

  tbody.innerHTML = products
    .map((p) => {
      const qty = Number(p.quantity) || 0;
      const min = Number(p.minStock) || 0;
      const whName = warehouseMap[p.warehouseId] || "Main Depot";

      let statusText = "In Stock";
      let statusClass = "badge-success";
      let fillClass = "healthy";

      if (qty === 0) {
        statusText = "Out of Stock";
        statusClass = "badge-danger";
        fillClass = "out";
      } else if (qty <= min) {
        statusText = "Low Stock";
        statusClass = "badge-warning";
        fillClass = "low";
      }

      // Progress bar percent
      const ceiling = Math.max(min * 2.5, 50);
      const percent = Math.min(Math.round((qty / ceiling) * 100), 100);

      const iconClass = catIcons[p.category] || "fas fa-box";

      return `
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:12px">
            <div class="product-image-placeholder">
              <i class="${iconClass}"></i>
            </div>
            <div>
              <div style="font-weight:600; color:var(--text-primary)">${escapeHtml(p.name)}</div>
              <div style="font-size:0.75rem; color:var(--text-secondary)">₹${(Number(p.price) || 0).toLocaleString("en-IN")}</div>
            </div>
          </div>
        </td>
        <td>
          <span style="font-family:monospace; font-size:0.8rem; font-weight:700; background:var(--gray-100); padding:3px 8px; border-radius:4px">
            ${escapeHtml(p.sku)}
          </span>
        </td>
        <td><span class="badge badge-info">${escapeHtml(p.category)}</span></td>
        <td style="font-weight:700; font-size:0.95rem; color:var(--text-primary)">
          ${qty.toLocaleString("en-IN")} units
        </td>
        <td style="color:var(--text-secondary)">${min} units</td>
        <td>
          <div style="display:flex; align-items:center; gap:8px">
            <div class="stock-bar" style="width:90px">
              <div class="stock-bar-fill ${fillClass}" style="width:${percent}%"></div>
            </div>
            <span style="font-size:0.75rem; color:var(--text-secondary); width:32px">${percent}%</span>
          </div>
        </td>
        <td>
          <span class="badge" style="background:var(--gray-100); color:var(--gray-700)">
            <i class="fas fa-warehouse me-1 text-muted"></i>${escapeHtml(whName)}
          </span>
        </td>
        <td><span class="badge ${statusClass}">${statusText}</span></td>
        <td>
          <div class="table-actions" style="justify-content:flex-end">
            <button class="btn-primary btn-sm" onclick="openStockUpdateModal('${p.id}')" title="Adjust Stock">
              <i class="fas fa-arrow-up-right-from-square me-1"></i> Update
            </button>
            <button class="btn-icon" onclick="window.location.href='products.html?search=${encodeURIComponent(p.sku)}'" title="View in Catalog" style="color:var(--gray-600); background:var(--gray-100)">
              <i class="fas fa-arrow-right"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
    })
    .join("");
}

// ─── Stock Update Modal ───────────────────────────────────────────────────────
let activeStockProduct = null;

function openStockUpdateModal(productId) {
  activeStockProduct = invProducts.find((p) => p.id === productId);
  if (!activeStockProduct) return;

  document.getElementById("su_productId").value = activeStockProduct.id;
  document.getElementById("su_productName").textContent =
    activeStockProduct.name;
  document.getElementById("su_sku").textContent = activeStockProduct.sku;
  document.getElementById("su_currentQty").textContent =
    activeStockProduct.quantity;

  document.getElementById("su_actionType").value = "Stock In";
  document.getElementById("su_qty").value = "";
  document.getElementById("su_notes").value = "";

  const errEl = document.getElementById("su_qty_err");
  if (errEl) errEl.textContent = "";
  document.getElementById("su_qty").classList.remove("is-invalid");

  onActionTypeChange();
  calculateProjectedStock();

  document.getElementById("stockUpdateModal").style.display = "flex";
}

function closeStockUpdateModal() {
  activeStockProduct = null;
  document.getElementById("stockUpdateModal").style.display = "none";
}

function onActionTypeChange() {
  const action = document.getElementById("su_actionType").value;
  const label = document.getElementById("su_qtyLabel");
  const qtyInput = document.getElementById("su_qty");

  if (action === "Stock In") {
    label.textContent = "Units to Add *";
    qtyInput.placeholder = "e.g. 50";
  } else if (action === "Stock Out") {
    label.textContent = "Units to Remove *";
    qtyInput.placeholder = "e.g. 20";
  } else {
    label.textContent = "New Exact Total Quantity *";
    qtyInput.placeholder = "e.g. 150";
  }

  calculateProjectedStock();
}

function calculateProjectedStock() {
  if (!activeStockProduct) return;

  const current = Number(activeStockProduct.quantity) || 0;
  const action = document.getElementById("su_actionType").value;
  const val = parseInt(document.getElementById("su_qty").value, 10);
  const projEl = document.getElementById("su_projectedQty");

  if (isNaN(val) || val < 0) {
    projEl.textContent = current;
    return;
  }

  let projected = current;
  if (action === "Stock In") {
    projected = current + val;
  } else if (action === "Stock Out") {
    projected = Math.max(current - val, 0);
  } else {
    projected = val;
  }

  projEl.textContent = projected;
}

function applyStockUpdate() {
  if (!activeStockProduct) return;

  const current = Number(activeStockProduct.quantity) || 0;
  const action = document.getElementById("su_actionType").value;
  const qtyInput = document.getElementById("su_qty");
  const errEl = document.getElementById("su_qty_err");
  const notes = document.getElementById("su_notes").value.trim();

  qtyInput.classList.remove("is-invalid");
  if (errEl) errEl.textContent = "";

  const val = parseInt(qtyInput.value, 10);
  if (isNaN(val) || (val <= 0 && action !== "Adjustment")) {
    qtyInput.classList.add("is-invalid");
    if (errEl)
      errEl.textContent = "Please enter a valid quantity greater than zero.";
    return;
  }

  if (action === "Stock Out" && val > current) {
    qtyInput.classList.add("is-invalid");
    if (errEl)
      errEl.textContent = `Cannot dispatch ${val} units. Only ${current} units available in stock.`;
    return;
  }

  let newQty = current;
  let movementQuantity = val;

  if (action === "Stock In") {
    newQty = current + val;
  } else if (action === "Stock Out") {
    newQty = current - val;
  } else {
    newQty = val;
    movementQuantity = Math.abs(val - current);
  }

  // Update product quantity in list
  const idx = invProducts.findIndex((p) => p.id === activeStockProduct.id);
  if (idx !== -1) {
    invProducts[idx].quantity = newQty;
    invProducts[idx].updatedAt = new Date().toISOString();
    localStorage.setItem("smartstock_products", JSON.stringify(invProducts));

    // Create stock movement record
    const movements = JSON.parse(
      localStorage.getItem("smartstock_movements") || "[]",
    );
    const currentUser = JSON.parse(
      localStorage.getItem("smartstock_current_user") || "{}",
    );

    movements.unshift({
      id: "mov_" + generateId(),
      date: new Date().toISOString(),
      productId: activeStockProduct.id,
      productName: activeStockProduct.name,
      sku: activeStockProduct.sku,
      type: action,
      quantity: movementQuantity,
      fromWarehouseId:
        action === "Stock Out" ? activeStockProduct.warehouseId || "" : "",
      toWarehouseId:
        action === "Stock In" ? activeStockProduct.warehouseId || "" : "",
      notes: notes || `Quick update via Inventory page (${action})`,
      user: currentUser.name || "System Admin",
      status: "Completed",
    });

    localStorage.setItem("smartstock_movements", JSON.stringify(movements));

    // Update notifications if stock condition changed
    updateInventoryNotifications(invProducts[idx]);

    showToast(
      `Updated stock for "${activeStockProduct.name}" to ${newQty} units.`,
      "success",
    );
    closeStockUpdateModal();
    loadInventory();
  }
}

function updateInventoryNotifications(product) {
  const notifications = JSON.parse(
    localStorage.getItem("smartstock_notifications") || "[]",
  );
  const qty = Number(product.quantity);
  const min = Number(product.minStock);

  if (qty === 0) {
    notifications.unshift({
      id: "notif_" + generateId(),
      productId: product.id,
      title: "Out of Stock Alert",
      message: `${product.name} is now out of stock!`,
      type: "danger",
      read: false,
      createdAt: new Date().toISOString(),
      link: "inventory.html",
    });
  } else if (qty <= min) {
    notifications.unshift({
      id: "notif_" + generateId(),
      productId: product.id,
      title: "Low Stock Alert",
      message: `${product.name} reached low stock (${qty} units left, min: ${min}).`,
      type: "warning",
      read: false,
      createdAt: new Date().toISOString(),
      link: "inventory.html",
    });
  }

  localStorage.setItem(
    "smartstock_notifications",
    JSON.stringify(notifications),
  );
}

// DOM Ready
document.addEventListener("DOMContentLoaded", initInventory);
