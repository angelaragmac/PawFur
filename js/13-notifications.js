// =====================================
// FILE: js/13-notifications.js
// NOTIFICATIONS: predefined in-site notifications (bell icon, unread badge, dashboard list)
// Used by: every app page (bell in the header), booking.html (creates the "request" message),
//          dashboard.html (shows the list)
// Contains: PawfurNotifications (add/list/mark read), the header bell, the dashboard list
// Storage: localStorage key STORAGE_KEYS.notifications, each item tied to the user's email
// =====================================

// =====================================
// NOTIFICATIONS
// These are PREDEFINED messages shown inside the website only.
// No SMS or e-mail is sent, and no clinic confirmation is claimed.
// =====================================

const PawfurNotifications = (function() {
    const TEMPLATES = {
        request: {
            title: "Appointment Request",
            message: "Your appointment request has been received!"
        },
        reminder: {
            title: "Appointment Reminder",
            message: "Your scheduled appointment is approaching. Please remember to contact your selected veterinary clinic to confirm availability."
        },
        update: {
            title: "Appointment Update",
            message: "Your appointment information has been updated."
        }
    };

    const ICONS = { request: "📩", reminder: "⏰", update: "✏️" };
    const MAX_PER_USER = 50;
    const REMINDER_DAYS = 2; // remind when the appointment is today or within 2 days

    function readAll() {
        return readStored(STORAGE_KEYS.notifications, "array");
    }

    function listFor(email) {
        return readAll()
            .filter(function(item) { return item.userEmail === email; })
            .sort(function(a, b) { return String(b.createdAt || "").localeCompare(String(a.createdAt || "")); });
    }

    function unreadCountFor(email) {
        return listFor(email).filter(function(item) { return !item.read; }).length;
    }

    function changed() {
        document.dispatchEvent(new CustomEvent("pawfur:notifications-changed"));
    }

    function detailLine(appointment) {
        if (!appointment) {
            return "";
        }

        const parts = [
            appointment.pet,
            appointment.clinicName,
            appointment.date ? formatDateOnly(appointment.date) + (appointment.time ? " at " + formatTime(appointment.time) : "") : ""
        ].filter(Boolean);

        return parts.join(" · ");
    }

    // Adds one notification. A dedupeKey stops the same message being created twice.
    function add(email, type, appointment, dedupeKey) {
        const template = TEMPLATES[type];

        if (!email || !template) {
            return null;
        }

        const all = readAll();

        if (dedupeKey && all.some(function(item) { return item.userEmail === email && item.dedupeKey === dedupeKey; })) {
            return null;
        }

        const item = {
            id: makeId("note"),
            userEmail: email,
            type: type,
            title: template.title,
            message: template.message,
            detail: detailLine(appointment),
            appointmentId: appointment ? appointment.id : "",
            dedupeKey: dedupeKey || "",
            read: false,
            createdAt: new Date().toISOString()
        };

        all.push(item);

        // Keep each person's list from growing forever (oldest read items go first)
        const mine = all.filter(function(entry) { return entry.userEmail === email; });

        if (mine.length > MAX_PER_USER) {
            const drop = mine
                .sort(function(a, b) { return String(a.createdAt).localeCompare(String(b.createdAt)); })
                .slice(0, mine.length - MAX_PER_USER)
                .map(function(entry) { return entry.id; });

            writeStored(STORAGE_KEYS.notifications, all.filter(function(entry) { return drop.indexOf(entry.id) === -1; }));
        } else {
            writeStored(STORAGE_KEYS.notifications, all);
        }

        changed();
        return item;
    }

    function markRead(email, id) {
        const all = readAll();
        let didChange = false;

        all.forEach(function(item) {
            if (item.userEmail === email && item.id === id && !item.read) {
                item.read = true;
                didChange = true;
            }
        });

        if (didChange) {
            writeStored(STORAGE_KEYS.notifications, all);
            changed();
        }
    }

    function markAllRead(email) {
        const all = readAll();
        let didChange = false;

        all.forEach(function(item) {
            if (item.userEmail === email && !item.read) {
                item.read = true;
                didChange = true;
            }
        });

        if (didChange) {
            writeStored(STORAGE_KEYS.notifications, all);
            changed();
        }
    }

    // Stage 1: right after a request is saved
    function notifyRequest(email, appointment) {
        return add(email, "request", appointment, "request:" + appointment.id);
    }

    // Stage 3: call this whenever a saved appointment is edited (pass a value that changes with each edit)
    function notifyUpdate(email, appointment, editToken) {
        return add(email, "update", appointment, "update:" + appointment.id + ":" + (editToken || appointment.updatedAt || ""));
    }

    // Stage 2: appointments happening today or within the next 2 days get ONE reminder each
    function checkReminders(email) {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        readStored(STORAGE_KEYS.bookings, "array").forEach(function(booking) {
            if (booking.userEmail !== email) {
                return;
            }

            const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(booking.date || "");

            if (!match) {
                return;
            }

            const when = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
            const daysAway = Math.round((when - startOfToday) / 86400000);

            if (daysAway >= 0 && daysAway <= REMINDER_DAYS) {
                add(email, "reminder", booking, "reminder:" + booking.id);
            }
        });
    }

    function stamp(iso) {
        const date = new Date(iso);

        return isNaN(date.getTime())
            ? ""
            : date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    }

    // One notification row (used by the bell menu and the dashboard)
    function buildItem(email, note) {
        const row = makeEl("li", "notif-item" + (note.read ? "" : " unread"));
        row.appendChild(makeEl("span", "notif-icon", ICONS[note.type] || "🔔"));

        const body = makeEl("div", "notif-body");
        const top = makeEl("div", "notif-title-row");
        top.appendChild(makeEl("strong", "", note.title));

        if (!note.read) {
            const dot = makeEl("span", "notif-dot");
            dot.setAttribute("aria-label", "Unread");
            top.appendChild(dot);
        }

        body.appendChild(top);
        body.appendChild(makeEl("p", "notif-message", note.message));

        if (note.detail) {
            body.appendChild(makeEl("p", "notif-detail", note.detail));
        }

        const foot = makeEl("div", "notif-foot");
        foot.appendChild(makeEl("small", "", stamp(note.createdAt)));

        if (!note.read) {
            const button = makeEl("button", "notif-read-btn", "Mark as read");
            button.type = "button";
            button.addEventListener("click", function(event) {
                event.stopPropagation();
                markRead(email, note.id);
            });
            foot.appendChild(button);
        }

        body.appendChild(foot);
        row.appendChild(body);
        return row;
    }

    function renderList(container, email, limit) {
        container.textContent = "";
        const notes = listFor(email);

        if (notes.length === 0) {
            container.appendChild(makeEl("div", "empty-state", "No notifications yet. They will appear here when you request an appointment. 🐾"));
            return;
        }

        const list = makeEl("ul", "notif-list");
        notes.slice(0, limit || notes.length).forEach(function(note) {
            list.appendChild(buildItem(email, note));
        });
        container.appendChild(list);
    }

    return {
        TEMPLATES: TEMPLATES,
        add: add,
        list: listFor,
        unreadCount: unreadCountFor,
        markRead: markRead,
        markAllRead: markAllRead,
        notifyRequest: notifyRequest,
        notifyUpdate: notifyUpdate,
        checkReminders: checkReminders,
        renderList: renderList
    };
})();

