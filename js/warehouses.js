/**
 * warehouses.js – SmartStock Warehouse Management
 * Handles full CRUD for warehouses with occupancy metrics.
 */

/* ─── Module State ───────────────────────────────────────────── */
let allWarehouses = [];
let pendingDeleteWHId = null;

/* ─── Initialisation ─────────────────────────────────────────── */
function initWarehouses() {
  if (typeof requireAuth === "function") requireAuth();
  if (typeof initDemoData === "function") initDemoData();
  if (typeof renderSidebar === "function") renderSidebar("warehouses");
  if (typeof renderNavbar === "function") renderNavbar();
  loadWarehouses();
}

/* ─── Data Loading ───────────────────────────────────────────── */
function loadWarehouses() {
  allWarehouses =
    typeof getWarehouses === "function"
      ? getWarehouses()
      : JSON.parse(localStorage.getItem("smartstock_warehouses") || "[]");
  filterWarehouses();
}

/* ─── Filtering ──────────────────────────────────────────────── */
function filterWarehouses() {
  const query = (document.getElementById("searchWarehouses")?.value || "")
    .toLowerCase()
    .trim();
  const status = document.getElementById("filterWarehouseStatus")?.value || "";

  const filtered = allWarehouses.filter((w) => {
    const matchSearch =
      !query ||
      (w.name || "").toLowerCase().includes(query) ||
      (w.location || "").toLowerCase().includes(query) ||
      (w.manager || "").toLowerCase().includes(query);

    const matchStatus = !status || w.status === status;

    return matchSearch && matchStatus;
  });

  renderWarehouseCards(filtered);
}

