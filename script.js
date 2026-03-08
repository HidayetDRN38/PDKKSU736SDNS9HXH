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
let kova = { x: 0, y: 0, w: 110, h: 90, disabled: false }; // Biraz daha geniş ve şık kova

// --- 1. GİRİŞ EKRANI BALONLARI (MODERN SVG) ---

// Kodun içine gömülmüş premium kalpli balon görseli (Base64)
const heartBalloonSVG = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cGF0aCBmaWxsPSIjRkYzMzg1IiBkPSJNNDcyLjggNDQuOGMtNjAuOC02MC44LTE1OS42LTYwLjgtMjIwLjQgMGwteDI4IDQwLjYtMjcuNi00MC42Yy02MC44LTYwLjgtMTU5LjYtNjAuOC0yMjAuNCAwcy02MC44IDE1OS42IDAgMjIwLjRsMTYwIDI0MC44Yy44LjggMS45IDEuNiAzIDEuNXM0LjguNiA4LjQgMGwxNjAtMjQwLjhjNjAuNy02MC44IDYwLjctMTU5LjcgMC0yMjAuNHoiLz48cGF0aCBmaWxsPSIjQ0MwMDY2IiBkPSJNNDI1LjIgNDQuOGMtNDguNS00OC41LTEyNy41LTQ4LjUtMTc2IDBsLTI1LjIgMjQuNC0yNS4yLTI0LjRjLTQ4LjUtNDguNS0xMjcuNS00OC41LTE3NiAwaC0uNEMtNC43IDkxLjQtNC43IDE5OC44IDQ0IDIzNy42bDE2MCAyNDAuOGM0IDYuNCA4IDEwLjggMTYgMTAuOHMxMi00LjQgMTYtMTAuOGwxNjAtMjQwLjhjNDguNy0zOC44IDQ4LjctMTQ2LjIuMy0xOTIuOHoiLz48L3N2Zz4=";

const balloonContainer = document.getElementById('balloon-container');
const startBtn = document.getElementById('start-btn');

// Balonları oluştur ve butonun üzerine yığ
for(let i=0; i<18; i++) {
    const b = document.createElement('img');
    b.src = heartBalloonSVG;
    b.className = 'balloon-image';
    
    // Butonun tam merkezine göre rastgele dağıt
    const randomX = (Math.random() - 0.5) * 250; // -125 ile +125 arası
    const randomY = (Math.random() - 0.5) * 100; // -50 ile +50 arası
    b.style.left = `calc(50% + ${randomX}px - 37px)`;
    b.style.top = `calc(50% + ${randomY}px - 40px)`;
    
    // Rastgele hafif dönüş açısı (vibe)
    b.style.transform = `rotate(${Math.random() * 30 - 15}deg)`;
    
    balloonContainer.appendChild(b);

    // GSAP Draggable ile sürükleme
    Draggable.create(b, {
        type: "x,y",
        onDragStart: function() { gsap.to(this.target, {scale: 1.15, filter: "drop-shadow(0 15px 25px rgba(0,0,0,0.3))"}); },
        onDragEnd: function() { gsap.to(this.target, {scale: 1}); }
    });
}

// Buton etkileşimi (Balonlar oradayken tıklanmaz)
startBtn.style.pointerEvents = 'none';
startBtn.style.opacity = '0.5';

// Tüm balonlar çekildi mi kontrolü
window.addEventListener('mouseup', checkBalloons);
window.addEventListener('touchend', checkBalloons);

function checkBalloons() {
    if(startBtn.style.pointerEvents === 'auto') return;
    const balloons = document.querySelectorAll('.balloon-image');
    let allCleared = true;
    
    const wrapperRect = document.getElementById('button-wrapper').getBoundingClientRect();

    balloons.forEach(b => {
        const bRect = b.getBoundingClientRect();
        // Eğer bir balon hala butonun wrapper alanı içindeyse allCleared false kalır
        if(bRect.right > wrapperRect.left && bRect.left < wrapperRect.right &&
           bRect.bottom > wrapperRect.top && bRect.top < wrapperRect.bottom) {
            allCleared = false;
        }
    });

    if(allCleared) {
        // Balonlar çekildiyse butonu aktif et
        startBtn.style.pointerEvents = 'auto';
        gsap.to(startBtn, {opacity: 1, scale: 1.05, duration: 0.5, ease: "back.out(1.7)"});
        startBtn.innerText = "HADİ BAŞLA! ✨";
    }
}

// --- 2. OYUN KURULUMU VE RESİMLER ---
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const itemImages = [];
for(let i=1; i<=8; i++) {
    const img = new Image();
    img.src = `item${i}.png`; // Senin attığın 8 komik resim
    itemImages.push(img);
}

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

// --- 3. PREMIUM ÇİZİM FONKSİYONLARI ---

// GÜZEL KOVA TASARIMI (Altın Detaylı)
function drawKova() {
    ctx.save();
    if(kova.disabled) {
        ctx.globalAlpha = 0.3; // Taş çarptığında soluklaşır
    }
    
    // Kova konumu
    const yPos = canvas.height - 110;

    // 1. Kova Gövdesi (Parlak Pembe)
    const gradient = ctx.createLinearGradient(kova.x, yPos, kova.x + kova.w, yPos);
    gradient.addColorStop(0, "#ff66b2");
    gradient.addColorStop(1, "#ff3385");
    ctx.fillStyle = gradient;
    
    ctx.beginPath();
    ctx.moveTo(kova.x, yPos);
    ctx.lineTo(kova.x + kova.w, yPos);
    ctx.lineTo(kova.x + kova.w - 18, yPos + kova.h);
    ctx.lineTo(kova.x + 18, yPos + kova.h);
    ctx.closePath();
    ctx.fill();

    // 2. Kova Kenarı (Altın Sarısı)
    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 4;
    ctx.stroke();

    // 3. Kova Üzerindeki Işıltı
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "bold 40px Arial";
    ctx.fillText("✨", kova.x + kova.w/2 - 20, yPos + 55);
    
    ctx.restore();
}

