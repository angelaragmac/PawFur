
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

            window.location.href = "home.html";
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
// PROTECT WEBSITE PAGES
// =====================================

const isAppPage = document.body.classList.contains("app-body");

if (isAppPage) {
    const loggedIn = localStorage.getItem("pawfurLoggedIn");

    if (loggedIn !== "true") {
        window.location.replace("login.html");
    } else {
        const user = localStorage.getItem("pawfurCurrentUser") || "Pet Lover";

        const userName = document.getElementById("userName");
        const welcomeUser = document.getElementById("welcomeUser");

        if (userName) {
            userName.textContent = "Hi, " + user;
        }

        if (welcomeUser) {
            welcomeUser.textContent = user;
        }
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

        document.getElementById("vetMap").src =
            "https://maps.google.com/maps?q=" + encodedSearch + "&output=embed";

        document.getElementById("googleMapsLink").href =
            "https://www.google.com/maps/search/" + encodedSearch;
    });
}

// =====================================
// APPOINTMENT BOOKING
// =====================================

const bookingForm = document.getElementById("bookingForm");

if (bookingForm) {
    const dateInput = document.getElementById("appointmentDate");

    // Prevent selecting a past date
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    dateInput.min = year + "-" + month + "-" + day;

    bookingForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const appointment = {
            owner: document.getElementById("ownerName").value.trim(),
            pet: document.getElementById("petName").value.trim(),
            animal: document.getElementById("animalType").value,
            service: document.getElementById("serviceType").value,
            date: document.getElementById("appointmentDate").value,
            time: document.getElementById("appointmentTime").value,
            contact: document.getElementById("contactNumber").value.trim()
        };

        let bookings = JSON.parse(localStorage.getItem("pawfurBookings")) || [];

        bookings.push(appointment);

        localStorage.setItem("pawfurBookings", JSON.stringify(bookings));

        document.getElementById("bookingResult").textContent =
            "Your booking request has been saved! Please contact your chosen clinic to confirm the appointment.";

        document.getElementById("bookingResult").style.color = "green";

        bookingForm.reset();
        dateInput.min = year + "-" + month + "-" + day;
    });
}

// =====================================
// PAWFUR CHATBOT
// English, Tagalog and Bisaya
// =====================================