// ----- Header bell (logged-in members only) -----
if (isAppPage && !accessDenied && loggedIn) {
    const noteAccount = getCurrentAccount();
    const userArea = document.querySelector(".user-area");

    if (noteAccount) {
        PawfurNotifications.checkReminders(noteAccount.email);
    }

    if (noteAccount && userArea) {
        const wrap = makeEl("div", "notif-wrap");
        wrap.innerHTML =
            '<button class="notif-bell" id="notifBell" type="button" aria-label="Notifications" aria-haspopup="true" aria-expanded="false" aria-controls="notifPanel">' +
                '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>' +
                '<span class="notif-badge" id="notifBadge" hidden>0</span>' +
            '</button>' +
            '<div class="notif-panel" id="notifPanel" role="region" aria-label="Notifications" hidden>' +
                '<div class="notif-panel-head"><h2>Notifications</h2>' +
                    '<button type="button" class="notif-read-btn" id="notifReadAll">Mark all as read</button></div>' +
                '<div id="notifPanelList"></div>' +
                '<a class="notif-panel-link" href="dashboard.html#notifications">View in dashboard</a>' +
            '</div>';
        userArea.insertBefore(wrap, userArea.firstChild);

        const bell = document.getElementById("notifBell");
        const badge = document.getElementById("notifBadge");
        const panel = document.getElementById("notifPanel");
        const panelList = document.getElementById("notifPanelList");

        function refreshBell() {
            const unread = PawfurNotifications.unreadCount(noteAccount.email);
            badge.hidden = unread === 0;
            badge.textContent = unread > 9 ? "9+" : String(unread);
            bell.setAttribute("aria-label", unread ? "Notifications, " + unread + " unread" : "Notifications");

            if (!panel.hidden) {
                PawfurNotifications.renderList(panelList, noteAccount.email, 8);
            }
        }

        function setPanel(open) {
            panel.hidden = !open;
            bell.setAttribute("aria-expanded", String(open));

            if (open) {
                PawfurNotifications.renderList(panelList, noteAccount.email, 8);
            }
        }

        bell.addEventListener("click", function(event) {
            event.stopPropagation();
            setPanel(panel.hidden);
        });

        panel.addEventListener("click", function(event) { event.stopPropagation(); });

        document.addEventListener("click", function() {
            if (!panel.hidden) {
                setPanel(false);
            }
        });

        document.addEventListener("keydown", function(event) {
            if (event.key === "Escape" && !panel.hidden) {
                setPanel(false);
                bell.focus();
            }
        });

        document.getElementById("notifReadAll").addEventListener("click", function() {
            PawfurNotifications.markAllRead(noteAccount.email);
        });

        document.addEventListener("pawfur:notifications-changed", refreshBell);
        // Updates made in another tab
        window.addEventListener("storage", function(event) {
            if (event.key === STORAGE_KEYS.notifications) {
                refreshBell();
            }
        });

        refreshBell();
    }
}

// ----- Dashboard list -----
const dashNotificationList = document.getElementById("notificationList");

if (dashNotificationList && isAppPage && !accessDenied && loggedIn) {
    const dashAccount = getCurrentAccount();

    if (dashAccount) {
        const markAll = document.getElementById("dashMarkAllRead");

        function drawDashboardNotifications() {
            PawfurNotifications.renderList(dashNotificationList, dashAccount.email, 10);

            if (markAll) {
                markAll.hidden = PawfurNotifications.unreadCount(dashAccount.email) === 0;
            }
        }

        if (markAll) {
            markAll.addEventListener("click", function() {
                PawfurNotifications.markAllRead(dashAccount.email);
            });
        }

        document.addEventListener("pawfur:notifications-changed", drawDashboardNotifications);
        drawDashboardNotifications();
    }
}
