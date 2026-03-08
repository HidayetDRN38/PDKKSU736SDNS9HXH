gsap.registerPlugin(Draggable);

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const gameContainer = document.getElementById('game-container');
const scoreEl = document.getElementById('current-score');
const highscoreEl = document.getElementById('high-score');
const trashCan = document.getElementById('trash-can');
const startBtn = document.getElementById('start-btn');
const balloonContainer = document.getElementById('balloon-container');

let score = 0;
let highScore = localStorage.getItem('rekor') || 0;
let gameActive = false;
let objects = [];
let gameSpeed = 3;
let kova = { x: 0, y: 0, w: 100, h: 80, disabled: false };
let poppedCount = 0;
const totalBalloons = 12;

const heartBalloonSVG = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cGF0aCBmaWxsPSIjRkYzMzg1IiBkPSJNNDcyLjggNDQuOGMtNjAuOC02MC44LTE1OS42LTYwLjgtMjIwLjQgMGwteDI4IDQwLjYtMjcuNi00MC42Yy02MC44LTYwLjgtMTU5LjYtNjAuOC0yMjAuNCAwcy02MC44IDE1OS42IDAgMjIwLjRsMTYwIDI0MC44Yy44LjggMS45IDEuNiAzIDEuNXM0LjguNiA4LjQgMGwxNjAtMjQwLjhjNjAuNy02MC44IDYwLjctMTU5LjcgMC0yMjAuNHoiLz48cGF0aCBmaWxsPSIjQ0MwMDY2IiBkPSJNNDI1LjIgNDQuOGMtNDguNS00OC41LTEyNy41LTQ4LjUtMTc2IDBsLTI1LjIgMjQuNC0yNS4yLTI0LjRjLTQ4LjUtNDguNS0xMjcuNS00OC41LTE3NiAwaC0uNEMtNC43IDkxLjQtNC43IDE5OC44IDQ0IDIzNy42bDE2MCAyNDAuOGM0IDYuNCA4IDEwLjggMTYgMTAuOHMxMi00LjQgMTYtMTAuOGwxNjAtMjQwLjhjNDguNy0zOC44IDQ4LjctMTQ2LjIuMy0xOTIuOHoiLz48L3N2Zz4=";

// BALONLARI OLUŞTUR
for(let i=0; i<totalBalloons; i++) {
    const b = document.createElement('img');
    b.src = heartBalloonSVG;
    b.className = 'balloon-image';
    const randomX = (Math.random() - 0.5) * 200;
    const randomY = (Math.random() - 0.5) * 60;
    b.style.left = `calc(50% + ${randomX}px - 35px)`;
    b.style.top = `calc(50% + ${randomY}px - 35px)`;
    balloonContainer.appendChild(b);

    Draggable.create(b, {
        type: "x,y",
        edgeResistance: 0.5,
        onDrag: function() {
            // Telefon uyumlu çakışma kontrolü
            if (this.hitTest(trashCan, "30%")) {
                trashCan.classList.add('active');
            } else {
                trashCan.classList.remove('active');
            }
        },
        onDragEnd: function() {
            trashCan.classList.remove('active');
            if (this.hitTest(trashCan, "30%")) {
                gsap.to(this.target, {scale: 0, opacity: 0, duration: 0.3, onComplete: () => {
                    this.target.style.display = 'none';
                    poppedCount++;
                    checkBalloons();
                }});
            } else {
                gsap.to(this.target, {x: 0, y: 0, duration: 0.4, ease: "power2.out"});
            }
        }
    });
}

function checkBalloons() {
    if(poppedCount >= totalBalloons) {
        gsap.to(trashCan, {y: 100, opacity: 0, duration: 0.5});
        startBtn.style.pointerEvents = 'auto';
        gsap.to(startBtn, {opacity: 1, scale: 1.1, duration: 0.5});
    }
}

// OYUN MOTORU
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const itemImages = [];
for(let i=1; i<=8; i++) {
    const img = new Image();
    img.src = `item${i}.png`;
    itemImages.push(img);
}

startBtn.onclick = () => {
    startScreen.style.display = 'none';
    gameContainer.style.display = 'block';
    gameActive = true;
    spawnObject();
    animate();
};

function drawKova() {
    ctx.save();
    if(kova.disabled) ctx.globalAlpha = 0.3;
    ctx.fillStyle = "#ff3385";
    ctx.beginPath();
    ctx.moveTo(kova.x, canvas.height-100); ctx.lineTo(kova.x+kova.w, canvas.height-100);
    ctx.lineTo(kova.x+kova.w-15, canvas.height-20); ctx.lineTo(kova.x+15, canvas.height-20);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#ffd700"; ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
}

function drawObject(obj) {
    ctx.save();
    if (obj.isRock) {
        ctx.fillStyle = "#555"; ctx.beginPath();
        ctx.arc(obj.x+30, obj.y+30, 25, 0, Math.PI*2); ctx.fill();
    } else {
        if(obj.isAflame) {
            ctx.shadowBlur = 30; ctx.shadowColor = "red";
            ctx.strokeStyle = "orange"; ctx.lineWidth = 4;
            ctx.strokeRect(obj.x, obj.y, 65, 65);
        }
        ctx.drawImage(obj.img, obj.x, obj.y, 65, 65);
    }
    ctx.restore();
}

function animate() {
    if(!gameActive) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawKova();
    objects.forEach((obj, index) => {
        obj.y += obj.speed;
        drawObject(obj);
        // Çarpışma
        if(obj.y + 50 > canvas.height - 100 && obj.x + 50 > kova.x && obj.x < kova.x + kova.w) {
            if(obj.isRock) {
                kova.disabled = true;
                gsap.to(canvas, {x: 10, repeat: 5, yoyo: true, duration: 0.05, onComplete:()=>gsap.set(canvas,{x:0})});
                setTimeout(() => { kova.disabled = false; }, 2000);
            } else {
                score += obj.isAflame ? 5 : 2;
                scoreEl.innerText = score;
                gameSpeed += 0.07;
            }
            objects.splice(index, 1);
        }
        if(obj.y > canvas.height) {
            if(!obj.isRock) gameOver();
            else objects.splice(index, 1);
        }
    });
    requestAnimationFrame(animate);
}

function spawnObject() {
    if(!gameActive) return;
    let chance = Math.random();
    let obj = { x: Math.random()*(canvas.width-70), y: -70, speed: gameSpeed, isRock: false, isAflame: false, img: itemImages[Math.floor(Math.random()*8)] };
    if(chance < 0.15) obj.isRock = true;
    else if(chance > 0.85) { obj.isAflame = true; obj.speed *= 1.8; }
    objects.push(obj);
    setTimeout(spawnObject, Math.max(400, 1200 - (gameSpeed * 50)));
}

function gameOver() {
    gameActive = false;
    document.getElementById('game-over-overlay').style.display = 'flex';
    document.getElementById('final-score').innerText = score;
    if(score > highScore) {
        highScore = score; localStorage.setItem('rekor', highScore);
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
}

function restartGame() { location.reload(); }

// KONTROLLER (Telefon ve PC Uyumlu)
const moveKova = (clientX) => {
    if(!kova.disabled) {
        let targetX = clientX - kova.w/2;
        kova.x = Math.min(Math.max(targetX, 0), canvas.width - kova.w);
    }
};

window.addEventListener('mousemove', (e) => moveKova(e.clientX));
window.addEventListener('touchmove', (e) => {
    moveKova(e.touches[0].clientX);
}, {passive: false});
