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
if (typeof AOS !== 'undefined') {
    AOS.init();
}

// Initialize Firebase
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const database = (typeof firebase !== 'undefined') ? firebase.database() : null;
let confettiInstance = null;

// Music Track URLs
const musicTracks = {
    'birthday': '/assets/image/mixkit-party-like-its-your-birthday-1115.mp3',
    'wedding': '/assets/image/mixkit-wedding-harp-672.mp3',
    'congrats': '/assets/image/mixkit-birthday-gift-791 (1).mp3',
    'thankyou': '/assets/image/mixkit-smile-1076.mp3',
    'wishes': '/assets/image/mixkit-classical-vibes-5-688.mp3',
    'romantic': '/assets/image/mixkit-romantic-659.mp3'
};
const DEFAULT_CARD_MUSIC = 'wishes';
const MAX_VIDEO_BYTES = 20 * 1024 * 1024;
const MAX_VIDEO_SECONDS = 60;

function getVideoFileDuration(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error('No video file'));
            return;
        }
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.muted = true;
        const objectUrl = URL.createObjectURL(file);
        const cleanup = () => URL.revokeObjectURL(objectUrl);
        video.addEventListener('loadedmetadata', () => {
            const duration = video.duration;
            cleanup();
            if (Number.isFinite(duration) && duration > 0) {
                resolve(duration);
            } else {
                reject(new Error('Invalid video duration'));
            }
        }, { once: true });
        video.addEventListener('error', () => {
            cleanup();
            reject(new Error('Could not read video'));
        }, { once: true });
        video.src = objectUrl;
    });
}

function getCardVolumeStorageKey(cardId) {
    return cardId ? `card-volume-state-${cardId}` : null;
}

function saveCardVolumeState() {
    const key = getCardVolumeStorageKey(window.cardId);
    if (!key) return;
    const media = getActiveCardMedia();
    const flyout = document.getElementById('volumeFlyout');
    sessionStorage.setItem(key, JSON.stringify({
        volume: media ? media.volume : (window.lastVolume ?? 0.5),
        flyoutOpen: !!(flyout && flyout.classList.contains('visible'))
    }));
}

function restoreCardVolumeState() {
    const key = getCardVolumeStorageKey(window.cardId);
    if (!key) return null;
    try {
        return JSON.parse(sessionStorage.getItem(key) || 'null');
    } catch {
        return null;
    }
}

function applyCardVolumeState(savedState) {
    if (!savedState) return 0.5;
    const media = getActiveCardMedia();
    const slider = document.getElementById('volumeSlider');
    const levelDisplay = document.getElementById('volumeLevel');
    const flyoutOn = document.getElementById('flyoutSpeakerOn');
    const flyoutMute = document.getElementById('flyoutSpeakerMute');
    const flyout = document.getElementById('volumeFlyout');
    const volume = typeof savedState.volume === 'number' ? savedState.volume : 0.5;

    if (media) {
        media.volume = volume;
        window.lastVolume = volume > 0 ? volume : (window.lastVolume || 0.5);
    }
    if (slider) slider.value = Math.round(volume * 100);
    if (levelDisplay) levelDisplay.textContent = Math.round(volume * 100);
    if (volume > 0) {
        if (flyoutOn) flyoutOn.style.display = 'block';
        if (flyoutMute) flyoutMute.style.display = 'none';
    } else {
        if (flyoutOn) flyoutOn.style.display = 'none';
        if (flyoutMute) flyoutMute.style.display = 'block';
    }
    if (savedState.flyoutOpen && flyout) {
        flyout.classList.add('visible');
    }
    syncMainSpeakerIcon();
    return volume;
}

function getMusicClipConfig() {
    const start = window.customMusicStartTime ?? 0;
    const clipLength = window.customMusicClipLength ?? window.customMusicDuration;
    const totalDuration = window.cardVideoDuration ?? window.previewVideoDuration;
    return { start, clipLength, totalDuration };
}

function applyMusicTiming(media, onStart) {
    if (!media) return;
    const { start, clipLength, totalDuration } = getMusicClipConfig();
    const playStartAt = performance.now();

    const mediaDuration = Number.isFinite(media.duration) && media.duration > 0 ? media.duration : null;
    const effectiveStart = mediaDuration ? Math.min(start, Math.max(0, mediaDuration - 0.5)) : start;
    const clipEnd = clipLength ? effectiveStart + clipLength : null;

    media.loop = !clipLength && !totalDuration;
    if (onStart) onStart(media);

    const seekToStart = () => {
        try { media.currentTime = effectiveStart; } catch (e) {}
    };

    if (media.readyState >= 1) {
        seekToStart();
    } else {
        media.addEventListener('loadedmetadata', seekToStart, { once: true });
    }

    media.onended = () => {
        seekToStart();
        if (!totalDuration) {
            media.play().catch(() => {});
        }
    };

    media.ontimeupdate = () => {
        if (media.currentTime < effectiveStart - 0.05 && media.currentTime + 0.1 < (mediaDuration || 9999)) {
            seekToStart();
            return;
        }
        const elapsed = (performance.now() - playStartAt) / 1000;
        if (totalDuration && elapsed >= totalDuration) {
            media.pause();
            seekToStart();
            syncMainSpeakerIcon();
            return;
        }
        const loopEnd = clipEnd ?? (totalDuration ? effectiveStart + totalDuration : null);
        if (loopEnd && media.currentTime >= loopEnd - 0.05) {
            seekToStart();
            if (!totalDuration && media.paused) {
                media.play().catch(() => {});
            }
        }
    };
}

function applyVideoDurationSync(videoEl, audioEl) {
    if (!videoEl || !window.cardVideoDuration) return;
    videoEl.loop = false;
    videoEl.onended = () => {
        if (audioEl && hasValidMediaSrc(audioEl)) {
            audioEl.pause();
        }
        syncMainSpeakerIcon();
    };
}

function resolveCardVideoDuration(videoEl, storedDuration) {
    const parsed = parseFloat(storedDuration);
    if (Number.isFinite(parsed) && parsed > 0) {
        window.cardVideoDuration = parsed;
        return Promise.resolve(parsed);
    }
    if (!videoEl) return Promise.resolve(undefined);
    return new Promise((resolve) => {
        let settled = false;
        const finish = (value) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            resolve(value);
        };
        const timeout = setTimeout(() => finish(undefined), 5000);
        const applyDuration = () => {
            if (Number.isFinite(videoEl.duration) && videoEl.duration > 0) {
                window.cardVideoDuration = videoEl.duration;
                finish(videoEl.duration);
            } else {
                finish(undefined);
            }
        };
        if (Number.isFinite(videoEl.duration) && videoEl.duration > 0) {
            applyDuration();
            return;
        }
        videoEl.addEventListener('loadedmetadata', applyDuration, { once: true });
        videoEl.addEventListener('error', () => finish(undefined), { once: true });
    });
}

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

