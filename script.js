
// =====================================
// PAWFUR SHARED HELPERS
// =====================================

// All localStorage keys in one place.
// Everything below is a front-end DEMO: localStorage is not secure storage.
const STORAGE_KEYS = {
    users: "pawfurUsers",                // [{ name, email, password }]
    loggedIn: "pawfurLoggedIn",          // "true" while a demo session is active
    currentUser: "pawfurCurrentUser",    // display name of the logged-in user
    currentEmail: "pawfurCurrentEmail",  // email of the logged-in user (links their data)
    bookings: "pawfurBookings",          // [{ userEmail, pet, service, ... }]
    pets: "pawfurPets",                  // [{ userEmail, name, animal, ... }]
    plans: "pawfurPlans",                // { "<email>": { active, pending } }
    transactions: "pawfurTransactions",  // [{ userEmail, id, planId, amount, ... }] (simulated)
    pendingPlan: "pawfurPendingPlan"     // plan chosen by a guest before logging in
};

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

// Reads a JSON value safely. Missing or broken data becomes an empty array/object.
function readStored(key, shape) {
    const empty = shape === "array" ? [] : {};

    try {
        const parsed = JSON.parse(localStorage.getItem(key));

        if (shape === "array") {
            return Array.isArray(parsed)
                ? parsed.filter(function(item) { return item && typeof item === "object"; })
                : empty;
        }

        return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : empty;
    } catch (error) {
        return empty;
    }
}

// Returns false if the browser refuses to save (for example private mode or a full quota)
function writeStored(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        return false;
    }
}

function makeId(prefix) {
    return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
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

// ---------- Demo care plans ----------
// EDIT THE PRICES HERE: every page reads them from this one place.
// These are illustrative academic-demo packages, not real veterinary services.
const PLANS = {
    basic: {
        id: "basic",
        name: "Basic Plan",
        tagline: "Essential Care",
        price: 149,
        benefits: [
            "Access to basic pet-care information",
            "Appointment request feature",
            "Veterinary clinic locator",
            "Access to the PAWFUR chatbot",
            "Basic pet profile"
        ],
        limits: [
            "Standard appointment request display",
            "Basic pet profile only (name and animal type)",
            "No pet-care tracking tools"
        ]
    },
    deluxe: {
        id: "deluxe",
        name: "Deluxe Plan",
        tagline: "Complete Care",
        price: 349,
        benefits: [
            "Everything in the Basic Plan",
            "Priority appointment request display",
            "Expanded pet-care resources",
            "More detailed pet profiles",
            "Additional pet-care tracking features"
        ],
        limits: [
            "Priority display is a demo label; clinics still confirm every schedule",
            "Illustrative price and sample features only"
        ]
    }
};

// Rows of the comparison table on the Services page
const PLAN_COMPARISON = [
    { feature: "Basic pet-care information", basic: true, deluxe: true },
    { feature: "Appointment request feature", basic: true, deluxe: true },
    { feature: "Veterinary clinic locator", basic: true, deluxe: true },
    { feature: "PAWFUR chatbot", basic: true, deluxe: true },
    { feature: "Basic pet profile", basic: true, deluxe: true },
    { feature: "Priority appointment request display", basic: false, deluxe: true },
    { feature: "Expanded pet-care resources", basic: false, deluxe: true },
    { feature: "More detailed pet profiles", basic: false, deluxe: true },
    { feature: "Additional pet-care tracking", basic: false, deluxe: true }
];

function formatPeso(amount) {
    return "₱" + Number(amount).toLocaleString("en-PH");
}

// "2026-12-20" -> "Dec 20, 2026" (built from parts so time zones cannot shift the day)
function formatDateOnly(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");

    if (!match) {
        return value || "—";
    }

    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// "14:30" -> "2:30 PM"
function formatTime(value) {
    const match = /^(\d{2}):(\d{2})$/.exec(value || "");

    if (!match) {
        return value || "—";
    }

    const hours = Number(match[1]);
    return (hours % 12 || 12) + ":" + match[2] + " " + (hours >= 12 ? "PM" : "AM");
}

function formatTimestamp(iso) {
    const date = new Date(iso);

    return isNaN(date.getTime())
        ? "—"
        : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Plan data for one user: { active: {...} | null, pending: {...} | null }
function getPlanRecord(email) {
    const all = readStored(STORAGE_KEYS.plans, "object");
    const record = all[email] && typeof all[email] === "object" ? all[email] : {};

    function clean(entry) {
        return entry && PLANS[entry.planId] ? entry : null;
    }

    return { active: clean(record.active), pending: clean(record.pending) };
}

function savePlanRecord(email, record) {
    const all = readStored(STORAGE_KEYS.plans, "object");
    all[email] = record;
    return writeStored(STORAGE_KEYS.plans, all);
}

// Small safe DOM helper (uses textContent, so saved text can never inject HTML)
function makeEl(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (text !== undefined) {
        element.textContent = text;
    }

    return element;
}

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

        window.location.href = "index.html";
    });
}

// =====================================
// VETERINARY CLINIC LOCATOR
// =====================================

const vetSearchForm = document.getElementById("vetSearchForm");

if (vetSearchForm) {
    vetSearchForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const location = document.getElementById("locationInput").value.trim();

        if (!location) {
            return;
        }

        const search = "veterinary clinics near " + location;
        const encodedSearch = encodeURIComponent(search);

        const vetMap = document.getElementById("vetMap");
        const mapsLink =
            document.getElementById("mapsLink") ||
            document.getElementById("googleMapsLink");

        if (vetMap) {
            vetMap.src =
                "https://maps.google.com/maps?q=" + encodedSearch + "&output=embed";
        }

        if (mapsLink) {
            mapsLink.href =
                "https://www.google.com/maps/search/" + encodedSearch;
        }
    });
}

// =====================================
// APPOINTMENT BOOKING
// =====================================

const bookingForm = document.getElementById("bookingForm");

