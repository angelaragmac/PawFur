// =====================================
// FILE: js/04-utils.js
// UTILITIES: formatting (peso, date, time) and the safe DOM helper
// Used by: services, checkout, booking, dashboard
// Contains: prefersReducedMotion(), formatPeso(), formatDateOnly(), formatTime(),
//           formatTimestamp(), makeEl()
// =====================================

function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
}

function formatPeso(amount) {
    return "₱" + Number(amount).toLocaleString("en-PH");
}

// "2026-12-20" -> "Dec 20, 2026" (built from parts so time zones cannot shift the day)
function formatDateOnly(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");

    if (!match) {
        return value || "—";
    }

    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// "14:30" -> "2:30 PM"
function formatTime(value) {
    const match = /^(\d{2}):(\d{2})$/.exec(value || "");

    if (!match) {
        return value || "—";
    }

    const hours = Number(match[1]);
    return (hours % 12 || 12) + ":" + match[2] + " " + (hours >= 12 ? "PM" : "AM");
}

function formatTimestamp(iso) {
    const date = new Date(iso);

    return isNaN(date.getTime())
        ? "—"
        : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Small safe DOM helper (uses textContent, so saved text can never inject HTML)
function makeEl(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (text !== undefined) {
        element.textContent = text;
    }

    return element;
}
