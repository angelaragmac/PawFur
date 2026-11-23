// =====================================
// FILE: js/03c-osm-search.js
// OPENSTREETMAP SEARCH: finds real veterinary clinics near a typed place. Free, no API key.
// Used by: vet-locator.html (js/07-vet-locator.js calls searchClinics())
// Contains: searchClinics(), geocodePlace(), fetchVetsFromOverpass(), parseOverpassClinics()
//
// How it works (two free OpenStreetMap services):
//   1. Nominatim  turns the typed place ("Koronadal City") into coordinates.
//   2. Overpass   lists every map object tagged amenity=veterinary around those coordinates.
// Both are community-run, so please keep it light: one search per click, results are
// remembered for 30 minutes (see 07-vet-locator.js), and requests time out after 12 seconds.
// OpenStreetMap data is only as complete as its volunteers made it: many clinics have no
// phone number or opening hours, and small towns may have no clinics mapped at all.
// Data license: (c) OpenStreetMap contributors, ODbL (shown on the page as required).
// =====================================

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

// If the first server is busy, the second one is tried
const OVERPASS_URLS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter"
];

const OSM_SEARCH_RADIUS_METERS = [8000, 25000]; // look within 8 km first, then 25 km
const OSM_MAX_CLINICS = 12;
const OSM_TIMEOUT_MS = 12000;

// Downloads JSON, giving up after OSM_TIMEOUT_MS
async function fetchJson(url, options) {
    const controller = new AbortController();
    const timer = window.setTimeout(function() { controller.abort(); }, OSM_TIMEOUT_MS);

    try {
        const response = await fetch(url, Object.assign({}, options, { signal: controller.signal }));

        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }

        return await response.json();
    } finally {
        window.clearTimeout(timer);
    }
}

// "Koronadal City" -> { lat, lon }, or null when the place is not found
async function geocodePlace(place) {
    const url = NOMINATIM_URL + "?format=jsonv2&limit=1&accept-language=en&q=" + encodeURIComponent(place);
    const results = await fetchJson(url);

    if (!Array.isArray(results) || results.length === 0) {
        return null;
    }

    const lat = parseFloat(results[0].lat);
    const lon = parseFloat(results[0].lon);

    return isFinite(lat) && isFinite(lon) ? { lat: lat, lon: lon } : null;
}

// Overpass query: every vet (a point, or a building outline) within "radius" meters
function buildOverpassQuery(lat, lon, radius) {
    const around = "(around:" + Math.round(radius) + "," + lat.toFixed(5) + "," + lon.toFixed(5) + ")";

    return "[out:json][timeout:15];(" +
        'node["amenity"="veterinary"]' + around + ";" +
        'way["amenity"="veterinary"]' + around + ";" +
        ");out center tags 60;";
}

