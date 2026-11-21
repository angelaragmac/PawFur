
// =====================================
// PAWFUR SHARED HELPERS
// =====================================

// Pages a visitor may be sent back to after logging in or signing up.
// Only an exact match from this list is ever used, so the redirect
// can never point to another website or an unexpected page.
const ALLOWED_REDIRECTS = ["booking.html"];

function getSafeRedirect() {
    const params = new URLSearchParams(window.location.search);
    const target = params.get("redirect");

    return ALLOWED_REDIRECTS.includes(target) ? target : null;
}

function isUserLoggedIn() {
    return localStorage.getItem("pawfurLoggedIn") === "true";
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
        authNotice.textContent =
            "Please log in or create an account before booking an appointment. 🐾";
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

        let users = JSON.parse(localStorage.getItem("pawfurUsers")) || [];

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

        localStorage.setItem("pawfurUsers", JSON.stringify(users));

        // Came from the Booking page: log the new user in and send them back
        if (authRedirect) {
            localStorage.setItem("pawfurLoggedIn", "true");
            localStorage.setItem("pawfurCurrentUser", name);

            message.textContent = "Account created! Taking you to booking...";
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

        const users = JSON.parse(localStorage.getItem("pawfurUsers")) || [];

        const account = users.find(function(user) {
            return user.email === email && user.password === password;
        });

        if (account) {
            localStorage.setItem("pawfurLoggedIn", "true");
            localStorage.setItem("pawfurCurrentUser", account.name);

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
// Members only: booking.html (body has data-require-auth="true")
// =====================================

const isAppPage = document.body.classList.contains("app-body");
const requiresLogin = document.body.dataset.requireAuth === "true";
const loggedIn = isUserLoggedIn();
const accessDenied = requiresLogin && !loggedIn;

if (accessDenied) {
    // Guests cannot open the booking page: send them to login with a friendly notice
    window.location.replace("login.html?redirect=booking.html");
} else {
    document.body.classList.add("auth-ready");
}

if (isAppPage && !accessDenied) {
    const user = localStorage.getItem("pawfurCurrentUser") || "Pet Lover";

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
        localStorage.removeItem("pawfurLoggedIn");
        localStorage.removeItem("pawfurCurrentUser");

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

        const appointment = {
            owner: document.getElementById("ownerName").value.trim(),
            pet: document.getElementById("petName").value.trim(),
            animal: selectedAnimal === "Other" ? "Other" : selectedAnimal,
            animalDetails: selectedAnimal === "Other" ? otherAnimal : "",
            service: document.getElementById("serviceType").value,
            date: document.getElementById("appointmentDate").value,
            time: document.getElementById("appointmentTime").value,
            contact: document.getElementById("contactNumber").value.trim()
        };

        let bookings = [];
        try {
            bookings = JSON.parse(localStorage.getItem("pawfurBookings")) || [];
            if (!Array.isArray(bookings)) bookings = [];
        } catch (error) {
            bookings = [];
        }

        bookings.push(appointment);
        localStorage.setItem("pawfurBookings", JSON.stringify(bookings));

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
            <span class="chat-toggle-paw">🐾</span><span>Chat with PAWFUR</span><span class="chat-online-dot" aria-hidden="true"></span>
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
                    <button class="chat-mic-preview" type="button" aria-label="Voice input coming soon" title="Voice input coming soon">🎙</button>
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