if (bookingForm) {
    const dateInput = document.getElementById("appointmentDate");
    const animalType = document.getElementById("animalType");
    const otherAnimalGroup = document.getElementById("otherAnimalGroup");
    const otherAnimalInput = document.getElementById("otherAnimal");
    const bookingSuccess = document.getElementById("bookingSuccess");

    // Prevent selecting a past date
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const todayString = year + "-" + month + "-" + day;

    dateInput.min = todayString;

    // Reveal a text field when "Others" is selected.
    function updateOtherAnimalField() {
        const isOther = animalType.value === "Other";
        otherAnimalGroup.hidden = !isOther;
        otherAnimalInput.required = isOther;

        if (!isOther) {
            otherAnimalInput.value = "";
        }
    }

    animalType.addEventListener("change", updateOtherAnimalField);
    updateOtherAnimalField();

    bookingForm.addEventListener("submit", function(event) {
        event.preventDefault();

        // The session may have ended (for example, logged out in another tab).
        if (!isUserLoggedIn()) {
            window.location.replace("login.html?redirect=booking.html");
            return;
        }

        const selectedAnimal = animalType.value;
        const otherAnimal = otherAnimalInput.value.trim();

        if (selectedAnimal === "Other" && !otherAnimal) {
            otherAnimalInput.focus();
            otherAnimalInput.reportValidity();
            return;
        }

        // Link the request to the logged-in demo user (shown on their dashboard)
        const account = getCurrentAccount();
        const planRecord = account ? getPlanRecord(account.email) : { active: null };
        const isPriority = !!(planRecord.active && planRecord.active.planId === "deluxe");

        const appointment = {
            id: makeId("appt"),
            userEmail: account ? account.email : "",
            createdAt: new Date().toISOString(),
            status: "Request submitted",
            priority: isPriority,
            owner: document.getElementById("ownerName").value.trim(),
            pet: document.getElementById("petName").value.trim(),
            animal: selectedAnimal === "Other" ? "Other" : selectedAnimal,
            animalDetails: selectedAnimal === "Other" ? otherAnimal : "",
            service: document.getElementById("serviceType").value,
            date: document.getElementById("appointmentDate").value,
            time: document.getElementById("appointmentTime").value,
            contact: document.getElementById("contactNumber").value.trim()
        };

        // Existing saved requests are kept; the new one is added to the list
        const bookings = readStored(STORAGE_KEYS.bookings, "array");
        bookings.push(appointment);
        writeStored(STORAGE_KEYS.bookings, bookings);

        const priorityNote = document.getElementById("bookingPriorityNote");

        if (priorityNote) {
            priorityNote.hidden = !isPriority;
        }

        // Show a clear confirmation and a direct path to the Vet Locator.
        bookingSuccess.hidden = false;
        bookingSuccess.scrollIntoView({ behavior: "smooth", block: "nearest" });

        bookingForm.reset();
        dateInput.min = todayString;
        updateOtherAnimalField();
    });
}

// =====================================
// PAWFUR CHATBOT
// English, Tagalog and Bisaya
// =====================================

