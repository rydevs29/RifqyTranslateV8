// --- 1. DATABASE BAHASA RAKSASA (Unified) ---
// Format: [Nama Bahasa, Kode Speech, Kode API Translate, Flag]
const langDB = [
    ["Indonesia", "id-ID", "id", "🇮🇩"],
    ["English (US)", "en-US", "en", "🇺🇸"],
    ["English (UK)", "en-GB", "en", "🇬🇧"],
    ["Japanese", "ja-JP", "ja", "🇯🇵"],
    ["Korean", "ko-KR", "ko", "🇰🇷"],
    ["Arabic", "ar-SA", "ar", "🇸🇦"],
    ["Chinese (CN)", "zh-CN", "zh-CN", "🇨🇳"],
    ["Javanese", "jv-ID", "jw", "🇮🇩"],
    ["Sundanese", "su-ID", "su", "🇮🇩"],
    ["Spanish", "es-ES", "es", "🇪🇸"],
    ["French", "fr-FR", "fr", "🇫🇷"],
    ["German", "de-DE", "de", "🇩🇪"],
    ["Russian", "ru-RU", "ru", "🇷🇺"],
    ["Italian", "it-IT", "it", "🇮🇹"],
    ["Dutch", "nl-NL", "nl", "🇳🇱"],
    ["Turkish", "tr-TR", "tr", "🇹🇷"],
    ["Thai", "th-TH", "th", "🇹🇭"],
    ["Vietnamese", "vi-VN", "vi", "🇻🇳"],
    ["Hindi", "hi-IN", "hi", "🇮🇳"],
    ["Malay", "ms-MY", "ms", "🇲🇾"]
    // Bisa ditambahkan 100+ lagi sesuai kebutuhan
];

// --- 2. INISIALISASI ---
// Text Mode Elements
const txtInput = document.getElementById('txtInput');
const txtOutput = document.getElementById('txtOutput');
const txtTargetLang = document.getElementById('txtTargetLang');
const txtLoader = document.getElementById('txtLoader');
const txtBadge = document.getElementById('txtBadge');

// Voice Mode Elements
const voiceLangA = document.getElementById('voiceLangA');
const voiceLangB = document.getElementById('voiceLangB');
const voiceTextA = document.getElementById('voiceTextA');
const voiceTransA = document.getElementById('voiceTransA');
const voiceTextB = document.getElementById('voiceTextB');
const voiceTransB = document.getElementById('voiceTransB');
const btnVoiceA = document.getElementById('btnVoiceA');
const btnVoiceB = document.getElementById('btnVoiceB');
const voiceStatus = document.getElementById('voiceStatus');

// Populate Dropdowns
function initDropdowns() {
    langDB.forEach((l, i) => {
        // Untuk Text Mode
        let optText = new Option(`${l[3]} ${l[0]}`, l[2]);
        txtTargetLang.add(optText);

        // Untuk Voice Mode
        let optVA = new Option(`${l[3]} ${l[0]}`, i);
        let optVB = new Option(`${l[3]} ${l[0]}`, i);
        voiceLangA.add(optVA);
        voiceLangB.add(optVB);
    });

    // Set Defaults
    txtTargetLang.value = "en"; // Default Text: English
    voiceLangA.selectedIndex = 0; // Default Voice A: Indo
    voiceLangB.selectedIndex = 1; // Default Voice B: English
}
initDropdowns();


// --- 3. SYSTEM TAB NAVIGASI ---
function switchTab(mode) {
    const sectionText = document.getElementById('modeText');
    const sectionVoice = document.getElementById('modeVoice');
    const tabText = document.getElementById('tabText');
    const tabVoice = document.getElementById('tabVoice');

    if (mode === 'text') {
        sectionText.classList.remove('hidden');
        sectionVoice.classList.add('hidden');
        sectionVoice.classList.remove('flex');
        
        tabText.className = "flex flex-col items-center gap-1 p-2 text-blue-400 transition";
        tabVoice.className = "flex flex-col items-center gap-1 p-2 text-slate-600 hover:text-white transition";
    } else {
        sectionText.classList.add('hidden');
        sectionVoice.classList.remove('hidden');
        sectionVoice.classList.add('flex');
        
        tabText.className = "flex flex-col items-center gap-1 p-2 text-slate-600 hover:text-white transition";
        tabVoice.className = "flex flex-col items-center gap-1 p-2 text-orange-400 transition";
    }
}


