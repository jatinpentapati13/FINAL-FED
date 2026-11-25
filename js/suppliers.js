/**
 * suppliers.js – SmartStock Supplier Management
 * Handles full CRUD for suppliers with card-based UI.
 */

/* ─── Module State ───────────────────────────────────────────── */
let allSuppliers = [];
let pendingDeleteId = null;

/* ─── Initialisation ─────────────────────────────────────────── */
function initSuppliers() {
  if (typeof requireAuth === "function") requireAuth();
  if (typeof initDemoData === "function") initDemoData();
  if (typeof renderSidebar === "function") renderSidebar("suppliers");
  if (typeof renderNavbar === "function") renderNavbar();
  loadSuppliers();
}

/* ─── Data Loading ───────────────────────────────────────────── */
function loadSuppliers() {
  allSuppliers =
    typeof Storage !== "undefined" && typeof getSuppliers === "function"
      ? getSuppliers()
      : JSON.parse(localStorage.getItem("smartstock_suppliers") || "[]");
  filterSuppliers();
}

/* ─── Filtering ──────────────────────────────────────────────── */
function filterSuppliers() {
  const query = (document.getElementById("searchSuppliers")?.value || "")
    .toLowerCase()
    .trim();
  const status = document.getElementById("filterSupplierStatus")?.value || "";

  const filtered = allSuppliers.filter((s) => {
    const matchSearch =
      !query ||
      (s.name || "").toLowerCase().includes(query) ||
      (s.contactPerson || "").toLowerCase().includes(query) ||
      (s.email || "").toLowerCase().includes(query) ||
      (s.phone || "").toLowerCase().includes(query) ||
      (s.address || "").toLowerCase().includes(query);

    const matchStatus = !status || s.status === status;

    return matchSearch && matchStatus;
  });

  renderSupplierCards(filtered);
}

