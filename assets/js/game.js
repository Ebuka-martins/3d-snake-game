// Game settings
const GRID_SIZE = 20;
const CUBE_SIZE = 1;
const INITIAL_SPEED = 150; // ms per move

// Game state
let snake = [];
let direction = [1, 0, 0];
let food = [];
let score = 0;
let gameOver = false;
let gameStarted = false;
let gamePaused = false;
let gameSpeed = INITIAL_SPEED;
let gameInterval;

// Three.js variables
let scene, camera, renderer;
let snakeCubes = [];
let foodCube;

// DOM elements
let scoreElement, gameOverElement, startButton, pauseButton, restartButton;

function init() {
    // Get DOM elements
    scoreElement = document.getElementById('score');
    gameOverElement = document.getElementById('game-over');
    startButton = document.getElementById('start-button');
    pauseButton = document.getElementById('pause-button');
    restartButton = document.getElementById('restart-button');

    // Set up event listeners
    document.addEventListener('keydown', handleInput);
    startButton.addEventListener('click', startGame);
    pauseButton.addEventListener('click', togglePause);
    restartButton.addEventListener('click', resetGame);

    // Initialize Three.js
    setupScene();

    // Initialize game (but don't start yet)
    resetGame(false);
}

function setupScene() {
    // Three.js setup
    const canvas = document.getElementById('game-canvas');
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, 800/600, 0.1, 1000);
    camera.position.set(GRID_SIZE, GRID_SIZE, GRID_SIZE * 1.5);
    camera.lookAt(0, 0, 0);
    renderer = new THREE.WebGLRenderer({canvas, antialias: true});
    renderer.setSize(800, 600);

    // Lighting
    const light = new THREE.DirectionalLight(0xffffff, 0.8);
    light.position.set(GRID_SIZE, GRID_SIZE, GRID_SIZE);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040));

    // Grid
    const grid = new THREE.GridHelper(GRID_SIZE, GRID_SIZE, 0x00ff00, 0x006600);
    scene.add(grid);
}

function resetGame(autoStart = true) {
    // Clear existing game state
    if (gameInterval) clearInterval(gameInterval);
    
    // Remove all snake cubes from scene
    snakeCubes.forEach(cube => scene.remove(cube));
    if (foodCube) scene.remove(foodCube);

    // Reset game state
    snake = [[10, 10, 0]]; // Starting position
    direction = [1, 0, 0]; // Moving right initially
    food = [
        Math.floor(Math.random() * GRID_SIZE),
        Math.floor(Math.random() * GRID_SIZE),
        0
    ];
    score = 0;
    gameOver = false;
    gameStarted = false;
    gamePaused = false;
    gameSpeed = INITIAL_SPEED;
    snakeCubes = [];

    // Update UI
    scoreElement.textContent = `Score: ${score}`;
    gameOverElement.style.display = 'none';
    startButton.style.display = 'block';
    pauseButton.style.display = 'none';
    pauseButton.textContent = 'Pause';
    restartButton.style.display = 'none';

    // Create initial snake and food
    createSnake();
    createFood();

    // Render initial state
    renderer.render(scene, camera);

    if (autoStart) {
        startGame();
    }
}

function createSnake() {
    const geometry = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);
    const material = new THREE.MeshPhongMaterial({color: 0x00ff00});
    
    snake.forEach(pos => {
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(pos[0] - GRID_SIZE/2, pos[1] - GRID_SIZE/2, pos[2]);
        scene.add(cube);
        snakeCubes.push(cube);
    });
}

function createFood() {
    const geometry = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);
    const material = new THREE.MeshPhongMaterial({color: 0xff0000});
    foodCube = new THREE.Mesh(geometry, material);
    foodCube.position.set(food[0] - GRID_SIZE/2, food[1] - GRID_SIZE/2, food[2]);
    scene.add(foodCube);
}

function startGame() {
    if (gameStarted && !gamePaused) return;
    
    if (gamePaused) {
        togglePause();
        return;
    }

    gameStarted = true;
    gameOver = false;
    startButton.style.display = 'none';
    pauseButton.style.display = 'block';
    restartButton.style.display = 'block';
    gameOverElement.style.display = 'none';

    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, gameSpeed);
}

