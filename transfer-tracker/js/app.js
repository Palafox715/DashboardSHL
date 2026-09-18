async function initializeApp() {

    try {

        await initDatabase();

        await renderRecentTransfers();

        await renderHistory();

        await updateDashboard();

    }
    catch (error) {

        console.error(
            "Database error:",
            error
        );

    }

}

initializeApp();

const customerInput = document.getElementById("customerInput");
const phoneInput = document.getElementById("phoneInput");



// Buttons

const approveBtn = document.getElementById("approveBtn");
const declineBtn = document.getElementById("declineBtn");


// Create and save transfer

async function createTransfer(status) {

    const customer = parseCustomer(
        customerInput.value
    );

    const phone = parsePhone(
        phoneInput.value
    );


    if (!customer) {

        alert("Missing customer information");

        customerInput.focus();

        return;

    }


    if (!phone) {

        alert("Missing phone number");

        phoneInput.focus();

        return;

    }


    const transfer = {

        id: crypto.randomUUID(),

        fileNumber: customer.fileNumber,

        customerName: customer.customerName,

        phone: phone.phone,

        status: status,

        timestamp: Date.now()

    };


    await saveTransfer(transfer);

    await renderRecentTransfers();
    
    await updateDashboard();
    
    await renderHistory();
    
    console.log(
        "Saved:",
        transfer
    );


    clearEntry();

}



// Clear after save

function clearEntry(){

    customerInput.value = "";

    phoneInput.value = "";

    customerInput.focus();

}



// Button events

approveBtn.addEventListener(
    "click",
    () => createTransfer("approved")
);


declineBtn.addEventListener(
    "click",
    () => createTransfer("declined")
);




// Display today's date
document.getElementById("currentDate").textContent =
    new Date().toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric"
    });



// Focus customer box when app loads
customerInput.focus();



// Export raw transfer data as JSON backup

async function exportBackup() {

    try {

        const transfers =
            await getTransfers();


        const backup =
            JSON.stringify(
                transfers,
                null,
                4
            );


        const blob =
            new Blob(
                [backup],
                {
                    type:"application/json"
                }
            );


        const url =
            URL.createObjectURL(blob);


        const link =
            document.createElement("a");


        const date =
            new Date()
                .toISOString()
                .slice(0,10);


        link.href = url;

        link.download =
            `transfer-tracker-backup-${date}.json`;


        document
            .body
            .appendChild(link);


        link.click();


        link.remove();


        URL.revokeObjectURL(url);


        document
            .getElementById("backupStatus")
            .textContent =
                "Backup exported successfully.";


    }
    catch(error) {

        console.error(
            "Backup export error:",
            error
        );


        document
            .getElementById("backupStatus")
            .textContent =
                "Backup export failed.";

    }

}

document
    .getElementById("exportBackupBtn")
    .addEventListener(
        "click",
        exportBackup
    );



// Import backup

const importBackupBtn =
    document.getElementById("importBackupBtn");

const importBackupInput =
    document.getElementById("importBackupInput");

const backupStatus =
    document.getElementById("backupStatus");


importBackupBtn.addEventListener(
    "click",
    () => {

        importBackupInput.click();

    }
);


importBackupInput.addEventListener(
    "change",
    async event => {

        const file =
            event.target.files[0];

        if (!file) {
            return;
        }


        try {

            const text =
                await file.text();


            const data =
                JSON.parse(text);


            if (!Array.isArray(data)) {

                throw new Error(
                    "Backup must contain a transfer list."
                );

            }


            for (
                let i = 0;
                i < data.length;
                i++
            ) {

                const transfer = data[i];


                if (
                    !transfer ||
                    typeof transfer !== "object"
                ) {

                    throw new Error(
                        `Record ${i + 1} is not a valid transfer object.`
                    );

                }


                if (
                    typeof transfer.id !== "string" ||
                    !transfer.id
                ) {

                    throw new Error(
                        `Record ${i + 1} is missing a valid ID.`
                    );

                }


                if (
                    typeof transfer.fileNumber !== "string"
                ) {

                    throw new Error(
                        `Record ${i + 1} has an invalid file number.`
                    );

                }


                if (
                    typeof transfer.customerName !== "string"
                ) {

                    throw new Error(
                        `Record ${i + 1} has an invalid customer name.`
                    );

                }


                if (
                    typeof transfer.phone !== "string"
                ) {

                    throw new Error(
                        `Record ${i + 1} has an invalid phone number.`
                    );

                }


                if (
                    transfer.status !== "approved" &&
                    transfer.status !== "declined"
                ) {

                    throw new Error(
                        `Record ${i + 1} has an invalid status.`
                    );

                }


                if (
                    typeof transfer.timestamp !== "number" ||
                    !Number.isFinite(
                        transfer.timestamp
                    )
                ) {

                    throw new Error(
                        `Record ${i + 1} is missing a valid timestamp.`
                    );

                }

            }


            const result =
            await importTransfers(data);
        
        
        backupStatus.textContent =
            `Backup restored — ${result.importedCount} transfers imported. ` +
            `${result.skippedCount} already existed and were skipped.`;


            await renderRecentTransfers();

            await updateDashboard();
            
            await renderHistory();


        }
        catch(error) {

            console.error(
                "Backup validation error:",
                error
            );


            backupStatus.textContent =
                `Import failed: ${error.message}`;

        }


        // Allow the same file to be selected again

        importBackupInput.value = "";

    }
);


// Clear local transfer data

const clearLocalDataBtn =
    document.getElementById("clearLocalDataBtn");


clearLocalDataBtn.addEventListener(
    "click",
    async () => {

        const confirmed =
            confirm(
                "Clear all local Transfer Tracker data?\n\n" +
                "This will permanently remove all transfer records " +
                "stored on this device.\n\n" +
                "Make sure you have a backup before continuing."
            );


        if (!confirmed) {

            return;

        }


        try {

            const deletedCount =
                await clearAllTransfers();


            await renderRecentTransfers();

            await updateDashboard();

            await renderHistory();


            backupStatus.textContent =
                `Local data cleared — ${deletedCount} transfers removed.`;


        }
        catch(error) {

            console.error(
                "Clear local data error:",
                error
            );


            backupStatus.textContent =
                "Unable to clear local transfer data.";

        }

    }
);










