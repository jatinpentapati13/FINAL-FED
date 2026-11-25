/**
 * SmartStock - Main Application Script
 * Provides global navigation, layout injection, theme management,
 * notifications, search, toasts, and helper utilities.
 */

"use strict";

// ─── Global State & Configuration ───────────────────────────────────────────
const NAV_LINKS = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "dashboard.html",
    icon: "fas fa-chart-pie",
  },
  {
    id: "inventory",
    label: "Inventory",
    href: "inventory.html",
    icon: "fas fa-boxes-stacked",
  },
  {
    id: "products",
    label: "Products",
    href: "products.html",
    icon: "fas fa-box-open",
  },
  {
    id: "suppliers",
    label: "Suppliers",
    href: "suppliers.html",
    icon: "fas fa-truck",
  },
  {
    id: "warehouses",
    label: "Warehouses",
    href: "warehouses.html",
    icon: "fas fa-warehouse",
  },
  {
    id: "movements",
    label: "Stock Movement",
    href: "stock-movement.html",
    icon: "fas fa-arrow-right-arrow-left",
  },
  {
    id: "orders",
    label: "Purchase Orders",
    href: "purchase-orders.html",
    icon: "fas fa-file-invoice",
  },
  {
    id: "reports",
    label: "Reports",
    href: "reports.html",
    icon: "fas fa-chart-line",
  },
  {
    id: "settings",
    label: "Settings",
    href: "settings.html",
    icon: "fas fa-gear",
  },
];

/**
 * Detect active page key based on window.location
 */
function detectCurrentPage() {
  const path = window.location.pathname.toLowerCase();
  if (path.includes("inventory.html")) return "inventory";
  if (path.includes("products.html")) return "products";
  if (path.includes("suppliers.html")) return "suppliers";
  if (path.includes("warehouses.html")) return "warehouses";
  if (path.includes("stock-movement.html") || path.includes("movements.html"))
    return "movements";
  if (path.includes("purchase-orders.html")) return "orders";
  if (path.includes("reports.html")) return "reports";
  if (path.includes("profile.html")) return "profile";
  if (path.includes("settings.html")) return "settings";
  return "dashboard";
}

// ─── Sidebar Renderer ────────────────────────────────────────────────────────
function renderSidebar(activePageId) {
  const activeId = activePageId || detectCurrentPage();
  const sidebarEl =
    document.getElementById("sidebar") ||
    document.getElementById("sidebar-container");
  if (!sidebarEl) return;

  const user = (window.SS && window.SS.getCurrentUser
    ? window.SS.getCurrentUser()
    : null) ||
    (typeof getCurrentUser === "function" ? getCurrentUser() : null) ||
    JSON.parse(localStorage.getItem("smartstock_current_user") || "null") || {
      name: "Raj Sharma",
      role: "Admin",
      email: "admin@smartstock.com",
    };

  const initials = (user.name || "User")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const linksHtml = NAV_LINKS.map((item) => {
    const isActive = item.id === activeId;
    return `
      <a href="${item.href}" class="sidebar-nav-item ${isActive ? "active" : ""}">
        <i class="${item.icon}"></i>
        <span>${item.label}</span>
      </a>
    `;
  }).join("");

  sidebarEl.innerHTML = `
    <div class="sidebar-logo">
      <div class="logo-icon"><i class="fas fa-boxes-stacked"></i></div>
      <span>SmartStock</span>
      <button class="hamburger-btn d-lg-none ms-auto" onclick="closeSidebar()" aria-label="Close Sidebar" style="display:flex">
        <i class="fas fa-times"></i>
      </button>
    </div>

    <div class="sidebar-section-label">Main Menu</div>

    <nav class="sidebar-nav">
      ${linksHtml}
    </nav>

    <div class="sidebar-bottom">
      <div class="sidebar-user" onclick="window.location.href='profile.html'" title="View Profile">
        <div class="sidebar-user-avatar">${initials}</div>
        <div class="sidebar-user-info">
          <div class="sidebar-user-name">${user.name || "User"}</div>
          <div class="sidebar-user-role">${user.role || "Admin"}</div>
        </div>
        <button class="navbar-btn ms-auto" onclick="event.stopPropagation(); logout();" title="Logout" style="color:var(--danger)">
          <i class="fas fa-arrow-right-from-bracket"></i>
        </button>
      </div>
    </div>
  `;
}