// GÜZEL NESNE ÇİZİMİ (Taş ve Alev Efekti)
function drawObject(obj) {
    ctx.save();
    if (obj.isRock) {
        // Taş Çizimi (Sert gri)
        ctx.fillStyle = "#555";
        ctx.beginPath();
        ctx.arc(obj.x + 30, obj.y + 30, 28, 0, Math.PI * 2);
        ctx.fill();
        // Taş dokusu
        ctx.fillStyle = "#333";
        ctx.beginPath(); ctx.arc(obj.x + 18, obj.y + 20, 6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(obj.x + 40, obj.y + 35, 4, 0, Math.PI * 2); ctx.fill();
    } else {
        // Alevli (Roket) Resim Efekti
        if(obj.isAflame) {
            ctx.shadowBlur = 40;
            ctx.shadowColor = "#ff4500"; // Turuncu/Kırmızı
            ctx.strokeStyle = "#ff4500";
            ctx.lineWidth = 4;
            // Alevli objenin etrafına roket efekti gibi parlayan bir çerçeve
            ctx.strokeRect(obj.x - 5, obj.y - 5, 75, 75);
        }
        ctx.drawImage(obj.img, obj.x, obj.y, 65, 65);
    }
    ctx.restore();
}

// --- 4. ANA OYUN DÖNGÜSÜ ---
function animate() {
    if(!gameActive) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawKova();

    objects.forEach((obj, index) => {
        obj.y += obj.speed;
        drawObject(obj);

        // Çarpışma Kontrolü (Kova yakaladı mı?)
        if(obj.y + 60 > canvas.height - 110 && obj.x + 60 > kova.x && obj.x < kova.x + kova.w) {
            if(obj.isRock) {
                stumbleKova(); // Taş dondurur
            } else {
                // Puanlandırma
                if(obj.isAflame) {
                    score += 5; // Alevli roket resimler +5 puan
                    gsap.to(scoreEl, {scale: 1.5, color: "#ff4500", duration: 0.15, yoyo: true, repeat: 1, onComplete: ()=> gsap.set(scoreEl, {color: "#cc0066"})});
                } else {
                    score += 2; // Normal resimler +2 puan
                }
                scoreEl.innerText = score;
                gameSpeed += 0.08; // Hızlanma
            }
            objects.splice(index, 1); // Objeyi sil
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

// Nesne Oluşturma (Rastgele Taş, Alev veya Normal)
function spawnObject() {
    if(!gameActive) return;

    let chance = Math.random();
    let obj = {
        x: Math.random() * (canvas.width - 70),
        y: -70,
        speed: gameSpeed,
        isRock: false,
        isAflame: false,
        img: itemImages[Math.floor(Math.random() * 8)] // Komik resimlerden rastgele seç
    };

    if(chance < 0.12) { // %12 Taş
        obj.isRock = true;
    } else if(chance > 0.88) { // %12 Alevli Hızlı Resim (+5 Puan)
        obj.isAflame = true;
        obj.speed *= 2.0; // Normalden 2 kat daha hızlı
    }

    objects.push(obj);
    
    // Oyun hızlandıkça daha sık obje oluştur
    let nextSpawn = Math.max(300, 1100 - (gameSpeed * 50));
    setTimeout(spawnObject, nextSpawn);
}

// --- 5. ÖZEL MEKANİKLER ---

// Taş Çarpma Mekaniği (2 SANİYE)
function stumbleKova() {
    kova.disabled = true;
    // Ekranı/Kovayı salla
    gsap.to(canvas, {x: 15, repeat: 8, yoyo: true, duration: 0.05, onComplete: () => gsap.set(canvas, {x: 0})});
    setTimeout(() => { kova.disabled = false; }, 2000); // 3 saniyeden 2 saniyeye düşürüldü
}

function gameOver() {
    gameActive = false;
    document.getElementById('game-over-overlay').style.display = 'flex';
    document.getElementById('final-score').innerText = score;
    
    const messages = [
        "Ouuu bişi olmaz, nazardır!",
        "Çok iyidin ama nazar değdi!",
        "Hadi pes etme!",
        "Kivi kedi seni geçti ama pes etmek yok!",
        "Bu seferlik böyle olsun, tekrar dene!",
        "Vay be, harika gidiyordun!",
        "Canın sağ olsun, tekrar dene!"
    ];
    document.getElementById('result-title').innerText = messages[Math.floor(Math.random() * messages.length)];

    if(score > highScore) {
        highScore = score;
        localStorage.setItem('rekor', highScore);
        document.getElementById('result-title').innerText = "VAAAAY! YENİ REKOR! 🎉";
        // Konfeti efekti
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

// --- KONTROLLER ---
// Mouse Kontrolü
window.addEventListener('mousemove', (e) => {
    if(!kova.disabled) kova.x = Math.min(Math.max(e.clientX - kova.w/2, 0), canvas.width - kova.w);
});

// Dokunmatik Kontrol
window.addEventListener('touchmove', (e) => {
    e.preventDefault(); // Sayfanın kaydırılmasını engelle
    if(!kova.disabled) kova.x = Math.min(Math.max(e.touches[0].clientX - kova.w/2, 0), canvas.width - kova.w);
}, {passive: false});

// Ekran Boyutu Değişirse
window.onresize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
};
