// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDtMT6TFTeBvbXLw821bMDsCO3AuNtDDu4",
    authDomain: "congratulations-cards.firebaseapp.com",
    projectId: "congratulations-cards",
    storageBucket: "congratulations-cards.firebasestorage.app",
    messagingSenderId: "576706587851",
    appId: "1:576706587851:web:7b28317863621b1d607f4e",
    measurementId: "G-DW3ZW98WSB",
    databaseURL: "https://congratulations-cards-default-rtdb.firebaseio.com/"
};

//AOS animation only
  AOS.init();
  
// Initialize Firebase
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
}

const database = (typeof firebase !== 'undefined') ? firebase.database() : null;
let confettiInstance = null;

// Music Track URLs
const musicTracks = {
    'birthday': 'assets/image/mixkit-party-like-its-your-birthday-1115.mp3',
    'wedding': 'assets/image/mixkit-wedding-harp-672.mp3',
    'congrats': 'assets/image/mixkit-birthday-gift-791 (1).mp3',
    'thankyou': 'assets/image/mixkit-smile-1076.mp3',
    'wishes': 'assets/image/mixkit-classical-vibes-5-688.mp3',
    'romantic': 'assets/image/mixkit-romantic-659.mp3'
};

function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredThemePreference() {
    return localStorage.getItem('card-theme') || 'dark';
}

function getResolvedTheme(themeMode) {
    if (!themeMode || themeMode === 'system') {
        return getSystemTheme();
    }
    return themeMode;
}

function getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme') || getResolvedTheme(getStoredThemePreference());
}

function syncThemeButtons(themePreference) {
    const buttons = document.querySelectorAll('.theme-switch-btn');
    buttons.forEach((button) => {
        const isSelected = button.dataset.theme === themePreference;
        button.classList.toggle('selected', isSelected);
    });

    const themeInput = document.getElementById('themeInput');
    if (themeInput) {
        themeInput.value = getResolvedTheme(themePreference);
    }
}

function applyTheme(themePreference) {
    const preference = themePreference || getStoredThemePreference() || 'dark';
    const resolvedTheme = getResolvedTheme(preference);

    document.documentElement.setAttribute('data-theme', resolvedTheme);
    localStorage.setItem('card-theme', preference);
    syncThemeButtons(preference);
    // When applying a theme interactively, remove any inline page color override
    // so the CSS [data-theme] rules take effect. applyCardTheme will re-apply
    // a stored custom page color when rendering a saved card.
    document.documentElement.style.removeProperty('--bg-dark');
    if (document.body) {
        document.body.style.backgroundColor = '';
        document.body.style.backgroundImage = '';
    }
}

function initThemeSwitcher() {
    const buttons = document.querySelectorAll('.theme-switch-btn');

    buttons.forEach((button) => {
        button.addEventListener('click', () => {
            applyTheme(button.dataset.theme);
        });
    });

    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (getStoredThemePreference() === 'system') {
                applyTheme('system');
            }
        });
    }
}