if (isAppPage && !accessDenied) {
    const chatHTML = `
        <button class="chat-toggle" id="chatToggle" type="button" aria-label="Open PAWFUR chat" aria-expanded="false">
            <span class="chat-toggle-paw">🐾</span><span class="chat-toggle-label">Chat with PAWFUR</span><span class="chat-online-dot" aria-hidden="true"></span>
        </button>

        <section class="chat-window" id="chatWindow" aria-label="PAWFUR assistant" aria-hidden="true">
            <div class="chat-header">
                <div class="chat-brand">
                    <span class="chat-avatar">🐾</span>
                    <span><strong>PAWFUR Assistant</strong><small><i></i> Here to help with pet care</small></span>
                </div>
                <button id="closeChat" type="button" aria-label="Close chat">×</button>
            </div>
            <div class="chat-tools-row">
                <label class="sr-only" for="chatLanguage">Chat language</label>
                <select id="chatLanguage" class="chat-language">
                    <option value="en">English</option><option value="tl">Filipino (Tagalog)</option><option value="ceb">Bisaya (Cebuano)</option>
                </select>
                <span class="voice-preview-label">♫ Voice features coming soon</span>
            </div>
            <div class="chat-messages" id="chatMessages" aria-live="polite" aria-relevant="additions">
                <div class="chat-message bot-message">Hello! I'm PAWFUR Assistant. 🐾<br>Ask me about pet care, symptoms, vaccines, or appointments!</div>
                <div class="chat-suggestions" id="chatSuggestions">
                    <button type="button" data-question="How do I care for my dog?">🐶 Dog care</button>
                    <button type="button" data-question="How do I care for my cat?">🐱 Cat care</button>
                    <button type="button" data-question="When should my pet get vaccines?">💉 Vaccines</button>
                    <button type="button" data-question="How can I book an appointment?">📅 Book a visit</button>
                </div>
            </div>
            <form class="chat-form" id="chatForm">
                <div class="chat-input-wrap">
                    <input type="text" id="chatInput" placeholder="Ask a question..." autocomplete="off" aria-label="Type your message" required>
                    <button class="chat-mic-preview" type="button" aria-label="Voice input coming soon (preview only)" title="Voice input coming soon (preview only)"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v4"/><path d="M8.5 22h7"/></svg></button>
                </div>
                <button class="chat-send" type="submit">Send <span>➤</span></button>
            </form>
            <p class="chat-disclaimer">PAWFUR shares general information, not veterinary diagnoses.</p>
        </section>`;

    document.body.insertAdjacentHTML("beforeend", chatHTML);
    const chatToggle = document.getElementById("chatToggle");
    const chatWindow = document.getElementById("chatWindow");
    const closeChat = document.getElementById("closeChat");
    const chatForm = document.getElementById("chatForm");
    const chatInput = document.getElementById("chatInput");
    const chatMessages = document.getElementById("chatMessages");
    const chatLanguage = document.getElementById("chatLanguage");
    const chatSuggestions = document.getElementById("chatSuggestions");

    function playChatPop() {
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) return;
            const audio = new AudioContextClass();
            const oscillator = audio.createOscillator();
            const gain = audio.createGain();
            oscillator.type = "sine";
            oscillator.frequency.setValueAtTime(620, audio.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(920, audio.currentTime + 0.075);
            gain.gain.setValueAtTime(0.0001, audio.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.12, audio.currentTime + 0.012);
            gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.13);
            oscillator.connect(gain); gain.connect(audio.destination);
            oscillator.start(); oscillator.stop(audio.currentTime + 0.14);
            oscillator.onended = () => audio.close();
        } catch (error) { /* Sound is decorative; chat must work if audio is unavailable. */ }
    }

    function openChat() {
        playChatPop();
        chatWindow.classList.add("open");
        chatWindow.setAttribute("aria-hidden", "false");
        chatToggle.setAttribute("aria-expanded", "true");
        chatToggle.classList.add("is-active");
        chatInput.focus();
    }
    function hideChat() {
        chatWindow.classList.remove("open");
        chatWindow.setAttribute("aria-hidden", "true");
        chatToggle.setAttribute("aria-expanded", "false");
        chatToggle.classList.remove("is-active");
    }
    chatToggle.addEventListener("click", openChat);
    closeChat.addEventListener("click", hideChat);
    document.addEventListener("keydown", event => { if (event.key === "Escape" && chatWindow.classList.contains("open")) hideChat(); });

    function addMessage(message, sender) {
        const messageElement = document.createElement("div");
        messageElement.className = sender === "user" ? "chat-message user-message" : "chat-message bot-message";
        messageElement.textContent = message;
        if (sender === "bot") {
            const voiceButton = document.createElement("button");
            voiceButton.type = "button";
            voiceButton.className = "listen-preview";
            voiceButton.textContent = "🔊 Listen to response";
            voiceButton.title = "Voice feature coming soon";
            voiceButton.addEventListener("click", () => {
                voiceButton.textContent = "♫ Voice feature coming soon!";
                voiceButton.classList.add("preview-active");
                window.setTimeout(() => { voiceButton.textContent = "🔊 Listen to response"; voiceButton.classList.remove("preview-active"); }, 1800);
            });
            messageElement.appendChild(voiceButton);
        }
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    function hasAny(text, words) { return words.some(word => text.includes(word)); }

    function getBotResponse(question, language) {
        const text = question.toLowerCase().trim();
        const english = {
            greeting: "Hello! 🐾 Welcome to PAWFUR. What would you like to know about your pet?",
            vomiting: "Vomiting can have different causes. Keep fresh water available, but do not force food or give human medicine. Contact a veterinarian, especially if vomiting repeats, there is blood, or your pet becomes weak.",
            notEating: "A pet that refuses food may be unwell, stressed, or in pain. Contact a veterinarian if this continues or comes with other symptoms.",
            sick: "I'm sorry your pet isn't feeling well. 🐾 I cannot diagnose illnesses. Please contact a veterinarian for an examination, especially if your pet is in pain or getting worse.",
            vaccine: "Vaccinations help protect pets against serious diseases. Ask your veterinarian for a schedule based on your pet's age, health, and vaccination history.",
            dog: "Dogs need clean water, balanced dog food, daily activity suited to their age, grooming, training, and regular veterinary checkups.",
            cat: "Cats need fresh water, complete cat food, a clean litter box, play and enrichment, safe resting spaces, and regular veterinary checkups.",
            food: "Choose complete food made for your pet's species and life stage. Keep fresh water available and check with a veterinarian before introducing unfamiliar foods or supplements.",
            appointment: "Open the Booking page in PAWFUR, complete the form, and submit your appointment request. The request is saved on this demo website; contact the clinic to confirm.",
            location: "Open the Vet Locator page and enter your city or area to search for veterinary clinics using Google Maps.",
            emergency: "If your pet is struggling to breathe, collapsing, having seizures, bleeding heavily, or may have swallowed poison, seek emergency veterinary care immediately.",
            grooming: "Brush your pet regularly using tools suitable for its coat. Keep nails, ears, teeth, and skin in mind, and ask a groomer or veterinarian for help if you are unsure.",
            hygiene: "Keep food and water bowls clean, wash bedding regularly, and maintain a clean litter area or toileting space. Use pet-safe cleaning products.",
            play: "Play supports activity and enrichment. Choose safe toys that match your pet's size, supervise play, and avoid toys with small parts that could be swallowed.",
            thanks: "You're welcome! 🐾 I'm happy to help you care for your pet.",
            about: "PAWFUR is a pet-care information website that helps pet owners explore services, find veterinary clinics, and send appointment requests.",
            fallback: "I don't know that one yet. Try asking about dog care, cat care, food, grooming, hygiene, playtime, vaccines, symptoms, appointments, or finding a vet."
        };
        const tagalog = {
            greeting: "Hello! 🐾 Welcome sa PAWFUR! Ano ang gusto mong malaman tungkol sa iyong alaga?",
            vomiting: "Maraming posibleng dahilan ang pagsusuka. Maglaan ng malinis na tubig, pero huwag piliting kumain o bigyan ng gamot ng tao. Kumonsulta sa beterinaryo, lalo na kung paulit-ulit ito o nanghihina ang alaga.",
            notEating: "Maaaring may sakit, stress, o nararamdamang sakit ang alaga kapag ayaw kumain. Kumonsulta sa beterinaryo kung nagpapatuloy ito o may ibang sintomas.",
            sick: "Pasensya na at hindi maganda ang pakiramdam ng iyong alaga. Hindi ako makakapagbigay ng diagnosis. Mas mabuting magpakonsulta sa beterinaryo.",
            vaccine: "Mahalaga ang bakuna upang maprotektahan ang mga alaga laban sa sakit. Magtanong sa beterinaryo tungkol sa iskedyul batay sa edad at kalusugan ng alaga.",
            dog: "Kailangan ng aso ng malinis na tubig, angkop na pagkain, aktibidad, grooming, training, at regular na checkup sa beterinaryo.",
            cat: "Kailangan ng pusa ng malinis na tubig, tamang pagkain, malinis na litter box, oras sa paglalaro, ligtas na pahingahan, at regular na checkup.",
            food: "Pumili ng kumpletong pagkaing angkop sa uri at edad ng iyong alaga. Magtanong sa beterinaryo bago magbigay ng bagong pagkain o supplements.",
            appointment: "Pumunta sa Booking page ng PAWFUR, punan ang form, at isumite ang request. Demo website ito kaya kontakin ang clinic upang kumpirmahin ang appointment.",
            location: "Buksan ang Vet Locator page at ilagay ang iyong lungsod o lugar upang maghanap ng veterinary clinic sa Google Maps.",
            emergency: "Kung nahihirapang huminga, nawawalan ng malay, nangingisay, malakas ang pagdurugo, o posibleng nakalunok ng lason ang alaga, dalhin agad ito sa emergency veterinarian.",
            grooming: "Suklayin ang alaga gamit ang angkop na brush. Alagaan din ang kuko, tainga, ngipin, at balat. Humingi ng tulong kung hindi sigurado.",
            hygiene: "Panatilihing malinis ang mga mangkok, higaan, litter box, at lugar nito. Gumamit lamang ng panlinis na ligtas para sa alaga.",
            play: "Mahalaga ang paglalaro para sa aktibidad at stimulation. Pumili ng ligtas na laruan na angkop sa laki ng alaga at bantayan habang naglalaro.",
            thanks: "Walang anuman! 🐾 Masaya akong makatulong sa pag-aalaga ng iyong alaga.",
            about: "Ang PAWFUR ay website na nagbibigay ng impormasyon tungkol sa pet care, veterinary services, paghahanap ng clinic, at appointment requests.",
            fallback: "Maaari kang magtanong tungkol sa pag-aalaga ng aso o pusa, pagkain, grooming, kalinisan, paglalaro, bakuna, sintomas, appointment, o vet locator."
        };
        const bisaya = {
            greeting: "Hello! 🐾 Welcome sa PAWFUR! Unsay gusto nimo mahibal-an bahin sa imong binuhi?",
            vomiting: "Daghang posibleng hinungdan ang pagsuka. Siguroa nga naay limpyo nga tubig. Ayaw pugsa og pakaon o hatagi og tambal sa tawo. Pakonsulta sa veterinarian kung balik-balik ang pagsuka o luya na siya.",
            notEating: "Kung dili mokaon ang imong binuhi, basin naay sakit, stress, o kasakit. Pakonsulta sa veterinarian kung magpadayon kini o adunay laing sintomas.",
            sick: "Pasensya kung dili maayo ang paminaw sa imong binuhi. Dili ko makahimo og medical diagnosis. Mas maayo nga ipasusi siya sa veterinarian.",
            vaccine: "Importante ang bakuna aron mapanalipdan ang imong binuhi. Pangutana sa veterinarian bahin sa saktong schedule base sa edad ug kahimsog niini.",
            dog: "Ang iro nagkinahanglan og limpyo nga tubig, hustong pagkaon, kalihokan, grooming, training, ug regular nga checkup sa veterinarian.",
            cat: "Ang iring nagkinahanglan og limpyo nga tubig, hustong pagkaon, limpyo nga litter box, pagdula, luwas nga pahulayan, ug regular nga checkup.",
            food: "Hatagi ang imong binuhi og pagkaon nga angay sa klase ug edad niini. Pangutana sa veterinarian una maghatag og bag-ong pagkaon o supplements.",
            appointment: "Ablihi ang Booking page sa PAWFUR, pun-a ang form, ug i-submit ang request. Tawagi gihapon ang clinic aron makumpirma ang appointment.",
            location: "Ablihi ang Vet Locator page ug isulat ang imong siyudad o lugar aron makapangita og veterinary clinic gamit ang Google Maps.",
            emergency: "Kung lisod siya moginhawa, natumba, nagkombulsyon, grabe ang pagdugo, o basin nakakaon og hilo, dad-a dayon siya sa emergency veterinarian.",
            grooming: "Suklayi ang imong binuhi gamit ang angay nga brush. Ampingi usab ang kuko, dalunggan, ngipon, ug panit. Pangayo og tabang kung dili ka sigurado.",
            hygiene: "Limpyoha kanunay ang food ug water bowls, higdaanan, litter box, ug palibot. Gamita lang ang cleaning products nga luwas para sa pets.",
            play: "Importante ang pagdula para sa kalihokan ug stimulation. Pilia ang luwas nga dulaan nga angay sa gidak-on sa imong binuhi ug bantayi samtang nagdula.",
            thanks: "Walay sapayan! 🐾 Malipay ko nga makatabang sa imong binuhi.",
            about: "Ang PAWFUR website naghatag og impormasyon sa pet care, veterinary services, pagpangita og clinic, ug appointment requests.",
            fallback: "Sulayi og pangutana bahin sa pag-atiman sa iro o iring, pagkaon, grooming, kalimpyo, pagdula, bakuna, sintomas, appointment, o pagpangita og vet."
        };
        const responses = language === "tl" ? tagalog : language === "ceb" ? bisaya : english;
        if (hasAny(text, ["cannot breathe", "can't breathe", "difficulty breathing", "seizure", "poison", "bleeding heavily", "collapsed", "hirap huminga", "nalason", "nangingisay", "lisod moginhawa", "kombulsyon", "hilo", "lisod ginhawa"])) return responses.emergency;
        if (hasAny(text, ["vomit", "throwing up", "nagsusuka", "suka", "pagsuka", "nagsuka"])) return responses.vomiting;
        if (hasAny(text, ["not eating", "won't eat", "refuse to eat", "no appetite", "ayaw kumain", "hindi kumakain", "dili mokaon", "dili mukaon", "walay gana mokaon"])) return responses.notEating;
        if (hasAny(text, ["vaccine", "vaccination", "vaccines", "bakuna", "pagbabakuna", "bakunahan"])) return responses.vaccine;
        if (hasAny(text, ["appointment", "book", "booking", "schedule", "magpa-appointment", "magpa appointment", "magpa-book", "magpa book", "iskedyul"])) return responses.appointment;
        if (hasAny(text, ["vet near", "veterinarian", "vet clinic", "animal clinic", "where is the vet", "find a vet", "clinic near", "saan ang vet", "saan may vet", "klinika", "asa ang vet", "asa naay vet", "pangita og vet"])) return responses.location;
        if (hasAny(text, ["groom", "grooming", "brush", "paligo", "ligo", "suklay"])) return responses.grooming;
        if (hasAny(text, ["clean", "hygiene", "litter box", "kalinisan", "kalimpyo", "linis ng", "limpyoha"])) return responses.hygiene;
        if (hasAny(text, ["play", "toy", "toys", "laro", "dulaan"])) return responses.play;
        if (hasAny(text, ["food", "eat", "eating", "diet", "pagkain", "ipakain", "pagkaon", "kaon"])) return responses.food;
        if (hasAny(text, ["sick", "ill", "pain", "hurt", "sakit", "may sakit", "masakit", "luya", "weak", "nanghihina", "dili maayo"])) return responses.sick;
        if (hasAny(text, ["dog", "dogs", "puppy", "puppies", "aso", "tuta", "iro"])) return responses.dog;
        if (hasAny(text, ["cat", "cats", "kitten", "pusa", "kuting", "iring"])) return responses.cat;
        if (hasAny(text, ["pawfur", "website", "what is this site", "about your site"])) return responses.about;
        if (hasAny(text, ["hello", "hi", "hey", "good morning", "good afternoon", "good evening", "kumusta", "kamusta", "maayong buntag", "maayong hapon", "maayong gabii"])) return responses.greeting;
        if (hasAny(text, ["thank you", "thanks", "salamat", "daghang salamat"])) return responses.thanks;
        return responses.fallback;
    }

    function sendQuestion(question) {
        const cleanQuestion = question.trim();
        if (!cleanQuestion) return;
        addMessage(cleanQuestion, "user");
        if (chatSuggestions) chatSuggestions.remove();
        const typing = document.createElement("div");
        typing.className = "chat-typing";
        typing.textContent = "PAWFUR is typing…";
        chatMessages.appendChild(typing);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        window.setTimeout(() => {
            typing.remove();
            addMessage(getBotResponse(cleanQuestion, chatLanguage.value), "bot");
        }, 420);
    }
    chatForm.addEventListener("submit", event => {
        event.preventDefault();
        const question = chatInput.value;
        if (!question.trim()) return;
        sendQuestion(question);
        chatInput.value = "";
        chatInput.focus();
    });
    chatSuggestions.addEventListener("click", event => {
        const button = event.target.closest("button[data-question]");
        if (button) sendQuestion(button.dataset.question);
    });
}

