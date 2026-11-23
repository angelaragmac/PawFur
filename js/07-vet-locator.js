// =====================================
// FILE: js/07-vet-locator.js
// VETERINARY CLINIC LOCATOR: OpenStreetMap map, clinic search, clinic cards, details window
// Used by: vet-locator.html
// Flow: type a place -> searchClinics() (js/03c-osm-search.js) -> cards + map pins
//       -> "Book at This Clinic" opens booking.html?clinic=<id>
// Key functions: initVetMap(), showClinicsOnMap(), renderClinicResults(), openClinicDetails()
// =====================================

const vetSearchForm = document.getElementById("vetSearchForm");
const clinicResults = document.getElementById("clinicResults");

// A repeated search for the same place within 30 minutes reuses the saved answer
// (keeps the free OpenStreetMap servers happy)
const CLINIC_CACHE_MS = 30 * 60 * 1000;

// Where the map looks before any search (the Philippines)
const DEFAULT_MAP_VIEW = { lat: 12.8797, lon: 121.774, zoom: 5 };

let vetMap = null;          // the Leaflet map (null if the map library could not load)
let vetMapLayer = null;     // holds the pins, so they can be cleared on a new search
let clinicMarkers = {};     // clinic id -> pin

// =====================================
// MAP (Leaflet + OpenStreetMap tiles)
// =====================================

function initVetMap() {
    const box = document.getElementById("vetMap");

    if (!box) {
        return;
    }

    if (!window.L) {
        box.appendChild(makeEl("p", "map-fallback",
            "The map could not load. Check your internet connection and refresh the page. " +
            "The clinic list below still works."));
        return;
    }

    vetMap = window.L.map(box, { scrollWheelZoom: false })
        .setView([DEFAULT_MAP_VIEW.lat, DEFAULT_MAP_VIEW.lon], DEFAULT_MAP_VIEW.zoom);

    window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(vetMap);

    vetMapLayer = window.L.layerGroup().addTo(vetMap);
}

// Pin popup content is built with textContent (OpenStreetMap text is never trusted as HTML)
function clinicPopup(clinic) {
    const popup = makeEl("div", "map-popup");

    popup.appendChild(makeEl("strong", "", clinic.name));
    popup.appendChild(makeEl("p", "", clinic.address || "Address not available"));

    if (clinic.phone) {
        popup.appendChild(makeEl("p", "", "📞 " + clinic.phone));
    }

    return popup;
}

function showClinicsOnMap(search) {
    if (!vetMap) {
        return;
    }

    const L = window.L;
    const points = [];

    vetMapLayer.clearLayers();
    clinicMarkers = {};

    if (search.center) {
        L.circleMarker([search.center.lat, search.center.lon], {
            radius: 8, color: "#142B4A", weight: 2, fillColor: "#FFC857", fillOpacity: 1
        }).bindTooltip("Searched area").addTo(vetMapLayer);

        points.push([search.center.lat, search.center.lon]);
    }

    search.clinics.forEach(function(clinic, index) {
        if (clinic.lat === null || clinic.lon === null) {
            return;
        }

        const pin = L.divIcon({
            className: "map-pin-wrap",
            html: '<span class="map-pin">' + (index + 1) + "</span>",
            iconSize: [30, 30],
            iconAnchor: [15, 15],
            popupAnchor: [0, -14]
        });

        const marker = L.marker([clinic.lat, clinic.lon], { icon: pin, title: clinic.name });
        marker.bindPopup(clinicPopup(clinic));
        marker.addTo(vetMapLayer);

        clinicMarkers[clinic.id] = marker;
        points.push([clinic.lat, clinic.lon]);
    });

    const animate = !prefersReducedMotion();

    if (points.length > 1) {
        vetMap.fitBounds(points, { padding: [40, 40], maxZoom: 15, animate: animate });
    } else if (points.length === 1) {
        vetMap.setView(points[0], 14, { animate: animate });
    } else {
        vetMap.setView([DEFAULT_MAP_VIEW.lat, DEFAULT_MAP_VIEW.lon], DEFAULT_MAP_VIEW.zoom, { animate: animate });
    }
}

