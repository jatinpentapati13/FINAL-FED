/**
 * SmartStock - Products Management Module
 * Complete CRUD operations, filtering, sorting, duplicate SKU validation,
 * supplier/warehouse resolution, and responsive rendering.
 */

"use strict";

let allProducts = [];
let allSuppliers = [];
let allWarehouses = [];
let pendingDeleteId = null;

// ─── Initialisation ───────────────────────────────────────────────────────────
function initProducts() {
  if (typeof requireAuth === "function") requireAuth();
  if (typeof initDemoData === "function") initDemoData();
  if (typeof renderSidebar === "function") renderSidebar("products");
  if (typeof renderNavbar === "function") renderNavbar();

  // Load supporting lists
  allSuppliers = JSON.parse(
    localStorage.getItem("smartstock_suppliers") || "[]",
  );
  allWarehouses = JSON.parse(
    localStorage.getItem("smartstock_warehouses") || "[]",
  );

  populateFilterDropdowns();
  populateModalDropdowns();
  loadProducts();

  // Check query params (e.g. from global search)
  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get("search");
  if (searchParam) {
    const searchInput = document.getElementById("searchProducts");
    if (searchInput) {
      searchInput.value = searchParam;
      filterProducts();
    }
  }
}

// ─── Data Loading & Filtering ─────────────────────────────────────────────────
function loadProducts() {
  allProducts = JSON.parse(localStorage.getItem("smartstock_products") || "[]");
  allSuppliers = JSON.parse(
    localStorage.getItem("smartstock_suppliers") || "[]",
  );
  allWarehouses = JSON.parse(
    localStorage.getItem("smartstock_warehouses") || "[]",
  );
  filterProducts();
}

function filterProducts() {
  const query = (document.getElementById("searchProducts")?.value || "")
    .toLowerCase()
    .trim();
  const category = document.getElementById("filterCategory")?.value || "";
  const status = document.getElementById("filterStatus")?.value || "";
  const warehouse = document.getElementById("filterWarehouse")?.value || "";
  const sort = document.getElementById("sortProducts")?.value || "name_asc";

  let filtered = allProducts.filter((p) => {
    const matchQuery =
      !query ||
      (p.name && p.name.toLowerCase().includes(query)) ||
      (p.sku && p.sku.toLowerCase().includes(query)) ||
      (p.category && p.category.toLowerCase().includes(query));

    const matchCategory = !category || p.category === category;
    const matchWarehouse = !warehouse || p.warehouseId === warehouse;

    // Status logic
    let itemStatus = "In Stock";
    if (Number(p.quantity) === 0) itemStatus = "Out of Stock";
    else if (Number(p.quantity) <= Number(p.minStock)) itemStatus = "Low Stock";

    const matchStatus = !status || itemStatus === status;

    return matchQuery && matchCategory && matchWarehouse && matchStatus;
  });

  // Sorting
  filtered.sort((a, b) => {
    switch (sort) {
      case "name_asc":
        return (a.name || "").localeCompare(b.name || "");
      case "name_desc":
        return (b.name || "").localeCompare(a.name || "");
      case "price_asc":
        return (Number(a.price) || 0) - (Number(b.price) || 0);
      case "price_desc":
        return (Number(b.price) || 0) - (Number(a.price) || 0);
      case "quantity_asc":
        return (Number(a.quantity) || 0) - (Number(b.quantity) || 0);
      case "quantity_desc":
        return (Number(b.quantity) || 0) - (Number(a.quantity) || 0);
      case "newest":
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      default:
        return 0;
    }
  });

  renderProductsTable(filtered);
}

