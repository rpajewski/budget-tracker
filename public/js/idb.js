let db

const request = indexedDB.open('budget_tracker', 1)

// establish db and create object store
request.onupgradeneeded = function(event) {
    const db = event.target.result

    db.createObjectStore('new_transaction', { autoIncrement: true })
}

// on successful creation of object store 
request.onsuccess = function(event) {
    db = event.target.result
    // if user is connected to the internet upload transaction
    if (navigator.onLine) {
        uploadTransaction()
    }
}

// catch error and log
request.onerror = function(event) {
    console.log(event.target.errorCode)
}

// if no connection save transaction
function saveTransaction(transactions) {
    // open new transaction with db
    const transaction = db.transaction(['new_transaction'], 'readwrite')

    // access object store
    const transactionObjectStore = transaction.objectStore('new_transaction')

    // add transaction to object store
    transactionObjectStore.add(transactions)
}

// upload transaction when reconnected to internet
function uploadTransaction() {
    // open new transaction with db
    const transaction = db.transaction(['new_transaction'], 'readwrite')

    // access object store
    const transactionObjectStore = transaction.objectStore('new_transaction')

    // get all transactions from object store 
    const getAll = transactionObjectStore.getAll()

    getAll.onsuccess = function() {
        // if there is a transaction to send, send it to the server
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                            'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse)
                }
                // open a new transaction with db
                const transaction = db.transaction(['new_transaction'], 'readwrite')

                // access object store
                const transactionObjectStore = transaction.objectStore('new_transaction')

                // clear stored transactions
                transactionObjectStore.clear()

                alert('All transactions have been saved!')
            })
            .catch(err => {
                console.log(err)
            })
        }
    }
}

// listen for app reconnecting to internet
window.addEventListener('online', uploadTransaction)