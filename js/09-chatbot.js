// =====================================
// FILE: js/09-chatbot.js
// PAWFUR CHATBOT: chat window, English/Tagalog/Bisaya replies, keyword matching, voice input + spoken replies
// Used by: every app page (injected into the page automatically)
// Key functions: openChat(), hideChat(), addMessage(), getBotResponse(), sendQuestion(),
//                startListening(), stopListening(), speak(), stopSpeaking(), detectLanguage()
// =====================================

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
                <div class="chat-voice-tools">
                    <button type="button" id="chatAutoLang" class="voice-chip is-on" aria-pressed="true" title="Detect the language you speak or type and reply in it">🌐 Auto</button>
                    <button type="button" id="chatSpeakToggle" class="voice-chip is-on" aria-pressed="true" title="Read replies aloud">🔊 Voice</button>
                    <button type="button" id="chatStopSpeech" class="voice-chip voice-chip-stop" title="Stop the spoken reply" hidden>⏹ Stop</button>
                </div>
            </div>
            <div class="chat-voice-status" id="chatVoiceStatus" role="status" aria-live="polite" hidden>
                <span class="voice-pulse" id="chatVoicePulse" aria-hidden="true" hidden></span>
                <span id="chatVoiceText"></span>
                <button type="button" id="chatStopListen" class="voice-chip voice-chip-stop" hidden>Stop</button>
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
                    <button class="chat-mic" id="chatMic" type="button" aria-label="Speak your question" aria-pressed="false" title="Speak your question">🎙️</button>
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
    const chatMic = document.getElementById("chatMic");
    const chatAutoLang = document.getElementById("chatAutoLang");
    const chatSpeakToggle = document.getElementById("chatSpeakToggle");
    const chatStopSpeech = document.getElementById("chatStopSpeech");
    const chatStopListen = document.getElementById("chatStopListen");
    const chatVoiceStatus = document.getElementById("chatVoiceStatus");
    const chatVoiceText = document.getElementById("chatVoiceText");
    const chatVoicePulse = document.getElementById("chatVoicePulse");

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
        stopListening(true);
        stopSpeaking();
        chatWindow.classList.remove("open");
        chatWindow.setAttribute("aria-hidden", "true");
        chatToggle.setAttribute("aria-expanded", "false");
        chatToggle.classList.remove("is-active");
    }
    chatToggle.addEventListener("click", openChat);
    closeChat.addEventListener("click", hideChat);
    document.addEventListener("keydown", event => { if (event.key === "Escape" && chatWindow.classList.contains("open")) hideChat(); });

    function addMessage(message, sender, replyLanguage) {
        const messageElement = document.createElement("div");
        messageElement.className = sender === "user" ? "chat-message user-message" : "chat-message bot-message";
        messageElement.textContent = message;
        if (sender === "bot") {
            // Reads this reply aloud (or stops it if it is already being read)
            const voiceButton = document.createElement("button");
            voiceButton.type = "button";
            voiceButton.className = "listen-preview listen-btn";
            voiceButton.textContent = LISTEN_LABEL;
            voiceButton.title = "Listen to this reply";
            voiceButton.addEventListener("click", () => {
                if (speaking && activeListenButton === voiceButton) {
                    stopSpeaking();
                } else {
                    speak(message, replyLanguage || chatLanguage.value, voiceButton);
                }
            });
            messageElement.appendChild(voiceButton);
        }
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return messageElement;
    }
    // Short keywords (3 letters or fewer, like "hi" or "eat") must be whole words,
    // so "hi" does not match "this" and "ill" does not match "will".
    function hasAny(text, words) {
        return words.some(word => word.length <= 3
            ? new RegExp("(^|[^a-z0-9])" + word + "($|[^a-z0-9])").test(text)
            : text.includes(word));
    }

    function getBotResponse(question, language) {
        // Speech recognition may return curly apostrophes ("can’t"); keywords use straight ones
        const text = question.toLowerCase().trim().replace(/[\u2018\u2019]/g, "'");
        const english = {
            greeting: "Hello! 🐾 Welcome to PAWFUR. What would you like to know about your pet?",
            vomiting: "Vomiting can have different causes. Keep fresh water available, but do not force food or give human medicine. Contact a veterinarian, especially if vomiting repeats, there is blood, or your pet becomes weak.",
            notEating: "A pet that refuses food may be unwell, stressed, or in pain. Contact a veterinarian if this continues or comes with other symptoms.",
            sick: "I'm sorry your pet isn't feeling well. 🐾 I cannot diagnose illnesses. Please contact a veterinarian for an examination, especially if your pet is in pain or getting worse.",
            vaccine: "Vaccinations help protect pets against serious diseases. Ask your veterinarian for a schedule based on your pet's age, health, and vaccination history.",
            dog: "Dogs need clean water, balanced dog food, daily activity suited to their age, grooming, training, and regular veterinary checkups.",
            cat: "Cats need fresh water, complete cat food, a clean litter box, play and enrichment, safe resting spaces, and regular veterinary checkups.",
            food: "Choose complete food made for your pet's species and life stage. Keep fresh water available and check with a veterinarian before introducing unfamiliar foods or supplements.",
            appointment: "Open the Vet Locator, search your area, and tap Book at This Clinic. You can also open the Booking page and choose a clinic there. Fill in the form, confirm your request, and you'll see it in your dashboard. Please contact the clinic to confirm availability.",
            location: "Open the Vet Locator page and enter your city or area to search for veterinary clinics using Google Maps.",
            emergency: "If your pet is struggling to breathe, collapsing, having seizures, bleeding heavily, or may have swallowed poison, seek emergency veterinary care immediately.",
            grooming: "Brush your pet regularly using tools suitable for its coat. Keep nails, ears, teeth, and skin in mind, and ask a groomer or veterinarian for help if you are unsure.",
            hygiene: "Keep food and water bowls clean, wash bedding regularly, and maintain a clean litter area or toileting space. Use pet-safe cleaning products.",
            play: "Play supports activity and enrichment. Choose safe toys that match your pet's size, supervise play, and avoid toys with small parts that could be swallowed.",
            thanks: "You're welcome! 🐾 I'm happy to help you care for your pet.",
            about: "PAWFUR is a pet-care information website that helps pet owners explore services, find veterinary clinics, and send appointment requests.",
            help: "I can share general pet-care tips about dogs and cats, food, grooming, hygiene, play, vaccines, and what to do when your pet seems unwell. I can also guide you to the Vet Locator and the Booking page. I can't diagnose illnesses, so please see a licensed veterinarian for health concerns.",
            bye: "Goodbye! 🐾 Take good care of your pet.",
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
            appointment: "Buksan ang Vet Locator, hanapin ang iyong lugar, at pindutin ang Book at This Clinic. Maaari ka ring pumunta sa Booking page at pumili ng clinic doon. Punan ang form, kumpirmahin ang request, at makikita mo ito sa iyong dashboard. Kontakin ang clinic para kumpirmahin ang availability.",
            location: "Buksan ang Vet Locator page at ilagay ang iyong lungsod o lugar upang maghanap ng veterinary clinic sa Google Maps.",
            emergency: "Kung nahihirapang huminga, nawawalan ng malay, nangingisay, malakas ang pagdurugo, o posibleng nakalunok ng lason ang alaga, dalhin agad ito sa emergency veterinarian.",
            grooming: "Suklayin ang alaga gamit ang angkop na brush. Alagaan din ang kuko, tainga, ngipin, at balat. Humingi ng tulong kung hindi sigurado.",
            hygiene: "Panatilihing malinis ang mga mangkok, higaan, litter box, at lugar nito. Gumamit lamang ng panlinis na ligtas para sa alaga.",
            play: "Mahalaga ang paglalaro para sa aktibidad at stimulation. Pumili ng ligtas na laruan na angkop sa laki ng alaga at bantayan habang naglalaro.",
            thanks: "Walang anuman! 🐾 Masaya akong makatulong sa pag-aalaga ng iyong alaga.",
            about: "Ang PAWFUR ay website na nagbibigay ng impormasyon tungkol sa pet care, veterinary services, paghahanap ng clinic, at appointment requests.",
            help: "Makakapagbigay ako ng pangkalahatang tips sa pag-aalaga ng aso at pusa, pagkain, grooming, kalinisan, paglalaro, bakuna, at kung ano ang gagawin kapag may sakit ang alaga. Maaari rin kitang gabayan sa Vet Locator at Booking page. Hindi ako makakapag-diagnose, kaya magpakonsulta sa lisensyadong beterinaryo.",
            bye: "Paalam! 🐾 Alagaan mong mabuti ang iyong alaga.",
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
            appointment: "Ablihi ang Vet Locator, pangitaa ang imong lugar, ug i-tap ang Book at This Clinic. Mahimo usab nimo ablihan ang Booking page ug pilion ang clinic didto. Pun-a ang form, kumpirmaha ang request, ug makita nimo kini sa imong dashboard. Tawagi ang clinic aron makumpirma ang availability.",
            location: "Ablihi ang Vet Locator page ug isulat ang imong siyudad o lugar aron makapangita og veterinary clinic gamit ang Google Maps.",
            emergency: "Kung lisod siya moginhawa, natumba, nagkombulsyon, grabe ang pagdugo, o basin nakakaon og hilo, dad-a dayon siya sa emergency veterinarian.",
            grooming: "Suklayi ang imong binuhi gamit ang angay nga brush. Ampingi usab ang kuko, dalunggan, ngipon, ug panit. Pangayo og tabang kung dili ka sigurado.",
            hygiene: "Limpyoha kanunay ang food ug water bowls, higdaanan, litter box, ug palibot. Gamita lang ang cleaning products nga luwas para sa pets.",
            play: "Importante ang pagdula para sa kalihokan ug stimulation. Pilia ang luwas nga dulaan nga angay sa gidak-on sa imong binuhi ug bantayi samtang nagdula.",
            thanks: "Walay sapayan! 🐾 Malipay ko nga makatabang sa imong binuhi.",
            about: "Ang PAWFUR website naghatag og impormasyon sa pet care, veterinary services, pagpangita og clinic, ug appointment requests.",
            help: "Makahatag ko og kinatibuk-ang tips bahin sa pag-atiman sa iro ug iring, pagkaon, grooming, kalimpyo, pagdula, bakuna, ug unsay buhaton kung nagsakit ang binuhi. Mahatagan ka usab nako og giya sa Vet Locator ug Booking page. Dili ko makahimo og diagnosis, busa pakonsulta sa lisensyadong veterinarian.",
            bye: "Babay! 🐾 Atimani pag-ayo ang imong binuhi.",
            fallback: "Sulayi og pangutana bahin sa pag-atiman sa iro o iring, pagkaon, grooming, kalimpyo, pagdula, bakuna, sintomas, appointment, o pagpangita og vet."
        };
        const responses = language === "tl" ? tagalog : language === "ceb" ? bisaya : english;
        if (hasAny(text, ["cannot breathe", "can't breathe", "difficulty breathing", "seizure", "poison", "bleeding heavily", "collapsed", "hirap huminga", "nalason", "nangingisay", "lisod moginhawa", "kombulsyon", "hilo", "lisod ginhawa", "hindi makahinga", "hirap sa paghinga", "dili makaginhawa", "choking", "emergency", "namamatay", "nagsisikip"])) return responses.emergency;
        if (hasAny(text, ["vomit", "throwing up", "throw up", "threw up", "nagsusuka", "suka", "pagsuka", "nagsuka", "gisuka"])) return responses.vomiting;
        if (hasAny(text, ["not eating", "won't eat", "refuse to eat", "no appetite", "ayaw kumain", "hindi kumakain", "dili mokaon", "dili mukaon", "walay gana mokaon", "walay gana", "wala mokaon", "dili na mokaon", "di kumakain", "di kumain", "ayaw nang kumain", "ayaw mokaon", "wala nang gana"])) return responses.notEating;
        if (hasAny(text, ["vaccine", "vaccination", "vaccines", "shots", "immunization", "bakuna", "pagbabakuna", "bakunahan", "magpabakuna", "pabakunahan", "ipabakuna", "pabakuna"])) return responses.vaccine;
        if (hasAny(text, ["appointment", "book", "booking", "schedule", "magpa-appointment", "magpa appointment", "magpa-book", "magpa book", "iskedyul", "magpa-schedule", "magpa schedule", "magpa-checkup", "magpa checkup", "magpacheck", "pa-appointment", "pa-checkup", "pasusi", "ipasusi", "ipa-checkup"])) return responses.appointment;
        if (hasAny(text, ["vet near", "veterinarian", "vet clinic", "animal clinic", "where is the vet", "find a vet", "clinic near", "saan ang vet", "saan may vet", "klinika", "asa ang vet", "asa naay vet", "pangita og vet", "nearest vet", "vet nearby", "beterinaryo", "mangitag vet", "pangitag vet", "maghanap ng vet", "hanapin ang vet"])) return responses.location;
        if (hasAny(text, ["groom", "grooming", "brush", "paligo", "ligo", "suklay"])) return responses.grooming;
        if (hasAny(text, ["clean", "hygiene", "litter box", "kalinisan", "kalimpyo", "linis ng", "limpyoha"])) return responses.hygiene;
        if (hasAny(text, ["play", "toy", "toys", "laro", "dulaan"])) return responses.play;
        if (hasAny(text, ["food", "eat", "eating", "diet", "pagkain", "ipakain", "pagkaon", "kaon"])) return responses.food;
        if (hasAny(text, ["sick", "ill", "pain", "hurt", "sakit", "may sakit", "masakit", "luya", "weak", "nanghihina", "dili maayo"])) return responses.sick;
        if (hasAny(text, ["dog", "dogs", "puppy", "puppies", "aso", "tuta", "iro"])) return responses.dog;
        if (hasAny(text, ["cat", "cats", "kitten", "pusa", "kuting", "iring"])) return responses.cat;
        if (hasAny(text, ["pawfur", "website", "what is this site", "about your site"])) return responses.about;
        if (hasAny(text, ["what can you do", "who are you", "can you help", "help me", "anong magagawa mo", "sino ka", "pwede mo ba akong tulungan", "unsay mahimo nimo", "kinsa ka", "tabangi ko", "makatabang ka"])) return responses.help;
        if (hasAny(text, ["bye", "goodbye", "see you", "paalam", "babay", "hangtod sa sunod"])) return responses.bye;
        if (hasAny(text, ["hello", "hi", "hey", "good morning", "good afternoon", "good evening", "kumusta", "kamusta", "magandang umaga", "magandang hapon", "magandang gabi", "maayong buntag", "maayong hapon", "maayong gabii", "maayong adlaw"])) return responses.greeting;
        if (hasAny(text, ["thank you", "thanks", "salamat", "daghang salamat", "maraming salamat"])) return responses.thanks;
        return responses.fallback;
    }

    // =====================================
    // VOICE: language settings, language detection, speech recognition, spoken replies
    // Uses the browser's Web Speech API (SpeechRecognition + speechSynthesis).
    // Chrome/Edge/Safari support voice input; Firefox does not. Text chat always works.
    // =====================================
    const LISTEN_LABEL = "🔊 Listen to response";
    const LANG_NAMES = { en: "English", tl: "Filipino (Tagalog)", ceb: "Bisaya (Cebuano)" };
    // Browser language codes to try, in order. Cebuano is not offered by most browsers,
    // so the Filipino voice/recognizer is the fallback (shared vocabulary, approximate result).
    const VOICE_LANGS = {
        en: { recog: ["en-PH", "en-US"], tts: ["en-PH", "en-US", "en-GB"] },
        tl: { recog: ["fil-PH", "tl-PH"], tts: ["fil-PH", "tl-PH"] },
        ceb: { recog: ["ceb-PH", "fil-PH"], tts: ["ceb-PH", "ceb", "fil-PH", "tl-PH"] }
    };

    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    const synth = window.speechSynthesis || null;
    const VOICE_PREF_KEY = "pawfurChatVoice";

    let recognition = null;
    let listening = false;
    let speaking = false;
    let speakToken = 0;
    let activeListenButton = null;
    let voices = [];
    let statusTimer = null;
    let speakEnabled = true;
    let autoLangEnabled = true;

    try {
        const saved = JSON.parse(localStorage.getItem(VOICE_PREF_KEY) || "{}");
        if (saved.speak === false) speakEnabled = false;
        if (saved.auto === false) autoLangEnabled = false;
    } catch (error) { /* preferences are optional */ }

    function saveVoicePrefs() {
        try { localStorage.setItem(VOICE_PREF_KEY, JSON.stringify({ speak: speakEnabled, auto: autoLangEnabled })); } catch (error) { /* optional */ }
    }

    function showVoiceStatus(message, kind) {
        window.clearTimeout(statusTimer);
        chatVoiceStatus.hidden = !message;
        chatVoiceStatus.className = "chat-voice-status" + (kind ? " is-" + kind : "");
        chatVoiceText.textContent = message || "";
        chatVoicePulse.hidden = kind !== "listening";
        chatStopListen.hidden = kind !== "listening";

        if (message && kind !== "listening" && kind !== "warn") {
            statusTimer = window.setTimeout(() => { chatVoiceStatus.hidden = true; }, 6000);
        }
    }

    function syncToggles() {
        chatSpeakToggle.classList.toggle("is-on", speakEnabled);
        chatSpeakToggle.setAttribute("aria-pressed", String(speakEnabled));
        chatSpeakToggle.textContent = speakEnabled ? "🔊 Voice" : "🔇 Voice";
        chatAutoLang.classList.toggle("is-on", autoLangEnabled);
        chatAutoLang.setAttribute("aria-pressed", String(autoLangEnabled));
    }
    syncToggles();

    // ----- Language detection (keyword based; browsers cannot detect spoken language) -----
    const LANG_WORDS = {
        en: ["the", "is", "are", "my", "your", "how", "what", "when", "where", "why", "do", "does", "should", "can", "could", "i", "you", "to", "of", "and", "for", "with", "have", "has", "pet", "dog", "cat", "care", "food", "feed", "eat", "vaccine", "vaccines", "appointment", "book", "sick", "vomiting", "not", "vet", "clinic", "please", "hello", "thanks", "thank", "about", "need", "help", "often", "take", "get"],
        tl: ["ng", "naman", "paano", "ano", "saan", "bakit", "kailan", "magkano", "hindi", "huwag", "mayroon", "para", "alaga", "aso", "pusa", "kumain", "kumakain", "pagkain", "nagsusuka", "paligo", "magpa", "kumusta", "kamusta", "natin", "namin", "niya", "yung", "iyong", "ikaw", "po", "opo", "dapat", "nito", "ito", "iyan", "mo", "gusto", "pwede", "puwede"],
        ceb: ["unsa", "unsay", "unsaon", "asa", "nganong", "ngano", "pila", "dili", "wala", "walay", "naay", "adunay", "akong", "imong", "iyang", "among", "atong", "binuhi", "iro", "iring", "pagkaon", "mokaon", "mukaon", "kaon", "pagsuka", "luya", "kaayo", "kay", "ug", "og", "nako", "nimo", "siya", "mahimo", "palihog", "maayong", "daghang", "pud", "gyud", "unta", "naa", "diri", "didto", "kanus-a", "tabangi", "angay", "ipasusi"]
    };

    function detectLanguage(text) {
        const tokens = text.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-zñ'\- ]/g, " ").split(/\s+/).filter(Boolean);
        const scores = { en: 0, tl: 0, ceb: 0 };
        const seen = new Set();

        tokens.forEach(token => {
            if (seen.has(token)) return;
            seen.add(token);
            Object.keys(LANG_WORDS).forEach(code => { if (LANG_WORDS[code].includes(token)) scores[code] += 1; });
        });

        const ranked = Object.keys(scores).sort((a, b) => scores[b] - scores[a]);
        const best = ranked[0];
        const clear = scores[best] > 0 && scores[best] > scores[ranked[1]];
        return { lang: clear ? best : null, score: scores[best], scores: scores };
    }

    // Switches the existing language selector when the question is clearly in another language
    function applyDetectedLanguage(text, minScore) {
        if (!autoLangEnabled) return;
        const found = detectLanguage(text);
        const current = chatLanguage.value;

        if (found.lang && found.lang !== current && found.score >= minScore && found.score > found.scores[current]) {
            chatLanguage.value = found.lang;
            showVoiceStatus("Detected " + LANG_NAMES[found.lang] + ". Replying in " + LANG_NAMES[found.lang] + ".", "info");
        }
    }

    // ----- Spoken replies (speechSynthesis) -----
    function loadVoices() { if (synth) voices = synth.getVoices() || []; }
    if (synth) {
        loadVoices();
        if (synth.addEventListener) synth.addEventListener("voiceschanged", loadVoices);
        else synth.onvoiceschanged = loadVoices;
    }

    function normalizeCode(code) { return String(code || "").toLowerCase().replace("_", "-"); }

    function pickVoice(language) {
        const wanted = VOICE_LANGS[language].tts.map(normalizeCode);
        for (const code of wanted) {
            const exact = voices.find(voice => normalizeCode(voice.lang) === code);
            if (exact) return exact;
        }
        for (const code of wanted) {
            const base = code.split("-")[0];
            const loose = voices.find(voice => normalizeCode(voice.lang).split("-")[0] === base);
            if (loose) return loose;
        }
        return null;
    }

    function cleanForSpeech(text) {
        return text.replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, "").replace(/\s+/g, " ").trim();
    }

    // Long text is read sentence by sentence (some browsers stop long utterances early)
    function splitForSpeech(text) {
        const parts = text.match(/[^.!?]+[.!?]*/g) || [text];
        return parts.map(part => part.trim()).filter(Boolean);
    }

    function updateSpeakUI() {
        chatStopSpeech.hidden = !speaking;
        chatWindow.querySelectorAll(".listen-btn").forEach(button => {
            button.textContent = speaking && button === activeListenButton ? "⏹ Stop" : LISTEN_LABEL;
        });
    }

    function stopSpeaking() {
        speakToken += 1;
        speaking = false;
        if (synth) synth.cancel();
        updateSpeakUI();
    }

    function speak(text, language, button) {
        if (!synth || typeof SpeechSynthesisUtterance === "undefined") {
            showVoiceStatus("Spoken replies are not supported in this browser. The text reply is shown above.", "warn");
            return;
        }

        stopSpeaking();
        loadVoices();
        const clean = cleanForSpeech(text);
        if (!clean) return;

        const voice = pickVoice(language);

        if (!voice && language !== "en") {
            showVoiceStatus("No " + LANG_NAMES[language] + " voice is installed on this device, so I can't read this reply aloud. The text is shown above.", "warn");
            return;
        }

        if (voice && language === "ceb" && !normalizeCode(voice.lang).startsWith("ceb")) {
            showVoiceStatus("Reading Bisaya with a Filipino voice, so some pronunciation may be approximate.", "info");
        }

        const chunks = splitForSpeech(clean);
        const token = ++speakToken;
        let index = 0;
        activeListenButton = button || null;
        speaking = true;
        updateSpeakUI();

        function next() {
            if (token !== speakToken) return;
            if (index >= chunks.length) {
                speaking = false;
                updateSpeakUI();
                return;
            }
            const utterance = new SpeechSynthesisUtterance(chunks[index++]);
            if (voice) {
                utterance.voice = voice;
                utterance.lang = voice.lang;
            } else {
                utterance.lang = "en-US";
            }
            utterance.rate = 0.95;
            utterance.onend = next;
            utterance.onerror = () => {
                if (token === speakToken) {
                    speaking = false;
                    updateSpeakUI();
                }
            };
            synth.speak(utterance);
        }
        next();
    }

    chatStopSpeech.addEventListener("click", stopSpeaking);

    chatSpeakToggle.addEventListener("click", () => {
        speakEnabled = !speakEnabled;
        if (!speakEnabled) stopSpeaking();
        saveVoicePrefs();
        syncToggles();
        showVoiceStatus(speakEnabled ? "Replies will be read aloud." : "Spoken replies are off. You can still tap Listen on any reply.", "info");
    });

    chatAutoLang.addEventListener("click", () => {
        autoLangEnabled = !autoLangEnabled;
        saveVoicePrefs();
        syncToggles();
        showVoiceStatus(autoLangEnabled ? "Auto language is on: I reply in the language you use." : "Auto language is off: I use the language you selected.", "info");
    });

    // ----- Voice input (SpeechRecognition) -----
    function setListening(on) {
        listening = on;
        chatMic.classList.toggle("is-listening", on);
        chatMic.setAttribute("aria-pressed", String(on));
        chatMic.setAttribute("aria-label", on ? "Stop listening" : "Speak your question");
        chatMic.title = on ? "Stop listening" : "Speak your question";
    }

    // abort = true throws the audio away (used when closing the chat or changing language)
    function stopListening(abort) {
        if (!recognition) return;
        const current = recognition;
        current.userStopped = true;
        current.discard = !!abort;
        try { abort ? current.abort() : current.stop(); } catch (error) { /* already stopped */ }
        if (abort) {
            recognition = null;
            setListening(false);
            showVoiceStatus("");
        }
    }

    function voiceErrorMessage(code) {
        const messages = {
            "not-allowed": "Microphone access is blocked. Allow the microphone for this site in your browser settings, then tap 🎙️ again. You can still type your question.",
            "service-not-allowed": "Voice input is not allowed here. Allow the microphone for this site in your browser settings, or type your question.",
            "audio-capture": "No microphone was found. Connect one and try again, or type your question.",
            "no-speech": "I didn't hear anything. Tap 🎙️ and try again.",
            "network": "Voice recognition needs an internet connection in this browser. You can type your question instead.",
            "language-not-supported": "This browser can't recognize " + LANG_NAMES[chatLanguage.value] + " speech. Try another language or type your question."
        };
        return messages[code] || "Voice input stopped (" + code + "). You can type your question instead.";
    }

    function startRecognition(attempt) {
        const language = chatLanguage.value;
        const codes = VOICE_LANGS[language].recog;
        const rec = new SpeechRecognitionClass();
        let transcript = "";
        let errorCode = "";
        let retryNext = false;

        rec.lang = codes[attempt];
        rec.interimResults = true;
        rec.continuous = false;
        rec.maxAlternatives = 1;
        rec.userStopped = false;
        rec.discard = false;

        rec.onstart = () => {
            setListening(true);
            showVoiceStatus("Listening in " + LANG_NAMES[language] + "… speak now.", "listening");
        };

        rec.onresult = event => {
            let text = "";
            for (let i = 0; i < event.results.length; i++) text += event.results[i][0].transcript;
            transcript = text.trim();
            chatInput.value = transcript; // shows what was heard, live
        };

        rec.onerror = event => {
            errorCode = event.error || "unknown";
            if (errorCode === "aborted") return;
            if (errorCode === "language-not-supported" && attempt + 1 < codes.length) retryNext = true;
        };

        rec.onend = () => {
            if (recognition === rec) recognition = null;
            setListening(false);
            if (rec.discard) return;

            if (retryNext) {
                showVoiceStatus("Trying a similar language for speech recognition…", "info");
                startRecognition(attempt + 1);
                return;
            }

            if (errorCode && errorCode !== "aborted") {
                showVoiceStatus(voiceErrorMessage(errorCode), "warn");
                return;
            }

            if (transcript) {
                showVoiceStatus("");
                chatInput.value = "";
                sendQuestion(transcript, { source: "voice" });
            } else if (!rec.userStopped) {
                showVoiceStatus(voiceErrorMessage("no-speech"), "warn");
            } else {
                showVoiceStatus("");
            }
        };

        try {
            recognition = rec;
            rec.start();
        } catch (error) {
            recognition = null;
            setListening(false);
            showVoiceStatus("Voice input could not start. Please try again or type your question.", "warn");
        }
    }

    function startListening() {
        if (!SpeechRecognitionClass) {
            showVoiceStatus("Voice input isn't supported in this browser. Try Chrome, Edge, or Safari, or type your question below.", "warn");
            return;
        }
        if (listening) {
            stopListening(false); // stop and use what was heard so far
            return;
        }
        stopSpeaking(); // so the microphone does not pick up the reply
        startRecognition(0);
    }

    chatMic.addEventListener("click", startListening);
    chatStopListen.addEventListener("click", () => stopListening(false));
    chatLanguage.addEventListener("change", () => stopListening(true));

    if (!SpeechRecognitionClass) {
        chatMic.title = "Voice input isn't supported in this browser";
        chatMic.classList.add("is-unsupported");
    }

    // ----- Sending a question (typed, suggested, or spoken) -----
    function sendQuestion(question, options) {
        const opts = options || {};
        const cleanQuestion = question.trim();
        if (!cleanQuestion) return;
        stopSpeaking();
        // Suggestion buttons keep the selected language; typed and spoken questions can switch it
        if (!opts.keepLanguage) applyDetectedLanguage(cleanQuestion, opts.source === "voice" ? 1 : 2);
        addMessage(cleanQuestion, "user");
        if (chatSuggestions) chatSuggestions.remove();
        const typing = document.createElement("div");
        typing.className = "chat-typing";
        typing.textContent = "PAWFUR is typing…";
        chatMessages.appendChild(typing);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        window.setTimeout(() => {
            typing.remove();
            const language = chatLanguage.value;
            const reply = getBotResponse(cleanQuestion, language);
            const replyElement = addMessage(reply, "bot", language);
            if (speakEnabled) speak(reply, language, replyElement.querySelector(".listen-btn"));
        }, 420);
    }
    chatForm.addEventListener("submit", event => {
        event.preventDefault();
        const question = chatInput.value;
        if (!question.trim()) return;
        stopListening(true);
        sendQuestion(question);
        chatInput.value = "";
        chatInput.focus();
    });
    chatSuggestions.addEventListener("click", event => {
        const button = event.target.closest("button[data-question]");
        if (button) sendQuestion(button.dataset.question, { keepLanguage: true });
    });
}
