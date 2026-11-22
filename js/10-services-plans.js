// =====================================
// FILE: js/10-services-plans.js
// SERVICES PAGE: draws plan prices/benefits, comparison table, 'Choose Plan' buttons
// Used by: services.html
// =====================================

// =====================================
// SERVICES PAGE: DEMO CARE PLANS
// (prices and benefits come from PLANS at the top of this file)
// =====================================

const planGrid = document.querySelector(".plan-grid");

if (planGrid) {
    // Prices
    document.querySelectorAll("[data-plan-price]").forEach(function(element) {
        const plan = PLANS[element.dataset.planPrice];

        if (plan) {
            element.textContent = formatPeso(plan.price);
        }
    });

    // Benefit and limitation lists
    document.querySelectorAll("[data-plan-list]").forEach(function(list) {
        const plan = PLANS[list.dataset.planList];

        if (!plan) {
            return;
        }

        (list.dataset.kind === "limits" ? plan.limits : plan.benefits).forEach(function(text) {
            list.appendChild(makeEl("li", "", text));
        });
    });

    // Comparison table
    const compareBody = document.getElementById("compareBody");

    if (compareBody) {
        function markCell(included) {
            const cell = document.createElement("td");
            const mark = makeEl("span", included ? "yes" : "no", included ? "✓" : "—");

            mark.setAttribute("aria-label", included ? "Included" : "Not included");
            cell.appendChild(mark);
            return cell;
        }

        PLAN_COMPARISON.forEach(function(row) {
            const tr = document.createElement("tr");
            tr.appendChild(makeEl("th", "", row.feature));
            tr.lastChild.scope = "row";
            tr.appendChild(markCell(row.basic));
            tr.appendChild(markCell(row.deluxe));
            compareBody.appendChild(tr);
        });

        const priceRow = document.createElement("tr");
        priceRow.appendChild(makeEl("th", "", "Illustrative price"));
        priceRow.lastChild.scope = "row";
        priceRow.appendChild(makeEl("td", "", formatPeso(PLANS.basic.price) + " / month"));
        priceRow.appendChild(makeEl("td", "", formatPeso(PLANS.deluxe.price) + " / month"));
        compareBody.appendChild(priceRow);
    }

    // Choose Plan: remember the choice, then go to the simulated checkout.
    // Guests are sent to login first (checkout is members-only) and return afterwards.
    document.querySelectorAll("[data-choose-plan]").forEach(function(button) {
        button.addEventListener("click", function() {
            const planId = button.dataset.choosePlan;

            if (!PLANS[planId]) {
                return;
            }

            const selection = { planId: planId, selectedAt: new Date().toISOString() };
            const account = getCurrentAccount();

            if (account) {
                const record = getPlanRecord(account.email);
                record.pending = selection;
                savePlanRecord(account.email, record);
            } else {
                writeStored(STORAGE_KEYS.pendingPlan, selection);
            }

            window.location.href = "checkout.html";
        });
    });
}
