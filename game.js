// ============================================
// GEOMETRY DASH - Полная версия с уровнями
// ============================================

// Константы игры
const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 500;
const GROUND_HEIGHT = 60;
const PLAYER_SIZE = 35;
const PLAYER_X = 120;

// Настройки уровней
const LEVELS = {
    easy: {
        name: 'Лёгкий',
        speed: 5,
        gravity: 0.5,
        jumpForce: -11,
        obstacleInterval: 120,
        length: 50,
        colors: { bg: ['#1a1a4e', '#2d2d6e'], ground: ['#00b894', '#00cec9'] }
    },
    medium: {
        name: 'Средний',
        speed: 7,
        gravity: 0.6,
        jumpForce: -12,
        obstacleInterval: 90,
        length: 80,
        colors: { bg: ['#2d1a4e', '#4e2d6e'], ground: ['#fdcb6e', '#e17055'] }
    },
    hard: {
        name: 'Сложный',
        speed: 9,
        gravity: 0.7,
        jumpForce: -13,
        obstacleInterval: 70,
        length: 120,
        colors: { bg: ['#4e1a2d', '#6e2d4e'], ground: ['#d63031', '#6c5ce7'] }
    }
};

// Состояние игры
let gameState = {
    isRunning: false,
    currentLevel: 'easy',
    score: 0,
    attempts: 1,
    frameCount: 0,
    levelProgress: 0,
    highScores: { easy: 0, medium: 0, hard: 0 }
};

// DOM элементы
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('scoreDisplay');
const progressBar = document.getElementById('progressBar');
const startScreen = document.getElementById('startScreen');
const levelSelectScreen = document.getElementById('levelSelectScreen');
const deathScreen = document.getElementById('deathScreen');
const winScreen = document.getElementById('winScreen');
const scoreValue = document.getElementById('scoreValue');
const attemptValue = document.getElementById('attemptValue');
const winScore = document.getElementById('winScore');
const winAttempts = document.getElementById('winAttempts');

// Игрок
let player = {
    x: PLAYER_X,
    y: 0,
    velocityY: 0,
    rotation: 0,
    isJumping: false,
    color: '#ffd700',
    trail: []
};

// Препятствия и частицы
let obstacles = [];
let particles = [];
let backgroundParticles = [];

// Инициализация игрока
function initPlayer() {
    player.y = CANVAS_HEIGHT - GROUND_HEIGHT - PLAYER_SIZE;
    player.velocityY = 0;
    player.rotation = 0;
    player.isJumping = false;
    player.trail = [];
}

// Создание препятствия
function createObstacle(levelConfig) {
    const types = ['spike', 'spike', 'block', 'triple'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    let obstacle = {
        x: CANVAS_WIDTH,
        type: type,
        passed: false
    };
    
    if (type === 'spike') {
        obstacle.width = 35;
        obstacle.height = 45;
        obstacle.y = CANVAS_HEIGHT - GROUND_HEIGHT - obstacle.height;
    } else if (type === 'block') {
        obstacle.width = 45;
        obstacle.height = 45;
        obstacle.y = CANVAS_HEIGHT - GROUND_HEIGHT - obstacle.height;
    } else if (type === 'triple') {
        obstacle.width = 100;
        obstacle.height = 35;
        obstacle.y = CANVAS_HEIGHT - GROUND_HEIGHT - obstacle.height;
    }
    
    obstacles.push(obstacle);
}

// Создание частиц
function createParticles(x, y, color, count = 15) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 12,
            vy: (Math.random() - 0.5) * 12,
            life: 1,
            decay: 0.02 + Math.random() * 0.02,
            size: 3 + Math.random() * 4,
            color: color
        });
    }
}

// Создание фоновых частиц
function initBackgroundParticles() {
    backgroundParticles = [];
    for (let i = 0; i < 50; i++) {
        backgroundParticles.push({
            x: Math.random() * CANVAS_WIDTH,
            y: Math.random() * (CANVAS_HEIGHT - GROUND_HEIGHT),
            size: Math.random() * 2 + 1,
            speed: Math.random() * 0.5 + 0.2,
            alpha: Math.random() * 0.5 + 0.2
        });
    }
}

