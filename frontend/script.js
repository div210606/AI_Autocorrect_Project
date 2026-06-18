// --------------------------------------------------
// USER AUTH + STORAGE KEYS
// --------------------------------------------------

const currentUser = localStorage.getItem("username");

if (!currentUser) {
    window.location.href = "login.html";
}

const historyKey = `${currentUser}_history`;
const docKey = `${currentUser}_documents`;
const correctionKey = `${currentUser}_corrections`;

let corrections = Number.parseInt(localStorage.getItem(correctionKey), 10) || 0;


// --------------------------------------------------
// INIT
// --------------------------------------------------

window.addEventListener("DOMContentLoaded", () => {
    const welcomeUser = document.getElementById("welcomeUser");
    if (welcomeUser) {
        welcomeUser.innerHTML = `<h2>Welcome, ${escapeHTML(currentUser)}</h2>`;
    }

    const savedTheme = localStorage.getItem("theme") || "dark";
    applyTheme(savedTheme);

    const savedFontSize = localStorage.getItem("fontSize") || "16px";
    applyFontSize(savedFontSize);

    setText("settingsUsername", currentUser);
    setText("correctionCount", corrections);

    loadHistory();
    loadDocuments();
    updateStats();
});


// --------------------------------------------------
// BACKEND FEATURES
// --------------------------------------------------

async function correctText() {
    const text = getInputText();

    if (!text) {
        alert("Please enter some text.");
        return;
    }

    setResult("Correcting grammar...");

    try {
        const data = await postJSON("http://127.0.0.1:8000/correct", { text });
        const correctedText = data.corrected || data.result || data.text;

        if (!correctedText) {
            throw new Error("Backend response does not contain corrected text.");
        }

        setResult("Corrected Text", correctedText);
        addToHistory(correctedText);
        increaseCorrections();
    } catch (error) {
        console.error(error);
        setResult(
            "Backend Error",
            "Could not call /correct. Make sure FastAPI is running on http://127.0.0.1:8000."
        );
    }
}

async function improveWriting() {
    const text = getInputText();

    if (!text) {
        alert("Please enter some text.");
        return;
    }

    setResult("Improving writing...");

    try {
        const data = await postJSON("http://127.0.0.1:8000/improve", { text });
        const improvedText = data.improved || data.corrected || data.result || data.text;

        if (!improvedText) {
            throw new Error("Backend response does not contain improved text.");
        }

        setResult("Improved Writing", improvedText);
        addToHistory(improvedText);
        increaseCorrections();
    } catch (error) {
        console.error(error);
        setResult(
            "Backend Error",
            "Could not call /improve. Make sure FastAPI is running on http://127.0.0.1:8000."
        );
    }
}


// --------------------------------------------------
// LOCAL WRITING TOOLS
// --------------------------------------------------

