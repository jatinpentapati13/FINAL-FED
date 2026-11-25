# SmartStock — Inventory Management System

> A complete, modern Inventory Management System built entirely with frontend technologies — HTML5, CSS3, and Vanilla JavaScript.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-4-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)

---

## 📋 Project Overview

**SmartStock** is a complete frontend Inventory Management System designed and built for academic purposes as a **Frontend Development Framework** project. It simulates a fully functional inventory platform using browser **LocalStorage** for data persistence — eliminating the need for a backend server while still demonstrating real-world application architecture.

The system covers the full lifecycle of inventory management — from user authentication and product cataloguing to stock movement tracking, purchase order workflows, warehouse management, and analytics reporting — all in a responsive, theme-aware UI.

---

## ✨ Features

### 🔐 Authentication & User Management
- **Complete Authentication Flow** — Login, Register, and Forgot Password pages
- **Session Persistence** — Logged-in state survives page refresh via LocalStorage
- **Demo Account** — Pre-loaded admin credentials for instant access
- **User Profile Management** — Edit name, email, avatar initials, and contact info

### 📊 Dashboard
- **Real-Time KPI Cards** — Total products, low stock alerts, inventory value, pending orders
- **Interactive Charts** — Stock overview bar chart and category distribution doughnut chart (Chart.js)
- **Recent Activity Feed** — Latest stock movements at a glance
- **Quick Action Buttons** — One-click navigation to key modules

### 📦 Product Management
- **Full CRUD** — Create, Read, Update, Delete products
- **Advanced Search** — Live search by name, SKU, or category
- **Filter & Sort** — Filter by category/status, sort by name, price, or stock level
- **Stock Level Indicators** — Color-coded badges (In Stock / Low Stock / Out of Stock)
- **Product Cards & Table Views** — Toggle between grid and list display

### 🏭 Inventory Management
- **Stock Level Visualization** — Progress bars showing warehouse fill percentage
- **Low Stock Alerts** — Highlighted warnings for items below reorder point
- **Inventory Value Calculation** — Real-time total valuation per product
- **Category Breakdown** — Stock distributed by product category
- **Stock Adjustment** — Direct quantity corrections with reason logging

### 🔄 Stock Movement Tracking
- **Movement Types** — Stock In, Stock Out, Adjustment, and Transfer
- **Movement History** — Full chronological log of all stock changes
- **Reference Tracking** — Link movements to PO numbers or notes
- **Warehouse-to-Warehouse Transfer** — Record inter-warehouse stock movement
- **Search & Filter Movements** — Find by type, product, or date range

### 🏢 Supplier Management
- **Supplier Directory** — Contact cards with company, email, phone, and address
- **Full CRUD** — Add, edit, and delete supplier records
- **Supplier Status** — Active/Inactive classification
- **Search Suppliers** — Instant name or contact search

### 🏬 Warehouse Management
- **Warehouse Profiles** — Name, location, capacity, and manager info
- **Occupancy Tracking** — Visual capacity bars per warehouse
- **Multiple Warehouses** — Support for managing distributed locations
- **Warehouse CRUD** — Add, edit, and remove warehouse records

### 🛒 Purchase Orders
- **Create Purchase Orders** — Select supplier, products, and quantities
- **Order Lifecycle** — Status flow: Draft → Pending → Approved → Received / Cancelled
- **Approve & Receive** — Receiving a PO auto-updates inventory stock levels
- **Cancel Orders** — With confirmation prompts
- **Order History** — Full log of all purchase orders with totals

### 📈 Reports & Analytics
- **5 Report Types:**
  - Inventory Summary Report
  - Stock Movement Report
  - Low Stock / Reorder Report
  - Supplier Report
  - Purchase Order Report
- **CSV Export** — Download any report as a `.csv` file
- **Print Support** — Print-optimized report layout
- **Date Range Filtering** — Filter report data by custom date ranges