function togglePause() {
    gamePaused = !gamePaused;
    
    if (gamePaused) {
        clearInterval(gameInterval);
        pauseButton.textContent = 'Resume';
    } else {
        gameInterval = setInterval(gameLoop, gameSpeed);
        pauseButton.textContent = 'Pause';
    }
}

function gameLoop() {
    if (gamePaused || gameOver) return;
    
    // Store previous head position for food check
    const prevHead = [...snake[0]];
    
    // Move head
    const newHead = [
        snake[0][0] + direction[0],
        snake[0][1] + direction[1],
        snake[0][2] + direction[2]
    ];
    
    // Check wall collisions
    if (newHead[0] < 0 || newHead[0] >= GRID_SIZE ||
        newHead[1] < 0 || newHead[1] >= GRID_SIZE) {
        endGame();
        return;
    }
    
    // Check self-collision (skip the head)
    const hitSelf = snake.slice(1).some(segment => 
        segment[0] === newHead[0] && segment[1] === newHead[1]
    );
    
    if (hitSelf) {
        endGame();
        return;
    }
    
    // Move snake
    snake.unshift(newHead);
    
    // Check food collision
    if (newHead[0] === food[0] && newHead[1] === food[1]) {
        eatFood();
    } else {
        snake.pop();
    }
    
    updateSnakeVisuals();
    renderer.render(scene, camera);
}

function eatFood() {
    score += 10;
    scoreElement.textContent = `Score: ${score}`;
    
    // Increase speed slightly as score increases
    gameSpeed = Math.max(50, INITIAL_SPEED - Math.floor(score / 50) * 10);
    clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, gameSpeed);
    
    // Generate new food (make sure it's not on the snake)
    let newFood;
    do {
        newFood = [
            Math.floor(Math.random() * GRID_SIZE),
            Math.floor(Math.random() * GRID_SIZE),
            0
        ];
    } while (snake.some(segment => segment[0] === newFood[0] && segment[1] === newFood[1]));
    
    food = newFood;
    foodCube.position.set(food[0] - GRID_SIZE/2, food[1] - GRID_SIZE/2, food[2]);
}

function updateSnakeVisuals() {
    // Remove extra cubes if snake got shorter (shouldn't happen in normal gameplay)
    while (snakeCubes.length > snake.length) {
        const cube = snakeCubes.pop();
        scene.remove(cube);
    }

    // Update positions of existing cubes and add new ones if needed
    snake.forEach((pos, i) => {
        if (i < snakeCubes.length) {
            snakeCubes[i].position.set(pos[0] - GRID_SIZE/2, pos[1] - GRID_SIZE/2, pos[2]);
        } else {
            const geometry = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);
            const material = new THREE.MeshPhongMaterial({color: 0x00ff00});
            const cube = new THREE.Mesh(geometry, material);
            cube.position.set(pos[0] - GRID_SIZE/2, pos[1] - GRID_SIZE/2, pos[2]);
            scene.add(cube);
            snakeCubes.push(cube);
        }
    });
}

function endGame() {
    gameOver = true;
    gameStarted = false;
    clearInterval(gameInterval);
    gameOverElement.style.display = 'block';
    pauseButton.style.display = 'none';
    restartButton.style.display = 'block';
}

function handleInput(event) {
    if (!gameStarted || gamePaused) return;
    
    const key = event.key;
    // Prevent 180-degree turns
    if (key === 'ArrowDown' && direction[1] !== 1)
        direction = [0, -1, 0];
    else if (key === 'ArrowUp' && direction[1] !== -1)
        direction = [0, 1, 0];
    else if (key === 'ArrowLeft' && direction[0] !== 1)
        direction = [-1, 0, 0];
    else if (key === 'ArrowRight' && direction[0] !== -1)
        direction = [1, 0, 0];
}

// Initialize the game when the page loads
window.onload = init;