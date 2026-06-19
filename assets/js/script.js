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
const DEFAULT_CARD_MUSIC = 'wishes';
const MAX_VIDEO_BYTES = 20 * 1024 * 1024;

function isVideoFile(file) {
    return !!(file && file.type && file.type.startsWith('video/'));
}

function getDefaultMusicForMessageType(messageType) {
    const messageMusicMap = {
        'Congratulations': 'congrats',
        'Happy Birthday': 'birthday',
        'Birthday Soon': 'birthday',
        'Best Wishes': 'wishes',
        'Thank You': 'thankyou',
        'Happy Wedding Anniversary': 'wedding'
    };
    return messageMusicMap[messageType] || DEFAULT_CARD_MUSIC;
}

function isImageFile(file) {
    return !!(file && file.type && file.type.startsWith('image/'));
}

function isDataImageUrl(url) {
    return /^data:image\//i.test((url || '').trim());
}

function hasImageExtension(url) {
    return /\.(jpe?g|png|gif|webp|svg|bmp|avif)(\?.*)?$/i.test((url || '').trim());
}

function validateImageUrl(url) {
    const trimmed = (url || '').trim();
    if (!trimmed) return Promise.resolve(false);
    if (isDataImageUrl(trimmed) || hasImageExtension(trimmed)) return Promise.resolve(true);

    return new Promise((resolve) => {
        const img = new Image();
        const timer = setTimeout(() => resolve(false), 8000);
        img.onload = () => {
            clearTimeout(timer);
            resolve(true);
        };
        img.onerror = () => {
            clearTimeout(timer);
            resolve(false);
        };
        img.src = trimmed;
    });
}