/* ─── Render Cards ───────────────────────────────────────────── */
function renderWarehouseCards(warehouses) {
  const grid = document.getElementById("warehousesGrid");
  const emptyState = document.getElementById("warehousesEmptyState");
  const countEl = document.getElementById("warehouseCount");

  if (!grid) return;

  // Update count label
  if (countEl) {
    const total = allWarehouses.length;
    const shown = warehouses.length;
    countEl.textContent =
      shown === total
        ? `${total} warehouse${total !== 1 ? "s" : ""}`
        : `${shown} of ${total} warehouses`;
  }

  if (warehouses.length === 0) {
    grid.innerHTML = "";
    if (emptyState) emptyState.style.display = "flex";
    return;
  }
  if (emptyState) emptyState.style.display = "none";

  const allProducts = _whGetProducts();

  grid.innerHTML = warehouses
    .map((w) => {
      const statusActive = w.status === "Active";
      const badgeCls = statusActive ? "badge-success" : "badge-secondary";
      const avatarColor = _whAvatarColor(w.name || "");
      const initial = (w.name || "?").charAt(0).toUpperCase();
      const capacity = parseInt(w.capacity) || 0;

      // Products linked to this warehouse
      const linkedProducts = allProducts.filter((p) => p.warehouseId === w.id);
      const totalProducts = linkedProducts.length;
      const totalUnits = linkedProducts.reduce(
        (sum, p) => sum + (parseInt(p.quantity) || 0),
        0,
      );

      // Occupancy calculation
      const occupancyPct =
        capacity > 0
          ? Math.min(Math.round((totalUnits / capacity) * 100), 100)
          : 0;
      const occupancyColor =
        occupancyPct >= 90
          ? "#ef4444"
          : occupancyPct >= 70
            ? "#f97316"
            : "#22c55e";

      const managerHtml = w.manager
        ? `<div class="wh-detail">
           <i class="fas fa-user-tie detail-icon"></i>
           <span class="detail-text">${_whEsc(w.manager)}</span>
         </div>`
        : `<div class="wh-detail">
           <i class="fas fa-user-tie detail-icon"></i>
           <span class="detail-text" style="color:#94a3b8">No manager assigned</span>
         </div>`;

      const capacityDisplay =
        capacity > 0
          ? `${capacity.toLocaleString()} units`
          : '<span style="color:#94a3b8">Not set</span>';

      return `
      <div class="card warehouse-card" style="transition:box-shadow .2s;cursor:default"
           onmouseenter="this.style.boxShadow='0 8px 30px rgba(0,0,0,.12)'"
           onmouseleave="this.style.boxShadow=''">

        <!-- Card Top -->
        <div style="display:flex;align-items:flex-start;gap:1rem;padding:1.25rem 1.25rem .75rem">
          <div style="
            width:52px;height:52px;border-radius:12px;
            background:${avatarColor};
            display:flex;align-items:center;justify-content:center;
            font-size:1.4rem;font-weight:700;color:#fff;flex-shrink:0">
            ${initial}
          </div>
          <div style="flex:1;min-width:0">
            <h6 class="mb-1" style="font-weight:600;font-size:1rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${_whEsc(w.name)}">
              ${_whEsc(w.name)}
            </h6>
            <div style="display:flex;align-items:center;gap:.5rem;flex-wrap:wrap">
              <span style="font-size:.8rem;color:#64748b">
                <i class="fas fa-map-marker-alt" style="margin-right:3px;color:#94a3b8"></i>${_whEsc(w.location)}
              </span>
              <span class="badge ${badgeCls}">${_whEsc(w.status)}</span>
            </div>
          </div>
        </div>

        <!-- Card Body -->
        <div class="card-body" style="padding:.75rem 1.25rem">
          ${managerHtml}

          <!-- Capacity -->
          <div class="wh-detail">
            <i class="fas fa-database detail-icon"></i>
            <span class="detail-text">Capacity: <strong>${capacityDisplay}</strong></span>
          </div>

          <!-- Products & Units -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin:.75rem 0">
            <div style="background:#f8fafc;border-radius:8px;padding:.6rem .75rem;text-align:center">
              <div style="font-size:1.3rem;font-weight:700;color:#1e293b">${totalProducts}</div>
              <div style="font-size:.72rem;color:#64748b">Products</div>
            </div>
            <div style="background:#f8fafc;border-radius:8px;padding:.6rem .75rem;text-align:center">
              <div style="font-size:1.3rem;font-weight:700;color:#1e293b">${totalUnits.toLocaleString()}</div>
              <div style="font-size:.72rem;color:#64748b">Total Units</div>
            </div>
          </div>

          <!-- Occupancy Bar -->
          ${
            capacity > 0
              ? `
          <div style="margin-top:.5rem">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.3rem">
              <span style="font-size:.78rem;color:#64748b;font-weight:500">Occupancy</span>
              <span style="font-size:.78rem;font-weight:600;color:${occupancyColor}">${occupancyPct}%</span>
            </div>
            <div style="height:8px;background:#e2e8f0;border-radius:99px;overflow:hidden">
              <div style="height:100%;width:${occupancyPct}%;background:${occupancyColor};border-radius:99px;transition:width .4s ease"></div>
            </div>
            <div style="font-size:.7rem;color:#94a3b8;margin-top:.25rem">
              ${totalUnits.toLocaleString()} / ${capacity.toLocaleString()} units used
            </div>
          </div>`
              : `
          <div style="margin-top:.5rem;font-size:.78rem;color:#94a3b8">
            <i class="fas fa-info-circle me-1"></i>Set capacity to see occupancy
          </div>`
          }
        </div>

        <!-- Card Footer -->
        <div style="display:flex;gap:.5rem;padding:.75rem 1.25rem;border-top:1px solid #f1f5f9">
          <button
            onclick="openEditWarehouseModal('${w.id}')"
            title="Edit Warehouse"
            style="flex:1;padding:6px 12px;border-radius:8px;border:1px solid #e2e8f0;background:white;cursor:pointer;font-size:.8rem;font-weight:500;color:#475569;display:flex;align-items:center;justify-content:center;gap:.4rem;transition:all .2s"
            onmouseenter="this.style.background='#f8fafc'"
            onmouseleave="this.style.background='white'">
            <i class="fas fa-pen"></i> Edit
          </button>
          <button
            onclick="openDeleteWarehouseModal('${w.id}', '${_whEsc(w.name)}')"
            title="Delete Warehouse"
            style="flex:1;padding:6px 12px;border-radius:8px;border:1px solid #fee2e2;background:white;cursor:pointer;font-size:.8rem;font-weight:500;color:#ef4444;display:flex;align-items:center;justify-content:center;gap:.4rem;transition:all .2s"
            onmouseenter="this.style.background='#fff5f5'"
            onmouseleave="this.style.background='white'">
            <i class="fas fa-trash-alt"></i> Delete
          </button>
        </div>
      </div>`;
    })
    .join("");
}