### ⚙️ Settings
- **Theme Toggle** — Light Mode / Dark Mode with full UI adaptation
- **Notification Preferences** — Toggle alerts for low stock, PO updates, etc.
- **Data Management** — Clear specific data stores or reset all demo data
- **Display Preferences** — Items per page, default views

### 🌐 Global UI / UX
- **Dark Mode** — Complete dark theme across all pages
- **Global Search** — `Ctrl+K` keyboard shortcut opens instant search overlay
- **Toast Notifications** — Non-blocking success, warning, error, and info alerts
- **Responsive Design** — Fully usable from mobile (320px) to large desktop (1920px+)
- **Sidebar Navigation** — Collapsible sidebar with active state highlighting
- **LocalStorage Persistence** — All data survives page refresh and browser restart
- **Demo Data Pre-Loaded** — 15 products, 5 suppliers, 4 warehouses, 10 movements, 5 POs

---

## 🛠️ Technology Stack

| Technology | Version | Purpose |
|---|---|---|
| **HTML5** | — | Semantic page structure and markup |
| **CSS3** | — | Custom Properties, Flexbox, Grid, Keyframe Animations |
| **JavaScript** | ES6+ | App logic, Classes, Modules pattern, Arrow Functions, Template Literals |
| **Bootstrap** | 5.3 | Grid system, utility classes, responsive breakpoints |
| **Font Awesome** | 6 | Icon library across all UI elements |
| **Chart.js** | 4 | Bar charts, doughnut charts, dashboard visualizations |
| **Google Fonts** | — | Inter typeface for clean, modern typography |
| **LocalStorage API** | Browser | Client-side data persistence (simulated backend) |

---

## 📁 Project Structure

```
SmartStock/
│
├── index.html                  # Landing / welcome page
├── login.html                  # User login page
├── register.html               # New user registration page
├── forgot-password.html        # Password reset flow page
├── dashboard.html              # Main dashboard with KPIs and charts
├── inventory.html              # Inventory management page
├── products.html               # Product catalog management
├── suppliers.html              # Supplier directory management
├── warehouses.html             # Warehouse management
├── stock-movement.html         # Stock movement tracking log
├── purchase-orders.html        # Purchase order management
├── reports.html                # Reports and analytics
├── profile.html                # User profile page
├── settings.html               # Application settings
│
├── css/
│   ├── style.css               # Master stylesheet — design system, CSS variables, base components
│   ├── auth.css                # Styles specific to login, register, forgot-password pages
│   ├── dashboard.css           # Dashboard layout, KPI cards, chart containers
│   ├── inventory.css           # Inventory, products, suppliers, warehouse page styles
│   └── responsive.css          # All media queries and responsive breakpoints
│
├── js/
│   ├── storage.js              # LocalStorage service, schema definitions, demo data seeding
│   ├── auth.js                 # Authentication — login, register, session, logout
│   ├── app.js                  # Global app shell — sidebar, navbar, toast system, global search
│   ├── dashboard.js            # Dashboard KPI calculations, Chart.js rendering
│   ├── products.js             # Product CRUD operations, search, filter, sort
│   ├── inventory.js            # Inventory view, stock level calculations, adjustments
│   ├── suppliers.js            # Supplier CRUD and contact management
│   ├── warehouses.js           # Warehouse CRUD and occupancy tracking
│   ├── movements.js            # Stock movement recording and history log
│   ├── purchase-orders.js      # PO creation, approval, receiving, cancellation
│   ├── reports.js              # Report generation, data aggregation, CSV export
│   ├── profile.js              # User profile view and edit
│   └── settings.js             # Theme toggle, notification prefs, data management
│
└── assets/
    ├── images/                 # Image assets (logos, illustrations)
    └── icons/                  # Custom icon assets
```

---

## 🚀 How to Run

### ✅ Method 1: VS Code Live Server *(Recommended)*

1. **Open VS Code**
2. **Install the Live Server extension** by Ritwick Dey *(if not already installed)*:
   - Go to Extensions panel → `Ctrl+Shift+X`
   - Search **"Live Server"**
   - Click **Install**
