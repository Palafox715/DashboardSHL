// storage.js

const DB_NAME = "TransferTrackerDB";
const DB_VERSION = 1;
const STORE_NAME = "transfers";

let db;


// Open database
function initDatabase() {

    return new Promise((resolve, reject) => {

        const request = indexedDB.open(DB_NAME, DB_VERSION);


        request.onupgradeneeded = function(event) {

            const database = event.target.result;


            if (!database.objectStoreNames.contains(STORE_NAME)) {

                const store = database.createObjectStore(
                    STORE_NAME,
                    {
                        keyPath: "id"
                    }
                );


                store.createIndex(
                    "timestamp",
                    "timestamp"
                );


                store.createIndex(
                    "status",
                    "status"
                );


                store.createIndex(
                    "fileNumber",
                    "fileNumber"
                );

            }

        };


        request.onsuccess = function(event) {

            db = event.target.result;

            resolve(db);

        };


        request.onerror = function(event) {

            reject(event.target.error);

        };


    });

}



// Save transfer
function saveTransfer(transfer) {

    return new Promise((resolve, reject) => {


        const transaction = db.transaction(
            STORE_NAME,
            "readwrite"
        );


        const store = transaction.objectStore(
            STORE_NAME
        );


        const request = store.add(transfer);


        request.onsuccess = function() {

            resolve(transfer);

        };


        request.onerror = function() {

            reject(request.error);

        };


    });

}



// Get all transfers
function getTransfers() {

    return new Promise((resolve, reject) => {


        const transaction = db.transaction(
            STORE_NAME,
            "readonly"
        );


        const store = transaction.objectStore(
            STORE_NAME
        );


        const request = store.getAll();


        request.onsuccess = function() {

            resolve(request.result);

        };


        request.onerror = function() {

            reject(request.error);

        };


    });

}


// Get newest transfers first

function getRecentTransfers(limit = 20) {

    return new Promise((resolve, reject) => {


        const transaction = db.transaction(
            STORE_NAME,
            "readonly"
        );


        const store = transaction.objectStore(
            STORE_NAME
        );


        const request = store.index(
            "timestamp"
        ).openCursor(
            null,
            "prev"
        );


        const results = [];


        request.onsuccess = function(event) {

            const cursor = event.target.result;


            if (cursor && results.length < limit) {

                results.push(cursor.value);

                cursor.continue();

            } 
            else {

                resolve(results);

            }

        };


        request.onerror = function() {

            reject(request.error);

        };


    });

}


// Delete one transfer by ID
function deleteTransfer(id) {

    return new Promise((resolve, reject) => {

        const transaction = db.transaction(
            STORE_NAME,
            "readwrite"
        );


        const store =
            transaction.objectStore(
                STORE_NAME
            );


        store.delete(id);


        transaction.oncomplete = function () {

            resolve();

        };


        transaction.onerror = function () {

            reject(
                transaction.error
            );

        };

    });

}


// Clear all local transfer records
function clearAllTransfers() {

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                STORE_NAME,
                "readwrite"
            );


        const store =
            transaction.objectStore(
                STORE_NAME
            );


        const countRequest =
            store.count();


        countRequest.onsuccess = function() {

            const deletedCount =
                countRequest.result;


            store.clear();


            transaction.oncomplete =
                function() {

                    resolve(
                        deletedCount
                    );

                };


            transaction.onerror =
                function() {

                    reject(
                        transaction.error ||
                        new Error(
                            "Unable to clear local transfers."
                        )
                    );

                };


            transaction.onabort =
                function() {

                    reject(
                        transaction.error ||
                        new Error(
                            "Clear transaction was aborted."
                        )
                    );

                };

        };


        countRequest.onerror =
            function() {

                reject(
                    countRequest.error ||
                    new Error(
                        "Unable to count local transfers."
                    )
                );

            };

    });

}









// Import multiple transfers safely
function importTransfers(transfers) {

    return new Promise((resolve, reject) => {

        const readTransaction =
            db.transaction(
                STORE_NAME,
                "readonly"
            );


        const readStore =
            readTransaction.objectStore(
                STORE_NAME
            );


        const request =
            readStore.getAllKeys();


        request.onsuccess = function() {

            const existingIds =
                new Set(request.result);


            const newTransfers =
                transfers.filter(
                    transfer =>
                        !existingIds.has(
                            transfer.id
                        )
                );


            const skippedCount =
                transfers.length -
                newTransfers.length;


            if (!newTransfers.length) {

                resolve({
                    importedCount: 0,
                    skippedCount
                });

                return;

            }


            const transaction =
                db.transaction(
                    STORE_NAME,
                    "readwrite"
                );


            const store =
                transaction.objectStore(
                    STORE_NAME
                );


            let importedCount = 0;


            newTransfers.forEach(
                transfer => {

                    const addRequest =
                        store.add(transfer);


                    addRequest.onsuccess =
                        function() {

                            importedCount++;

                        };

                }
            );


            transaction.oncomplete =
                function() {

                    resolve({

                        importedCount,

                        skippedCount

                    });

                };


            transaction.onerror =
                function() {

                    reject(
                        transaction.error ||
                        new Error(
                            "Import transaction failed."
                        )
                    );

                };


            transaction.onabort =
                function() {

                    reject(
                        transaction.error ||
                        new Error(
                            "Import transaction was aborted."
                        )
                    );

                };

        };


        request.onerror = function() {

            reject(
                request.error ||
                new Error(
                    "Unable to check existing transfers."
                )
            );

        };

    });

}







