// =====================================
// FILE: js/03b-clinics-data.js
// CLINIC DATA: where the clinic list comes from + the shared lookup used by other pages
// Used by: vet-locator.html (search), booking.html (clinic dropdown), dashboard.html
// Contains: CLINIC_SOURCE, DEFAULT_CLINIC_AREA, generateClinics(), distanceBetweenKm(),
//           saveClinicSearch(), getSavedClinicSearch(), getAllClinics(), getClinicById()
// =====================================

// ---------------------------------------------------------------
// WHERE DO THE CLINICS COME FROM?  (change this one word)
//   "auto"       Try real clinics from OpenStreetMap first (js/03c-osm-search.js).
//                If none are found, or there is no internet, use generated clinics.
//   "osm"        Real OpenStreetMap clinics only. Nothing is invented.
//   "generated"  Always use the generated clinics (best for a presentation: it always
//                works, every clinic has a phone, hours, email and so on).
// While searching, open the browser console (F12): it prints which source was used.
// ---------------------------------------------------------------
const CLINIC_SOURCE = "auto";

// Used by the Booking page when nobody has searched yet
const DEFAULT_CLINIC_AREA = "Koronadal City";

// ---------- Ingredients for the generated clinics (edit freely) ----------
const GENERATED_CLINIC_NAMES = [
    "Happy Tails Veterinary Clinic",
    "Pawsitive Care Animal Clinic",
    "Furry Friends Pet Hospital",
    "Whisker & Wag Vet Care",
    "Golden Paw Animal Clinic",
    "Caring Hands Veterinary Center",
    "Bark & Purr Animal Clinic",
    "Gentle Paws Pet Clinic",
    "Healthy Pets Veterinary Clinic",
    "Sunrise Animal Care Center"
];

const GENERATED_STREETS = [
    "Rizal Street", "Mabini Street", "Quezon Avenue", "Bonifacio Street",
    "Magsaysay Avenue", "Roxas Street", "Aguinaldo Road", "Luna Street"
];

const GENERATED_VET_FIRST_NAMES = ["Maria", "Jose", "Ana", "Miguel", "Carla", "Paolo", "Liza", "Rafael", "Bianca", "Daniel"];
const GENERATED_VET_LAST_NAMES = ["Santos", "Reyes", "Cruz", "Bautista", "Ramos", "Mendoza", "Garcia", "Torres", "Flores", "Navarro"];

const GENERATED_CLINIC_BLURBS = [
    "Friendly neighborhood clinic for routine checkups, vaccines and everyday pet care.",
    "Full-service veterinary clinic with on-site treatment for dogs, cats and small pets.",
    "Family-run animal clinic focused on preventive care and gentle handling.",
    "Modern clinic with a grooming corner and a quiet waiting area for nervous pets."
];

// Same names as the Booking page's service list
const CLINIC_SERVICE_NAMES = ["Vaccination", "Health Checkup", "Grooming", "Pet Treatment"];

// ---------- Small helpers ----------

// Turns text into a number. The same text always gives the same number.
function hashText(text) {
    let hash = 2166136261;

    for (let i = 0; i < text.length; i++) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }

    return hash >>> 0;
}

