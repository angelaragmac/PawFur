// =====================================
// FILE: js/03b-clinics-data.js
// CLINIC DATA: clinic records used by the Vet Locator cards and the Booking page
// Used by: vet-locator.html, booking.html (also dashboard/notifications read saved copies)
// Contains: CLINICS, getClinicById(), clinicSummaryLine()
// =====================================

// ---------------------------------------------------------------
// IMPORTANT: these are SAMPLE records for development only.
// They are NOT real businesses. Names, addresses, phone numbers, hours and
// distances are intentionally left empty/neutral so nothing is invented.
//
// TO USE REAL CLINICS: replace the objects below with verified records
// (or load them from a real directory/API). Keep the same field names:
//   id         unique, URL-safe text (used in booking.html?clinic=<id>)
//   name       clinic name
//   image      path/URL of a clinic photo, or null
//   address    full address, or null
//   description short text
//   services   list; use names from the Booking page: Vaccination, Health Checkup,
//              Grooming, Pet Treatment
//   phone      contact number, or null
//   hours      operating hours text, or null
//   sample     true for placeholder records (shows a "Sample listing" badge)
// ---------------------------------------------------------------
const CLINICS = [
    {
        id: "sample-clinic-a",
        name: "Sample Veterinary Clinic A",
        image: null,
        address: "Sample address (placeholder, not a real location)",
        description: "Sample record used during development to show how a general veterinary clinic listing looks.",
        services: ["Vaccination", "Health Checkup", "Pet Treatment"],
        phone: null,
        hours: null,
        sample: true
    },
    {
        id: "sample-clinic-b",
        name: "Sample Veterinary Clinic B",
        image: null,
        address: "Sample address (placeholder, not a real location)",
        description: "Sample record used during development to show a clinic that also offers grooming.",
        services: ["Vaccination", "Health Checkup", "Grooming"],
        phone: null,
        hours: null,
        sample: true
    },
    {
        id: "sample-clinic-c",
        name: "Sample Animal Care Center C",
        image: null,
        address: "Sample address (placeholder, not a real location)",
        description: "Sample record used during development to show a clinic offering the full list of services.",
        services: ["Vaccination", "Health Checkup", "Grooming", "Pet Treatment"],
        phone: null,
        hours: null,
        sample: true
    }
];

function getClinicById(id) {
    if (typeof id !== "string" || !id) {
        return null;
    }

    return CLINICS.find(function(clinic) { return clinic.id === id; }) || null;
}
