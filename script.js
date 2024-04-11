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
    const aiSuggestionForm = document.getElementById('aiSuggestionList');
    const aiSuggestionsList = document.getElementById('aiSuggestionsList');

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

    const themeToggleButton = document.getElementById('theme-toggle');
    themeToggleButton.addEventListener('click', function () {
        document.body.classList.toggle('dark-theme');
        let mode = document.body.classList.contains('dark-theme') ? 'Light Theme' : 'Dark Theme';
        this.textContent = mode;
        this.setAttribute('aria-label', `Switch to ${mode}`);
    });

    // AI suggestions form event listener
    aiSuggestionForm.addEventListener('submit', function(e) {
        e.preventDefault();
        fetchAIRecommendations();
    });

    function fetchAIRecommendations() {
        let income = 0, expense = 0;
        userData.transactions.forEach(t => {
            if (t.type === 'income') {
                income += t.amount;
            } else if (t.type === 'expense') {
                expense += t.amount;
            }
        });
        let balance = income - expense;

        let financialData = {
            transactions: userData.transactions,
            income: income,
            expense: expense,
            balance: balance
        };

        const prompt = createFinancialSummaryPrompt(financialData);

        const data = {
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are a financial advisor. Provide suggestions on how to save money." },
                { role: "user", content: prompt }
            ],
            temperature: 0.7
        };

        fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer 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'
            },
            body: JSON.stringify(data),
        })
            .then(response => response.json())
            .then(data => {
                if (data && data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
                    displayAISuggestions(data.choices[0].message.content);
                } else {
                    console.error('No suggestions returned or unexpected response structure:', data);
                }
            })
            .catch(error => console.error('Error fetching AI recommendations:', error));
    }

    function createFinancialSummaryPrompt(financialData) {
        let prompt = 'Here are my financial details:\n';
        prompt += financialData.transactions.map((t, index) => {
            return `Transaction ${index + 1}: ${t.type} of £${t.amount.toFixed(2)} on ${t.date} for ${t.name}`;
        }).join('\n') + '\n';

        prompt += `Total income: £${financialData.income.toFixed(2)}\n`;
        prompt += `Total expenses: £${financialData.expense.toFixed(2)}\n`;
        prompt += `Net balance: £${financialData.balance.toFixed(2)}\n`;
        prompt += 'Can you provide suggestions on how to save money or reduce expenses?';
        return prompt;
    }

    function displayAISuggestions(suggestions) {
        aiSuggestionsList.innerHTML = '';
        const maxSuggestions = 5; // Replace X with the number of suggestions you want to display
        const suggestionArray = suggestions.split('\n').filter(suggestion => suggestion.trim() !== '');

        for (let i = 0; i < Math.min(maxSuggestions, suggestionArray.length); i++) {
            const li = document.createElement('li');
            li.textContent = suggestionArray[i];
            aiSuggestionsList.appendChild(li);
        }
    }

});

document.addEventListener('DOMContentLoaded', function () {
    const fontSizeToggleButton = document.getElementById('font-size-toggle');
    let currentFontSizeIndex = 0; // 0 for default, 1 for larger, -1 for smaller
    const fontSizes = ['0.875em', '1em', '1.125em']; // Smaller, default, larger

    fontSizeToggleButton.addEventListener('click', function () {
        currentFontSizeIndex++;
        if (currentFontSizeIndex > 1) currentFontSizeIndex = -1;
        document.documentElement.style.fontSize = fontSizes[currentFontSizeIndex + 1];
    });
});