async function fetchVetsFromOverpass(lat, lon, radius) {
    const body = "data=" + encodeURIComponent(buildOverpassQuery(lat, lon, radius));
    let lastError = null;

    for (let i = 0; i < OVERPASS_URLS.length; i++) {
        try {
            const json = await fetchJson(OVERPASS_URLS[i], {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
                body: body
            });

            if (json && Array.isArray(json.elements)) {
                return json.elements;
            }

            lastError = new Error("Unexpected answer from Overpass");
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError || new Error("Overpass is not available");
}

// ---------- Turning OpenStreetMap tags into clinic records ----------
// OpenStreetMap text is typed by volunteers, so it is cleaned here and is only ever
// shown with textContent (never as HTML).

function cleanTagText(value, max) {
    return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max || 160) : "";
}

const OSM_DAY_NAMES = { Mo: "Mon", Tu: "Tue", We: "Wed", Th: "Thu", Fr: "Fri", Sa: "Sat", Su: "Sun", PH: "holidays" };

// "Mo-Sa 08:00-17:00; Su off" -> "Mon–Sat 08:00–17:00 · Sun closed"
function prettyOpeningHours(raw) {
    const text = cleanTagText(raw, 200);

    if (!text) {
        return null;
    }

    if (text === "24/7") {
        return "Open 24 hours, every day";
    }

    return text
        .replace(/\b(Mo|Tu|We|Th|Fr|Sa|Su|PH)\b/g, function(day) { return OSM_DAY_NAMES[day]; })
        .replace(/\boff\b/gi, "closed")
        .replace(/\s*;\s*/g, " · ")
        .replace(/-/g, "–");
}

// Only http(s) links are kept ("javascript:" and similar are thrown away)
function safeWebsite(value) {
    let text = cleanTagText(value, 200);

    if (!text) {
        return null;
    }

    if (!/^https?:\/\//i.test(text)) {
        text = "https://" + text;
    }

    try {
        const url = new URL(text);
        return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
    } catch (error) {
        return null;
    }
}

function osmAddress(tags) {
    const street = [cleanTagText(tags["addr:housenumber"], 20), cleanTagText(tags["addr:street"], 80)]
        .filter(Boolean).join(" ");

    const parts = [
        street,
        cleanTagText(tags["addr:suburb"] || tags["addr:neighbourhood"] || tags["addr:quarter"], 80),
        cleanTagText(tags["addr:city"] || tags["addr:municipality"] || tags["addr:town"] || tags["addr:village"], 80),
        cleanTagText(tags["addr:province"] || tags["addr:state"], 80)
    ].filter(Boolean);

    return (parts.length > 0 ? parts.join(", ") : cleanTagText(tags["addr:full"], 200)) || null;
}

// elements = the "elements" list from Overpass, center = { lat, lon }
function parseOverpassClinics(elements, center) {
    const seen = {};
    const clinics = [];

    (Array.isArray(elements) ? elements : []).forEach(function(element) {
        const tags = element && element.tags && typeof element.tags === "object" ? element.tags : {};
        const lat = typeof element.lat === "number" ? element.lat : element.center && element.center.lat;
        const lon = typeof element.lon === "number" ? element.lon : element.center && element.center.lon;
        const osmId = String(element.id || "").replace(/\D/g, "");

        if (typeof lat !== "number" || typeof lon !== "number" || !osmId) {
            return;
        }

        const id = "osm-" + String(element.type || "x").charAt(0) + osmId;

        if (seen[id]) {
            return;
        }

        seen[id] = true;

        clinics.push({
            id: id,
            name: cleanTagText(tags.name || tags["name:en"] || tags.operator || tags.brand, 120) || "Veterinary clinic",
            image: null,
            address: osmAddress(tags),
            description: cleanTagText(tags.description, 300) || "Veterinary clinic listed on OpenStreetMap.",
            services: [],       // OpenStreetMap does not list which services a clinic offers
            animals: [],
            phone: cleanTagText(tags.phone || tags["contact:phone"] || tags["contact:mobile"] || tags.mobile, 60) || null,
            email: cleanTagText(tags.email || tags["contact:email"], 120) || null,
            website: safeWebsite(tags.website || tags["contact:website"]),
            hours: prettyOpeningHours(tags.opening_hours),
            vet: null,
            emergency: tags.emergency === "yes",
            distanceKm: Math.round(distanceBetweenKm(center.lat, center.lon, lat, lon) * 10) / 10,
            lat: lat,
            lon: lon,
            source: "osm",
            sample: false
        });
    });

    clinics.sort(function(a, b) { return a.distanceKm - b.distanceKm; });
    return clinics.slice(0, OSM_MAX_CLINICS);
}

// ---------- The one function the Vet Locator calls ----------
// Always answers (never throws). Result:
//   { place, center, source: "osm" | "generated", clinics, problem }
// problem (only when there are no real clinics): "place-not-found", "unreachable", "none"
async function searchClinics(place) {
    let center = null;
    let problem = "";

    try {
        center = await geocodePlace(place);

        if (!center) {
            problem = "place-not-found";
        }
    } catch (error) {
        problem = "unreachable";
    }

    if (CLINIC_SOURCE !== "generated" && center) {
        for (let i = 0; i < OSM_SEARCH_RADIUS_METERS.length; i++) {
            try {
                const elements = await fetchVetsFromOverpass(center.lat, center.lon, OSM_SEARCH_RADIUS_METERS[i]);
                const clinics = parseOverpassClinics(elements, center);

                if (clinics.length > 0) {
                    console.info("[PAWFUR] Clinic source for \"" + place + "\": OpenStreetMap (" + clinics.length + " found)");
                    return { place: place, center: center, source: "osm", clinics: clinics, problem: "" };
                }

                problem = "none";
            } catch (error) {
                problem = "unreachable";
                break; // the service is down: a wider search would fail too
            }
        }
    }

    console.info("[PAWFUR] Clinic source for \"" + place + "\": " +
        (CLINIC_SOURCE === "osm" ? "OpenStreetMap only (nothing found: " + problem + ")"
            : CLINIC_SOURCE === "generated" ? "generated clinics"
                : "generated clinics (OpenStreetMap: " + (problem || "not used") + ")"));

    if (CLINIC_SOURCE === "osm") {
        return { place: place, center: center, source: "osm", clinics: [], problem: problem || "none" };
    }

    return { place: place, center: center, source: "generated", clinics: generateClinics(place, center), problem: problem };
}