// =====================================
// SERVICES PAGE: DEMO CARE PLANS
// (prices and benefits come from PLANS at the top of this file)
// =====================================

const planGrid = document.querySelector(".plan-grid");

if (planGrid) {
    // Prices
    document.querySelectorAll("[data-plan-price]").forEach(function(element) {
        const plan = PLANS[element.dataset.planPrice];

        if (plan) {
            element.textContent = formatPeso(plan.price);
        }
    });

    // Benefit and limitation lists
    document.querySelectorAll("[data-plan-list]").forEach(function(list) {
        const plan = PLANS[list.dataset.planList];

        if (!plan) {
            return;
        }

        (list.dataset.kind === "limits" ? plan.limits : plan.benefits).forEach(function(text) {
            list.appendChild(makeEl("li", "", text));
        });
    });

    // Comparison table
    const compareBody = document.getElementById("compareBody");

    if (compareBody) {
        function markCell(included) {
            const cell = document.createElement("td");
            const mark = makeEl("span", included ? "yes" : "no", included ? "✓" : "—");

            mark.setAttribute("aria-label", included ? "Included" : "Not included");
            cell.appendChild(mark);
            return cell;
        }

        PLAN_COMPARISON.forEach(function(row) {
            const tr = document.createElement("tr");
            tr.appendChild(makeEl("th", "", row.feature));
            tr.lastChild.scope = "row";
            tr.appendChild(markCell(row.basic));
            tr.appendChild(markCell(row.deluxe));
            compareBody.appendChild(tr);
        });

        const priceRow = document.createElement("tr");
        priceRow.appendChild(makeEl("th", "", "Illustrative price"));
        priceRow.lastChild.scope = "row";
        priceRow.appendChild(makeEl("td", "", formatPeso(PLANS.basic.price) + " / month"));
        priceRow.appendChild(makeEl("td", "", formatPeso(PLANS.deluxe.price) + " / month"));
        compareBody.appendChild(priceRow);
    }

    // Choose Plan: remember the choice, then go to the simulated checkout.
    // Guests are sent to login first (checkout is members-only) and return afterwards.
    document.querySelectorAll("[data-choose-plan]").forEach(function(button) {
        button.addEventListener("click", function() {
            const planId = button.dataset.choosePlan;

            if (!PLANS[planId]) {
                return;
            }

            const selection = { planId: planId, selectedAt: new Date().toISOString() };
            const account = getCurrentAccount();

            if (account) {
                const record = getPlanRecord(account.email);
                record.pending = selection;
                savePlanRecord(account.email, record);
            } else {
                writeStored(STORAGE_KEYS.pendingPlan, selection);
            }

            window.location.href = "checkout.html";
        });
    });
}

