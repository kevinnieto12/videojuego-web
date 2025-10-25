const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Jugador (moto)
const player = { x: 375, y: 500, width: 50, height: 80, speed: 7, immune: false, immuneFrames:0 };

// Obstáculos
let obstacles = [];
let coins = [];
let chasingObstacles = [];
let shields = []; // Obstáculos escudo
let score = 0;
let frames = 0;
let record = localStorage.getItem('record') || 0;

let obstacleInterval = 90;
let coinInterval = 150;
let obstacleSpeed = 5;

// Teclas
const keys = {};
document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup', e => keys[e.key] = false);

// Generar objetos
function spawnObjects() {
    // Obstáculos normales
    if(frames % Math.floor(obstacleInterval) === 0) {
        obstacles.push({ x: Math.random()*750, y: -50, width: 50, height: 50, speed: obstacleSpeed });
    }
    // Obstáculo que persigue
    if(frames % 600 === 0) {
        chasingObstacles.push({ x: Math.random()*750, y: -50, width: 50, height: 50, speed: 2 });
    }
    // Monedas
    if(frames % Math.floor(coinInterval) === 0) {
        coins.push({ x: Math.random()*760, y: -30, radius: 15, blink: 0 });
    }
    // Escudos
    if(frames % 1200 === 0) { // cada 20s aprox
        shields.push({ x: Math.random()*760, y: -30, radius: 20 });
    }
}

// Reiniciar juego
function resetGame() {
    if(score > record) {
        record = score;
        localStorage.setItem('record', record);
    }
    alert('¡Perdiste! Puntos: ' + score + '\nRecord: ' + record);
    score = 0;
    frames = 0;
    obstacles = [];
    coins = [];
    chasingObstacles = [];
    shields = [];
    obstacleInterval = 90;
    obstacleSpeed = 5;
    player.x = 375;
    player.immune = false;
    player.immuneFrames = 0;
    document.getElementById('score').innerText = score;
}

// Actualizar posiciones y dificultad
function update() {
    // Mover jugador
    if(keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
    if(keys['ArrowRight'] && player.x + player.width < canvas.width) player.x += player.speed;

    spawnObjects();

    // Obstáculos normales
    obstacles.forEach((ob, i) => {
        ob.y += ob.speed;
        if(!player.immune && player.x < ob.x + ob.width &&
           player.x + player.width > ob.x &&
           player.y < ob.y + ob.height &&
           player.y + player.height > ob.y) {
            resetGame();
        }
        if(ob.y > canvas.height) obstacles.splice(i,1);
    });

    // Obstáculos que persiguen
    chasingObstacles.forEach((ob, i) => {
        if(player.x + player.width/2 < ob.x + ob.width/2) ob.x -= ob.speed;
        else if(player.x + player.width/2 > ob.x + ob.width/2) ob.x += ob.speed;
        ob.y += ob.speed;

        if(!player.immune && player.x < ob.x + ob.width &&
           player.x + player.width > ob.x &&
           player.y < ob.y + ob.height &&
           player.y + player.height > ob.y) {
            resetGame();
        }

        if(ob.y > canvas.height) chasingObstacles.splice(i,1);
    });

    // Monedas
    coins.forEach((coin, i) => {
        coin.y += 5;
        coin.blink += 0.1;
        const dx = player.x + player.width/2 - coin.x;
        const dy = player.y + player.height/2 - coin.y;
        const distance = Math.sqrt(dx*dx + dy*dy);
        if(distance < coin.radius + player.width/2) {
            score++;
            document.getElementById('score').innerText = score;
            coins.splice(i,1);
        }
        if(coin.y > canvas.height) coins.splice(i,1);
    });

    // Escudos
    shields.forEach((shield, i) => {
        shield.y += 5;
        const dx = player.x + player.width/2 - shield.x;
        const dy = player.y + player.height/2 - shield.y;
        const distance = Math.sqrt(dx*dx + dy*dy);
        if(distance < shield.radius + player.width/2) {
            player.immune = true;
            player.immuneFrames = 180; // 3 segundos a 60fps
            shields.splice(i,1);
        }
        if(shield.y > canvas.height) shields.splice(i,1);
    });

    // Manejar inmunidad
    if(player.immune) {
        player.immuneFrames--;
        if(player.immuneFrames <= 0) player.immune = false;
    }

    frames++;

    // Aumentar dificultad
    if(frames % 600 === 0) {
        obstacleSpeed += 1;
        obstacleInterval *= 0.9;
        if(obstacleInterval < 20) obstacleInterval = 20;
    }
}

// Dibujar todo
function draw() {
    // Fondo carretera
    ctx.fillStyle = '#222';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    for(let i=0;i<canvas.height;i+=40){
        ctx.fillStyle = i%80===0?'#555':'#333';
        ctx.fillRect(canvas.width/2-5,i,10,20);
    }

    // Jugador (moto)
    ctx.fillStyle = player.immune ? 'lime' : 'cyan'; // cambia de color si es inmune
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Obstáculos normales
    obstacles.forEach(ob => {
        ctx.fillStyle = 'red';
        ctx.fillRect(ob.x, ob.y, ob.width, ob.height);
    });

    // Obstáculos que persiguen
    chasingObstacles.forEach(ob => {
        ctx.fillStyle = 'magenta';
        ctx.fillRect(ob.x, ob.y, ob.width, ob.height);
    });

    // Monedas
    coins.forEach(coin => {
        ctx.beginPath();
        ctx.arc(coin.x, coin.y, coin.radius, 0, Math.PI*2);
        ctx.fillStyle = `rgb(${200+55*Math.sin(coin.blink)}, ${200+55*Math.sin(coin.blink)}, 0)`;
        ctx.fill();
        ctx.closePath();
    });

    // Escudos
    shields.forEach(shield => {
        ctx.beginPath();
        ctx.arc(shield.x, shield.y, shield.radius, 0, Math.PI*2);
        ctx.fillStyle = 'cyan';
        ctx.fill();
        ctx.closePath();
    });
}

// Loop principal
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
