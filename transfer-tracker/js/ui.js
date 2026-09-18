function createTransferCard(transfer) {

    const statusClass =
        transfer.status === "approved"
            ? "approved"
            : "declined";

    const statusText =
        transfer.status === "approved"
            ? "Approved"
            : "Declined";

    const time =
        new Date(transfer.timestamp)
            .toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit"
            });

    return `
        <div class="recent-transfer ${statusClass}">

            <div class="recent-transfer-main">

                <div class="recent-transfer-line">

                    <span class="recent-status">
                        <span class="status-dot"></span>
                        ${statusText}
                    </span>

                    <span class="recent-name">
                        ${transfer.customerName}
                    </span>

                    <span class="recent-time">
                        ${time}
                    </span>

                </div>


                <div class="recent-transfer-details">

                    #${transfer.fileNumber}

                    <span>•</span>

                    ${transfer.phone}

                </div>

            </div>


            <button
                class="menu-button recent-menu-button"
                data-id="${transfer.id}">
                ⋮
            </button>


            <div class="action-menu">

                <button
                    class="delete-option"
                    data-id="${transfer.id}">
                    Delete Transfer
                </button>

            </div>

        </div>
    `;
}



function updateRecentActivitySummary(transfer) {

    const summary =
    document.getElementById(
        "activitySubtitle"
    );


    if (!summary) {
        return;
    }


    if (!transfer) {

        summary.textContent =
            "No transfers yet";

        return;

    }


    const status =
        transfer.status === "approved"
            ? "Approved"
            : "Declined";


    const time =
        new Date(
            transfer.timestamp
        ).toLocaleTimeString(
            [],
            {
                hour: "numeric",
                minute: "2-digit"
            }
        );


    summary.textContent =
        `Last transfer · ${status} · ${time}`;

}



async function renderRecentTransfers() {

    const container =
        document.getElementById("recentTransfers");

    const transfers =
        await getRecentTransfers(5);


        updateRecentActivitySummary(
            transfers[0]
            );

    if (!transfers.length) {

        container.innerHTML = `
            <div class="empty">
                No transfers yet.
            </div>
        `;

        return;
    }

    container.innerHTML =
        transfers.map(createTransferCard).join("");

    attachMenuEvents();

}


function attachMenuEvents() {

    document
        .querySelectorAll(".menu-button")
        .forEach(button => {

            button.onclick = (event) => {

                event.stopPropagation();

                closeMenus();

                const menu =
                    button.nextElementSibling;

                menu.classList.toggle("show");

            };

        });


    document
        .querySelectorAll(".delete-option")
        .forEach(option => {

            option.onclick = async () => {

                const id =
                    option.dataset.id;

                await deleteTransfer(id);

                await renderRecentTransfers();
                await updateDashboard();
                await renderHistory();

            };

        });


    document.onclick = () => {

        closeMenus();

    };

}



function closeMenus() {

    document
        .querySelectorAll(".action-menu")
        .forEach(menu => {

            menu.classList.remove("show");

        });

}


function formatHistoryDate(date) {

    return date.toLocaleDateString(undefined, {

        weekday: "long",

        month: "short",

        day: "numeric",

        year: "numeric"

    });

}



function createHistoryTransferCard(transfer) {

    const statusClass =
        transfer.status === "approved"
            ? "approved"
            : "declined";


    const statusText =
        transfer.status === "approved"
            ? "Approved"
            : "Declined";


    const time =
        new Date(transfer.timestamp)
            .toLocaleTimeString([], {

                hour: "numeric",

                minute: "2-digit"

            });


    return `

    <div class="transfer-card ${statusClass}">

        <div class="transfer-header">

            <div class="status">

                <span class="status-dot"></span>

                ${statusText}

            </div>


            <div class="transfer-time">

                ${time}

            </div>


            <button
                class="menu-button history-menu-button"
                data-id="${transfer.id}">
                ⋮
            </button>


            <div class="action-menu">

                <button
                    class="delete-option"
                    data-id="${transfer.id}">
                    Delete Transfer
                </button>

            </div>


        </div>


        <div class="customer-name">

            ${transfer.customerName}

        </div>


        <div class="transfer-file">

            #${transfer.fileNumber}

        </div>


        <div class="transfer-phone">

            ${transfer.phone}

        </div>


    </div>

`;

}



