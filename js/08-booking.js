// =====================================
// FILE: js/08-booking.js
// APPOINTMENT BOOKING: form validation, 'Other' animal field, saves the request
// Used by: booking.html
// =====================================

// =====================================
// APPOINTMENT BOOKING
// =====================================

const bookingForm = document.getElementById("bookingForm");

if (bookingForm) {
    const dateInput = document.getElementById("appointmentDate");
    const animalType = document.getElementById("animalType");
    const otherAnimalGroup = document.getElementById("otherAnimalGroup");
    const otherAnimalInput = document.getElementById("otherAnimal");
    const bookingSuccess = document.getElementById("bookingSuccess");

    // Prevent selecting a past date
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const todayString = year + "-" + month + "-" + day;

    dateInput.min = todayString;

    // Reveal a text field when "Others" is selected.
    function updateOtherAnimalField() {
        const isOther = animalType.value === "Other";
        otherAnimalGroup.hidden = !isOther;
        otherAnimalInput.required = isOther;

        if (!isOther) {
            otherAnimalInput.value = "";
        }
    }

    animalType.addEventListener("change", updateOtherAnimalField);
    updateOtherAnimalField();

    bookingForm.addEventListener("submit", function(event) {
        event.preventDefault();

        // The session may have ended (for example, logged out in another tab).
        if (!isUserLoggedIn()) {
            window.location.replace("login.html?redirect=booking.html");
            return;
        }

        const selectedAnimal = animalType.value;
        const otherAnimal = otherAnimalInput.value.trim();

        if (selectedAnimal === "Other" && !otherAnimal) {
            otherAnimalInput.focus();
            otherAnimalInput.reportValidity();
            return;
        }

        // Link the request to the logged-in demo user (shown on their dashboard)
        const account = getCurrentAccount();
        const planRecord = account ? getPlanRecord(account.email) : { active: null };
        const isPriority = !!(planRecord.active && planRecord.active.planId === "deluxe");

        const appointment = {
            id: makeId("appt"),
            userEmail: account ? account.email : "",
            createdAt: new Date().toISOString(),
            status: "Request submitted",
            priority: isPriority,
            owner: document.getElementById("ownerName").value.trim(),
            pet: document.getElementById("petName").value.trim(),
            animal: selectedAnimal === "Other" ? "Other" : selectedAnimal,
            animalDetails: selectedAnimal === "Other" ? otherAnimal : "",
            service: document.getElementById("serviceType").value,
            date: document.getElementById("appointmentDate").value,
            time: document.getElementById("appointmentTime").value,
            contact: document.getElementById("contactNumber").value.trim()
        };

        // Existing saved requests are kept; the new one is added to the list
        const bookings = readStored(STORAGE_KEYS.bookings, "array");
        bookings.push(appointment);
        writeStored(STORAGE_KEYS.bookings, bookings);

        const priorityNote = document.getElementById("bookingPriorityNote");

        if (priorityNote) {
            priorityNote.hidden = !isPriority;
        }

        // Show a clear confirmation and a direct path to the Vet Locator.
        bookingSuccess.hidden = false;
        bookingSuccess.scrollIntoView({ behavior: "smooth", block: "nearest" });

        bookingForm.reset();
        dateInput.min = todayString;
        updateOtherAnimalField();
    });
}