// --- 4. CORE TRANSLATION ENGINE (GOD MODE 25+ SERVERS) ---
// Dipakai oleh Text Mode DAN Voice Mode
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
        { name: "Google Dict", url: (t) => `https://translate.googleapis.com/translate_a/single?client=dict-chrome-ex&sl=${sourceAPI}&tl=${targetAPI}&dt=t&q=${encodeURIComponent(t)}`, type: "google" },
        { name: "Lingva", url: (t) => `https://lingva.ml/api/v1/${sourceAPI}/${targetAPI}/${encodeURIComponent(t)}`, type: "lingva" },
        { name: "Lingva SE", url: (t) => `https://lingva.se/api/v1/${sourceAPI}/${targetAPI}/${encodeURIComponent(t)}`, type: "lingva" },
        { name: "Lingva PL", url: (t) => `https://translate.ploud.jp/api/v1/${sourceAPI}/${targetAPI}/${encodeURIComponent(t)}`, type: "lingva" },
        { name: "Libre", fn: (t) => libreFetch("https://translate.argosopentech.com/translate", t), type: "libre" },
        { name: "Libre DE", fn: (t) => libreFetch("https://de.libretranslate.com/translate", t), type: "libre" }
    ];

    for (const provider of providers) {
        try {
            let resText = "";
            if (provider.type === "google" || provider.type === "lingva") {
                const res = await fetch(provider.url(text));
                if (!res.ok) continue;
                const data = await res.json();
                resText = (provider.type === "lingva") ? data.translation : data[0].map(x => x[0]).join('');
            } else {
                resText = await provider.fn(text);
            }
            if (resText) return { text: resText, provider: provider.name };
        } catch (e) {}
    }
    return null;
}


// --- 5. LOGIC MODE TEKS ---
async function runTextTranslate() {
    const text = txtInput.value.trim();
    if (!text) return;
    
    txtOutput.value = "";
    txtLoader.classList.remove('hidden');
    txtBadge.classList.add('hidden');
    
    const result = await coreTranslate(text, 'auto', txtTargetLang.value);
    
    txtLoader.classList.add('hidden');
    if (result) {
        txtOutput.value = result.text;
        txtBadge.innerText = result.provider;
        txtBadge.classList.remove('hidden');
    } else {
        txtOutput.value = "Error: Semua server sibuk.";
    }
}

function textSpeak() {
    if (!txtOutput.value) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(txtOutput.value);
    u.lang = txtTargetLang.value;
    window.speechSynthesis.speak(u);
}

function textCopy() {
    if (txtOutput.value) navigator.clipboard.writeText(txtOutput.value);
}


// --- 6. LOGIC MODE SUARA (DUAL WAY) ---
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
            btnVoiceA.classList.add('mic-active-blue');
            voiceTextA.innerText = "...";
            voiceTransB.innerText = "";
        } else {
            btnVoiceB.classList.add('mic-active-orange');
            voiceTextB.innerText = "...";
            voiceTransA.innerText = "";
        }
    };

    recognition.onend = () => {
        isListening = false;
        voiceStatus.style.opacity = '0';
        btnVoiceA.classList.remove('mic-active-blue');
        btnVoiceB.classList.remove('mic-active-orange');
        
        const finalTxt = (activeSide === 'A') ? voiceTextA.innerText : voiceTextB.innerText;
        if(finalTxt && finalTxt !== "...") handleVoiceTranslate(finalTxt);
    };

    recognition.onresult = (e) => {
        const t = Array.from(e.results).map(r => r[0].transcript).join('');
        if(activeSide === 'A') voiceTextA.innerText = t;
        else voiceTextB.innerText = t;
    };
} else {
    alert("Browser tidak support Voice Recognition.");
}

function startVoice(side) {
    if(isListening) { recognition.stop(); return; }
    activeSide = side;
    const idx = (side === 'A') ? voiceLangA.value : voiceLangB.value;
    recognition.lang = langDB[idx][1]; // Speech Code
    recognition.start();
}

async function handleVoiceTranslate(text) {
    const idxSrc = (activeSide === 'A') ? voiceLangA.value : voiceLangB.value;
    const idxTgt = (activeSide === 'A') ? voiceLangB.value : voiceLangA.value;
    
    const srcAPI = langDB[idxSrc][2];
    const tgtAPI = langDB[idxTgt][2];
    
    voiceStatus.innerText = "Menerjemahkan...";
    voiceStatus.style.opacity = '1';

    const res = await coreTranslate(text, srcAPI, tgtAPI);
    
    voiceStatus.style.opacity = '0';
    
    if (res) {
        if(activeSide === 'A') {
            voiceTransB.innerText = res.text;
            voiceSpeak(res.text, langDB[idxTgt][1]);
        } else {
            voiceTransA.innerText = res.text;
            voiceSpeak(res.text, langDB[idxTgt][1]);
        }
    }
}

function voiceSpeak(text, lang) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    window.speechSynthesis.speak(u);
}
