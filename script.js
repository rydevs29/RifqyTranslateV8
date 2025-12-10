// --- 1. INISIALISASI VARIABEL ---
const txtInput = document.getElementById('txtInput');
const txtOutput = document.getElementById('txtOutput');
const txtLoader = document.getElementById('txtLoader');
const txtBadge = document.getElementById('txtBadge');
const voiceTextA = document.getElementById('voiceTextA');
const voiceTransA = document.getElementById('voiceTransA');
const voiceTextB = document.getElementById('voiceTextB');
const voiceTransB = document.getElementById('voiceTransB');
const micBtnA = document.getElementById('micBtnA');
const micBtnB = document.getElementById('micBtnB');
const voiceStatus = document.getElementById('voiceStatus');

// --- 2. LOGIKA SEARCHABLE DROPDOWN ---

// Fungsi Helper: Membuat List HTML
function setupDropdown(db, listId, labelId, inputId, defaultCode) {
    const listEl = document.getElementById(listId);
    const labelEl = document.getElementById(labelId);
    const inputEl = document.getElementById(inputId);

    // Kosongkan list
    listEl.innerHTML = '';

    // Cari bahasa default untuk label awal
    let defaultName = "Pilih Bahasa";
    if (db === langTextDB) {
        const found = db.find(l => l.code === defaultCode);
        if(found) defaultName = found.name;
    } else {
        // Untuk voice DB formatnya array
        const found = db.find((l, i) => i === defaultCode);
        if(found) defaultName = found[0];
    }
    labelEl.innerText = defaultName;
    inputEl.value = defaultCode;

    // Isi List
    db.forEach((lang, index) => {
        const li = document.createElement('li');
        const name = (db === langTextDB) ? lang.name : lang[0];
        const val = (db === langTextDB) ? lang.code : index;

        li.className = "px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white cursor-pointer rounded-md transition flex items-center gap-2";
        li.innerText = name;
        
        li.onclick = () => {
            labelEl.innerText = name;
            inputEl.value = val;
            closeAllDropdowns(); // Tutup dropdown
        };
        listEl.appendChild(li);
    });
}

// Inisialisasi Semua Dropdown
function initAllDropdowns() {
    // 1. Text Mode (Target) - Default English (en)
    setupDropdown(langTextDB, 'listTxtTarget', 'labelTxtTarget', 'valTxtTarget', 'en');
    
    // 2. Voice Mode A (Source) - Default Indo (Index 0)
    setupDropdown(langVoiceDB, 'listVoiceA', 'labelVoiceA', 'valVoiceA', 0);
    
    // 3. Voice Mode B (Lawan) - Default English (Index 1)
    setupDropdown(langVoiceDB, 'listVoiceB', 'labelVoiceB', 'valVoiceB', 1);
}
initAllDropdowns();

// Fungsi Buka/Tutup Dropdown
function toggleDropdown(id) {
    const el = document.getElementById(id);
    const isHidden = el.classList.contains('hidden');
    
    // Tutup semua dulu
    closeAllDropdowns();
    
    // Kalau tadi tertutup, sekarang buka
    if (isHidden) {
        el.classList.remove('hidden');
        // Auto focus ke kotak search
        const searchInput = el.querySelector('input');
        if(searchInput) setTimeout(() => searchInput.focus(), 100);
    }
}

// Fungsi Tutup Semua Dropdown
function closeAllDropdowns(e) {
    const dropdowns = ['ddTxtTarget', 'ddVoiceA', 'ddVoiceB'];
    dropdowns.forEach(id => {
        const el = document.getElementById(id);
        // Cek apakah klik berasal dari tombol trigger dropdown. Jika ya, jangan tutup (biar toggle berfungsi)
        if (e && e.target.closest('button') && e.target.closest('button').getAttribute('onclick')?.includes(id)) {
            return;
        }
        // Jangan tutup jika klik di dalam dropdown (biar bisa ngetik search)
        if (e && el.contains(e.target)) return;
        
        el.classList.add('hidden');
    });
}

// Fungsi Filter Pencarian
function filterLang(searchId, listId) {
    const input = document.getElementById(searchId);
    const filter = input.value.toLowerCase();
    const list = document.getElementById(listId);
    const items = list.getElementsByTagName('li');

    for (let i = 0; i < items.length; i++) {
        const txtValue = items[i].textContent || items[i].innerText;
        if (txtValue.toLowerCase().indexOf(filter) > -1) {
            items[i].style.display = "";
        } else {
            items[i].style.display = "none";
        }
    }
}

// --- 3. LOGIKA TAB ---
function switchTab(mode) {
    const sText = document.getElementById('modeText');
    const sVoice = document.getElementById('modeVoice');
    const tText = document.getElementById('tabText');
    const tVoice = document.getElementById('tabVoice');

    if (mode === 'text') {
        sText.classList.remove('hidden');
        sVoice.classList.add('hidden');
        sVoice.classList.remove('flex');
        tText.className = "flex flex-col items-center gap-1 p-2 text-blue-400 transition";
        tVoice.className = "flex flex-col items-center gap-1 p-2 text-slate-600 hover:text-white transition";
    } else {
        sText.classList.add('hidden');
        sVoice.classList.remove('hidden');
        sVoice.classList.add('flex');
        tText.className = "flex flex-col items-center gap-1 p-2 text-slate-600 hover:text-white transition";
        tVoice.className = "flex flex-col items-center gap-1 p-2 text-orange-400 transition";
    }
}

