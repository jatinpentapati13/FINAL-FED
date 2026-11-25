/**
 * @fileoverview SmartStock LocalStorage Service
 * Provides all data persistence, utility functions, and demo data seeding.
 */

"use strict";

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const KEYS = {
  USERS: "smartstock_users",
  CURRENT_USER: "smartstock_current_user",
  PRODUCTS: "smartstock_products",
  SUPPLIERS: "smartstock_suppliers",
  WAREHOUSES: "smartstock_warehouses",
  MOVEMENTS: "smartstock_movements",
  PURCHASE_ORDERS: "smartstock_purchase_orders",
  NOTIFICATIONS: "smartstock_notifications",
  SETTINGS: "smartstock_settings",
};

// ─── Core Storage Functions ────────────────────────────────────────────────────

/**
 * Retrieve a parsed JSON value from localStorage.
 * @param {string} key - Storage key.
 * @returns {*} Parsed value or null.
 */
function getItem(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error(`[SmartStock] getItem error for key "${key}":`, e);
    return null;
  }
}

/**
 * Serialize and store a value in localStorage.
 * @param {string} key - Storage key.
 * @param {*} value - Value to store.
 */
function setItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`[SmartStock] setItem error for key "${key}":`, e);
  }
}

/**
 * Remove an item from localStorage.
 * @param {string} key - Storage key.
 */
function removeItem(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.error(`[SmartStock] removeItem error for key "${key}":`, e);
  }
}

/**
 * Retrieve an array from localStorage. Returns empty array if not found.
 * @param {string} key - Storage key.
 * @returns {Array} Stored array or [].
 */
function getAll(key) {
  const value = getItem(key);
  return Array.isArray(value) ? value : [];
}

/**
 * Persist an array to localStorage.
 * @param {string} key - Storage key.
 * @param {Array} array - Array to persist.
 */
function saveAll(key, array) {
  setItem(key, Array.isArray(array) ? array : []);
}

// ─── Utility Functions ─────────────────────────────────────────────────────────

/**
 * Generate a unique ID string using timestamp + random suffix.
 * @returns {string} Unique ID.
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/**
 * Format a number as Indian Rupees (₹).
 * @param {number} amount - Numeric amount.
 * @returns {string} Formatted currency string.
 */
function formatCurrency(amount) {
  const num = Number(amount);
  if (isNaN(num)) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(num);
}

/**
 * Format a date string or Date object into a readable format.
 * @param {string|Date} date - Date to format.
 * @returns {string} Formatted date string.
 */
function formatDate(date) {
  if (!date) return "N/A";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "Invalid Date";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

/**
 * Determine stock status based on quantity vs minimum stock level.
 * @param {number} quantity - Current stock quantity.
 * @param {number} minStock - Minimum stock threshold.
 * @returns {'Out of Stock'|'Low Stock'|'In Stock'} Stock status.
 */
function getStatus(quantity, minStock) {
  const qty = Number(quantity);
  const min = Number(minStock);
  if (qty <= 0) return "Out of Stock";
  if (qty <= min) return "Low Stock";
  return "In Stock";
}

// ─── Demo Data ─────────────────────────────────────────────────────────────────

const _now = new Date().toISOString();
const _d = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return d.toISOString();
};

const DEMO_USERS = [
  {
    id: "user_1",
    name: "Raj Sharma",
    email: "admin@smartstock.com",
    password: "admin123",
    phone: "+91 98765 43210",
    role: "Admin",
    joinedDate: "2024-01-15",
    avatar: null,
  },
];

