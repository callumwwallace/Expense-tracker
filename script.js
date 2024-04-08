document.addEventListener('DOMContentLoaded', function () {
    const createSaveForm = document.getElementById('createsavefile');
    const loadSaveForm = document.getElementById('loadsavefile');
    const transactionForm = document.getElementById('addtransaction');
    const noteForm = document.getElementById('addnote');
    const transactionList = document.getElementById('transactionlist');
    const notesList = document.getElementById('noteslist');
    const balanceElement = document.getElementById('balance');
    const incomeElement = document.getElementById('income');
    const expenseElement = document.getElementById('expense');

    let userData = {
        username: '',
        password: '',
        transactions: [],
        notes: []
    };

    function updateUI() {
        let balance = 0, income = 0, expense = 0;
        userData.transactions.forEach(t => {
            if (t.type === 'income') {
                income += t.amount;
            } else {
                expense += t.amount;
            }
        });
        balance = income - expense;
        balanceElement.textContent = `£${balance.toFixed(2)}`;
        incomeElement.textContent = `£${income.toFixed(2)}`;
        expenseElement.textContent = `£${expense.toFixed(2)}`;

        transactionList.innerHTML = '';
        userData.transactions.forEach((t, index) => {
            const li = document.createElement('li');
            li.innerHTML = `${t.date} - ${t.name}: £${t.amount.toFixed(2)} (${t.type}) <button class="delete-btn" data-index="${index}" data-type="transaction">🗑️</button>`;
            transactionList.appendChild(li);
        });

        notesList.innerHTML = '';
        userData.notes.forEach((n, index) => {
            const li = document.createElement('li');
            li.innerHTML = `${n} <button class="delete-btn" data-index="${index}" data-type="note">🗑️</button>`;
            notesList.appendChild(li);
        });

        // Check if the number of transactions exceeds 5 and add a class to enable scrolling
        if (userData.transactions.length > 4) {
            document.getElementById('transactions').classList.add('scrollable');
        } else {
            document.getElementById('transactions').classList.remove('scrollable');
        }
    }



    createSaveForm.addEventListener('submit', function (e) {
        e.preventDefault();
        userData.username = createSaveForm.savefileusername.value;
        userData.password = createSaveForm.savefilepassword.value;

        const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(userData), 'secret key').toString();

        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(encryptedData);
        const dlAnchorElem = document.createElement('a');
        dlAnchorElem.setAttribute('href', dataStr);
        dlAnchorElem.setAttribute('download', `${userData.username}.json`);
        dlAnchorElem.click();
    });

    loadSaveForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const file = loadSaveForm.loadsavefilefile.files[0];
        const inputPassword = loadSaveForm.loadsavefilepassword.value;

        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const decryptedData = CryptoJS.AES.decrypt(e.target.result, 'secret key').toString(CryptoJS.enc.Utf8);
                userData = JSON.parse(decryptedData);

                if (userData.password === inputPassword) {
                    updateUI();
                } else {
                    alert('Incorrect password!');
                }
            } catch (error) {
                alert('Failed to decrypt or parse the data. Please ensure you have the correct file and password.');
            }
        };
        reader.readAsText(file);
    });

    transactionForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const transaction = {
            type: transactionForm.type.checked ? 'income' : 'expense',
            name: transactionForm.name.value,
            date: transactionForm.date.value,
            amount: parseFloat(transactionForm.amount.value)
        };
        userData.transactions.push(transaction);
        updateUI();
    });

    noteForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const note = noteForm.notetext.value;
        userData.notes.push(note);
        updateUI();
    });

    document.getElementById('transactions').addEventListener('click', function (e) {
        if (e.target && e.target.nodeName === "BUTTON" && e.target.classList.contains('delete-btn')) {
            const index = e.target.dataset.index;
            if (e.target.dataset.type === 'transaction') {
                userData.transactions.splice(index, 1);
                updateUI();
            }
        }
    });

    document.getElementById('usernoteslist').addEventListener('click', function (e) {
        if (e.target && e.target.nodeName === "BUTTON" && e.target.classList.contains('delete-btn')) {
            const index = e.target.dataset.index;
            if (e.target.dataset.type === 'note') {
                userData.notes.splice(index, 1);
                updateUI();
            }
        }
    });

    // Theme toggle
    const themeToggleButton = document.getElementById('theme-toggle');
    themeToggleButton.addEventListener('click', function () {
        document.body.classList.toggle('dark-theme');
        let mode = document.body.classList.contains('dark-theme') ? 'Light Theme' : 'Dark Theme';
        this.textContent = mode;
        this.setAttribute('aria-label', `Switch to ${mode}`);
    });
});