function stripUndefinedFields(obj) {
    const cleaned = {};
    Object.keys(obj).forEach((key) => {
        if (obj[key] !== undefined) {
            cleaned[key] = obj[key];
        }
    });
    return cleaned;
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

function hasValidMediaSrc(el) {
    if (!el) return false;
    const src = el.getAttribute('src') || '';
    return src.trim().length > 0;
}

window.onVideoFileSelected = function (input) {
    const file = input?.files?.[0];
    if (!file) return;

    const videoFileName = document.getElementById('videoFileName');
    const videoNameDisplay = document.getElementById('videoNameDisplay');

    if (videoFileName) {
        videoFileName.value = file.name;
    }
    if (videoNameDisplay) {
        videoNameDisplay.textContent = 'Selected: ' + file.name;
        videoNameDisplay.style.display = 'block';
    }

    window.clearImageSelection();
};

window.clearVideoSelection = function () {
    const videoInput = document.getElementById('videoInput');
    const videoFileName = document.getElementById('videoFileName');
    const videoNameDisplay = document.getElementById('videoNameDisplay');

    if (videoInput) videoInput.value = '';
    if (videoFileName) videoFileName.value = '';
    if (videoNameDisplay) {
        videoNameDisplay.textContent = '';
        videoNameDisplay.style.display = 'none';
    }
};

window.clearImageSelection = function () {
    const imgInput = document.getElementById('imgInput');
    const imageFileInput = document.getElementById('fileInput');
    const fileNameDisplay = document.getElementById('fileNameDisplay');

    if (imgInput) imgInput.value = '';
    if (imageFileInput) imageFileInput.value = '';
    if (fileNameDisplay) {
        fileNameDisplay.textContent = '';
        fileNameDisplay.style.display = 'none';
    }
};

window.onImageInputChange = function () {
    const imgInput = document.getElementById('imgInput');
    if (imgInput && imgInput.value.trim()) {
        window.clearVideoSelection();
    }
};

function hasActiveVideoSelection() {
    const videoInput = document.getElementById('videoInput');
    const videoFileName = document.getElementById('videoFileName');
    const videoNameDisplay = document.getElementById('videoNameDisplay');
    const hasFile = !!(videoInput?.files?.[0]);
    const hasUiSelection = !!(videoFileName?.value?.trim()) ||
        (videoNameDisplay && videoNameDisplay.style.display !== 'none' && videoNameDisplay.textContent?.trim());
    return hasFile && hasUiSelection;
}

window.generateLink = async function () {
    try {
        const iName = document.getElementById('nameInput')?.value;
        const iType = document.getElementById('typeInput')?.value;
        const iImg = document.getElementById('imgInput')?.value;
        const iFile = document.getElementById('fileInput')?.files[0];
        const useVideo = hasActiveVideoSelection();
        const iVideoFile = useVideo ? document.getElementById('videoInput')?.files[0] : null;
        const iDesc = document.getElementById('descInput')?.value;
        const iThemePref = localStorage.getItem('card-theme') || document.getElementById('themeInput')?.value || 'light';
        const iMusic = document.getElementById('musicInput')?.value;
        const iMusicCustomUrl = document.getElementById('musicCustomUrl')?.value;
        const iMusicStartTime = document.getElementById('musicStartTime')?.value;
        const iMusicDuration = document.getElementById('musicDuration')?.value;

        if (!iName || !iName.trim()) {
            alert("Please enter a name");
            return;
        }

        if (iMusic === 'custom' && !iMusicCustomUrl) {
            alert("Please confirm your music selection");
            return;
        }

        let finalImg = "";
        let finalVideo = "";

        if (iVideoFile) {
            if (!isVideoFile(iVideoFile)) {
                alert("Please upload a valid video file");
                return;
            }
            if (iVideoFile.size > MAX_VIDEO_BYTES) {
                alert("Video is too large. Please upload a video under 20MB.");
                return;
            }
            finalVideo = await fileToBase64(iVideoFile);
        } else if (iFile) {
            if (!isImageFile(iFile)) {
                alert("Please upload a valid image file");
                return;
            }
            finalImg = await fileToBase64(iFile);
        } else if (iImg && iImg.trim()) {
            const isValidImage = await validateImageUrl(iImg.trim());
            if (!isValidImage) {
                alert("Please enter a valid image URL");
                return;
            }
            finalImg = iImg.trim();
        }

        let resolvedMusic;
        if (finalVideo) {
            resolvedMusic = (iMusic && iMusic !== 'none') ? iMusic : 'video';
        } else {
            resolvedMusic = (!iMusic || iMusic === 'none')
                ? getDefaultMusicForMessageType(iType || 'Congratulations')
                : iMusic;
        }
        const computed = getComputedStyle(document.documentElement);
        const computedPageColor = (computed.getPropertyValue('--bg-dark') || '').trim();
        const computedCardColor = (computed.getPropertyValue('--card-bg') || '').trim();
        const computedTextColor = (computed.getPropertyValue('--text-main') || '').trim();

        const cardData = {
            n: iName.trim(),
            m: iType || 'Congratulations',
            i: finalImg,
            v: finalVideo || undefined,
            d: (iDesc && iDesc.trim()) ? iDesc.trim() : "",
            h: iThemePref || 'light',
            y: 'sparkle',
            s: resolvedMusic,
            sm: resolvedMusic === 'custom' ? (iMusicCustomUrl || "") : undefined,
            sms: resolvedMusic === 'custom' ? parseFloat(iMusicStartTime || "0") : undefined,
            smd: resolvedMusic === 'custom' ? parseFloat(iMusicDuration || "15") : undefined,
            pc: computedPageColor || undefined,
            cc: computedCardColor || undefined,
            tc: computedTextColor || undefined
        };

        if (!database) {
            alert('Could not connect to database. Please check your internet and try again.');
            return;
        }

        const newCardRef = database.ref('cards').push();
        await newCardRef.set(stripUndefinedFields(cardData));
        window.location.href = `card.html?id=${newCardRef.key}`;
    } catch (err) {
        console.error(err);
        alert('Could not create card. Please try again.');
    }
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
function getSpeakerOnSvg(size) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>`;
}

function getSpeakerMuteSvg(size) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <line x1="23" y1="9" x2="17" y2="15" />
        <line x1="17" y1="9" x2="23" y2="15" />
    </svg>`;
}

function setMainSpeakerIcon(isPlaying) {
    const mainBtn = document.getElementById('mainMusicBtn');
    if (!mainBtn) return;
    mainBtn.innerHTML = isPlaying ? getSpeakerOnSvg(20) : getSpeakerMuteSvg(20);
}

function syncMainSpeakerIcon() {
    const audio = document.getElementById('bgMusic');
    const video = document.getElementById('cardBgVideo');
    if (!document.getElementById('musicControlGroup')) return;

    let isAudible = false;
    if (window.cardHasExternalMusic && hasValidMediaSrc(audio)) {
        isAudible = !audio.paused && audio.volume > 0;
    } else if (window.cardUsesVideoAudio && hasValidMediaSrc(video)) {
        isAudible = !video.paused && video.volume > 0;
    } else if (hasValidMediaSrc(audio)) {
        isAudible = !audio.paused && audio.volume > 0;
    }
    setMainSpeakerIcon(isAudible);
}

function getActiveCardMedia() {
    const audio = document.getElementById('bgMusic');
    const video = document.getElementById('cardBgVideo');

    if (window.cardHasExternalMusic && hasValidMediaSrc(audio)) {
        return audio;
    }
    if (window.cardUsesVideoAudio && hasValidMediaSrc(video)) {
        return video;
    }
    if (hasValidMediaSrc(audio)) {
        return audio;
    }
    return null;
}

function startCardMediaPlayback() {
    const media = getActiveCardMedia();
    if (!media) return;

    if (!window.cardUsesVideoAudio && window.customMusicStartTime !== undefined) {
        media.currentTime = window.customMusicStartTime;
    }

    media.play().then(() => {
        syncMainSpeakerIcon();
    }).catch(() => {
        setMainSpeakerIcon(false);
    });
}

function startCardMusicPlayback() {
    startCardMediaPlayback();
}

window.toggleVolumeFlyout = function () {
    const flyout = document.getElementById('volumeFlyout');
    const media = getActiveCardMedia();

    if (media && media.paused) {
        startCardMediaPlayback();
    }

    if (flyout) flyout.classList.toggle('visible');
};

window.updateVolume = function (val) {
    const audio = document.getElementById('bgMusic');
    const video = document.getElementById('cardBgVideo');
    const media = getActiveCardMedia();
    const levelDisplay = document.getElementById('volumeLevel');
    const flyoutOn = document.getElementById('flyoutSpeakerOn');
    const flyoutMute = document.getElementById('flyoutSpeakerMute');

    if (media) {
        media.volume = val / 100;
        if (val == 0) {
            if (flyoutOn) flyoutOn.style.display = 'none';
            if (flyoutMute) flyoutMute.style.display = 'block';
            setMainSpeakerIcon(false);
        } else {
            if (flyoutOn) flyoutOn.style.display = 'block';
            if (flyoutMute) flyoutMute.style.display = 'none';
            if (media.paused) media.play().catch(e => { });
            syncMainSpeakerIcon();
        }
    }
    if (levelDisplay) levelDisplay.textContent = val;
};

window.toggleMute = function () {
    const media = getActiveCardMedia();
    const slider = document.getElementById('volumeSlider');
    const flyoutOn = document.getElementById('flyoutSpeakerOn');
    const flyoutMute = document.getElementById('flyoutSpeakerMute');

    if (!media) return;

    if (media.volume > 0) {
        window.lastVolume = media.volume;
        media.volume = 0;
        if (slider) slider.value = 0;
        if (document.getElementById('volumeLevel')) document.getElementById('volumeLevel').textContent = "0";
        if (flyoutOn) flyoutOn.style.display = 'none';
        if (flyoutMute) flyoutMute.style.display = 'block';
        setMainSpeakerIcon(false);
    } else {
        const targetVol = window.lastVolume || 0.5;
        media.volume = targetVol;
        if (slider) slider.value = targetVol * 100;
        if (document.getElementById('volumeLevel')) document.getElementById('volumeLevel').textContent = Math.round(targetVol * 100);
        if (flyoutOn) flyoutOn.style.display = 'block';
        if (flyoutMute) flyoutMute.style.display = 'none';
        if (media.paused) media.play().catch(e => { });
        syncMainSpeakerIcon();
    }
};

// Automatic Start (Called when card data is ready)
function startCardEffects() {
    confettiBomb();
    setInterval(confettiBomb, 3000);

    const video = document.getElementById('cardBgVideo');
    const audio = document.getElementById('bgMusic');

    const tryPlayMedia = (media, onStart) => {
        if (!media || !hasValidMediaSrc(media)) return;
        media.volume = 0.5;
        if (onStart) onStart(media);
        media.play().then(() => {
            syncMainSpeakerIcon();
        }).catch(() => {
            setMainSpeakerIcon(false);
            const playOnInteraction = () => {
                if (!window.cardUsesVideoAudio && window.customMusicStartTime !== undefined) {
                    media.currentTime = window.customMusicStartTime;
                }
                media.play().then(() => syncMainSpeakerIcon()).catch(() => { });
                document.removeEventListener('click', playOnInteraction);
            };
            document.addEventListener('click', playOnInteraction);
        });
    };

    if (window.cardUsesVideoAudio && video && hasValidMediaSrc(video)) {
        tryPlayMedia(video);
        return;
    }

    if (video && hasValidMediaSrc(video)) {
        video.muted = true;
        video.play().catch(() => { });
    }

    if (audio && hasValidMediaSrc(audio)) {
        tryPlayMedia(audio, (el) => {
            if (window.customMusicStartTime !== undefined && window.customMusicDuration !== undefined) {
                el.currentTime = window.customMusicStartTime;
                el.ontimeupdate = () => {
                    const end = window.customMusicStartTime + window.customMusicDuration;
                    if (el.currentTime >= end) {
                        el.currentTime = window.customMusicStartTime;
                        if (el.paused) el.play().catch(() => { });
                    }
                    if (el.currentTime < window.customMusicStartTime) {
                        el.currentTime = window.customMusicStartTime;
                    }
                };
            }
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
        const { n: name, m: type, i: img, v: video, d: desc, y: design, s: music, h: themeMode, pc: pageColor, cc: cardColor, tc: textColor, sm: customMusic, sms: customMusicStart, smd: customMusicDuration } = data;
        const resolvedThemeMode = getResolvedTheme(themeMode || savedCustomTheme?.themeMode || getStoredThemePreference());
        const resolvedPageColor = pageColor || savedCustomTheme?.pageColor;
        const resolvedCardColor = cardColor || savedCustomTheme?.cardColor;
        const resolvedTextColor = textColor || savedCustomTheme?.textColor;

        window.cardUsesVideoAudio = false;
        window.cardHasExternalMusic = false;

        applyDesign(design || 'sparkle');
        applyTheme(resolvedThemeMode);
        applyCardTheme({ pageColor: resolvedPageColor, cardColor: resolvedCardColor, textColor: resolvedTextColor, themeMode: resolvedThemeMode });
        refreshColorInputs({ pageColor: resolvedPageColor, cardColor: resolvedCardColor, textColor: resolvedTextColor });

        const cardContainer = document.getElementById('cardToDownload');
        const videoEl = document.getElementById('cardBgVideo');
        const hasVideo = !!(video && video.trim());

        if (cardContainer) {
            cardContainer.classList.toggle('video-story-mode', hasVideo);
        }

        if (videoEl) {
            if (hasVideo) {
                videoEl.src = video.trim();
                videoEl.style.display = 'block';
            } else {
                videoEl.removeAttribute('src');
                videoEl.style.display = 'none';
                videoEl.pause();
            }
        }

        if (document.getElementById('userName')) document.getElementById('userName').textContent = name;
        const resolvedHeading = type || 'Congratulations';
        if (document.getElementById('cardHeading')) document.getElementById('cardHeading').textContent = resolvedHeading;
        document.title = resolvedHeading;

        const imgContainer = document.getElementById('userImgContainer');
        const userImg = document.getElementById('userImg');
        if (!hasVideo && img && img.trim() && userImg) {
            userImg.src = img.trim();
            if (imgContainer) {
                imgContainer.style.display = 'block';
                if (type === 'Happy Wedding Anniversary') imgContainer.classList.add('anniversary-img');
            }
        } else if (imgContainer) {
            imgContainer.style.display = 'none';
        }

        const cardDesc = document.getElementById('cardDesc');
        if (desc && desc.trim() && cardDesc) {
            cardDesc.textContent = desc.trim();
            cardDesc.style.display = '';
        } else if (cardDesc) {
            cardDesc.textContent = '';
            cardDesc.style.display = 'none';
        }

        const audio = document.getElementById('bgMusic');
        const musicControlGroup = document.getElementById('musicControlGroup');
        const hasExternalMusic = music && music !== 'none' && music !== 'video';

        if (hasVideo && videoEl) {
            if (hasExternalMusic && audio) {
                videoEl.muted = true;
                window.cardUsesVideoAudio = false;
                if (music === 'custom' && customMusic) {
                    audio.src = customMusic;
                    audio.load();
                    window.customMusicStartTime = customMusicStart !== undefined ? parseFloat(customMusicStart) : 0;
                    window.customMusicDuration = customMusicDuration !== undefined ? parseFloat(customMusicDuration) : 15;
                    window.cardHasExternalMusic = true;
                } else if (musicTracks[music]) {
                    audio.src = musicTracks[music];
                    audio.load();
                    window.customMusicStartTime = undefined;
                    window.customMusicDuration = undefined;
                    window.cardHasExternalMusic = true;
                }
            } else {
                videoEl.muted = false;
                window.cardUsesVideoAudio = true;
                if (audio) {
                    audio.removeAttribute('src');
                    audio.pause();
                }
                window.customMusicStartTime = undefined;
                window.customMusicDuration = undefined;
            }

            if (musicControlGroup && (window.cardHasExternalMusic || window.cardUsesVideoAudio)) {
                musicControlGroup.style.display = 'flex';
                setMainSpeakerIcon(false);
            }
        } else if (audio) {
            const resolvedMusic = (music && music !== 'none')
                ? music
                : getDefaultMusicForMessageType(type || 'Congratulations');

            if (resolvedMusic === 'custom' && customMusic) {
                audio.src = customMusic;
                audio.load();
                window.customMusicStartTime = customMusicStart !== undefined ? parseFloat(customMusicStart) : 0;
                window.customMusicDuration = customMusicDuration !== undefined ? parseFloat(customMusicDuration) : 15;
            } else if (musicTracks[resolvedMusic]) {
                audio.src = musicTracks[resolvedMusic];
                audio.load();
                window.customMusicStartTime = undefined;
                window.customMusicDuration = undefined;
            }
            if (hasValidMediaSrc(audio) && musicControlGroup) {
                musicControlGroup.style.display = 'flex';
                setMainSpeakerIcon(false);
            }
        }
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
            window.clearVideoSelection();
        });
    }

    const imgInput = document.getElementById('imgInput');
    if (imgInput) {
        imgInput.addEventListener('input', window.onImageInputChange);
    }

    const videoInput = document.getElementById('videoInput');
    if (videoInput) {
        videoInput.addEventListener('change', (e) => {
            window.onVideoFileSelected(e.target);
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

// --- Music Search and Trim Modal Logic ---
const WF_PREVIEW_SECS = 30;
const WF_MAX_CLIP_SECS = 60;
const WF_BARS_PER_SEC = 4;
let searchAudioPreview = null;
let trimAudioPreview = null;
let selectedTrack = null;
let activePlayBtn = null;
let trimTimer = null;
let activePreviewLengthSecs = WF_PREVIEW_SECS;
let activeSongLengthSecs = WF_PREVIEW_SECS;

function getSongLengthSecs() {
    return activeSongLengthSecs || WF_PREVIEW_SECS;
}

function getWaveformTotalBars() {
    return Math.ceil(getSongLengthSecs() * WF_BARS_PER_SEC);
}

function getWaveformTotalWidth() {
    return getWaveformTotalBars() * 5;
}

function getPreviewLengthSecs() {
    return activePreviewLengthSecs || WF_PREVIEW_SECS;
}

function getEffectiveClipDuration(durationVal) {
    const dur = parseInt(durationVal, 10) || 15;
    return Math.min(dur, WF_MAX_CLIP_SECS);
}

function getMaxStartTime(durationVal) {
    const effectiveDur = getEffectiveClipDuration(durationVal);
    return Math.max(0, getSongLengthSecs() - effectiveDur);
}

function getTrimPlaybackRange(startVal, durationVal) {
    const previewEnd = getPreviewLengthSecs();
    if (startVal < previewEnd) {
        return {
            playStart: startVal,
            playEnd: Math.min(startVal + durationVal, previewEnd)
        };
    }
    return { playStart: 0, playEnd: previewEnd };
}

function updateTrimStartSliderUI() {
    const startSlider = document.getElementById('trimStartSlider');
    const durationSlider = document.getElementById('trimDurationSlider');
    const sliderContainer = document.querySelector('.waveform-slider-container');
    if (!startSlider || !durationSlider) return;

    const durationVal = parseInt(durationSlider.value, 10) || 15;
    const effectiveDur = getEffectiveClipDuration(durationVal);
    const maxStart = getMaxStartTime(durationVal);

    startSlider.min = 0;
    startSlider.max = maxStart;
    startSlider.step = 1;

    const currentStart = parseFloat(startSlider.value) || 0;
    if (currentStart > maxStart) {
        startSlider.value = maxStart;
    }

    document.getElementById('trimStartTimeDisplay').textContent = formatTime(parseFloat(startSlider.value) || 0);

    if (sliderContainer) {
        const trackWidth = sliderContainer.clientWidth || 220;
        const thumbWidth = Math.max(28, (effectiveDur / getSongLengthSecs()) * trackWidth);
        startSlider.style.setProperty('--thumb-width', thumbWidth + 'px');
    }

    updateWaveformView();
}

window.openMusicSearchModal = function () {
    document.getElementById('musicSearchModal').classList.add('active');
    const bgMusic = document.getElementById('bgMusic');
    if (bgMusic) bgMusic.pause();

    const query = document.getElementById('musicSearchInput').value.trim();
    if (!query) {
        loadDefaultTrendingSongs();
    }
};

window.closeMusicSearchModal = function () {
    document.getElementById('musicSearchModal').classList.remove('active');
    if (searchAudioPreview) {
        searchAudioPreview.pause();
        searchAudioPreview = null;
    }
    if (activePlayBtn) {
        activePlayBtn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
        `;
        activePlayBtn = null;
    }
};

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function setTrimPlayBtnState(playing) {
    const playBtn = document.getElementById('trimPlayBtn');
    if (!playBtn) return;
    playBtn.innerHTML = playing
        ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
            </svg> Pause`
        : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg> Preview`;
}

function playTrimPreviewFromSelection() {
    if (!selectedTrack || !selectedTrack.previewUrl) return;

    const startVal = parseFloat(document.getElementById('trimStartSlider').value) || 0;
    const durationVal = getEffectiveClipDuration(document.getElementById('trimDurationSlider').value || "15");
    const { playStart, playEnd } = getTrimPlaybackRange(startVal, durationVal);

    if (!trimAudioPreview) {
        trimAudioPreview = new Audio(selectedTrack.previewUrl);
        trimAudioPreview._trackPreviewUrl = selectedTrack.previewUrl;
    } else if (trimAudioPreview._trackPreviewUrl !== selectedTrack.previewUrl) {
        trimAudioPreview.src = selectedTrack.previewUrl;
        trimAudioPreview._trackPreviewUrl = selectedTrack.previewUrl;
    }

    clearInterval(trimTimer);

    const seekAndPlay = () => {
        trimAudioPreview.currentTime = playStart;
        trimAudioPreview.play().catch(() => { });
        setTrimPlayBtnState(true);

        trimTimer = setInterval(() => {
            if (trimAudioPreview.currentTime >= playEnd) {
                trimAudioPreview.currentTime = playStart;
            }
        }, 100);
    };

    if (trimAudioPreview.readyState >= 1) {
        seekAndPlay();
    } else {
        trimAudioPreview.addEventListener('loadedmetadata', seekAndPlay, { once: true });
        trimAudioPreview.load();
    }

    trimAudioPreview.onended = () => {
        clearInterval(trimTimer);
        setTrimPlayBtnState(false);
    };
}

window.openMusicTrimModal = function (track) {
    selectedTrack = track;
    document.getElementById('musicSearchModal').classList.remove('active');

    document.getElementById('trimAlbumArt').src = track.artworkUrl100 || '';
    document.getElementById('trimSongTitle').textContent = track.trackName || 'Unknown Song';
    document.getElementById('trimArtistName').textContent = track.artistName || 'Unknown Artist';

    const startSlider = document.getElementById('trimStartSlider');
    const durationSlider = document.getElementById('trimDurationSlider');

    activePreviewLengthSecs = WF_PREVIEW_SECS;
    activeSongLengthSecs = (track.trackTimeMillis && track.trackTimeMillis > 0)
        ? track.trackTimeMillis / 1000
        : WF_PREVIEW_SECS;
    startSlider.value = 0;
    durationSlider.value = 15;

    document.getElementById('durationCircleText').textContent = '15';
    document.getElementById('trimDurationDisplay').textContent = '15s';
    document.getElementById('trimStartTimeDisplay').textContent = '0:00';

    durationSlider.oninput = function () {
        const dur = parseInt(this.value, 10);
        document.getElementById('trimDurationDisplay').textContent = dur + 's';
        document.getElementById('durationCircleText').textContent = dur;
        updateTrimStartSliderUI();
        playTrimPreviewFromSelection();
    };

    startSlider.oninput = function () {
        document.getElementById('trimStartTimeDisplay').textContent = formatTime(parseFloat(this.value) || 0);
        updateWaveformView();
        playTrimPreviewFromSelection();
    };

    if (track.previewUrl) {
        const probe = new Audio(track.previewUrl);
        probe.preload = 'metadata';
        probe.addEventListener('loadedmetadata', () => {
            if (Number.isFinite(probe.duration) && probe.duration > 0) {
                activePreviewLengthSecs = probe.duration;
                if (!track.trackTimeMillis || track.trackTimeMillis <= 0) {
                    activeSongLengthSecs = Math.max(activeSongLengthSecs, probe.duration);
                }
                updateTrimStartSliderUI();
                buildWaveform();
                updateWaveformView();
            }
        });
    }

    document.getElementById('musicTrimModal').classList.add('active');

    // Build after modal is visible so clientWidth is valid
    setTimeout(() => {
        updateTrimStartSliderUI();
        buildWaveform();
        setupWaveformInteraction();
        updateWaveformView();
        playTrimPreviewFromSelection();
    }, 60);
};

// ---- Build waveform bars ----
function buildWaveform() {
    const trackEl = document.getElementById('waveformTrack');
    const scrollContainer = document.getElementById('waveformScrollContainer');
    if (!trackEl || !scrollContainer) return;

    trackEl.innerHTML = '';

    // Pseudo-random but deterministic-looking waveform via overlapping sines
    const totalBars = getWaveformTotalBars();
    for (let i = 0; i < totalBars; i++) {
        const bar = document.createElement('div');
        bar.className = 'waveform-bar';
        const t = i / totalBars;
        const h =
            22 +
            24 * Math.abs(Math.sin(t * Math.PI * 8)) +
            16 * Math.abs(Math.sin(t * Math.PI * 15 + 0.4)) +
            10 * Math.abs(Math.sin(t * Math.PI * 27 + 1.2)) +
            Math.random() * 12;
        bar.style.height = Math.min(90, Math.max(10, h)) + '%';
        trackEl.appendChild(bar);
    }

    scrollContainer.style.width = getWaveformTotalWidth() + 'px';
}

// ---- Sync crop-window overlay + bar colours to current start/duration ----
function updateWaveformView() {
    const viewport = document.getElementById('waveformViewport');
    const scrollContainer = document.getElementById('waveformScrollContainer');
    const cropOverlay = document.getElementById('cropWindowOverlay');
    const startSlider = document.getElementById('trimStartSlider');
    const durationSlider = document.getElementById('trimDurationSlider');
    if (!viewport || !scrollContainer || !cropOverlay) return;

    const viewportWidth = viewport.clientWidth || 220;
    const startSec = parseFloat(startSlider.value) || 0;
    const durSec = parseFloat(durationSlider.value) || 15;

    const songSecs = getSongLengthSecs();
    const totalWidth = getWaveformTotalWidth();
    const pxPerSec = totalWidth / songSecs;
    const startPx = startSec * pxPerSec;
    const durPx = durSec * pxPerSec;

    // Keep selection window centred inside viewport
    let scrollLeft = startPx + durPx / 2 - viewportWidth / 2;
    const maxScroll = Math.max(0, totalWidth - viewportWidth);
    scrollLeft = Math.max(0, Math.min(scrollLeft, maxScroll));
    viewport._scrollLeft = scrollLeft;

    scrollContainer.style.transform = `translateX(${-scrollLeft}px)`;

    // Crop overlay relative to viewport
    cropOverlay.style.left = (startPx - scrollLeft) + 'px';
    cropOverlay.style.width = durPx + 'px';

    // Colour bars inside vs outside selection
    const bars = document.querySelectorAll('#waveformTrack .waveform-bar');
    bars.forEach((bar, i) => {
        const barSec = i / WF_BARS_PER_SEC;
        if (barSec >= startSec && barSec < startSec + durSec) {
            bar.classList.add('in-selection');
        } else {
            bar.classList.remove('in-selection');
        }
    });
}

// ---- Drag-to-scroll + click-to-place interaction ----
function setupWaveformInteraction() {
    const viewport = document.getElementById('waveformViewport');
    if (!viewport || viewport._wfSetup) return;
    viewport._wfSetup = true;

    let isDragging = false;
    let didDrag = false;
    let dragStartX = 0;
    let dragStartScroll = 0;

    function applyScroll(clientX) {
        const delta = dragStartX - clientX;   // drag left → later in song
        const maxScroll = Math.max(0, getWaveformTotalWidth() - (viewport.clientWidth || 220));
        let newScroll = Math.max(0, Math.min(dragStartScroll + delta, maxScroll));
        viewport._scrollLeft = newScroll;

        // Derive start time from visible centre
        const songSecs = getSongLengthSecs();
        const pxPerSec = getWaveformTotalWidth() / songSecs;
        const vw = viewport.clientWidth || 220;
        const durSec = parseFloat(document.getElementById('trimDurationSlider').value) || 15;
        let startSec = (newScroll + vw / 2) / pxPerSec - durSec / 2;
        const maxStart = getMaxStartTime(durSec);
        startSec = Math.max(0, Math.min(startSec, maxStart));

        const startSlider = document.getElementById('trimStartSlider');
        startSlider.value = startSec;
        document.getElementById('trimStartTimeDisplay').textContent = formatTime(startSec);

        // Update DOM directly (skip centering re-calc to allow free scroll)
        document.getElementById('waveformScrollContainer').style.transform = `translateX(${-newScroll}px)`;
        const co = document.getElementById('cropWindowOverlay');
        co.style.left = (startSec * pxPerSec - newScroll) + 'px';
        co.style.width = (durSec * pxPerSec) + 'px';

        const bars = document.querySelectorAll('#waveformTrack .waveform-bar');
        bars.forEach((bar, i) => {
            const barSec = i / WF_BARS_PER_SEC;
            bar.classList.toggle('in-selection', barSec >= startSec && barSec < startSec + durSec);
        });
        playTrimPreviewFromSelection();
    }

    viewport.addEventListener('mousedown', e => {
        isDragging = true;
        didDrag = false;
        dragStartX = e.clientX;
        dragStartScroll = viewport._scrollLeft || 0;
        e.preventDefault();
    });

    document.addEventListener('mousemove', e => {
        if (!isDragging) return;
        if (Math.abs(e.clientX - dragStartX) > 3) didDrag = true;
        applyScroll(e.clientX);
    });

    document.addEventListener('mouseup', e => {
        if (!isDragging) return;
        isDragging = false;
        if (!didDrag) {
            // Treat as click → place selection at click position
            const rect = viewport.getBoundingClientRect();
            const relX = e.clientX - rect.left;
            const scroll = viewport._scrollLeft || 0;
            const px = relX + scroll;
            const songSecs = getSongLengthSecs();
            const pxPerSec = getWaveformTotalWidth() / songSecs;
            const durSec = parseFloat(document.getElementById('trimDurationSlider').value) || 15;
            let startSec = px / pxPerSec - durSec / 2;
            const maxStart = getMaxStartTime(durSec);
            startSec = Math.max(0, Math.min(startSec, maxStart));

            document.getElementById('trimStartSlider').value = startSec;
            document.getElementById('trimStartTimeDisplay').textContent = formatTime(startSec);
            updateWaveformView();
            playTrimPreviewFromSelection();
        }
    });

    // ---- Touch ----
    viewport.addEventListener('touchstart', e => {
        dragStartX = e.touches[0].clientX;
        dragStartScroll = viewport._scrollLeft || 0;
        didDrag = false;
        e.preventDefault();
    }, { passive: false });

    viewport.addEventListener('touchmove', e => {
        didDrag = true;
        applyScroll(e.touches[0].clientX);
        e.preventDefault();
    }, { passive: false });
}

window.closeMusicTrimModal = function () {
    document.getElementById('musicTrimModal').classList.remove('active');
    if (trimAudioPreview) {
        trimAudioPreview.pause();
        trimAudioPreview = null;
    }
    clearInterval(trimTimer);
    document.getElementById('trimPlayBtn').innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg> Preview
    `;
    document.getElementById('musicSearchModal').classList.add('active');
};

window.loadDefaultTrendingSongs = function () {
    const container = document.getElementById('musicResultsContainer');
    container.innerHTML = '<div style="text-align: center; color: var(--text-dim); padding: 2rem;">Loading Indian Trending Songs...</div>';

    // Fetch popular Indian/Bollywood tracks using a predefined term with country code 'IN'
    const url = `https://itunes.apple.com/search?term=Bollywood+Hits&country=in&entity=song&limit=15`;

    fetch(url)
        .then(res => res.json())
        .then(data => {
            container.innerHTML = '';
            if (!data.results || data.results.length === 0) {
                container.innerHTML = '<div style="text-align: center; color: var(--text-dim); padding: 2rem;">No trending songs found</div>';
                return;
            }
            renderSearchResults(data.results);
        })
        .catch(err => {
            console.error(err);
            container.innerHTML = '<div style="text-align: center; color: var(--text-dim); padding: 2rem;">Error loading trending songs.</div>';
        });
};

window.searchItunesMusic = function () {
    const query = document.getElementById('musicSearchInput').value.trim();
    if (!query) {
        loadDefaultTrendingSongs();
        return;
    }

    const container = document.getElementById('musicResultsContainer');
    container.innerHTML = '<div style="text-align: center; color: var(--text-dim); padding: 2rem;">Searching...</div>';

    // Stop any current previews
    if (searchAudioPreview) {
        searchAudioPreview.pause();
        searchAudioPreview = null;
    }
    if (activePlayBtn) {
        activePlayBtn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
        `;
        activePlayBtn = null;
    }

    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&country=in&entity=song&limit=15`;

    fetch(url)
        .then(res => res.json())
        .then(data => {
            container.innerHTML = '';
            if (!data.results || data.results.length === 0) {
                container.innerHTML = '<div style="text-align: center; color: var(--text-dim); padding: 2rem;">No songs found</div>';
                return;
            }
            renderSearchResults(data.results);
        })
        .catch(err => {
            console.error(err);
            container.innerHTML = '<div style="text-align: center; color: var(--text-dim); padding: 2rem;">Error loading songs. Please try again.</div>';
        });
};

function renderSearchResults(results) {
    const container = document.getElementById('musicResultsContainer');
    container.innerHTML = '';

    results.forEach(track => {
        const item = document.createElement('div');
        item.className = 'music-result-item';
        item.onclick = (e) => {
            if (e.target.closest('.music-play-btn')) return;
            openMusicTrimModal(track);
        };

        const img = document.createElement('img');
        img.src = track.artworkUrl60 || '';

        const info = document.createElement('div');
        info.className = 'music-result-info';

        const title = document.createElement('h4');
        title.textContent = track.trackName;

        const artist = document.createElement('p');
        artist.textContent = track.artistName;

        info.appendChild(title);
        info.appendChild(artist);

        const playBtn = document.createElement('button');
        playBtn.className = 'music-play-btn';
        playBtn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
        `;

        playBtn.onclick = (e) => {
            e.stopPropagation();
            toggleSearchPreview(track.previewUrl, playBtn);
        };

        item.appendChild(img);
        item.appendChild(info);
        item.appendChild(playBtn);
        container.appendChild(item);
    });
}

function toggleSearchPreview(url, btn) {
    if (searchAudioPreview && searchAudioPreview.src === url) {
        if (searchAudioPreview.paused) {
            searchAudioPreview.play();
            btn.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="6" y="4" width="4" height="16"></rect>
                    <rect x="14" y="4" width="4" height="16"></rect>
                </svg>
            `;
        } else {
            searchAudioPreview.pause();
            btn.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
            `;
        }
    } else {
        if (searchAudioPreview) {
            searchAudioPreview.pause();
            if (activePlayBtn) {
                activePlayBtn.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                `;
            }
        }

        searchAudioPreview = new Audio(url);
        searchAudioPreview.play();
        btn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
        `;
        activePlayBtn = btn;

        searchAudioPreview.onended = () => {
            btn.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
            `;
            activePlayBtn = null;
        };
    }
}

window.toggleTrimPreview = function () {
    if (trimAudioPreview && !trimAudioPreview.paused) {
        trimAudioPreview.pause();
        clearInterval(trimTimer);
        setTrimPlayBtnState(false);
    } else {
        playTrimPreviewFromSelection();
    }
};

window.saveMusicSelection = function () {
    if (!selectedTrack) return;

    const startVal = document.getElementById('trimStartSlider').value;
    const durationVal = getEffectiveClipDuration(document.getElementById('trimDurationSlider').value);

    document.getElementById('musicInput').value = 'custom';
    document.getElementById('musicCustomUrl').value = selectedTrack.previewUrl;
    document.getElementById('musicStartTime').value = startVal;
    document.getElementById('musicDuration').value = durationVal;

    document.getElementById('musicInputDisplay').textContent = `${selectedTrack.trackName} - ${selectedTrack.artistName}`;

    // Stop trim preview
    if (trimAudioPreview) {
        trimAudioPreview.pause();
        trimAudioPreview = null;
    }
    clearInterval(trimTimer);

    setTrimPlayBtnState(false);

    // Close modal
    document.getElementById('musicTrimModal').classList.remove('active');
    const musicSearchModal = document.getElementById('musicSearchModal');
    if (musicSearchModal) musicSearchModal.classList.remove('active');
};