function hexToRgba(hex, alpha) {
    const clean = (hex || '#ffffff').replace('#', '');
    const normalized = clean.length === 3 ? clean.split('').map((char) => char + char).join('') : clean;
    const int = parseInt(normalized, 16);
    const r = (int >> 16) & 255;
    const g = (int >> 8) & 255;
    const b = int & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getCssColorVar(name, fallback) {
    return (getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback);
}

function getDefaultThemeColors() {
    return {
        pageColor: getCssColorVar('--bg-dark', '#050505'),
        cardColor: getCssColorVar('--card-bg', '#111111'),
        textColor: getCssColorVar('--text-main', '#ffffff')
    };
}

function applyCardTheme({ pageColor, cardColor, textColor, themeMode } = {}) {
    const defaults = getDefaultThemeColors();
    const currentTheme = themeMode || getCurrentTheme() || 'dark';
    applyTheme(currentTheme);
    // Only override --bg-dark if user picked a custom color
    if (pageColor && pageColor !== '' && pageColor !== '#050505' && pageColor !== '#ffffff') {
        document.documentElement.style.setProperty('--bg-dark', pageColor);
        document.body.style.backgroundColor = pageColor;
        document.body.style.backgroundImage = 'none';
    } else {
        document.documentElement.style.removeProperty('--bg-dark');
        document.body.style.backgroundColor = '';
        document.body.style.backgroundImage = '';
    }
    document.documentElement.style.setProperty('--card-bg', cardColor || defaults.cardColor);
    document.documentElement.style.setProperty('--text-main', textColor || defaults.textColor);
    document.documentElement.style.setProperty('--text-dim', hexToRgba((textColor || defaults.textColor), 0.65));
    document.documentElement.style.setProperty('--heading-accent', textColor || defaults.textColor);
    const status = document.getElementById('colorThemeStatus');
    if (status) status.textContent = '';
}

function refreshColorInputs(savedColors = {}) {
    const defaults = getDefaultThemeColors();
    const textColorInput = document.getElementById('textColorInput');
    const cardColorInput = document.getElementById('cardColorInput');
    const pageColorInput = document.getElementById('pageColorInput');

    if (textColorInput) textColorInput.value = savedColors.textColor || defaults.textColor;
    if (cardColorInput) cardColorInput.value = savedColors.cardColor || defaults.cardColor;
    if (pageColorInput) pageColorInput.value = savedColors.pageColor || defaults.pageColor;
}

function previewColorTheme() {
    const textColor = document.getElementById('textColorInput')?.value;
    const cardColor = document.getElementById('cardColorInput')?.value;
    const pageColor = document.getElementById('pageColorInput')?.value;

    applyCardTheme({
        pageColor,
        cardColor,
        textColor,
        themeMode: localStorage.getItem('card-theme') || 'dark'
    });
}

function toggleColorThemeFlyout() {
    const flyout = document.getElementById('colorThemeFlyout');
    if (flyout) flyout.classList.toggle('visible');
}

function saveCardTheme() {
    const textColor = document.getElementById('textColorInput')?.value;
    const cardColor = document.getElementById('cardColorInput')?.value;
    const pageColor = document.getElementById('pageColorInput')?.value;
    const currentTheme = document.documentElement.getAttribute('data-theme') || localStorage.getItem('card-theme') || 'dark';
    const themeData = {
        pageColor,
        cardColor,
        textColor,
        themeMode: currentTheme
    };
    const status = document.getElementById('colorThemeStatus');

    localStorage.setItem('card-custom-theme', JSON.stringify(themeData));

    if (!window.cardId) {
        if (status) status.textContent = 'Theme saved locally.';
        return;
    }

    if (!database) {
        if (status) status.textContent = 'Theme saved locally.';
        return;
    }

    database.ref('cards/' + window.cardId).update({
        pc: pageColor,
        cc: cardColor,
        tc: textColor,
        h: currentTheme
    }).then(() => {
        if (status) status.textContent = 'Theme saved successfully.';
        const flyout = document.getElementById('colorThemeFlyout');
        if (flyout) flyout.classList.remove('visible');
    }).catch(() => {
        if (status) status.textContent = 'Theme saved locally. Firebase sync failed.';
    });
}

function toggleTheme() {
    const current = getCurrentTheme();
    const next = current === 'light' ? 'dark' : 'light';
    applyTheme(next);
}

const cardDesigns = ['classic', 'sparkle', 'firework', 'confetti'];

function applyDesign(design) {
    const selected = cardDesigns.includes(design) ? design : 'sparkle';
    const body = document.body;
    const html = document.documentElement;
    const removeClasses = cardDesigns.map((d) => `design-${d}`);
    html.classList.remove(...removeClasses);
    body.classList.remove(...removeClasses);
    html.classList.add(`design-${selected}`);
    body.classList.add(`design-${selected}`);
    body.dataset.design = selected;
    startDesignAnimation(selected);
}

function startDesignAnimation(design) {
    const currentConfetti = confettiInstance || (typeof confetti !== 'undefined' ? confetti : null);
    if (!currentConfetti) return;

    if (window.cardAnimationInterval) {
        clearInterval(window.cardAnimationInterval);
    }

    const trigger = () => {
        switch (design) {
            case 'sparkle':
                sparkleBurst(currentConfetti);
                break;
            case 'firework':
                fireworkBlast(currentConfetti);
                break;
            case 'confetti':
                confettiRain(currentConfetti);
                break;
            default:
                classicBurst(currentConfetti);
        }
    };

    trigger();
    window.cardAnimationInterval = setInterval(trigger, 4200);
}

function classicBurst(confettiFn) {
    confettiFn({
        particleCount: 15,
        spread: 90,
        origin: { x: 0.5, y: 0.2 },
        colors: ['#d4af37', '#ffffff', '#996515'],
        scalar: 1.2
    });
}

function sparkleBurst(confettiFn) {
    confettiFn({
        particleCount: 25,
        spread: 110,
        origin: { x: 0.5, y: 0.1 },
        colors: ['#ffe690', '#ffffff', '#f4d03f'],
        scalar: 0.9,
        gravity: 0.55
    });
}

function fireworkBlast(confettiFn) {
    confettiFn({
        particleCount: 20,
        spread: 160,
        origin: { x: 0.5, y: 0.65 },
        colors: ['#ffd966', '#ff9c3b', '#ffd966', '#ffffff'],
        scalar: 1.3,
        gravity: 0.7
    });
}

function confettiRain(confettiFn) {
    confettiFn({
        particleCount: 40,
        spread: 80,
        origin: { x: 0.2, y: 0 },
        colors: ['#ff5f5f', '#4ac7ff', '#ffe066', '#81ff85'],
        scalar: 0.9,
        drift: 0.5,
        gravity: 0.9
    });
    confettiFn({
        particleCount: 40,
        spread: 80,
        origin: { x: 0.8, y: 0 },
        colors: ['#ff5f5f', '#4ac7ff', '#ffe066', '#81ff85'],
        scalar: 0.9,
        drift: -0.5,
        gravity: 0.9
    });
}

// Confetti Bomb
function confettiBomb() {
    const currentConfetti = confettiInstance || (typeof confetti !== 'undefined' ? confetti : null);
    if (!currentConfetti) return;

    const count = 400;
    const defaults = {
        origin: { y: 0.7 },
        colors: ['#d4af37', '#ffffff', '#996515', '#f4d03f', '#ff5f5f', '#4ac7ff'],
    };

    function fire(particleRatio, opts) {
        currentConfetti({
            ...defaults,
            ...opts,
            particleCount: Math.floor(count * particleRatio),
        });
    }

    fire(0.25, { spread: 26, startVelocity: 65 });
    fire(0.2, { spread: 60, startVelocity: 45 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 35, decay: 0.92, scalar: 1.4 });
    fire(0.1, { spread: 150, startVelocity: 55, scalar: 1.1 });

    currentConfetti({
        particleCount: 80,
        angle: 60,
        spread: 70,
        origin: { x: 0, y: 0.6 },
        colors: defaults.colors,
        startVelocity: 55
    });
    currentConfetti({
        particleCount: 80,
        angle: 120,
        spread: 70,
        origin: { x: 1, y: 0.6 },
        colors: defaults.colors,
        startVelocity: 55
    });
}

// Volume Controls
window.toggleVolumeFlyout = function() {
    const flyout = document.getElementById('volumeFlyout');
    if (flyout) flyout.classList.toggle('visible');
};

window.updateVolume = function(val) {
    const audio = document.getElementById('bgMusic');
    const levelDisplay = document.getElementById('volumeLevel');
    const flyoutOn = document.getElementById('flyoutSpeakerOn');
    const flyoutMute = document.getElementById('flyoutSpeakerMute');

    if (audio) {
        audio.volume = val / 100;
        if (val == 0) {
            if (flyoutOn) flyoutOn.style.display = 'none';
            if (flyoutMute) flyoutMute.style.display = 'block';
        } else {
            if (flyoutOn) flyoutOn.style.display = 'block';
            if (flyoutMute) flyoutMute.style.display = 'none';
            if (audio.paused) audio.play().catch(e => {});
        }
    }
    if (levelDisplay) levelDisplay.textContent = val;
};

window.toggleMute = function() {
    const audio = document.getElementById('bgMusic');
    const slider = document.getElementById('volumeSlider');
    const flyoutOn = document.getElementById('flyoutSpeakerOn');
    const flyoutMute = document.getElementById('flyoutSpeakerMute');

    if (!audio) return;

    if (audio.volume > 0) {
        window.lastVolume = audio.volume;
        audio.volume = 0;
        if (slider) slider.value = 0;
        if (document.getElementById('volumeLevel')) document.getElementById('volumeLevel').textContent = "0";
        if (flyoutOn) flyoutOn.style.display = 'none';
        if (flyoutMute) flyoutMute.style.display = 'block';
    } else {
        const targetVol = window.lastVolume || 0.5;
        audio.volume = targetVol;
        if (slider) slider.value = targetVol * 100;
        if (document.getElementById('volumeLevel')) document.getElementById('volumeLevel').textContent = Math.round(targetVol * 100);
        if (flyoutOn) flyoutOn.style.display = 'block';
        if (flyoutMute) flyoutMute.style.display = 'none';
        if (audio.paused) audio.play().catch(e => {});
    }
};

// Automatic Start (Called when card data is ready)
function startCardEffects() {
    // Initial Bomb
    confettiBomb();
    // Repeat every 3 seconds as requested
    setInterval(confettiBomb, 3000);

    // Try to play music (will be blocked if no previous interaction)
    const audio = document.getElementById('bgMusic');
    if (audio && audio.src) {
        audio.volume = 0.5;
        audio.play().catch(e => {
            console.log("Autoplay blocked. User must interact to play music.");
            // If blocked, we'll try to play it on the first click on the document
            const playOnInteraction = () => {
                audio.play().catch(e => {});
                document.removeEventListener('click', playOnInteraction);
            };
            document.addEventListener('click', playOnInteraction);
        });
    }
}

// Initialization Logic
document.addEventListener('DOMContentLoaded', () => {
    applyTheme(getStoredThemePreference());
    initThemeSwitcher();

    const urlParams = new URLSearchParams(window.location.search);
    const cardId = urlParams.get('id');
    window.cardId = cardId;

    const confettiCanvas = document.getElementById('confettiCanvas');
    if (confettiCanvas && typeof confetti !== 'undefined' && confetti.create) {
        confettiInstance = confetti.create(confettiCanvas, { resize: true, useWorker: true });
    } else if (typeof confetti !== 'undefined') {
        confettiInstance = confetti;
    }

    const defaults = {
        'Happy Birthday': { desc: 'Wishing you a day filled with happiness...', img: 'https://images.unsplash.com/photo-1464349153735-7db50ed83c84?w=400' },
        'Congratulations': { desc: 'A remarkable achievement...', img: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400' },
        'Best Wishes': { desc: 'Sending you our best wishes...', img: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400' },
        'Thank You': { desc: 'Your contribution has been invaluable...', img: 'https://images.unsplash.com/photo-1516733968668-dbdce39c46ef?w=400' },
        'Happy Wedding Anniversary': { desc: 'Wishing you both a lifetime of love...', img: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=400' },
        'Birthday Soon': { desc: 'Wishing you a day filled with happiness...', img: 'https://images.unsplash.com/photo-1464349153735-7db50ed83c84?w=400' }
    };

    if (cardId && database) {
        database.ref('cards/' + cardId).once('value').then((snapshot) => {
            const data = snapshot.val();
            if (data) {
                renderCard(data);
                startCardEffects();
            } else {
                window.location.href = 'index.html';
            }
        }).catch((error) => {
            window.location.href = 'index.html';
        });
    } else if (window.location.pathname.includes('card.html')) {
        window.location.href = 'index.html';
    }

    function renderCard(data) {
        const savedCustomTheme = JSON.parse(localStorage.getItem('card-custom-theme') || 'null');
        const { n: name, m: type, i: img, d: desc, y: design, s: music, h: themeMode, pc: pageColor, cc: cardColor, tc: textColor } = data;
        const resolvedThemeMode = getResolvedTheme(themeMode || savedCustomTheme?.themeMode || getStoredThemePreference());
        const resolvedPageColor = pageColor || savedCustomTheme?.pageColor;
        const resolvedCardColor = cardColor || savedCustomTheme?.cardColor;
        const resolvedTextColor = textColor || savedCustomTheme?.textColor;

        applyDesign(design || 'sparkle');
        applyTheme(resolvedThemeMode);
        applyCardTheme({ pageColor: resolvedPageColor, cardColor: resolvedCardColor, textColor: resolvedTextColor, themeMode: resolvedThemeMode });
        refreshColorInputs({ pageColor: resolvedPageColor, cardColor: resolvedCardColor, textColor: resolvedTextColor });

        if (document.getElementById('userName')) document.getElementById('userName').textContent = name;
        const resolvedHeading = type || 'Congratulations';
        if (document.getElementById('cardHeading')) document.getElementById('cardHeading').textContent = resolvedHeading;
        document.title = resolvedHeading;
        const config = defaults[type] || defaults['Congratulations'];
        if (document.getElementById('cardDesc')) document.getElementById('cardDesc').textContent = desc || config.desc;
        if (document.getElementById('userImg')) {
            document.getElementById('userImg').src = img || config.img;
            if (document.getElementById('userImgContainer')) {
                document.getElementById('userImgContainer').style.display = 'block';
                if (type === 'Happy Wedding Anniversary') document.getElementById('userImgContainer').classList.add('anniversary-img');
            }
        }
        if (music && music !== 'none' && musicTracks[music]) {
            const audio = document.getElementById('bgMusic');
            if (audio) {
                audio.src = musicTracks[music];
                if (document.getElementById('musicControlGroup')) document.getElementById('musicControlGroup').style.display = 'flex';
            }
        }
    }

    window.generateLink = async function () {
        const iName = document.getElementById('nameInput')?.value;
        const iType = document.getElementById('typeInput')?.value;
        const iImg = document.getElementById('imgInput')?.value;
        const iFile = document.getElementById('fileInput')?.files[0];
        const iDesc = document.getElementById('descInput')?.value;
        // Use stored theme preference (may be 'system','light','dark') so card can persist preference
        const iThemePref = localStorage.getItem('card-theme') || document.getElementById('themeInput')?.value || 'dark';
        const iMusic = document.getElementById('musicInput')?.value;
        if (!iName) { alert("Please enter a name"); return; }
        let finalImg = iImg || "";
        if (iFile) { try { finalImg = await fileToBase64(iFile); } catch (err) { return; } }
        // capture computed CSS variables so the new card inherits visible colors
        const computed = getComputedStyle(document.documentElement);
        const computedPageColor = (computed.getPropertyValue('--bg-dark') || '').trim();
        const computedCardColor = (computed.getPropertyValue('--card-bg') || '').trim();
        const computedTextColor = (computed.getPropertyValue('--text-main') || '').trim();

        const cardData = {
            n: iName,
            m: iType,
            i: finalImg,
            d: iDesc || "",
            // store theme preference (could be 'system') so card page can resolve it
            h: iThemePref || "dark",
            y: 'sparkle',
            s: iMusic || 'none',
            // include computed color vars so card uses the same visible colors
            pc: computedPageColor || undefined,
            cc: computedCardColor || undefined,
            tc: computedTextColor || undefined
        };
        if (database) {
            const newCardRef = database.ref('cards').push();
            newCardRef.set(cardData).then(() => { window.location.href = `card.html?id=${newCardRef.key}`; });
        } else {
            // no DB: still redirect to card with no id (will fallback to index)
            const newCardRef = { key: '' };
            window.location.href = `card.html`;
        }
    };

    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    // Input file display
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const fileNameDisplay = document.getElementById('fileNameDisplay');
            if (fileNameDisplay && e.target.files.length > 0) {
                fileNameDisplay.textContent = "Selected: " + e.target.files[0].name;
                fileNameDisplay.style.display = 'block';
            }
        });
    }

    document.addEventListener('click', (e) => {
        const colorFlyout = document.getElementById('colorThemeFlyout');
        const colorBtn = document.getElementById('colorThemeBtn');
        const flyout = document.getElementById('volumeFlyout');
        const mainBtn = document.getElementById('mainMusicBtn');

        if (colorFlyout && colorFlyout.classList.contains('visible') && !colorFlyout.contains(e.target) && (!colorBtn || !colorBtn.contains(e.target))) {
            colorFlyout.classList.remove('visible');
        }

        if (flyout && flyout.classList.contains('visible') && !flyout.contains(e.target) && (!mainBtn || !mainBtn.contains(e.target))) {
            flyout.classList.remove('visible');
        }
    });
});