const DEMO_PRODUCTS = [
  {
    id: "prod_1",
    name: "Premium Basmati Rice",
    sku: "RIC-001",
    category: "Grocery",
    price: 250,
    quantity: 150,
    minStock: 20,
    supplierId: "sup_1",
    warehouseId: "wh_1",
    description: "Premium long-grain basmati rice, 5 kg pack.",
    createdAt: _d(60),
    updatedAt: _d(2),
  },
  {
    id: "prod_2",
    name: "Sunflower Cooking Oil",
    sku: "OIL-001",
    category: "Grocery",
    price: 180,
    quantity: 8,
    minStock: 15,
    supplierId: "sup_1",
    warehouseId: "wh_1",
    description: "Refined sunflower cooking oil, 1 litre bottle.",
    createdAt: _d(55),
    updatedAt: _d(1),
  },
  {
    id: "prod_3",
    name: "Wireless Keyboard",
    sku: "KEY-001",
    category: "Electronics",
    price: 1299,
    quantity: 45,
    minStock: 10,
    supplierId: "sup_2",
    warehouseId: "wh_2",
    description: "Compact wireless keyboard with 2.4 GHz connectivity.",
    createdAt: _d(50),
    updatedAt: _d(3),
  },
  {
    id: "prod_4",
    name: "Bluetooth Headphones",
    sku: "HEAD-001",
    category: "Electronics",
    price: 2499,
    quantity: 5,
    minStock: 10,
    supplierId: "sup_2",
    warehouseId: "wh_2",
    description: "Over-ear Bluetooth headphones with noise cancellation.",
    createdAt: _d(48),
    updatedAt: _d(1),
  },
  {
    id: "prod_5",
    name: "LED Monitor",
    sku: "MON-001",
    category: "Electronics",
    price: 15999,
    quantity: 0,
    minStock: 5,
    supplierId: "sup_2",
    warehouseId: "wh_2",
    description: "24-inch Full HD LED monitor with HDMI & VGA ports.",
    createdAt: _d(45),
    updatedAt: _d(0),
  },
  {
    id: "prod_6",
    name: "Cotton Shirt",
    sku: "SHRT-001",
    category: "Clothing",
    price: 599,
    quantity: 75,
    minStock: 20,
    supplierId: "sup_3",
    warehouseId: "wh_3",
    description: "100% cotton formal shirt, available in multiple sizes.",
    createdAt: _d(40),
    updatedAt: _d(4),
  },
  {
    id: "prod_7",
    name: "Premium Notebook",
    sku: "NOTE-001",
    category: "Stationery",
    price: 120,
    quantity: 200,
    minStock: 30,
    supplierId: "sup_4",
    warehouseId: "wh_1",
    description: "A5 premium ruled notebook, 200 pages.",
    createdAt: _d(38),
    updatedAt: _d(2),
  },
  {
    id: "prod_8",
    name: "Office Desk Lamp",
    sku: "LAMP-001",
    category: "Home",
    price: 899,
    quantity: 30,
    minStock: 10,
    supplierId: "sup_5",
    warehouseId: "wh_3",
    description: "LED desk lamp with adjustable brightness and USB port.",
    createdAt: _d(35),
    updatedAt: _d(3),
  },
  {
    id: "prod_9",
    name: "USB-C Cable",
    sku: "USB-001",
    category: "Electronics",
    price: 349,
    quantity: 120,
    minStock: 25,
    supplierId: "sup_2",
    warehouseId: "wh_2",
    description: "1.5m braided USB-C to USB-A fast-charging cable.",
    createdAt: _d(30),
    updatedAt: _d(1),
  },
  {
    id: "prod_10",
    name: "Coffee Powder",
    sku: "COF-001",
    category: "Grocery",
    price: 450,
    quantity: 3,
    minStock: 10,
    supplierId: "sup_1",
    warehouseId: "wh_1",
    description: "Premium filter coffee powder blend, 500 g pack.",
    createdAt: _d(28),
    updatedAt: _d(0),
  },
  {
    id: "prod_11",
    name: "Ballpoint Pen Set",
    sku: "PEN-001",
    category: "Stationery",
    price: 85,
    quantity: 500,
    minStock: 50,
    supplierId: "sup_4",
    warehouseId: "wh_1",
    description: "Pack of 10 ballpoint pens, blue & black ink.",
    createdAt: _d(25),
    updatedAt: _d(2),
  },
  {
    id: "prod_12",
    name: "Wireless Mouse",
    sku: "MSE-001",
    category: "Electronics",
    price: 799,
    quantity: 0,
    minStock: 8,
    supplierId: "sup_2",
    warehouseId: "wh_2",
    description: "Ergonomic wireless mouse with 1600 DPI sensor.",
    createdAt: _d(22),
    updatedAt: _d(0),
  },
  {
    id: "prod_13",
    name: "Cotton Bedsheet",
    sku: "BED-001",
    category: "Home",
    price: 1299,
    quantity: 40,
    minStock: 10,
    supplierId: "sup_3",
    warehouseId: "wh_3",
    description: "Double bed cotton bedsheet with 2 pillow covers.",
    createdAt: _d(20),
    updatedAt: _d(5),
  },
  {
    id: "prod_14",
    name: "Instant Noodles",
    sku: "NOD-001",
    category: "Grocery",
    price: 15,
    quantity: 1000,
    minStock: 100,
    supplierId: "sup_1",
    warehouseId: "wh_4",
    description: "Masala flavour instant noodles, 70 g pack.",
    createdAt: _d(18),
    updatedAt: _d(1),
  },
  {
    id: "prod_15",
    name: "A4 Paper Ream",
    sku: "PAP-001",
    category: "Stationery",
    price: 350,
    quantity: 180,
    minStock: 30,
    supplierId: "sup_4",
    warehouseId: "wh_1",
    description: "500-sheet A4 80 GSM copier paper ream.",
    createdAt: _d(15),
    updatedAt: _d(2),
  },
];