function createHistoryDay(day) {

    return `

        <details class="history-day">

            <summary>

                <div>

                    <strong>
                        ${formatHistoryDate(day.date)}
                    </strong>


                    <div class="history-day-meta">

                        Transfers:
                        ${day.transferCount}

                        |

                        Bonus:
                        $${day.dailyBonus.toFixed(2)}

                    </div>

                </div>

            </summary>


            <div class="history-day-summary">

                Approved:
                ${day.approvedCount}

                <br>

                Declined:
                ${day.declinedCount}

            </div>


            <div class="history-transfers">

                ${
                    day.transfers
                        .map(createHistoryTransferCard)
                        .join("")
                }

            </div>


        </details>

    `;

}


function createPayrollWeekRow(week) {

    const weekStart =
        week.weekStart.toLocaleDateString(
            undefined,
            {
                month: "short",
                day: "numeric"
            }
        );


    const weekEnd =
        week.weekEnd.toLocaleDateString(
            undefined,
            {
                month: "short",
                day: "numeric"
            }
        );


    return `
        <button
            class="payroll-week-row"
            data-week-start="${week.weekStart.getTime()}">

            <div class="payroll-week-date">

                <strong>
                    ${weekStart} → ${weekEnd}
                </strong>

                <span>
                    ${week.transferCount} transfers
                </span>

            </div>


            <div class="payroll-week-stat">

                <span>Approved</span>

                <strong>
                    ${week.weeklyApproved}
                </strong>

                <small>
                    $${week.weeklyApprovedBonus.toFixed(2)}
                </small>

            </div>


            <div class="payroll-week-stat">

                <span>Declined</span>

                <strong>
                    ${week.weeklyDeclined}
                </strong>

                <small>
                    $${week.weeklyDeclinedBonus.toFixed(2)}
                </small>

            </div>


            <div class="payroll-week-bonus">

                <span>Total Bonus</span>

                <strong>
                    $${week.weeklyBonus.toFixed(2)}
                </strong>

            </div>

        </button>
    `;
}


function createPayrollDayRow(day) {

    return `

        <div
            class="payroll-day-row"
            data-timestamp="${day.date.getTime()}"
        >

            <div class="payroll-day-date">

                <strong>
                    ${day.date.toLocaleDateString(
                        undefined,
                        {
                            weekday: "short",
                            month: "short",
                            day: "numeric"
                        }
                    )}
                </strong>

                <span>
                    ${day.transferCount} transfers
                </span>

            </div>


            <div class="payroll-day-stat">

                <strong>
                    ${day.approvedCount}
                </strong>

                <small>
                    $${day.approvedBonus.toFixed(2)}
                </small>

            </div>


            <div class="payroll-day-stat">

                <strong>
                    ${day.declinedCount}
                </strong>

                <small>
                    $${day.declinedBonus.toFixed(2)}
                </small>

            </div>


            <div class="payroll-day-bonus">

                <strong>
                    $${day.dailyBonus.toFixed(2)}
                </strong>

            </div>

        </div>

    `;
}

