// =====================================
// FILE: js/03-plans-data.js
// CARE PLAN DATA: Basic/Deluxe prices + benefits (EDIT PRICES HERE)
// Used by: services, checkout, booking, dashboard
// Contains: PLANS, PLAN_COMPARISON, getPlanRecord(), savePlanRecord()
// =====================================

// ---------- Demo care plans ----------
// EDIT THE PRICES HERE: every page reads them from this one place.
// These are illustrative academic-demo packages, not real veterinary services.
const PLANS = {
    basic: {
        id: "basic",
        name: "Basic Plan",
        tagline: "Essential Care",
        price: 149,
        benefits: [
            "Access to basic pet-care information",
            "Appointment request feature",
            "Veterinary clinic locator",
            "Access to the PAWFUR chatbot",
            "Basic pet profile"
        ],
        limits: [
            "Standard appointment request display",
            "Basic pet profile only (name and animal type)",
            "No pet-care tracking tools"
        ]
    },
    deluxe: {
        id: "deluxe",
        name: "Deluxe Plan",
        tagline: "Complete Care",
        price: 349,
        benefits: [
            "Everything in the Basic Plan",
            "Priority appointment request display",
            "Expanded pet-care resources",
            "More detailed pet profiles",
            "Additional pet-care tracking features"
        ],
        limits: [
            "Priority display is a demo label; clinics still confirm every schedule",
            "Illustrative price and sample features only"
        ]
    }
};

// Rows of the comparison table on the Services page
const PLAN_COMPARISON = [
    { feature: "Basic pet-care information", basic: true, deluxe: true },
    { feature: "Appointment request feature", basic: true, deluxe: true },
    { feature: "Veterinary clinic locator", basic: true, deluxe: true },
    { feature: "PAWFUR chatbot", basic: true, deluxe: true },
    { feature: "Basic pet profile", basic: true, deluxe: true },
    { feature: "Priority appointment request display", basic: false, deluxe: true },
    { feature: "Expanded pet-care resources", basic: false, deluxe: true },
    { feature: "More detailed pet profiles", basic: false, deluxe: true },
    { feature: "Additional pet-care tracking", basic: false, deluxe: true }
];

// Plan data for one user: { active: {...} | null, pending: {...} | null }
function getPlanRecord(email) {
    const all = readStored(STORAGE_KEYS.plans, "object");
    const record = all[email] && typeof all[email] === "object" ? all[email] : {};

    function clean(entry) {
        return entry && PLANS[entry.planId] ? entry : null;
    }

    return { active: clean(record.active), pending: clean(record.pending) };
}

function savePlanRecord(email, record) {
    const all = readStored(STORAGE_KEYS.plans, "object");
    all[email] = record;
    return writeStored(STORAGE_KEYS.plans, all);
}