// Обновление игрока
function updatePlayer(levelConfig) {
    // Добавляем след
    if (gameState.frameCount % 3 === 0) {
        player.trail.push({
            x: player.x,
            y: player.y,
            rotation: player.rotation,
            alpha: 0.6
        });
        if (player.trail.length > 5) player.trail.shift();
    }
    
    // Гравитация
    player.velocityY += levelConfig.gravity;
    player.y += player.velocityY;
    
    // Проверка земли
    if (player.y >= CANVAS_HEIGHT - GROUND_HEIGHT - PLAYER_SIZE) {
        player.y = CANVAS_HEIGHT - GROUND_HEIGHT - PLAYER_SIZE;
        player.velocityY = 0;
        player.isJumping = false;
        player.rotation = Math.round(player.rotation / (Math.PI / 2)) * (Math.PI / 2);
    } else {
        player.rotation += 0.12;
    }
}

// Обновление препятствий
function updateObstacles(levelConfig) {
    const totalObstacles = Math.ceil(levelConfig.length * (levelConfig.obstacleInterval / 60));
    
    if (gameState.frameCount % levelConfig.obstacleInterval === 0 && 
        gameState.levelProgress < levelConfig.length) {
        createObstacle(levelConfig);
        gameState.levelProgress++;
    }
    
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= levelConfig.speed;
        
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
            continue;
        }
        
        if (!obstacles[i].passed && obstacles[i].x + obstacles[i].width < player.x) {
            obstacles[i].passed = true;
            gameState.score++;
            scoreDisplay.textContent = gameState.score;
        }
    }
}

// Обновление частиц
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].x += particles[i].vx;
        particles[i].y += particles[i].vy;
        particles[i].life -= particles[i].decay;
        particles[i].vy += 0.3;
        
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// Проверка столкновений
function checkCollisions() {
    const hitBox = 8;
    const playerRect = {
        x: player.x + hitBox,
        y: player.y + hitBox,
        width: PLAYER_SIZE - hitBox * 2,
        height: PLAYER_SIZE - hitBox * 2
    };
    
    for (let obstacle of obstacles) {
        let obsRect;
        
        if (obstacle.type === 'spike') {
            obsRect = {
                x: obstacle.x + 5,
                y: obstacle.y + 10,
                width: obstacle.width - 10,
                height: obstacle.height - 15
            };
        } else {
            obsRect = {
                x: obstacle.x + 3,
                y: obstacle.y + 3,
                width: obstacle.width - 6,
                height: obstacle.height - 6
            };
        }
        
        if (playerRect.x < obsRect.x + obsRect.width &&
            playerRect.x + playerRect.width > obsRect.x &&
            playerRect.y < obsRect.y + obsRect.height &&
            playerRect.y + playerRect.height > obsRect.y) {
            return true;
        }
    }
    return false;
}

// Отрисовка фона
function drawBackground(levelConfig) {
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, levelConfig.colors.bg[0]);
    gradient.addColorStop(1, levelConfig.colors.bg[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Фоновые частицы
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for (let p of backgroundParticles) {
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        p.x -= p.speed;
        if (p.x < 0) p.x = CANVAS_WIDTH;
    }
    ctx.globalAlpha = 1;
}

// Отрисовка земли
function drawGround(levelConfig) {
    const gradient = ctx.createLinearGradient(0, CANVAS_HEIGHT - GROUND_HEIGHT, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, levelConfig.colors.ground[0]);
    gradient.addColorStop(1, levelConfig.colors.ground[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, GROUND_HEIGHT);
    
    // Верхняя линия
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_HEIGHT - GROUND_HEIGHT);
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT);
    ctx.stroke();
    
    // Узор на земле
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    const offset = (gameState.frameCount * LEVELS[gameState.currentLevel].speed) % 50;
    for (let i = -50; i < CANVAS_WIDTH; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i - offset, CANVAS_HEIGHT - GROUND_HEIGHT + 10);
        ctx.lineTo(i - offset + 20, CANVAS_HEIGHT - 10);
        ctx.lineTo(i - offset + 10, CANVAS_HEIGHT - 10);
        ctx.lineTo(i - offset - 10, CANVAS_HEIGHT - GROUND_HEIGHT + 10);
        ctx.fill();
    }
}

