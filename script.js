/**
 * Neo Snake Game Engine
 * High-performance, modern, fully featured Snake game in pure Vanilla JS.
 */

// Sound Synth Engine using Web Audio API
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Resume context if suspended (browser security)
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playEat() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    // Arpeggio sound
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
    osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
    osc.frequency.setValueAtTime(1046.50, now + 0.24); // C6

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  playGameOver() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(100, now + 0.6);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.7);
  }

  playClick() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  playLevelUp() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(554.37, now + 0.1);
    osc.frequency.setValueAtTime(659.25, now + 0.2);
    osc.frequency.setValueAtTime(880, now + 0.3);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.5);
  }
}

// Particle System for delicious explosions
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = Math.random() * 3 + 2;
    this.angle = Math.random() * Math.PI * 2;
    this.speed = Math.random() * 3 + 2;
    this.velocity = {
      x: Math.cos(this.angle) * this.speed,
      y: Math.sin(this.angle) * this.speed
    };
    this.alpha = 1;
    this.decay = Math.random() * 0.02 + 0.015;
  }

  update() {
    this.x += this.velocity.x;
    this.y += this.velocity.y;
    this.alpha -= this.decay;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.fill();
    ctx.restore();
  }
}

// Game Settings and Setup
const sound = new SoundEngine();
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Constants
const GRID_SIZE = 20; // 20x20 grid
const CANVAS_SIZE = 400;
const CELL_SIZE = CANVAS_SIZE / GRID_SIZE;

// State Variables
let snake = [];
let food = { x: 0, y: 0 };
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let score = 0;
let highScore = parseInt(localStorage.getItem('neo-snake-high-score')) || 0;
let gameMode = 'menu'; // menu, playing, paused, gameover
let difficulty = 'medium'; // easy, medium, hard
let speed = 100; // ms per tick
let baseSpeed = 100;
let lastTickTime = 0;
let particles = [];
let applesEaten = 0;
let achievementsUnlocked = new Set();

// Difficulty configurations
const DIFFICULTY_SETTINGS = {
  easy: { speed: 120, label: 'Easy' },
  medium: { speed: 100, label: 'Medium' },
  hard: { speed: 70, label: 'Hard' }
};

// UI Element Selections
const startScreen = document.getElementById('start-screen');
const pauseScreen = document.getElementById('pause-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const resumeBtn = document.getElementById('resume-btn');
const restartBtn = document.getElementById('restart-btn');
const scoreVal = document.getElementById('score-val');
const highScoreVal = document.getElementById('high-score-val');
const finalScore = document.getElementById('final-score');
const finalApples = document.getElementById('final-apples');
const newHighScoreBadge = document.getElementById('new-high-score');
const activeDifficultyBadge = document.getElementById('active-difficulty');
const activeThemeBadge = document.getElementById('active-theme');
const gamePausedIndicator = document.getElementById('game-paused-indicator');
const muteBtn = document.getElementById('mute-btn');
const themeBtn = document.getElementById('theme-btn');
const themeModal = document.getElementById('theme-modal');
const closeThemeBtn = document.getElementById('close-theme-btn');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const toggleControlsBtn = document.getElementById('toggle-controls');
const mobileDpad = document.getElementById('mobile-dpad');

// Init scores
updateHighScoreDisplay();

// Update High Score displays
function updateHighScoreDisplay() {
  highScoreVal.textContent = String(highScore).padStart(3, '0');
}

// Format scores to 3 digits
function formatScore(num) {
  return String(num).padStart(3, '0');
}

// --- Sound Muting Functionality ---
muteBtn.addEventListener('click', () => {
  sound.muted = !sound.muted;
  if (sound.muted) {
    muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
    muteBtn.style.color = '#ff0055';
  } else {
    muteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
    muteBtn.style.color = '';
    sound.playClick();
  }
});

// --- Theme Management ---
const THEME_LABELS = {
  classic: 'Classic Neon',
  cyberpunk: 'Cyberpunk Magenta',
  emerald: 'Emerald Forest',
  sunset: 'Sunset Glow',
  monochrome: 'Matrix Hacker'
};

function changeTheme(themeName) {
  document.body.setAttribute('data-selected-theme', themeName);
  activeThemeBadge.innerHTML = `<i class="fas fa-tint"></i> ${THEME_LABELS[themeName] || themeName}`;
  localStorage.setItem('neo-snake-theme', themeName);

  // Highlight chosen option in modal
  document.querySelectorAll('.theme-option').forEach(opt => {
    if (opt.getAttribute('data-theme') === themeName) {
      opt.classList.add('active');
    } else {
      opt.classList.remove('active');
    }
  });
}

// Load Theme from local storage
const savedTheme = localStorage.getItem('neo-snake-theme') || 'classic';
changeTheme(savedTheme);

themeBtn.addEventListener('click', () => {
  sound.playClick();
  themeModal.classList.remove('hidden');
});

closeThemeBtn.addEventListener('click', () => {
  sound.playClick();
  themeModal.classList.add('hidden');
});

document.querySelectorAll('.theme-option').forEach(btn => {
  btn.addEventListener('click', () => {
    sound.playClick();
    changeTheme(btn.getAttribute('data-theme'));
  });
});

// Close modal when clicking outside contents
themeModal.addEventListener('click', (e) => {
  if (e.target === themeModal) {
    themeModal.classList.add('hidden');
  }
});

// --- Fullscreen Handling ---
fullscreenBtn.addEventListener('click', () => {
  sound.playClick();
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      console.warn(`Error enabling fullscreen: ${err.message}`);
    });
    fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
  } else {
    document.exitFullscreen();
    fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
  }
});