// ─── Table Rendering ─────────────────────────────────────────────────────────
function renderProductsTable(products) {
  const tbody = document.getElementById("productsTableBody");
  const emptyState = document.getElementById("productsEmptyState");
  const countEl = document.getElementById("productCount");
  if (!tbody) return;

  if (countEl) {
    countEl.textContent = `Showing ${products.length} of ${allProducts.length} items`;
  }

  if (products.length === 0) {
    tbody.innerHTML = "";
    if (emptyState) emptyState.style.display = "block";
    return;
  }

  if (emptyState) emptyState.style.display = "none";

  // Build supplier & warehouse lookup maps
  const supplierMap = {};
  allSuppliers.forEach((s) => {
    supplierMap[s.id] = s.name;
  });

  const warehouseMap = {};
  allWarehouses.forEach((w) => {
    warehouseMap[w.id] = w.name;
  });

  tbody.innerHTML = products
    .map((p) => {
      const qty = Number(p.quantity) || 0;
      const minStock = Number(p.minStock) || 0;
      const price = Number(p.price) || 0;

      let statusText = "In Stock";
      let statusBadgeClass = "badge-success";
      let stockBarClass = "healthy";

      if (qty === 0) {
        statusText = "Out of Stock";
        statusBadgeClass = "badge-danger";
        stockBarClass = "out";
      } else if (qty <= minStock) {
        statusText = "Low Stock";
        statusBadgeClass = "badge-warning";
        stockBarClass = "low";
      }

      // Stock ratio bar relative to minStock * 3
      const maxReference = Math.max(minStock * 2.5, 50);
      const stockPercent = Math.min(
        Math.round((qty / maxReference) * 100),
        100,
      );

      const supName = supplierMap[p.supplierId] || "—";
      const whName = warehouseMap[p.warehouseId] || "—";

      // Category icon mapping
      const catIcons = {
        Electronics: "fas fa-laptop",
        Grocery: "fas fa-bowl-rice",
        Clothing: "fas fa-shirt",
        Stationery: "fas fa-pen-ruler",
        Home: "fas fa-house",
        Other: "fas fa-box",
      };
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
              ${p.description ? `<div style="font-size:0.75rem; color:var(--text-secondary); max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${escapeHtml(p.description)}</div>` : ""}
            </div>
          </div>
        </td>
        <td>
          <span style="font-family:monospace; font-size:0.8rem; font-weight:700; background:var(--gray-100); padding:3px 8px; border-radius:4px; color:var(--text-primary)">
            ${escapeHtml(p.sku)}
          </span>
        </td>
        <td>
          <span class="badge badge-info">${escapeHtml(p.category)}</span>
        </td>
        <td style="font-weight:600; color:var(--text-primary)">
          ₹${price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </td>
        <td>
          <div style="display:flex; align-items:center; gap:8px">
            <span style="font-weight:700; min-width:32px">${qty}</span>
            <div class="stock-bar" style="width:60px">
              <div class="stock-bar-fill ${stockBarClass}" style="width:${stockPercent}%"></div>
            </div>
          </div>
        </td>
        <td style="color:var(--text-secondary)">${minStock}</td>
        <td>
          <span style="font-size:0.8rem; color:var(--text-secondary)">${escapeHtml(supName)}</span>
        </td>
        <td>
          <span class="badge" style="background:var(--gray-100); color:var(--gray-700)">${escapeHtml(whName)}</span>
        </td>
        <td>
          <span class="badge ${statusBadgeClass}">${statusText}</span>
        </td>
        <td>
          <div class="table-actions" style="justify-content:flex-end">
            <button class="btn-icon" onclick="viewProduct('${p.id}')" title="View Details" style="color:var(--info); background:rgba(59,130,246,0.1)">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn-icon" onclick="openEditProductModal('${p.id}')" title="Edit Product" style="color:var(--primary); background:rgba(79,70,229,0.1)">
              <i class="fas fa-pencil"></i>
            </button>
            <button class="btn-icon" onclick="openDeleteModal('${p.id}', '${escapeHtml(p.name)}')" title="Delete Product" style="color:var(--danger); background:rgba(239,68,68,0.1)">
              <i class="fas fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
    })
    .join("");
}

// ─── Modal Operations ─────────────────────────────────────────────────────────
function populateFilterDropdowns() {
  const whFilter = document.getElementById("filterWarehouse");
  if (!whFilter) return;

  const currentVal = whFilter.value;
  whFilter.innerHTML =
    '<option value="">All Warehouses</option>' +
    allWarehouses
      .map((w) => `<option value="${w.id}">${escapeHtml(w.name)}</option>`)
      .join("");
  whFilter.value = currentVal;
}

function populateModalDropdowns() {
  const supSelect = document.getElementById("pm_supplier");
  const whSelect = document.getElementById("pm_warehouse");

  if (supSelect) {
    supSelect.innerHTML =
      '<option value="">Select supplier</option>' +
      allSuppliers
        .map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`)
        .join("");
  }

  if (whSelect) {
    whSelect.innerHTML =
      '<option value="">Select warehouse</option>' +
      allWarehouses
        .map((w) => `<option value="${w.id}">${escapeHtml(w.name)}</option>`)
        .join("");
  }
}

function clearValidationErrors() {
  [
    "pm_name",
    "pm_sku",
    "pm_category",
    "pm_price",
    "pm_quantity",
    "pm_minStock",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.remove("is-invalid");
  });
  [
    "pm_name_err",
    "pm_sku_err",
    "pm_cat_err",
    "pm_price_err",
    "pm_qty_err",
    "pm_min_err",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = "";
  });
}

function openAddProductModal() {
  clearValidationErrors();
  document.getElementById("pm_id").value = "";
  document.getElementById("pm_name").value = "";
  document.getElementById("pm_sku").value = "";
  document.getElementById("pm_category").value = "";
  document.getElementById("pm_price").value = "";
  document.getElementById("pm_quantity").value = "0";
  document.getElementById("pm_minStock").value = "10";
  document.getElementById("pm_supplier").value = "";
  document.getElementById("pm_warehouse").value = "";
  document.getElementById("pm_description").value = "";

  document.getElementById("productModalTitle").textContent = "Add New Product";
  document.getElementById("productSaveBtn").textContent = "Add Product";

  populateModalDropdowns();
  document.getElementById("productModal").style.display = "flex";
}

function openEditProductModal(id) {
  clearValidationErrors();
  const product = allProducts.find((p) => p.id === id);
  if (!product) return;

  populateModalDropdowns();

  document.getElementById("pm_id").value = product.id;
  document.getElementById("pm_name").value = product.name || "";
  document.getElementById("pm_sku").value = product.sku || "";
  document.getElementById("pm_category").value = product.category || "";
  document.getElementById("pm_price").value = product.price;
  document.getElementById("pm_quantity").value = product.quantity;
  document.getElementById("pm_minStock").value = product.minStock;
  document.getElementById("pm_supplier").value = product.supplierId || "";
  document.getElementById("pm_warehouse").value = product.warehouseId || "";
  document.getElementById("pm_description").value = product.description || "";

  document.getElementById("productModalTitle").textContent = "Edit Product";
  document.getElementById("productSaveBtn").textContent = "Save Changes";

  document.getElementById("productModal").style.display = "flex";
}

function closeProductModal() {
  document.getElementById("productModal").style.display = "none";
  clearValidationErrors();
}

// ─── Save / Update Product ───────────────────────────────────────────────────
function saveProduct() {
  clearValidationErrors();
  let isValid = true;

  const id = document.getElementById("pm_id").value.trim();
  const name = document.getElementById("pm_name").value.trim();
  const sku = document.getElementById("pm_sku").value.trim().toUpperCase();
  const category = document.getElementById("pm_category").value;
  const priceRaw = document.getElementById("pm_price").value;
  const qtyRaw = document.getElementById("pm_quantity").value;
  const minStockRaw = document.getElementById("pm_minStock").value;
  const supplierId = document.getElementById("pm_supplier").value;
  const warehouseId = document.getElementById("pm_warehouse").value;
  const description = document.getElementById("pm_description").value.trim();

  // Validate Name
  if (!name) {
    document.getElementById("pm_name").classList.add("is-invalid");
    document.getElementById("pm_name_err").textContent =
      "Product name is required.";
    isValid = false;
  }

  // Validate SKU
  if (!sku) {
    document.getElementById("pm_sku").classList.add("is-invalid");
    document.getElementById("pm_sku_err").textContent = "SKU is required.";
    isValid = false;
  } else {
    // Check duplicate SKU
    const duplicate = allProducts.find(
      (p) => p.sku.toUpperCase() === sku && p.id !== id,
    );
    if (duplicate) {
      document.getElementById("pm_sku").classList.add("is-invalid");
      document.getElementById("pm_sku_err").textContent =
        "SKU already exists. Please use a unique SKU.";
      isValid = false;
    }
  }

  // Validate Category
  if (!category) {
    document.getElementById("pm_category").classList.add("is-invalid");
    document.getElementById("pm_cat_err").textContent = "Category is required.";
    isValid = false;
  }

  // Validate Price
  const price = parseFloat(priceRaw);
  if (isNaN(price) || price < 0) {
    document.getElementById("pm_price").classList.add("is-invalid");
    document.getElementById("pm_price_err").textContent =
      "Price cannot be negative.";
    isValid = false;
  }

  // Validate Quantity
  const quantity = parseInt(qtyRaw, 10);
  if (isNaN(quantity) || quantity < 0) {
    document.getElementById("pm_quantity").classList.add("is-invalid");
    document.getElementById("pm_qty_err").textContent =
      "Quantity cannot be negative.";
    isValid = false;
  }

  // Validate Min Stock
  const minStock = parseInt(minStockRaw, 10);
  if (isNaN(minStock) || minStock < 0) {
    document.getElementById("pm_minStock").classList.add("is-invalid");
    document.getElementById("pm_min_err").textContent =
      "Minimum stock cannot be negative.";
    isValid = false;
  }

  if (!isValid) return;

  const now = new Date().toISOString();

  if (id) {
    // Editing existing product
    const index = allProducts.findIndex((p) => p.id === id);
    if (index !== -1) {
      const oldQty = allProducts[index].quantity;
      allProducts[index] = {
        ...allProducts[index],
        name,
        sku,
        category,
        price,
        quantity,
        minStock,
        supplierId,
        warehouseId,
        description,
        updatedAt: now,
      };

      // Record adjustment movement if quantity changed
      if (oldQty !== quantity) {
        recordMovement({
          productId: id,
          productName: name,
          sku,
          type: "Adjustment",
          quantity: Math.abs(quantity - oldQty),
          fromWarehouseId: warehouseId,
          toWarehouseId: warehouseId,
          notes: `Quantity updated from ${oldQty} to ${quantity}`,
        });
      }

      saveProductsToStorage();
      showToast(`Product "${name}" updated successfully.`, "success");
    }
  } else {
    // Adding new product
    const newId = "prd_" + generateId();
    const newProduct = {
      id: newId,
      name,
      sku,
      category,
      price,
      quantity,
      minStock,
      supplierId,
      warehouseId,
      description,
      createdAt: now,
      updatedAt: now,
    };

    allProducts.unshift(newProduct);

    // Record initial Stock In movement if quantity > 0
    if (quantity > 0) {
      recordMovement({
        productId: newId,
        productName: name,
        sku,
        type: "Stock In",
        quantity: quantity,
        fromWarehouseId: "",
        toWarehouseId: warehouseId,
        notes: "Initial stock on product creation",
      });
    }

    saveProductsToStorage();
    showToast(`Product "${name}" added successfully.`, "success");
  }

  closeProductModal();
  filterProducts();
}

function saveProductsToStorage() {
  localStorage.setItem("smartstock_products", JSON.stringify(allProducts));
  checkStockAlerts();
}

// ─── Record Movement Helper ──────────────────────────────────────────────────
function recordMovement({
  productId,
  productName,
  sku,
  type,
  quantity,
  fromWarehouseId,
  toWarehouseId,
  notes,
}) {
  const movements = JSON.parse(
    localStorage.getItem("smartstock_movements") || "[]",
  );
  const currentUser = JSON.parse(
    localStorage.getItem("smartstock_current_user") || "{}",
  );

  const movementRecord = {
    id: "mov_" + generateId(),
    date: new Date().toISOString(),
    productId,
    productName,
    sku,
    type,
    quantity,
    fromWarehouseId: fromWarehouseId || "",
    toWarehouseId: toWarehouseId || "",
    notes: notes || "",
    user: currentUser.name || "System Admin",
    status: "Completed",
  };

  movements.unshift(movementRecord);
  localStorage.setItem("smartstock_movements", JSON.stringify(movements));
}

// ─── Automatic Stock Alert Generation ─────────────────────────────────────────
function checkStockAlerts() {
  const notifications = JSON.parse(
    localStorage.getItem("smartstock_notifications") || "[]",
  );
  let alertAdded = false;

  allProducts.forEach((p) => {
    const qty = Number(p.quantity);
    const min = Number(p.minStock);

    if (qty === 0) {
      const exists = notifications.some(
        (n) => n.productId === p.id && n.type === "danger" && !n.read,
      );
      if (!exists) {
        notifications.unshift({
          id: "notif_" + generateId(),
          productId: p.id,
          title: "Out of Stock Alert",
          message: `${p.name} (SKU: ${p.sku}) is completely out of stock!`,
          type: "danger",
          read: false,
          createdAt: new Date().toISOString(),
          link: "products.html",
        });
        alertAdded = true;
      }
    } else if (qty <= min) {
      const exists = notifications.some(
        (n) => n.productId === p.id && n.type === "warning" && !n.read,
      );
      if (!exists) {
        notifications.unshift({
          id: "notif_" + generateId(),
          productId: p.id,
          title: "Low Stock Alert",
          message: `${p.name} is running low (${qty} remaining, min: ${min}).`,
          type: "warning",
          read: false,
          createdAt: new Date().toISOString(),
          link: "products.html",
        });
        alertAdded = true;
      }
    }
  });

  if (alertAdded) {
    localStorage.setItem(
      "smartstock_notifications",
      JSON.stringify(notifications),
    );
  }
}

// ─── View Product Details Modal ───────────────────────────────────────────────
function viewProduct(id) {
  const product = allProducts.find((p) => p.id === id);
  if (!product) return;

  const supplier = allSuppliers.find((s) => s.id === product.supplierId);
  const warehouse = allWarehouses.find((w) => w.id === product.warehouseId);

  const qty = Number(product.quantity);
  const min = Number(product.minStock);
  const price = Number(product.price);
  const totalVal = qty * price;

  let statusBadge = `<span class="badge badge-success">In Stock</span>`;
  if (qty === 0)
    statusBadge = `<span class="badge badge-danger">Out of Stock</span>`;
  else if (qty <= min)
    statusBadge = `<span class="badge badge-warning">Low Stock</span>`;

  const bodyEl = document.getElementById("viewProductBody");
  bodyEl.innerHTML = `
    <div style="text-align:center; padding:1rem 0; border-bottom:1px solid var(--border-color); margin-bottom:1rem">
      <div style="width:60px; height:60px; border-radius:16px; background:rgba(79,70,229,0.1); color:var(--primary); font-size:1.75rem; display:flex; align-items:center; justify-content:center; margin:0 auto 12px">
        <i class="fas fa-box-open"></i>
      </div>
      <h4 style="font-weight:700; margin-bottom:4px">${escapeHtml(product.name)}</h4>
      <span style="font-family:monospace; background:var(--gray-100); padding:3px 8px; border-radius:4px; font-size:0.85rem">${escapeHtml(product.sku)}</span>
      <div style="margin-top:8px">${statusBadge}</div>
    </div>

    <div class="row g-2" style="font-size:0.875rem">
      <div class="col-6" style="color:var(--text-secondary)">Category:</div>
      <div class="col-6" style="font-weight:600; text-align:right">${escapeHtml(product.category)}</div>

      <div class="col-6" style="color:var(--text-secondary)">Unit Price:</div>
      <div class="col-6" style="font-weight:600; text-align:right">₹${price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>

      <div class="col-6" style="color:var(--text-secondary)">Stock Quantity:</div>
      <div class="col-6" style="font-weight:600; text-align:right">${qty} units</div>

      <div class="col-6" style="color:var(--text-secondary)">Total Value:</div>
      <div class="col-6" style="font-weight:600; text-align:right; color:var(--success)">₹${totalVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>

      <div class="col-6" style="color:var(--text-secondary)">Min Stock Threshold:</div>
      <div class="col-6" style="font-weight:600; text-align:right">${min} units</div>

      <div class="col-6" style="color:var(--text-secondary)">Supplier:</div>
      <div class="col-6" style="font-weight:600; text-align:right">${escapeHtml(supplier ? supplier.name : "None")}</div>

      <div class="col-6" style="color:var(--text-secondary)">Warehouse:</div>
      <div class="col-6" style="font-weight:600; text-align:right">${escapeHtml(warehouse ? warehouse.name : "None")}</div>

      ${
        product.description
          ? `
        <div class="col-12" style="margin-top:10px; padding-top:10px; border-top:1px solid var(--border-color)">
          <div style="color:var(--text-secondary); margin-bottom:4px">Description:</div>
          <p style="background:var(--gray-50); padding:8px 12px; border-radius:8px; font-size:0.8rem">${escapeHtml(product.description)}</p>
        </div>
      `
          : ""
      }
    </div>
  `;

  document.getElementById("viewEditBtn").onclick = () => {
    closeViewProductModal();
    openEditProductModal(id);
  };

  document.getElementById("viewProductModal").style.display = "flex";
}

function closeViewProductModal() {
  document.getElementById("viewProductModal").style.display = "none";
}

// ─── Delete Operations ────────────────────────────────────────────────────────
function openDeleteModal(id, name) {
  pendingDeleteId = id;
  document.getElementById("deleteProductName").textContent = `"${name}"`;
  document.getElementById("deleteModal").style.display = "flex";
}

function closeDeleteModal() {
  pendingDeleteId = null;
  document.getElementById("deleteModal").style.display = "none";
}

function confirmDelete() {
  if (!pendingDeleteId) return;

  const product = allProducts.find((p) => p.id === pendingDeleteId);
  const name = product ? product.name : "Product";

  allProducts = allProducts.filter((p) => p.id !== pendingDeleteId);
  saveProductsToStorage();

  closeDeleteModal();
  filterProducts();
  showToast(`"${name}" was deleted successfully.`, "success");
}

// DOM Ready
document.addEventListener("DOMContentLoaded", initProducts);