function renderPayrollDayView(week) {

    const dayView =
        document.getElementById(
            "payrollDayView"
        );


    const weekTable =
        document.getElementById(
            "payrollHistoryTable"
        );


    const weekStart =
        week.weekStart.toLocaleDateString(
            undefined,
            {
                month: "short",
                day: "numeric"
            }
        );


    const weekEnd =
        week.weekEnd.toLocaleDateString(
            undefined,
            {
                month: "short",
                day: "numeric"
            }
        );


    dayView.innerHTML = `

        <div class="payroll-day-header">

            <button
                id="payrollBackButton"
                class="payroll-back-button">

                ← Back

            </button>


            <div>

                <strong>
                    ${weekStart} → ${weekEnd}
                </strong>

                <span>
                    ${week.transferCount} transfers
                </span>

            </div>

        </div>


        <div class="payroll-table-header">

            <div>Date</div>

            <div>Approved</div>

            <div>Declined</div>

            <div>Bonus</div>

        </div>


        <div class="payroll-table-body">

            ${
                week.days
                    .map(createPayrollDayRow)
                    .join("")
            }

        </div>


        <div class="payroll-week-total">

            <span>
                Week Total
            </span>

            <strong>
                ${week.weeklyApproved}
            </strong>

            <strong>
                ${week.weeklyDeclined}
            </strong>

            <strong>
                $${week.weeklyBonus.toFixed(2)}
            </strong>

        </div>

    `;


    weekTable.style.display = "none";

    dayView.style.display = "block";


    document
        .getElementById(
            "payrollBackButton"
        )
        .onclick = () => {

            dayView.style.display = "none";

            weekTable.style.display = "block";

        };


    document
        .querySelectorAll(
            ".payroll-day-row"
        )
        .forEach(row => {

            row.onclick = () => {

                const timestamp =
                    Number(
                        row.dataset.timestamp
                    );


                const selectedDay =
                    week.days.find(
                        day =>
                            day.date.getTime() ===
                            timestamp
                    );


                if (!selectedDay) {
                    return;
                }


                renderPayrollTransferView(
                    selectedDay,
                    week
                );

            };

        });

}



function attachPayrollWeekEvents(payrollWeeks) {

    const table =
        document.getElementById(
            "payrollHistoryTable"
        );


    table.onclick = event => {

        const row =
            event.target.closest(
                ".payroll-week-row"
            );


        if (!row) {
            return;
        }


        const weekStart =
            Number(
                row.dataset.weekStart
            );


        const selectedWeek =
            payrollWeeks.find(
                week =>
                    week.weekStart.getTime() ===
                    weekStart
            );


        if (!selectedWeek) {
            return;
        }


        renderPayrollDayView(
            selectedWeek
        );

    };

}


function renderPayrollTransferView(
    day,
    week
) {

    const dayView =
        document.getElementById(
            "payrollDayView"
        );


    const dayName =
        day.date.toLocaleDateString(
            undefined,
            {
                weekday: "long",
                month: "short",
                day: "numeric"
            }
        );


    dayView.innerHTML = `

        <div class="payroll-day-header">

            <button
                id="payrollTransferBackButton"
                class="payroll-back-button">

                ← Back

            </button>


            <div>

                <strong>
                    ${dayName}
                </strong>

                <span>
                    ${day.transferCount} transfers
                </span>

            </div>

        </div>


        <div class="payroll-transfer-summary">

            <div>
                Approved
                <strong>
                    ${day.approvedCount}
                </strong>
            </div>


            <div>
                Declined
                <strong>
                    ${day.declinedCount}
                </strong>
            </div>


            <div>
                Bonus
                <strong>
                    $${day.dailyBonus.toFixed(2)}
                </strong>
            </div>

        </div>


        <div class="payroll-transfer-list">

            ${
                day.transfers
                    .slice()
                    .sort(
                        (a, b) =>
                            a.timestamp - b.timestamp
                    )
                    .map(
                        createPayrollTransferRow
                    )
                    .join("")
            }

        </div>

    `;


    document
        .getElementById(
            "payrollTransferBackButton"
        )
        .onclick = () => {

            renderPayrollDayView(
                week
            );

        };


            attachPayrollTransferEvents(
            day,
            week
        );

}

function createPayrollTransferRow(
    transfer
) {

    const statusText =
        transfer.status === "approved"
            ? "Approved"
            : "Declined";


    const statusClass =
        transfer.status === "approved"
            ? "approved"
            : "declined";


    const time =
        new Date(
            transfer.timestamp
        ).toLocaleTimeString(
            [],
            {
                hour: "numeric",
                minute: "2-digit"
            }
        );


    return `

        <div
            class="payroll-transfer-row ${statusClass}"
            data-id="${transfer.id}"
        >

            <div class="payroll-transfer-time">
                ${time}
            </div>


            <div class="payroll-transfer-status">

                <span class="status-dot"></span>

                ${statusText}

            </div>


            <div class="payroll-transfer-customer">

                <strong>
                    ${transfer.customerName}
                </strong>

                <span>
                    #${transfer.fileNumber}
                </span>

            </div>


            <div class="payroll-transfer-phone">

                ${transfer.phone}

            </div>


            <button
                class="menu-button payroll-transfer-menu"
                data-id="${transfer.id}">

                ⋮

            </button>


            <div class="action-menu">

                <button
                    class="delete-option payroll-delete-option"
                    data-id="${transfer.id}">

                    Delete Transfer

                </button>

            </div>

        </div>

    `;

}

