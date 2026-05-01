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
    const colors = ['#d4af37', '#ffffff', '#996515'];

    (function frame() {
        confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: colors });
        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: colors });
        if (Date.now() < end) requestAnimationFrame(frame);
    }());
}

// Initialization Logic
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Short Keys: n=name, m=message(type), i=img, d=desc, h=theme
    const data = {
        name: urlParams.get('n') || urlParams.get('name'),
        type: urlParams.get('m') || urlParams.get('type') || 'Congratulations',
        img: urlParams.get('i') || urlParams.get('img'),
        desc: urlParams.get('d') || urlParams.get('desc'),
        theme: urlParams.get('h') || urlParams.get('theme') || 'dark'
    };

    const { name, type, desc, img, theme } = data;

    // Apply Theme
    applyTheme(theme);

    // Display Content
    const userNameEl = document.getElementById('userName');
    if (userNameEl) {
        if (!name) {
            if (window.location.pathname.includes('card.html')) {
                window.location.href = 'index.html';
            }
            return;
        }
        userNameEl.textContent = name;
        if (document.getElementById('cardHeading')) document.getElementById('cardHeading').textContent = type;
        
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

        const config = defaults[type] || defaults['Congratulations'];

        if (document.getElementById('cardDesc')) {
            document.getElementById('cardDesc').textContent = desc || config.desc;
        }

        if (document.getElementById('userImg')) {
            document.getElementById('userImg').src = img || config.img;
            if (document.getElementById('userImgContainer')) document.getElementById('userImgContainer').style.display = 'block';
        }

        // Auto Celebrate
        setTimeout(() => {
            if (typeof confetti !== 'undefined') {
                confetti({
                    particleCount: 150,
                    spread: 100,
                    origin: { y: 0.6 },
                    colors: ['#d4af37', '#ffffff', '#996515']
                });
            }
        }, 500);

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
    window.generateLink = function() {
        const iName = document.getElementById('nameInput')?.value;
        const iType = document.getElementById('typeInput')?.value;
        const iImg = document.getElementById('imgInput')?.value;
        const iDesc = document.getElementById('descInput')?.value;
        const iTheme = document.getElementById('themeInput')?.value;

        if (!iName) {
            alert("Please enter a name");
            return;
        }
        
        const params = new URLSearchParams();
        params.set('n', iName);
        params.set('m', iType);
        if (iImg) params.set('i', iImg);
        if (iDesc) params.set('d', iDesc);
        if (iTheme && iTheme !== 'dark') params.set('h', iTheme);

        window.location.href = `card.html?${params.toString()}`;
    };
});