// ─── Navbar Renderer ─────────────────────────────────────────────────────────
function renderNavbar() {
  const navbarEl =
    document.getElementById("topNavbar") ||
    document.getElementById("navbar-container");
  if (!navbarEl) return;

  const user = (window.SS && window.SS.getCurrentUser
    ? window.SS.getCurrentUser()
    : null) ||
    (typeof getCurrentUser === "function" ? getCurrentUser() : null) ||
    JSON.parse(localStorage.getItem("smartstock_current_user") || "null") || {
      name: "Raj Sharma",
      role: "Admin",
      email: "admin@smartstock.com",
    };

  const initials = (user.name || "User")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const notifications =
    (window.SS && window.SS.getAll
      ? window.SS.getAll("smartstock_notifications")
      : null) ||
    JSON.parse(localStorage.getItem("smartstock_notifications") || "[]");
  const unreadCount = notifications.filter((n) => !n.read).length;

  navbarEl.innerHTML = `
    <button class="hamburger-btn" onclick="toggleSidebar()" aria-label="Toggle navigation">
      <i class="fas fa-bars"></i>
    </button>

    <div class="navbar-search">
      <i class="fas fa-search search-icon"></i>
      <input type="text" id="globalSearchInput" placeholder="Search products, suppliers, warehouses... (Ctrl+K)" autocomplete="off">
      <div id="globalSearchResults" class="search-results" style="display:none"></div>
    </div>

    <div class="navbar-actions">
      <!-- Theme toggle -->
      <button class="navbar-btn" id="themeToggleBtn" onclick="toggleTheme()" title="Toggle Dark Mode">
        <i class="fas fa-moon" id="themeToggleIcon"></i>
      </button>

      <!-- Notifications -->
      <div style="position:relative">
        <button class="navbar-btn" id="notifDropdownBtn" onclick="toggleNotifDropdown(event)" title="Notifications">
          <i class="fas fa-bell"></i>
          ${unreadCount > 0 ? `<span class="notification-badge" id="notifBadge">${unreadCount}</span>` : ""}
        </button>

        <div id="notifDropdown" class="notification-dropdown" style="display:none">
          <div style="padding:12px 16px; border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center">
            <strong style="font-size:0.875rem">Notifications (${unreadCount})</strong>
            <button onclick="markAllNotificationsAsRead()" style="background:none;border:none;color:var(--primary);font-size:0.75rem;cursor:pointer;font-weight:600">Mark all read</button>
          </div>
          <div id="notifItemsContainer" style="max-height:280px; overflow-y:auto">
            ${renderNotificationListHtml(notifications)}
          </div>
          <div style="padding:8px 16px; border-top:1px solid var(--border-color); text-align:center">
            <a href="reports.html" style="font-size:0.75rem; color:var(--primary); font-weight:600">View Detailed Reports</a>
          </div>
        </div>
      </div>

      <!-- User Avatar / Dropdown -->
      <div style="position:relative">
        <div class="user-avatar-sm" onclick="toggleUserDropdown(event)" title="${user.name}">
          ${initials}
        </div>
        <div id="userDropdown" class="notification-dropdown" style="width:200px; right:0; display:none; padding:8px 0">
          <div style="padding:8px 16px; border-bottom:1px solid var(--border-color)">
            <div style="font-weight:600; font-size:0.875rem">${user.name}</div>
            <div style="color:var(--gray-500); font-size:0.75rem">${user.email}</div>
          </div>
          <a href="profile.html" class="sidebar-nav-item" style="margin:4px 8px; padding:6px 12px; font-size:0.8rem">
            <i class="fas fa-user"></i> My Profile
          </a>
          <a href="settings.html" class="sidebar-nav-item" style="margin:4px 8px; padding:6px 12px; font-size:0.8rem">
            <i class="fas fa-gear"></i> Settings
          </a>
          <div style="border-top:1px solid var(--border-color); margin-top:4px; padding-top:4px">
            <button onclick="logout()" class="sidebar-nav-item" style="margin:4px 8px; padding:6px 12px; font-size:0.8rem; width:calc(100% - 16px); text-align:left; color:var(--danger); background:none; border:none">
              <i class="fas fa-arrow-right-from-bracket"></i> Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Sync theme icon
  updateThemeIcon();

  // Attach search event
  const searchInput = document.getElementById("globalSearchInput");
  if (searchInput) {
    searchInput.addEventListener("input", debounce(handleGlobalSearch, 250));
    searchInput.addEventListener("focus", () => {
      if (searchInput.value.trim().length >= 2) handleGlobalSearch();
    });
  }

  // Close dropdowns on outside click
  document.addEventListener("click", (e) => {
    const notifDrop = document.getElementById("notifDropdown");
    const notifBtn = document.getElementById("notifDropdownBtn");
    if (
      notifDrop &&
      notifBtn &&
      !notifBtn.contains(e.target) &&
      !notifDrop.contains(e.target)
    ) {
      notifDrop.style.display = "none";
    }

    const userDrop = document.getElementById("userDropdown");
    const userBtn = document.querySelector(".user-avatar-sm");
    if (
      userDrop &&
      userBtn &&
      !userBtn.contains(e.target) &&
      !userDrop.contains(e.target)
    ) {
      userDrop.style.display = "none";
    }

    const searchResults = document.getElementById("globalSearchResults");
    if (
      searchResults &&
      searchInput &&
      !searchInput.contains(e.target) &&
      !searchResults.contains(e.target)
    ) {
      searchResults.style.display = "none";
    }
  });
}

function renderNotificationListHtml(notifications) {
  if (!notifications || notifications.length === 0) {
    return `<div style="padding:16px;text-align:center;color:var(--gray-400);font-size:0.8rem">No notifications</div>`;
  }
  return notifications
    .map(
      (n) => `
    <div class="notification-item" onclick="handleNotificationClick('${n.id}', '${n.link || "inventory.html"}')" style="cursor:pointer; display:flex; gap:10px; padding:10px 14px; border-bottom:1px solid var(--border-color); background:${n.read ? "transparent" : "rgba(79,70,229,0.04)"}">
      <div class="notification-dot" style="background:${n.type === "danger" ? "var(--danger)" : n.type === "warning" ? "var(--warning)" : "var(--primary)"}"></div>
      <div style="flex:1">
        <div style="font-size:0.8rem; font-weight:${n.read ? "500" : "700"}; color:var(--text-primary)">${n.title || "Alert"}</div>
        <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:2px">${n.message}</div>
        <div style="font-size:0.65rem; color:var(--gray-400); margin-top:4px">${n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now"}</div>
      </div>
    </div>
  `,
    )
    .join("");
}

function toggleNotifDropdown(e) {
  e.stopPropagation();
  const el = document.getElementById("notifDropdown");
  if (el)
    el.style.display =
      el.style.display === "none" || !el.style.display ? "block" : "none";
}

function toggleUserDropdown(e) {
  e.stopPropagation();
  const el = document.getElementById("userDropdown");
  if (el)
    el.style.display =
      el.style.display === "none" || !el.style.display ? "block" : "none";
}

function markAllNotificationsAsRead() {
  const notifications =
    (window.SS && window.SS.getAll
      ? window.SS.getAll("smartstock_notifications")
      : null) ||
    JSON.parse(localStorage.getItem("smartstock_notifications") || "[]");
  const updated = notifications.map((n) => ({ ...n, read: true }));
  if (window.SS && window.SS.saveAll) {
    window.SS.saveAll("smartstock_notifications", updated);
  } else {
    localStorage.setItem("smartstock_notifications", JSON.stringify(updated));
  }
  const badge = document.getElementById("notifBadge");
  if (badge) badge.remove();
  const container = document.getElementById("notifItemsContainer");
  if (container) container.innerHTML = renderNotificationListHtml(updated);
  showToast("All notifications marked as read", "info");
}

function handleNotificationClick(id, link) {
  const notifications = JSON.parse(
    localStorage.getItem("smartstock_notifications") || "[]",
  );
  const updated = notifications.map((n) =>
    n.id === id ? { ...n, read: true } : n,
  );
  localStorage.setItem("smartstock_notifications", JSON.stringify(updated));
  window.location.href = link || "inventory.html";
}

// ─── Global Search Handler ───────────────────────────────────────────────────
function handleGlobalSearch() {
  const input = document.getElementById("globalSearchInput");
  const resultsBox = document.getElementById("globalSearchResults");
  if (!input || !resultsBox) return;

  const query = input.value.trim().toLowerCase();
  if (query.length < 2) {
    resultsBox.style.display = "none";
    resultsBox.innerHTML = "";
    return;
  }

  const products = JSON.parse(
    localStorage.getItem("smartstock_products") || "[]",
  );
  const suppliers = JSON.parse(
    localStorage.getItem("smartstock_suppliers") || "[]",
  );
  const warehouses = JSON.parse(
    localStorage.getItem("smartstock_warehouses") || "[]",
  );
  const orders = JSON.parse(
    localStorage.getItem("smartstock_purchase_orders") || "[]",
  );

  const matchedProducts = products
    .filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(query)) ||
        (p.sku && p.sku.toLowerCase().includes(query)) ||
        (p.category && p.category.toLowerCase().includes(query)),
    )
    .slice(0, 5);

  const matchedSuppliers = suppliers
    .filter(
      (s) =>
        (s.name && s.name.toLowerCase().includes(query)) ||
        (s.contactPerson && s.contactPerson.toLowerCase().includes(query)),
    )
    .slice(0, 3);

  const matchedWarehouses = warehouses
    .filter(
      (w) =>
        (w.name && w.name.toLowerCase().includes(query)) ||
        (w.location && w.location.toLowerCase().includes(query)),
    )
    .slice(0, 2);

  const matchedOrders = orders
    .filter(
      (o) =>
        (o.orderNumber && o.orderNumber.toLowerCase().includes(query)) ||
        (o.productName && o.productName.toLowerCase().includes(query)),
    )
    .slice(0, 2);

  let html = "";

  if (matchedProducts.length > 0) {
    html += `<div style="padding:6px 12px;font-size:0.7rem;text-transform:uppercase;font-weight:700;color:var(--gray-400);background:var(--gray-50)">Products</div>`;
    html += matchedProducts
      .map(
        (p) => `
      <div class="search-result-item" onclick="window.location.href='products.html?search=${encodeURIComponent(p.sku || p.name)}'">
        <i class="fas fa-box text-primary"></i>
        <div style="flex:1">
          <div style="font-weight:600;font-size:0.8rem">${p.name}</div>
          <div style="font-size:0.7rem;color:var(--text-secondary)">SKU: ${p.sku} • Stock: ${p.quantity} • ₹${p.price}</div>
        </div>
        <span class="badge ${p.quantity === 0 ? "badge-danger" : p.quantity <= p.minStock ? "badge-warning" : "badge-success"}">${p.quantity === 0 ? "Out of Stock" : p.quantity <= p.minStock ? "Low Stock" : "In Stock"}</span>
      </div>
    `,
      )
      .join("");
  }

  if (matchedSuppliers.length > 0) {
    html += `<div style="padding:6px 12px;font-size:0.7rem;text-transform:uppercase;font-weight:700;color:var(--gray-400);background:var(--gray-50)">Suppliers</div>`;
    html += matchedSuppliers
      .map(
        (s) => `
      <div class="search-result-item" onclick="window.location.href='suppliers.html?search=${encodeURIComponent(s.name)}'">
        <i class="fas fa-truck text-info"></i>
        <div style="flex:1">
          <div style="font-weight:600;font-size:0.8rem">${s.name}</div>
          <div style="font-size:0.7rem;color:var(--text-secondary)">Contact: ${s.contactPerson} • ${s.phone}</div>
        </div>
      </div>
    `,
      )
      .join("");
  }

  if (matchedWarehouses.length > 0) {
    html += `<div style="padding:6px 12px;font-size:0.7rem;text-transform:uppercase;font-weight:700;color:var(--gray-400);background:var(--gray-50)">Warehouses</div>`;
    html += matchedWarehouses
      .map(
        (w) => `
      <div class="search-result-item" onclick="window.location.href='warehouses.html?search=${encodeURIComponent(w.name)}'">
        <i class="fas fa-warehouse text-warning"></i>
        <div style="flex:1">
          <div style="font-weight:600;font-size:0.8rem">${w.name}</div>
          <div style="font-size:0.7rem;color:var(--text-secondary)">Location: ${w.location}</div>
        </div>
      </div>
    `,
      )
      .join("");
  }

  if (matchedOrders.length > 0) {
    html += `<div style="padding:6px 12px;font-size:0.7rem;text-transform:uppercase;font-weight:700;color:var(--gray-400);background:var(--gray-50)">Purchase Orders</div>`;
    html += matchedOrders
      .map(
        (o) => `
      <div class="search-result-item" onclick="window.location.href='purchase-orders.html?search=${encodeURIComponent(o.orderNumber)}'">
        <i class="fas fa-file-invoice text-success"></i>
        <div style="flex:1">
          <div style="font-weight:600;font-size:0.8rem">${o.orderNumber} - ${o.productName}</div>
          <div style="font-size:0.7rem;color:var(--text-secondary)">Qty: ${o.quantity} • Status: ${o.status}</div>
        </div>
      </div>
    `,
      )
      .join("");
  }

  if (!html) {
    html = `<div style="padding:16px;text-align:center;color:var(--gray-400);font-size:0.85rem">No results matching "${query}"</div>`;
  }

  resultsBox.innerHTML = html;
  resultsBox.style.display = "block";
}

// ─── Theme Management ────────────────────────────────────────────────────────
function applyTheme(theme) {
  const currentTheme = theme || "light";
  document.documentElement.setAttribute("data-theme", currentTheme);
  document.documentElement.setAttribute("data-bs-theme", currentTheme);

  // Persist to settings
  const settings = JSON.parse(
    localStorage.getItem("smartstock_settings") || "{}",
  );
  settings.theme = currentTheme;
  localStorage.setItem("smartstock_settings", JSON.stringify(settings));

  updateThemeIcon();
}

function toggleTheme() {
  const current =
    document.documentElement.getAttribute("data-theme") || "light";
  const newTheme = current === "dark" ? "light" : "dark";
  applyTheme(newTheme);
  showToast(`Switched to ${newTheme} mode`, "info");
}

function updateThemeIcon() {
  const current =
    document.documentElement.getAttribute("data-theme") || "light";
  const icon = document.getElementById("themeToggleIcon");
  if (icon) {
    icon.className = current === "dark" ? "fas fa-sun" : "fas fa-moon";
  }
}

// ─── Mobile Sidebar Toggles ──────────────────────────────────────────────────
function openSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  if (sidebar) sidebar.classList.add("open");
  if (overlay) overlay.classList.add("show");
}

function closeSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  if (sidebar) sidebar.classList.remove("open");
  if (overlay) overlay.classList.remove("show");
}

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  if (sidebar && sidebar.classList.contains("open")) {
    closeSidebar();
  } else {
    openSidebar();
  }
}

// ─── Toast System ────────────────────────────────────────────────────────────
function showToast(message, type = "info", duration = 3500) {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const icons = {
    success: "fas fa-check-circle",
    error: "fas fa-exclamation-circle",
    warning: "fas fa-triangle-exclamation",
    info: "fas fa-circle-info",
  };

  const titles = {
    success: "Success",
    error: "Error",
    warning: "Warning",
    info: "Notice",
  };

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-icon">
      <i class="${icons[type] || icons.info}"></i>
    </div>
    <div class="toast-content">
      <div class="toast-title">${titles[type] || "Notice"}</div>
      <div class="toast-message">${escapeHtml(message)}</div>
    </div>
    <button class="toast-close" aria-label="Close">
      <i class="fas fa-times"></i>
    </button>
  `;

  // Close button
  const closeBtn = toast.querySelector(".toast-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => removeToast(toast));
  }

  container.appendChild(toast);

  // Auto remove
  setTimeout(() => removeToast(toast), duration);
}

function removeToast(toast) {
  if (!toast || toast.classList.contains("removing")) return;
  toast.classList.add("removing");
  setTimeout(() => toast.remove(), 300);
}

// ─── Animated Counter Utility ────────────────────────────────────────────────
function animateCounter(
  element,
  target,
  prefix = "",
  suffix = "",
  duration = 1000,
) {
  if (!element) return;
  const targetNum = Number(target) || 0;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    const currentVal = Math.floor(easeProgress * targetNum);

    element.textContent = `${prefix}${currentVal.toLocaleString("en-IN")}${suffix}`;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = `${prefix}${targetNum.toLocaleString("en-IN")}${suffix}`;
    }
  }

  requestAnimationFrame(update);
}

