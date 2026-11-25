/**
 * @fileoverview SmartStock Authentication Module
 * Handles user sessions, login, logout, registration, and profile management.
 * Depends on: storage.js (window.SS must be available)
 */

"use strict";

// ─── Session Helpers ──────────────────────────────────────────────────────────

/**
 * Check whether a user session is currently active.
 * @returns {boolean} True if a user is logged in.
 */
function isAuthenticated() {
  const user = SS.getItem(SS.KEYS.CURRENT_USER);
  return !!user && !!user.id;
}

/**
 * Guard for protected pages. Redirects to login if not authenticated.
 * Call this at the top of every page script that requires login.
 */
function requireAuth() {
  if (!isAuthenticated()) {
    const base = _getBasePath();
    window.location.href = base + "login.html";
  }
}

/**
 * Retrieve the currently logged-in user object.
 * @returns {Object|null} Current user or null.
 */
function getCurrentUser() {
  return SS.getItem(SS.KEYS.CURRENT_USER) || null;
}

// ─── Login / Logout ───────────────────────────────────────────────────────────

/**
 * Attempt to log in with the given credentials.
 * @param {string} email - User email.
 * @param {string} password - Plain-text password.
 * @returns {{ success: boolean, user?: Object, message: string }} Result object.
 */
function login(email, password) {
  if (!email || !password) {
    return { success: false, message: "Email and password are required." };
  }

  const users = SS.getAll(SS.KEYS.USERS);
  const user = users.find(
    (u) =>
      u.email.toLowerCase() === email.toLowerCase() && u.password === password,
  );

  if (!user) {
    return {
      success: false,
      message: "Invalid email or password. Please try again.",
    };
  }

  // Store session (without exposing password)
  const sessionUser = { ...user };
  delete sessionUser.password;
  SS.setItem(SS.KEYS.CURRENT_USER, sessionUser);
  SS.setItem("smartstock_session", {
    userId: sessionUser.id,
    user: sessionUser,
  });

  return { success: true, user: sessionUser, message: "Login successful." };
}

/**
 * Log out the current user and redirect to the login page.
 */
function logout() {
  SS.removeItem(SS.KEYS.CURRENT_USER);
  SS.removeItem("smartstock_session");
  const base = _getBasePath();
  window.location.href = base + "login.html";
}

// ─── Registration ─────────────────────────────────────────────────────────────

/**
 * Register a new user.
 * @param {{ name: string, email: string, password: string, phone?: string, role?: string }} userData
 * @returns {{ success: boolean, message: string }} Result object.
 */
function register(userData) {
  const { name, email, password, phone = "", role = "Staff" } = userData || {};

  if (!name || !name.trim())
    return { success: false, message: "Full name is required." };
  if (!email || !email.trim())
    return { success: false, message: "Email address is required." };
  if (!_isValidEmail(email))
    return { success: false, message: "Please enter a valid email address." };
  if (!password || password.length < 6)
    return {
      success: false,
      message: "Password must be at least 6 characters.",
    };

  const users = SS.getAll(SS.KEYS.USERS);
  const exists = users.some(
    (u) => u.email.toLowerCase() === email.toLowerCase(),
  );
  if (exists) {
    return {
      success: false,
      message: "An account with this email already exists.",
    };
  }

  const newUser = {
    id: SS.generateId(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
    phone: phone.trim(),
    role,
    joinedDate: new Date().toISOString().split("T")[0],
    avatar: null,
  };

  users.push(newUser);
  SS.saveAll(SS.KEYS.USERS, users);

  return {
    success: true,
    message: "Account created successfully. You can now log in.",
  };
}

// ─── Profile Management ───────────────────────────────────────────────────────

/**
 * Update the current user's profile data.
 * @param {{ name?: string, phone?: string, avatar?: string }} userData - Fields to update.
 * @returns {{ success: boolean, message: string }} Result object.
 */
function updateProfile(userData) {
  const currentUser = getCurrentUser();
  if (!currentUser)
    return { success: false, message: "No user is currently logged in." };

  const users = SS.getAll(SS.KEYS.USERS);
  const idx = users.findIndex((u) => u.id === currentUser.id);
  if (idx === -1) return { success: false, message: "User record not found." };

  const allowedFields = ["name", "phone", "avatar"];
  allowedFields.forEach((field) => {
    if (userData[field] !== undefined) {
      users[idx][field] = userData[field];
    }
  });

  SS.saveAll(SS.KEYS.USERS, users);

  // Refresh session
  const updatedSession = { ...users[idx] };
  delete updatedSession.password;
  SS.setItem(SS.KEYS.CURRENT_USER, updatedSession);

  return { success: true, message: "Profile updated successfully." };
}

/**
 * Change the current user's password after verifying the old password.
 * @param {string} oldPass - Current (old) password.
 * @param {string} newPass - New password.
 * @returns {{ success: boolean, message: string }} Result object.
 */
function changePassword(oldPass, newPass) {
  const currentUser = getCurrentUser();
  if (!currentUser)
    return { success: false, message: "No user is currently logged in." };

  if (!oldPass || !newPass) {
    return {
      success: false,
      message: "Both old and new passwords are required.",
    };
  }
  if (newPass.length < 6) {
    return {
      success: false,
      message: "New password must be at least 6 characters.",
    };
  }

  const users = SS.getAll(SS.KEYS.USERS);
  const idx = users.findIndex((u) => u.id === currentUser.id);
  if (idx === -1) return { success: false, message: "User record not found." };

  if (users[idx].password !== oldPass) {
    return { success: false, message: "Current password is incorrect." };
  }
  if (oldPass === newPass) {
    return {
      success: false,
      message: "New password must be different from the current password.",
    };
  }

  users[idx].password = newPass;
  SS.saveAll(SS.KEYS.USERS, users);

  return { success: true, message: "Password changed successfully." };
}

// ─── Private Utilities ────────────────────────────────────────────────────────

/**
 * Validate an email address format.
 * @param {string} email
 * @returns {boolean}
 */
function _isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Determine the base path for redirects based on current page location.
 * Handles both root and /pages/ subfolder structures.
 * @returns {string} Base path string (e.g., '' or '../').
 */
function _getBasePath() {
  const path = window.location.pathname.replace(/\\/g, "/");
  if (path.includes("/pages/")) return "../";
  return "";
}

window.isAuthenticated = isAuthenticated;
window.requireAuth = requireAuth;
window.getCurrentUser = getCurrentUser;
window.login = login;
window.logout = logout;
window.register = register;
window.updateProfile = updateProfile;
window.changePassword = changePassword;

window.SS = window.SS || {};

Object.assign(window.SS, {
  isAuthenticated,
  requireAuth,
  getCurrentUser,
  login,
  logout,
  register,
  updateProfile,
  changePassword,
});

window.Auth = window.SS;