function focusClinicOnMap(clinic) {
    const marker = clinicMarkers[clinic.id];
    const section = document.getElementById("mapSection");

    if (!vetMap || !marker) {
        return;
    }

    if (section) {
        section.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
    }

    vetMap.setView(marker.getLatLng(), 16, { animate: !prefersReducedMotion() });
    marker.openPopup();
}

// The two "open in a bigger map" buttons under the map
function updateMapLinks(place, center) {
    const osmLink = document.getElementById("osmMapLink");
    const googleLink = document.getElementById("googleMapsLink");

    if (osmLink) {
        osmLink.href = center
            ? "https://www.openstreetmap.org/?mlat=" + center.lat.toFixed(5) + "&mlon=" + center.lon.toFixed(5) +
                "#map=14/" + center.lat.toFixed(5) + "/" + center.lon.toFixed(5)
            : "https://www.openstreetmap.org/search?query=" + encodeURIComponent("veterinary near " + place);
    }

    if (googleLink) {
        googleLink.href = "https://www.google.com/maps/search/" + encodeURIComponent("veterinary clinics near " + place);
    }
}

// =====================================
// CLINIC CARDS
// "Book at This Clinic" opens the EXISTING booking page: booking.html?clinic=<id>.
// =====================================

// value can be text or an element (for links); mutedText shows when there is no value
function clinicInfoRow(label, value, mutedText) {
    const row = makeEl("p", "clinic-row");
    row.appendChild(makeEl("strong", "", label + ": "));

    if (value && typeof value === "object") {
        row.appendChild(value);
    } else {
        row.appendChild(makeEl("span", value ? "" : "clinic-muted", value || mutedText));
    }

    return row;
}

function clinicServiceChips(clinic) {
    const chips = makeEl("div", "clinic-chips");

    (clinic.services || []).forEach(function(service) {
        chips.appendChild(makeEl("span", "clinic-chip", service));
    });

    if (clinic.emergency) {
        chips.appendChild(makeEl("span", "clinic-chip clinic-chip-emergency", "Emergency care"));
    }

    return chips;
}

function clinicPhoto(clinic) {
    const box = makeEl("div", "clinic-photo");

    if (clinic.image) {
        const img = document.createElement("img");
        img.src = clinic.image;
        img.alt = clinic.name;
        img.loading = "lazy";
        box.appendChild(img);
    } else {
        box.appendChild(makeEl("span", "", "🏥"));
        box.setAttribute("aria-hidden", "true");
    }

    return box;
}

// Real clinics (OpenStreetMap) get a tap-to-call link. Generated numbers stay plain text
// so nobody dials one by accident.
function clinicPhoneValue(clinic) {
    if (!clinic.phone) {
        return null;
    }

    if (clinic.source === "osm") {
        const digits = clinic.phone.split(/[;,\/]/)[0].replace(/[^\d+]/g, "");

        if (digits.length >= 5) {
            const link = makeEl("a", "clinic-link", clinic.phone);
            link.href = "tel:" + digits;
            return link;
        }
    }

    return clinic.phone;
}

function clinicWebsiteLink(clinic) {
    if (!clinic.website) {
        return null;
    }

    try {
        const link = makeEl("a", "clinic-link", new URL(clinic.website).hostname.replace(/^www\./, ""));
        link.href = clinic.website;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        return link;
    } catch (error) {
        return null;
    }
}

function clinicDistanceText(clinic) {
    return clinic.distanceKm === null ? null : clinic.distanceKm.toFixed(1) + " km away";
}

// "Data from OpenStreetMap" credit (required by the OpenStreetMap license)
function clinicSourceNote() {
    const note = makeEl("p", "clinic-source-note");
    const link = makeEl("a", "clinic-link", "OpenStreetMap contributors");

    link.href = "https://www.openstreetmap.org/copyright";
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    note.appendChild(document.createTextNode("Clinic data © "));
    note.appendChild(link);
    note.appendChild(document.createTextNode(". Phone numbers and hours appear only where volunteers have added them."));
    return note;
}