// ─── Helper Utilities ────────────────────────────────────────────────────────
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ─── Keyboard Shortcuts ──────────────────────────────────────────────────────
document.addEventListener("keydown", (e) => {
  // Ctrl+K or Cmd+K focuses search
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    const searchInput = document.getElementById("globalSearchInput");
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }

  // Escape clears search
  if (e.key === "Escape") {
    const searchResults = document.getElementById("globalSearchResults");
    if (searchResults) searchResults.style.display = "none";
    const notifDrop = document.getElementById("notifDropdown");
    if (notifDrop) notifDrop.style.display = "none";
    const userDrop = document.getElementById("userDropdown");
    if (userDrop) userDrop.style.display = "none";
  }
});

// ─── Global Initializer & Fallbacks ──────────────────────────────────────────
// Apply theme right away before DOM finishes
try {
  const initialSettings = JSON.parse(
    localStorage.getItem("smartstock_settings") || "{}",
  );
  if (initialSettings.theme) {
    document.documentElement.setAttribute("data-theme", initialSettings.theme);
    document.documentElement.setAttribute(
      "data-bs-theme",
      initialSettings.theme,
    );
  }
} catch (_) {}

// Global bindings for both vanilla global calls and window.SS namespace
window.renderSidebar = renderSidebar;
window.renderNavbar = renderNavbar;
window.showToast = showToast;
window.applyTheme = applyTheme;
window.toggleTheme = toggleTheme;
window.openSidebar = openSidebar;
window.closeSidebar = closeSidebar;
window.toggleSidebar = toggleSidebar;
window.animateCounter = animateCounter;
window.escapeHtml = escapeHtml;

window.SS = window.SS || {};
Object.assign(window.SS, {
  renderSidebar,
  renderNavbar,
  showToast,
  applyTheme,
  toggleTheme,
  openSidebar,
  closeSidebar,
  toggleSidebar,
  animateCounter,
  escapeHtml,
});
