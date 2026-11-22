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
    });
}
