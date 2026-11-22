// =====================================
// FILE: js/02-session.js
// SESSION: login state, current account, safe redirects
// Used by: every page
// Contains: ALLOWED_REDIRECTS, REDIRECT_NOTICES, getSafeRedirect(), getCurrentPageName(),
//           isUserLoggedIn(), getCurrentAccount(), startSession(), endSession()
// =====================================

// Pages a visitor may be sent back to after logging in or signing up.
// Only an exact match from this list is ever used, so the redirect
// can never point to another website or an unexpected page.
const ALLOWED_REDIRECTS = ["booking.html", "dashboard.html", "checkout.html"];

const REDIRECT_NOTICES = {
    "booking.html": "Please log in or create an account before booking an appointment. 🐾",
    "dashboard.html": "Please log in to open your dashboard. 🐾",
    "checkout.html": "Please log in or create an account to continue to the demo checkout. 🐾"
};

function getSafeRedirect() {
    const params = new URLSearchParams(window.location.search);
    const target = params.get("redirect");

    return ALLOWED_REDIRECTS.includes(target) ? target : null;
}

function getCurrentPageName() {
    return window.location.pathname.split("/").pop() || "index.html";
}

function isUserLoggedIn() {
    return localStorage.getItem(STORAGE_KEYS.loggedIn) === "true";
}

// The logged-in demo user ({ name, email }) or null.
// Data (appointments, pets, plans, payments) is always tied to the email.
function getCurrentAccount() {
    if (!isUserLoggedIn()) {
        return null;
    }

    const users = readStored(STORAGE_KEYS.users, "array");
    const savedEmail = (localStorage.getItem(STORAGE_KEYS.currentEmail) || "").toLowerCase();
    let account = savedEmail
        ? users.find(function(user) { return user.email === savedEmail; })
        : null;

    // Sessions that started before the dashboard existed only stored a name
    if (!account) {
        const savedName = localStorage.getItem(STORAGE_KEYS.currentUser);
        account = users.find(function(user) { return user.name === savedName; });

        if (account) {
            localStorage.setItem(STORAGE_KEYS.currentEmail, account.email);
        }
    }

    return account ? { name: account.name, email: account.email } : null;
}

function startSession(account) {
    localStorage.setItem(STORAGE_KEYS.loggedIn, "true");
    localStorage.setItem(STORAGE_KEYS.currentUser, account.name);
    localStorage.setItem(STORAGE_KEYS.currentEmail, account.email);
}

function endSession() {
    localStorage.removeItem(STORAGE_KEYS.loggedIn);
    localStorage.removeItem(STORAGE_KEYS.currentUser);
    localStorage.removeItem(STORAGE_KEYS.currentEmail);
    localStorage.removeItem(STORAGE_KEYS.pendingPlan);
}
