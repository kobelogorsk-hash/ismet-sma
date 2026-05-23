// Игровые константы
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const GROUND_HEIGHT = 50;
const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const GAME_SPEED = 6;

// Получаем элементы
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('scoreValue');
const startScreen = document.getElementById('startScreen');
const startBtn = document.getElementById('startBtn');

// Состояние игры
let gameState = {
    isRunning: false,
    score: 0,
    frameCount: 0
};

// Игрок (куб)
let player = {
    x: 100,
    y: CANVAS_HEIGHT - GROUND_HEIGHT - 30,
    width: 30,
    height: 30,
    velocityY: 0,
    isJumping: false,
    rotation: 0,
    color: '#ffd700'
};

// Препятствия
let obstacles = [];

// Частицы для эффектов
let particles = [];

// Инициализация игры
function initGame() {
    player.y = CANVAS_HEIGHT - GROUND_HEIGHT - player.height;
    player.velocityY = 0;
    player.isJumping = false;
    player.rotation = 0;
    obstacles = [];
    particles = [];
    gameState.score = 0;
    gameState.frameCount = 0;
    scoreElement.textContent = '0';
}

// Создание препятствия
function createObstacle() {
    const types = ['spike', 'block'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    let obstacle = {
        x: CANVAS_WIDTH,
        y: CANVAS_HEIGHT - GROUND_HEIGHT,
        type: type,
        passed: false
    };
    
    if (type === 'spike') {
        obstacle.width = 30;
        obstacle.height = 40;
        obstacle.y -= obstacle.height;
    } else if (type === 'block') {
        obstacle.width = 40;
        obstacle.height = 40;
        obstacle.y -= obstacle.height;
    }
    
    obstacles.push(obstacle);
}

// Создание частиц
function createParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 1,
            color: color
        });
    }
}

// Обновление игрока
function updatePlayer() {
    // Применяем гравитацию
    player.velocityY += GRAVITY;
    player.y += player.velocityY;
    
    // Проверка столкновения с землей
    if (player.y >= CANVAS_HEIGHT - GROUND_HEIGHT - player.height) {
        player.y = CANVAS_HEIGHT - GROUND_HEIGHT - player.height;
        player.velocityY = 0;
        player.isJumping = false;
        
        // Выравниваем вращение при приземлении
        player.rotation = Math.round(player.rotation / (Math.PI / 2)) * (Math.PI / 2);
    } else {
        // Вращение во время прыжка
        player.rotation += 0.15;
    }
}

// Обновление препятствий
function updateObstacles() {
    // Создаем новые препятствия
    if (gameState.frameCount % 90 === 0) {
        createObstacle();
    }
    
    // Двигаем и удаляем препятствия
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= GAME_SPEED;
        
        // Удаляем препятствия за пределами экрана
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
            continue;
        }
        
        // Увеличиваем счет
        if (!obstacles[i].passed && obstacles[i].x + obstacles[i].width < player.x) {
            obstacles[i].passed = true;
            gameState.score++;
            scoreElement.textContent = gameState.score;
        }
    }
}

// Обновление частиц
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].x += particles[i].vx;
        particles[i].y += particles[i].vy;
        particles[i].life -= 0.02;
        
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// Проверка столкновений
function checkCollisions() {
    const playerRect = {
        x: player.x + 5,
        y: player.y + 5,
        width: player.width - 10,
        height: player.height - 10
    };
    
    for (let obstacle of obstacles) {
        let obstacleRect;
        
        if (obstacle.type === 'spike') {
            obstacleRect = {
                x: obstacle.x + 5,
                y: obstacle.y + 10,
                width: obstacle.width - 10,
                height: obstacle.height - 10
            };
        } else {
            obstacleRect = {
                x: obstacle.x,
                y: obstacle.y,
                width: obstacle.width,
                height: obstacle.height
            };
        }
        
        if (
            playerRect.x < obstacleRect.x + obstacleRect.width &&
            playerRect.x + playerRect.width > obstacleRect.x &&
            playerRect.y < obstacleRect.y + obstacleRect.height &&
            playerRect.y + playerRect.height > obstacleRect.y
        ) {
            gameOver();
            return;
        }
    }
}