3. **Open the `SmartStock` folder** in VS Code (`File → Open Folder`)
4. In the Explorer panel, **right-click** on `index.html`
5. Select **"Open with Live Server"**
6. The website opens automatically at:
   ```
   http://127.0.0.1:5500/SmartStock/index.html
   ```

> **Why Live Server?** It serves files over HTTP, which allows LocalStorage to work correctly and avoids browser security restrictions on the `file://` protocol.

---

### 🌐 Method 2: Direct Browser (Simple)

1. Navigate to the `SmartStock` folder on your computer
2. **Double-click** `index.html` to open it directly in your browser

> ⚠️ **Note:** Some browsers restrict LocalStorage access on `file://` URLs. If data does not persist or the app behaves unexpectedly, switch to **Method 1 (Live Server)** for the best experience.

---

## 🔑 Demo Credentials

Use the following pre-loaded credentials to log in instantly:

| Field | Value |
|---|---|
| **Email** | `admin@smartstock.com` |
| **Password** | `admin123` |
| **Display Name** | Raj Sharma |
| **Role** | Administrator |

> Demo data is **automatically seeded** on first run. No manual setup is required.

### 📦 Pre-Loaded Demo Data

| Data Type | Count |
|---|---|
| Products | 15 |
| Suppliers | 5 |
| Warehouses | 4 |
| Stock Movements | 10 |
| Purchase Orders | 5 |

---

## 🗄️ LocalStorage Keys

All application data is stored in the browser's LocalStorage under the following keys:

| Key | Purpose |
|---|---|
| `smartstock_users` | Registered user accounts (email, hashed info, role) |
| `smartstock_current_user` | Currently active login session data |
| `smartstock_products` | Full product catalog with SKUs, prices, and quantities |
| `smartstock_suppliers` | Supplier directory with contact and address information |
| `smartstock_warehouses` | Warehouse locations, capacity, and manager info |
| `smartstock_movements` | Chronological stock movement history log |
| `smartstock_purchase_orders` | All purchase orders and their line items |
| `smartstock_notifications` | In-app system notification records |
| `smartstock_settings` | User preferences including theme (dark/light) and display options |

> To fully reset the application, open **Settings → Data Management → Reset All Data**. This clears all keys and re-seeds fresh demo data.

---

## ⚠️ Important Note on Authentication

> **This project uses browser LocalStorage for authentication simulation. This is NOT secure for production use.**
>
> In a real-world application, authentication would be handled by a **secure backend server** with:
> - Password hashing (bcrypt / Argon2)
> - JWT or session-based tokens
> - HTTPS enforcement
> - Server-side validation and rate limiting
>
> This implementation exists **solely for academic and demonstration purposes** to showcase frontend architecture patterns.

---

## ✅ Implemented Features Checklist

### Authentication
- [x] Login page with form validation
- [x] Register page with duplicate email check
- [x] Forgot password page (simulated reset flow)
- [x] Session persistence across page refresh
- [x] Logout with session clearing

### Dashboard
- [x] Total products KPI card
- [x] Low stock alerts KPI card
- [x] Total inventory value KPI card
- [x] Pending purchase orders KPI card
- [x] Bar chart — stock overview by category
- [x] Doughnut chart — inventory distribution
- [x] Recent stock movements widget
- [x] Quick action navigation buttons

### Products
- [x] Product list with search
- [x] Add new product modal / form
- [x] Edit product details
- [x] Delete product with confirmation
- [x] Filter by category and status
- [x] Sort by name, price, stock

### Inventory
- [x] Stock level progress bars
- [x] Low stock highlighting
- [x] Inventory value per product
- [x] Stock adjustment form
- [x] Category stock summary

### Stock Movements
- [x] Stock In recording
- [x] Stock Out recording
- [x] Adjustment type movement
- [x] Warehouse Transfer movement
- [x] Movement history table
- [x] Search and filter movements

### Suppliers
- [x] Supplier card directory
- [x] Add / Edit / Delete supplier
- [x] Supplier search