const DEMO_SUPPLIERS = [
  {
    id: "sup_1",
    name: "Agro Fresh Suppliers",
    contactPerson: "Amit Kumar",
    email: "amit@agrofresh.com",
    phone: "+91 98100 12345",
    address: "Mumbai, Maharashtra",
    status: "Active",
  },
  {
    id: "sup_2",
    name: "TechWorld Electronics",
    contactPerson: "Priya Singh",
    email: "priya@techworld.com",
    phone: "+91 98200 23456",
    address: "Bengaluru, Karnataka",
    status: "Active",
  },
  {
    id: "sup_3",
    name: "Fabric Hub",
    contactPerson: "Rahul Verma",
    email: "rahul@fabrichub.com",
    phone: "+91 98300 34567",
    address: "Surat, Gujarat",
    status: "Active",
  },
  {
    id: "sup_4",
    name: "Stationery Plus",
    contactPerson: "Sneha Patel",
    email: "sneha@stationeryplus.com",
    phone: "+91 98400 45678",
    address: "Delhi",
    status: "Active",
  },
  {
    id: "sup_5",
    name: "Home Essentials Co",
    contactPerson: "Vikram Rao",
    email: "vikram@homeessentials.com",
    phone: "+91 98500 56789",
    address: "Pune, Maharashtra",
    status: "Inactive",
  },
];

const DEMO_WAREHOUSES = [
  {
    id: "wh_1",
    name: "Warehouse A",
    location: "Mumbai, Maharashtra",
    manager: "Suresh Nair",
    capacity: 5000,
    status: "Active",
  },
  {
    id: "wh_2",
    name: "Warehouse B",
    location: "Bengaluru, Karnataka",
    manager: "Deepa Krishnan",
    capacity: 3000,
    status: "Active",
  },
  {
    id: "wh_3",
    name: "Warehouse C",
    location: "Delhi",
    manager: "Mohit Gupta",
    capacity: 4000,
    status: "Active",
  },
  {
    id: "wh_4",
    name: "Warehouse D",
    location: "Chennai, Tamil Nadu",
    manager: "Kavitha Rajan",
    capacity: 2500,
    status: "Active",
  },
];