// Отрисовка игрока
function drawPlayer() {
    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
    ctx.rotate(player.rotation);
    
    // Градиент для куба
    const gradient = ctx.createLinearGradient(-player.width/2, -player.height/2, player.width/2, player.height/2);
    gradient.addColorStop(0, player.color);
    gradient.addColorStop(1, '#ff8c00');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);
    
    // Обводка
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(-player.width / 2, -player.height / 2, player.width, player.height);
    
    ctx.restore();
}

// Отрисовка препятствий
function drawObstacles() {
    for (let obstacle of obstacles) {
        if (obstacle.type === 'spike') {
            // Рисуем шип
            ctx.fillStyle = '#ff4444';
            ctx.beginPath();
            ctx.moveTo(obstacle.x, obstacle.y + obstacle.height);
            ctx.lineTo(obstacle.x + obstacle.width / 2, obstacle.y);
            ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
            ctx.closePath();
            ctx.fill();
            
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else {
            // Рисуем блок
            const gradient = ctx.createLinearGradient(obstacle.x, obstacle.y, obstacle.x + obstacle.width, obstacle.y + obstacle.height);
            gradient.addColorStop(0, '#44ff44');
            gradient.addColorStop(1, '#00aa00');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        }
    }
}

// Отрисовка земли
function drawGround() {
    const groundGradient = ctx.createLinearGradient(0, CANVAS_HEIGHT - GROUND_HEIGHT, 0, CANVAS_HEIGHT);
    groundGradient.addColorStop(0, '#667eea');
    groundGradient.addColorStop(1, '#764ba2');
    
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, GROUND_HEIGHT);
    
    // Верхняя линия земли
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_HEIGHT - GROUND_HEIGHT);
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT);
    ctx.stroke();
}

// Отрисовка частиц
function drawParticles() {
    for (let particle of particles) {
        ctx.globalAlpha = particle.life;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

// Отрисовка фона
function drawBackground() {
    // Эффект параллакса можно добавить здесь
}

// Основной игровой цикл
function gameLoop() {
    if (!gameState.isRunning) return;
    
    // Очистка экрана
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Обновление
    updatePlayer();
    updateObstacles();
    updateParticles();
    checkCollisions();
    
    // Отрисовка
    drawBackground();
    drawGround();
    drawObstacles();
    drawPlayer();
    drawParticles();
    
    gameState.frameCount++;
    requestAnimationFrame(gameLoop);
}

// Прыжок
function jump() {
    if (!gameState.isRunning) return;
    
    if (!player.isJumping) {
        player.velocityY = JUMP_FORCE;
        player.isJumping = true;
        createParticles(player.x + player.width / 2, player.y + player.height, '#fff', 5);
    }
}

// Конец игры
function gameOver() {
    gameState.isRunning = false;
    createParticles(player.x + player.width / 2, player.y + player.height / 2, player.color, 20);
    
    // Показываем экран проигрыша
    setTimeout(() => {
        startScreen.classList.remove('hidden');
        startScreen.querySelector('h1').textContent = 'Игра окончена!';
        startScreen.querySelector('p').textContent = `Твой счет: ${gameState.score}`;
        startBtn.textContent = 'Играть снова';
    }, 500);
}

// Старт игры
function startGame() {
    initGame();
    gameState.isRunning = true;
    startScreen.classList.add('hidden');
    gameLoop();
}

// Обработчики событий
startBtn.addEventListener('click', startGame);

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (gameState.isRunning) {
            jump();
        } else if (!startScreen.classList.contains('hidden')) {
            startGame();
        }
    }
});

canvas.addEventListener('click', () => {
    if (gameState.isRunning) {
        jump();
    }
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameState.isRunning) {
        jump();
    }
});

// Начальная отрисовка
function initialDraw() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawGround();
}

initialDraw();
