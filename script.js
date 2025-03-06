const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const gridSize = 20;
const tileCount = canvas.width / gridSize;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

let snake = {
    x: 10,
    y: 10,
    dx: 1,
    dy: 0,
    cells: [{ x: 10, y: 10 }],
    maxCells: 1
};
let apple = { x: 15, y: 15 };
let bigOrange = null;
let score = 0;
let appleCount = 0;
let gameSpeed = 100;
let gameLoop = null;
let isSlowed = false;

document.getElementById('start-button').addEventListener('click', () => {
    document.getElementById('rules-screen').style.display = 'none';
    if (!gameLoop) startGame();
});

document.getElementById('tweet-button').addEventListener('click', tweetScore);
document.getElementById('restart-button').addEventListener('click', () => {
    document.getElementById('game-over-screen').style.display = 'none';
    resetGame();
    startGame();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' && snake.dy === 0) { snake.dx = 0; snake.dy = -1; }
    else if (e.key === 'ArrowDown' && snake.dy === 0) { snake.dx = 0; snake.dy = 1; }
    else if (e.key === 'ArrowLeft' && snake.dx === 0) { snake.dx = -1; snake.dy = 0; }
    else if (e.key === 'ArrowRight' && snake.dx === 0) { snake.dx = 1; snake.dy = 0; }
});

function startGame() {
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(game, gameSpeed);
}

function resetGame() {
    snake = { x: 10, y: 10, dx: 1, dy: 0, cells: [{ x: 10, y: 10 }], maxCells: 1 };
    apple = { x: 15, y: 15 };
    bigOrange = null;
    score = 0;
    appleCount = 0;
    gameSpeed = 100;
    isSlowed = false;
    document.getElementById('score').textContent = 'Score: 0';
}

function playEatAppleSound() {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
}

function playEatBigOrangeSound() {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(200, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.7, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.3);
}

function playGameOverSound() {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(100, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.5);
    gainNode.gain.setValueAtTime(0.6, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.5);
}

function isPositionFree(x, y) {
    return !snake.cells.some(cell => cell.x === x && cell.y === y);
}