// Отрисовка игрока
function drawPlayer() {
    // След
    for (let t of player.trail) {
        ctx.save();
        ctx.translate(t.x + PLAYER_SIZE/2, t.y + PLAYER_SIZE/2);
        ctx.rotate(t.rotation);
        ctx.fillStyle = `rgba(255, 215, 0, ${t.alpha})`;
        ctx.fillRect(-PLAYER_SIZE/2, -PLAYER_SIZE/2, PLAYER_SIZE, PLAYER_SIZE);
        t.alpha -= 0.1;
        ctx.restore();
    }
    player.trail = player.trail.filter(t => t.alpha > 0);
    
    // Игрок
    ctx.save();
    ctx.translate(player.x + PLAYER_SIZE/2, player.y + PLAYER_SIZE/2);
    ctx.rotate(player.rotation);
    
    const gradient = ctx.createLinearGradient(-PLAYER_SIZE/2, -PLAYER_SIZE/2, PLAYER_SIZE/2, PLAYER_SIZE/2);
    gradient.addColorStop(0, player.color);
    gradient.addColorStop(1, '#ff8c00');
    ctx.fillStyle = gradient;
    ctx.fillRect(-PLAYER_SIZE/2, -PLAYER_SIZE/2, PLAYER_SIZE, PLAYER_SIZE);
    
    // Обводка
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.strokeRect(-PLAYER_SIZE/2, -PLAYER_SIZE/2, PLAYER_SIZE, PLAYER_SIZE);
    
    // Глаз
    ctx.fillStyle = '#fff';
    ctx.fillRect(5, -8, 10, 10);
    ctx.fillStyle = '#000';
    ctx.fillRect(10, -5, 5, 5);
    
    ctx.restore();
}