// =====================================
// CHECKOUT PAGE: SIMULATED PAYMENT (DEMO ONLY)
// No real payment is made and no payment details are collected.
// =====================================

const checkoutMain = document.getElementById("checkoutMain");

if (checkoutMain && !accessDenied) {
    const checkoutEmpty = document.getElementById("checkoutEmpty");
    const checkoutSuccess = document.getElementById("checkoutSuccess");
    const checkoutForm = document.getElementById("checkoutForm");
    const methodError = document.getElementById("methodError");
    const simulateButton = document.getElementById("simulatePayment");
    const account = getCurrentAccount();

    if (!account) {
        // Session flag exists but the account is gone (for example cleared storage)
        endSession();
        window.location.replace("login.html?redirect=checkout.html");
    } else {
        // A plan chosen while logged out now belongs to this user
        const guestChoice = readStored(STORAGE_KEYS.pendingPlan, "object");
        const record = getPlanRecord(account.email);

        if (PLANS[guestChoice.planId]) {
            record.pending = { planId: guestChoice.planId, selectedAt: guestChoice.selectedAt || new Date().toISOString() };
            savePlanRecord(account.email, record);
        }

        localStorage.removeItem(STORAGE_KEYS.pendingPlan);

        if (!record.pending) {
            checkoutEmpty.hidden = false;
        } else {
            const plan = PLANS[record.pending.planId];
            checkoutMain.hidden = false;

            document.getElementById("summaryPlanName").textContent = plan.name;
            document.getElementById("summaryPlanTagline").textContent = plan.tagline;
            document.getElementById("payPlan").textContent = plan.name;
            document.getElementById("payTotal").textContent = formatPeso(plan.price);

            const benefitList = document.getElementById("summaryBenefits");
            plan.benefits.forEach(function(text) {
                benefitList.appendChild(makeEl("li", "", text));
            });

            // Show the chosen method in the payment summary
            checkoutForm.addEventListener("change", function() {
                const chosen = checkoutForm.querySelector('input[name="paymentMethod"]:checked');
                document.getElementById("payMethod").textContent = chosen ? chosen.value + " (demo)" : "Not chosen yet";
                methodError.textContent = "";
            });

            function makeTransactionRef(existing) {
                const now = new Date();
                const day = now.getFullYear() +
                    String(now.getMonth() + 1).padStart(2, "0") +
                    String(now.getDate()).padStart(2, "0");
                let ref;

                do {
                    ref = "DEMO-" + day + "-" + Math.random().toString(36).slice(2, 8).toUpperCase();
                } while (existing.some(function(item) { return item.id === ref; }));

                return ref;
            }

            let paymentInProgress = false;

            checkoutForm.addEventListener("submit", function(event) {
                event.preventDefault();

                if (paymentInProgress) {
                    return;
                }

                const chosen = checkoutForm.querySelector('input[name="paymentMethod"]:checked');

                if (!chosen) {
                    methodError.textContent = "Please choose a demo payment method first.";
                    document.getElementById("methodGcash").focus();
                    return;
                }

                paymentInProgress = true;
                simulateButton.disabled = true;
                simulateButton.textContent = "Simulating demo payment…";

                window.setTimeout(function() {
                    const transactions = readStored(STORAGE_KEYS.transactions, "array");
                    const paidAt = new Date().toISOString();

                    const transaction = {
                        id: makeTransactionRef(transactions),
                        userEmail: account.email,
                        planId: plan.id,
                        planName: plan.name,
                        amount: plan.price,
                        currency: "PHP",
                        method: chosen.value,
                        status: "Simulated payment successful (DEMO)",
                        demo: true,
                        createdAt: paidAt
                    };

                    transactions.push(transaction);

                    const latest = getPlanRecord(account.email);
                    latest.active = {
                        planId: plan.id,
                        selectedAt: record.pending.selectedAt,
                        paidAt: paidAt,
                        paymentStatus: "Demo payment completed (simulated)",
                        transactionId: transaction.id
                    };
                    latest.pending = null;

                    if (!writeStored(STORAGE_KEYS.transactions, transactions) ||
                        !savePlanRecord(account.email, latest)) {
                        // Never show a success screen if nothing was saved
                        paymentInProgress = false;
                        simulateButton.disabled = false;
                        simulateButton.textContent = "Simulate Payment";
                        methodError.textContent = "The demo transaction could not be saved in this browser. Please try again.";
                        return;
                    }

                    checkoutMain.hidden = true;
                    checkoutSuccess.hidden = false;
                    document.getElementById("successReference").textContent = transaction.id;
                    document.getElementById("successPlan").textContent = plan.name;
                    document.getElementById("successMethod").textContent = chosen.value + " (demo)";
                    document.getElementById("successAmount").textContent = formatPeso(plan.price);
                    checkoutSuccess.scrollIntoView({ block: "start" });
                }, prefersReducedMotion() ? 0 : 700);
            });
        }
    }
}

