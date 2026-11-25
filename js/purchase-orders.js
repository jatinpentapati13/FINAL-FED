/**
 * SmartStock - Purchase Orders Module
 * Procurement workflows, vendor orders, approval cycle, and automated stock intake.
 */

"use strict";

let allOrders = [];
let poSuppliers = [];
let poProducts = [];
let pendingReceiveId = null;

// ─── Initialisation ───────────────────────────────────────────────────────────
function initPurchaseOrders() {
  if (typeof requireAuth === "function") requireAuth();
  if (typeof initDemoData === "function") initDemoData();
  if (typeof renderSidebar === "function") renderSidebar("orders");
  if (typeof renderNavbar === "function") renderNavbar();

  loadOrders();
}

// ─── Data Loading & Metrics ───────────────────────────────────────────────────
function loadOrders() {
  allOrders = JSON.parse(
    localStorage.getItem("smartstock_purchase_orders") || "[]",
  );
  poSuppliers = JSON.parse(
    localStorage.getItem("smartstock_suppliers") || "[]",
  );
  poProducts = JSON.parse(localStorage.getItem("smartstock_products") || "[]");

  populateSupplierFilter();
  renderSummaryCards();
  filterOrders();
}

function renderSummaryCards() {
  const total = allOrders.length;
  let pending = 0;
  let approved = 0;
  let received = 0;

  allOrders.forEach((o) => {
    if (o.status === "Pending") pending++;
    else if (o.status === "Approved") approved++;
    else if (o.status === "Received") received++;
  });

  const totEl = document.getElementById("poTotalCount");
  const penEl = document.getElementById("poPendingCount");
  const appEl = document.getElementById("poApprovedCount");
  const recEl = document.getElementById("poReceivedCount");

  if (typeof animateCounter === "function") {
    animateCounter(totEl, total);
    animateCounter(penEl, pending);
    animateCounter(appEl, approved);
    animateCounter(recEl, received);
  } else {
    if (totEl) totEl.textContent = total.toLocaleString("en-IN");
    if (penEl) penEl.textContent = pending.toLocaleString("en-IN");
    if (appEl) appEl.textContent = approved.toLocaleString("en-IN");
    if (recEl) recEl.textContent = received.toLocaleString("en-IN");
  }
}

