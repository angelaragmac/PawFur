// =====================================
// FILE: js/08-booking.js
// APPOINTMENT BOOKING: clinic selection, validation, confirmation dialog, saves the request
// Used by: booking.html
// =====================================

// =====================================
// APPOINTMENT BOOKING
// Flow: pick/see clinic -> fill form -> confirmation dialog -> save -> success details
// The clinic comes from the Vet Locator link (booking.html?clinic=<id>) or the dropdown.
// =====================================

const bookingForm = document.getElementById("bookingForm");

if (bookingForm) {
    const dateInput = document.getElementById("appointmentDate");
    const animalType = document.getElementById("animalType");
    const otherAnimalGroup = document.getElementById("otherAnimalGroup");
    const otherAnimalInput = document.getElementById("otherAnimal");
    const bookingSuccess = document.getElementById("bookingSuccess");
    const clinicSelect = document.getElementById("clinicSelect");
    const clinicInfo = document.getElementById("selectedClinicInfo");
    const serviceSelect = document.getElementById("serviceType");
    const confirmModal = document.getElementById("confirmModal");
    const confirmSummary = document.getElementById("confirmSummary");
    const confirmCancel = document.getElementById("confirmCancel");
    const confirmProceed = document.getElementById("confirmProceed");
    const submitButton = bookingForm.querySelector('button[type="submit"]');

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

    // ----- Clinic selection -----
    getAllClinics().forEach(function(clinic) {
        const option = document.createElement("option");
        option.value = clinic.id;
        option.textContent = clinic.name + (clinic.sample ? " (sample)" : "");
        clinicSelect.appendChild(option);
    });

    // Services the chosen clinic does not offer are disabled (all enabled if no clinic yet)
    function updateServiceOptions(clinic) {
        Array.from(serviceSelect.options).forEach(function(option) {
            if (!option.value) {
                return;
            }

            // A clinic with no services listed (for example from OpenStreetMap) allows every service
            option.disabled = !!(clinic && clinic.services && clinic.services.length > 0 && clinic.services.indexOf(option.value) === -1);
        });

        const current = serviceSelect.options[serviceSelect.selectedIndex];

        if (current && current.disabled) {
            serviceSelect.value = "";
        }
    }

    // Shows the selected clinic's saved information inside the booking form
    function showClinicInfo() {
        const clinic = getClinicById(clinicSelect.value);
        clinicInfo.textContent = "";
        clinicInfo.hidden = !clinic;
        updateServiceOptions(clinic);

        if (!clinic) {
            return;
        }

        const title = makeEl("div", "selected-clinic-title");
        title.appendChild(makeEl("strong", "", "🏥 " + clinic.name));

        if (clinic.sample) {
            title.appendChild(makeEl("span", "clinic-sample-badge", "Sample listing"));
        }

        clinicInfo.appendChild(title);
        clinicInfo.appendChild(makeEl("p", "", "📍 " + (clinic.address || "Address not available")));
        clinicInfo.appendChild(makeEl("p", "", "Services: " + (clinic.services && clinic.services.length > 0 ? clinic.services.join(", ") : "Not listed (please ask the clinic)")));
        clinicInfo.appendChild(makeEl("p", "", "Contact: " + (clinic.phone || "Not available")));
        clinicInfo.appendChild(makeEl("p", "", "Hours: " + (clinic.hours || "Not available")));
    }

    clinicSelect.addEventListener("change", showClinicInfo);

    // Clinic from the link (booking.html?clinic=...) or remembered while the guest logged in.
    // Only ids that exist in the clinic list (getAllClinics) are accepted.
    (function preselectClinic() {
        const fromLink = new URLSearchParams(window.location.search).get("clinic");
        let pending = "";

        try {
            pending = localStorage.getItem(STORAGE_KEYS.pendingClinic) || "";
            localStorage.removeItem(STORAGE_KEYS.pendingClinic);
        } catch (error) { /* optional */ }

        const clinic = getClinicById(fromLink) || getClinicById(pending);

        if (clinic) {
            clinicSelect.value = clinic.id;
        }

        showClinicInfo();
    })();

    // ----- Reading the form -----
    function readFormValues() {
        const clinic = getClinicById(clinicSelect.value);
        const selectedAnimal = animalType.value;

        return {
            clinic: clinic,
            owner: document.getElementById("ownerName").value.trim(),
            pet: document.getElementById("petName").value.trim(),
            animal: selectedAnimal,
            animalDetails: selectedAnimal === "Other" ? otherAnimalInput.value.trim() : "",
            service: serviceSelect.value,
            date: dateInput.value,
            time: document.getElementById("appointmentTime").value,
            contact: document.getElementById("contactNumber").value.trim()
        };
    }

    function summaryRows(values) {
        return [
            ["Pet name", values.pet],
            ["Veterinary clinic", values.clinic ? values.clinic.name : "—"],
            ["Requested service", values.service],
            ["Preferred date", formatDateOnly(values.date)],
            ["Preferred time", formatTime(values.time)]
        ];
    }

    function fillDetailList(list, rows) {
        list.textContent = "";

        rows.forEach(function(pair) {
            const row = document.createElement("div");
            row.appendChild(makeEl("dt", "", pair[0]));
            row.appendChild(makeEl("dd", "", pair[1]));
            list.appendChild(row);
        });
    }

    // ----- Step 1: validate, then ask for confirmation -----
    let pendingValues = null;

    function openConfirm(values) {
        pendingValues = values;
        fillDetailList(confirmSummary, summaryRows(values));
        confirmProceed.disabled = false;
        confirmModal.hidden = false;
        document.body.classList.add("modal-open");
        confirmProceed.focus();
    }

    // Cancel: back to the form with everything still filled in so it can be edited
    function closeConfirm() {
        confirmModal.hidden = true;
        document.body.classList.remove("modal-open");
        pendingValues = null;
        submitButton.focus();
    }

    confirmCancel.addEventListener("click", closeConfirm);
    confirmModal.addEventListener("click", function(event) {
        if (event.target === confirmModal) {
            closeConfirm();
        }
    });
    document.addEventListener("keydown", function(event) {
        if (event.key === "Escape" && !confirmModal.hidden) {
            closeConfirm();
        }
    });

    bookingForm.addEventListener("submit", function(event) {
        event.preventDefault();

        // The session may have ended (for example, logged out in another tab).
        if (!isUserLoggedIn()) {
            window.location.replace("login.html?redirect=booking.html");
            return;
        }

        if (animalType.value === "Other" && !otherAnimalInput.value.trim()) {
            otherAnimalInput.focus();
            otherAnimalInput.reportValidity();
            return;
        }

        const values = readFormValues();

        if (!values.clinic) {
            clinicSelect.focus();
            clinicSelect.reportValidity();
            return;
        }

        openConfirm(values);
    });

    // ----- Step 2: Confirm -> the existing save process -----
    confirmProceed.addEventListener("click", function() {
        if (!pendingValues || confirmProceed.disabled) {
            return;
        }

        confirmProceed.disabled = true; // one click = one saved request

        if (!isUserLoggedIn()) {
            window.location.replace("login.html?redirect=booking.html");
            return;
        }

        const values = pendingValues;

        // Link the request to the logged-in user (shown on their dashboard)
        const account = getCurrentAccount();
        const planRecord = account ? getPlanRecord(account.email) : { active: null };
        const isPriority = !!(planRecord.active && planRecord.active.planId === "deluxe");

        const appointment = {
            id: makeId("appt"),
            userEmail: account ? account.email : "",
            createdAt: new Date().toISOString(),
            status: "Request submitted",
            priority: isPriority,
            owner: values.owner,
            pet: values.pet,
            animal: values.animal === "Other" ? "Other" : values.animal,
            animalDetails: values.animalDetails,
            service: values.service,
            date: values.date,
            time: values.time,
            contact: values.contact,
            // Selected clinic (a copy is saved so the dashboard still shows it if the clinic list changes)
            clinicId: values.clinic.id,
            clinicName: values.clinic.name,
            clinicAddress: values.clinic.address || "",
            clinicSample: !!values.clinic.sample
        };

        // Existing saved requests are kept; the new one is added to the list
        const bookings = readStored(STORAGE_KEYS.bookings, "array");
        bookings.push(appointment);

        if (!writeStored(STORAGE_KEYS.bookings, bookings)) {
            // Never show a success message if nothing was saved
            confirmProceed.disabled = false;
            closeConfirm();
            window.alert("Your request could not be saved in this browser. Please try again.");
            return;
        }

        if (account) {
            PawfurNotifications.notifyRequest(account.email, appointment);
        }

        confirmModal.hidden = true;
        document.body.classList.remove("modal-open");
        pendingValues = null;

        const priorityNote = document.getElementById("bookingPriorityNote");

        if (priorityNote) {
            priorityNote.hidden = !isPriority;
        }

        // Success message with the appointment details
        fillDetailList(document.getElementById("bookingDetails"), [
            ["Pet name", appointment.pet],
            ["Clinic", appointment.clinicName],
            ["Service", appointment.service],
            ["Requested date", formatDateOnly(appointment.date)],
            ["Requested time", formatTime(appointment.time)]
        ]);

        bookingSuccess.hidden = false;
        bookingSuccess.scrollIntoView({ behavior: "smooth", block: "nearest" });

        bookingForm.reset();
        dateInput.min = todayString;
        updateOtherAnimalField();
        showClinicInfo();
    });
}
