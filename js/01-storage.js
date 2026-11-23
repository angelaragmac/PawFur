// =====================================
// FILE: js/01-storage.js
// STORAGE: localStorage keys + safe read/write helpers
// Used by: every page
// Contains: STORAGE_KEYS, readStored(), writeStored(), makeId()
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
    pendingPlan: "pawfurPendingPlan",    // plan chosen by a guest before logging in
    notifications: "pawfurNotifications",// [{ userEmail, id, type, title, message, read, ... }]
    pendingClinic: "pawfurPendingClinic",// clinic id chosen by a guest before logging in (Book at This Clinic)
    clinicResults: "pawfurClinicResults" // clinics from the last Vet Locator search (so Booking can find them)
};

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
