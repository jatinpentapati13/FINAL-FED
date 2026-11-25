/**
 * SmartStock - Profile Management Module
 * Handles user account editing, password updates, and session state synchronization.
 */

"use strict";

let profileUser = null;

// ─── Initialisation ───────────────────────────────────────────────────────────
function initProfile() {
  if (typeof requireAuth === "function") requireAuth();
  if (typeof initDemoData === "function") initDemoData();
  if (typeof renderSidebar === "function") renderSidebar("profile");
  if (typeof renderNavbar === "function") renderNavbar();

  loadProfile();
}

function loadProfile() {
  profileUser = (window.SS && window.SS.getCurrentUser
    ? window.SS.getCurrentUser()
    : null) ||
    JSON.parse(localStorage.getItem("smartstock_current_user") || "null") || {
      name: "Raj Sharma",
      email: "admin@smartstock.com",
      role: "Admin",
      phone: "+91 98765 43210",
      joinedDate: "2024-01-15",
    };

  // Initials
  const initials = (profileUser.name || "User")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const avatarEl = document.getElementById("profileAvatarLarge");
  if (avatarEl) avatarEl.textContent = initials;

  const nameEl = document.getElementById("profileDisplayName");
  if (nameEl) nameEl.textContent = profileUser.name;

  const emailEl = document.getElementById("profileDisplayEmail");
  if (emailEl) emailEl.textContent = profileUser.email;

  const roleEl = document.getElementById("profileRoleBadge");
  if (roleEl) roleEl.textContent = profileUser.role || "Admin";

  const phoneEl = document.getElementById("profileDisplayPhone");
  if (phoneEl) phoneEl.textContent = profileUser.phone || "—";

  const joinedEl = document.getElementById("profileDisplayJoined");
  if (joinedEl && profileUser.joinedDate) {
    const jd = new Date(profileUser.joinedDate);
    joinedEl.textContent = jd.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // Populate Form Fields
  const formName = document.getElementById("prof_name");
  if (formName) formName.value = profileUser.name || "";

  const formEmail = document.getElementById("prof_email");
  if (formEmail) formEmail.value = profileUser.email || "";

  const formPhone = document.getElementById("prof_phone");
  if (formPhone) formPhone.value = profileUser.phone || "";

  const formRole = document.getElementById("prof_role");
  if (formRole) formRole.value = profileUser.role || "Admin";

  // Load activity metrics
  const products = JSON.parse(
    localStorage.getItem("smartstock_products") || "[]",
  );
  const movements = JSON.parse(
    localStorage.getItem("smartstock_movements") || "[]",
  );
  const orders = JSON.parse(
    localStorage.getItem("smartstock_purchase_orders") || "[]",
  );

  const prodCountEl = document.getElementById("profProdCount");
  const movCountEl = document.getElementById("profMovCount");
  const poCountEl = document.getElementById("profPoCount");

  if (prodCountEl) prodCountEl.textContent = products.length;
  if (movCountEl) movCountEl.textContent = movements.length;
  if (poCountEl) poCountEl.textContent = orders.length;
}

// ─── Save Personal Details ───────────────────────────────────────────────────
function saveProfile(event) {
  event.preventDefault();

  const name = document.getElementById("prof_name").value.trim();
  const email = document.getElementById("prof_email").value.trim();
  const phone = document.getElementById("prof_phone").value.trim();

  let isValid = true;
  const nameErr = document.getElementById("prof_name_err");
  const emailErr = document.getElementById("prof_email_err");

  document.getElementById("prof_name").classList.remove("is-invalid");
  document.getElementById("prof_email").classList.remove("is-invalid");

  if (!name) {
    document.getElementById("prof_name").classList.add("is-invalid");
    if (nameErr) nameErr.textContent = "Name is required.";
    isValid = false;
  }

  if (!email || !email.includes("@")) {
    document.getElementById("prof_email").classList.add("is-invalid");
    if (emailErr) emailErr.textContent = "Valid email is required.";
    isValid = false;
  }

  if (!isValid) return;

  // Update in Users table
  const users = JSON.parse(localStorage.getItem("smartstock_users") || "[]");
  const userIdx = users.findIndex(
    (u) => u.id === profileUser.id || u.email === profileUser.email,
  );

  if (userIdx !== -1) {
    users[userIdx].name = name;
    users[userIdx].email = email;
    users[userIdx].phone = phone;
    localStorage.setItem("smartstock_users", JSON.stringify(users));
  }

  // Update Current User session
  profileUser.name = name;
  profileUser.email = email;
  profileUser.phone = phone;
  localStorage.setItem("smartstock_current_user", JSON.stringify(profileUser));

  // Re-render chrome
  renderSidebar("profile");
  renderNavbar();
  loadProfile();

  showToast("Profile updated successfully!", "success");
}

// ─── Change Password ─────────────────────────────────────────────────────────
function handleChangePassword(event) {
  event.preventDefault();

  const oldPass = document.getElementById("cp_old").value;
  const newPass = document.getElementById("cp_new").value;
  const confirmPass = document.getElementById("cp_confirm").value;

  ["cp_old", "cp_new", "cp_confirm"].forEach((id) => {
    document.getElementById(id).classList.remove("is-invalid");
  });

  let isValid = true;

  if (!oldPass) {
    document.getElementById("cp_old").classList.add("is-invalid");
    document.getElementById("cp_old_err").textContent =
      "Current password is required.";
    isValid = false;
  }

  if (!newPass || newPass.length < 6) {
    document.getElementById("cp_new").classList.add("is-invalid");
    document.getElementById("cp_new_err").textContent =
      "New password must be at least 6 characters.";
    isValid = false;
  }

  if (newPass !== confirmPass) {
    document.getElementById("cp_confirm").classList.add("is-invalid");
    document.getElementById("cp_confirm_err").textContent =
      "Passwords do not match.";
    isValid = false;
  }

  if (!isValid) return;

  // Verify against user record in storage
  const users = JSON.parse(localStorage.getItem("smartstock_users") || "[]");
  const userIdx = users.findIndex(
    (u) => u.id === profileUser.id || u.email === profileUser.email,
  );

  if (userIdx === -1 || users[userIdx].password !== oldPass) {
    document.getElementById("cp_old").classList.add("is-invalid");
    document.getElementById("cp_old_err").textContent =
      "Current password does not match.";
    return;
  }

  users[userIdx].password = newPass;
  localStorage.setItem("smartstock_users", JSON.stringify(users));

  document.getElementById("cp_old").value = "";
  document.getElementById("cp_new").value = "";
  document.getElementById("cp_confirm").value = "";

  showToast("Password changed successfully!", "success");
}

// DOM Ready
document.addEventListener("DOMContentLoaded", initProfile);