window.onVideoFileSelected = async function (input) {
    const file = input?.files?.[0];
    if (!file) return;

    if (!isVideoFile(file)) {
        alert("Please upload a valid video file");
        window.clearVideoSelection();
        return;
    }

    try {
        const duration = await getVideoFileDuration(file);
        if (duration > MAX_VIDEO_SECONDS) {
            alert("Video must be 60 seconds or less. Please upload a shorter video.");
            window.clearVideoSelection();
            return;
        }
        window.selectedVideoDuration = duration;
    } catch {
        alert("Could not read video duration. Please try another file.");
        window.clearVideoSelection();
        return;
    }

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
    updateVideoEditVisibility();
    if (typeof window.initVideoDurationSlider === 'function') {
        window.initVideoDurationSlider(window.selectedVideoDuration);
    }
    if (typeof window.updateLivePreview === 'function') {
        window.updateLivePreview();
    }
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
    window.selectedVideoDuration = undefined;
    updateVideoEditVisibility();
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

function showCardPageLoader() {
    window.dispatchEvent(new Event('card-page-loading'));

    const wrapper = document.querySelector('.celebration-wrapper');
    if (wrapper) wrapper.style.visibility = 'hidden';

    const form = document.querySelector('.gen-container');
    if (form) form.style.visibility = 'hidden';
}

function hideCardPageLoader() {
    window.dispatchEvent(new Event('card-page-ready'));

    const wrapper = document.querySelector('.celebration-wrapper');
    if (wrapper) {
        wrapper.style.visibility = '';
        wrapper.style.display = '';
    }

    const form = document.querySelector('.gen-container');
    if (form) form.style.visibility = '';

    const loader = document.getElementById('cardPageLoader');
    if (loader) loader.remove();
}

function playCardMediaWhenReady(media, onStart) {
    if (!media || !hasValidMediaSrc(media)) return;

    const startPlayback = () => {
        const savedVolumeState = restoreCardVolumeState();
        const restoredVolume = applyCardVolumeState(savedVolumeState);
        media.volume = savedVolumeState ? restoredVolume : 0.5;

        applyMusicTiming(media, onStart);

        media.play().then(() => {
            syncMainSpeakerIcon();
            saveCardVolumeState();
        }).catch(() => {
            syncMainSpeakerIcon();
            const playOnInteraction = () => {
                applyMusicTiming(media, null);
                media.play().then(() => {
                    syncMainSpeakerIcon();
                    saveCardVolumeState();
                }).catch(() => { });
                document.removeEventListener('pointerdown', playOnInteraction, true);
            };
            document.addEventListener('pointerdown', playOnInteraction, true);
        });
    };

    if (media.readyState >= 2) {
        startPlayback();
    } else {
        media.addEventListener('canplay', startPlayback, { once: true });
        media.load();
    }
}

window.generateLink = async function () {
    try {
        const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab;
        
        let iName = document.getElementById('nameInput')?.value || '';
        let iType = document.getElementById('typeInput')?.value || 'Congratulations';
        let iDesc = document.getElementById('descInput')?.value || '';
        
        // If "No Text" tab is selected, clear text fields
        if (activeTab === '6') {
            iName = '';
            iType = 'Congratulations'; // default fallback
            iDesc = '';
        } else if (!iName || !iName.trim()) {
            alert("Please enter a name");
            return;
        }

        const iImg = document.getElementById('imgInput')?.value;
        const iFile = document.getElementById('fileInput')?.files[0];
        const useVideo = hasActiveVideoSelection();
        const iVideoFile = useVideo ? document.getElementById('videoInput')?.files[0] : null;
        const iThemePref = document.getElementById('themeInput')?.value || 'dark';
        const cardThemeDefaults = getCardThemeDefaults(iThemePref);
        const iMusic = document.getElementById('musicInput')?.value;
        const iMusicCustomUrl = document.getElementById('musicCustomUrl')?.value;
        const iMusicStartTime = document.getElementById('musicStartTime')?.value;
        const iMusicDuration = document.getElementById('musicDuration')?.value;
        
        const iDefaultMusic = document.getElementById('defaultMusicInput')?.value;
        const videoStartInput = document.getElementById('videoStartInput')?.value;
        const videoEndInput = document.getElementById('videoEndInput')?.value;

        if (iMusic === 'custom' && !iMusicCustomUrl) {
            alert("Please confirm your music selection");
            return;
        }

        showCardPageLoader();

        let finalImg = "";
        let finalVideo = "";
        let videoDurationSec;

        if (iVideoFile) {
            if (!isVideoFile(iVideoFile)) {
                alert("Please upload a valid video file");
                hideCardPageLoader();
                return;
            }
            if (iVideoFile.size > MAX_VIDEO_BYTES) {
                alert("Video is too large. Please upload a video under 20MB.");
                hideCardPageLoader();
                return;
            }
            try {
                videoDurationSec = window.selectedVideoDuration || await getVideoFileDuration(iVideoFile);
            } catch {
                alert("Could not read video duration. Please try another file.");
                hideCardPageLoader();
                return;
            }
            if (videoDurationSec > MAX_VIDEO_SECONDS) {
                alert("Video must be 60 seconds or less. Please upload a shorter video.");
                hideCardPageLoader();
                return;
            }
            finalVideo = await fileToBase64(iVideoFile);
        } else if (iFile) {
            if (!isImageFile(iFile)) {
                alert("Please upload a valid image file");
                hideCardPageLoader();
                return;
            }
            finalImg = await fileToBase64(iFile);
        } else if (iImg && iImg.trim()) {
            const isValidImage = await validateImageUrl(iImg.trim());
            if (!isValidImage) {
                alert("Please enter a valid image URL");
                hideCardPageLoader();
                return;
            }
            finalImg = iImg.trim();
        }

        let resolvedMusic;
        if (activeTab === '3' || activeTab === '5' || activeTab === '6') {
            if (iMusic === 'custom' && iMusicCustomUrl) {
                resolvedMusic = 'custom';
            } else if (iDefaultMusic && iDefaultMusic !== 'none') {
                resolvedMusic = iDefaultMusic;
            } else if (iMusic && iMusic !== 'none') {
                resolvedMusic = iMusic;
            } else {
                resolvedMusic = getDefaultMusicForMessageType(iType || 'Congratulations');
            }
        } else if (activeTab === '4' && finalVideo) {
            resolvedMusic = 'video';
        } else {
            resolvedMusic = 'none';
        }
        
        const computedPageColor = cardThemeDefaults.pageColor;
        const computedCardColor = cardThemeDefaults.cardColor;
        const computedTextColor = cardThemeDefaults.textColor;

        const cardData = {
            n: iName.trim(),
            m: iType,
            i: finalImg,
            v: finalVideo || undefined,
            vd: videoDurationSec !== undefined ? videoDurationSec : undefined,
            vst: videoStartInput ? parseFloat(videoStartInput) : undefined,
            vet: videoEndInput ? parseFloat(videoEndInput) : undefined,
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
            hideCardPageLoader();
            return;
        }

        const newCardRef = database.ref('cards').push();
        await newCardRef.set(stripUndefinedFields(cardData));
        window.location.href = `/card/${newCardRef.key}`;
    } catch (err) {
        console.error(err);
        hideCardPageLoader();
        alert('Could not create card. Please try again.');
    }
};

const UI_THEME_KEY = 'ui-theme';

function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredThemePreference() {
    return localStorage.getItem(UI_THEME_KEY) || localStorage.getItem('card-theme') || 'system';
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

function getCardThemeDefaults(themeMode) {
    const mode = getResolvedTheme(themeMode || 'dark');
    if (mode === 'light') {
        return { pageColor: '#f0f2f5', cardColor: '#ffffff', textColor: '#000000' };
    }
    return { pageColor: '#050505', cardColor: '#111111', textColor: '#ffffff' };
}

function syncThemeButtons(themePreference) {
    const buttons = document.querySelectorAll('.theme-switch-btn');
    buttons.forEach((button) => {
        const isSelected = button.dataset.theme === themePreference;
        button.classList.toggle('selected', isSelected);
    });
}

function applyTheme(themePreference) {
    const preference = themePreference || getStoredThemePreference() || 'system';
    const resolvedTheme = getResolvedTheme(preference);

    document.documentElement.setAttribute('data-theme', resolvedTheme);
    localStorage.setItem(UI_THEME_KEY, preference);
    syncThemeButtons(preference);
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
    const themeInput = document.getElementById('themeInput');
    const cardTheme = themeInput?.value || 'dark';
    return getCardThemeDefaults(cardTheme);
}

function applyCardTheme({ pageColor, cardColor, textColor, themeMode } = {}) {
    const resolvedTheme = getResolvedTheme(themeMode || document.getElementById('themeInput')?.value || 'dark');
    const defaults = getCardThemeDefaults(resolvedTheme);
    const finalCardColor = cardColor || defaults.cardColor;
    const finalTextColor = textColor || defaults.textColor;
    const isCardPage = !!document.getElementById('cardToDownload');

    const previewCard = document.getElementById('livePreviewCard');
    const downloadCard = document.getElementById('cardToDownload');
    if (previewCard) previewCard.setAttribute('data-card-theme', resolvedTheme);
    if (downloadCard) downloadCard.setAttribute('data-card-theme', resolvedTheme);

    if (isCardPage && pageColor && pageColor !== '' && pageColor !== '#050505' && pageColor !== '#ffffff' && pageColor !== '#f0f2f5') {
        document.documentElement.style.setProperty('--bg-dark', pageColor);
        document.body.style.backgroundColor = pageColor;
        document.body.style.backgroundImage = 'none';
    } else if (isCardPage && pageColor) {
        document.documentElement.style.setProperty('--bg-dark', pageColor);
        document.body.style.backgroundColor = pageColor;
        document.body.style.backgroundImage = 'none';
    }

    if (previewCard) {
        previewCard.setAttribute('data-card-theme', resolvedTheme);
        previewCard.style.setProperty('--card-bg', finalCardColor, 'important');
        previewCard.style.setProperty('--text-main', finalTextColor, 'important');
        previewCard.style.setProperty('--text-dim', hexToRgba(finalTextColor, 0.65), 'important');
        previewCard.style.setProperty('--heading-accent', resolvedTheme === 'light' ? finalTextColor : '#0486c2', 'important');
        previewCard.style.setProperty('background-color', finalCardColor, 'important');
        previewCard.style.setProperty('color', finalTextColor, 'important');
    }
    if (downloadCard) {
        downloadCard.setAttribute('data-card-theme', resolvedTheme);
        downloadCard.style.setProperty('--card-bg', finalCardColor, 'important');
        downloadCard.style.setProperty('--text-main', finalTextColor, 'important');
        downloadCard.style.setProperty('--text-dim', hexToRgba(finalTextColor, 0.65), 'important');
        downloadCard.style.setProperty('--heading-accent', resolvedTheme === 'light' ? finalTextColor : '#0486c2', 'important');
        downloadCard.style.setProperty('background-color', finalCardColor, 'important');
        downloadCard.style.setProperty('color', finalTextColor, 'important');
    }
    const status = document.getElementById('colorThemeStatus');
    if (status) status.textContent = '';
}

function applyPreviewCardTheme() {
    const themeMode = document.getElementById('themeInput')?.value || 'dark';
    const defaults = getCardThemeDefaults(themeMode);
    applyCardTheme({
        pageColor: defaults.pageColor,
        cardColor: defaults.cardColor,
        textColor: defaults.textColor,
        themeMode
    });
}
window.applyPreviewCardTheme = applyPreviewCardTheme;

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
    const themeMode = document.getElementById('themeInput')?.value || 'dark';
    const defaults = getCardThemeDefaults(themeMode);

    applyCardTheme({
        pageColor: pageColor || defaults.pageColor,
        cardColor: cardColor || defaults.cardColor,
        textColor: textColor || defaults.textColor,
        themeMode
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
    const currentTheme = document.getElementById('cardToDownload')?.getAttribute('data-card-theme') || 'dark';
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

    const media = getActiveCardMedia();
    if (!media) return;

    setMainSpeakerIcon(media.volume > 0);
}

function getActiveCardMedia() {
    const audio = document.getElementById('bgMusic');
    const video = document.getElementById('cardBgVideo') || document.getElementById('previewBgVideo');

    if (window.cardHasExternalMusic && hasValidMediaSrc(audio)) {
        return audio;
    }
    if (window.cardUsesVideoAudio && hasValidMediaSrc(video)) {
        return video;
    }
    if (window.isPreviewMode && hasValidMediaSrc(audio)) {
        return audio;
    }
    if (hasValidMediaSrc(audio)) {
        return audio;
    }
    return null;
}

function startCardMediaPlayback() {
    const media = getActiveCardMedia();
    if (!media) return;

    if (media === document.getElementById('bgMusic')) {
        applyMusicTiming(media, null);
    }

    media.play().then(() => {
        syncMainSpeakerIcon();
        saveCardVolumeState();
    }).catch(() => {
        syncMainSpeakerIcon();
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
    saveCardVolumeState();
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
            if (media.paused) {
                if (media === document.getElementById('bgMusic')) applyMusicTiming(media, null);
                media.play().catch(e => { });
            }
            syncMainSpeakerIcon();
        }
    }
    if (levelDisplay) levelDisplay.textContent = val;
    saveCardVolumeState();
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
        if (media.paused) {
            if (media === document.getElementById('bgMusic')) applyMusicTiming(media, null);
            media.play().catch(e => { });
        }
        syncMainSpeakerIcon();
    }
    saveCardVolumeState();
};

// Automatic Start (Called when card data is ready)
function startCardEffects() {
    hideCardPageLoader();

    applyCardVolumeState(restoreCardVolumeState());

    const cardMusic = window.cardData?.s;
    const cardHasVideo = !!(window.cardData?.v && window.cardData.v.trim());
    const cardHasMusic = cardMusic && cardMusic !== 'none';
    if (cardHasVideo || cardHasMusic) {
        confettiBomb();
        setInterval(confettiBomb, 3000);
    }

    const video = document.getElementById('cardBgVideo');
    const audio = document.getElementById('bgMusic');

    if (window.cardUsesVideoAudio && video && hasValidMediaSrc(video)) {
        playCardMediaWhenReady(video);
        if (typeof AOS !== 'undefined') AOS.refresh();
        return;
    }

    if (video && hasValidMediaSrc(video)) {
        video.muted = true;
        applyVideoDurationSync(video, audio);
        video.play().catch(() => { });
    }

    if (audio && hasValidMediaSrc(audio)) {
        playCardMediaWhenReady(audio);
    }

    if (typeof AOS !== 'undefined') {
        AOS.refresh();
    }
}

// Initialization Logic
function runAppInitialization() {
    applyTheme(getStoredThemePreference());
    initThemeSwitcher();

    const urlParams = new URLSearchParams(window.location.search);
    const cardId = window.__CARD_ID__ || urlParams.get('id');
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
        showCardPageLoader();
        window.addEventListener('beforeunload', saveCardVolumeState);
        database.ref('cards/' + cardId).once('value').then(async (snapshot) => {
            const data = snapshot.val();
            if (data) {
                try {
                    await renderCard(data);
                    startCardEffects();
                } catch (error) {
                    console.error(error);
                    hideCardPageLoader();
                }
            } else {
                hideCardPageLoader();
                window.location.href = '/';
            }
        }).catch((error) => {
            console.error(error);
            hideCardPageLoader();
            window.location.href = '/';
        });
    } else if (window.location.pathname.includes('card.html') || (window.location.pathname.startsWith('/card') && !cardId)) {
        window.location.href = '/';
    }

    async function renderCard(data) {
        window.cardData = data;
        const savedCustomTheme = JSON.parse(localStorage.getItem('card-custom-theme') || 'null');
        const { n: name, m: type, i: img, v: video, vd: videoDuration, d: desc, y: design, s: music, h: themeMode, pc: pageColor, cc: cardColor, tc: textColor, sm: customMusic, sms: customMusicStart, smd: customMusicDuration } = data;
        const resolvedThemeMode = getResolvedTheme(themeMode || savedCustomTheme?.themeMode || 'dark');
        const resolvedPageColor = pageColor || savedCustomTheme?.pageColor;
        const resolvedCardColor = cardColor || savedCustomTheme?.cardColor;
        const resolvedTextColor = textColor || savedCustomTheme?.textColor;

        window.cardUsesVideoAudio = false;
        window.cardHasExternalMusic = false;
        window.cardVideoDuration = undefined;
        window.isPreviewMode = false;

        applyDesign(design || 'sparkle');
        applyTheme(getStoredThemePreference());
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
                videoEl.crossOrigin = 'anonymous';
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
            await resolveCardVideoDuration(videoEl, videoDuration);

            if (hasExternalMusic && audio) {
                videoEl.muted = true;
                window.cardUsesVideoAudio = false;
                if (music === 'custom' && customMusic) {
                    audio.src = customMusic;
                    audio.load();
                    window.customMusicStartTime = customMusicStart !== undefined ? parseFloat(customMusicStart) : 0;
                    window.customMusicClipLength = customMusicDuration !== undefined ? parseFloat(customMusicDuration) : 15;
                    window.customMusicDuration = window.cardVideoDuration || window.customMusicClipLength;
                    window.cardHasExternalMusic = true;
                } else if (musicTracks[music]) {
                    audio.src = musicTracks[music];
                    audio.load();
                    if (window.cardVideoDuration) {
                        window.customMusicStartTime = 0;
                        window.customMusicClipLength = undefined;
                        window.customMusicDuration = window.cardVideoDuration;
                    } else {
                        window.customMusicStartTime = undefined;
                        window.customMusicClipLength = undefined;
                        window.customMusicDuration = undefined;
                    }
                    window.cardHasExternalMusic = true;
                }
                if (window.cardVideoDuration) {
                    applyVideoDurationSync(videoEl, audio);
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
                applyCardVolumeState(restoreCardVolumeState());
            }
        } else if (audio) {
            if (music && music !== 'none') {
                if (music === 'custom' && customMusic) {
                    audio.src = customMusic;
                    audio.load();
                    window.customMusicStartTime = customMusicStart !== undefined ? parseFloat(customMusicStart) : 0;
                    window.customMusicClipLength = customMusicDuration !== undefined ? parseFloat(customMusicDuration) : 15;
                    window.customMusicDuration = customMusicDuration !== undefined ? parseFloat(customMusicDuration) : 15;
                    window.cardHasExternalMusic = true;
                } else if (musicTracks[music]) {
                    audio.src = musicTracks[music];
                    audio.load();
                    window.customMusicStartTime = undefined;
                    window.customMusicDuration = undefined;
                    window.cardHasExternalMusic = true;
                }
                if (hasValidMediaSrc(audio) && musicControlGroup) {
                    musicControlGroup.style.display = 'flex';
                    applyCardVolumeState(restoreCardVolumeState());
                }
            } else {
                audio.removeAttribute('src');
                audio.pause();
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
}

window.runAppInitialization = runAppInitialization;

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
    const effectiveDur = getEffectiveClipDuration(durationVal);
    const maxStart = Math.max(0, previewEnd - effectiveDur);
    const playStart = Math.min(Math.max(0, startVal), maxStart);
    const playEnd = Math.min(playStart + effectiveDur, previewEnd);
    return {
        playStart,
        playEnd
    };
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
        try {
            trimAudioPreview.currentTime = playStart;
        } catch (e) { }
        trimAudioPreview.play().catch(() => { });
        setTrimPlayBtnState(true);

        trimTimer = setInterval(() => {
            if (trimAudioPreview.currentTime >= playEnd || trimAudioPreview.ended) {
                try {
                    trimAudioPreview.currentTime = playStart;
                } catch (e) { }
                if (trimAudioPreview.paused) {
                    trimAudioPreview.play().catch(() => { });
                }
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
        try {
            trimAudioPreview.currentTime = playStart;
            trimAudioPreview.play().catch(() => { });
        } catch (e) { }
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
    activeSongLengthSecs = WF_PREVIEW_SECS;
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
                activeSongLengthSecs = probe.duration;
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

function buildItunesSearchUrl(term) {
    const params = new URLSearchParams({
        term: term,
        country: 'in',
        entity: 'song',
        limit: '15'
    });
    return `/api/itunes/search?${params.toString()}`;
}

window.loadDefaultTrendingSongs = function () {
    const container = document.getElementById('musicResultsContainer');
    container.innerHTML = '<div style="text-align: center; color: var(--text-dim); padding: 2rem;">Loading Indian Trending Songs...</div>';

    // Fetch popular Indian/Bollywood tracks using a predefined term with country code 'IN'
    const url = buildItunesSearchUrl('Bollywood Hits');

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

    const url = buildItunesSearchUrl(query);

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

    if (typeof window.syncPreviewMusic === 'function') {
        window.syncPreviewMusic();
    }
    if (typeof window.updateLivePreview === 'function') {
        window.updateLivePreview();
    }
};

window.downloadCard = async function () {
    if (!window.cardData) return;

    const btn = document.getElementById('downloadCardBtn');
    if (btn) btn.disabled = true;

    const originalIcon = btn.innerHTML;
    btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin"><circle cx="12" cy="12" r="10" stroke-dasharray="31.4 31.4" stroke-dashoffset="0"></circle></svg>`;
    if (!document.getElementById('spinStyle')) {
        const style = document.createElement('style');
        style.id = 'spinStyle';
        style.innerHTML = `@keyframes spin { 100% { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`;
        document.head.appendChild(style);
    }

    try {
        const cardMusic = window.cardData.s;
        const isVideoCard = !!(window.cardData.v && window.cardData.v.trim());
        const isCustomMusic = cardMusic === 'custom';
        const usesVideoAudio = isVideoCard && cardMusic === 'video';
        const hasExternalMusic = cardMusic && cardMusic !== 'none' && cardMusic !== 'video';
        const hasVideoDownload = isVideoCard || isCustomMusic || hasExternalMusic;

        const controls = document.querySelector('.controls-container');
        if (controls) controls.style.display = 'none';

        const cardContainer = document.getElementById('cardToDownload');
        const videoEl = document.getElementById('cardBgVideo');
        const audioEl = document.getElementById('bgMusic');

        if (!hasVideoDownload) {
            const confettiCanvas = document.getElementById('confettiCanvas');
            const confettiWasVisible = confettiCanvas ? confettiCanvas.style.visibility : '';
            if (confettiCanvas) confettiCanvas.style.visibility = 'hidden';

            if (typeof htmlToImage !== 'undefined') {
                const dataUrl = await htmlToImage.toPng(cardContainer, {
                    cacheBust: true,
                    pixelRatio: 2,
                    style: { transform: 'none', margin: '0' },
                    filter: (node) => node.id !== 'cardBgVideo' && node.id !== 'confettiCanvas'
                });
                const link = document.createElement('a');
                link.download = 'congratulations_card.png';
                link.href = dataUrl;
                link.click();
            } else {
                alert('Image export library not loaded.');
            }
            if (confettiCanvas) confettiCanvas.style.visibility = confettiWasVisible;
            if (controls) controls.style.display = '';
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalIcon;
            }
        } else {
            if (typeof htmlToImage === 'undefined') {
                alert('Image export library not loaded.');
                return;
            }

            let wasVideoVisible = false;
            if (videoEl && videoEl.style.display !== 'none') {
                wasVideoVisible = true;
                videoEl.style.display = 'none';
            }

            const computedBg = getComputedStyle(cardContainer).backgroundColor;
            const origBg = cardContainer.style.background;
            const origBgColor = cardContainer.style.backgroundColor;
            cardContainer.style.background = 'transparent';
            cardContainer.style.backgroundColor = 'transparent';

            let overlayDataUrl;
            try {
                overlayDataUrl = await htmlToImage.toPng(cardContainer, {
                    cacheBust: true,
                    pixelRatio: 2,
                    backgroundColor: 'rgba(0,0,0,0)',
                    style: { transform: 'none', margin: '0' },
                    filter: (node) => {
                        return node.id !== 'cardBgVideo' && node.id !== 'userImgContainer' && node.id !== 'confettiCanvas';
                    }
                });
            } catch(imgErr) {
                const errName = (imgErr && imgErr.name) ? imgErr.name : '';
                const errMsg = (imgErr && imgErr.message) ? imgErr.message : '';
                throw new Error('Card overlay capture failed' + (errName ? ' (' + errName + ')' : '') + (errMsg ? ': ' + errMsg : '. This may be caused by a cross-origin image. Try using an uploaded image instead of a URL.'));
            }

            cardContainer.style.background = origBg;
            cardContainer.style.backgroundColor = origBgColor;

            if (wasVideoVisible) {
                videoEl.style.display = 'block';
            }

            const overlayImg = new Image();
            await new Promise((resolve, reject) => {
                overlayImg.onload = resolve;
                overlayImg.onerror = () => reject(new Error("Failed to load overlay image"));
                overlayImg.src = overlayDataUrl;
            });

            let bgImg = null;
            if (!isVideoCard) {
                const userImg = document.getElementById('userImg');
                if (userImg && userImg.src) {
                    bgImg = userImg;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = cardContainer.offsetWidth * 2;
            canvas.height = cardContainer.offsetHeight * 2;
            const ctx = canvas.getContext('2d');

            const stream = canvas.captureStream(30);

            let audioSourceEl = null;
            if (usesVideoAudio) {
                audioSourceEl = videoEl;
            } else if (hasExternalMusic || isCustomMusic) {
                audioSourceEl = audioEl;
                if (isVideoCard && videoEl) videoEl.muted = true;
            } else if (isVideoCard) {
                audioSourceEl = videoEl;
            } else {
                audioSourceEl = audioEl;
            }

            if (!audioSourceEl) {
                throw new Error('No audio source available for export');
            }

            let audioCtx = audioSourceEl._audioCtx && audioSourceEl._audioCtx.state !== 'closed'
                ? audioSourceEl._audioCtx
                : new (window.AudioContext || window.webkitAudioContext)();
            if (!audioSourceEl._audioCtx || audioSourceEl._audioCtx.state === 'closed') {
                audioSourceEl._audioCtx = audioCtx;
            }
            let dest = audioCtx.createMediaStreamDestination();

            const audioStart = isCustomMusic && window.cardData.sms !== undefined ? parseFloat(window.cardData.sms) : 0;
            const audioClipLen = isCustomMusic && window.cardData.smd !== undefined ? parseFloat(window.cardData.smd) : null;

            const origCurrentTime = audioSourceEl.currentTime;
            const origPaused = audioSourceEl.paused;
            const origLoop = audioSourceEl.loop;
            const origOnTimeUpdate = audioSourceEl.ontimeupdate;

            audioSourceEl.loop = false;
            audioSourceEl.currentTime = audioStart;

            if (audioClipLen) {
                audioSourceEl.ontimeupdate = () => {
                    if (audioSourceEl.currentTime < audioStart - 0.05) {
                        audioSourceEl.currentTime = audioStart;
                    }
                    if (audioSourceEl.currentTime >= audioStart + audioClipLen - 0.05) {
                        audioSourceEl.currentTime = audioStart;
                    }
                };
            }

            if (isVideoCard && videoEl) {
                videoEl.currentTime = 0;
                try { await videoEl.play(); } catch (e) { console.warn('Video play failed', e); }
            }

            try {
               await audioSourceEl.play();
            } catch(e) {
                console.warn("Auto-play blocked or failed", e);
            }

            let audioTrack = null;
            if (audioSourceEl.captureStream) {
                try {
                    const mediaStream = audioSourceEl.captureStream();
                    if (mediaStream.getAudioTracks().length > 0) {
                        audioTrack = mediaStream.getAudioTracks()[0];
                    }
                } catch(e) {
                    console.warn("captureStream failed:", e);
                }
            }
            if (!audioTrack) {
                try {
                    if (!audioSourceEl._audioSourceNode) {
                        audioSourceEl._audioSourceNode = audioCtx.createMediaElementSource(audioSourceEl);
                        audioSourceEl._audioSourceNode.connect(audioCtx.destination);
                    }
                    audioSourceEl._audioSourceNode.connect(dest);
                    audioTrack = dest.stream.getAudioTracks()[0];
                } catch(e) {
                    const eName = (e && (e.name || e.code)) ? (e.name || e.code) : '';
                    const eMsg = (e && e.message) ? e.message : '';
                    console.warn("Audio capture failed:", eName || eMsg || 'unknown error', e);
                }
            }
            
            if (audioTrack) {
                stream.addTrack(audioTrack);
            }

            let mimeType = 'video/webm';
            let fileExt = 'webm';
            if (typeof MediaRecorder.isTypeSupported === 'function' && !MediaRecorder.isTypeSupported(mimeType)) {
                if (MediaRecorder.isTypeSupported('video/mp4')) {
                    mimeType = 'video/mp4';
                    fileExt = 'mp4';
                } else {
                    mimeType = ''; 
                }
            }
            const options = mimeType ? { mimeType } : {};
            const recorder = new MediaRecorder(stream, options);

            const chunks = [];
            recorder.ondataavailable = e => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            let durationSecs = 15;
            if (isVideoCard) {
                durationSecs = window.cardVideoDuration || (videoEl && videoEl.duration > 0 ? videoEl.duration : 15);
            } else if (isCustomMusic) {
                durationSecs = window.cardData.smd || 15;
            } else if (hasExternalMusic && musicTracks[cardMusic]) {
                durationSecs = 15;
            }
            
            let recording = true;
            recorder.onstop = () => {
                recording = false;
                const blob = new Blob(chunks, { type: mimeType || 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `congratulations_card.${fileExt}`;
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                }, 100);

                if (controls) controls.style.display = '';
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = originalIcon;
                }

                audioSourceEl.pause();
                audioSourceEl.currentTime = origCurrentTime;
                audioSourceEl.loop = origLoop;
                audioSourceEl.ontimeupdate = origOnTimeUpdate;
                if (isVideoCard && videoEl) {
                    videoEl.muted = !usesVideoAudio;
                }
                if (!origPaused) audioSourceEl.play().catch(() => {});
            };

            recorder.onerror = (e) => {
                // MediaRecorderErrorEvent - extract the actual error
                const recErr = e && e.error ? e.error : e;
                const recErrName = (recErr && recErr.name) ? recErr.name : '';
                const recErrMsg = (recErr && recErr.message) ? recErr.message : '';
                console.error("MediaRecorder Error:", recErrName || recErrMsg || recErr);
                recording = false;
                // Restore UI on recorder error
                if (controls) controls.style.display = '';
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = originalIcon;
                }
                alert('Recording failed: ' + (recErrName || recErrMsg || 'Media format or source not supported. Try downloading a text/image card instead.'));
            };

            try {
                recorder.start();
            } catch (err) {
                throw new Error("Failed to start recording. Media format might not be supported.");
            }

            const confettiCanvas = document.getElementById('confettiCanvas');
            
            function renderFrame() {
                if (!recording) return;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                ctx.fillStyle = computedBg || '#111';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                try {
                    if (isVideoCard && videoEl.readyState >= 2 && videoEl.style.display !== 'none') {
                        const vRatio = videoEl.videoWidth / videoEl.videoHeight;
                        const cRatio = canvas.width / canvas.height;
                        let drawW = canvas.width;
                        let drawH = canvas.height;
                        let dx = 0; let dy = 0;
                        if (vRatio > cRatio) {
                            drawW = canvas.height * vRatio;
                            dx = (canvas.width - drawW) / 2;
                        } else {
                            drawH = canvas.width / vRatio;
                            dy = (canvas.height - drawH) / 2;
                        }
                        ctx.drawImage(videoEl, dx, dy, drawW, drawH);
                    } else if (!isVideoCard && bgImg) {
                        const imgRatio = bgImg.naturalWidth / bgImg.naturalHeight;
                        const cRatio = canvas.width / canvas.height;
                        let drawW = canvas.width;
                        let drawH = canvas.height;
                        let dx = 0; let dy = 0;
                        if (imgRatio > cRatio) {
                            drawH = canvas.width / imgRatio;
                            dy = (canvas.height - drawH) / 2;
                        } else {
                            drawW = canvas.height * imgRatio;
                            dx = (canvas.width - drawW) / 2;
                        }
                        ctx.drawImage(bgImg, dx, dy, drawW, drawH);
                    }

                    if (confettiCanvas) {
                        ctx.drawImage(confettiCanvas, 0, 0, canvas.width, canvas.height);
                    }

                    ctx.drawImage(overlayImg, 0, 0, canvas.width, canvas.height);
                } catch (frameErr) {
                    console.warn("Render frame error:", frameErr);
                }

                requestAnimationFrame(renderFrame);
            }
            
            renderFrame();

            setTimeout(() => {
                if (recorder.state === 'recording') {
                    recorder.stop();
                }
            }, durationSecs * 1000);
        }
    } catch (err) {
        // DOMException and some browser errors serialize as {} with JSON.stringify
        // MediaRecorderErrorEvent arrives as an Event object - extract .error property
        const actualErr = (err && typeof err === 'object' && err.error) ? err.error : err;
        const errName = (actualErr && actualErr.name) ? actualErr.name : '';
        const errMsg = actualErr instanceof Error
            ? actualErr.message
            : (actualErr && actualErr.message ? actualErr.message : '');
        const displayMsg = errMsg || errName
            ? ((errName ? errName + ': ' : '') + errMsg)
            : 'Cross-origin media error. If you used an image URL, try uploading the image directly instead.';
        console.error("Download Error:", errName || errMsg || actualErr);
        alert('Failed to generate download: ' + displayMsg);
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalIcon;
        }
        const controls = document.querySelector('.controls-container');
        if (controls) controls.style.display = '';
    }
};

// --- Video duration slider ---

function updateVideoEditVisibility() {
    const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab;
    const videoTabs = ['4', '5', '6'];
    const group = document.getElementById('videoEditGroup');
    const hasVideo = Number.isFinite(window.selectedVideoDuration) && window.selectedVideoDuration > 0;
    if (group) {
        group.style.display = (videoTabs.includes(activeTab) && hasVideo) ? 'block' : 'none';
    }
}
window.updateVideoEditVisibility = updateVideoEditVisibility;

window.initVideoDurationSlider = function (duration) {
    const slider = document.getElementById('videoDurationSlider');
    const display = document.getElementById('videoDurationDisplay');
    const startInput = document.getElementById('videoStartInput');
    const endInput = document.getElementById('videoEndInput');
    if (!slider || !Number.isFinite(duration) || duration <= 0) return;

    const dur = Math.max(1, Math.floor(duration));
    slider.min = 1;
    slider.max = dur;
    slider.value = dur;
    if (startInput) startInput.value = 0;
    if (endInput) endInput.value = dur;
    if (display) display.textContent = `${dur}s / ${dur}s`;
};

window.onVideoDurationSliderChange = function (val) {
    const display = document.getElementById('videoDurationDisplay');
    const endInput = document.getElementById('videoEndInput');
    const slider = document.getElementById('videoDurationSlider');
    const max = slider ? slider.max : val;
    const useSecs = parseInt(val, 10) || 1;
    if (endInput) endInput.value = useSecs;
    if (display) display.textContent = `${useSecs}s / ${max}s`;
    if (typeof window.updateLivePreview === 'function') {
        window.updateLivePreview();
    }
};

// --- NEW SPLIT LAYOUT LOGIC ---

window.selectCardType = function(tabIndex) {
    // 1. text, 2. image, 3. image+music, 4. video, 5. video+music, 6. video no text
    
    // Update active tab styling
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`.tab-btn[data-tab="${tabIndex}"]`);
    if(activeBtn) activeBtn.classList.add('active');

    // Get group elements
    const nameGroup = document.getElementById('nameGroup');
    const typeGroup = document.getElementById('typeGroup');
    const imageGroup = document.getElementById('imageGroup');
    const videoGroup = document.getElementById('videoGroup');
    const videoEditGroup = document.getElementById('videoEditGroup');
    const descGroup = document.getElementById('descGroup');
    const defaultMusicGroup = document.getElementById('defaultMusicGroup');
    const bgMusicGroup = document.getElementById('bgMusicGroup');
    const themeGroup = document.getElementById('themeGroup');

    // Hide all first
    [nameGroup, typeGroup, imageGroup, videoGroup, videoEditGroup, descGroup, defaultMusicGroup, bgMusicGroup, themeGroup].forEach(el => {
        if(el) el.style.display = 'none';
    });

    // Show based on tabIndex
    if (tabIndex === 1) {
        if(nameGroup) nameGroup.style.display = 'block';
        if(typeGroup) typeGroup.style.display = 'block';
        if(descGroup) descGroup.style.display = 'block';
        if(themeGroup) themeGroup.style.display = 'block';
    } else if (tabIndex === 2) {
        if(nameGroup) nameGroup.style.display = 'block';
        if(typeGroup) typeGroup.style.display = 'block';
        if(imageGroup) imageGroup.style.display = 'block';
        if(descGroup) descGroup.style.display = 'block';
        if(themeGroup) themeGroup.style.display = 'block';
    } else if (tabIndex === 3) {
        if(nameGroup) nameGroup.style.display = 'block';
        if(typeGroup) typeGroup.style.display = 'block';
        if(imageGroup) imageGroup.style.display = 'block';
        if(descGroup) descGroup.style.display = 'block';
        if(defaultMusicGroup) defaultMusicGroup.style.display = 'block';
        if(bgMusicGroup) bgMusicGroup.style.display = 'block';
        if(themeGroup) themeGroup.style.display = 'block';
    } else if (tabIndex === 4) {
        if(nameGroup) nameGroup.style.display = 'block';
        if(typeGroup) typeGroup.style.display = 'block';
        if(videoGroup) videoGroup.style.display = 'block';
        if(descGroup) descGroup.style.display = 'block';
        if(themeGroup) themeGroup.style.display = 'block';
    } else if (tabIndex === 5) {
        if(nameGroup) nameGroup.style.display = 'block';
        if(typeGroup) typeGroup.style.display = 'block';
        if(videoGroup) videoGroup.style.display = 'block';
        if(descGroup) descGroup.style.display = 'block';
        if(bgMusicGroup) bgMusicGroup.style.display = 'block';
        if(defaultMusicGroup) defaultMusicGroup.style.display = 'block';
        if(themeGroup) themeGroup.style.display = 'block';
    } else if (tabIndex === 6) {
        if(videoGroup) videoGroup.style.display = 'block';
        if(defaultMusicGroup) defaultMusicGroup.style.display = 'block';
        if(bgMusicGroup) bgMusicGroup.style.display = 'block';
        if(themeGroup) themeGroup.style.display = 'block';
    }

    updateVideoEditVisibility();
    // Refresh preview based on visible fields
    window.updateLivePreview();
};

window.onDefaultMusicChange = function() {
    const defaultMusic = document.getElementById('defaultMusicInput')?.value;
    const bgMusicBtn = document.getElementById('musicInputBtn');
    
    if (defaultMusic && defaultMusic !== 'none') {
        if(bgMusicBtn) {
            bgMusicBtn.style.opacity = '0.5';
            bgMusicBtn.style.pointerEvents = 'none';
        }
    } else {
        if(bgMusicBtn) {
            bgMusicBtn.style.opacity = '1';
            bgMusicBtn.style.pointerEvents = 'auto';
        }
    }
    if (typeof window.syncPreviewMusic === 'function') {
        window.syncPreviewMusic();
    }
};

window.onImageFileSelected = function(input) {
    const file = input?.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const previewImg = document.getElementById('previewImg');
            if(previewImg) previewImg.src = e.target.result;
            window.updateLivePreview();
        }
        reader.readAsDataURL(file);
    }
};

// Hook into existing video selected function
const originalOnVideoFileSelected = window.onVideoFileSelected;
window.onVideoFileSelected = async function(input) {
    if (originalOnVideoFileSelected) {
        await originalOnVideoFileSelected(input);
    }
    const file = input?.files?.[0];
    if (file) {
        const url = URL.createObjectURL(file);
        const previewVideo = document.getElementById('previewBgVideo');
        if(previewVideo) {
            previewVideo.src = url;
            previewVideo.style.display = 'block';
            previewVideo.play().catch(e=>console.log(e));
        }
        window.updateLivePreview();
    }
};

function getPreviewMusicConfig() {
    const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab;
    const musicTabs = ['3', '5', '6'];
    if (!musicTabs.includes(activeTab)) return null;

    const defaultMusic = document.getElementById('defaultMusicInput')?.value;
    const customMusic = document.getElementById('musicInput')?.value;
    const customUrl = document.getElementById('musicCustomUrl')?.value;
    const startTime = parseFloat(document.getElementById('musicStartTime')?.value || '0');
    const duration = parseFloat(document.getElementById('musicDuration')?.value || '15');

    if (defaultMusic && defaultMusic !== 'none') {
        const label = document.getElementById('defaultMusicInput')?.selectedOptions?.[0]?.textContent || defaultMusic;
        return { type: 'stock', track: defaultMusic, start: 0, clipLength: null, duration: null, label };
    }
    if (customMusic === 'custom' && customUrl) {
        const label = document.getElementById('musicInputDisplay')?.textContent || 'Custom Track';
        return { type: 'custom', url: customUrl, start: startTime, clipLength: duration, duration, label };
    }
    if (activeTab === '3') {
        const msgType = document.getElementById('typeInput')?.value || 'Congratulations';
        const track = getDefaultMusicForMessageType(msgType);
        return { type: 'stock', track, start: 0, clipLength: null, duration: null, label: track };
    }
    return null;
}

function updateCurrentTrackLabel(label) {
    const trackLabel = document.getElementById('currentTrackLabel');
    if (trackLabel) {
        trackLabel.textContent = label || '';
        trackLabel.style.display = label ? 'block' : 'none';
    }
}

window.syncPreviewMusic = function() {
    const config = getPreviewMusicConfig();
    const audio = document.getElementById('bgMusic');
    const musicControlGroup = document.getElementById('musicControlGroup');
    const previewVideo = document.getElementById('previewBgVideo');
    const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab;

    if (!audio) return;

    if (!config) {
        window.isPreviewMode = false;
        window.previewVideoDuration = null;
        window.cardVideoDuration = undefined;
        audio.pause();
        audio.removeAttribute('src');
        if (musicControlGroup) musicControlGroup.style.display = 'none';
        updateCurrentTrackLabel('');
        return;
    }

    window.isPreviewMode = true;
    window.previewVideoDuration = null;
    window.cardVideoDuration = undefined;

    if (['5', '6'].includes(activeTab) && previewVideo && Number.isFinite(previewVideo.duration) && previewVideo.duration > 0) {
        window.previewVideoDuration = previewVideo.duration;
        window.cardVideoDuration = previewVideo.duration;
        if (previewVideo) previewVideo.muted = true;
    }

    const src = config.type === 'custom' ? config.url : musicTracks[config.track];
    if (!src) return;

    window.customMusicStartTime = config.start;
    window.customMusicClipLength = config.clipLength;
    window.customMusicDuration = window.previewVideoDuration || config.duration;

    if (musicControlGroup) musicControlGroup.style.display = 'flex';
    updateCurrentTrackLabel(config.label);

    const currentSrc = audio.getAttribute('src') || '';
    const needsReload = !currentSrc || !currentSrc.includes(src.split('/').pop() || src);

    const startPreviewPlayback = () => {
        applyMusicTiming(audio, null);
        const slider = document.getElementById('volumeSlider');
        const vol = slider ? parseInt(slider.value, 10) / 100 : 0.5;
        audio.volume = vol;
        if (vol > 0) {
            audio.play().catch(() => {});
        }
        syncMainSpeakerIcon();
    };

    if (needsReload) {
        audio.src = src;
        audio.load();
        audio.addEventListener('canplay', startPreviewPlayback, { once: true });
    } else {
        startPreviewPlayback();
    }
};

window.updateLivePreview = function() {
    // Sync text fields
    const nameVal = document.getElementById('nameInput')?.value || 'Recipient Name';
    const typeVal = document.getElementById('typeInput')?.value || 'Congratulations';
    const descVal = document.getElementById('descInput')?.value || 'Write a heartfelt message...';
    
    const pName = document.getElementById('previewUserName');
    const pHeading = document.getElementById('previewHeading');
    const pDesc = document.getElementById('previewDesc');
    
    if(pName) pName.textContent = nameVal;
    if(pHeading) pHeading.textContent = typeVal;
    if(pDesc) pDesc.textContent = descVal;

    // Handle Tab 6 (No text)
    const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab;
    if (activeTab === '6') {
        if(pName) pName.style.display = 'none';
        if(pHeading) pHeading.style.display = 'none';
        if(pDesc) pDesc.style.display = 'none';
    } else {
        if(pName) pName.style.display = '';
        if(pHeading) pHeading.style.display = '';
        if(pDesc) pDesc.style.display = '';
    }

    // Sync Images
    const imgInputVal = document.getElementById('imgInput')?.value;
    const pImgContainer = document.getElementById('previewImgContainer');
    const pImg = document.getElementById('previewImg');
    const fileInput = document.getElementById('fileInput');
    
    if (activeTab === '2' || activeTab === '3') {
        if (imgInputVal && !fileInput?.files?.[0]) {
             if(pImg) pImg.src = imgInputVal;
        }
        if(pImgContainer && pImg && pImg.src && pImg.src !== window.location.href) {
            pImgContainer.style.display = 'block';
        } else if (pImgContainer) {
            pImgContainer.style.display = 'none';
        }
    } else {
        if(pImgContainer) pImgContainer.style.display = 'none';
    }
    
    // Sync Videos
    const pVideo = document.getElementById('previewBgVideo');
    if (activeTab === '4' || activeTab === '5' || activeTab === '6') {
        if(pVideo && pVideo.src && pVideo.src !== window.location.href) {
            pVideo.style.display = 'block';
            
            // Handle Video Edit trim loop
            const startInput = document.getElementById('videoStartInput')?.value;
            const endInput = document.getElementById('videoEndInput')?.value;

            const start = startInput ? parseFloat(startInput) : 0;
            const end = endInput ? parseFloat(endInput) : (pVideo.duration || window.selectedVideoDuration);

            if (Number.isFinite(end) && end > 0) {
                pVideo.ontimeupdate = function() {
                    if (pVideo.currentTime >= end) {
                        pVideo.currentTime = start;
                    }
                };
            }
        } else if (pVideo) {
            pVideo.style.display = 'none';
        }
        
        // Add Video Story Mode class to container
        const pContainer = document.getElementById('livePreviewCard');
        if(pContainer) pContainer.classList.add('video-story-mode');
    } else {
        if(pVideo) pVideo.style.display = 'none';
        const pContainer = document.getElementById('livePreviewCard');
        if(pContainer) pContainer.classList.remove('video-story-mode');
    }

    applyPreviewCardTheme();
    window.syncPreviewMusic();
};

// Call selectCardType(1) on load to initialize form
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if(document.querySelector('.tab-btn')) {
            window.selectCardType(1);
        }
    }, 500);
});

// Tab scroll functionality
window.scrollTabs = function(direction) {
    const container = document.getElementById('cardTabsContainer');
    if (container) {
        const scrollAmount = 150; // pixels to scroll
        container.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
    }
};

// Mobile sidebar toggle
window.toggleMobileSidebar = function(forceState) {
    const sidebar = document.querySelector('.form-sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    if (!sidebar || !overlay) return;
    
    const isOpen = sidebar.classList.contains('open');
    const newState = typeof forceState === 'boolean' ? forceState : !isOpen;
    
    if (newState) {
        sidebar.classList.add('open');
        overlay.classList.add('active');
    } else {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    }
};
