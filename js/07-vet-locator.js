// =====================================
// FILE: js/07-vet-locator.js
// VETERINARY CLINIC LOCATOR: search form that updates the Google Maps embed
// Used by: vet-locator.html
// =====================================

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

        // Show the clinic cards for this search (cards sit above the map)
        renderClinicResults(location);
    });
}

// =====================================
// CLINIC CARDS
// Cards come from CLINICS (js/03b-clinics-data.js). "Book at This Clinic" opens the
// EXISTING booking page: booking.html?clinic=<id>. No booking form is created here.
// =====================================

const clinicResults = document.getElementById("clinicResults");

function clinicInfoRow(label, value, mutedText) {
    const row = makeEl("p", "clinic-row");
    row.appendChild(makeEl("strong", "", label + ": "));
    row.appendChild(makeEl("span", value ? "" : "clinic-muted", value || mutedText));
    return row;
}

function clinicServiceChips(clinic) {
    const chips = makeEl("div", "clinic-chips");

    (clinic.services || []).forEach(function(service) {
        chips.appendChild(makeEl("span", "clinic-chip", service));
    });

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

function renderClinicResults(location) {
    if (!clinicResults) {
        return;
    }

    clinicResults.hidden = false;
    clinicResults.textContent = "";

    const heading = makeEl("div", "clinic-results-head");
    heading.appendChild(makeEl("h2", "", "🏥 Veterinary Clinics"));
    heading.appendChild(makeEl("p", "", "Search: " + location));
    clinicResults.appendChild(heading);

    if (CLINICS.some(function(clinic) { return clinic.sample; })) {
        clinicResults.appendChild(makeEl("p", "clinic-sample-note",
            "These are sample clinic records for development, not real businesses. " +
            "Use the Google Maps results below to find real clinics near you."));
    }

    if (CLINICS.length === 0) {
        clinicResults.appendChild(makeEl("div", "empty-state", "No clinic listings are available yet. Please use the map below."));
        return;
    }

    const grid = makeEl("div", "clinic-grid");

    CLINICS.forEach(function(clinic) {
        const card = makeEl("article", "clinic-card");

        card.appendChild(clinicPhoto(clinic));

        const body = makeEl("div", "clinic-body");
        const titleRow = makeEl("div", "clinic-title-row");
        titleRow.appendChild(makeEl("h3", "", clinic.name));

        if (clinic.sample) {
            titleRow.appendChild(makeEl("span", "clinic-sample-badge", "Sample listing"));
        }

        body.appendChild(titleRow);
        body.appendChild(makeEl("p", "clinic-address", "📍 " + (clinic.address || "Address not available")));
        body.appendChild(makeEl("p", "clinic-desc", clinic.description || ""));
        body.appendChild(clinicServiceChips(clinic));
        body.appendChild(clinicInfoRow("Contact", clinic.phone, "Not available"));
        body.appendChild(clinicInfoRow("Hours", clinic.hours, "Not available"));
        body.appendChild(clinicInfoRow("Distance", null, "Not available for sample listings"));

        const actions = makeEl("div", "clinic-actions");
        const details = makeEl("button", "ghost-button clinic-btn", "View Details");
        details.type = "button";
        details.addEventListener("click", function() { openClinicDetails(clinic, details); });

        const book = makeEl("a", "main-button clinic-btn", "Book at This Clinic");
        book.href = "booking.html?clinic=" + encodeURIComponent(clinic.id);

        actions.appendChild(details);
        actions.appendChild(book);
        body.appendChild(actions);
        card.appendChild(body);
        grid.appendChild(card);
    });

    clinicResults.appendChild(grid);
    clinicResults.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
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

    if (clinic.sample) {
        dialog.appendChild(makeEl("span", "clinic-sample-badge", "Sample listing"));
    }

    dialog.appendChild(clinicPhoto(clinic));
    dialog.appendChild(clinicInfoRow("Address", clinic.address, "Not available"));
    dialog.appendChild(makeEl("p", "clinic-desc", clinic.description || ""));
    dialog.appendChild(makeEl("p", "clinic-row", "Services offered:"));
    dialog.appendChild(clinicServiceChips(clinic));
    dialog.appendChild(clinicInfoRow("Contact", clinic.phone, "Not available"));
    dialog.appendChild(clinicInfoRow("Operating hours", clinic.hours, "Not available"));
    dialog.appendChild(clinicInfoRow("Distance", null, "Not available for sample listings"));
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