### Warehouses
- [x] Warehouse profile cards
- [x] Capacity and occupancy tracking
- [x] Add / Edit / Delete warehouse

### Purchase Orders
- [x] Create new purchase order
- [x] Add multiple line items
- [x] Approve order workflow
- [x] Receive order (auto-updates stock)
- [x] Cancel order
- [x] Order history list

### Reports
- [x] Inventory Summary report
- [x] Stock Movement report
- [x] Low Stock / Reorder report
- [x] Supplier report
- [x] Purchase Order report
- [x] CSV export for all reports
- [x] Print-optimized layout

### UI / UX
- [x] Dark Mode — complete full-UI theme
- [x] Light Mode (default)
- [x] Global search overlay (`Ctrl+K`)
- [x] Toast notification system (success, warning, error, info)
- [x] Collapsible sidebar
- [x] Active navigation state
- [x] Responsive design (mobile to desktop)
- [x] Loading states and empty state illustrations
- [x] Confirmation dialogs for destructive actions
- [x] Demo data auto-seeding on first run

---

## ⚡ Limitations

| Limitation | Detail |
|---|---|
| **Storage Cap** | LocalStorage is limited to ~5MB per origin; large datasets may hit this limit |
| **Browser-Specific** | Data is stored locally in the browser; it does not sync across devices or users |
| **Simulated Auth** | Authentication is client-side only — not suitable for production |
| **No Email** | Password reset does not send real emails; flow is simulated |
| **No Real-Time Sync** | Multi-user collaboration is not supported; changes are local only |
| **No Image Storage** | Product images use icon placeholders; binary uploads are not implemented |

---

## 🔮 Future Improvements

- [ ] **Backend Integration** — REST API with Node.js/Express or Firebase Firestore
- [ ] **Real Authentication** — JWT tokens, bcrypt password hashing, refresh tokens
- [ ] **Image Uploads** — Product photo upload and storage (Cloudinary / S3)
- [ ] **PDF Reports** — Export reports directly to PDF using jsPDF or Puppeteer
- [ ] **Email Notifications** — Automated low-stock alerts and PO confirmations
- [ ] **Role-Based Access Control** — Admin, Manager, and Staff permission tiers
- [ ] **Barcode / QR Scanner** — Web-based scanner using device camera
- [ ] **Mobile App** — React Native or Flutter wrapper for iOS and Android
- [ ] **CSV / Excel Import** — Bulk product or supplier data import
- [ ] **Full Audit Trail** — Immutable history log for all data changes with user attribution
- [ ] **Multi-Language Support** — i18n internationalization for global use

---

## 🎓 Academic Information

| Field | Detail |
|---|---|
| **Project Type** | Frontend Development Framework Project |
| **Subject** | Web Development / Frontend Engineering |
| **Purpose** | Demonstrates frontend architecture, JavaScript modules, LocalStorage, responsive design, and modern UI/UX principles |

### Technologies Demonstrated

- ✅ **HTML5 Semantics** — Proper use of `<main>`, `<section>`, `<article>`, `<nav>`, ARIA attributes
- ✅ **CSS Custom Properties** — Design tokens for colors, spacing, and typography
- ✅ **CSS Grid & Flexbox** — Complex responsive layouts without a CSS framework dependency
- ✅ **CSS Animations** — Smooth transitions, toast animations, loading spinners
- ✅ **ES6+ JavaScript** — Classes, arrow functions, destructuring, template literals, modules pattern
- ✅ **LocalStorage API** — Full CRUD persistence without a backend
- ✅ **Chart.js** — Data visualization integration
- ✅ **Bootstrap 5** — Utility-first responsive grid system
- ✅ **Responsive Design** — Mobile-first media queries across all breakpoints
- ✅ **UI/UX Principles** — Consistent design system, accessibility considerations, user feedback patterns

---

## 📄 License

This project is created for **academic and educational purposes**. Free to use, modify, and reference with attribution.

---

<div align="center">

*SmartStock — Built with ❤️ using HTML, CSS and JavaScript*

</div>