const DEMO_MOVEMENTS = [
  {
    id: "mov_1",
    productId: "prod_1",
    productName: "Premium Basmati Rice",
    sku: "RIC-001",
    type: "Stock In",
    quantity: 50,
    fromWarehouseId: "",
    toWarehouseId: "wh_1",
    user: "Raj Sharma",
    performedBy: "Raj Sharma",
    date: _d(10),
    notes: "Initial batch from Agro Fresh",
  },
  {
    id: "mov_2",
    productId: "prod_2",
    productName: "Sunflower Cooking Oil",
    sku: "OIL-001",
    type: "Stock Out",
    quantity: 20,
    fromWarehouseId: "wh_1",
    toWarehouseId: "",
    user: "Raj Sharma",
    performedBy: "Raj Sharma",
    date: _d(9),
    notes: "Dispatched to retail outlet",
  },
  {
    id: "mov_3",
    productId: "prod_3",
    productName: "Wireless Keyboard",
    sku: "KEY-001",
    type: "Stock In",
    quantity: 25,
    fromWarehouseId: "",
    toWarehouseId: "wh_2",
    user: "Raj Sharma",
    performedBy: "Raj Sharma",
    date: _d(8),
    notes: "Stock received from TechWorld",
  },
  {
    id: "mov_4",
    productId: "prod_4",
    productName: "Bluetooth Headphones",
    sku: "HEAD-001",
    type: "Stock Out",
    quantity: 10,
    fromWarehouseId: "wh_2",
    toWarehouseId: "",
    user: "Raj Sharma",
    performedBy: "Raj Sharma",
    date: _d(7),
    notes: "Online customer order fulfilment",
  },
  {
    id: "mov_5",
    productId: "prod_5",
    productName: "LED Monitor",
    sku: "MON-001",
    type: "Transfer",
    quantity: 5,
    fromWarehouseId: "wh_2",
    toWarehouseId: "wh_3",
    user: "Raj Sharma",
    performedBy: "Raj Sharma",
    date: _d(6),
    notes: "Inter-warehouse transfer to Delhi",
  },
  {
    id: "mov_6",
    productId: "prod_7",
    productName: "Premium Notebook",
    sku: "NOTE-001",
    type: "Stock In",
    quantity: 100,
    fromWarehouseId: "",
    toWarehouseId: "wh_1",
    user: "Raj Sharma",
    performedBy: "Raj Sharma",
    date: _d(5),
    notes: "Bulk restock from Stationery Plus",
  },
  {
    id: "mov_7",
    productId: "prod_9",
    productName: "USB-C Cable",
    sku: "USB-001",
    type: "Stock In",
    quantity: 60,
    fromWarehouseId: "",
    toWarehouseId: "wh_2",
    user: "Raj Sharma",
    performedBy: "Raj Sharma",
    date: _d(4),
    notes: "Received with accessory shipment",
  },
  {
    id: "mov_8",
    productId: "prod_10",
    productName: "Coffee Powder",
    sku: "COF-001",
    type: "Stock Out",
    quantity: 15,
    fromWarehouseId: "wh_1",
    toWarehouseId: "",
    user: "Raj Sharma",
    performedBy: "Raj Sharma",
    date: _d(3),
    notes: "Corporate pantry order",
  },
  {
    id: "mov_9",
    productId: "prod_14",
    productName: "Instant Noodles",
    sku: "NOD-001",
    type: "Stock In",
    quantity: 500,
    fromWarehouseId: "",
    toWarehouseId: "wh_4",
    user: "Raj Sharma",
    performedBy: "Raj Sharma",
    date: _d(2),
    notes: "Bulk stock arrival at Chennai",
  },
  {
    id: "mov_10",
    productId: "prod_6",
    productName: "Cotton Shirt",
    sku: "SHRT-001",
    type: "Adjustment",
    quantity: 5,
    fromWarehouseId: "wh_3",
    toWarehouseId: "wh_3",
    user: "Raj Sharma",
    performedBy: "Raj Sharma",
    date: _d(1),
    notes: "Physical count audit correction",
  },
];

const DEMO_PURCHASE_ORDERS = [
  {
    id: "po_1",
    orderNumber: "PO-001",
    supplierId: "sup_1",
    supplierName: "Agro Fresh Suppliers",
    productId: "prod_1",
    productName: "Premium Basmati Rice",
    sku: "RIC-001",
    quantity: 50,
    unitPrice: 230,
    totalAmount: 11500,
    status: "Received",
    orderDate: _d(15),
    expectedDeliveryDate: _d(10),
    notes: "Urgent harvest restock.",
  },
  {
    id: "po_2",
    orderNumber: "PO-002",
    supplierId: "sup_2",
    supplierName: "TechWorld Electronics",
    productId: "prod_3",
    productName: "Wireless Keyboard",
    sku: "KEY-001",
    quantity: 25,
    unitPrice: 1100,
    totalAmount: 27500,
    status: "Received",
    orderDate: _d(12),
    expectedDeliveryDate: _d(8),
    notes: "Regular electronics restock.",
  },
  {
    id: "po_3",
    orderNumber: "PO-003",
    supplierId: "sup_4",
    supplierName: "Stationery Plus",
    productId: "prod_7",
    productName: "Premium Notebook",
    sku: "NOTE-001",
    quantity: 100,
    unitPrice: 105,
    totalAmount: 10500,
    status: "Received",
    orderDate: _d(10),
    expectedDeliveryDate: _d(6),
    notes: "Q4 stationery supplies.",
  },
  {
    id: "po_4",
    orderNumber: "PO-004",
    supplierId: "sup_1",
    supplierName: "Agro Fresh Suppliers",
    productId: "prod_2",
    productName: "Sunflower Cooking Oil",
    sku: "OIL-001",
    quantity: 40,
    unitPrice: 160,
    totalAmount: 6400,
    status: "Pending",
    orderDate: _d(3),
    expectedDeliveryDate: _d(-4),
    notes: "Low stock replenishment.",
  },
  {
    id: "po_5",
    orderNumber: "PO-005",
    supplierId: "sup_2",
    supplierName: "TechWorld Electronics",
    productId: "prod_5",
    productName: "LED Monitor",
    sku: "MON-001",
    quantity: 10,
    unitPrice: 14500,
    totalAmount: 145000,
    status: "Approved",
    orderDate: _d(1),
    expectedDeliveryDate: _d(-7),
    notes: "Critical out-of-stock reorder.",
  },
];