// =====================================
// DASHBOARD (members only)
// Shows only the data that belongs to the logged-in demo user.
// =====================================

const dashboardRoot = document.getElementById("dashboardRoot");

if (dashboardRoot && !accessDenied) {
    const account = getCurrentAccount();

    if (!account) {
        endSession();
        window.location.replace("login.html?redirect=dashboard.html");
    } else {
        const petForm = document.getElementById("petForm");
        const petAnimal = document.getElementById("petAnimal");
        const petOtherGroup = document.getElementById("petOtherGroup");
        const petOther = document.getElementById("petOther");
        const petMessage = document.getElementById("petMessage");
        const accountForm = document.getElementById("accountForm");
        const accountMessage = document.getElementById("accountMessage");

        let currentName = account.name;

        // Requests saved before accounts were linked have no owner email.
        // If the name typed on the form matches this account, link them once.
        function claimOlderBookings() {
            const all = readStored(STORAGE_KEYS.bookings, "array");
            let changed = false;

            all.forEach(function(booking) {
                const hasOwner = typeof booking.userEmail === "string" && booking.userEmail !== "";

                if (!hasOwner && String(booking.owner || "").trim().toLowerCase() === currentName.trim().toLowerCase()) {
                    booking.userEmail = account.email;
                    changed = true;
                }
            });

            if (changed) {
                writeStored(STORAGE_KEYS.bookings, all);
            }
        }

        function isDeluxeActive() {
            const record = getPlanRecord(account.email);
            return !!(record.active && record.active.planId === "deluxe");
        }

        // ----- My Pets -----
        function animalEmoji(animal) {
            return animal === "Dog" ? "🐶" : animal === "Cat" ? "🐱" : "🐾";
        }

        function renderPets() {
            const list = document.getElementById("petList");
            const pets = readStored(STORAGE_KEYS.pets, "array").filter(function(pet) {
                return pet.userEmail === account.email;
            });

            list.textContent = "";

            if (pets.length === 0) {
                const empty = makeEl("div", "empty-state", "No pets saved yet. Add your first pet below. 🐾");
                empty.style.gridColumn = "1 / -1";
                list.appendChild(empty);
            }

            pets.forEach(function(pet) {
                const card = makeEl("article", "pet-card");
                const top = makeEl("div", "pet-card-top");
                const names = document.createElement("div");

                top.appendChild(makeEl("span", "pet-avatar", animalEmoji(pet.animal)));
                names.appendChild(makeEl("h3", "", pet.name || "Unnamed pet"));
                names.appendChild(makeEl("small", "",
                    pet.animal === "Other" && pet.animalDetails ? "Other: " + pet.animalDetails : (pet.animal || "Pet")));
                top.appendChild(names);
                card.appendChild(top);

                const details = [
                    ["Breed", pet.breed],
                    ["Age", pet.age],
                    ["Weight", pet.weight ? pet.weight + " kg" : ""],
                    ["Last vaccine", pet.lastVaccination ? formatDateOnly(pet.lastVaccination) : ""],
                    ["Next check-up", pet.nextCheckup ? formatDateOnly(pet.nextCheckup) : ""],
                    ["Notes", pet.notes]
                ].filter(function(pair) { return pair[1]; });

                if (details.length) {
                    const dl = document.createElement("dl");

                    details.forEach(function(pair) {
                        dl.appendChild(makeEl("dt", "", pair[0]));
                        dl.appendChild(makeEl("dd", "", pair[1]));
                    });

                    card.appendChild(dl);
                }

                const remove = makeEl("button", "small-button danger", "Remove");
                remove.type = "button";
                remove.setAttribute("aria-label", "Remove " + (pet.name || "pet"));
                remove.addEventListener("click", function() {
                    if (!window.confirm("Remove " + (pet.name || "this pet") + " from your profile?")) {
                        return;
                    }

                    const all = readStored(STORAGE_KEYS.pets, "array").filter(function(item) {
                        return !(item.id === pet.id && item.userEmail === account.email);
                    });

                    writeStored(STORAGE_KEYS.pets, all);
                    refreshDashboard();
                });
                card.appendChild(remove);

                list.appendChild(card);
            });

            // Detailed fields are a Deluxe (demo) feature
            const deluxe = isDeluxeActive();
            document.getElementById("deluxePetFields").hidden = !deluxe;
            document.getElementById("petLocked").hidden = deluxe;
        }

        function updateOtherPetField() {
            const isOther = petAnimal.value === "Other";
            petOtherGroup.hidden = !isOther;
            petOther.required = isOther;

            if (!isOther) {
                petOther.value = "";
            }
        }

        petAnimal.addEventListener("change", updateOtherPetField);

        petForm.addEventListener("submit", function(event) {
            event.preventDefault();
            petMessage.style.color = "#C0392B";

            const name = document.getElementById("petName").value.trim();
            const animal = petAnimal.value;
            const other = petOther.value.trim();

            if (!name) {
                petMessage.textContent = "Please enter your pet's name.";
                document.getElementById("petName").focus();
                return;
            }

            if (!animal) {
                petMessage.textContent = "Please choose the type of animal.";
                petAnimal.focus();
                return;
            }

            if (animal === "Other" && !other) {
                petMessage.textContent = "Please tell us what kind of pet it is.";
                petOther.focus();
                return;
            }

            const pets = readStored(STORAGE_KEYS.pets, "array");

            if (pets.filter(function(pet) { return pet.userEmail === account.email; }).length >= 12) {
                petMessage.textContent = "The demo dashboard stores up to 12 pets.";
                return;
            }

            const pet = {
                id: makeId("pet"),
                userEmail: account.email,
                name: name,
                animal: animal,
                animalDetails: animal === "Other" ? other : "",
                createdAt: new Date().toISOString()
            };

            if (isDeluxeActive()) {
                pet.breed = document.getElementById("petBreed").value.trim();
                pet.age = document.getElementById("petAge").value.trim();
                pet.weight = document.getElementById("petWeight").value.trim();
                pet.lastVaccination = document.getElementById("petLastVaccine").value;
                pet.nextCheckup = document.getElementById("petNextCheckup").value;
                pet.notes = document.getElementById("petNotes").value.trim();
            }

            pets.push(pet);

            if (!writeStored(STORAGE_KEYS.pets, pets)) {
                petMessage.textContent = "Could not save the pet in this browser.";
                return;
            }

            petForm.reset();
            updateOtherPetField();
            petMessage.style.color = "";
            petMessage.textContent = "Saved " + name + "! 🐾";
            refreshDashboard();
        });

        // ----- My Appointments -----
        function renderAppointments() {
            const holder = document.getElementById("appointmentList");
            const mine = readStored(STORAGE_KEYS.bookings, "array")
                .filter(function(booking) { return booking.userEmail === account.email; })
                .sort(function(a, b) {
                    if (!!b.priority !== !!a.priority) {
                        return b.priority ? 1 : -1;
                    }

                    return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
                });

            holder.textContent = "";

            if (mine.length === 0) {
                const empty = makeEl("div", "empty-state");
                empty.appendChild(document.createTextNode("No appointment requests yet. "));
                const link = makeEl("a", "", "Book an appointment");
                link.href = "booking.html";
                empty.appendChild(link);
                empty.appendChild(document.createTextNode("."));
                holder.appendChild(empty);
                return mine.length;
            }

            const wrap = makeEl("div", "table-wrap");
            const table = makeEl("table", "data-table");
            const headRow = document.createElement("tr");

            ["Pet", "Animal", "Service", "Date", "Time", "Status"].forEach(function(title) {
                const th = makeEl("th", "", title);
                th.scope = "col";
                headRow.appendChild(th);
            });

            const thead = document.createElement("thead");
            thead.appendChild(headRow);
            table.appendChild(thead);

            const tbody = document.createElement("tbody");

            mine.forEach(function(booking) {
                const row = document.createElement("tr");
                const animal = booking.animal === "Other" && booking.animalDetails
                    ? "Other (" + booking.animalDetails + ")"
                    : (booking.animal || "—");

                [
                    ["Pet", booking.pet || "—"],
                    ["Animal", animal],
                    ["Service", booking.service || "—"],
                    ["Date", formatDateOnly(booking.date)],
                    ["Time", formatTime(booking.time)]
                ].forEach(function(pair) {
                    const td = makeEl("td", "", pair[1]);
                    td.dataset.label = pair[0];
                    row.appendChild(td);
                });

                const statusCell = document.createElement("td");
                statusCell.dataset.label = "Status";
                statusCell.appendChild(makeEl("span", "badge", booking.status || "Request submitted"));

                if (booking.priority) {
                    statusCell.appendChild(document.createTextNode(" "));
                    statusCell.appendChild(makeEl("span", "badge badge-priority", "⭐ Priority"));
                }

                row.appendChild(statusCell);
                tbody.appendChild(row);
            });

            table.appendChild(tbody);
            wrap.appendChild(table);
            holder.appendChild(wrap);
            return mine.length;
        }

        // ----- My Package -----
        function renderPackage() {
            const panel = document.getElementById("packagePanel");
            const record = getPlanRecord(account.email);
            panel.textContent = "";

            if (record.active) {
                const plan = PLANS[record.active.planId];

                panel.appendChild(makeEl("span", "badge badge-ok", "Active (demo)"));
                panel.appendChild(makeEl("p", "package-name", plan.name));
                panel.appendChild(makeEl("p", "", plan.tagline));

                const meta = makeEl("div", "package-meta");
                meta.appendChild(makeEl("span", "badge", "Selected: " + formatTimestamp(record.active.selectedAt)));
                meta.appendChild(makeEl("span", "badge badge-demo", record.active.paymentStatus || "Demo payment completed (simulated)"));
                panel.appendChild(meta);

                const list = makeEl("ul", "plan-list");
                plan.benefits.forEach(function(text) { list.appendChild(makeEl("li", "", text)); });
                panel.appendChild(list);

                if (plan.id === "deluxe") {
                    panel.appendChild(makeEl("h3", "plan-list-title", "Deluxe extras (sample content)"));
                    const resources = makeEl("ul", "resource-list");
                    [
                        "📘 Seasonal pet-care guide",
                        "🥣 Nutrition basics checklist",
                        "🦷 Dental care checklist",
                        "☀️ Heat-safety tips for hot days",
                        "📈 Care tracking: add vaccination and check-up dates to your pet profiles"
                    ].forEach(function(text) { resources.appendChild(makeEl("li", "", text)); });
                    panel.appendChild(resources);
                } else {
                    const upgrade = makeEl("p", "", "Want detailed pet profiles and care tracking? ");
                    const link = makeEl("a", "", "Compare with the Deluxe demo plan");
                    link.href = "services.html#packages";
                    link.style.fontWeight = "800";
                    link.style.textDecoration = "underline";
                    upgrade.appendChild(link);
                    panel.appendChild(upgrade);
                }
            } else if (!record.pending) {
                const empty = makeEl("div", "empty-state");
                empty.appendChild(document.createTextNode("You haven't chosen a package yet. "));
                const link = makeEl("a", "", "Explore the Basic and Deluxe demo plans");
                link.href = "services.html#packages";
                empty.appendChild(link);
                empty.appendChild(document.createTextNode("."));
                panel.appendChild(empty);
            }

            if (record.pending) {
                const pendingPlan = PLANS[record.pending.planId];
                const note = makeEl("div", "pending-note");
                note.appendChild(makeEl("strong", "", "Selected: " + pendingPlan.name));
                note.appendChild(document.createTextNode(" on " + formatTimestamp(record.pending.selectedAt) + ". Demo payment: awaiting."));
                note.appendChild(document.createElement("br"));
                const go = makeEl("a", "main-button", "Continue to demo checkout");
                go.href = "checkout.html";
                note.appendChild(go);
                panel.appendChild(note);
            }

            return record.active ? PLANS[record.active.planId].name : "None";
        }

        // ----- Payment History -----
        function renderPayments() {
            const holder = document.getElementById("paymentList");
            const mine = readStored(STORAGE_KEYS.transactions, "array")
                .filter(function(tx) { return tx.userEmail === account.email; })
                .sort(function(a, b) { return String(b.createdAt || "").localeCompare(String(a.createdAt || "")); });

            holder.textContent = "";

            if (mine.length === 0) {
                holder.appendChild(makeEl("div", "empty-state", "No simulated payments yet."));
                return 0;
            }

            const wrap = makeEl("div", "table-wrap");
            const table = makeEl("table", "data-table");
            const headRow = document.createElement("tr");

            ["Package", "Amount", "Method", "Reference", "Status"].forEach(function(title) {
                const th = makeEl("th", "", title);
                th.scope = "col";
                headRow.appendChild(th);
            });

            const thead = document.createElement("thead");
            thead.appendChild(headRow);
            table.appendChild(thead);

            const tbody = document.createElement("tbody");

            mine.forEach(function(tx) {
                const row = document.createElement("tr");

                [
                    ["Package", tx.planName || "—"],
                    ["Amount", formatPeso(tx.amount) + " (illustrative)"],
                    ["Method", (tx.method || "—") + " (demo)"],
                    ["Reference", tx.id || "—"]
                ].forEach(function(pair) {
                    const td = makeEl("td", "", pair[1]);
                    td.dataset.label = pair[0];
                    row.appendChild(td);
                });

                const statusCell = document.createElement("td");
                statusCell.dataset.label = "Status";
                statusCell.appendChild(makeEl("span", "badge badge-demo", tx.status || "Simulated (DEMO)"));
                row.appendChild(statusCell);

                tbody.appendChild(row);
            });

            table.appendChild(tbody);
            wrap.appendChild(table);
            holder.appendChild(wrap);
            return mine.length;
        }

        // ----- Account Settings -----
        function renderAccount() {
            document.getElementById("dashName").textContent = currentName;
            document.getElementById("accountNameView").textContent = currentName;
            document.getElementById("accountEmailView").textContent = account.email;
            document.getElementById("accountName").value = currentName;
        }

        accountForm.addEventListener("submit", function(event) {
            event.preventDefault();
            accountMessage.style.color = "#C0392B";

            const newName = document.getElementById("accountName").value.trim();

            if (!newName) {
                accountMessage.textContent = "Please enter a name.";
                return;
            }

            const users = readStored(STORAGE_KEYS.users, "array");
            const stored = users.find(function(user) { return user.email === account.email; });

            if (!stored) {
                accountMessage.textContent = "Could not find this account in the browser.";
                return;
            }

            stored.name = newName;

            if (!writeStored(STORAGE_KEYS.users, users)) {
                accountMessage.textContent = "Could not save the change in this browser.";
                return;
            }

            localStorage.setItem(STORAGE_KEYS.currentUser, newName);
            currentName = newName;

            const userName = document.getElementById("userName");

            if (userName) {
                userName.textContent = "Hi, " + newName;
            }

            accountMessage.style.color = "";
            accountMessage.textContent = "Account updated. ✅";
            renderAccount();
        });

        // ----- Draw everything -----
        function refreshDashboard() {
            const petCount = readStored(STORAGE_KEYS.pets, "array").filter(function(pet) {
                return pet.userEmail === account.email;
            }).length;

            renderPets();
            const appointmentCount = renderAppointments();
            const planName = renderPackage();
            const paymentCount = renderPayments();
            renderAccount();

            document.getElementById("statPets").textContent = petCount;
            document.getElementById("statAppointments").textContent = appointmentCount;
            document.getElementById("statPlan").textContent = planName;
            document.getElementById("statPayments").textContent = paymentCount;
        }

        claimOlderBookings();
        updateOtherPetField();
        refreshDashboard();
    }
}
