// =====================================
// FILE: js/11-checkout.js
// CHECKOUT: simulated payment (DEMO only), saves the transaction and activates the plan
// Used by: checkout.html
// =====================================

// =====================================
// CHECKOUT PAGE: SIMULATED PAYMENT (DEMO ONLY)
// No real payment is made and no payment details are collected.
// =====================================

const checkoutMain = document.getElementById("checkoutMain");

if (checkoutMain && !accessDenied) {
    const checkoutEmpty = document.getElementById("checkoutEmpty");
    const checkoutSuccess = document.getElementById("checkoutSuccess");
    const checkoutForm = document.getElementById("checkoutForm");
    const methodError = document.getElementById("methodError");
    const simulateButton = document.getElementById("simulatePayment");
    const account = getCurrentAccount();

    if (!account) {
        // Session flag exists but the account is gone (for example cleared storage)
        endSession();
        window.location.replace("login.html?redirect=checkout.html");
    } else {
        // A plan chosen while logged out now belongs to this user
        const guestChoice = readStored(STORAGE_KEYS.pendingPlan, "object");
        const record = getPlanRecord(account.email);

        if (PLANS[guestChoice.planId]) {
            record.pending = { planId: guestChoice.planId, selectedAt: guestChoice.selectedAt || new Date().toISOString() };
            savePlanRecord(account.email, record);
        }

        localStorage.removeItem(STORAGE_KEYS.pendingPlan);

        if (!record.pending) {
            checkoutEmpty.hidden = false;
        } else {
            const plan = PLANS[record.pending.planId];
            checkoutMain.hidden = false;

            document.getElementById("summaryPlanName").textContent = plan.name;
            document.getElementById("summaryPlanTagline").textContent = plan.tagline;
            document.getElementById("payPlan").textContent = plan.name;
            document.getElementById("payTotal").textContent = formatPeso(plan.price);

            const benefitList = document.getElementById("summaryBenefits");
            plan.benefits.forEach(function(text) {
                benefitList.appendChild(makeEl("li", "", text));
            });

            // Show the chosen method in the payment summary
            checkoutForm.addEventListener("change", function() {
                const chosen = checkoutForm.querySelector('input[name="paymentMethod"]:checked');
                document.getElementById("payMethod").textContent = chosen ? chosen.value + " (demo)" : "Not chosen yet";
                methodError.textContent = "";
            });

            function makeTransactionRef(existing) {
                const now = new Date();
                const day = now.getFullYear() +
                    String(now.getMonth() + 1).padStart(2, "0") +
                    String(now.getDate()).padStart(2, "0");
                let ref;

                do {
                    ref = "DEMO-" + day + "-" + Math.random().toString(36).slice(2, 8).toUpperCase();
                } while (existing.some(function(item) { return item.id === ref; }));

                return ref;
            }

            let paymentInProgress = false;

            checkoutForm.addEventListener("submit", function(event) {
                event.preventDefault();

                if (paymentInProgress) {
                    return;
                }

                const chosen = checkoutForm.querySelector('input[name="paymentMethod"]:checked');

                if (!chosen) {
                    methodError.textContent = "Please choose a demo payment method first.";
                    document.getElementById("methodGcash").focus();
                    return;
                }

                paymentInProgress = true;
                simulateButton.disabled = true;
                simulateButton.textContent = "Simulating demo payment…";

                window.setTimeout(function() {
                    const transactions = readStored(STORAGE_KEYS.transactions, "array");
                    const paidAt = new Date().toISOString();

                    const transaction = {
                        id: makeTransactionRef(transactions),
                        userEmail: account.email,
                        planId: plan.id,
                        planName: plan.name,
                        amount: plan.price,
                        currency: "PHP",
                        method: chosen.value,
                        status: "Simulated payment successful (DEMO)",
                        demo: true,
                        createdAt: paidAt
                    };

                    transactions.push(transaction);

                    const latest = getPlanRecord(account.email);
                    latest.active = {
                        planId: plan.id,
                        selectedAt: record.pending.selectedAt,
                        paidAt: paidAt,
                        paymentStatus: "Demo payment completed (simulated)",
                        transactionId: transaction.id
                    };
                    latest.pending = null;

                    if (!writeStored(STORAGE_KEYS.transactions, transactions) ||
                        !savePlanRecord(account.email, latest)) {
                        // Never show a success screen if nothing was saved
                        paymentInProgress = false;
                        simulateButton.disabled = false;
                        simulateButton.textContent = "Simulate Payment";
                        methodError.textContent = "The demo transaction could not be saved in this browser. Please try again.";
                        return;
                    }

                    checkoutMain.hidden = true;
                    checkoutSuccess.hidden = false;
                    document.getElementById("successReference").textContent = transaction.id;
                    document.getElementById("successPlan").textContent = plan.name;
                    document.getElementById("successMethod").textContent = chosen.value + " (demo)";
                    document.getElementById("successAmount").textContent = formatPeso(plan.price);
                    checkoutSuccess.scrollIntoView({ block: "start" });
                }, prefersReducedMotion() ? 0 : 700);
            });
        }
    }
}