/* ─── Add Modal ──────────────────────────────────────────────── */
function openAddWarehouseModal() {
  _clearWarehouseForm();
  document.getElementById("warehouseModalTitle").textContent = "Add Warehouse";
  document.getElementById("wm_id").value = "";
  _whShowModal("warehouseModal");
}

/* ─── Edit Modal ─────────────────────────────────────────────── */
function openEditWarehouseModal(id) {
  const warehouse = allWarehouses.find((w) => w.id === id);
  if (!warehouse) return;

  _clearWarehouseForm();
  document.getElementById("warehouseModalTitle").textContent = "Edit Warehouse";
  document.getElementById("wm_id").value = warehouse.id;
  document.getElementById("wm_name").value = warehouse.name || "";
  document.getElementById("wm_location").value = warehouse.location || "";
  document.getElementById("wm_manager").value = warehouse.manager || "";
  document.getElementById("wm_capacity").value =
    warehouse.capacity !== undefined ? warehouse.capacity : "";
  document.getElementById("wm_status").value = warehouse.status || "Active";

  _whShowModal("warehouseModal");
}

/* ─── Close Modal ────────────────────────────────────────────── */
function closeWarehouseModal() {
  _whHideModal("warehouseModal");
  _clearWarehouseForm();
}

/* ─── Save (Add / Edit) ──────────────────────────────────────── */
function saveWarehouse() {
  if (!_validateWarehouseForm()) return;

  const id = document.getElementById("wm_id").value.trim();
  const name = document.getElementById("wm_name").value.trim();
  const location = document.getElementById("wm_location").value.trim();
  const manager = document.getElementById("wm_manager").value.trim();
  const capacity = document.getElementById("wm_capacity").value.trim();
  const status = document.getElementById("wm_status").value;

  let warehouses = _getRawWarehouses();

  if (id) {
    // Edit existing
    const idx = warehouses.findIndex((w) => w.id === id);
    if (idx !== -1) {
      warehouses[idx] = {
        ...warehouses[idx],
        name,
        location,
        manager,
        capacity: capacity !== "" ? parseInt(capacity) : 0,
        status,
        updatedAt: new Date().toISOString(),
      };
    }
    _saveWarehouses(warehouses);
    _whShowToast("Warehouse updated successfully!", "success");
  } else {
    // Add new
    const newWarehouse = {
      id: _whGenerateId(),
      name,
      location,
      manager,
      capacity: capacity !== "" ? parseInt(capacity) : 0,
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    warehouses.push(newWarehouse);
    _saveWarehouses(warehouses);
    _whShowToast("Warehouse added successfully!", "success");
  }

  closeWarehouseModal();
  loadWarehouses();
}

/* ─── Delete Confirm Modal ───────────────────────────────────── */
function openDeleteWarehouseModal(id, name) {
  pendingDeleteWHId = id;
  const nameEl = document.getElementById("deleteWarehouseName");
  if (nameEl) nameEl.textContent = name;
  _whShowModal("deleteWarehouseModal");
}

function closeDeleteWarehouseModal() {
  pendingDeleteWHId = null;
  _whHideModal("deleteWarehouseModal");
}

function confirmDeleteWarehouse() {
  if (!pendingDeleteWHId) return;
  const deletedId = pendingDeleteWHId;
  let warehouses = _getRawWarehouses().filter((w) => w.id !== deletedId);
  _saveWarehouses(warehouses);

  // Safely detach deleted warehouse from associated products
  try {
    const products = _whGetProducts();
    let updated = false;
    products.forEach((p) => {
      if (p.warehouseId === deletedId) {
        p.warehouseId = "";
        updated = true;
      }
    });
    if (updated) {
      if (typeof saveProducts === "function") saveProducts(products);
      else
        localStorage.setItem("smartstock_products", JSON.stringify(products));
    }
  } catch (e) {
    console.warn("[SmartStock] Cascade clear warehouse error:", e);
  }

  _whShowToast("Warehouse deleted successfully.", "success");
  closeDeleteWarehouseModal();
  loadWarehouses();
}

/* ─── Form Helpers ───────────────────────────────────────────── */
function _clearWarehouseForm() {
  ["wm_name", "wm_location", "wm_manager", "wm_capacity"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.value = "";
      el.classList.remove("is-invalid");
    }
  });
  const statusEl = document.getElementById("wm_status");
  if (statusEl) statusEl.value = "Active";
  ["wm_name_err", "wm_location_err"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = "";
  });
}