// --- Mobile On-screen Control Panel ---
toggleControlsBtn.addEventListener('click', () => {
  sound.playClick();
  if (mobileDpad.classList.contains('hidden')) {
    mobileDpad.classList.remove('hidden');
    toggleControlsBtn.innerHTML = '<i class="fas fa-gamepad"></i> Hide D-pad';
  } else {
    mobileDpad.classList.add('hidden');
    toggleControlsBtn.innerHTML = '<i class="fas fa-gamepad"></i> On-screen D-pad';
  }
});

// --- Difficulty Buttons ---
document.querySelectorAll('.diff-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    sound.playClick();
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    difficulty = btn.getAttribute('data-diff');
    activeDifficultyBadge.innerHTML = `<i class="fas fa-gauge-high"></i> ${DIFFICULTY_SETTINGS[difficulty].label}`;
  });
});

// --- Achievements system ---
function showAchievement(text) {
  const toast = document.getElementById('achievement-toast');
  const toastDesc = document.getElementById('toast-desc');
  toastDesc.textContent = text;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('show'), 50);
  sound.playLevelUp();

  // Hide after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.classList.add('hidden'), 400);
  }, 3500);
}

function checkAchievements() {
  if (score >= 10 && !achievementsUnlocked.has('10pts')) {
    achievementsUnlocked.add('10pts');
    showAchievement('Novice Hunter (10 Points!)');
  }
  if (score >= 25 && !achievementsUnlocked.has('25pts')) {
    achievementsUnlocked.add('25pts');
    showAchievement('Grid Master (25 Points!)');
  }
  if (score >= 50 && !achievementsUnlocked.has('50pts')) {
    achievementsUnlocked.add('50pts');
    showAchievement('Slinky Legend (50 Points!)');
  }
}

// --- Swipe Gesture Logic for Touch Screen Devices ---
let touchStartX = 0;
let touchStartY = 0;
canvas.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
  const diffX = e.changedTouches[0].clientX - touchStartX;
  const diffY = e.changedTouches[0].clientY - touchStartY;

  // Only trigger if movement is more than 30px to prevent accidental taps
  if (Math.abs(diffX) > 30 || Math.abs(diffY) > 30) {
    if (Math.abs(diffX) > Math.abs(diffY)) {
      // Horizontal swipe
      if (diffX > 0 && direction.x === 0) {
        nextDirection = { x: 1, y: 0 };
      } else if (diffX < 0 && direction.x === 0) {
        nextDirection = { x: -1, y: 0 };
      }
    } else {
      // Vertical swipe
      if (diffY > 0 && direction.y === 0) {
        nextDirection = { x: 0, y: 1 };
      } else if (diffY < 0 && direction.y === 0) {
        nextDirection = { x: 0, y: -1 };
      }
    }
  }
  e.preventDefault();
}, { passive: false });