function game() {
    snake.x += snake.dx;
    snake.y += snake.dy;

    if (snake.x < 0 || snake.x >= tileCount || snake.y < 0 || snake.y >= tileCount) {
        playGameOverSound();
        endGame();
        return;
    }

    snake.cells.unshift({ x: snake.x, y: snake.y });
    if (snake.cells.length > snake.maxCells) snake.cells.pop();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < snake.cells.length; i++) {
        const cell = snake.cells[i];
        if (i === 0) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ff0000';
            const headGradient = ctx.createRadialGradient(
                cell.x * gridSize + gridSize / 2, cell.y * gridSize + gridSize / 2, 0,
                cell.x * gridSize + gridSize / 2, cell.y * gridSize + gridSize / 2, gridSize / 2
            );
            headGradient.addColorStop(0, '#ff0000');
            headGradient.addColorStop(1, '#cc0000');
            ctx.fillStyle = headGradient;
            ctx.beginPath();
            ctx.arc(cell.x * gridSize + gridSize / 2, cell.y * gridSize + gridSize / 2, gridSize / 2 - 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(cell.x * gridSize + gridSize / 3, cell.y * gridSize + gridSize / 3, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cell.x * gridSize + gridSize * 2 / 3, cell.y * gridSize + gridSize / 3, 2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            const bodyGradient = ctx.createLinearGradient(
                cell.x * gridSize, cell.y * gridSize,
                (cell.x + 1) * gridSize, (cell.y + 1) * gridSize
            );
            bodyGradient.addColorStop(0, '#ff3333');
            bodyGradient.addColorStop(1, '#cc0000');
            ctx.shadowBlur = 5;
            ctx.shadowColor = '#ff3333';
            ctx.fillStyle = bodyGradient;
            ctx.beginPath();
            ctx.arc(cell.x * gridSize + gridSize / 2, cell.y * gridSize + gridSize / 2, gridSize / 2 - 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    ctx.shadowBlur = 8;
    ctx.shadowColor = '#00cc00';
    const appleGradient = ctx.createRadialGradient(
        apple.x * gridSize + gridSize / 2, apple.y * gridSize + gridSize / 2, 0,
        apple.x * gridSize + gridSize / 2, apple.y * gridSize + gridSize / 2, gridSize / 2
    );
    appleGradient.addColorStop(0, '#00ff00');
    appleGradient.addColorStop(1, '#00cc00');
    ctx.fillStyle = appleGradient;
    ctx.beginPath();
    ctx.arc(apple.x * gridSize + gridSize / 2, apple.y * gridSize + gridSize / 2, gridSize / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(apple.x * gridSize + gridSize / 2 - 1, apple.y * gridSize + 2, 2, 4);
    ctx.shadowBlur = 0;

    if (bigOrange) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff9900';
        const orangeGradient = ctx.createRadialGradient(
            bigOrange.x * gridSize + gridSize, bigOrange.y * gridSize + gridSize, 0,
            bigOrange.x * gridSize + gridSize, bigOrange.y * gridSize + gridSize, gridSize
        );
        orangeGradient.addColorStop(0, '#ffcc00');
        orangeGradient.addColorStop(1, '#ff6600');
        ctx.fillStyle = orangeGradient;
        ctx.beginPath();
        ctx.arc(bigOrange.x * gridSize + gridSize, bigOrange.y * gridSize + gridSize, gridSize - 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff4500';
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * (gridSize - 4);
            ctx.beginPath();
            ctx.arc(
                bigOrange.x * gridSize + gridSize + Math.cos(angle) * radius,
                bigOrange.y * gridSize + gridSize + Math.sin(angle) * radius,
                1, 0, Math.PI * 2
            );
            ctx.fill();
        }
        ctx.shadowBlur = 0;
    }

    if (snake.x === apple.x && snake.y === apple.y) {
        snake.maxCells++;
        score += 1;
        appleCount += 1;
        playEatAppleSound();
        do {
            apple = { x: Math.floor(Math.random() * tileCount), y: Math.floor(Math.random() * tileCount) };
        } while (!isPositionFree(apple.x, apple.y));
        document.getElementById('score').textContent = `Score: ${score}`;
        
        if (appleCount === 10) {
            do {
                bigOrange = { x: Math.floor(Math.random() * (tileCount - 2)), y: Math.floor(Math.random() * (tileCount - 2)) };
            } while (!isPositionFree(bigOrange.x, bigOrange.y));
            appleCount = 0;
        }
    }

    if (bigOrange && Math.abs(snake.x - bigOrange.x) <= 1 && Math.abs(snake.y - bigOrange.y) <= 1) {
        snake.maxCells += 5;
        score += 10;
        playEatBigOrangeSound();
        bigOrange = null;
        clearInterval(gameLoop);
        gameSpeed = 200;
        isSlowed = true;
        gameLoop = setInterval(game, gameSpeed);
        setTimeout(() => {
            clearInterval(gameLoop);
            gameSpeed = 100;
            isSlowed = false;
            startGame();
        }, 5000);
        document.getElementById('score').textContent = `Score: ${score}`;
    }

    for (let i = 1; i < snake.cells.length; i++) {
        if (snake.x === snake.cells[i].x && snake.y === snake.cells[i].y) {
            playGameOverSound();
            endGame();
            return;
        }
    }
}

function endGame() {
    clearInterval(gameLoop);
    gameLoop = null;
    document.getElementById('final-score').textContent = score;
    document.getElementById('game-over-screen').style.display = 'block';
}

function tweetScore() {
    const tweetText = `I scored ${score} in the @sign Snake Game! (made by @mdyasin122) Can you beat me? Play here: https://sign-snake-game.vercel.app`;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(tweetUrl, '_blank');
}