function populateSupplierFilter() {
  const select = document.getElementById("filterOrderSupplier");
  if (!select) return;
  const current = select.value;
  select.innerHTML =
    '<option value="">All Suppliers</option>' +
    poSuppliers
      .map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`)
      .join("");
  select.value = current;
}

// ─── Filtering ────────────────────────────────────────────────────────────────
function filterOrders() {
  const query = (document.getElementById("searchOrders")?.value || "")
    .toLowerCase()
    .trim();
  const statusFilter =
    document.getElementById("filterOrderStatus")?.value || "";
  const supplierFilter =
    document.getElementById("filterOrderSupplier")?.value || "";

  const filtered = allOrders.filter((o) => {
    const matchQuery =
      !query ||
      (o.orderNumber && o.orderNumber.toLowerCase().includes(query)) ||
      (o.productName && o.productName.toLowerCase().includes(query)) ||
      (o.supplierName && o.supplierName.toLowerCase().includes(query));

    const matchStatus = !statusFilter || o.status === statusFilter;
    const matchSupplier = !supplierFilter || o.supplierId === supplierFilter;

    return matchQuery && matchStatus && matchSupplier;
  });

  renderOrdersTable(filtered);
}

// ─── Table Rendering ─────────────────────────────────────────────────────────
function renderOrdersTable(orders) {
  const tbody = document.getElementById("ordersTableBody");
  const emptyState = document.getElementById("ordersEmptyState");
  const countEl = document.getElementById("ordersCount");
  if (!tbody) return;

  if (countEl) {
    countEl.textContent = `Showing ${orders.length} of ${allOrders.length} orders`;
  }

  if (orders.length === 0) {
    tbody.innerHTML = "";
    if (emptyState) emptyState.style.display = "block";
    return;
  }

  if (emptyState) emptyState.style.display = "none";

  tbody.innerHTML = orders
    .map((o) => {
      const qty = Number(o.quantity) || 0;
      const unitPrice = Number(o.unitPrice) || 0;
      const totalAmount = Number(o.totalAmount) || qty * unitPrice;

      let deliveryDateStr = "—";
      if (o.expectedDeliveryDate) {
        deliveryDateStr = new Date(o.expectedDeliveryDate).toLocaleDateString(
          "en-IN",
          {
            year: "numeric",
            month: "short",
            day: "numeric",
          },
        );
      }

      let statusBadge = "badge-warning";
      if (o.status === "Approved") statusBadge = "badge-info";
      else if (o.status === "Received") statusBadge = "badge-success";
      else if (o.status === "Cancelled") statusBadge = "badge-secondary";

      return `
      <tr>
        <td>
          <span style="font-family:monospace; font-weight:700; color:var(--primary); font-size:0.85rem">
            ${escapeHtml(o.orderNumber || "PO-000")}
          </span>
        </td>
        <td>
          <div style="font-weight:600; color:var(--text-primary)">${escapeHtml(o.supplierName || "—")}</div>
        </td>
        <td>
          <div style="font-weight:600; color:var(--text-primary)">${escapeHtml(o.productName || "—")}</div>
          <span style="font-family:monospace; font-size:0.75rem; color:var(--text-secondary)">SKU: ${escapeHtml(o.sku || "—")}</span>
        </td>
        <td style="font-weight:700">${qty.toLocaleString("en-IN")} units</td>
        <td style="color:var(--text-secondary)">₹${unitPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
        <td style="font-weight:700; color:var(--success)">₹${totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
        <td style="font-size:0.85rem; color:var(--text-secondary)">
          <i class="fas fa-calendar-day me-1 text-muted"></i>${deliveryDateStr}
        </td>
        <td><span class="badge ${statusBadge}">${escapeHtml(o.status)}</span></td>
        <td>
          <div class="table-actions" style="justify-content:flex-end">
            ${
              o.status === "Pending"
                ? `
              <button class="btn-sm btn-outline-primary" onclick="approveOrder('${o.id}')" title="Approve Order">
                <i class="fas fa-thumbs-up me-1"></i>Approve
              </button>
            `
                : ""
            }

            ${
              o.status === "Approved" || o.status === "Pending"
                ? `
              <button class="btn-sm btn-success" onclick="openReceiveModal('${o.id}')" title="Receive Shipment">
                <i class="fas fa-box-open me-1"></i>Receive
              </button>
            `
                : ""
            }

            ${
              o.status === "Pending" || o.status === "Approved"
                ? `
              <button class="btn-icon" onclick="cancelOrder('${o.id}')" title="Cancel Order" style="color:var(--warning); background:rgba(245,158,11,0.1)">
                <i class="fas fa-ban"></i>
              </button>
            `
                : ""
            }

            <button class="btn-icon" onclick="deleteOrder('${o.id}')" title="Delete Record" style="color:var(--danger); background:rgba(239,68,68,0.1)">
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
function openAddOrderModal() {
  populateOrderModalDropdowns();

  document.getElementById("po_id").value = "";
  document.getElementById("po_supplier").value = "";
  document.getElementById("po_product").value = "";
  document.getElementById("po_quantity").value = "25";
  document.getElementById("po_price").value = "";
  document.getElementById("po_notes").value = "";

  // Default expected delivery date: 7 days from now
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  document.getElementById("po_deliveryDate").value = nextWeek
    .toISOString()
    .split("T")[0];

  clearOrderErrors();
  calculateOrderTotal();

  document.getElementById("orderModal").style.display = "flex";
}

function closeOrderModal() {
  document.getElementById("orderModal").style.display = "none";
  clearOrderErrors();
}

function clearOrderErrors() {
  [
    "po_supplier",
    "po_product",
    "po_quantity",
    "po_price",
    "po_deliveryDate",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.remove("is-invalid");
  });
  [
    "po_supplier_err",
    "po_product_err",
    "po_qty_err",
    "po_price_err",
    "po_date_err",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = "";
  });
}

function populateOrderModalDropdowns() {
  const supSelect = document.getElementById("po_supplier");
  const prodSelect = document.getElementById("po_product");

  if (supSelect) {
    supSelect.innerHTML =
      '<option value="">Select supplier</option>' +
      poSuppliers
        .filter((s) => s.status === "Active" || !s.status)
        .map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`)
        .join("");
  }

  if (prodSelect) {
    prodSelect.innerHTML =
      '<option value="">Select product</option>' +
      poProducts
        .map(
          (p) =>
            `<option value="${p.id}" data-price="${p.price}" data-sku="${p.sku}" data-supplier="${p.supplierId}">${escapeHtml(p.name)} (${p.sku})</option>`,
        )
        .join("");
  }
}

function onSupplierChange() {
  const supplierId = document.getElementById("po_supplier").value;
  const prodSelect = document.getElementById("po_product");
  if (!prodSelect) return;

  // Filter products by selected supplier if supplier has assigned products
  const matchingProds = supplierId
    ? poProducts.filter((p) => p.supplierId === supplierId)
    : poProducts;

  const displayList = matchingProds.length > 0 ? matchingProds : poProducts;

  prodSelect.innerHTML =
    '<option value="">Select product</option>' +
    displayList
      .map(
        (p) =>
          `<option value="${p.id}" data-price="${p.price}" data-sku="${p.sku}" data-supplier="${p.supplierId}">${escapeHtml(p.name)} (${p.sku})</option>`,
      )
      .join("");
}

function onProductSelectForOrder() {
  const prodSelect = document.getElementById("po_product");
  const selectedOpt = prodSelect.options[prodSelect.selectedIndex];

  if (selectedOpt && selectedOpt.value) {
    const price = selectedOpt.getAttribute("data-price");
    const supplierId = selectedOpt.getAttribute("data-supplier");

    // Auto-fill price
    const priceInput = document.getElementById("po_price");
    if (priceInput && price) {
      priceInput.value = price;
    }

    // Auto-select supplier if not set
    const supSelect = document.getElementById("po_supplier");
    if (supSelect && !supSelect.value && supplierId) {
      supSelect.value = supplierId;
    }

    calculateOrderTotal();
  }
}

function calculateOrderTotal() {
  const qty = parseInt(document.getElementById("po_quantity").value, 10) || 0;
  const price = parseFloat(document.getElementById("po_price").value) || 0;
  const total = qty * price;

  const totalEl = document.getElementById("po_totalCalculated");
  if (totalEl) {
    totalEl.textContent = `₹${total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

// ─── Save Purchase Order ──────────────────────────────────────────────────────
function savePurchaseOrder() {
  clearOrderErrors();
  let isValid = true;

  const supplierId = document.getElementById("po_supplier").value;
  const productId = document.getElementById("po_product").value;
  const qtyRaw = document.getElementById("po_quantity").value;
  const priceRaw = document.getElementById("po_price").value;
  const deliveryDate = document.getElementById("po_deliveryDate").value;
  const notes = document.getElementById("po_notes").value.trim();

  if (!supplierId) {
    document.getElementById("po_supplier").classList.add("is-invalid");
    document.getElementById("po_supplier_err").textContent =
      "Please select a supplier.";
    isValid = false;
  }

  if (!productId) {
    document.getElementById("po_product").classList.add("is-invalid");
    document.getElementById("po_product_err").textContent =
      "Please select a product.";
    isValid = false;
  }

  const quantity = parseInt(qtyRaw, 10);
  if (isNaN(quantity) || quantity <= 0) {
    document.getElementById("po_quantity").classList.add("is-invalid");
    document.getElementById("po_qty_err").textContent =
      "Quantity must be greater than zero.";
    isValid = false;
  }

  const unitPrice = parseFloat(priceRaw);
  if (isNaN(unitPrice) || unitPrice < 0) {
    document.getElementById("po_price").classList.add("is-invalid");
    document.getElementById("po_price_err").textContent =
      "Unit price cannot be negative.";
    isValid = false;
  }

  if (!deliveryDate) {
    document.getElementById("po_deliveryDate").classList.add("is-invalid");
    document.getElementById("po_date_err").textContent =
      "Expected delivery date is required.";
    isValid = false;
  }

  if (!isValid) return;

  const supplier = poSuppliers.find((s) => s.id === supplierId);
  const product = poProducts.find((p) => p.id === productId);

  // Generate next sequential PO Number: PO-001, PO-002...
  const orderNum = "PO-" + String(allOrders.length + 1).padStart(3, "0");

  const newOrder = {
    id: "po_" + generateId(),
    orderNumber: orderNum,
    supplierId,
    supplierName: supplier ? supplier.name : "Unknown Supplier",
    productId,
    productName: product ? product.name : "Unknown Product",
    sku: product ? product.sku : "—",
    quantity,
    unitPrice,
    totalAmount: quantity * unitPrice,
    orderDate: new Date().toISOString(),
    expectedDeliveryDate: deliveryDate,
    status: "Pending",
    notes,
  };

  allOrders.unshift(newOrder);
  localStorage.setItem("smartstock_purchase_orders", JSON.stringify(allOrders));

  showToast(`Purchase order ${orderNum} created successfully.`, "success");
  closeOrderModal();
  loadOrders();
}

// ─── Order Lifecycle Actions ──────────────────────────────────────────────────
function approveOrder(id) {
  const order = allOrders.find((o) => o.id === id);
  if (!order) return;

  order.status = "Approved";
  localStorage.setItem("smartstock_purchase_orders", JSON.stringify(allOrders));

  showToast(
    `Order ${order.orderNumber} approved and dispatched for fulfillment.`,
    "info",
  );
  loadOrders();
}

function cancelOrder(id) {
  const order = allOrders.find((o) => o.id === id);
  if (!order) return;

  if (confirm(`Are you sure you want to cancel order ${order.orderNumber}?`)) {
    order.status = "Cancelled";
    localStorage.setItem(
      "smartstock_purchase_orders",
      JSON.stringify(allOrders),
    );
    showToast(`Order ${order.orderNumber} was cancelled.`, "warning");
    loadOrders();
  }
}

function deleteOrder(id) {
  const order = allOrders.find((o) => o.id === id);
  if (!order) return;

  if (confirm(`Permanently delete order ${order.orderNumber}?`)) {
    allOrders = allOrders.filter((o) => o.id !== id);
    localStorage.setItem(
      "smartstock_purchase_orders",
      JSON.stringify(allOrders),
    );
    showToast(`Order record deleted.`, "success");
    loadOrders();
  }
}

// ─── Receive Shipment & Auto Inventory Update ────────────────────────────────
function openReceiveModal(id) {
  const order = allOrders.find((o) => o.id === id);
  if (!order) return;

  pendingReceiveId = id;
  document.getElementById("receiveOrderNumber").textContent = order.orderNumber;
  document.getElementById("receiveProductName").textContent = order.productName;
  document.getElementById("receiveQuantity").textContent =
    order.quantity.toLocaleString("en-IN");

  document.getElementById("receiveModal").style.display = "flex";
}

function closeReceiveModal() {
  pendingReceiveId = null;
  document.getElementById("receiveModal").style.display = "none";
}

function confirmReceiveOrder() {
  if (!pendingReceiveId) return;

  const order = allOrders.find((o) => o.id === pendingReceiveId);
  if (!order) return;

  // 1. Mark order as Received
  order.status = "Received";
  order.receivedDate = new Date().toISOString();
  localStorage.setItem("smartstock_purchase_orders", JSON.stringify(allOrders));

  // 2. CRITICAL: Increase inventory stock quantity!
  const products = JSON.parse(
    localStorage.getItem("smartstock_products") || "[]",
  );
  const prodIndex = products.findIndex((p) => p.id === order.productId);

  if (prodIndex !== -1) {
    const prevQty = Number(products[prodIndex].quantity) || 0;
    const addedQty = Number(order.quantity) || 0;
    products[prodIndex].quantity = prevQty + addedQty;
    products[prodIndex].updatedAt = new Date().toISOString();
    localStorage.setItem("smartstock_products", JSON.stringify(products));

    // 3. Automatically record Stock In movement in audit log!
    const movements = JSON.parse(
      localStorage.getItem("smartstock_movements") || "[]",
    );
    const currentUser = JSON.parse(
      localStorage.getItem("smartstock_current_user") || "{}",
    );

    movements.unshift({
      id: "mov_" + generateId(),
      date: new Date().toISOString(),
      productId: products[prodIndex].id,
      productName: products[prodIndex].name,
      sku: products[prodIndex].sku,
      type: "Stock In",
      quantity: addedQty,
      fromWarehouseId: "",
      toWarehouseId: products[prodIndex].warehouseId || "",
      notes: `Received from Purchase Order ${order.orderNumber} (${order.supplierName})`,
      user: currentUser.name || "System Admin",
      status: "Completed",
    });

    localStorage.setItem("smartstock_movements", JSON.stringify(movements));
  }

  closeReceiveModal();
  loadOrders();
  showToast(
    `Order ${order.orderNumber} received! Added ${order.quantity} units to inventory.`,
    "success",
  );
}

// DOM Ready
document.addEventListener("DOMContentLoaded", initPurchaseOrders);
