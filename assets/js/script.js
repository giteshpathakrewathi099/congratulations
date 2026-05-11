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

// Common Utility: Theme Management
function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('card-theme', t);
    const sun = document.getElementById('sunIcon');
    const moon = document.getElementById('moonIcon');
    if (sun && moon) {
        if (t === 'light') {
            sun.style.display = 'block';
            moon.style.display = 'none';
        } else {
            sun.style.display = 'none';
            moon.style.display = 'block';
        }
    }
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || localStorage.getItem('card-theme') || 'dark';
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
    const savedTheme = localStorage.getItem('card-theme') || 'dark';
    applyTheme(savedTheme);

    const urlParams = new URLSearchParams(window.location.search);
    const cardId = urlParams.get('id');

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
        'Happy Wedding Anniversary': { desc: 'Wishing you both a lifetime of love...', img: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=400' }
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
        const { n: name, m: type, i: img, d: desc, y: design, s: music } = data;
        applyDesign(design || 'sparkle');
        if (document.getElementById('userName')) document.getElementById('userName').textContent = name;
        if (document.getElementById('cardHeading')) document.getElementById('cardHeading').textContent = type || 'Congratulations';
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
        const iTheme = document.getElementById('themeInput')?.value;
        const iMusic = document.getElementById('musicInput')?.value;
        if (!iName) { alert("Please enter a name"); return; }
        let finalImg = iImg || "";
        if (iFile) { try { finalImg = await fileToBase64(iFile); } catch (err) { return; } }
        const cardData = { n: iName, m: iType, i: finalImg, d: iDesc || "", h: iTheme || "dark", y: 'sparkle', s: iMusic || 'none' };
        if (database) {
            const newCardRef = database.ref('cards').push();
            newCardRef.set(cardData).then(() => { window.location.href = `card.html?id=${newCardRef.key}`; });
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
        const flyout = document.getElementById('volumeFlyout');
        const mainBtn = document.getElementById('mainMusicBtn');
        if (flyout && flyout.classList.contains('visible') && !flyout.contains(e.target) && !mainBtn.contains(e.target)) {
            flyout.classList.remove('visible');
        }
    });
});
