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

// Common Utility: Theme Management
function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
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
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'light' ? 'dark' : 'light';
    applyTheme(next);
}

// Celebration (Confetti)
function celebrateAgain() {
    if (typeof confetti === 'undefined') return;
    const end = Date.now() + (2 * 1000);
    const colors = ['#d4af37', '#ffffff', '#996515', '#f4d03f', '#ffffff'];

    (function frame() {
        // Left side explosion
        confetti({
            particleCount: 4,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: colors,
            scalar: 1.2,
            drift: 0.5
        });
        
        // Right side explosion
        confetti({
            particleCount: 4,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: colors,
            scalar: 1.2,
            drift: -0.5
        });

        // Center burst occasionally
        if (Math.random() > 0.8) {
            confetti({
                particleCount: 15,
                spread: 100,
                origin: { y: 0.7 },
                colors: colors,
                shapes: ['circle', 'square'],
                gravity: 1.2
            });
        }

        if (Date.now() < end) requestAnimationFrame(frame);
    }());
}

// Download Card as PNG
function downloadCard() {
    const card = document.getElementById('cardToDownload');
    const btn = document.querySelector('.download-btn');
    
    // Temporarily hide the download button so it's not in the image
    if (btn) btn.style.visibility = 'hidden';

    html2canvas(card, {
        useCORS: true,
        backgroundColor: null,
        scale: 2, // Higher quality
        logging: false
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = `celebration-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        // Show the button back
        if (btn) btn.style.visibility = 'visible';
    }).catch(err => {
        console.error('Download failed:', err);
        if (btn) btn.style.visibility = 'visible';
        alert('Could not download image. Please try again.');
    });
}

// Initialization Logic
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const cardId = urlParams.get('id');

    // Default messages and images
    const defaults = {
        'Happy Birthday': {
            desc: 'Wishing you a day filled with happiness and a year filled with joy. Happy Birthday!',
            img: 'https://images.unsplash.com/photo-1464349153735-7db50ed83c84?w=400'
        },
        'Congratulations': {
            desc: 'A remarkable achievement. Your journey has been nothing short of inspiring. Well done!',
            img: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400'
        },
        'Best Wishes': {
            desc: 'Sending you our best wishes for your new chapter. May success follow you always.',
            img: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400'
        },
        'Thank You': {
            desc: 'Your contribution has been invaluable. We truly appreciate everything you do.',
            img: 'https://images.unsplash.com/photo-1516733968668-dbdce39c46ef?w=400'
        }
    };

    // If we have an ID, fetch from Firebase
    if (cardId && database) {
        database.ref('cards/' + cardId).once('value').then((snapshot) => {
            const data = snapshot.val();
            if (data) {
                renderCard(data);
            } else {
                window.location.href = 'index.html';
            }
        }).catch((error) => {
            console.error("Error fetching card:", error);
            window.location.href = 'index.html';
        });
    } else if (window.location.pathname.includes('card.html')) {
        // Only redirect if we are on card.html and no ID
        window.location.href = 'index.html';
    }

    function renderCard(data) {
        const { n: name, m: type, i: img, d: desc, h: theme } = data;
        applyTheme(theme || 'dark');
        
        if (document.getElementById('userName')) document.getElementById('userName').textContent = name;
        if (document.getElementById('cardHeading')) document.getElementById('cardHeading').textContent = type || 'Congratulations';
        
        const config = defaults[type] || defaults['Congratulations'];

        if (document.getElementById('cardDesc')) {
            document.getElementById('cardDesc').textContent = desc || config.desc;
        }

        if (document.getElementById('userImg')) {
            document.getElementById('userImg').src = img || config.img;
            if (document.getElementById('userImgContainer')) document.getElementById('userImgContainer').style.display = 'block';
        }

        // Big Initial Celebration
        setTimeout(() => {
            celebrateAgain();
            // Extra big burst for the start
            confetti({
                particleCount: 150,
                spread: 100,
                origin: { y: 0.6 },
                colors: ['#d4af37', '#ffffff', '#996515']
            });
        }, 500);

        // Auto Celebrate Loop
        setInterval(() => {
            celebrateAgain();
        }, 4000); // Trigger every 4 seconds

        // Mouse Parallax
        document.addEventListener('mousemove', (e) => {
            const container = document.querySelector('.celebration-container');
            const x = (window.innerWidth / 2 - e.pageX) / 50;
            const y = (window.innerHeight / 2 - e.pageY) / 50;
            if (container) {
                container.style.transform = `rotateY(${x}deg) rotateX(${-y}deg)`;
            }
        });
    }

    // Generator Logic
    window.generateLink = async function() {
        const iName = document.getElementById('nameInput')?.value;
        const iType = document.getElementById('typeInput')?.value;
        const iImg = document.getElementById('imgInput')?.value;
        const iFile = document.getElementById('fileInput')?.files[0];
        const iDesc = document.getElementById('descInput')?.value;
        const iTheme = document.getElementById('themeInput')?.value;

        if (!iName) {
            alert("Please enter a name");
            return;
        }

        let finalImg = iImg || "";

        // Handle File Upload (Base64)
        if (iFile) {
            try {
                finalImg = await fileToBase64(iFile);
            } catch (err) {
                console.error("Image processing error:", err);
                alert("Error processing image file.");
                return;
            }
        }

        const cardData = {
            n: iName,
            m: iType,
            i: finalImg,
            d: iDesc || "",
            h: iTheme || "dark"
        };

        if (database) {
            const btn = document.querySelector('.action-btn');
            if (btn) {
                btn.textContent = "Generating...";
                btn.disabled = true;
            }

            const newCardRef = database.ref('cards').push();
            newCardRef.set(cardData).then(() => {
                const cardId = newCardRef.key;
                window.location.href = `card.html?id=${cardId}`;
            }).catch((error) => {
                alert("Error saving card: " + error.message);
                if (btn) {
                    btn.textContent = "Generate Card";
                    btn.disabled = false;
                }
            });
        } else {
            alert("Database not connected!");
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
});
