// =====================================
// FILE: js/05-auth.js
// LOGIN + SIGN UP: show/hide password, booking notice, signup, login, Google/Facebook demo buttons
// Used by: login.html, signup.html
// =====================================

// =====================================
// SHOW / HIDE PASSWORD (login + signup)
// =====================================

document.querySelectorAll(".password-toggle").forEach(function(button) {
    const input = document.getElementById(button.dataset.target);

    if (!input) {
        return;
    }

    button.addEventListener("click", function() {
        const isShowing = input.type === "text";
        const label = isShowing ? "Show password" : "Hide password";

        input.type = isShowing ? "password" : "text";

        button.setAttribute("aria-label", label);
        button.setAttribute("title", label);
        button.setAttribute("aria-pressed", String(!isShowing));

        button.querySelector(".icon-eye").classList.toggle("hidden", !isShowing);
        button.querySelector(".icon-eye-off").classList.toggle("hidden", isShowing);
    });
});

// =====================================
// LOGIN / SIGNUP PAGE: BOOKING NOTICE
// =====================================

const authRedirect = getSafeRedirect();
const authNotice = document.getElementById("authNotice");

if (authRedirect) {
    if (authNotice) {
        authNotice.textContent = REDIRECT_NOTICES[authRedirect];
        authNotice.classList.remove("hidden");
    }

    // Keep the booking destination when switching between Log In and Sign Up
    document.querySelectorAll(".auth-note a").forEach(function(link) {
        const base = link.getAttribute("href").split("?")[0];
        link.setAttribute("href", base + "?redirect=" + encodeURIComponent(authRedirect));
    });
}

// =====================================
// PAWFUR LOGIN AND SIGNUP
// =====================================

// SIGN UP
const signupForm = document.getElementById("signupForm");

if (signupForm) {
    signupForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const name = document.getElementById("signupName").value.trim();
        const email = document.getElementById("signupEmail").value.trim().toLowerCase();
        const password = document.getElementById("signupPassword").value;
        const message = document.getElementById("signupMessage");

        const users = readStored(STORAGE_KEYS.users, "array");

        const existingUser = users.find(user => user.email === email);

        if (existingUser) {
            message.textContent = "This email is already registered.";
            message.style.color = "red";
            return;
        }

        users.push({
            name: name,
            email: email,
            password: password
        });

        if (!writeStored(STORAGE_KEYS.users, users)) {
            message.textContent = "Could not save your account in this browser. Please try again.";
            message.style.color = "red";
            return;
        }

        // Came from a members-only page: log the new user in and send them back
        if (authRedirect) {
            startSession({ name: name, email: email });

            message.textContent = "Account created! Taking you back...";
            message.style.color = "green";

            signupForm.reset();
            window.location.href = authRedirect;
            return;
        }

        message.textContent = "Account created successfully! You can now log in.";
        message.style.color = "green";

        signupForm.reset();
    });
}

// LOG IN
const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const email = document.getElementById("loginEmail").value.trim().toLowerCase();
        const password = document.getElementById("loginPassword").value;
        const message = document.getElementById("loginMessage");

        const users = readStored(STORAGE_KEYS.users, "array");

        const account = users.find(function(user) {
            return user.email === email && user.password === password;
        });

        if (account) {
            startSession({ name: account.name, email: account.email });

            window.location.href = authRedirect || "home.html";
        } else {
            message.textContent = "Incorrect email or password. Please try again.";
            message.style.color = "red";
        }
    });
}

// GOOGLE AND FACEBOOK DEMO BUTTONS
const googleLogin = document.getElementById("googleLogin");
const facebookLogin = document.getElementById("facebookLogin");

if (googleLogin) {
    googleLogin.addEventListener("click", function() {
        alert("Google Login needs to be connected to Firebase Authentication.");
    });
}

if (facebookLogin) {
    facebookLogin.addEventListener("click", function() {
        alert("Facebook Login needs to be connected to Facebook Authentication.");
    });
}