// --- Direction Controller Inputs ---
function handleKeyDown(e) {
  if (gameMode !== 'playing') {
    if (e.code === 'Space' || e.code === 'Escape' || e.key === 'p' || e.key === 'P') {
      if (gameMode === 'paused') {
        resumeGame();
      } else if (gameMode === 'menu') {
        startGame();
      } else if (gameMode === 'gameover') {
        restartGame();
      }
    }
    return;
  }

  switch(e.key) {
    // Up
    case 'ArrowUp':
    case 'w':
    case 'W':
      if (direction.y === 0) nextDirection = { x: 0, y: -1 };
      break;
    // Down
    case 'ArrowDown':
    case 's':
    case 'S':
      if (direction.y === 0) nextDirection = { x: 0, y: 1 };
      break;
    // Left
    case 'ArrowLeft':
    case 'a':
    case 'A':
      if (direction.x === 0) nextDirection = { x: -1, y: 0 };
      break;
    // Right
    case 'ArrowRight':
    case 'd':
    case 'D':
      if (direction.x === 0) nextDirection = { x: 1, y: 0 };
      break;
    // Pause hotkey
    case ' ':
    case 'p':
    case 'P':
    case 'Escape':
      pauseGame();
      break;
  }
}

window.addEventListener('keydown', handleKeyDown);

// --- D-Pad Buttons Listeners ---
document.getElementById('btn-up').addEventListener('click', () => {
  if (direction.y === 0) nextDirection = { x: 0, y: -1 };
});
document.getElementById('btn-down').addEventListener('click', () => {
  if (direction.y === 0) nextDirection = { x: 0, y: 1 };
});
document.getElementById('btn-left').addEventListener('click', () => {
  if (direction.x === 0) nextDirection = { x: -1, y: 0 };
});
document.getElementById('btn-right').addEventListener('click', () => {
  if (direction.x === 0) nextDirection = { x: 1, y: 0 };
});

// --- Core Game Mechanics ---

function startNewFood() {
  let validPosition = false;
  let newFood = {};

  while (!validPosition) {
    newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };

    // Check collision with snake body
    validPosition = true;
    for (const segment of snake) {
      if (segment.x === newFood.x && segment.y === newFood.y) {
        validPosition = false;
        break;
      }
    }
  }

  food = newFood;
}

function startGame() {
  sound.playClick();

  // Setup state
  baseSpeed = DIFFICULTY_SETTINGS[difficulty].speed;
  speed = baseSpeed;
  score = 0;
  applesEaten = 0;
  scoreVal.textContent = '000';
  achievementsUnlocked.clear();

  // Spawn snake in middle
  snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 }
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };

  startNewFood();
  particles = [];

  gameMode = 'playing';

  // Hide screens
  startScreen.classList.add('hidden');
  gameOverScreen.classList.add('hidden');
  pauseScreen.classList.add('hidden');
  gamePausedIndicator.classList.add('hidden');

  lastTickTime = performance.now();
  requestAnimationFrame(gameLoop);
}

function pauseGame() {
  if (gameMode !== 'playing') return;
  sound.playClick();
  gameMode = 'paused';
  pauseScreen.classList.remove('hidden');
  gamePausedIndicator.classList.remove('hidden');
}

function resumeGame() {
  if (gameMode !== 'paused') return;
  sound.playClick();
  gameMode = 'playing';
  pauseScreen.classList.add('hidden');
  gamePausedIndicator.classList.add('hidden');
  lastTickTime = performance.now();
  requestAnimationFrame(gameLoop);
}