if (isAppPage) {

    // Create chatbot automatically on every website page
    const chatHTML = `
        <button class="chat-toggle" id="chatToggle">
            🐾 Chat with PAWFUR
        </button>

        <div class="chat-window" id="chatWindow">
            <div class="chat-header">
                <strong>PAWFUR Assistant 🐾</strong>
                <button id="closeChat" type="button">×</button>
            </div>

            <select id="chatLanguage" class="chat-language">
                <option value="en">English</option>
                <option value="tl">Filipino (Tagalog)</option>
                <option value="ceb">Bisaya (Cebuano)</option>
            </select>

            <div class="chat-messages" id="chatMessages">
                <div class="chat-message bot-message">
                    Hello! I'm PAWFUR Assistant. 🐾
                    Ask me about pet care, symptoms, vaccines, or appointments!
                </div>
            </div>

            <form class="chat-form" id="chatForm">
                <input type="text" id="chatInput"
                    placeholder="Ask a question..." autocomplete="off" required>
                <button type="submit">Send</button>
            </form>
        </div>
    `;

    document.body.insertAdjacentHTML("beforeend", chatHTML);

    const chatToggle = document.getElementById("chatToggle");
    const chatWindow = document.getElementById("chatWindow");
    const closeChat = document.getElementById("closeChat");
    const chatForm = document.getElementById("chatForm");
    const chatInput = document.getElementById("chatInput");
    const chatMessages = document.getElementById("chatMessages");
    const chatLanguage = document.getElementById("chatLanguage");

    chatToggle.addEventListener("click", function() {
        chatWindow.classList.add("open");
        chatInput.focus();
    });

    closeChat.addEventListener("click", function() {
        chatWindow.classList.remove("open");
    });

    // Add a message to the chatbot
    function addMessage(message, sender) {
        const messageElement = document.createElement("div");

        messageElement.className =
            sender === "user"
                ? "chat-message user-message"
                : "chat-message bot-message";

        messageElement.textContent = message;

        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Detect keywords in the question
    function hasAny(text, words) {
        return words.some(function(word) {
            return text.includes(word);
        });
    }

    // Chatbot responses
    function getBotResponse(question, language) {

        const text = question.toLowerCase().trim();

        // ENGLISH RESPONSES
        const english = {
            greeting: "Hello! 🐾 Welcome to PAWFUR. What would you like to know about your pet?",
            vomiting: "Vomiting can happen for different reasons, including stomach irritation or illness. Offer access to fresh water, but do not force food or give human medicine. Contact a veterinarian, especially if vomiting repeats, there is blood, or your pet becomes weak.",
            notEating: "A pet that refuses food may be unwell, stressed, or experiencing pain. Contact a veterinarian if your pet continues not eating, seems weak, or has other symptoms.",
            sick: "I'm sorry your pet isn't feeling well. 🐾 I cannot diagnose illnesses. Please contact a veterinarian for an examination, especially if your pet is in pain or getting worse.",
            vaccine: "Vaccinations help protect pets against serious diseases. Ask your veterinarian for a vaccination schedule based on your pet's age, health, and vaccination history.",
            dog: "Dogs need clean water, balanced food, exercise, grooming, and regular veterinary checkups. What would you like to know about dogs?",
            cat: "Cats need fresh water, suitable food, a clean litter box, playtime, and regular veterinary checkups. What would you like to know about cats?",
            food: "Give your pet food made for its species and age. Avoid giving human foods unless a veterinarian confirms they are safe.",
            appointment: "You can book an appointment by opening the Booking page in PAWFUR. Fill in your details and submit your request.",
            location: "Open the Vet Locator page. Enter your city or location to search for veterinary clinics using Google Maps.",
            emergency: "If your pet is struggling to breathe, collapsing, having seizures, bleeding heavily, or may have swallowed poison, seek emergency veterinary care immediately.",
            thanks: "You're welcome! 🐾 I'm happy to help you care for your pet.",
            fallback: "I don't understand that question yet. Try asking about vomiting, sickness, food, dogs, cats, vaccines, appointments, or finding a vet."
        };

        // TAGALOG RESPONSES
        const tagalog = {
            greeting: "Hello! 🐾 Welcome sa PAWFUR! Ano ang gusto mong malaman tungkol sa iyong alagang hayop?",
            vomiting: "Ang pagsusuka ay maaaring dahil sa iba't ibang dahilan. Bigyan ng access sa malinis na tubig, pero huwag piliting kumain o bigyan ng gamot ng tao. Kumonsulta sa beterinaryo, lalo na kung paulit-ulit ang pagsusuka o nanghihina ang alaga.",
            notEating: "Maaaring may sakit, stress, o nararamdamang sakit ang alaga kapag ayaw nitong kumain. Kumonsulta sa beterinaryo kung nagpapatuloy ito o may iba pang sintomas.",
            sick: "Pasensya na at hindi maganda ang pakiramdam ng iyong alaga. Hindi ako makakapagbigay ng diagnosis. Mas mabuting magpakonsulta sa beterinaryo.",
            vaccine: "Mahalaga ang bakuna upang maprotektahan ang mga alagang hayop laban sa sakit. Magtanong sa beterinaryo tungkol sa tamang iskedyul ng bakuna.",
            dog: "Kailangan ng aso ng malinis na tubig, tamang pagkain, ehersisyo, paliligo, at regular na checkup sa beterinaryo.",
            cat: "Kailangan ng pusa ng malinis na tubig, tamang pagkain, malinis na litter box, oras sa paglalaro, at regular na checkup.",
            food: "Bigyan ang iyong alaga ng pagkaing angkop sa uri at edad nito. Iwasang magbigay ng pagkain ng tao kung hindi sigurado na ligtas ito.",
            appointment: "Pumunta sa Booking page ng PAWFUR. Punan ang form at isumite ang iyong appointment request.",
            location: "Buksan ang Vet Locator page. Ilagay ang iyong lungsod o lokasyon upang makahanap ng veterinary clinic sa Google Maps.",
            emergency: "Kung nahihirapang huminga, nawawalan ng malay, nangingisay, malakas ang pagdurugo, o posibleng nakalunok ng lason ang alaga, dalhin agad ito sa emergency veterinarian.",
            thanks: "Walang anuman! 🐾 Masaya akong makatulong sa pag-aalaga ng iyong alaga.",
            fallback: "Hindi ko pa maintindihan ang tanong na iyan. Maaari kang magtanong tungkol sa pagsusuka, sakit, pagkain, aso, pusa, bakuna, appointment, o paghahanap ng vet."
        };

        // BISAYA RESPONSES
        const bisaya = {
            greeting: "Hello! 🐾 Welcome sa PAWFUR! Unsay gusto nimo mahibal-an bahin sa imong binuhi?",
            vomiting: "Ang pagsuka mahimong tungod sa lain-laing rason. Siguroa nga naay limpyo nga tubig ang imong binuhi. Ayaw pugsa og pakaon o hatagi og tambal sa tawo. Pakonsulta sa veterinarian, labi na kung balik-balik ang pagsuka o luya na siya.",
            notEating: "Kung dili mokaon ang imong binuhi, basin naay sakit, stress, o kasakit. Pakonsulta sa veterinarian kung magpadayon kini o adunay lain nga sintomas.",
            sick: "Pasensya kung dili maayo ang paminaw sa imong binuhi. Dili ko makahimo og medical diagnosis. Mas maayo nga ipasusi siya sa veterinarian.",
            vaccine: "Importante ang bakuna aron mapanalipdan ang imong binuhi batok sa mga sakit. Pangutana sa veterinarian bahin sa saktong schedule sa bakuna.",
            dog: "Ang iro nagkinahanglan og limpyo nga tubig, hustong pagkaon, ehersisyo, grooming, ug regular nga checkup sa veterinarian.",
            cat: "Ang iring nagkinahanglan og limpyo nga tubig, hustong pagkaon, limpyo nga litter box, pagdula, ug regular nga checkup.",
            food: "Hatagi ang imong binuhi og pagkaon nga angay sa iyang klase ug edad. Likayi ang pagkaon sa tawo kung dili ka sigurado nga luwas kini.",
            appointment: "Ablihi ang Booking page sa PAWFUR. Pun-a ang form ug i-submit ang imong appointment request.",
            location: "Ablihi ang Vet Locator page. Isulat ang imong siyudad o lugar aron makapangita og veterinary clinic gamit ang Google Maps.",
            emergency: "Kung lisod siya moginhawa, natumba, nagkombulsyon, grabe ang pagdugo, o basin nakakaon og hilo, dad-a dayon siya sa emergency veterinarian.",
            thanks: "Walay sapayan! 🐾 Malipay ko nga makatabang sa imong binuhi.",
            fallback: "Wala pa nako masabti ang imong pangutana. Sulayi og pangutana bahin sa pagsuka, sakit, pagkaon, iro, iring, bakuna, appointment, o pagpangita og vet."
        };

        // Select language
        let responses = english;

        if (language === "tl") {
            responses = tagalog;
        } else if (language === "ceb") {
            responses = bisaya;
        }

        // Emergency keywords first
        if (hasAny(text, [
            "cannot breathe", "can't breathe", "difficulty breathing",
            "seizure", "poison", "bleeding heavily", "collapsed",
            "hirap huminga", "nalason", "nangingisay",
            "lisod moginhawa", "kombulsyon", "hilo"
        ])) {
            return responses.emergency;
        }

        // Vomiting
        if (hasAny(text, [
            "vomit", "vomiting", "throwing up", "nagsusuka",
            "suka", "pagsuka", "nagsuka", "nagsuka akong",
            "suka akong", "nagsuka ang", "nagsuka siya"
        ])) {
            return responses.vomiting;
        }

        // Not eating
        if (hasAny(text, [
            "not eating", "won't eat", "refuse to eat", "no appetite",
            "ayaw kumain", "hindi kumakain", "dili mokaon",
            "dili mukaon", "walay gana mokaon"
        ])) {
            return responses.notEating;
        }

        // Vaccination
        if (hasAny(text, [
            "vaccine", "vaccination", "vaccines", "bakuna",
            "pagbabakuna", "bakunahan", "bakuna sa"
        ])) {
            return responses.vaccine;
        }

        // Appointment
        if (hasAny(text, [
            "appointment", "book", "booking", "schedule",
            "magpa-appointment", "magpa appointment",
            "magpa-book", "magpa book", "iskedyul"
        ])) {
            return responses.appointment;
        }

        // Vet locator
        if (hasAny(text, [
            "vet near", "veterinarian", "vet clinic", "animal clinic",
            "where is the vet", "find a vet", "clinic near",
            "saan ang vet", "saan may vet", "klinika",
            "asa ang vet", "asa naay vet", "pangita og vet",
            "iro", "irong", "iring", "iring nga"
        ])) {
            if (hasAny(text, ["vet", "veterinarian", "clinic", "klinika", "saan", "asa", "find"])) {
                return responses.location;
            }
        }

        // Food
        if (hasAny(text, [
            "food", "eat", "eating", "diet", "what can my pet eat",
            "pagkain", "pagkain ng", "ano ang pwedeng ipakain",
            "unsa akong ipakaon", "pagkaon", "kaon"
        ])) {
            return responses.food;
        }

        // General sickness
        if (hasAny(text, [
            "sick", "ill", "pain", "hurt", "sakit", "may sakit",
            "masakit", "may nararamdaman", "luya", "weak",
            "nanghihina", "dili maayo", "dili siya maayo",
            "unsa sakit", "unsay sakit"
        ])) {
            return responses.sick;
        }

        // Dogs
        if (hasAny(text, [
            "dog", "dogs", "puppy", "puppies", "aso", "tuta", "iro"
        ])) {
            return responses.dog;
        }

        // Cats
        if (hasAny(text, [
            "cat", "cats", "kitten", "pusa", "kuting", "iring"
        ])) {
            return responses.cat;
        }

        // Greetings
        if (hasAny(text, [
            "hello", "hi", "hey", "good morning", "good afternoon",
            "good evening", "kumusta", "kamusta", "maayong buntag",
            "maayong hapon", "maayong gabii"
        ])) {
            return responses.greeting;
        }

        // Thank you
        if (hasAny(text, [
            "thank you", "thanks", "salamat", "daghang salamat"
        ])) {
            return responses.thanks;
        }

        return responses.fallback;
    }

    // Send a message
    chatForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const question = chatInput.value.trim();

        if (question === "") {
            return;
        }

        addMessage(question, "user");

        const answer = getBotResponse(question, chatLanguage.value);

        addMessage(answer, "bot");

        chatInput.value = "";
        chatInput.focus();
    });

}