// A repeatable random-number generator: the same seed always gives the same numbers.
function seededRandom(seed) {
    let state = seed >>> 0;

    return function() {
        state = (state + 0x6D2B79F5) >>> 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// Straight-line distance between two coordinates, in kilometres (haversine formula)
function distanceBetweenKm(lat1, lon1, lat2, lon2) {
    const toRad = Math.PI / 180;
    const dLat = (lat2 - lat1) * toRad;
    const dLon = (lon2 - lon1) * toRad;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function clockLabel(hour) {
    return (hour % 12 || 12) + ":00 " + (hour >= 12 ? "PM" : "AM");
}

// ---------- Generated clinics ----------
// Makes 5 clinics for the place that was typed. The same place always gives the same clinics.
// "center" is { lat, lon } from the map search, or null (then the clinics have no map pin).
// All of this information is made up. Phone numbers always use the middle block "000",
// and e-mail addresses use example.com, so they cannot reach a real person or business.
function generateClinics(place, center) {
    const cleanPlace = String(place || "").trim().replace(/\s+/g, " ");
    const seed = hashText(cleanPlace.toLowerCase());
    const random = seededRandom(seed);

    // Shuffle the names (Fisher-Yates) and take the first five
    const names = GENERATED_CLINIC_NAMES.slice();

    for (let i = names.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        const swap = names[i];
        names[i] = names[j];
        names[j] = swap;
    }

    // Five distances, nearest first (0.4 km to 6.5 km)
    const distances = [];

    for (let i = 0; i < 5; i++) {
        distances.push(Math.round((0.4 + random() * 6.1) * 10) / 10);
    }

    distances.sort(function(a, b) { return a - b; });

    // At most one clinic is open 24 hours (chosen at random, not always present)
    const emergencyIndex = random() > 0.5 ? Math.floor(random() * 5) : -1;
    const phonePrefixes = ["0917", "0918", "0927", "0905", "0998"];

    return distances.map(function(distance, index) {
        const opensAt = 7 + Math.floor(random() * 3);        // opens 7, 8 or 9
        const closesAt = 16 + Math.floor(random() * 4);      // closes 4, 5, 6 or 7 PM
        const isEmergency = index === emergencyIndex;
        const sundayOpen = random() > 0.6;

        // Every clinic offers at least two services
        let services = CLINIC_SERVICE_NAMES.filter(function() { return random() > 0.35; });

        while (services.length < 2) {
            const extra = CLINIC_SERVICE_NAMES[Math.floor(random() * CLINIC_SERVICE_NAMES.length)];

            if (services.indexOf(extra) === -1) {
                services.push(extra);
            }
        }

        services = CLINIC_SERVICE_NAMES.filter(function(name) { return services.indexOf(name) !== -1; });

        const animals = ["Dogs", "Cats"];

        if (random() > 0.5) { animals.push("Rabbits"); }
        if (random() > 0.7) { animals.push("Birds"); }

        const name = names[index];
        const hours = isEmergency
            ? "Open 24 hours, every day"
            : sundayOpen
                ? "Mon–Sun, " + clockLabel(opensAt) + " – " + clockLabel(closesAt)
                : "Mon–Sat, " + clockLabel(opensAt) + " – " + clockLabel(closesAt) + " · Sunday closed";

        // Put the clinic on the map at its distance from the searched place, in a random direction
        let lat = null;
        let lon = null;

        if (center && isFinite(center.lat) && isFinite(center.lon)) {
            const bearing = random() * 2 * Math.PI;
            lat = center.lat + (distance / 111.32) * Math.cos(bearing);
            lon = center.lon + (distance / (111.32 * Math.cos(center.lat * Math.PI / 180))) * Math.sin(bearing);
            lat = Math.round(lat * 100000) / 100000;
            lon = Math.round(lon * 100000) / 100000;
        } else {
            random(); // keep the later numbers the same with or without a map
        }

        return {
            id: "gen-" + seed.toString(36) + "-" + (index + 1),
            name: name,
            image: null,
            address: (1 + Math.floor(random() * 98)) + " " +
                GENERATED_STREETS[Math.floor(random() * GENERATED_STREETS.length)] + ", " + cleanPlace,
            description: GENERATED_CLINIC_BLURBS[Math.floor(random() * GENERATED_CLINIC_BLURBS.length)],
            services: services,
            animals: animals,
            phone: phonePrefixes[Math.floor(random() * phonePrefixes.length)] + " 000 " +
                String(Math.floor(random() * 10000)).padStart(4, "0"),
            email: name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "") + "@example.com",
            website: null,
            hours: hours,
            vet: "Dr. " + GENERATED_VET_FIRST_NAMES[Math.floor(random() * GENERATED_VET_FIRST_NAMES.length)] + " " +
                GENERATED_VET_LAST_NAMES[Math.floor(random() * GENERATED_VET_LAST_NAMES.length)],
            emergency: isEmergency,
            distanceKm: distance,
            lat: lat,
            lon: lon,
            source: "generated",
            sample: false
        };
    });
}

// ---------- Remembering the last search ----------
// The Booking page needs to know the clinics that were on screen, so the last search is kept.

function textOrNull(value, max) {
    return typeof value === "string" && value.trim() ? value.trim().slice(0, max || 200) : null;
}

function numberOrNull(value) {
    return typeof value === "number" && isFinite(value) ? value : null;
}

// Never trust stored data blindly: rebuild each clinic with the expected types only
function cleanClinic(raw) {
    if (!raw || typeof raw.id !== "string" || !/^[A-Za-z0-9_-]{1,60}$/.test(raw.id) || !textOrNull(raw.name, 120)) {
        return null;
    }

    const textList = function(list) {
        return Array.isArray(list)
            ? list.filter(function(item) { return typeof item === "string"; }).map(function(item) { return item.slice(0, 60); })
            : [];
    };

    return {
        id: raw.id,
        name: textOrNull(raw.name, 120),
        image: null,
        address: textOrNull(raw.address, 200),
        description: textOrNull(raw.description, 300) || "",
        services: textList(raw.services),
        animals: textList(raw.animals),
        phone: textOrNull(raw.phone, 60),
        email: textOrNull(raw.email, 120),
        website: textOrNull(raw.website, 200),
        hours: textOrNull(raw.hours, 200),
        vet: textOrNull(raw.vet, 80),
        emergency: raw.emergency === true,
        distanceKm: numberOrNull(raw.distanceKm),
        lat: numberOrNull(raw.lat),
        lon: numberOrNull(raw.lon),
        source: raw.source === "osm" ? "osm" : "generated",
        sample: false
    };
}

// search = { place, mode, source, center, clinics, problem? }
function saveClinicSearch(search) {
    return writeStored(STORAGE_KEYS.clinicResults, {
        place: search.place,
        mode: CLINIC_SOURCE,
        source: search.source,
        problem: search.problem || "",
        center: search.center ? { lat: search.center.lat, lon: search.center.lon } : null,
        savedAt: Date.now(),
        clinics: search.clinics
    });
}

// Returns the last search (with cleaned clinics), or null
function getSavedClinicSearch() {
    const saved = readStored(STORAGE_KEYS.clinicResults, "object");

    if (typeof saved.place !== "string" || !Array.isArray(saved.clinics)) {
        return null;
    }

    const center = saved.center && numberOrNull(saved.center.lat) !== null && numberOrNull(saved.center.lon) !== null
        ? { lat: saved.center.lat, lon: saved.center.lon }
        : null;

    return {
        place: saved.place.slice(0, 80),
        mode: saved.mode,
        source: saved.source === "osm" ? "osm" : "generated",
        problem: typeof saved.problem === "string" ? saved.problem : "",
        center: center,
        savedAt: Number(saved.savedAt) || 0,
        clinics: saved.clinics.map(cleanClinic).filter(Boolean)
    };
}

// ---------- Lookup used by the Booking page ----------
// The clinics of the last search, or generated clinics for DEFAULT_CLINIC_AREA
// (OpenStreetMap-only mode never makes anything up, so it returns an empty list).
function getAllClinics() {
    const saved = getSavedClinicSearch();

    if (saved && saved.clinics.length > 0) {
        return saved.clinics;
    }

    return CLINIC_SOURCE === "osm" ? [] : generateClinics(DEFAULT_CLINIC_AREA, null);
}

function getClinicById(id) {
    if (typeof id !== "string" || !id) {
        return null;
    }

    return getAllClinics().find(function(clinic) { return clinic.id === id; }) || null;
}