function emptyClinicMessage(search) {
    if (search.problem === "place-not-found") {
        return "We couldn't find that place. Try a nearby city, or add the province (for example: Koronadal City, South Cotabato).";
    }

    if (search.problem === "unreachable") {
        return "We couldn't reach OpenStreetMap right now. Check your internet connection and try again.";
    }

    return "No veterinary clinics are mapped within 25 km of that place on OpenStreetMap yet. Try a bigger nearby city.";
}

// search = { place, center, source, clinics, problem }
function renderClinicResults(search, shouldScroll) {
    if (!clinicResults) {
        return;
    }

    clinicResults.hidden = false;
    clinicResults.textContent = "";

    const heading = makeEl("div", "clinic-results-head");
    heading.appendChild(makeEl("h2", "", "🏥 Veterinary Clinics"));
    heading.appendChild(makeEl("p", "", search.clinics.length > 0
        ? "Showing " + search.clinics.length + " clinics near " + search.place + ", nearest first"
        : "Search: " + search.place));
    clinicResults.appendChild(heading);

    updateMapLinks(search.place, search.center);
    showClinicsOnMap(search);

    if (search.clinics.length === 0) {
        clinicResults.appendChild(makeEl("div", "empty-state", emptyClinicMessage(search)));
        return;
    }

    if (search.source === "osm") {
        clinicResults.appendChild(clinicSourceNote());
    }

    const grid = makeEl("div", "clinic-grid");

    search.clinics.forEach(function(clinic, index) {
        const card = makeEl("article", "clinic-card");

        card.appendChild(clinicPhoto(clinic));

        const body = makeEl("div", "clinic-body");
        const titleRow = makeEl("div", "clinic-title-row");
        const number = makeEl("span", "clinic-number", String(index + 1));
        number.setAttribute("aria-hidden", "true");
        titleRow.appendChild(number);
        titleRow.appendChild(makeEl("h3", "", clinic.name));
        body.appendChild(titleRow);

        body.appendChild(makeEl("p", "clinic-address", "📍 " + (clinic.address || "Address not available")));
        body.appendChild(makeEl("p", "clinic-desc", clinic.description || ""));

        if (clinic.services.length > 0 || clinic.emergency) {
            body.appendChild(clinicServiceChips(clinic));
        }

        body.appendChild(clinicInfoRow("Contact", clinicPhoneValue(clinic), "Not listed"));
        body.appendChild(clinicInfoRow("Hours", clinic.hours, "Not listed"));
        body.appendChild(clinicInfoRow("Distance", clinicDistanceText(clinic), "Not available"));

        const actions = makeEl("div", "clinic-actions");
        const details = makeEl("button", "ghost-button clinic-btn", "View Details");
        details.type = "button";
        details.addEventListener("click", function() { openClinicDetails(clinic, details); });
        actions.appendChild(details);

        if (vetMap && clinicMarkers[clinic.id]) {
            const onMap = makeEl("button", "ghost-button clinic-btn", "📍 Show on map");
            onMap.type = "button";
            onMap.addEventListener("click", function() { focusClinicOnMap(clinic); });
            actions.appendChild(onMap);
        }

        const book = makeEl("a", "main-button clinic-btn", "Book at This Clinic");
        book.href = "booking.html?clinic=" + encodeURIComponent(clinic.id);
        actions.appendChild(book);

        body.appendChild(actions);
        card.appendChild(body);
        grid.appendChild(card);
    });

    clinicResults.appendChild(grid);

    if (shouldScroll) {
        clinicResults.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
    }
}

