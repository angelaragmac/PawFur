// =====================================
// FILE: js/06-navigation.js
// PAGE ACCESS + NAVIGATION: blocks guests from members-only pages, header Log In/Logout, logout button
// Used by: every page. Defines isAppPage, requiresLogin, loggedIn, accessDenied (other files use these)
// =====================================

// =====================================
// PAGE ACCESS AND NAVIGATION
// Public pages: home, about, services, vet locator (no login needed)
// Members only: booking, dashboard, checkout (body has data-require-auth="true")
// =====================================

const isAppPage = document.body.classList.contains("app-body");
const requiresLogin = document.body.dataset.requireAuth === "true";
const loggedIn = isUserLoggedIn();
const accessDenied = requiresLogin && !loggedIn;

if (accessDenied) {
    // Guests cannot open members-only pages: send them to login, then back here
    const currentPage = getCurrentPageName();
    const backTo = ALLOWED_REDIRECTS.includes(currentPage) ? currentPage : "dashboard.html";

    window.location.replace("login.html?redirect=" + encodeURIComponent(backTo));
} else {
    document.body.classList.add("auth-ready");
}

if (isAppPage && !accessDenied) {
    const user = localStorage.getItem(STORAGE_KEYS.currentUser) || "Pet Lover";

    const userName = document.getElementById("userName");
    const welcomeUser = document.getElementById("welcomeUser");

    // Header: guests see Log In / Sign Up, members see their name / Logout
    document.querySelectorAll(".guest-only").forEach(function(element) {
        element.classList.toggle("hidden", loggedIn);
    });

    document.querySelectorAll(".user-only").forEach(function(element) {
        element.classList.toggle("hidden", !loggedIn);
    });

    if (loggedIn && userName) {
        userName.textContent = "Hi, " + user;
    }

    if (loggedIn && welcomeUser) {
        welcomeUser.textContent = user;
    }
}

// LOG OUT
const logoutButton = document.getElementById("logoutButton");

if (logoutButton) {
    logoutButton.addEventListener("click", function() {
        endSession();

        window.location.href = "../index.html";
    });
}