function formalTone() {
    const text = getInputText();

    if (!text) {
        alert("Please enter some text.");
        return;
    }

    const formal = text
        .replace(/\bhey\b/gi, "Hello")
        .replace(/\bhi\b/gi, "Hello")
        .replace(/\bbro\b/gi, "colleague")
        .replace(/\bwanna\b/gi, "would like to")
        .replace(/\bgonna\b/gi, "going to")
        .replace(/\bcant\b/gi, "cannot")
        .replace(/\bcan't\b/gi, "cannot")
        .replace(/\bdont\b/gi, "do not")
        .replace(/\bdon't\b/gi, "do not")
        .replace(/\bwont\b/gi, "will not")
        .replace(/\bwon't\b/gi, "will not")
        .replace(/\bisnt\b/gi, "is not")
        .replace(/\bisn't\b/gi, "is not");

    setResult("Formal Version", formal);
    addToHistory(formal);
    increaseCorrections();
}


// --------------------------------------------------
// DASHBOARD ACTIONS
// --------------------------------------------------

async function copyResult() {
    const text = getResultOrInputText();

    if (!text) {
        alert("Nothing to copy yet.");
        return;
    }

    try {
        await navigator.clipboard.writeText(text);
        alert("Copied to clipboard!");
    } catch (error) {
        console.error(error);
        alert("Clipboard access is blocked. Select the text and copy it manually.");
    }
}

function saveDocument() {
    const text = getResultOrInputText();

    if (!text) {
        alert("Enter text first.");
        return;
    }

    let docs = getStoredArray(docKey);

    docs.unshift({
        text,
        date: new Date().toLocaleString()
    });

    docs = docs.slice(0, 10);
    localStorage.setItem(docKey, JSON.stringify(docs));
    loadDocuments();
    alert("Document saved.");
}

function downloadPDF() {
    const text = getResultOrInputText();

    if (!text) {
        alert("Nothing to download.");
        return;
    }

    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert("PDF library is not loaded. Check your internet connection and refresh the page.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text("AI AutoCorrect Assistant", 10, 15);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);

    const lines = pdf.splitTextToSize(text, 180);
    pdf.text(lines, 10, 30);
    pdf.save("ai-autocorrect-result.pdf");
}

function clearText() {
    document.getElementById("inputText").value = "";
    document.getElementById("result").innerHTML = "<h3>Results will appear here...</h3>";
    updateStats();
}


// --------------------------------------------------
// STATS
// --------------------------------------------------

function updateStats() {
    const text = document.getElementById("inputText").value;

    const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
    const chars = text.length;
    const sentences = text.split(/[.!?]+/).filter((sentence) => sentence.trim() !== "").length;

    setText("wordCount", words);
    setText("charCount", chars);
    setText("sentenceCount", sentences);
}

function increaseCorrections() {
    corrections += 1;
    localStorage.setItem(correctionKey, corrections);
    setText("correctionCount", corrections);
}


// --------------------------------------------------
// HISTORY
// --------------------------------------------------

function addToHistory(text) {
    let history = getStoredArray(historyKey);

    history.unshift(text);
    history = history.slice(0, 20);

    localStorage.setItem(historyKey, JSON.stringify(history));
    loadHistory();
}

function loadHistory() {
    const list = document.getElementById("historyList");
    if (!list) return;

    const history = getStoredArray(historyKey);
    list.innerHTML = "";

    if (history.length === 0) {
        list.innerHTML = `<li class="empty-state">No history yet. Start correcting text!</li>`;
        return;
    }

    history.forEach((item, index) => {
        const li = document.createElement("li");
        li.innerHTML = `
            <span>${escapeHTML(item.substring(0, 100))}${item.length > 100 ? "..." : ""}</span>
            <button type="button" onclick="loadHistoryItem(${index})">Load</button>
        `;
        list.appendChild(li);
    });
}

function loadHistoryItem(index) {
    const history = getStoredArray(historyKey);

    if (history[index]) {
        document.getElementById("inputText").value = history[index];
        setResult("Loaded From History", history[index]);
        updateStats();
    }
}

function clearHistory() {
    localStorage.removeItem(historyKey);
    loadHistory();
}


// --------------------------------------------------
// DOCUMENTS
// --------------------------------------------------

function loadDocuments() {
    const list = document.getElementById("docsList");
    if (!list) return;

    const docs = getStoredArray(docKey);
    list.innerHTML = "";

    if (docs.length === 0) {
        list.innerHTML = `<li class="empty-state">No saved documents yet.</li>`;
        return;
    }

    docs.forEach((doc, index) => {
        const li = document.createElement("li");
        const label = `${doc.date || "Saved"} - ${doc.text.substring(0, 80)}${doc.text.length > 80 ? "..." : ""}`;

        li.innerHTML = `
            <span>${escapeHTML(label)}</span>
            <button type="button" onclick="loadDoc(${index})">Load</button>
        `;
        list.appendChild(li);
    });
}

function loadDoc(index) {
    const docs = getStoredArray(docKey);

    if (docs[index]) {
        document.getElementById("inputText").value = docs[index].text;
        setResult("Loaded Document", docs[index].text);
        updateStats();
    }
}


// --------------------------------------------------
// THEME + SETTINGS
// --------------------------------------------------

function toggleTheme() {
    const nextTheme = document.body.classList.contains("dark") ? "light" : "dark";
    applyTheme(nextTheme);
}

function openSettings() {
    setText("settingsUsername", currentUser);

    const panel = document.getElementById("settingsPanel");
    const overlay = document.getElementById("settingsOverlay");

    if (panel) panel.classList.add("show");
    if (overlay) overlay.classList.add("show");
}

function closeSettings() {
    const panel = document.getElementById("settingsPanel");
    const overlay = document.getElementById("settingsOverlay");

    if (panel) panel.classList.remove("show");
    if (overlay) overlay.classList.remove("show");
}

function changeTheme() {
    const theme = document.getElementById("themeSelect").value;
    applyTheme(theme);
}

function changeFontSize() {
    const size = document.getElementById("fontSizeSelect").value;
    applyFontSize(size);
}

function applyTheme(theme) {
    document.body.classList.remove("dark", "light");
    document.body.classList.add(theme);
    localStorage.setItem("theme", theme);

    const themeSelect = document.getElementById("themeSelect");
    if (themeSelect) {
        themeSelect.value = theme;
    }
}

function applyFontSize(size) {
    document.body.style.fontSize = size;
    localStorage.setItem("fontSize", size);

    const fontSizeSelect = document.getElementById("fontSizeSelect");
    if (fontSizeSelect) {
        fontSizeSelect.value = size;
    }
}


// --------------------------------------------------
// LOGOUT
// --------------------------------------------------

function logout() {
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    window.location.href = "login.html";
}


// --------------------------------------------------
// HELPERS
// --------------------------------------------------

async function postJSON(url, body) {
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.detail || `Request failed with status ${response.status}`);
    }

    return data;
}

function getInputText() {
    return document.getElementById("inputText").value.trim();
}

function getResultOrInputText() {
    const resultText = document.getElementById("result").innerText.trim();
    const inputText = getInputText();

    if (resultText && !resultText.includes("Results will appear here")) {
        return resultText;
    }

    return inputText;
}

function getStoredArray(key) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return Array.isArray(value) ? value : [];
    } catch {
        return [];
    }
}

function setResult(title, text = "") {
    const result = document.getElementById("result");

    if (!result) return;

    if (!text) {
        result.innerHTML = `<h3>${escapeHTML(title)}</h3>`;
        return;
    }

    result.innerHTML = `<h3>${escapeHTML(title)}</h3><p>${escapeHTML(text)}</p>`;
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.innerText = value;
    }
}

function escapeHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
