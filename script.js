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
let kova = { x: 0, y: 0, w: 100, h: 80, disabled: false };

// 1. GİRİŞ EKRANI BALONLARI (Fiziksel Engel)
const container = document.getElementById('balloon-container');
for(let i=0; i<15; i++) {
    const b = document.createElement('div');
    b.className = 'balloon';
    // Butonun etrafına rastgele dağıt
    b.style.left = (Math.random() * 200 - 50) + 'px';
    b.style.top = (Math.random() * 100 - 50) + 'px';
    container.appendChild(b);

    Draggable.create(b, {
        type: "x,y",
        onDragStart: function() { gsap.to(this.target, {scale: 1.2, opacity: 0.8}); },
        onDragEnd: function() { gsap.to(this.target, {scale: 1}); }
    });
}

// 2. RESİMLERİ YÜKLE
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const itemImages = [];
for(let i=1; i<=8; i++) {
    const img = new Image();
    img.src = `item${i}.png`;
    itemImages.push(img);
}

// 3. OYUNU BAŞLAT
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

// 4. ÇİZİM FONKSİYONLARI (Kodla Tasarım)
function drawKova() {
    ctx.save();
    if(kova.disabled) {
        ctx.globalAlpha = 0.3; // Taş çarptığında şeffaflaşır
    }
    
    // Pembe Kova Gövdesi
    ctx.fillStyle = "#ff3385";
    ctx.beginPath();
    ctx.moveTo(kova.x, canvas.height - 100);
    ctx.lineTo(kova.x + kova.w, canvas.height - 100);
    ctx.lineTo(kova.x + kova.w - 15, canvas.height - 20);
    ctx.lineTo(kova.x + 15, canvas.height - 20);
    ctx.closePath();
    ctx.fill();

    // Kova Üzerindeki Kalp
    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    ctx.fillText("❤️", kova.x + kova.w/2 - 15, canvas.height - 50);
    
    ctx.restore();
}

function drawObject(obj) {
    ctx.save();
    if (obj.isRock) {
        // Taş Çizimi
        ctx.fillStyle = "#555";
        ctx.beginPath();
        ctx.arc(obj.x + 30, obj.y + 30, 25, 0, Math.PI * 2);
        ctx.fill();
        // Taş detayı
        ctx.fillStyle = "#333";
        ctx.beginPath();
        ctx.arc(obj.x + 20, obj.y + 20, 5, 0, Math.PI * 2);
        ctx.fill();
    } else {
        // Alevli Resim Efekti
        if(obj.isAflame) {
            ctx.shadowBlur = 30;
            ctx.shadowColor = "#ff4500";
            ctx.strokeStyle = "#ff4500";
            ctx.lineWidth = 3;
            ctx.strokeRect(obj.x, obj.y, 65, 65);
        }
        ctx.drawImage(obj.img, obj.x, obj.y, 65, 65);
    }
    ctx.restore();
}

// 5. ANA OYUN DÖNGÜSÜ
function animate() {
    if(!gameActive) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawKova();

    objects.forEach((obj, index) => {
        obj.y += obj.speed;
        drawObject(obj);

        // Çarpışma Kontrolü
        if(obj.y + 60 > canvas.height - 100 && obj.x + 60 > kova.x && obj.x < kova.x + kova.w) {
            if(obj.isRock) {
                stumbleKova();
            } else {
                score += 2;
                scoreEl.innerText = score;
                gameSpeed += 0.08; // Her yakalamada hızlanır
            }
            objects.splice(index, 1);
        }

        // Kaçırma Kontrolü (Taş hariç biri düşerse yanar)
        if(obj.y > canvas.height) {
            if(!obj.isRock) {
                gameOver();
            } else {
                objects.splice(index, 1);
            }
        }
    });

    requestAnimationFrame(animate);
}

function spawnObject() {
    if(!gameActive) return;

    let chance = Math.random();
    let obj = {
        x: Math.random() * (canvas.width - 70),
        y: -70,
        speed: gameSpeed,
        isRock: false,
        isAflame: false,
        img: itemImages[Math.floor(Math.random() * 8)]
    };

    if(chance < 0.12) { // %12 Taş
        obj.isRock = true;
    } else if(chance > 0.88) { // %12 Alevli Hızlı Resim
        obj.isAflame = true;
        obj.speed *= 1.8;
    }

    objects.push(obj);
    
    // Hızlandıkça daha sık obje gönder
    let nextSpawn = Math.max(400, 1200 - (gameSpeed * 50));
    setTimeout(spawnObject, nextSpawn);
}

// 6. ÖZEL EFEKTLER
function stumbleKova() {
    kova.disabled = true;
    // Ekranı salla
    gsap.to(canvas, {x: 10, repeat: 10, yoyo: true, duration: 0.05, onComplete: () => gsap.set(canvas, {x: 0})});
    setTimeout(() => { kova.disabled = false; }, 3000);
}

function gameOver() {
    gameActive = false;
    document.getElementById('game-over-overlay').style.display = 'flex';
    document.getElementById('final-score').innerText = score;
    
    const messages = [
        "Ouuuyyy bişi olmazz",
        "Çok iyidin ama o sonuncusu çok hızlıydı!",
        "Hadi bir daha! Pes etmek yok.",
        "Rekor çok yakındı.",
        "Bu seferlik böyle olsun, tekrar dene!",
        "Vay be, harika gidiyordun!"
    ];
    document.getElementById('result-title').innerText = messages[Math.floor(Math.random() * messages.length)];

    if(score > highScore) {
        highScore = score;
        localStorage.setItem('rekor', highScore);
        document.getElementById('result-title').innerText = "TEBRİKLER! YENİ REKOR! 🎉";
        confetti({ particleCount: 250, spread: 100, origin: { y: 0.6 } });
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

// Kontroller
window.addEventListener('mousemove', (e) => {
    if(!kova.disabled) kova.x = Math.min(Math.max(e.clientX - kova.w/2, 0), canvas.width - kova.w);
});

window.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if(!kova.disabled) kova.x = Math.min(Math.max(e.touches[0].clientX - kova.w/2, 0), canvas.width - kova.w);
}, {passive: false});

window.onresize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
};