// --- 4. ENGINE TERJEMAHAN ---
async function coreTranslate(text, sourceAPI, targetAPI) {
    const libreFetch = async (baseUrl, txt) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        try {
            const res = await fetch(baseUrl, {
                method: "POST",
                body: JSON.stringify({ q: txt, source: sourceAPI, target: targetAPI, format: "text" }),
                headers: { "Content-Type": "application/json" },
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!res.ok) throw new Error('Down');
            const json = await res.json();
            return json.translatedText;
        } catch (e) { clearTimeout(timeoutId); throw e; }
    };

    const providers = [
        { name: "Google", url: (t) => `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceAPI}&tl=${targetAPI}&dt=t&q=${encodeURIComponent(t)}`, type: "google" },
        { name: "Lingva", url: (t) => `https://lingva.ml/api/v1/${sourceAPI}/${targetAPI}/${encodeURIComponent(t)}`, type: "lingva" },
        { name: "Lingva SE", url: (t) => `https://lingva.se/api/v1/${sourceAPI}/${targetAPI}/${encodeURIComponent(t)}`, type: "lingva" },
        { name: "MyMemory", fn: async (t) => {
            const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(t)}&langpair=${sourceAPI}|${targetAPI}`);
            const data = await res.json();
            if (data.responseStatus !== 200) throw new Error('Limit');
            return data.responseData.translatedText;
        }, type: "custom" },
        { name: "Libre", fn: (t) => libreFetch("https://translate.argosopentech.com/translate", t), type: "libre" },
        { name: "Libre DE", fn: (t) => libreFetch("https://de.libretranslate.com/translate", t), type: "libre" }
    ];

    for (const p of providers) {
        try {
            let resText = "";
            if (p.type === "google" || p.type === "lingva") {
                const res = await fetch(p.url(text));
                if (!res.ok) continue;
                const data = await res.json();
                resText = (p.type === "lingva") ? data.translation : data[0].map(x => x[0]).join('');
            } else {
                resText = await p.fn(text);
            }
            if (resText) return { text: resText, provider: p.name };
        } catch (e) {}
    }
    return null;
}

// --- 5. LOGIKA MODE TEKS ---
async function runTextTranslate() {
    const text = txtInput.value.trim();
    if (!text) return;

    // AMBIL VALUE DARI HIDDEN INPUT
    const targetCode = document.getElementById('valTxtTarget').value;

    txtOutput.value = "";
    txtOutput.placeholder = ""; 
    txtLoader.classList.remove('hidden'); 
    txtBadge.classList.add('hidden');
    
    const result = await coreTranslate(text, 'auto', targetCode);
    
    txtLoader.classList.add('hidden'); 
    if (result) {
        txtOutput.value = result.text;
        txtBadge.innerText = result.provider;
        txtBadge.classList.remove('hidden');
    } else {
        txtOutput.value = "Gagal. Cek koneksi.";
    }
}

function textSpeak() {
    if (!txtOutput.value) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(txtOutput.value);
    u.lang = document.getElementById('valTxtTarget').value;
    window.speechSynthesis.speak(u);
}

function textCopy() {
    if (txtOutput.value) navigator.clipboard.writeText(txtOutput.value);
}


// --- 6. LOGIKA MODE SUARA ---
let recognition;
let isListening = false;
let activeSide = null;

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
        isListening = true;
        voiceStatus.style.opacity = '1';
        voiceStatus.innerText = "Mendengarkan...";
        if(activeSide === 'A') {
            micBtnA.classList.add('mic-active-blue');
            voiceTextA.innerText = "...";
            voiceTransB.innerText = "";
        } else {
            micBtnB.classList.add('mic-active-orange');
            voiceTextB.innerText = "...";
            voiceTransA.innerText = "";
        }
    };

    recognition.onend = () => {
        isListening = false;
        voiceStatus.style.opacity = '0';
        micBtnA.classList.remove('mic-active-blue');
        micBtnB.classList.remove('mic-active-orange');
        const finalTxt = (activeSide === 'A') ? voiceTextA.innerText : voiceTextB.innerText;
        if(finalTxt && finalTxt !== "...") handleVoiceTranslate(finalTxt);
    };

    recognition.onresult = (e) => {
        const t = Array.from(e.results).map(r => r[0].transcript).join('');
        if(activeSide === 'A') voiceTextA.innerText = t;
        else voiceTextB.innerText = t;
    };
} else {
    alert("Voice tidak support di browser ini.");
}

function startVoice(side) {
    if(isListening) { recognition.stop(); return; }
    activeSide = side;
    
    // AMBIL VALUE DARI HIDDEN INPUT
    const idx = (side === 'A') ? document.getElementById('valVoiceA').value : document.getElementById('valVoiceB').value;
    recognition.lang = langVoiceDB[idx][1]; // Speech Code
    recognition.start();
}

async function handleVoiceTranslate(text) {
    const idxSrc = (activeSide === 'A') ? document.getElementById('valVoiceA').value : document.getElementById('valVoiceB').value;
    const idxTgt = (activeSide === 'A') ? document.getElementById('valVoiceB').value : document.getElementById('valVoiceA').value;
    
    const srcAPI = langVoiceDB[idxSrc][2]; 
    const tgtAPI = langVoiceDB[idxTgt][2];
    
    voiceStatus.innerText = "Menerjemahkan...";
    voiceStatus.style.opacity = '1';

    const res = await coreTranslate(text, srcAPI, tgtAPI);
    
    voiceStatus.style.opacity = '0';
    
    if (res) {
        if(activeSide === 'A') {
            voiceTransB.innerText = res.text;
            voiceSpeak(res.text, langVoiceDB[idxTgt][1]);
        } else {
            voiceTransA.innerText = res.text;
            voiceSpeak(res.text, langVoiceDB[idxTgt][1]);
        }
    }
}

function voiceSpeak(text, lang) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    window.speechSynthesis.speak(u);
}