function attachPayrollTransferEvents(
    day,
    week
) {

    const container =
        document.getElementById(
            "payrollDayView"
        );


    container.onclick = async event => {

        const menuButton =
            event.target.closest(
                ".payroll-transfer-menu"
            );


        if (menuButton) {

            event.stopPropagation();

            closeMenus();


            const menu =
                menuButton.nextElementSibling;


            menu.classList.toggle(
                "show"
            );


            return;

        }


        const deleteButton =
            event.target.closest(
                ".payroll-delete-option"
            );


        if (deleteButton) {

            event.stopPropagation();


            const id =
                deleteButton.dataset.id;


            await deleteTransfer(id);


            const transfers =
                await getTransfers();


            const payrollWeeks =
                createPayrollWeekData(
                    transfers
                );


            const updatedWeek =
                payrollWeeks.find(
                    weekData =>
                        weekData.weekStart.getTime() ===
                        week.weekStart.getTime()
                );


            if (!updatedWeek) {
                return;
            }


            const updatedDay =
                updatedWeek.days.find(
                    dayData =>
                        dayData.date.toDateString() ===
                        day.date.toDateString()
                );


            if (updatedDay) {

                renderPayrollTransferView(
                    updatedDay,
                    updatedWeek
                );

            }
            else {

                renderPayrollDayView(
                    updatedWeek
                );

            }


            await renderRecentTransfers();

            await updateDashboard();

            await renderHistory();


            return;

        }


        closeMenus();

    };

}


async function renderHistory() {

    const transfers =
        await getTransfers();


    const table =
        document.getElementById(
            "payrollHistoryTable"
        );


    if (!transfers.length) {

        document
            .getElementById("lifetimeEarnings")
            .textContent = "$0.00";


        document
            .getElementById("lifetimeTransfers")
            .textContent = "0";


        table.innerHTML = `
            <div class="empty">
                No payroll history yet.
            </div>
        `;

        return;

    }


    const payrollWeeks =
        createPayrollWeekData(transfers);


    const lifetimeBonus =
        payrollWeeks.reduce(
            (total, week) => {

                return total + week.weeklyBonus;

            },
            0
        );


    document
        .getElementById("lifetimeEarnings")
        .textContent =
            "$" + lifetimeBonus.toFixed(2);


    document
        .getElementById("lifetimeTransfers")
        .textContent =
            transfers.length;


    table.innerHTML = `

        <div class="payroll-table-header">

            <div>Week</div>

            <div>Approved</div>

            <div>Declined</div>

            <div>Bonus</div>

        </div>


        <div class="payroll-table-body">

            ${
                payrollWeeks
                    .map(createPayrollWeekRow)
                    .join("")
            }

        </div>

    `;
    
        attachPayrollWeekEvents(
        payrollWeeks
    );
    
}



const payrollHistoryBtn =
document.getElementById(
    "payrollHistoryBtn"
);


const payrollModal =
document.getElementById(
    "payrollModal"
);


const closePayrollModal =
document.getElementById(
    "closePayrollModal"
);


payrollHistoryBtn.addEventListener(
    "click",
    () => {

        payrollModal.classList.add(
            "show"
        );

    }
);


closePayrollModal.addEventListener(
    "click",
    () => {

        payrollModal.classList.remove(
            "show"
        );

    }
);


payrollModal.addEventListener(
    "click",
    event => {

        if (
            event.target === payrollModal
        ) {

            payrollModal.classList.remove(
                "show"
            );

        }

    }
);

const activityToggle =
    document.getElementById("activityToggle");

const activityCard =
    document.querySelector(".activity-card");


if (activityToggle && activityCard) {

    activityToggle.addEventListener(
        "click",
        () => {

            activityCard.classList.toggle(
                "activity-open"
            );

        }
    );

}