function restartGame() {
  startGame();
}

function gameOver() {
  gameMode = 'gameover';
  sound.playGameOver();

  // Handle high score
  let isNewHigh = false;
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('neo-snake-high-score', highScore);
    updateHighScoreDisplay();
    isNewHigh = true;
  }

  // Show game over overlay
  finalScore.textContent = score;
  finalApples.textContent = applesEaten;

  if (isNewHigh) {
    newHighScoreBadge.classList.remove('hidden');
  } else {
    newHighScoreBadge.classList.add('hidden');
  }

  gameOverScreen.classList.remove('hidden');
}

// Trigger buttons
startBtn.addEventListener('click', startGame);
resumeBtn.addEventListener('click', resumeGame);
restartBtn.addEventListener('click', restartGame);

// --- Draw Functions ---

function getCSSVariableValue(variable) {
  return getComputedStyle(document.body).getPropertyValue(variable).trim();
}

function drawGame() {
  // Clear with a super cool grid layout grid lines or stylish clean background
  ctx.fillStyle = '#0d0d14';
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  // Get current theme color palette
  const headColor = getCSSVariableValue('--snake-head') || '#00ffcc';
  const bodyStartColor = getCSSVariableValue('--snake-body-start') || '#00b3ff';
  const bodyEndColor = getCSSVariableValue('--snake-body-end') || '#0059ff';
  const foodColor = getCSSVariableValue('--food-color') || '#ff007f';

  // Draw subtle grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= GRID_SIZE; i++) {
    // Vertical line
    ctx.beginPath();
    ctx.moveTo(i * CELL_SIZE, 0);
    ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE);
    ctx.stroke();

    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(0, i * CELL_SIZE);
    ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE);
    ctx.stroke();
  }

  // Draw Particles
  particles.forEach((p, index) => {
    p.update();
    p.draw(ctx);
    if (p.alpha <= 0) {
      particles.splice(index, 1);
    }
  });

  // Draw Food with pulsing glow effect
  const time = performance.now() * 0.005;
  const foodPulse = Math.sin(time) * 2 + 1; // Pulse size
  const fx = food.x * CELL_SIZE + CELL_SIZE / 2;
  const fy = food.y * CELL_SIZE + CELL_SIZE / 2;
  const radius = (CELL_SIZE / 2 - 2) + foodPulse * 0.5;

  ctx.save();
  ctx.shadowBlur = 15;
  ctx.shadowColor = foodColor;
  ctx.fillStyle = foodColor;
  ctx.beginPath();
  ctx.arc(fx, fy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Draw Snake Segment by Segment
  snake.forEach((segment, index) => {
    const isHead = index === 0;
    const sx = segment.x * CELL_SIZE;
    const sy = segment.y * CELL_SIZE;
    const offset = 1;
    const size = CELL_SIZE - offset * 2;

    ctx.save();

    // Gradient along snake length
    const t = index / Math.max(1, snake.length - 1);
    // Dynamic color interpolation
    ctx.fillStyle = isHead ? headColor : interpolateColor(bodyStartColor, bodyEndColor, t);

    if (isHead) {
      // Glow on head
      ctx.shadowBlur = 12;
      ctx.shadowColor = headColor;

      // Rounded head depending on movement direction
      ctx.beginPath();
      const r = size / 2; // radius

      // Standard grid drawing but rounding head
      drawRoundedRect(ctx, sx + offset, sy + offset, size, size, 6);
      ctx.fill();

      // Simple eye drawing for character!
      ctx.fillStyle = '#050508';
      ctx.shadowBlur = 0;

      let eyeSize = 3;
      let eyeOffset = 4;
      if (direction.x !== 0) {
        // Horizontal eyes
        const eyeX = direction.x > 0 ? sx + size - eyeOffset : sx + eyeOffset;
        ctx.beginPath();
        ctx.arc(eyeX, sy + eyeOffset, eyeSize, 0, Math.PI * 2);
        ctx.arc(eyeX, sy + size - eyeOffset, eyeSize, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Vertical eyes
        const eyeY = direction.y > 0 ? sy + size - eyeOffset : sy + eyeOffset;
        ctx.beginPath();
        ctx.arc(sx + eyeOffset, eyeY, eyeSize, 0, Math.PI * 2);
        ctx.arc(sx + size - eyeOffset, eyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Body segment with slightly rounded corners
      ctx.beginPath();
      drawRoundedRect(ctx, sx + offset, sy + offset, size, size, 4);
      ctx.fill();
    }
    ctx.restore();
  });
}

// Utility: Interpolate colors
function interpolateColor(color1, color2, factor) {
  // Simple check for hex values
  if (color1.startsWith('#')) color1 = hexToRgb(color1);
  if (color2.startsWith('#')) color2 = hexToRgb(color2);

  // If rgb strings
  const r1 = getRgbComponents(color1);
  const r2 = getRgbComponents(color2);

  const r = Math.round(r1.r + factor * (r2.r - r1.r));
  const g = Math.round(r1.g + factor * (r2.g - r1.g));
  const b = Math.round(r1.b + factor * (r2.b - r1.b));

  return `rgb(${r}, ${g}, ${b})`;
}

function hexToRgb(hex) {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})` : 'rgb(0,0,0)';
}

function getRgbComponents(rgbStr) {
  const matches = rgbStr.match(/\d+/g);
  if (matches && matches.length >= 3) {
    return { r: parseInt(matches[0]), g: parseInt(matches[1]), b: parseInt(matches[2]) };
  }
  return { r: 0, g: 0, b: 0 };
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
}

// --- Dynamic physics calculations ---
function updateGame() {
  // Update direction
  direction = nextDirection;

  // Next head position
  const head = snake[0];
  const newHead = {
    x: head.x + direction.x,
    y: head.y + direction.y
  };

  // Border Collision Check
  if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
    gameOver();
    return;
  }

  // Self Collision Check
  for (const segment of snake) {
    if (newHead.x === segment.x && newHead.y === segment.y) {
      gameOver();
      return;
    }
  }

  // Insert new head
  snake.unshift(newHead);

  // Food Collision Check
  if (newHead.x === food.x && newHead.y === food.y) {
    score += 10;
    applesEaten += 1;
    scoreVal.textContent = formatScore(score);

    sound.playEat();

    // Spawn Particles
    const fx = food.x * CELL_SIZE + CELL_SIZE / 2;
    const fy = food.y * CELL_SIZE + CELL_SIZE / 2;
    const foodColor = getCSSVariableValue('--food-color') || '#ff007f';
    for (let i = 0; i < 15; i++) {
      particles.push(new Particle(fx, fy, foodColor));
    }

    // Achievements Checking
    checkAchievements();

    // Spawn new food
    startNewFood();

    // Increasing difficulty/speed dynamically as score grows (e.g., speed up slightly every 2 apples eaten)
    if (applesEaten % 2 === 0) {
      speed = Math.max(baseSpeed - Math.floor(applesEaten / 2) * 2, 45); // Limit min speed to 45ms
    }
  } else {
    // Regular move: remove tail
    snake.pop();
  }
}

// --- Main Loop Engine ---
function gameLoop(currentTime) {
  if (gameMode !== 'playing') {
    // If not actively playing but paused/game over, we still render particles and draw
    // to keep particle animation running cleanly!
    if (gameMode === 'paused' || gameMode === 'gameover') {
      drawGame();
      // Keep running particle renders
      if (particles.length > 0) {
        requestAnimationFrame(gameLoop);
      }
    }
    return;
  }

  requestAnimationFrame(gameLoop);

  // Handle precise game speed ticks
  const elapsed = currentTime - lastTickTime;
  if (elapsed >= speed) {
    // Save last frame tick time, adjusting for lag
    lastTickTime = currentTime - (elapsed % speed);
    updateGame();
  }

  // Always draw at 60 FPS for ultra smooth particle and pulse renders!
  drawGame();
}

// Initial draw to fill the canvas beautifully before the game starts
drawGame();
