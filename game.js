/**
 * 터보 드라이브 (Turbo Drive) - Vanilla JavaScript Game Engine
 * 100% Client-Side, No Build Tools, Pure HTML5 Canvas & Web Audio API
 */

(function () {
  'use strict';

  // --- Constants & Data ---
  const STORAGE_KEY = 'turbo_drive_save_v1';
  const LANE_COUNT = 4;
  const CAR_WIDTH = 46;
  const CAR_HEIGHT = 88;
  const UPGRADE_PRICES = [100, 200, 350, 500, 800];

  const VEHICLES = [
    {
      id: 'red_speeder',
      nameKo: '붉은 질주마 (Red Speeder)',
      price: 0,
      color: '#ef4444',
      secondaryColor: '#1e293b',
      accentColor: '#f59e0b',
      description: '균형 잡힌 기본 스포츠카. 뛰어난 조작감과 부드러운 핸들링을 자랑합니다.',
      speed: 190,
      acceleration: 24,
      handling: 28,
      armor: 2,
      style: 'sport',
    },
    {
      id: 'cyber_lightning',
      nameKo: '사이버 라이트닝 (Cyber Lightning)',
      price: 350,
      color: '#06b6d4',
      secondaryColor: '#0f172a',
      accentColor: '#ec4899',
      description: '최첨단 네온 슈퍼카. 압도적인 최고 속도와 강력한 니트로 효율을 제공합니다.',
      speed: 230,
      acceleration: 28,
      handling: 26,
      armor: 2,
      style: 'cyber',
    },
    {
      id: 'beast_suv',
      nameKo: '비스트 탱크 (Beast SUV)',
      price: 500,
      color: '#eab308',
      secondaryColor: '#334155',
      accentColor: '#10b981',
      description: '강화 강철 프레임 오프로더. 충돌 피해를 흡수하며 탁월한 내구성을 발휘합니다.',
      speed: 175,
      acceleration: 20,
      handling: 22,
      armor: 4,
      style: 'suv',
    },
    {
      id: 'formula_apex',
      nameKo: '포뮬러 에이펙스 (Formula Apex)',
      price: 800,
      color: '#8b5cf6',
      secondaryColor: '#020617',
      accentColor: '#10b981',
      description: '최정상급 레이스 머신. 전광석화 같은 가속도와 칼날 같은 코너링 핸들링.',
      speed: 250,
      acceleration: 36,
      handling: 38,
      armor: 1,
      style: 'formula',
    },
    {
      id: 'interceptor',
      nameKo: '고속 인터셉터 (Highway Interceptor)',
      price: 1200,
      color: '#1e293b',
      secondaryColor: '#f8fafc',
      accentColor: '#3b82f6',
      description: '고속도로 고성능 경찰차. 사이렌 경적과 폭발적인 순간 가속이 장점입니다.',
      speed: 240,
      acceleration: 32,
      handling: 30,
      armor: 3,
      style: 'police',
    },
  ];

  const COLOR_PALETTE = [
    '#ef4444', '#06b6d4', '#eab308', '#8b5cf6',
    '#10b981', '#ec4899', '#f8fafc', '#0f172a'
  ];

  const HIGHWAY_COLORS = {
    DAY: {
      skyTop: '#38bdf8',
      skyBottom: '#bae6fd',
      road: '#334155',
      shoulder: '#1e293b',
      grass: '#15803d',
      line: '#f8fafc',
      headlightVisible: false,
    },
    SUNSET: {
      skyTop: '#9333ea',
      skyBottom: '#f97316',
      road: '#334155',
      shoulder: '#1e293b',
      grass: '#3f6212',
      line: '#fed7aa',
      headlightVisible: true,
    },
    NIGHT: {
      skyTop: '#020617',
      skyBottom: '#1e1b4b',
      road: '#0f172a',
      shoulder: '#020617',
      grass: '#064e3b',
      line: '#cbd5e1',
      headlightVisible: true,
    },
  };

  const DEFAULT_SAVE = {
    coins: 150,
    selectedVehicleId: 'red_speeder',
    unlockedVehicles: ['red_speeder'],
    vehicleColors: {
      red_speeder: '#ef4444',
      cyber_lightning: '#06b6d4',
      beast_suv: '#eab308',
      formula_apex: '#8b5cf6',
      interceptor: '#1e293b',
    },
    upgrades: {
      red_speeder: { speedLevel: 0, accelLevel: 0, handlingLevel: 0, nitroLevel: 0, magnetLevel: 0 },
      cyber_lightning: { speedLevel: 0, accelLevel: 0, handlingLevel: 0, nitroLevel: 0, magnetLevel: 0 },
      beast_suv: { speedLevel: 0, accelLevel: 0, handlingLevel: 0, nitroLevel: 0, magnetLevel: 0 },
      formula_apex: { speedLevel: 0, accelLevel: 0, handlingLevel: 0, nitroLevel: 0, magnetLevel: 0 },
      interceptor: { speedLevel: 0, accelLevel: 0, handlingLevel: 0, nitroLevel: 0, magnetLevel: 0 },
    },
    highScores: {
      ENDLESS: 0,
      TIME_ATTACK: 0,
      POLICE_CHASE: 0,
    },
    stats: {
      totalDistance: 0,
      totalGames: 0,
      totalNearMisses: 0,
    },
    soundEnabled: true,
  };

  // --- Sound Synthesizer (Web Audio API) ---
  class SoundSystem {
    constructor() {
      this.ctx = null;
      this.engineOsc = null;
      this.engineGain = null;
      this.isEngineRunning = false;
      this.enabled = true;
    }

    initContext() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    }

    setEnabled(enabled) {
      this.enabled = enabled;
      if (!enabled && this.engineGain && this.ctx) {
        this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);
      }
    }

    startEngine() {
      if (!this.enabled) return;
      this.initContext();
      if (!this.ctx || this.isEngineRunning) return;

      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(55, this.ctx.currentTime);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.06, this.ctx.currentTime);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        this.engineOsc = osc;
        this.engineGain = gain;
        this.isEngineRunning = true;
      } catch (e) {}
    }

    updateEngine(speed, maxSpeed, isNitro) {
      if (!this.enabled || !this.ctx || !this.engineOsc || !this.engineGain) return;
      try {
        const ratio = Math.max(0, Math.min(1.5, speed / Math.max(1, maxSpeed)));
        const baseFreq = 50 + ratio * 140 + (isNitro ? 45 : 0);
        const volume = (0.04 + ratio * 0.08) * (this.enabled ? 1 : 0);
        const t = this.ctx.currentTime;
        this.engineOsc.frequency.setTargetAtTime(baseFreq, t, 0.05);
        this.engineGain.gain.setTargetAtTime(volume, t, 0.05);
      } catch (e) {}
    }

    stopEngine() {
      if (this.engineOsc) {
        try {
          this.engineOsc.stop();
          this.engineOsc.disconnect();
        } catch (e) {}
        this.engineOsc = null;
      }
      this.engineGain = null;
      this.isEngineRunning = false;
    }

    playCoin() {
      if (!this.enabled) return;
      this.initContext();
      if (!this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = this.ctx.currentTime;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, t);
        osc.frequency.exponentialRampToValueAtTime(1318.51, t + 0.12);
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.23);
      } catch (e) {}
    }

    playNearMiss(combo) {
      if (!this.enabled) return;
      this.initContext();
      if (!this.ctx) return;
      try {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const pitchMultiplier = 1 + Math.min(1, combo * 0.08);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25 * pitchMultiplier, t);
        osc.frequency.exponentialRampToValueAtTime(880 * pitchMultiplier, t + 0.15);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.26);
      } catch (e) {}
    }

    playNitroBoost() {
      if (!this.enabled) return;
      this.initContext();
      if (!this.ctx) return;
      try {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, t);
        osc.frequency.exponentialRampToValueAtTime(440, t + 0.3);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.36);
      } catch (e) {}
    }

    playCrash() {
      if (!this.enabled) return;
      this.initContext();
      if (!this.ctx) return;
      try {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(160, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.45);
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.52);
      } catch (e) {}
    }

    playPowerup() {
      if (!this.enabled) return;
      this.initContext();
      if (!this.ctx) return;
      try {
        const t = this.ctx.currentTime;
        const notes = [440, 554.37, 659.25, 880];
        notes.forEach((freq, idx) => {
          if (!this.ctx) return;
          const noteOsc = this.ctx.createOscillator();
          const noteGain = this.ctx.createGain();
          const startTime = t + idx * 0.06;
          noteOsc.type = 'sine';
          noteOsc.frequency.setValueAtTime(freq, startTime);
          noteGain.gain.setValueAtTime(0.12, startTime);
          noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);
          noteOsc.connect(noteGain);
          noteGain.connect(this.ctx.destination);
          noteOsc.start(startTime);
          noteOsc.stop(startTime + 0.16);
        });
      } catch (e) {}
    }

    playScreech() {
      if (!this.enabled) return;
      this.initContext();
      if (!this.ctx) return;
      try {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(750, t);
        osc.frequency.linearRampToValueAtTime(600, t + 0.2);
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.21);
      } catch (e) {}
    }

    playSiren() {
      if (!this.enabled) return;
      this.initContext();
      if (!this.ctx) return;
      try {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(700, t);
        osc.frequency.linearRampToValueAtTime(950, t + 0.25);
        osc.frequency.linearRampToValueAtTime(700, t + 0.5);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.51);
      } catch (e) {}
    }
  }

  const sound = new SoundSystem();

  // --- Storage Helper ---
  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return JSON.parse(JSON.stringify(DEFAULT_SAVE));
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SAVE,
        ...parsed,
        highScores: { ...DEFAULT_SAVE.highScores, ...(parsed.highScores || {}) },
        stats: { ...DEFAULT_SAVE.stats, ...(parsed.stats || {}) },
        upgrades: { ...DEFAULT_SAVE.upgrades, ...(parsed.upgrades || {}) },
        vehicleColors: { ...DEFAULT_SAVE.vehicleColors, ...(parsed.vehicleColors || {}) },
      };
    } catch (e) {
      return JSON.parse(JSON.stringify(DEFAULT_SAVE));
    }
  }

  function saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  function calculateVehicleStats(vehicleId, upgrades) {
    const base = VEHICLES.find((v) => v.id === vehicleId) || VEHICLES[0];
    const u = upgrades || { speedLevel: 0, accelLevel: 0, handlingLevel: 0, nitroLevel: 0, magnetLevel: 0 };
    return {
      topSpeed: Math.round(base.speed + (u.speedLevel || 0) * 12),
      acceleration: Math.round(base.acceleration + (u.accelLevel || 0) * 4),
      handling: Math.round(base.handling + (u.handlingLevel || 0) * 3),
      maxNitro: Math.round(100 + (u.nitroLevel || 0) * 15),
      magnetDuration: Math.round(10 + (u.magnetLevel || 0) * 2),
      armor: base.armor,
    };
  }

  // --- App State ---
  let appState = {
    save: loadData(),
    currentView: 'MENU', // 'MENU', 'PLAYING', 'PAUSED', 'GAMEOVER', 'GARAGE'
    mode: 'ENDLESS',
    theme: 'DAY',
    garageSelectedId: 'red_speeder',
  };

  sound.setEnabled(appState.save.soundEnabled);

  // --- Game Loop Variables ---
  let canvas, ctx;
  let animFrameId = null;
  let lastTime = 0;
  let isGameRunning = false;
  let isGamePaused = false;

  const inputState = {
    left: false,
    right: false,
    up: false,
    down: false,
    nitro: false,
    canvasPointerSteer: null,
  };

  let player = {
    x: 0,
    y: 0,
    width: CAR_WIDTH,
    height: CAR_HEIGHT,
    speed: 80,
    maxSpeed: 200,
    acceleration: 25,
    handling: 28,
    nitro: 50,
    maxNitro: 100,
    isNitroActive: false,
    health: 100,
    maxHealth: 100,
    shieldTimer: 0,
    magnetTimer: 0,
    turnDirection: 0,
    isBraking: false,
    invulnerableTimer: 0,
  };

  let stats = {
    score: 0,
    distance: 0,
    coinsCollected: 0,
    nearMisses: 0,
    maxSpeedReached: 0,
    combo: 0,
    comboTimer: 0,
    timeRemaining: 45,
    policeDistance: 65,
  };

  let traffic = [];
  let pickups = [];
  let particles = [];
  let roadOffset = 0;
  let nextSpawnDistance = 100;
  let nextPickupDistance = 250;
  let screenShake = 0;
  let isDead = false;
  let checkpointDistance = 1500;
  let lastHUDUpdate = 0;

  // --- UI Elements ---
  const views = {
    menu: document.getElementById('menu-view'),
    game: document.getElementById('game-view'),
    garage: document.getElementById('garage-modal'),
    pause: document.getElementById('pause-modal'),
    gameover: document.getElementById('gameover-modal'),
  };

  function showView(viewName) {
    appState.currentView = viewName;
    views.menu.classList.toggle('hidden', viewName !== 'MENU');
    views.game.classList.toggle('hidden', !['PLAYING', 'PAUSED', 'GAMEOVER'].includes(viewName));
    views.garage.classList.toggle('hidden', viewName !== 'GARAGE');
    views.pause.classList.toggle('hidden', viewName !== 'PAUSED');
    views.gameover.classList.toggle('hidden', viewName !== 'GAMEOVER');

    if (viewName === 'MENU') {
      renderMenu();
    } else if (viewName === 'GARAGE') {
      renderGarage();
    }
  }

  // --- Particles & Text helper ---
  function spawnTextParticle(x, y, text, color) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 1.5,
      vy: -2.5,
      size: 16,
      color,
      alpha: 1.0,
      life: 0,
      maxLife: 45,
      type: 'text',
      text,
    });
  }

  function spawnSparks(x, y, count = 8, color = '#f59e0b') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        color,
        alpha: 1,
        life: 0,
        maxLife: 20 + Math.random() * 15,
        type: 'spark',
      });
    }
  }

  // --- Main Game Engine ---
  function initGame() {
    canvas = document.getElementById('game-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const roadWidth = Math.min(rect.width * 0.88, 480);
    const roadX = (rect.width - roadWidth) / 2;
    const laneWidth = roadWidth / LANE_COUNT;

    const tuned = calculateVehicleStats(
      appState.save.selectedVehicleId,
      appState.save.upgrades[appState.save.selectedVehicleId]
    );

    player.x = roadX + laneWidth * 1.5 - CAR_WIDTH / 2;
    player.y = rect.height - CAR_HEIGHT - 60;
    player.speed = 80;
    player.health = 100;
    player.maxSpeed = tuned.topSpeed;
    player.acceleration = tuned.acceleration;
    player.handling = tuned.handling;
    player.nitro = 50;
    player.maxNitro = tuned.maxNitro;
    player.isNitroActive = false;
    player.shieldTimer = 0;
    player.magnetTimer = 0;
    player.turnDirection = 0;
    player.isBraking = false;
    player.invulnerableTimer = 0;

    stats = {
      score: 0,
      distance: 0,
      coinsCollected: 0,
      nearMisses: 0,
      maxSpeedReached: 80,
      combo: 0,
      comboTimer: 0,
      timeRemaining: appState.mode === 'TIME_ATTACK' ? 45 : 0,
      policeDistance: appState.mode === 'POLICE_CHASE' ? 65 : 100,
    };

    traffic = [];
    pickups = [];
    particles = [];
    roadOffset = 0;
    nextSpawnDistance = 100;
    nextPickupDistance = 250;
    screenShake = 0;
    isDead = false;
    checkpointDistance = 1500;
    isGameRunning = true;
    isGamePaused = false;

    sound.startEngine();
    lastTime = performance.now();
    lastHUDUpdate = performance.now();

    if (animFrameId) cancelAnimationFrame(animFrameId);
    animFrameId = requestAnimationFrame(gameLoop);
  }

  function gameLoop(currentTime) {
    if (!isGameRunning) return;

    const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
    lastTime = currentTime;

    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const roadWidth = Math.min(rect.width * 0.88, 480);
    const roadX = (rect.width - roadWidth) / 2;
    const laneWidth = roadWidth / LANE_COUNT;

    if (!isGamePaused && !isDead) {
      // 1. Process Inputs
      const isLeft = inputState.left || inputState.canvasPointerSteer === -1;
      const isRight = inputState.right || inputState.canvasPointerSteer === 1;
      const isUp = inputState.up;
      const isDown = inputState.down;
      const isNitroRequested = inputState.nitro;

      // Nitro
      if (isNitroRequested && player.nitro > 10) {
        if (!player.isNitroActive) sound.playNitroBoost();
        player.isNitroActive = true;
        player.nitro = Math.max(0, player.nitro - 35 * dt);
        screenShake = Math.max(screenShake, 2.5);
      } else {
        player.isNitroActive = false;
        player.nitro = Math.min(player.maxNitro, player.nitro + 3 * dt);
      }

      // Speeds
      const baseTopSpeed = player.maxSpeed;
      const effectiveTopSpeed = player.isNitroActive ? baseTopSpeed + 45 : baseTopSpeed;

      if (isUp) {
        player.speed += player.acceleration * 2.2 * dt;
        player.isBraking = false;
      } else if (isDown) {
        player.speed -= player.acceleration * 3.5 * dt;
        player.isBraking = true;
        if (player.speed > 100) sound.playScreech();
      } else {
        player.isBraking = false;
        if (player.speed < 120) player.speed += 15 * dt;
        else if (player.speed > effectiveTopSpeed) player.speed -= 30 * dt;
      }

      player.speed = Math.max(40, Math.min(effectiveTopSpeed, player.speed));
      if (player.speed > stats.maxSpeedReached) {
        stats.maxSpeedReached = Math.round(player.speed);
      }

      // Lateral Steering
      let turnDir = 0;
      const lateralSpeed = Math.max(360, (player.handling || 28) * 15);
      if (isLeft) {
        turnDir = -1;
        player.x -= lateralSpeed * dt;
      }
      if (isRight) {
        turnDir = 1;
        player.x += lateralSpeed * dt;
      }
      player.turnDirection = turnDir;

      // Road boundary
      const minX = roadX + 4;
      const maxX = roadX + roadWidth - CAR_WIDTH - 4;
      if (player.x < minX) {
        player.x = minX;
        player.speed *= 0.96;
        spawnSparks(player.x, player.y + CAR_HEIGHT / 2, 2, '#94a3b8');
      } else if (player.x > maxX) {
        player.x = maxX;
        player.speed *= 0.96;
        spawnSparks(player.x + CAR_WIDTH, player.y + CAR_HEIGHT / 2, 2, '#94a3b8');
      }

      if (player.shieldTimer > 0) player.shieldTimer -= dt;
      if (player.magnetTimer > 0) player.magnetTimer -= dt;
      if (player.invulnerableTimer > 0) player.invulnerableTimer -= dt;

      if (stats.comboTimer > 0) {
        stats.comboTimer -= dt;
        if (stats.comboTimer <= 0) stats.combo = 0;
      }

      const distanceDelta = (player.speed * 1000 / 3600) * dt;
      stats.distance += distanceDelta;
      stats.score += Math.round(distanceDelta * (1 + (stats.combo > 0 ? stats.combo * 0.25 : 0)));

      // Time Attack Mode
      if (appState.mode === 'TIME_ATTACK') {
        stats.timeRemaining -= dt;
        if (stats.distance >= checkpointDistance) {
          stats.timeRemaining += 12;
          checkpointDistance += 1500;
          spawnTextParticle(width / 2, height / 2 - 80, '체크포인트 +12초!', '#10b981');
          sound.playPowerup();
        }
        if (stats.timeRemaining <= 0) {
          stats.timeRemaining = 0;
          triggerGameOver();
        }
      }

      // Police Chase Mode
      if (appState.mode === 'POLICE_CHASE') {
        const speedDiff = player.speed - 160;
        stats.policeDistance += (speedDiff * 0.04) * dt;
        stats.policeDistance = Math.max(0, Math.min(100, stats.policeDistance));
        if (stats.policeDistance <= 5) sound.playSiren();
        if (stats.policeDistance <= 0) {
          spawnTextParticle(width / 2, height / 2 - 80, '경찰에 체포되었습니다!', '#ef4444');
          triggerGameOver();
        }
      }

      sound.updateEngine(player.speed, player.maxSpeed, player.isNitroActive);
      roadOffset = (roadOffset + player.speed * 8 * dt) % 80;

      // 2. Spawn Traffic
      nextSpawnDistance -= distanceDelta;
      if (nextSpawnDistance <= 0) {
        const spawnInterval = Math.max(60, 140 - (player.speed / 280) * 50);
        nextSpawnDistance = spawnInterval + Math.random() * 40;
        const randomLane = Math.floor(Math.random() * LANE_COUNT);
        const laneX = roadX + randomLane * laneWidth + (laneWidth - CAR_WIDTH) / 2;

        const tooClose = traffic.some((c) => Math.abs(c.y - -CAR_HEIGHT * 2) < 180 && c.lane === randomLane);
        if (!tooClose) {
          const types = ['sedan', 'taxi', 'truck', 'sports'];
          if (appState.mode === 'POLICE_CHASE' && Math.random() < 0.4) types.push('police');
          const chosen = types[Math.floor(Math.random() * types.length)];
          let spd = 65 + Math.random() * 30;
          let h = CAR_HEIGHT;
          let col = '#3b82f6';

          if (chosen === 'truck') {
            spd = 50 + Math.random() * 20;
            h = CAR_HEIGHT * 1.5;
            col = '#e2e8f0';
          } else if (chosen === 'taxi') {
            spd = 75 + Math.random() * 25;
            col = '#facc15';
          } else if (chosen === 'sports') {
            spd = 95 + Math.random() * 35;
            col = '#ec4899';
          } else if (chosen === 'police') {
            spd = 110 + Math.random() * 30;
            col = '#1e293b';
          }

          traffic.push({
            id: Date.now() + Math.random(),
            x: laneX,
            y: -h - 40,
            targetX: laneX,
            lane: randomLane,
            targetLane: randomLane,
            width: CAR_WIDTH,
            height: h,
            speed: spd,
            color: col,
            type: chosen,
            isChangingLane: false,
            laneChangeTimer: 2 + Math.random() * 4,
            laneBlinker: 'none',
            nearMissAwarded: false,
            sirenActive: chosen === 'police',
          });
        }
      }

      // 3. Spawn Pickups
      nextPickupDistance -= distanceDelta;
      if (nextPickupDistance <= 0) {
        nextPickupDistance = 140 + Math.random() * 180;
        const randomLane = Math.floor(Math.random() * LANE_COUNT);
        const px = roadX + randomLane * laneWidth + laneWidth / 2 - 16;
        const roll = Math.random();
        let pType = 'coin';
        if (roll < 0.6) pType = 'coin';
        else if (roll < 0.75) pType = 'nitro';
        else if (roll < 0.85) pType = 'repair';
        else if (roll < 0.93) pType = 'magnet';
        else pType = 'shield';

        pickups.push({
          id: Date.now() + Math.random(),
          x: px,
          y: -60,
          width: 32,
          height: 32,
          type: pType,
          collected: false,
          pulseTimer: 0,
        });
      }

      // 4. Update Traffic Cars & Collisions
      for (let i = traffic.length - 1; i >= 0; i--) {
        const car = traffic[i];
        const relativeSpeedKmh = player.speed - car.speed;
        const relativeSpeedPixels = (relativeSpeedKmh * 1000 / 3600) * 5.2 * dt;
        car.y += relativeSpeedPixels;

        car.laneChangeTimer -= dt;
        if (car.laneChangeTimer <= 0 && !car.isChangingLane && Math.random() < 0.3) {
          const possibleLanes = [];
          if (car.lane > 0) possibleLanes.push(car.lane - 1);
          if (car.lane < LANE_COUNT - 1) possibleLanes.push(car.lane + 1);

          if (possibleLanes.length > 0) {
            const newLane = possibleLanes[Math.floor(Math.random() * possibleLanes.length)];
            car.targetLane = newLane;
            car.targetX = roadX + newLane * laneWidth + (laneWidth - CAR_WIDTH) / 2;
            car.isChangingLane = true;
            car.laneBlinker = newLane > car.lane ? 'right' : 'left';
          }
        }

        if (car.isChangingLane) {
          const dx = car.targetX - car.x;
          if (Math.abs(dx) > 1.5) {
            car.x += Math.sign(dx) * 75 * dt;
          } else {
            car.x = car.targetX;
            car.lane = car.targetLane;
            car.isChangingLane = false;
            car.laneBlinker = 'none';
            car.laneChangeTimer = 4 + Math.random() * 5;
          }
        }

        const hitX = Math.abs(player.x + CAR_WIDTH / 2 - (car.x + car.width / 2));
        const hitY = Math.abs(player.y + CAR_HEIGHT / 2 - (car.y + car.height / 2));
        const collisionX = hitX < (CAR_WIDTH + car.width) * 0.44;
        const collisionY = hitY < (CAR_HEIGHT + car.height) * 0.44;

        if (collisionX && collisionY && player.invulnerableTimer <= 0) {
          if (player.shieldTimer > 0) {
            player.shieldTimer = 0;
            player.invulnerableTimer = 1.0;
            screenShake = 6;
            sound.playCrash();
            spawnSparks(car.x + car.width / 2, car.y + car.height / 2, 20, '#38bdf8');
            spawnTextParticle(player.x, player.y - 20, '보호막 방어!', '#38bdf8');
            car.y -= 120;
            car.speed = 40;
          } else {
            const impactSpeed = Math.abs(relativeSpeedKmh);
            const armorReduction = (player.handling || 1) * 0.05;
            const damage = Math.round(Math.max(20, (impactSpeed * 0.45) * (1 - armorReduction)));

            player.health -= damage;
            player.invulnerableTimer = 1.2;
            screenShake = 8;
            sound.playCrash();
            spawnSparks(player.x + CAR_WIDTH / 2, player.y + 20, 16, '#ef4444');
            stats.combo = 0;
            player.speed *= 0.65;

            if (player.x < car.x) {
              player.x -= 20;
              car.x += 15;
            } else {
              player.x += 20;
              car.x -= 15;
            }

            if (player.health <= 0) {
              player.health = 0;
              spawnSparks(player.x + CAR_WIDTH / 2, player.y + CAR_HEIGHT / 2, 35, '#ef4444');
              spawnTextParticle(player.x, player.y - 30, 'CRASH!', '#ef4444');
              triggerGameOver();
              break;
            } else {
              spawnTextParticle(player.x, player.y - 25, `-${damage} HP`, '#f87171');
            }
          }
        }

        // Near Miss
        const isPassingY = Math.abs(player.y - car.y) < CAR_HEIGHT * 0.8;
        const isNearX = hitX >= (CAR_WIDTH + car.width) * 0.44 && hitX <= (CAR_WIDTH + car.width) * 0.72;

        if (isPassingY && isNearX && !car.nearMissAwarded && player.speed > 115) {
          car.nearMissAwarded = true;
          stats.nearMisses += 1;
          stats.combo += 1;
          stats.comboTimer = 3.5;
          const bonusScore = 150 * stats.combo;
          stats.score += bonusScore;
          player.nitro = Math.min(player.maxNitro, player.nitro + 18);
          sound.playNearMiss(stats.combo);
          spawnTextParticle(
            player.x + (player.x < car.x ? CAR_WIDTH : -40),
            player.y + 10,
            `아슬아슬 추월! x${stats.combo}`,
            '#fbbf24'
          );
        }

        if (car.y > height + 200 || car.y < -300) {
          traffic.splice(i, 1);
        }
      }

      // 5. Update Pickups
      const magnetActive = player.magnetTimer > 0;
      for (let i = pickups.length - 1; i >= 0; i--) {
        const item = pickups[i];
        const relativeSpeedPixels = (player.speed * 1000 / 3600) * 5.2 * dt;
        item.y += relativeSpeedPixels;
        item.pulseTimer += dt * 4;

        if (magnetActive) {
          const dx = player.x + CAR_WIDTH / 2 - (item.x + item.width / 2);
          const dy = player.y + CAR_HEIGHT / 2 - (item.y + item.height / 2);
          const dist = Math.hypot(dx, dy);
          if (dist < 260) {
            item.x += (dx / dist) * 220 * dt;
            item.y += (dy / dist) * 220 * dt;
          }
        }

        const distToPlayer = Math.hypot(
          player.x + CAR_WIDTH / 2 - (item.x + item.width / 2),
          player.y + CAR_HEIGHT / 2 - (item.y + item.height / 2)
        );

        if (distToPlayer < 40 && !item.collected) {
          item.collected = true;
          if (item.type === 'coin') {
            stats.coinsCollected += 1;
            stats.score += 50;
            sound.playCoin();
            spawnTextParticle(item.x, item.y, '+1 코인', '#fbbf24');
            spawnSparks(item.x + 16, item.y + 16, 6, '#fbbf24');
          } else if (item.type === 'nitro') {
            player.nitro = player.maxNitro;
            sound.playPowerup();
            spawnTextParticle(item.x, item.y, '니트로 가득!', '#06b6d4');
          } else if (item.type === 'repair') {
            player.health = Math.min(player.maxHealth, player.health + 35);
            sound.playPowerup();
            spawnTextParticle(item.x, item.y, '+35% 수리 완료', '#10b981');
          } else if (item.type === 'shield') {
            player.shieldTimer = 10;
            sound.playPowerup();
            spawnTextParticle(item.x, item.y, '보호막 활성화 (10초)', '#38bdf8');
          } else if (item.type === 'magnet') {
            const tuned = calculateVehicleStats(
              appState.save.selectedVehicleId,
              appState.save.upgrades[appState.save.selectedVehicleId]
            );
            player.magnetTimer = tuned.magnetDuration;
            sound.playPowerup();
            spawnTextParticle(item.x, item.y, `자석 가동 (${tuned.magnetDuration}초)`, '#a855f7');
          }
          pickups.splice(i, 1);
          continue;
        }

        if (item.y > height + 80) pickups.splice(i, 1);
      }

      // 6. Particles
      if (player.speed > 50) {
        const isBoosting = player.isNitroActive;
        particles.push({
          x: player.x + CAR_WIDTH * 0.35 + (Math.random() - 0.5) * 4,
          y: player.y + CAR_HEIGHT,
          vx: (Math.random() - 0.5) * 1.5,
          vy: 3 + (player.speed / 40),
          size: isBoosting ? 6 + Math.random() * 4 : 3 + Math.random() * 3,
          color: isBoosting ? '#06b6d4' : '#64748b',
          alpha: isBoosting ? 0.9 : 0.4,
          life: 0,
          maxLife: isBoosting ? 16 : 22,
          type: isBoosting ? 'fire' : 'smoke',
        });
        particles.push({
          x: player.x + CAR_WIDTH * 0.65 + (Math.random() - 0.5) * 4,
          y: player.y + CAR_HEIGHT,
          vx: (Math.random() - 0.5) * 1.5,
          vy: 3 + (player.speed / 40),
          size: isBoosting ? 6 + Math.random() * 4 : 3 + Math.random() * 3,
          color: isBoosting ? '#38bdf8' : '#64748b',
          alpha: isBoosting ? 0.9 : 0.4,
          life: 0,
          maxLife: isBoosting ? 16 : 22,
          type: isBoosting ? 'fire' : 'smoke',
        });
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life += 1;
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);
        if (p.life >= p.maxLife) particles.splice(i, 1);
      }

      if (screenShake > 0) screenShake = Math.max(0, screenShake - dt * 10);

      // Throttled HUD update
      if (currentTime - lastHUDUpdate > 50) {
        lastHUDUpdate = currentTime;
        updateHUD();
      }
    }

    // --- 7. Canvas Rendering ---
    ctx.save();
    if (screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * screenShake * 4;
      const shakeY = (Math.random() - 0.5) * screenShake * 4;
      ctx.translate(shakeX, shakeY);
    }

    const colors = HIGHWAY_COLORS[appState.theme];

    // Background Sky & Grass
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, colors.skyTop);
    skyGrad.addColorStop(0.35, colors.skyBottom);
    skyGrad.addColorStop(1, colors.grass);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Road
    ctx.fillStyle = colors.road;
    ctx.fillRect(roadX, 0, roadWidth, height);

    // Shoulder & Guards
    ctx.fillStyle = colors.shoulder;
    ctx.fillRect(roadX - 14, 0, 14, height);
    ctx.fillRect(roadX + roadWidth, 0, 14, height);

    ctx.fillStyle = appState.theme === 'NIGHT' ? '#f59e0b' : '#cbd5e1';
    const stripeOffset = (roadOffset * 1.5) % 40;
    for (let y = -40 + stripeOffset; y < height; y += 40) {
      ctx.fillRect(roadX - 10, y, 6, 18);
      ctx.fillRect(roadX + roadWidth + 4, y, 6, 18);
    }

    // Outer Solid Lines
    ctx.strokeStyle = colors.line;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(roadX, 0);
    ctx.lineTo(roadX, height);
    ctx.moveTo(roadX + roadWidth, 0);
    ctx.lineTo(roadX + roadWidth, height);
    ctx.stroke();

    // Dashed Divider Lines
    ctx.strokeStyle = colors.line;
    ctx.lineWidth = 3;
    ctx.setLineDash([30, 30]);
    ctx.lineDashOffset = -roadOffset;
    for (let i = 1; i < LANE_COUNT; i++) {
      const lx = roadX + i * laneWidth;
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx, height);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Headlight cones (Night/Sunset)
    if (colors.headlightVisible) {
      const lightGrad = ctx.createRadialGradient(
        player.x + CAR_WIDTH / 2, player.y - 30, 20,
        player.x + CAR_WIDTH / 2, player.y - 180, 220
      );
      lightGrad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
      lightGrad.addColorStop(0.6, 'rgba(254, 240, 138, 0.15)');
      lightGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = lightGrad;
      ctx.beginPath();
      ctx.moveTo(player.x - 20, player.y - 20);
      ctx.lineTo(player.x + CAR_WIDTH + 20, player.y - 20);
      ctx.lineTo(player.x + CAR_WIDTH + 80, player.y - 240);
      ctx.lineTo(player.x - 80, player.y - 240);
      ctx.closePath();
      ctx.fill();
    }

    // Draw Pickups
    pickups.forEach((item) => {
      ctx.save();
      ctx.translate(item.x + item.width / 2, item.y + item.height / 2);
      ctx.shadowBlur = 10;

      if (item.type === 'coin') {
        ctx.shadowColor = '#eab308';
        ctx.scale(Math.cos(item.pulseTimer), 1);
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(0, 0, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#b45309';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', 0, 1);
      } else if (item.type === 'nitro') {
        ctx.shadowColor = '#06b6d4';
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(-10, -14, 20, 28);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(-7, -11, 14, 22);
        ctx.fillStyle = '#f8fafc';
        ctx.font = '900 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('NOS', 0, 0);
      } else if (item.type === 'repair') {
        ctx.shadowColor = '#10b981';
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.roundRect(-12, -12, 24, 24, 6);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-3, -8, 6, 16);
        ctx.fillRect(-8, -3, 16, 6);
      } else if (item.type === 'shield') {
        ctx.shadowColor = '#38bdf8';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 13, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🛡️', 0, 0);
      } else if (item.type === 'magnet') {
        ctx.shadowColor = '#a855f7';
        ctx.fillStyle = '#9333ea';
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🧲', 0, 0);
      }
      ctx.restore();
    });

    // Draw Traffic Cars
    traffic.forEach((car) => {
      ctx.save();
      ctx.translate(car.x, car.y);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.roundRect(4, 6, car.width - 8, car.height, 8);
      ctx.fill();

      ctx.fillStyle = car.color;
      ctx.beginPath();
      ctx.roundRect(2, 0, car.width - 4, car.height, 8);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      const cabinY = car.type === 'truck' ? 10 : car.height * 0.28;
      const cabinHeight = car.type === 'truck' ? car.height * 0.75 : car.height * 0.44;
      ctx.beginPath();
      ctx.roundRect(6, cabinY, car.width - 12, cabinHeight, 4);
      ctx.fill();

      ctx.fillStyle = '#67e8f9';
      ctx.fillRect(8, cabinY + 2, car.width - 16, 6);
      ctx.fillRect(8, cabinY + cabinHeight - 8, car.width - 16, 6);

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 10, 3, 14);
      ctx.fillRect(car.width - 3, 10, 3, 14);
      ctx.fillRect(0, car.height - 24, 3, 14);
      ctx.fillRect(car.width - 3, car.height - 24, 3, 14);

      ctx.fillStyle = '#ef4444';
      ctx.fillRect(4, car.height - 4, 8, 3);
      ctx.fillRect(car.width - 12, car.height - 4, 8, 3);

      ctx.fillStyle = '#fef08a';
      ctx.fillRect(4, 1, 8, 3);
      ctx.fillRect(car.width - 12, 1, 8, 3);

      if (car.isChangingLane && Math.floor(Date.now() / 150) % 2 === 0) {
        ctx.fillStyle = '#f59e0b';
        if (car.laneBlinker === 'left') {
          ctx.fillRect(0, 1, 4, 4);
          ctx.fillRect(0, car.height - 5, 4, 4);
        } else if (car.laneBlinker === 'right') {
          ctx.fillRect(car.width - 4, 1, 4, 4);
          ctx.fillRect(car.width - 4, car.height - 5, 4, 4);
        }
      }

      if (car.sirenActive) {
        const isRed = Math.floor(Date.now() / 120) % 2 === 0;
        ctx.fillStyle = isRed ? '#ef4444' : '#3b82f6';
        ctx.fillRect(car.width / 2 - 8, car.height * 0.42, 16, 6);
      }
      ctx.restore();
    });

    // Draw Player Car
    const currentVeh = VEHICLES.find((v) => v.id === appState.save.selectedVehicleId) || VEHICLES[0];
    const vehColor = appState.save.vehicleColors[currentVeh.id] || currentVeh.color;

    ctx.save();
    ctx.translate(player.x, player.y);

    const tiltAngle = (player.turnDirection * Math.PI) / 36;
    ctx.translate(CAR_WIDTH / 2, CAR_HEIGHT / 2);
    ctx.rotate(tiltAngle);
    ctx.translate(-CAR_WIDTH / 2, -CAR_HEIGHT / 2);

    if (player.invulnerableTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.roundRect(3, 8, CAR_WIDTH - 6, CAR_HEIGHT, 10);
    ctx.fill();

    if (currentVeh.style === 'formula') {
      ctx.fillStyle = vehColor;
      ctx.beginPath();
      ctx.moveTo(CAR_WIDTH / 2, 0);
      ctx.lineTo(CAR_WIDTH - 6, 26);
      ctx.lineTo(CAR_WIDTH - 8, CAR_HEIGHT - 12);
      ctx.lineTo(8, CAR_HEIGHT - 12);
      ctx.lineTo(6, 26);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = currentVeh.secondaryColor;
      ctx.fillRect(2, 6, CAR_WIDTH - 4, 6);
      ctx.fillRect(0, CAR_HEIGHT - 8, CAR_WIDTH, 8);

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-4, 14, 8, 18);
      ctx.fillRect(CAR_WIDTH - 4, 14, 8, 18);
      ctx.fillRect(-6, CAR_HEIGHT - 26, 10, 22);
      ctx.fillRect(CAR_WIDTH - 4, CAR_HEIGHT - 26, 10, 22);

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(CAR_WIDTH / 2, CAR_HEIGHT * 0.45, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (currentVeh.style === 'suv') {
      ctx.fillStyle = vehColor;
      ctx.beginPath();
      ctx.roundRect(1, 0, CAR_WIDTH - 2, CAR_HEIGHT, 6);
      ctx.fill();

      ctx.fillStyle = currentVeh.secondaryColor;
      ctx.fillRect(6, 20, CAR_WIDTH - 12, CAR_HEIGHT - 40);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.strokeRect(6, 20, CAR_WIDTH - 12, CAR_HEIGHT - 40);

      ctx.fillStyle = '#090d16';
      ctx.fillRect(-2, 10, 5, 20);
      ctx.fillRect(CAR_WIDTH - 3, 10, 5, 20);
      ctx.fillRect(-2, CAR_HEIGHT - 30, 5, 20);
      ctx.fillRect(CAR_WIDTH - 3, CAR_HEIGHT - 30, 5, 20);
    } else {
      ctx.fillStyle = vehColor;
      ctx.beginPath();
      ctx.moveTo(CAR_WIDTH * 0.2, 0);
      ctx.lineTo(CAR_WIDTH * 0.8, 0);
      ctx.quadraticCurveTo(CAR_WIDTH, 12, CAR_WIDTH - 2, 28);
      ctx.lineTo(CAR_WIDTH, CAR_HEIGHT - 12);
      ctx.quadraticCurveTo(CAR_WIDTH, CAR_HEIGHT, CAR_WIDTH - 6, CAR_HEIGHT);
      ctx.lineTo(6, CAR_HEIGHT);
      ctx.quadraticCurveTo(0, CAR_HEIGHT, 0, CAR_HEIGHT - 12);
      ctx.lineTo(2, 28);
      ctx.quadraticCurveTo(0, 12, CAR_WIDTH * 0.2, 0);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = currentVeh.secondaryColor;
      ctx.fillRect(CAR_WIDTH / 2 - 3, 2, 6, CAR_HEIGHT - 6);

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(6, CAR_HEIGHT * 0.24, CAR_WIDTH - 12, CAR_HEIGHT * 0.44, 4);
      ctx.fill();

      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(8, CAR_HEIGHT * 0.25, CAR_WIDTH - 16, 7);
      ctx.fillRect(8, CAR_HEIGHT * 0.62, CAR_WIDTH - 16, 6);

      ctx.fillStyle = currentVeh.secondaryColor;
      ctx.fillRect(2, CAR_HEIGHT - 6, CAR_WIDTH - 4, 5);

      ctx.fillStyle = '#020617';
      ctx.fillRect(-2, 12, 4, 16);
      ctx.fillRect(CAR_WIDTH - 2, 12, 4, 16);
      ctx.fillRect(-2, CAR_HEIGHT - 28, 4, 18);
      ctx.fillRect(CAR_WIDTH - 2, CAR_HEIGHT - 28, 4, 18);
    }

    ctx.fillStyle = '#fef08a';
    ctx.fillRect(4, 0, 7, 3);
    ctx.fillRect(CAR_WIDTH - 11, 0, 7, 3);

    const brakeGlow = player.isBraking;
    ctx.fillStyle = brakeGlow ? '#ff0000' : '#b91c1c';
    ctx.shadowColor = brakeGlow ? '#ff0000' : 'transparent';
    ctx.shadowBlur = brakeGlow ? 15 : 0;
    ctx.fillRect(4, CAR_HEIGHT - 2, 9, 3);
    ctx.fillRect(CAR_WIDTH - 13, CAR_HEIGHT - 2, 9, 3);
    ctx.shadowBlur = 0;

    if (player.shieldTimer > 0) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.ellipse(CAR_WIDTH / 2, CAR_HEIGHT / 2, CAR_WIDTH * 0.85, CAR_HEIGHT * 0.68, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    if (player.magnetTimer > 0) {
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const pulse = (Date.now() / 150) % 10;
      ctx.arc(CAR_WIDTH / 2, CAR_HEIGHT / 2, CAR_WIDTH + pulse, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // Particles
    particles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      if (p.type === 'text') {
        ctx.fillStyle = p.color;
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.fillText(p.text || '', p.x, p.y);
      } else if (p.type === 'fire') {
        ctx.fillStyle = p.color;
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    // Speed lines
    if (player.isNitroActive || player.speed > 220) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;
      const lineCount = player.isNitroActive ? 8 : 4;
      for (let i = 0; i < lineCount; i++) {
        const rx = roadX + Math.random() * roadWidth;
        const ry = Math.random() * height;
        const len = 40 + Math.random() * 80;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx, ry + len);
        ctx.stroke();
      }
    }

    ctx.restore();

    animFrameId = requestAnimationFrame(gameLoop);
  }

  function triggerGameOver() {
    isDead = true;
    sound.stopEngine();
    sound.playCrash();

    const previousHigh = appState.save.highScores[appState.mode] || 0;
    const isRecord = stats.score > previousHigh;

    appState.save.coins += stats.coinsCollected;
    appState.save.highScores[appState.mode] = Math.max(previousHigh, stats.score);
    appState.save.stats.totalDistance = (appState.save.stats.totalDistance || 0) + stats.distance;
    appState.save.stats.totalGames = (appState.save.stats.totalGames || 0) + 1;
    appState.save.stats.totalNearMisses = (appState.save.stats.totalNearMisses || 0) + stats.nearMisses;
    saveData(appState.save);

    showGameOverModal(isRecord);
  }

  // --- HUD Updates ---
  function updateHUD() {
    document.getElementById('hud-score').textContent = stats.score.toLocaleString();
    document.getElementById('hud-distance').textContent = `${(stats.distance / 1000).toFixed(2)} km`;
    document.getElementById('hud-coins').textContent = stats.coinsCollected;
    document.getElementById('hud-speed').textContent = Math.round(player.speed);

    const nitroPct = Math.min(100, Math.round((player.nitro / player.maxNitro) * 100));
    const healthPct = Math.max(0, Math.min(100, Math.round(player.health)));

    document.getElementById('hud-health-pct').textContent = `${healthPct}%`;
    document.getElementById('hud-health-bar').style.width = `${healthPct}%`;
    document.getElementById('hud-nitro-pct').textContent = `${nitroPct}%`;
    document.getElementById('hud-nitro-bar').style.width = `${nitroPct}%`;

    const boostBtn = document.getElementById('btn-touch-boost');
    if (boostBtn) {
      if (player.nitro > 10) {
        boostBtn.removeAttribute('disabled');
        boostBtn.className = 'w-20 h-16 rounded-2xl flex flex-col items-center justify-center shadow-xl active:scale-95 transition-all border bg-gradient-to-t from-cyan-600 to-sky-400 border-cyan-300 text-white shadow-cyan-500/25';
      } else {
        boostBtn.setAttribute('disabled', 'true');
        boostBtn.className = 'w-20 h-16 rounded-2xl flex flex-col items-center justify-center shadow-xl transition-all border bg-slate-900/60 border-slate-800 text-slate-600 cursor-not-allowed';
      }
    }

    // Combo banner
    const comboEl = document.getElementById('hud-combo-banner');
    if (stats.combo > 1) {
      comboEl.classList.remove('hidden');
      document.getElementById('hud-combo-count').textContent = `x${stats.combo}`;
    } else {
      comboEl.classList.add('hidden');
    }

    // Time Attack Indicator
    const timeBox = document.getElementById('hud-time-box');
    if (appState.mode === 'TIME_ATTACK') {
      timeBox.classList.remove('hidden');
      const timeVal = Math.max(0, stats.timeRemaining).toFixed(1);
      document.getElementById('hud-time-val').textContent = `${timeVal}s`;
      timeBox.classList.toggle('bg-rose-950/80', stats.timeRemaining <= 10);
      timeBox.classList.toggle('border-rose-500', stats.timeRemaining <= 10);
    } else {
      timeBox.classList.add('hidden');
    }

    // Police Chase Indicator
    const policeBox = document.getElementById('hud-police-box');
    if (appState.mode === 'POLICE_CHASE') {
      policeBox.classList.remove('hidden');
      const distVal = Math.round(stats.policeDistance);
      document.getElementById('hud-police-val').textContent = `${distVal}%`;
      document.getElementById('hud-police-bar').style.width = `${distVal}%`;
    } else {
      policeBox.classList.add('hidden');
    }
  }

  // --- Menu Rendering ---
  function renderMenu() {
    document.getElementById('menu-coins').textContent = appState.save.coins.toLocaleString();
    const currCar = VEHICLES.find((v) => v.id === appState.save.selectedVehicleId) || VEHICLES[0];
    const currColor = appState.save.vehicleColors[currCar.id] || currCar.color;

    document.getElementById('menu-car-name').textContent = currCar.nameKo;
    document.getElementById('menu-car-preview').style.backgroundColor = currColor;
    document.getElementById('menu-highscore').textContent = (appState.save.highScores[appState.mode] || 0).toLocaleString();
    document.getElementById('menu-total-dist').textContent = `총 주행 ${((appState.save.stats.totalDistance || 0) / 1000).toFixed(1)} km`;

    // Mode tabs
    ['ENDLESS', 'TIME_ATTACK', 'POLICE_CHASE'].forEach((m) => {
      const btn = document.getElementById(`mode-btn-${m}`);
      if (btn) {
        const active = appState.mode === m;
        btn.className = `py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
          active ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
        }`;
      }
    });

    // Theme buttons
    ['DAY', 'SUNSET', 'NIGHT'].forEach((t) => {
      const btn = document.getElementById(`theme-btn-${t}`);
      if (btn) {
        const active = appState.theme === t;
        btn.className = `flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
          active ? 'bg-slate-800 text-cyan-400 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
        }`;
      }
    });

    updateAudioIcons();
  }

  // --- Garage Rendering ---
  function renderGarage() {
    document.getElementById('garage-coins').textContent = appState.save.coins.toLocaleString();
    const car = VEHICLES.find((v) => v.id === appState.garageSelectedId) || VEHICLES[0];
    const isUnlocked = appState.save.unlockedVehicles.includes(car.id);
    const isEquipped = appState.save.selectedVehicleId === car.id;
    const upgrades = appState.save.upgrades[car.id] || { speedLevel: 0, accelLevel: 0, handlingLevel: 0, nitroLevel: 0, magnetLevel: 0 };
    const tuned = calculateVehicleStats(car.id, upgrades);

    // Car List
    const listEl = document.getElementById('garage-car-list');
    listEl.innerHTML = '';
    VEHICLES.forEach((c) => {
      const unlocked = appState.save.unlockedVehicles.includes(c.id);
      const selected = appState.garageSelectedId === c.id;
      const equipped = appState.save.selectedVehicleId === c.id;
      const color = appState.save.vehicleColors[c.id] || c.color;

      const item = document.createElement('button');
      item.className = `flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer ${
        selected
          ? 'bg-slate-900 border-cyan-500 shadow-lg shadow-cyan-950/30 ring-1 ring-cyan-500'
          : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900/80 hover:border-slate-700'
      }`;
      item.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-5 h-8 rounded-md border border-slate-700 shadow-sm shrink-0" style="background-color: ${color}"></div>
          <div>
            <div class="text-sm font-bold text-slate-100">${c.nameKo}</div>
            <div class="text-xs text-slate-400">최고 ${c.speed} km/h</div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          ${
            unlocked
              ? equipped
                ? '<span class="text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-md">장착 중</span>'
                : '<span class="text-xs text-slate-400">보유함</span>'
              : `<span class="text-xs font-mono font-bold text-amber-400 bg-amber-950/40 border border-amber-900/40 px-2 py-0.5 rounded-md">${c.price} 🪙</span>`
          }
        </div>
      `;
      item.onclick = () => {
        appState.garageSelectedId = c.id;
        sound.playCoin();
        renderGarage();
      };
      listEl.appendChild(item);
    });

    // Detail Panel
    document.getElementById('garage-car-name').textContent = car.nameKo;
    document.getElementById('garage-car-desc').textContent = car.description;

    const actionContainer = document.getElementById('garage-car-action');
    if (isUnlocked) {
      actionContainer.innerHTML = `
        <button id="garage-equip-btn" class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
          isEquipped ? 'bg-slate-800 text-slate-400 cursor-default' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg'
        }">
          ${isEquipped ? '✓ 장착됨' : '선택하기'}
        </button>
      `;
      const equipBtn = document.getElementById('garage-equip-btn');
      if (equipBtn && !isEquipped) {
        equipBtn.onclick = () => {
          appState.save.selectedVehicleId = car.id;
          saveData(appState.save);
          sound.playCoin();
          renderGarage();
        };
      }
    } else {
      const canBuy = appState.save.coins >= car.price;
      actionContainer.innerHTML = `
        <button id="garage-buy-btn" class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
          canBuy ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-lg' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
        }">
          🔒 ${car.price} 코인으로 잠금 해제
        </button>
      `;
      const buyBtn = document.getElementById('garage-buy-btn');
      if (buyBtn && canBuy) {
        buyBtn.onclick = () => {
          appState.save.coins -= car.price;
          appState.save.unlockedVehicles.push(car.id);
          appState.save.selectedVehicleId = car.id;
          saveData(appState.save);
          sound.playPowerup();
          renderGarage();
        };
      }
    }

    // Color Palette
    const paletteEl = document.getElementById('garage-color-palette');
    paletteEl.innerHTML = '';
    COLOR_PALETTE.forEach((hex) => {
      const dot = document.createElement('button');
      dot.className = 'w-5 h-5 rounded-full border border-slate-700 hover:scale-110 transition-transform cursor-pointer';
      dot.style.backgroundColor = hex;
      dot.onclick = () => {
        appState.save.vehicleColors[car.id] = hex;
        saveData(appState.save);
        sound.playCoin();
        renderGarage();
      };
      paletteEl.appendChild(dot);
    });

    // Stat bars
    document.getElementById('garage-stat-speed').textContent = `${tuned.topSpeed} km/h`;
    document.getElementById('garage-bar-speed').style.width = `${Math.min(100, (tuned.topSpeed / 310) * 100)}%`;
    document.getElementById('garage-stat-accel').textContent = tuned.acceleration;
    document.getElementById('garage-bar-accel').style.width = `${Math.min(100, (tuned.acceleration / 55) * 100)}%`;
    document.getElementById('garage-stat-handling').textContent = tuned.handling;
    document.getElementById('garage-bar-handling').style.width = `${Math.min(100, (tuned.handling / 55) * 100)}%`;
    document.getElementById('garage-stat-armor').textContent = `Lv.${tuned.armor}`;
    document.getElementById('garage-bar-armor').style.width = `${(tuned.armor / 4) * 100}%`;

    // Upgrade parts
    const upgradeRows = [
      { id: 'speedLevel', label: '엔진 출력 (최고 속도)' },
      { id: 'accelLevel', label: '터보 트윈 (가속력)' },
      { id: 'handlingLevel', label: '서스펜션 (핸들링 회피)' },
      { id: 'nitroLevel', label: '니트로 부스터 탱크 용량' },
      { id: 'magnetLevel', label: '마그넷 코인 흡수기 지속시간' },
    ];

    const upListEl = document.getElementById('garage-upgrades-list');
    upListEl.innerHTML = '';
    upgradeRows.forEach((part) => {
      const lvl = upgrades[part.id] || 0;
      const isMax = lvl >= 5;
      const cost = isMax ? 0 : UPGRADE_PRICES[lvl];
      const canAfford = appState.save.coins >= cost;

      const row = document.createElement('div');
      row.className = 'flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80';

      let dots = '';
      for (let s = 1; s <= 5; s++) {
        dots += `<div class="w-3.5 h-1.5 rounded-sm ${s <= lvl ? 'bg-cyan-400' : 'bg-slate-800'}"></div>`;
      }

      row.innerHTML = `
        <div>
          <div class="text-xs font-bold text-slate-200">${part.label}</div>
          <div class="flex items-center gap-1 mt-1">${dots}</div>
        </div>
        ${
          isMax
            ? '<span class="text-xs font-bold text-slate-500 px-3 py-1">MAX</span>'
            : `<button class="up-btn px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                canAfford ? 'bg-slate-800 hover:bg-cyan-600 text-slate-100 border border-slate-700 hover:border-cyan-400' : 'bg-slate-900/60 text-slate-600 border border-slate-800/80 cursor-not-allowed'
              }">+${cost} 🪙</button>`
        }
      `;

      if (!isMax) {
        const btn = row.querySelector('.up-btn');
        if (btn && canAfford) {
          btn.onclick = () => {
            appState.save.coins -= cost;
            if (!appState.save.upgrades[car.id]) {
              appState.save.upgrades[car.id] = { speedLevel: 0, accelLevel: 0, handlingLevel: 0, nitroLevel: 0, magnetLevel: 0 };
            }
            appState.save.upgrades[car.id][part.id] = lvl + 1;
            saveData(appState.save);
            sound.playPowerup();
            renderGarage();
          };
        }
      }
      upListEl.appendChild(row);
    });
  }

  // --- Game Over Modal ---
  function showGameOverModal(isRecord) {
    showView('GAMEOVER');
    if (isRecord && window.confetti) {
      window.confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    }

    const badge = document.getElementById('go-record-badge');
    badge.classList.toggle('hidden', !isRecord);

    document.getElementById('go-score').textContent = `${stats.score.toLocaleString()} 점`;
    document.getElementById('go-mode-text').textContent =
      appState.mode === 'ENDLESS' ? '무한 고속도로 질주 결과' :
      appState.mode === 'TIME_ATTACK' ? '타임 어택 체크포인트 결과' : '경찰 추격전 추격 결과';

    document.getElementById('go-dist').textContent = `${(stats.distance / 1000).toFixed(2)} km`;
    document.getElementById('go-coins').textContent = `🪙 +${stats.coinsCollected}`;
    document.getElementById('go-nearmiss').textContent = `${stats.nearMisses} 회`;
    document.getElementById('go-speed').textContent = `${stats.maxSpeedReached} km/h`;
  }

  function updateAudioIcons() {
    const isMuted = !appState.save.soundEnabled;
    document.querySelectorAll('.audio-btn-icon').forEach((el) => {
      el.textContent = isMuted ? '🔇' : '🔊';
    });
  }

  function toggleAudio() {
    appState.save.soundEnabled = !appState.save.soundEnabled;
    saveData(appState.save);
    sound.setEnabled(appState.save.soundEnabled);
    updateAudioIcons();
  }

  // --- Setup Global Events ---
  function setupEvents() {
    // Mode Buttons
    ['ENDLESS', 'TIME_ATTACK', 'POLICE_CHASE'].forEach((m) => {
      const btn = document.getElementById(`mode-btn-${m}`);
      if (btn) {
        btn.onclick = () => {
          appState.mode = m;
          sound.playCoin();
          renderMenu();
        };
      }
    });

    // Theme Buttons
    ['DAY', 'SUNSET', 'NIGHT'].forEach((t) => {
      const btn = document.getElementById(`theme-btn-${t}`);
      if (btn) {
        btn.onclick = () => {
          appState.theme = t;
          sound.playCoin();
          renderMenu();
        };
      }
    });

    // Audio Buttons
    document.querySelectorAll('.toggle-audio-btn').forEach((btn) => {
      btn.onclick = toggleAudio;
    });

    // Start Race Button
    document.getElementById('btn-start-race').onclick = () => {
      showView('PLAYING');
      initGame();
    };

    // Open Garage Button
    document.getElementById('btn-open-garage').onclick = () => {
      appState.garageSelectedId = appState.save.selectedVehicleId;
      showView('GARAGE');
    };

    // Close Garage Button
    document.getElementById('btn-close-garage').onclick = () => {
      showView('MENU');
    };

    // Pause Controls
    document.getElementById('hud-btn-pause').onclick = () => {
      if (appState.currentView === 'PLAYING') {
        isGamePaused = true;
        sound.stopEngine();
        showView('PAUSED');
      }
    };

    document.getElementById('pause-resume-btn').onclick = () => {
      isGamePaused = false;
      sound.startEngine();
      showView('PLAYING');
      lastTime = performance.now();
    };

    document.getElementById('pause-restart-btn').onclick = () => {
      showView('PLAYING');
      initGame();
    };

    document.getElementById('pause-quit-btn').onclick = () => {
      isGameRunning = false;
      sound.stopEngine();
      showView('MENU');
    };

    // Game Over Buttons
    document.getElementById('go-restart-btn').onclick = () => {
      showView('PLAYING');
      initGame();
    };

    document.getElementById('go-garage-btn').onclick = () => {
      showView('GARAGE');
    };

    document.getElementById('go-menu-btn').onclick = () => {
      showView('MENU');
    };

    // Keyboard Listeners (English WASD, Arrows, Korean ㅁ/ㅇ/ㅈ/ㄴ, Space)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (appState.currentView === 'PLAYING') {
          isGamePaused = true;
          sound.stopEngine();
          showView('PAUSED');
        } else if (appState.currentView === 'PAUSED') {
          isGamePaused = false;
          sound.startEngine();
          showView('PLAYING');
          lastTime = performance.now();
        }
      }

      const code = e.code;
      const key = e.key;
      if (['ArrowUp', 'KeyW'].includes(code) || ['ArrowUp', 'w', 'W', 'ㅈ'].includes(key)) inputState.up = true;
      if (['ArrowDown', 'KeyS'].includes(code) || ['ArrowDown', 's', 'S', 'ㄴ'].includes(key)) inputState.down = true;
      if (['ArrowLeft', 'KeyA'].includes(code) || ['ArrowLeft', 'a', 'A', 'ㅁ'].includes(key)) inputState.left = true;
      if (['ArrowRight', 'KeyD'].includes(code) || ['ArrowRight', 'd', 'D', 'ㅇ'].includes(key)) inputState.right = true;
      if (['Space', 'ShiftLeft', 'ShiftRight'].includes(code) || [' ', 'Shift'].includes(key)) inputState.nitro = true;
    });

    window.addEventListener('keyup', (e) => {
      const code = e.code;
      const key = e.key;
      if (['ArrowUp', 'KeyW'].includes(code) || ['ArrowUp', 'w', 'W', 'ㅈ'].includes(key)) inputState.up = false;
      if (['ArrowDown', 'KeyS'].includes(code) || ['ArrowDown', 's', 'S', 'ㄴ'].includes(key)) inputState.down = false;
      if (['ArrowLeft', 'KeyA'].includes(code) || ['ArrowLeft', 'a', 'A', 'ㅁ'].includes(key)) inputState.left = false;
      if (['ArrowRight', 'KeyD'].includes(code) || ['ArrowRight', 'd', 'D', 'ㅇ'].includes(key)) inputState.right = false;
      if (['Space', 'ShiftLeft', 'ShiftRight'].includes(code) || [' ', 'Shift'].includes(key)) inputState.nitro = false;
    });

    // Touch Buttons with Pointer Capture
    function setupTouchButton(id, actionKey) {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener('pointerdown', (e) => {
        try { btn.setPointerCapture(e.pointerId); } catch (err) {}
        inputState[actionKey] = true;
      });
      btn.addEventListener('pointerup', (e) => {
        try { btn.releasePointerCapture(e.pointerId); } catch (err) {}
        inputState[actionKey] = false;
      });
      btn.addEventListener('pointercancel', () => { inputState[actionKey] = false; });
      btn.addEventListener('pointerleave', () => { inputState[actionKey] = false; });
      btn.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    setupTouchButton('btn-touch-left', 'left');
    setupTouchButton('btn-touch-right', 'right');
    setupTouchButton('btn-touch-accel', 'up');
    setupTouchButton('btn-touch-brake', 'down');
    setupTouchButton('btn-touch-nitro', 'nitro');

    // Direct Canvas Touch / Click Steering
    const cEl = document.getElementById('game-canvas');
    if (cEl) {
      const handlePointer = (e) => {
        const rect = cEl.getBoundingClientRect();
        const clientX = e.clientX - rect.left;
        const playerCenterX = player.x + CAR_WIDTH / 2;
        if (Math.abs(clientX - playerCenterX) > 12) {
          inputState.canvasPointerSteer = clientX < playerCenterX ? -1 : 1;
        } else {
          inputState.canvasPointerSteer = null;
        }
      };

      cEl.addEventListener('pointerdown', handlePointer);
      cEl.addEventListener('pointermove', (e) => {
        if (e.buttons > 0) handlePointer(e);
      });
      const endPointer = () => { inputState.canvasPointerSteer = null; };
      cEl.addEventListener('pointerup', endPointer);
      cEl.addEventListener('pointerleave', endPointer);
      cEl.addEventListener('pointercancel', endPointer);
    }

    // Resize Handler
    window.addEventListener('resize', () => {
      if (canvas && isGameRunning) {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        if (ctx) ctx.scale(dpr, dpr);
      }
    });
  }

  // --- Initial Launch ---
  window.addEventListener('DOMContentLoaded', () => {
    setupEvents();
    showView('MENU');
    if (window.lucide) window.lucide.createIcons();
  });
})();