/* ─── Render Cards ───────────────────────────────────────────── */
function renderSupplierCards(suppliers) {
  const grid = document.getElementById("suppliersGrid");
  const emptyState = document.getElementById("suppliersEmptyState");
  const countEl = document.getElementById("supplierCount");

  if (!grid) return;

  // Update count label
  if (countEl) {
    const total = allSuppliers.length;
    const shown = suppliers.length;
    countEl.textContent =
      shown === total
        ? `${total} supplier${total !== 1 ? "s" : ""}`
        : `${shown} of ${total} suppliers`;
  }

  if (suppliers.length === 0) {
    grid.innerHTML = "";
    if (emptyState) emptyState.style.display = "flex";
    return;
  }
  if (emptyState) emptyState.style.display = "none";

  // Fetch products once for count calculation
  const allProducts = _getProducts();

  grid.innerHTML = suppliers
    .map((s) => {
      const initial = (s.name || "?").charAt(0).toUpperCase();
      const statusActive = s.status === "Active";
      const badgeCls = statusActive ? "badge-success" : "badge-secondary";
      const avatarColor = _avatarColor(s.name || "");

      const productCount = allProducts.filter(
        (p) => p.supplierId === s.id,
      ).length;

      const addressHtml = s.address
        ? `<div class="supplier-detail">
           <i class="fas fa-map-marker-alt detail-icon"></i>
           <span class="detail-text">${_esc(s.address)}</span>
         </div>`
        : "";

      return `
      <div class="card supplier-card" style="transition:box-shadow .2s;cursor:default"
           onmouseenter="this.style.boxShadow='0 8px 30px rgba(0,0,0,.12)'"
           onmouseleave="this.style.boxShadow=''">

        <!-- Card Top -->
        <div class="supplier-card-top" style="display:flex;align-items:center;gap:1rem;padding:1.25rem 1.25rem .75rem">
          <div class="supplier-avatar" style="
            width:52px;height:52px;border-radius:50%;
            background:${avatarColor};
            display:flex;align-items:center;justify-content:center;
            font-size:1.4rem;font-weight:700;color:#fff;flex-shrink:0">
            ${initial}
          </div>
          <div style="flex:1;min-width:0">
            <h6 class="mb-1" style="font-weight:600;font-size:1rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${_esc(s.name)}">
              ${_esc(s.name)}
            </h6>
            <span class="badge ${badgeCls}">${_esc(s.status)}</span>
          </div>
        </div>

        <!-- Card Body -->
        <div class="card-body" style="padding:.75rem 1.25rem">
          <div class="supplier-detail">
            <i class="fas fa-user detail-icon"></i>
            <span class="detail-text">${_esc(s.contactPerson || "—")}</span>
          </div>
          <div class="supplier-detail">
            <i class="fas fa-envelope detail-icon"></i>
            <a href="mailto:${_esc(s.email)}" class="detail-text" style="color:inherit;text-decoration:none"
               onmouseenter="this.style.textDecoration='underline'"
               onmouseleave="this.style.textDecoration='none'">
              ${_esc(s.email || "—")}
            </a>
          </div>
          <div class="supplier-detail">
            <i class="fas fa-phone detail-icon"></i>
            <span class="detail-text">${_esc(s.phone || "—")}</span>
          </div>
          ${addressHtml}
          <div class="supplier-detail" style="margin-top:.5rem;padding-top:.5rem;border-top:1px solid #f1f5f9">
            <i class="fas fa-boxes detail-icon"></i>
            <span class="detail-text"><strong>${productCount}</strong> product${productCount !== 1 ? "s" : ""} linked</span>
          </div>
        </div>

        <!-- Card Footer -->
        <div class="card-footer" style="display:flex;gap:.5rem;padding:.75rem 1.25rem;background:transparent;border-top:1px solid #f1f5f9">
          <button
            onclick="openEditSupplierModal('${s.id}')"
            class="btn-icon btn-icon-edit"
            title="Edit Supplier"
            style="flex:1;padding:6px 12px;border-radius:8px;border:1px solid #e2e8f0;background:white;cursor:pointer;font-size:.8rem;font-weight:500;color:#475569;display:flex;align-items:center;justify-content:center;gap:.4rem;transition:all .2s"
            onmouseenter="this.style.background='#f8fafc'"
            onmouseleave="this.style.background='white'">
            <i class="fas fa-pen"></i> Edit
          </button>
          <button
            onclick="openDeleteSupplierModal('${s.id}', '${_esc(s.name)}')"
            class="btn-icon btn-icon-delete"
            title="Delete Supplier"
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
function openAddSupplierModal() {
  _clearSupplierForm();
  document.getElementById("supplierModalTitle").textContent = "Add Supplier";
  document.getElementById("sm_id").value = "";
  _showModal("supplierModal");
}

/* ─── Edit Modal ─────────────────────────────────────────────── */
function openEditSupplierModal(id) {
  const supplier = allSuppliers.find((s) => s.id === id);
  if (!supplier) return;

  _clearSupplierForm();
  document.getElementById("supplierModalTitle").textContent = "Edit Supplier";
  document.getElementById("sm_id").value = supplier.id;
  document.getElementById("sm_name").value = supplier.name || "";
  document.getElementById("sm_contactPerson").value =
    supplier.contactPerson || "";
  document.getElementById("sm_email").value = supplier.email || "";
  document.getElementById("sm_phone").value = supplier.phone || "";
  document.getElementById("sm_address").value = supplier.address || "";
  document.getElementById("sm_status").value = supplier.status || "Active";

  _showModal("supplierModal");
}

/* ─── Close Add/Edit Modal ───────────────────────────────────── */
function closeSupplierModal() {
  _hideModal("supplierModal");
  _clearSupplierForm();
}

/* ─── Save (Add / Edit) ──────────────────────────────────────── */
function saveSupplier() {
  if (!_validateSupplierForm()) return;

  const id = document.getElementById("sm_id").value.trim();
  const name = document.getElementById("sm_name").value.trim();
  const contactPerson = document
    .getElementById("sm_contactPerson")
    .value.trim();
  const email = document.getElementById("sm_email").value.trim();
  const phone = document.getElementById("sm_phone").value.trim();
  const address = document.getElementById("sm_address").value.trim();
  const status = document.getElementById("sm_status").value;

  let suppliers = _getRawSuppliers();

  if (id) {
    // Edit existing
    const idx = suppliers.findIndex((s) => s.id === id);
    if (idx !== -1) {
      suppliers[idx] = {
        ...suppliers[idx],
        name,
        contactPerson,
        email,
        phone,
        address,
        status,
        updatedAt: new Date().toISOString(),
      };
    }
    _saveSuppliers(suppliers);
    _showToast("Supplier updated successfully!", "success");
  } else {
    // Add new
    const newSupplier = {
      id: _generateId(),
      name,
      contactPerson,
      email,
      phone,
      address,
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    suppliers.push(newSupplier);
    _saveSuppliers(suppliers);
    _showToast("Supplier added successfully!", "success");
  }

  closeSupplierModal();
  loadSuppliers();
}

/* ─── Delete Confirm Modal ───────────────────────────────────── */
function openDeleteSupplierModal(id, name) {
  pendingDeleteId = id;
  const nameEl = document.getElementById("deleteSupplierName");
  if (nameEl) nameEl.textContent = name;
  _showModal("deleteSupplierModal");
}

function closeDeleteSupplierModal() {
  pendingDeleteId = null;
  _hideModal("deleteSupplierModal");
}

function confirmDeleteSupplier() {
  if (!pendingDeleteId) return;
  const deletedId = pendingDeleteId;
  let suppliers = _getRawSuppliers().filter((s) => s.id !== deletedId);
  _saveSuppliers(suppliers);

  // Safely detach deleted supplier from associated products
  try {
    const products = _getProducts();
    let updated = false;
    products.forEach((p) => {
      if (p.supplierId === deletedId) {
        p.supplierId = "";
        updated = true;
      }
    });
    if (updated) {
      if (typeof saveProducts === "function") saveProducts(products);
      else
        localStorage.setItem("smartstock_products", JSON.stringify(products));
    }
  } catch (e) {
    console.warn("[SmartStock] Cascade clear supplier error:", e);
  }

  _showToast("Supplier deleted successfully.", "success");
  closeDeleteSupplierModal();
  loadSuppliers();
}

/* ─── Form Helpers ───────────────────────────────────────────── */
function _clearSupplierForm() {
  ["sm_name", "sm_contactPerson", "sm_email", "sm_phone", "sm_address"].forEach(
    (id) => {
      const el = document.getElementById(id);
      if (el) {
        el.value = "";
        el.classList.remove("is-invalid");
      }
    },
  );
  const statusEl = document.getElementById("sm_status");
  if (statusEl) statusEl.value = "Active";
  ["sm_name_err", "sm_cp_err", "sm_email_err", "sm_phone_err"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = "";
  });
}

function _validateSupplierForm() {
  let valid = true;

  const name = document.getElementById("sm_name").value.trim();
  const contactPerson = document
    .getElementById("sm_contactPerson")
    .value.trim();
  const email = document.getElementById("sm_email").value.trim();
  const phone = document.getElementById("sm_phone").value.trim();

  // Clear previous errors
  _clearFieldError("sm_name", "sm_name_err");
  _clearFieldError("sm_contactPerson", "sm_cp_err");
  _clearFieldError("sm_email", "sm_email_err");
  _clearFieldError("sm_phone", "sm_phone_err");

  if (!name) {
    _setFieldError("sm_name", "sm_name_err", "Supplier name is required.");
    valid = false;
  }
  if (!contactPerson) {
    _setFieldError(
      "sm_contactPerson",
      "sm_cp_err",
      "Contact person is required.",
    );
    valid = false;
  }
  if (!email) {
    _setFieldError("sm_email", "sm_email_err", "Email address is required.");
    valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    _setFieldError(
      "sm_email",
      "sm_email_err",
      "Please enter a valid email address.",
    );
    valid = false;
  }
  if (!phone) {
    _setFieldError("sm_phone", "sm_phone_err", "Phone number is required.");
    valid = false;
  }

  return valid;
}

function _setFieldError(inputId, errId, msg) {
  const el = document.getElementById(inputId);
  if (el) el.classList.add("is-invalid");
  const errEl = document.getElementById(errId);
  if (errEl) errEl.textContent = msg;
}

function _clearFieldError(inputId, errId) {
  const el = document.getElementById(inputId);
  if (el) el.classList.remove("is-invalid");
  const errEl = document.getElementById(errId);
  if (errEl) errEl.textContent = "";
}

/* ─── Storage Helpers ────────────────────────────────────────── */
function _getRawSuppliers() {
  if (typeof getSuppliers === "function") return getSuppliers();
  return JSON.parse(localStorage.getItem("smartstock_suppliers") || "[]");
}

function _saveSuppliers(suppliers) {
  if (typeof saveSuppliers === "function") return saveSuppliers(suppliers);
  localStorage.setItem("smartstock_suppliers", JSON.stringify(suppliers));
}

function _getProducts() {
  if (typeof getProducts === "function") return getProducts();
  return JSON.parse(localStorage.getItem("smartstock_products") || "[]");
}

function _generateId() {
  if (typeof generateId === "function") return generateId();
  return "sup_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
}

/* ─── UI Helpers ─────────────────────────────────────────────── */
function _showModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.style.display = "flex";
    el.style.alignItems = "center";
    el.style.justifyContent = "center";
  }
}

function _hideModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = "none";
}

function _showToast(message, type = "success") {
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

function _esc(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function _avatarColor(name) {
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
document.addEventListener("DOMContentLoaded", initSuppliers);