function _validateWarehouseForm() {
  let valid = true;

  const name = document.getElementById("wm_name").value.trim();
  const location = document.getElementById("wm_location").value.trim();

  _whClearFieldError("wm_name", "wm_name_err");
  _whClearFieldError("wm_location", "wm_location_err");

  if (!name) {
    _whSetFieldError("wm_name", "wm_name_err", "Warehouse name is required.");
    valid = false;
  }
  if (!location) {
    _whSetFieldError("wm_location", "wm_location_err", "Location is required.");
    valid = false;
  }

  return valid;
}

function _whSetFieldError(inputId, errId, msg) {
  const el = document.getElementById(inputId);
  if (el) el.classList.add("is-invalid");
  const errEl = document.getElementById(errId);
  if (errEl) errEl.textContent = msg;
}

function _whClearFieldError(inputId, errId) {
  const el = document.getElementById(inputId);
  if (el) el.classList.remove("is-invalid");
  const errEl = document.getElementById(errId);
  if (errEl) errEl.textContent = "";
}

/* ─── Storage Helpers ────────────────────────────────────────── */
function _getRawWarehouses() {
  if (typeof getWarehouses === "function") return getWarehouses();
  return JSON.parse(localStorage.getItem("smartstock_warehouses") || "[]");
}

function _saveWarehouses(warehouses) {
  if (typeof saveWarehouses === "function") return saveWarehouses(warehouses);
  localStorage.setItem("smartstock_warehouses", JSON.stringify(warehouses));
}

function _whGetProducts() {
  if (typeof getProducts === "function") return getProducts();
  return JSON.parse(localStorage.getItem("smartstock_products") || "[]");
}

function _whGenerateId() {
  if (typeof generateId === "function") return generateId();
  return "wh_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
}

/* ─── UI Helpers ─────────────────────────────────────────────── */
function _whShowModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.style.display = "flex";
    el.style.alignItems = "center";
    el.style.justifyContent = "center";
  }
}

function _whHideModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = "none";
}

function _whShowToast(message, type = "success") {
  if (typeof showToast === "function") return showToast(message, type);
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const icon = type === "success" ? "fa-check-circle" : "fa-exclamation-circle";
  const color = type === "success" ? "#22c55e" : "#ef4444";
  const toast = document.createElement("div");
  toast.className = "toast-message";
  toast.innerHTML = `<i class="fas ${icon}" style="color:${color}"></i> ${message}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

function _whEsc(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function _whAvatarColor(name) {
  const colors = [
    "#6366f1",
    "#8b5cf6",
    "#ec4899",
    "#ef4444",
    "#f97316",
    "#eab308",
    "#22c55e",
    "#14b8a6",
    "#0ea5e9",
    "#3b82f6",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

/* ─── Boot ───────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", initWarehouses);