const DEMO_NOTIFICATIONS = [
  {
    id: "notif_1",
    type: "warning",
    title: "Low Stock Alert",
    message:
      "Sunflower Cooking Oil (OIL-001) is running low — only 8 units remaining (min: 15).",
    productId: "prod_2",
    read: false,
    createdAt: _d(1),
  },
  {
    id: "notif_2",
    type: "danger",
    title: "Out of Stock Alert",
    message:
      "LED Monitor (MON-001) is completely out of stock. Reorder immediately.",
    productId: "prod_5",
    read: false,
    createdAt: _d(0),
  },
  {
    id: "notif_3",
    type: "warning",
    title: "Low Stock Alert",
    message:
      "Bluetooth Headphones (HEAD-001) stock is critical — only 5 units (min: 10).",
    productId: "prod_4",
    read: false,
    createdAt: _d(0),
  },
  {
    id: "notif_4",
    type: "danger",
    title: "Out of Stock Alert",
    message:
      "Wireless Mouse (MSE-001) is out of stock. A purchase order has been raised.",
    productId: "prod_12",
    read: true,
    createdAt: _d(2),
  },
  {
    id: "notif_5",
    type: "warning",
    title: "Low Stock Alert",
    message:
      "Coffee Powder (COF-001) is critically low — only 3 units remaining (min: 10).",
    productId: "prod_10",
    read: true,
    createdAt: _d(1),
  },
];

const DEMO_SETTINGS = {
  theme: "light",
  lowStockAlerts: true,
  outOfStockAlerts: true,
  purchaseOrderAlerts: true,
  defaultMinStock: 10,
};

/**
 * Seed demo data into localStorage if not already present.
 * Safe to call multiple times — will not overwrite existing data.
 */
function initDemoData() {
  if (!getItem(KEYS.USERS)) {
    saveAll(KEYS.USERS, DEMO_USERS);
  }
  if (!getItem(KEYS.PRODUCTS)) {
    saveAll(KEYS.PRODUCTS, DEMO_PRODUCTS);
  }
  if (!getItem(KEYS.SUPPLIERS)) {
    saveAll(KEYS.SUPPLIERS, DEMO_SUPPLIERS);
  }
  if (!getItem(KEYS.WAREHOUSES)) {
    saveAll(KEYS.WAREHOUSES, DEMO_WAREHOUSES);
  }
  if (!getItem(KEYS.MOVEMENTS)) {
    saveAll(KEYS.MOVEMENTS, DEMO_MOVEMENTS);
  }
  if (!getItem(KEYS.PURCHASE_ORDERS)) {
    saveAll(KEYS.PURCHASE_ORDERS, DEMO_PURCHASE_ORDERS);
  }
  if (!getItem(KEYS.NOTIFICATIONS)) {
    saveAll(KEYS.NOTIFICATIONS, DEMO_NOTIFICATIONS);
  }
  if (!getItem(KEYS.SETTINGS)) {
    setItem(KEYS.SETTINGS, DEMO_SETTINGS);
  }
}

// ─── Export (window-level globals for plain HTML pages) ───────────────────────

window.getItem = getItem;
window.setItem = setItem;
window.removeItem = removeItem;
window.getAll = getAll;
window.saveAll = saveAll;
window.generateId = generateId;
window.formatCurrency = formatCurrency;
window.formatDate = formatDate;
window.getStatus = getStatus;
window.initDemoData = initDemoData;
window.SS = window.SS || {};
window.StorageManager = window.SS;
Object.assign(window.SS, {
  KEYS,
  getItem,
  setItem,
  removeItem,
  getAll,
  saveAll,
  generateId,
  formatCurrency,
  formatDate,
  getStatus,
  initDemoData,
});

// Auto-seed demo data immediately if localStorage is unseeded
try {
  initDemoData();
} catch (e) {
  console.warn("[SmartStock] Auto-seeding error:", e);
}