// Отрисовка препятствий
function drawObstacles() {
    for (let obstacle of obstacles) {
        if (obstacle.type === 'spike') {
            const gradient = ctx.createLinearGradient(
                obstacle.x, obstacle.y, 
                obstacle.x, obstacle.y + obstacle.height
            );
            gradient.addColorStop(0, '#ff6b6b');
            gradient.addColorStop(1, '#c0392b');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(obstacle.x, obstacle.y + obstacle.height);
            ctx.lineTo(obstacle.x + obstacle.width/2, obstacle.y);
            ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
            ctx.closePath();
            ctx.fill();
            
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else if (obstacle.type === 'block') {
            const gradient = ctx.createLinearGradient(
                obstacle.x, obstacle.y,
                obstacle.x + obstacle.width, obstacle.y + obstacle.height
            );
            gradient.addColorStop(0, '#00b894');
            gradient.addColorStop(1, '#00a085');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        } else if (obstacle.type === 'triple') {
            for (let i = 0; i < 3; i++) {
                const gradient = ctx.createLinearGradient(
                    obstacle.x + i * 30, obstacle.y,
                    obstacle.x + i * 30, obstacle.y + obstacle.height
                );
                gradient.addColorStop(0, '#fdcb6e');
                gradient.addColorStop(1, '#e17055');
                
                ctx.fillStyle = gradient;
                ctx.fillRect(obstacle.x + i * 30, obstacle.y, 30, obstacle.height);
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.strokeRect(obstacle.x + i * 30, obstacle.y, 30, obstacle.height);
            }
        }
    }
}

// Отрисовка частиц
function drawParticles() {
    for (let p of particles) {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

// Обновление прогресс-бара
function updateProgressBar(levelConfig) {
    const progress = (gameState.levelProgress / levelConfig.length) * 100;
    progressBar.style.width = `${Math.min(progress, 100)}%`;
}

// Основной игровой цикл
function gameLoop() {
    if (!gameState.isRunning) return;
    
    const levelConfig = LEVELS[gameState.currentLevel];
    
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    updatePlayer(levelConfig);
    updateObstacles(levelConfig);
    updateParticles();
    updateProgressBar(levelConfig);
    
    if (checkCollisions()) {
        gameOver();
        return;
    }
    
    // Проверка победы
    if (gameState.levelProgress >= levelConfig.length && obstacles.length === 0) {
        winLevel();
        return;
    }
    
    drawBackground(levelConfig);
    drawGround(levelConfig);
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
        const levelConfig = LEVELS[gameState.currentLevel];
        player.velocityY = levelConfig.jumpForce;
        player.isJumping = true;
        createParticles(player.x + PLAYER_SIZE/2, player.y + PLAYER_SIZE, '#fff', 8);
    }
}

// Конец игры
function gameOver() {
    gameState.isRunning = false;
    createParticles(player.x + PLAYER_SIZE/2, player.y + PLAYER_SIZE/2, player.color, 25);
    
    setTimeout(() => {
        scoreValue.textContent = gameState.score;
        attemptValue.textContent = gameState.attempts;
        deathScreen.classList.remove('hidden');
    }, 300);
}

// Победа в уровне
function winLevel() {
    gameState.isRunning = false;
    
    if (gameState.score > gameState.highScores[gameState.currentLevel]) {
        gameState.highScores[gameState.currentLevel] = gameState.score;
    }
    
    setTimeout(() => {
        winScore.textContent = gameState.score;
        winAttempts.textContent = gameState.attempts;
        winScreen.classList.remove('hidden');
    }, 300);
}

// Показать главное меню
function showMainMenu() {
    deathScreen.classList.add('hidden');
    winScreen.classList.add('hidden');
    levelSelectScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    
    // Очистка канваса
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    initBackgroundParticles();
    drawBackground(LEVELS.easy);
    drawGround(LEVELS.easy);
}

// Показать выбор уровня
function showLevelSelect() {
    startScreen.classList.add('hidden');
    deathScreen.classList.add('hidden');
    winScreen.classList.add('hidden');
    levelSelectScreen.classList.remove('hidden');
}

// Выбор уровня
function selectLevel(level, element) {
    gameState.currentLevel = level;
    
    // Убираем выделение со всех кнопок
    document.querySelectorAll('.level-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Выделяем выбранную кнопку
    element.classList.add('selected');
}

// Старт игры
function startGame() {
    const levelConfig = LEVELS[gameState.currentLevel];
    
    gameState.isRunning = true;
    gameState.score = 0;
    gameState.frameCount = 0;
    gameState.levelProgress = 0;
    gameState.attempts = 1;
    
    scoreDisplay.textContent = '0';
    progressBar.style.width = '0%';
    
    initPlayer();
    obstacles = [];
    particles = [];
    initBackgroundParticles();
    
    levelSelectScreen.classList.add('hidden');
    
    gameLoop();
}

// Перезапуск уровня
function restartLevel() {
    gameState.attempts++;
    deathScreen.classList.add('hidden');
    
    gameState.isRunning = true;
    gameState.score = 0;
    gameState.frameCount = 0;
    gameState.levelProgress = 0;
    
    scoreDisplay.textContent = '0';
    progressBar.style.width = '0%';
    
    initPlayer();
    obstacles = [];
    particles = [];
    
    gameLoop();
}

// Обработчики событий
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (gameState.isRunning) {
            jump();
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

// Инициализация при загрузке
function init() {
    initBackgroundParticles();
    drawBackground(LEVELS.easy);
    drawGround(LEVELS.easy);
}

init();