// ----- Details modal -----
function openClinicDetails(clinic, opener) {
    const backdrop = makeEl("div", "pf-modal-backdrop");
    const dialog = makeEl("div", "pf-modal");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "clinicModalTitle");

    const title = makeEl("h2", "", clinic.name);
    title.id = "clinicModalTitle";
    dialog.appendChild(title);

    dialog.appendChild(clinicPhoto(clinic));
    dialog.appendChild(clinicInfoRow("Address", clinic.address, "Not available"));
    dialog.appendChild(makeEl("p", "clinic-desc", clinic.description || ""));

    if (clinic.services.length > 0 || clinic.emergency) {
        dialog.appendChild(makeEl("p", "clinic-row", "Services offered:"));
        dialog.appendChild(clinicServiceChips(clinic));
    } else {
        dialog.appendChild(clinicInfoRow("Services", null, "Not listed. Please ask the clinic."));
    }

    dialog.appendChild(clinicInfoRow("Contact", clinicPhoneValue(clinic), "Not listed"));

    if (clinic.email) {
        dialog.appendChild(clinicInfoRow("Email", clinic.email, ""));
    }

    if (clinicWebsiteLink(clinic)) {
        dialog.appendChild(clinicInfoRow("Website", clinicWebsiteLink(clinic), ""));
    }

    if (clinic.vet) {
        dialog.appendChild(clinicInfoRow("Veterinarian", clinic.vet, ""));
    }

    if (clinic.animals.length > 0) {
        dialog.appendChild(clinicInfoRow("Animals treated", clinic.animals.join(", "), ""));
    }

    dialog.appendChild(clinicInfoRow("Operating hours", clinic.hours, "Not listed"));
    dialog.appendChild(clinicInfoRow("Distance", clinicDistanceText(clinic), "Not available"));

    if (clinic.source === "osm") {
        dialog.appendChild(clinicSourceNote());
    }

    dialog.appendChild(makeEl("p", "clinic-sample-note",
        "Availability is not shown. Appointment requests are not confirmed until you contact the clinic."));

    const actions = makeEl("div", "modal-actions");
    const close = makeEl("button", "ghost-button", "Close");
    close.type = "button";
    const book = makeEl("a", "main-button", "Book at This Clinic");
    book.href = "booking.html?clinic=" + encodeURIComponent(clinic.id);
    actions.appendChild(close);
    actions.appendChild(book);
    dialog.appendChild(actions);

    backdrop.appendChild(dialog);
    document.body.appendChild(backdrop);
    document.body.classList.add("modal-open");
    close.focus();

    function closeModal() {
        document.removeEventListener("keydown", onKey);
        backdrop.remove();
        document.body.classList.remove("modal-open");

        if (opener) {
            opener.focus();
        }
    }

    function onKey(event) {
        if (event.key === "Escape") {
            closeModal();
        }
    }

    close.addEventListener("click", closeModal);
    backdrop.addEventListener("click", function(event) {
        if (event.target === backdrop) {
            closeModal();
        }
    });
    document.addEventListener("keydown", onKey);
}

// =====================================
// SEARCH FORM
// =====================================

initVetMap();

if (vetSearchForm) {
    const locationInput = document.getElementById("locationInput");
    const submitButton = vetSearchForm.querySelector('button[type="submit"]');
    let searching = false;

    vetSearchForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const place = locationInput.value.trim().replace(/\s+/g, " ").slice(0, 80);

        if (!place || searching) {
            return;
        }

        searching = true;
        const buttonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = "Searching…";

        clinicResults.hidden = false;
        clinicResults.textContent = "";
        clinicResults.appendChild(makeEl("p", "clinic-searching", "🔎 Looking for veterinary clinics near " + place + "…"));

        let search;

        try {
            const saved = getSavedClinicSearch();
            const fresh = saved &&
                saved.mode === CLINIC_SOURCE &&
                saved.place.toLowerCase() === place.toLowerCase() &&
                Date.now() - saved.savedAt < CLINIC_CACHE_MS;

            if (fresh) {
                search = saved;
            } else {
                search = await searchClinics(place);
                saveClinicSearch(search);
            }
        } catch (error) {
            // searchClinics() does not normally fail, but the page must never be left empty
            search = { place: place, center: null, source: "generated", clinics: [], problem: "unreachable" };
        }

        renderClinicResults(search, true);

        searching = false;
        submitButton.disabled = false;
        submitButton.textContent = buttonText;
    });

    // Coming back from the Booking page: show the last search again
    const lastSearch = getSavedClinicSearch();

    if (lastSearch && lastSearch.mode === CLINIC_SOURCE && lastSearch.clinics.length > 0) {
        locationInput.value = lastSearch.place;
        renderClinicResults(lastSearch, false);
    }
}
