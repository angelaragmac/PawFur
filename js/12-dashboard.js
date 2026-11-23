// =====================================
// FILE: js/12-dashboard.js
// DASHBOARD: My Pets, My Appointments, My Package, Payment History, Account Settings
// Used by: dashboard.html
// Key functions: renderPets(), renderAppointments(), renderPackage(), renderPayments(),
//                renderAccount(), refreshDashboard()
// =====================================

// =====================================
// DASHBOARD (members only)
// Shows only the data that belongs to the logged-in demo user.
// =====================================

const dashboardRoot = document.getElementById("dashboardRoot");

if (dashboardRoot && !accessDenied) {
    const account = getCurrentAccount();

    if (!account) {
        endSession();
        window.location.replace("login.html?redirect=dashboard.html");
    } else {
        const petForm = document.getElementById("petForm");
        const petAnimal = document.getElementById("petAnimal");
        const petOtherGroup = document.getElementById("petOtherGroup");
        const petOther = document.getElementById("petOther");
        const petMessage = document.getElementById("petMessage");
        const accountForm = document.getElementById("accountForm");
        const accountMessage = document.getElementById("accountMessage");

        let currentName = account.name;

        // Requests saved before accounts were linked have no owner email.
        // If the name typed on the form matches this account, link them once.
        function claimOlderBookings() {
            const all = readStored(STORAGE_KEYS.bookings, "array");
            let changed = false;

            all.forEach(function(booking) {
                const hasOwner = typeof booking.userEmail === "string" && booking.userEmail !== "";

                if (!hasOwner && String(booking.owner || "").trim().toLowerCase() === currentName.trim().toLowerCase()) {
                    booking.userEmail = account.email;
                    changed = true;
                }
            });

            if (changed) {
                writeStored(STORAGE_KEYS.bookings, all);
            }
        }

        function isDeluxeActive() {
            const record = getPlanRecord(account.email);
            return !!(record.active && record.active.planId === "deluxe");
        }

        // ----- My Pets -----
        function animalEmoji(animal) {
            return animal === "Dog" ? "🐶" : animal === "Cat" ? "🐱" : "🐾";
        }

        function renderPets() {
            const list = document.getElementById("petList");
            const pets = readStored(STORAGE_KEYS.pets, "array").filter(function(pet) {
                return pet.userEmail === account.email;
            });

            list.textContent = "";

            if (pets.length === 0) {
                const empty = makeEl("div", "empty-state", "No pets saved yet. Add your first pet below. 🐾");
                empty.style.gridColumn = "1 / -1";
                list.appendChild(empty);
            }

            pets.forEach(function(pet) {
                const card = makeEl("article", "pet-card");
                const top = makeEl("div", "pet-card-top");
                const names = document.createElement("div");

                top.appendChild(makeEl("span", "pet-avatar", animalEmoji(pet.animal)));
                names.appendChild(makeEl("h3", "", pet.name || "Unnamed pet"));
                names.appendChild(makeEl("small", "",
                    pet.animal === "Other" && pet.animalDetails ? "Other: " + pet.animalDetails : (pet.animal || "Pet")));
                top.appendChild(names);
                card.appendChild(top);

                const details = [
                    ["Breed", pet.breed],
                    ["Age", pet.age],
                    ["Weight", pet.weight ? pet.weight + " kg" : ""],
                    ["Last vaccine", pet.lastVaccination ? formatDateOnly(pet.lastVaccination) : ""],
                    ["Next check-up", pet.nextCheckup ? formatDateOnly(pet.nextCheckup) : ""],
                    ["Notes", pet.notes]
                ].filter(function(pair) { return pair[1]; });

                if (details.length) {
                    const dl = document.createElement("dl");

                    details.forEach(function(pair) {
                        dl.appendChild(makeEl("dt", "", pair[0]));
                        dl.appendChild(makeEl("dd", "", pair[1]));
                    });

                    card.appendChild(dl);
                }

                const remove = makeEl("button", "small-button danger", "Remove");
                remove.type = "button";
                remove.setAttribute("aria-label", "Remove " + (pet.name || "pet"));
                remove.addEventListener("click", function() {
                    if (!window.confirm("Remove " + (pet.name || "this pet") + " from your profile?")) {
                        return;
                    }

                    const all = readStored(STORAGE_KEYS.pets, "array").filter(function(item) {
                        return !(item.id === pet.id && item.userEmail === account.email);
                    });

                    writeStored(STORAGE_KEYS.pets, all);
                    refreshDashboard();
                });
                card.appendChild(remove);

                list.appendChild(card);
            });

            // Detailed fields are a Deluxe (demo) feature
            const deluxe = isDeluxeActive();
            document.getElementById("deluxePetFields").hidden = !deluxe;
            document.getElementById("petLocked").hidden = deluxe;
        }

        function updateOtherPetField() {
            const isOther = petAnimal.value === "Other";
            petOtherGroup.hidden = !isOther;
            petOther.required = isOther;

            if (!isOther) {
                petOther.value = "";
            }
        }

        petAnimal.addEventListener("change", updateOtherPetField);

        petForm.addEventListener("submit", function(event) {
            event.preventDefault();
            petMessage.style.color = "#C0392B";

            const name = document.getElementById("petName").value.trim();
            const animal = petAnimal.value;
            const other = petOther.value.trim();

            if (!name) {
                petMessage.textContent = "Please enter your pet's name.";
                document.getElementById("petName").focus();
                return;
            }

            if (!animal) {
                petMessage.textContent = "Please choose the type of animal.";
                petAnimal.focus();
                return;
            }

            if (animal === "Other" && !other) {
                petMessage.textContent = "Please tell us what kind of pet it is.";
                petOther.focus();
                return;
            }

            const pets = readStored(STORAGE_KEYS.pets, "array");

            if (pets.filter(function(pet) { return pet.userEmail === account.email; }).length >= 12) {
                petMessage.textContent = "The demo dashboard stores up to 12 pets.";
                return;
            }

            const pet = {
                id: makeId("pet"),
                userEmail: account.email,
                name: name,
                animal: animal,
                animalDetails: animal === "Other" ? other : "",
                createdAt: new Date().toISOString()
            };

            if (isDeluxeActive()) {
                pet.breed = document.getElementById("petBreed").value.trim();
                pet.age = document.getElementById("petAge").value.trim();
                pet.weight = document.getElementById("petWeight").value.trim();
                pet.lastVaccination = document.getElementById("petLastVaccine").value;
                pet.nextCheckup = document.getElementById("petNextCheckup").value;
                pet.notes = document.getElementById("petNotes").value.trim();
            }

            pets.push(pet);

            if (!writeStored(STORAGE_KEYS.pets, pets)) {
                petMessage.textContent = "Could not save the pet in this browser.";
                return;
            }

            petForm.reset();
            updateOtherPetField();
            petMessage.style.color = "";
            petMessage.textContent = "Saved " + name + "! 🐾";
            refreshDashboard();
        });

        // ----- My Appointments -----
        function renderAppointments() {
            const holder = document.getElementById("appointmentList");
            const mine = readStored(STORAGE_KEYS.bookings, "array")
                .filter(function(booking) { return booking.userEmail === account.email; })
                .sort(function(a, b) {
                    if (!!b.priority !== !!a.priority) {
                        return b.priority ? 1 : -1;
                    }

                    return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
                });

            holder.textContent = "";

            if (mine.length === 0) {
                const empty = makeEl("div", "empty-state");
                empty.appendChild(document.createTextNode("No appointment requests yet. "));
                const link = makeEl("a", "", "Book an appointment");
                link.href = "booking.html";
                empty.appendChild(link);
                empty.appendChild(document.createTextNode("."));
                holder.appendChild(empty);
                return mine.length;
            }

            const wrap = makeEl("div", "table-wrap");
            const table = makeEl("table", "data-table");
            const headRow = document.createElement("tr");

            ["Pet", "Clinic", "Animal", "Service", "Date", "Time", "Status"].forEach(function(title) {
                const th = makeEl("th", "", title);
                th.scope = "col";
                headRow.appendChild(th);
            });

            const thead = document.createElement("thead");
            thead.appendChild(headRow);
            table.appendChild(thead);

            const tbody = document.createElement("tbody");

            mine.forEach(function(booking) {
                const row = document.createElement("tr");
                const animal = booking.animal === "Other" && booking.animalDetails
                    ? "Other (" + booking.animalDetails + ")"
                    : (booking.animal || "—");

                [
                    ["Pet", booking.pet || "—"],
                    ["Clinic", booking.clinicName || "Not specified"],
                    ["Animal", animal],
                    ["Service", booking.service || "—"],
                    ["Date", formatDateOnly(booking.date)],
                    ["Time", formatTime(booking.time)]
                ].forEach(function(pair) {
                    const td = makeEl("td", "", pair[1]);
                    td.dataset.label = pair[0];
                    row.appendChild(td);
                });

                const statusCell = document.createElement("td");
                statusCell.dataset.label = "Status";
                statusCell.appendChild(makeEl("span", "badge", booking.status || "Request submitted"));

                if (booking.priority) {
                    statusCell.appendChild(document.createTextNode(" "));
                    statusCell.appendChild(makeEl("span", "badge badge-priority", "⭐ Priority"));
                }

                row.appendChild(statusCell);
                tbody.appendChild(row);
            });

            table.appendChild(tbody);
            wrap.appendChild(table);
            holder.appendChild(wrap);
            return mine.length;
        }

        // ----- My Package -----
        function renderPackage() {
            const panel = document.getElementById("packagePanel");
            const record = getPlanRecord(account.email);
            panel.textContent = "";

            if (record.active) {
                const plan = PLANS[record.active.planId];

                panel.appendChild(makeEl("span", "badge badge-ok", "Active"));
                panel.appendChild(makeEl("p", "package-name", plan.name));
                panel.appendChild(makeEl("p", "", plan.tagline));

                const meta = makeEl("div", "package-meta");
                meta.appendChild(makeEl("span", "badge", "Selected: " + formatTimestamp(record.active.selectedAt)));
                meta.appendChild(makeEl("span", "badge badge-ok", "Payment recorded"));
                panel.appendChild(meta);

                const list = makeEl("ul", "plan-list");
                plan.benefits.forEach(function(text) { list.appendChild(makeEl("li", "", text)); });
                panel.appendChild(list);

                if (plan.id === "deluxe") {
                    panel.appendChild(makeEl("h3", "plan-list-title", "Deluxe extras (sample content)"));
                    const resources = makeEl("ul", "resource-list");
                    [
                        "📘 Seasonal pet-care guide",
                        "🥣 Nutrition basics checklist",
                        "🦷 Dental care checklist",
                        "☀️ Heat-safety tips for hot days",
                        "📈 Care tracking: add vaccination and check-up dates to your pet profiles"
                    ].forEach(function(text) { resources.appendChild(makeEl("li", "", text)); });
                    panel.appendChild(resources);
                } else {
                    const upgrade = makeEl("p", "", "Want detailed pet profiles and care tracking? ");
                    const link = makeEl("a", "", "Compare with the Deluxe demo plan");
                    link.href = "services.html#packages";
                    link.style.fontWeight = "800";
                    link.style.textDecoration = "underline";
                    upgrade.appendChild(link);
                    panel.appendChild(upgrade);
                }
            } else if (!record.pending) {
                const empty = makeEl("div", "empty-state");
                empty.appendChild(document.createTextNode("You haven't chosen a package yet. "));
                const link = makeEl("a", "", "Explore the Basic and Deluxe demo plans");
                link.href = "services.html#packages";
                empty.appendChild(link);
                empty.appendChild(document.createTextNode("."));
                panel.appendChild(empty);
            }

            if (record.pending) {
                const pendingPlan = PLANS[record.pending.planId];
                const note = makeEl("div", "pending-note");
                note.appendChild(makeEl("strong", "", "Selected: " + pendingPlan.name));
                note.appendChild(document.createTextNode(" on " + formatTimestamp(record.pending.selectedAt) + ". Payment: awaiting."));
                note.appendChild(document.createElement("br"));
                const go = makeEl("a", "main-button", "Continue to checkout");
                go.href = "checkout.html";
                note.appendChild(go);
                panel.appendChild(note);
            }

            return record.active ? PLANS[record.active.planId].name : "None";
        }

        // ----- Payment History -----
        function renderPayments() {
            const holder = document.getElementById("paymentList");
            const mine = readStored(STORAGE_KEYS.transactions, "array")
                .filter(function(tx) { return tx.userEmail === account.email; })
                .sort(function(a, b) { return String(b.createdAt || "").localeCompare(String(a.createdAt || "")); });

            holder.textContent = "";

            if (mine.length === 0) {
                holder.appendChild(makeEl("div", "empty-state", "No payments yet."));
                return 0;
            }

            const wrap = makeEl("div", "table-wrap");
            const table = makeEl("table", "data-table");
            const headRow = document.createElement("tr");

            ["Package", "Amount", "Method", "Reference", "Status"].forEach(function(title) {
                const th = makeEl("th", "", title);
                th.scope = "col";
                headRow.appendChild(th);
            });

            const thead = document.createElement("thead");
            thead.appendChild(headRow);
            table.appendChild(thead);

            const tbody = document.createElement("tbody");

            mine.forEach(function(tx) {
                const row = document.createElement("tr");

                [
                    ["Package", tx.planName || "—"],
                    ["Amount", formatPeso(tx.amount)],
                    ["Method", tx.method || "—"],
                    ["Reference", String(tx.id || "—").replace(/^DEMO-/, "PF-")]
                ].forEach(function(pair) {
                    const td = makeEl("td", "", pair[1]);
                    td.dataset.label = pair[0];
                    row.appendChild(td);
                });

                const statusCell = document.createElement("td");
                statusCell.dataset.label = "Status";
                statusCell.appendChild(makeEl("span", "badge badge-ok", "Payment recorded"));
                row.appendChild(statusCell);

                tbody.appendChild(row);
            });

            table.appendChild(tbody);
            wrap.appendChild(table);
            holder.appendChild(wrap);
            return mine.length;
        }

        // ----- Account Settings -----
        function renderAccount() {
            document.getElementById("dashName").textContent = currentName;
            document.getElementById("accountNameView").textContent = currentName;
            document.getElementById("accountEmailView").textContent = account.email;
            document.getElementById("accountName").value = currentName;
        }

        accountForm.addEventListener("submit", function(event) {
            event.preventDefault();
            accountMessage.style.color = "#C0392B";

            const newName = document.getElementById("accountName").value.trim();

            if (!newName) {
                accountMessage.textContent = "Please enter a name.";
                return;
            }

            const users = readStored(STORAGE_KEYS.users, "array");
            const stored = users.find(function(user) { return user.email === account.email; });

            if (!stored) {
                accountMessage.textContent = "Could not find this account in the browser.";
                return;
            }

            stored.name = newName;

            if (!writeStored(STORAGE_KEYS.users, users)) {
                accountMessage.textContent = "Could not save the change in this browser.";
                return;
            }

            localStorage.setItem(STORAGE_KEYS.currentUser, newName);
            currentName = newName;

            const userName = document.getElementById("userName");

            if (userName) {
                userName.textContent = "Hi, " + newName;
            }

            accountMessage.style.color = "";
            accountMessage.textContent = "Account updated. ✅";
            renderAccount();
        });

        // ----- Draw everything -----
        function refreshDashboard() {
            const petCount = readStored(STORAGE_KEYS.pets, "array").filter(function(pet) {
                return pet.userEmail === account.email;
            }).length;

            renderPets();
            const appointmentCount = renderAppointments();
            const planName = renderPackage();
            const paymentCount = renderPayments();
            renderAccount();

            document.getElementById("statPets").textContent = petCount;
            document.getElementById("statAppointments").textContent = appointmentCount;
            document.getElementById("statPlan").textContent = planName;
            document.getElementById("statPayments").textContent = paymentCount;
        }

        claimOlderBookings();
        updateOtherPetField();
        refreshDashboard();
    }
}
