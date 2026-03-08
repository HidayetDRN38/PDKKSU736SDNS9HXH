gsap.registerPlugin(Draggable);

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const gameContainer = document.getElementById('game-container');
const scoreEl = document.getElementById('current-score');
const highscoreEl = document.getElementById('high-score');

let score = 0;
let highScore = localStorage.getItem('rekor') || 0;
let gameActive = false;
let objects = [];
let gameSpeed = 3;
let kova = { x: 0, y: 0, w: 100, h: 100, disabled: false };

// 1. GİRİŞ EKRANI BALONLARI
const container = document.getElementById('balloon-container');
for(let i=0; i<15; i++) {
    const b = document.createElement('img');
    b.src = 'balon.png'; // Senin balon görselin
    b.className = 'balloon';
    b.style.left = (Math.random() * 100 + 50) + 'px';
    b.style.top = (Math.random() * 50 + 20) + 'px';
    container.appendChild(b);

    Draggable.create(b, {
        type: "x,y",
        edgeResistance: 0.65,
        onDragStart: function() { gsap.to(this.target, {scale: 1.2}); },
        onDragEnd: function() { gsap.to(this.target, {scale: 1}); }
    });
}

// 2. OYUN KURULUMU
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const images = {};
const itemNames = ['item1', 'item2', 'item3', 'item4', 'item5', 'item6', 'item7', 'item8', 'kova', 'tas'];

function loadImages() {
    itemNames.forEach(name => {
        const img = new Image();
        img.src = `${name}.png`;
        images[name] = img;
    });
}
loadImages();

document.getElementById('start-btn').onclick = () => {
    startScreen.style.display = 'none';
    gameContainer.style.display = 'block';
    gameActive = true;
    score = 0;
    gameSpeed = 3;
    highscoreEl.innerText = highScore;
    spawnObject();
    animate();
};

// 3. OYUN DÖNGÜSÜ
function animate() {
    if(!gameActive) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Kova Çizimi
    if(kova.disabled) ctx.globalAlpha = 0.5;
    ctx.drawImage(images['kova'], kova.x, canvas.height - 120, kova.w, kova.h);
    ctx.globalAlpha = 1.0;

    objects.forEach((obj, index) => {
        obj.y += obj.speed;
        
        // Alevli efekt (glow)
        if(obj.isAflame) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = "red";
        }

        ctx.drawImage(obj.img, obj.x, obj.y, 60, 60);
        ctx.shadowBlur = 0; // Reset

        // Çarpışma Testi
        if(obj.y + 60 > canvas.height - 120 && obj.x + 60 > kova.x && obj.x < kova.x + kova.w) {
            if(obj.isRock) {
                stumbleKova();
            } else {
                score += 2;
                scoreEl.innerText = score;
                gameSpeed += 0.05;
            }
            objects.splice(index, 1);
        }

        // Kaçırma Kontrolü
        if(obj.y > canvas.height) {
            if(!obj.isRock) gameOver();
            else objects.splice(index, 1);
        }
    });

    requestAnimationFrame(animate);
}

function spawnObject() {
    if(!gameActive) return;

    let type = Math.random();
    let obj = {
        x: Math.random() * (canvas.width - 60),
        y: -60,
        speed: gameSpeed,
        isRock: false,
        isAflame: false
    };

    if(type < 0.1) { // %10 Taş gelme ihtimali
        obj.img = images['tas'];
        obj.isRock = true;
    } else if(type > 0.85) { // %15 Alevli hızlı resim
        obj.img = images[`item${Math.floor(Math.random() * 8) + 1}`];
        obj.isAflame = true;
        obj.speed *= 1.8;
    } else {
        obj.img = images[`item${Math.floor(Math.random() * 8) + 1}`];
    }

    objects.push(obj);
    setTimeout(spawnObject, 1000 / (gameSpeed / 2.5));
}

function stumbleKova() {
    kova.disabled = true;
    gsap.to("#gameCanvas", {x: 10, repeat: 5, yoyo: true, duration: 0.05});
    setTimeout(() => { kova.disabled = false; }, 3000);
}

function gameOver() {
    gameActive = false;
    document.getElementById('game-over-overlay').style.display = 'flex';
    document.getElementById('final-score').innerText = score;
    
    const fails = ["Ouuu bişi olmaz!", "Çok iyidin ama nazar değdi!", "Bir sonrakine kesin rekor!", "Hadi pes etme!", "Kivi kedi seni geçti!"];
    document.getElementById('result-title').innerText = fails[Math.floor(Math.random()*fails.length)];

    if(score > highScore) {
        highScore = score;
        localStorage.setItem('rekor', highScore);
        document.getElementById('result-title').innerText = "VAAAAY! YENİ REKOR! 🎉";
        confetti({ particleCount: 200, spread: 90 });
    }
}

function restartGame() {
    objects = [];
    document.getElementById('game-over-overlay').style.display = 'none';
    gameActive = true;
    score = 0;
    gameSpeed = 3;
    scoreEl.innerText = 0;
    spawnObject();
    animate();
}

// Mouse Hareketi
window.addEventListener('mousemove', (e) => {
    if(!kova.disabled) kova.x = Math.min(Math.max(e.clientX - kova.w/2, 0), canvas.width - kova.w);
});
// Dokunmatik Hareketi
window.addEventListener('touchmove', (e) => {
    if(!kova.disabled) kova.x = Math.min(Math.max(e.touches[0].clientX - kova.w/2, 0), canvas.width - kova.w);
});
