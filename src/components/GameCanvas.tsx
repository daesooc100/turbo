import React, { useEffect, useRef, useCallback } from 'react';
import {
  GameMode,
  EnvironmentTheme,
  Vehicle,
  VehicleUpgrades,
  PlayerState,
  TrafficCar,
  PickupItem,
  PickupType,
  Particle,
  GameStats,
} from '../types/game';
import {
  CAR_WIDTH,
  CAR_HEIGHT,
  LANE_COUNT,
  HIGHWAY_COLORS,
} from '../utils/constants';
import { calculateVehicleStats } from '../utils/storage';
import { sound } from '../utils/audio';

interface GameCanvasProps {
  mode: GameMode;
  theme: EnvironmentTheme;
  vehicle: Vehicle;
  upgrades: VehicleUpgrades;
  onGameOver: (finalStats: GameStats) => void;
  onStatsUpdate: (stats: GameStats, player: PlayerState) => void;
  isPaused: boolean;
  touchInput: {
    left: boolean;
    right: boolean;
    accel: boolean;
    brake: boolean;
    nitro: boolean;
  };
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  mode,
  theme,
  vehicle,
  upgrades,
  onGameOver,
  onStatsUpdate,
  isPaused,
  touchInput,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Keyboard input state
  const keysRef = useRef<{
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
    space: boolean;
  }>({
    left: false,
    right: false,
    up: false,
    down: false,
    space: false,
  });

  // Calculate current vehicle performance
  const tunedStats = calculateVehicleStats(vehicle.id, upgrades);

  // Game internal state references (to avoid re-renders inside 60fps loop)
  const playerRef = useRef<PlayerState>({
    x: 0,
    y: 0,
    width: CAR_WIDTH,
    height: CAR_HEIGHT,
    speed: 0,
    targetSpeed: tunedStats.topSpeed,
    maxSpeed: tunedStats.topSpeed,
    acceleration: tunedStats.acceleration,
    handling: tunedStats.handling,
    nitro: 50,
    maxNitro: tunedStats.maxNitro,
    isNitroActive: false,
    health: 100,
    maxHealth: 100,
    shieldTimer: 0,
    magnetTimer: 0,
    turnDirection: 0,
    isBraking: false,
    invulnerableTimer: 0,
  });

  const statsRef = useRef<GameStats>({
    score: 0,
    distance: 0,
    coinsCollected: 0,
    nearMisses: 0,
    maxSpeedReached: 0,
    combo: 0,
    comboTimer: 0,
    timeRemaining: mode === 'TIME_ATTACK' ? 45 : 0,
    policeDistance: mode === 'POLICE_CHASE' ? 65 : 100,
  });

  const trafficRef = useRef<TrafficCar[]>([]);
  const pickupsRef = useRef<PickupItem[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const roadOffsetRef = useRef<number>(0);
  const nextSpawnDistanceRef = useRef<number>(100);
  const nextPickupDistanceRef = useRef<number>(250);
  const screenShakeRef = useRef<number>(0);
  const isDeadRef = useRef<boolean>(false);
  const checkpointDistanceRef = useRef<number>(1500);

  // Initialize input listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) keysRef.current.up = true;
      if (['ArrowDown', 'KeyS'].includes(e.code)) keysRef.current.down = true;
      if (['ArrowLeft', 'KeyA'].includes(e.code)) keysRef.current.left = true;
      if (['ArrowRight', 'KeyD'].includes(e.code)) keysRef.current.right = true;
      if (['Space', 'ShiftLeft', 'ShiftRight'].includes(e.code)) {
        keysRef.current.space = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) keysRef.current.up = false;
      if (['ArrowDown', 'KeyS'].includes(e.code)) keysRef.current.down = false;
      if (['ArrowLeft', 'KeyA'].includes(e.code)) keysRef.current.left = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) keysRef.current.right = false;
      if (['Space', 'ShiftLeft', 'ShiftRight'].includes(e.code)) {
        keysRef.current.space = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Spawn a floating score or text particle
  const spawnTextParticle = useCallback((x: number, y: number, text: string, color: string) => {
    particlesRef.current.push({
      x,
      y,
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
  }, []);

  // Spawn spark or smoke particle
  const spawnSparks = useCallback((x: number, y: number, count = 8, color = '#f59e0b') => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      particlesRef.current.push({
        x,
        y,
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
  }, []);

  // Main Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    sound.startEngine();

    // Reset player position based on canvas width
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const roadWidth = Math.min(rect.width * 0.88, 480);
    const roadX = (rect.width - roadWidth) / 2;
    const laneWidth = roadWidth / LANE_COUNT;

    // Reset player to 2nd lane
    playerRef.current.x = roadX + laneWidth * 1.5 - CAR_WIDTH / 2;
    playerRef.current.y = rect.height - CAR_HEIGHT - 60;
    playerRef.current.speed = 80;
    playerRef.current.health = 100;
    isDeadRef.current = false;

    let lastTime = performance.now();
    let animId: number;

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05); // cap at 50ms to prevent jumping
      lastTime = currentTime;

      const width = rect.width;
      const height = rect.height;

      if (!isPaused && !isDeadRef.current) {
        // --- 1. Process Input & Player Movement ---
        const isLeft = keysRef.current.left || touchInput.left;
        const isRight = keysRef.current.right || touchInput.right;
        const isUp = keysRef.current.up || touchInput.accel;
        const isDown = keysRef.current.down || touchInput.brake;
        const isNitroRequested = keysRef.current.space || touchInput.nitro;

        const player = playerRef.current;
        const stats = statsRef.current;

        // Nitro management
        if (isNitroRequested && player.nitro > 10) {
          if (!player.isNitroActive) {
            sound.playNitroBoost();
          }
          player.isNitroActive = true;
          player.nitro = Math.max(0, player.nitro - 35 * dt);
          screenShakeRef.current = Math.max(screenShakeRef.current, 2.5);
        } else {
          player.isNitroActive = false;
          // Passive slow nitro regen
          player.nitro = Math.min(player.maxNitro, player.nitro + 3 * dt);
        }

        // Speed calculation
        const baseTopSpeed = player.maxSpeed;
        const effectiveTopSpeed = player.isNitroActive ? baseTopSpeed + 45 : baseTopSpeed;

        if (isUp) {
          player.speed += player.acceleration * 2.2 * dt;
          player.isBraking = false;
        } else if (isDown) {
          player.speed -= player.acceleration * 3.5 * dt;
          player.isBraking = true;
          if (player.speed > 100) {
            sound.playScreech();
          }
        } else {
          player.isBraking = false;
          // Natural coasting towards 120 km/h cruising speed
          if (player.speed < 120) {
            player.speed += 15 * dt;
          } else if (player.speed > effectiveTopSpeed) {
            player.speed -= 30 * dt;
          }
        }

        // Clamp speed
        player.speed = Math.max(40, Math.min(effectiveTopSpeed, player.speed));
        if (player.speed > stats.maxSpeedReached) {
          stats.maxSpeedReached = Math.round(player.speed);
        }

        // Lateral steering
        let turnDir = 0;
        if (isLeft) {
          turnDir = -1;
          player.x -= player.handling * 12 * dt;
        }
        if (isRight) {
          turnDir = 1;
          player.x += player.handling * 12 * dt;
        }
        player.turnDirection = turnDir;

        // Road boundaries clamp (with side crash penalty)
        const minX = roadX + 6;
        const maxX = roadX + roadWidth - CAR_WIDTH - 6;
        if (player.x < minX) {
          player.x = minX;
          player.speed *= 0.96;
          spawnSparks(player.x, player.y + CAR_HEIGHT / 2, 2, '#94a3b8');
        } else if (player.x > maxX) {
          player.x = maxX;
          player.speed *= 0.96;
          spawnSparks(player.x + CAR_WIDTH, player.y + CAR_HEIGHT / 2, 2, '#94a3b8');
        }

        // Active timers
        if (player.shieldTimer > 0) player.shieldTimer -= dt;
        if (player.magnetTimer > 0) player.magnetTimer -= dt;
        if (player.invulnerableTimer > 0) player.invulnerableTimer -= dt;

        // Combo timer decay
        if (stats.comboTimer > 0) {
          stats.comboTimer -= dt;
          if (stats.comboTimer <= 0) {
            stats.combo = 0;
          }
        }

        // Distance & Score progression
        const speedRatio = player.speed / 100;
        const distanceDelta = (player.speed * 1000 / 3600) * dt;
        stats.distance += distanceDelta;
        stats.score += Math.round(distanceDelta * (1 + (stats.combo > 0 ? stats.combo * 0.25 : 0)));

        // Time Attack mode timer countdown
        if (mode === 'TIME_ATTACK') {
          stats.timeRemaining -= dt;
          // Checkpoints
          if (stats.distance >= checkpointDistanceRef.current) {
            stats.timeRemaining += 12;
            checkpointDistanceRef.current += 1500;
            spawnTextParticle(width / 2, height / 2 - 80, '체크포인트 +12초!', '#10b981');
            sound.playPowerup();
          }

          if (stats.timeRemaining <= 0) {
            stats.timeRemaining = 0;
            isDeadRef.current = true;
            sound.stopEngine();
            sound.playCrash();
            onGameOver(stats);
          }
        }

        // Police Chase mode dynamics
        if (mode === 'POLICE_CHASE') {
          // If player speed is high (> 180), police distance grows. If low, police catches up!
          const speedDiff = player.speed - 160;
          stats.policeDistance += (speedDiff * 0.04) * dt;
          stats.policeDistance = Math.max(0, Math.min(100, stats.policeDistance));

          if (stats.policeDistance <= 5) {
            sound.playSiren();
          }

          if (stats.policeDistance <= 0) {
            isDeadRef.current = true;
            sound.stopEngine();
            sound.playCrash();
            spawnTextParticle(width / 2, height / 2 - 80, '경찰에 체포되었습니다!', '#ef4444');
            onGameOver(stats);
          }
        }

        // Update synthesized engine audio
        sound.updateEngine(player.speed, player.maxSpeed, player.isNitroActive);

        // Road scroll offset
        roadOffsetRef.current = (roadOffsetRef.current + player.speed * 8 * dt) % 80;

        // --- 2. Spawn Traffic Cars ---
        nextSpawnDistanceRef.current -= distanceDelta;
        if (nextSpawnDistanceRef.current <= 0) {
          const spawnInterval = Math.max(60, 140 - (player.speed / 280) * 50);
          nextSpawnDistanceRef.current = spawnInterval + Math.random() * 40;

          // Pick an available lane
          const randomLane = Math.floor(Math.random() * LANE_COUNT);
          const laneX = roadX + randomLane * laneWidth + (laneWidth - CAR_WIDTH) / 2;

          // Avoid spawning right on top of another traffic car
          const tooClose = trafficRef.current.some(
            (c) => Math.abs(c.y - -CAR_HEIGHT * 2) < 180 && c.lane === randomLane
          );

          if (!tooClose) {
            const carTypes: Array<'sedan' | 'truck' | 'taxi' | 'sports' | 'police' | 'bus'> = [
              'sedan',
              'taxi',
              'truck',
              'sports',
            ];
            if (mode === 'POLICE_CHASE' && Math.random() < 0.4) {
              carTypes.push('police');
            }

            const chosenType = carTypes[Math.floor(Math.random() * carTypes.length)];
            let trafficSpeed = 65 + Math.random() * 30; // km/h
            let carHeight = CAR_HEIGHT;
            let carColor = '#3b82f6';

            if (chosenType === 'truck' || chosenType === 'bus') {
              trafficSpeed = 50 + Math.random() * 20;
              carHeight = CAR_HEIGHT * 1.5;
              carColor = '#e2e8f0';
            } else if (chosenType === 'taxi') {
              trafficSpeed = 75 + Math.random() * 25;
              carColor = '#facc15';
            } else if (chosenType === 'sports') {
              trafficSpeed = 95 + Math.random() * 35;
              carColor = '#ec4899';
            } else if (chosenType === 'police') {
              trafficSpeed = 110 + Math.random() * 30;
              carColor = '#1e293b';
            }

            trafficRef.current.push({
              id: Date.now() + Math.random(),
              x: laneX,
              y: -carHeight - 40,
              targetX: laneX,
              lane: randomLane,
              targetLane: randomLane,
              width: CAR_WIDTH,
              height: carHeight,
              speed: trafficSpeed,
              color: carColor,
              type: chosenType,
              isChangingLane: false,
              laneChangeTimer: 2 + Math.random() * 4,
              laneBlinker: 'none',
              hasPassedPlayer: false,
              nearMissAwarded: false,
              sirenActive: chosenType === 'police',
            });
          }
        }

        // --- 3. Spawn Pickups (Coins, Nitro, Repair, Shield, Magnet) ---
        nextPickupDistanceRef.current -= distanceDelta;
        if (nextPickupDistanceRef.current <= 0) {
          nextPickupDistanceRef.current = 140 + Math.random() * 180;
          const randomLane = Math.floor(Math.random() * LANE_COUNT);
          const pickupX = roadX + randomLane * laneWidth + laneWidth / 2 - 16;

          // Determine pickup type
          const roll = Math.random();
          let pType: PickupType = 'coin';
          if (roll < 0.6) {
            pType = 'coin';
          } else if (roll < 0.75) {
            pType = 'nitro';
          } else if (roll < 0.85) {
            pType = 'repair';
          } else if (roll < 0.93) {
            pType = 'magnet';
          } else {
            pType = 'shield';
          }

          pickupsRef.current.push({
            id: Date.now() + Math.random(),
            x: pickupX,
            y: -60,
            width: 32,
            height: 32,
            type: pType,
            value: pType === 'coin' ? 1 : 0,
            collected: false,
            pulseTimer: 0,
          });
        }

        // --- 4. Update Traffic Cars ---
        for (let i = trafficRef.current.length - 1; i >= 0; i--) {
          const car = trafficRef.current[i];

          // Relative vertical movement: player speed vs traffic car speed
          const relativeSpeedKmh = player.speed - car.speed;
          const relativeSpeedPixels = (relativeSpeedKmh * 1000 / 3600) * 5.2 * dt;
          car.y += relativeSpeedPixels;

          // Lane changing behavior
          car.laneChangeTimer -= dt;
          if (car.laneChangeTimer <= 0 && !car.isChangingLane && Math.random() < 0.3) {
            const possibleLanes: number[] = [];
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

          // Smooth lateral move during lane switch
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

          // --- Collision Detection with Player ---
          const hitX = Math.abs(player.x + CAR_WIDTH / 2 - (car.x + car.width / 2));
          const hitY = Math.abs(player.y + CAR_HEIGHT / 2 - (car.y + car.height / 2));
          const collisionX = hitX < (CAR_WIDTH + car.width) * 0.44;
          const collisionY = hitY < (CAR_HEIGHT + car.height) * 0.44;

          if (collisionX && collisionY && player.invulnerableTimer <= 0) {
            // Check shield protection
            if (player.shieldTimer > 0) {
              player.shieldTimer = 0;
              player.invulnerableTimer = 1.0;
              screenShakeRef.current = 6;
              sound.playCrash();
              spawnSparks(car.x + car.width / 2, car.y + car.height / 2, 20, '#38bdf8');
              spawnTextParticle(player.x, player.y - 20, '보호막 방어!', '#38bdf8');
              // Push car away
              car.y -= 120;
              car.speed = 40;
            } else {
              // Impact damage based on speed difference and vehicle armor
              const impactSpeed = Math.abs(relativeSpeedKmh);
              const armorReduction = tunedStats.armor * 0.18; // Beast SUV takes much less damage
              const damage = Math.round(Math.max(20, (impactSpeed * 0.45) * (1 - armorReduction)));

              player.health -= damage;
              player.invulnerableTimer = 1.2;
              screenShakeRef.current = 8;
              sound.playCrash();
              spawnSparks(player.x + CAR_WIDTH / 2, player.y + 20, 16, '#ef4444');
              stats.combo = 0;

              // Bounce off
              player.speed *= 0.65;
              if (player.x < car.x) {
                player.x -= 20;
                car.x += 15;
              } else {
                player.x += 20;
                car.x -= 15;
              }

              // Check if player died
              if (player.health <= 0) {
                player.health = 0;
                isDeadRef.current = true;
                sound.stopEngine();
                sound.playCrash();
                spawnSparks(player.x + CAR_WIDTH / 2, player.y + CAR_HEIGHT / 2, 35, '#ef4444');
                spawnTextParticle(player.x, player.y - 30, 'CRASH!', '#ef4444');
                onGameOver(stats);
                break;
              } else {
                spawnTextParticle(player.x, player.y - 25, `-${damage} HP`, '#f87171');
              }
            }
          }

          // --- Near Miss Detection ---
          // Passing close laterally (within 24px) when speed > 110 km/h without collision
          const isPassingY = Math.abs(player.y - car.y) < CAR_HEIGHT * 0.8;
          const isNearX = hitX >= (CAR_WIDTH + car.width) * 0.44 && hitX <= (CAR_WIDTH + car.width) * 0.72;

          if (isPassingY && isNearX && !car.nearMissAwarded && player.speed > 115) {
            car.nearMissAwarded = true;
            stats.nearMisses += 1;
            stats.combo += 1;
            stats.comboTimer = 3.5; // 3.5 seconds to chain next near miss

            const bonusScore = 150 * stats.combo;
            stats.score += bonusScore;
            // Refill nitro
            player.nitro = Math.min(player.maxNitro, player.nitro + 18);

            sound.playNearMiss(stats.combo);
            spawnTextParticle(
              player.x + (player.x < car.x ? CAR_WIDTH : -40),
              player.y + 10,
              `아슬아슬 추월! x${stats.combo}`,
              '#fbbf24'
            );
          }

          // Remove traffic that fell off screen
          if (car.y > height + 200 || car.y < -300) {
            trafficRef.current.splice(i, 1);
          }
        }

        // --- 5. Update Pickups ---
        const magnetActive = player.magnetTimer > 0;
        for (let i = pickupsRef.current.length - 1; i >= 0; i--) {
          const item = pickupsRef.current[i];
          const relativeSpeedPixels = (player.speed * 1000 / 3600) * 5.2 * dt;
          item.y += relativeSpeedPixels;
          item.pulseTimer += dt * 4;

          // Magnet suction
          if (magnetActive) {
            const dx = player.x + CAR_WIDTH / 2 - (item.x + item.width / 2);
            const dy = player.y + CAR_HEIGHT / 2 - (item.y + item.height / 2);
            const dist = Math.hypot(dx, dy);
            if (dist < 260) {
              item.x += (dx / dist) * 220 * dt;
              item.y += (dy / dist) * 220 * dt;
            }
          }

          // Collision with player
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
              player.magnetTimer = tunedStats.magnetDuration;
              sound.playPowerup();
              spawnTextParticle(item.x, item.y, `자석 가동 (${tunedStats.magnetDuration}초)`, '#a855f7');
            }

            pickupsRef.current.splice(i, 1);
            continue;
          }

          if (item.y > height + 80) {
            pickupsRef.current.splice(i, 1);
          }
        }

        // --- 6. Update Particles ---
        // Spawn continuous exhaust smoke or nitro flame
        if (player.speed > 50) {
          const isBoosting = player.isNitroActive;
          particlesRef.current.push({
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

          particlesRef.current.push({
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

        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const p = particlesRef.current[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life += 1;
          p.alpha = Math.max(0, 1 - p.life / p.maxLife);

          if (p.life >= p.maxLife) {
            particlesRef.current.splice(i, 1);
          }
        }

        // Decay screen shake
        if (screenShakeRef.current > 0) {
          screenShakeRef.current = Math.max(0, screenShakeRef.current - dt * 10);
        }

        // Notify parent HUD of stats updates
        onStatsUpdate({ ...stats }, { ...player });
      }

      // ==========================================
      // --- 7. RENDERING PIPELINE (CANVAS 60FPS) ---
      // ==========================================
      ctx.save();

      // Screen shake translation
      if (screenShakeRef.current > 0) {
        const shakeX = (Math.random() - 0.5) * screenShakeRef.current * 4;
        const shakeY = (Math.random() - 0.5) * screenShakeRef.current * 4;
        ctx.translate(shakeX, shakeY);
      }

      const colors = HIGHWAY_COLORS[theme];

      // Draw Horizon & Roadside Terrain (Parallax feel)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, colors.skyTop);
      skyGrad.addColorStop(0.35, colors.skyBottom);
      skyGrad.addColorStop(1, colors.grass);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Road asphalt surface
      ctx.fillStyle = colors.road;
      ctx.fillRect(roadX, 0, roadWidth, height);

      // Road shoulder & guard rails
      ctx.fillStyle = colors.shoulder;
      ctx.fillRect(roadX - 14, 0, 14, height);
      ctx.fillRect(roadX + roadWidth, 0, 14, height);

      // Guardrail reflective stripes
      ctx.fillStyle = theme === 'NIGHT' ? '#f59e0b' : '#cbd5e1';
      const stripeOffset = (roadOffsetRef.current * 1.5) % 40;
      for (let y = -40 + stripeOffset; y < height; y += 40) {
        ctx.fillRect(roadX - 10, y, 6, 18);
        ctx.fillRect(roadX + roadWidth + 4, y, 6, 18);
      }

      // Outer solid white road edge lines
      ctx.strokeStyle = colors.line;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(roadX, 0);
      ctx.lineTo(roadX, height);
      ctx.moveTo(roadX + roadWidth, 0);
      ctx.lineTo(roadX + roadWidth, height);
      ctx.stroke();

      // Dashed lane divider lines
      ctx.strokeStyle = colors.line;
      ctx.lineWidth = 3;
      ctx.setLineDash([30, 30]);
      ctx.lineDashOffset = -roadOffsetRef.current;

      for (let i = 1; i < LANE_COUNT; i++) {
        const lx = roadX + i * laneWidth;
        ctx.beginPath();
        ctx.moveTo(lx, 0);
        ctx.lineTo(lx, height);
        ctx.stroke();
      }
      ctx.setLineDash([]); // Reset dash

      // Night / Sunset Headlight Illuminations
      if (colors.headlightVisible) {
        const player = playerRef.current;
        // Draw player's forward headlight beam cones
        const lightGrad = ctx.createRadialGradient(
          player.x + CAR_WIDTH / 2,
          player.y - 30,
          20,
          player.x + CAR_WIDTH / 2,
          player.y - 180,
          220
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

      // Draw Pickups (Coins, Boosts, Shields, Repair)
      pickupsRef.current.forEach((item) => {
        ctx.save();
        ctx.translate(item.x + item.width / 2, item.y + item.height / 2);

        // Soft glow shadow
        ctx.shadowBlur = 10;

        if (item.type === 'coin') {
          // Spinning gold coin
          ctx.shadowColor = '#eab308';
          const scaleX = Math.cos(item.pulseTimer);
          ctx.scale(scaleX, 1);

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
          // Blue Nitro Canister
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
          // Green Repair Medkit
          ctx.shadowColor = '#10b981';
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.roundRect(-12, -12, 24, 24, 6);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-3, -8, 6, 16);
          ctx.fillRect(-8, -3, 16, 6);
        } else if (item.type === 'shield') {
          // Cyan Shield Orb
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
          // Purple Magnet Orb
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
      trafficRef.current.forEach((car) => {
        ctx.save();
        ctx.translate(car.x, car.y);

        // Vehicle shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.roundRect(4, 6, car.width - 8, car.height, 8);
        ctx.fill();

        // Main Car Body
        ctx.fillStyle = car.color;
        ctx.beginPath();
        ctx.roundRect(2, 0, car.width - 4, car.height, 8);
        ctx.fill();

        // Roof / Cabin
        ctx.fillStyle = '#0f172a';
        const cabinY = car.type === 'truck' ? 10 : car.height * 0.28;
        const cabinHeight = car.type === 'truck' ? car.height * 0.75 : car.height * 0.44;
        ctx.beginPath();
        ctx.roundRect(6, cabinY, car.width - 12, cabinHeight, 4);
        ctx.fill();

        // Windshield (front and rear)
        ctx.fillStyle = '#67e8f9';
        ctx.fillRect(8, cabinY + 2, car.width - 16, 6); // Front
        ctx.fillRect(8, cabinY + cabinHeight - 8, car.width - 16, 6); // Rear

        // Wheels
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 10, 3, 14);
        ctx.fillRect(car.width - 3, 10, 3, 14);
        ctx.fillRect(0, car.height - 24, 3, 14);
        ctx.fillRect(car.width - 3, car.height - 24, 3, 14);

        // Rear Taillights (Red)
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(4, car.height - 4, 8, 3);
        ctx.fillRect(car.width - 12, car.height - 4, 8, 3);

        // Front Headlights (Yellow/White)
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(4, 1, 8, 3);
        ctx.fillRect(car.width - 12, 1, 8, 3);

        // Flashing Turn Signals if changing lane
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

        // Flashing siren for police cars
        if (car.sirenActive) {
          const isRed = Math.floor(Date.now() / 120) % 2 === 0;
          ctx.fillStyle = isRed ? '#ef4444' : '#3b82f6';
          ctx.fillRect(car.width / 2 - 8, car.height * 0.42, 16, 6);
        }

        ctx.restore();
      });

      // Draw Player Car
      const player = playerRef.current;
      ctx.save();
      ctx.translate(player.x, player.y);

      // Slight tilt when turning
      const tiltAngle = (player.turnDirection * Math.PI) / 36;
      ctx.translate(CAR_WIDTH / 2, CAR_HEIGHT / 2);
      ctx.rotate(tiltAngle);
      ctx.translate(-CAR_WIDTH / 2, -CAR_HEIGHT / 2);

      // Invulnerable blink effect
      if (player.invulnerableTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0) {
        ctx.globalAlpha = 0.4;
      }

      // Ground shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.roundRect(3, 8, CAR_WIDTH - 6, CAR_HEIGHT, 10);
      ctx.fill();

      // Custom car design based on vehicle type
      if (vehicle.style === 'formula') {
        // Formula 1 open-wheel racer
        ctx.fillStyle = vehicle.color;
        // Central aerodynamic needle body
        ctx.beginPath();
        ctx.moveTo(CAR_WIDTH / 2, 0);
        ctx.lineTo(CAR_WIDTH - 6, 26);
        ctx.lineTo(CAR_WIDTH - 8, CAR_HEIGHT - 12);
        ctx.lineTo(8, CAR_HEIGHT - 12);
        ctx.lineTo(6, 26);
        ctx.closePath();
        ctx.fill();

        // Front nose wing
        ctx.fillStyle = vehicle.secondaryColor;
        ctx.fillRect(2, 6, CAR_WIDTH - 4, 6);
        // Rear massive spoiler
        ctx.fillStyle = vehicle.secondaryColor;
        ctx.fillRect(0, CAR_HEIGHT - 8, CAR_WIDTH, 8);

        // Exposed wide race wheels
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-4, 14, 8, 18);
        ctx.fillRect(CAR_WIDTH - 4, 14, 8, 18);
        ctx.fillRect(-6, CAR_HEIGHT - 26, 10, 22);
        ctx.fillRect(CAR_WIDTH - 4, CAR_HEIGHT - 26, 10, 22);

        // Cockpit helmet
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(CAR_WIDTH / 2, CAR_HEIGHT * 0.45, 6, 0, Math.PI * 2);
        ctx.fill();
      } else if (vehicle.style === 'suv') {
        // Rugged SUV Truck
        ctx.fillStyle = vehicle.color;
        ctx.beginPath();
        ctx.roundRect(1, 0, CAR_WIDTH - 2, CAR_HEIGHT, 6);
        ctx.fill();

        // Heavy roof rack
        ctx.fillStyle = vehicle.secondaryColor;
        ctx.fillRect(6, 20, CAR_WIDTH - 12, CAR_HEIGHT - 40);
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.strokeRect(6, 20, CAR_WIDTH - 12, CAR_HEIGHT - 40);

        // Heavy tires
        ctx.fillStyle = '#090d16';
        ctx.fillRect(-2, 10, 5, 20);
        ctx.fillRect(CAR_WIDTH - 3, 10, 5, 20);
        ctx.fillRect(-2, CAR_HEIGHT - 30, 5, 20);
        ctx.fillRect(CAR_WIDTH - 3, CAR_HEIGHT - 30, 5, 20);
      } else {
        // Sports & Cyber Cars
        // Aerodynamic body contour
        ctx.fillStyle = vehicle.color;
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

        // Center hood stripe / accent line
        ctx.fillStyle = vehicle.secondaryColor;
        ctx.fillRect(CAR_WIDTH / 2 - 3, 2, 6, CAR_HEIGHT - 6);

        // Glass windshield & cabin
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(6, CAR_HEIGHT * 0.24, CAR_WIDTH - 12, CAR_HEIGHT * 0.44, 4);
        ctx.fill();

        // Tinted glass reflection
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(8, CAR_HEIGHT * 0.25, CAR_WIDTH - 16, 7);

        // Rear window
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(8, CAR_HEIGHT * 0.62, CAR_WIDTH - 16, 6);

        // Rear aerodynamic wing / spoiler
        ctx.fillStyle = vehicle.secondaryColor;
        ctx.fillRect(2, CAR_HEIGHT - 6, CAR_WIDTH - 4, 5);

        // Wheels
        ctx.fillStyle = '#020617';
        ctx.fillRect(-2, 12, 4, 16);
        ctx.fillRect(CAR_WIDTH - 2, 12, 4, 16);
        ctx.fillRect(-2, CAR_HEIGHT - 28, 4, 18);
        ctx.fillRect(CAR_WIDTH - 2, CAR_HEIGHT - 28, 4, 18);
      }

      // Front Headlights
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(4, 0, 7, 3);
      ctx.fillRect(CAR_WIDTH - 11, 0, 7, 3);

      // Rear Brake Lights (Glow intense bright red when braking)
      const brakeGlow = player.isBraking;
      ctx.fillStyle = brakeGlow ? '#ff0000' : '#b91c1c';
      ctx.shadowColor = brakeGlow ? '#ff0000' : 'transparent';
      ctx.shadowBlur = brakeGlow ? 15 : 0;
      ctx.fillRect(4, CAR_HEIGHT - 2, 9, 3);
      ctx.fillRect(CAR_WIDTH - 13, CAR_HEIGHT - 2, 9, 3);
      ctx.shadowBlur = 0; // Reset shadow

      // Active Shield Orb Aura
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

      // Active Magnet Field Rings
      if (player.magnetTimer > 0) {
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const pulse = (Date.now() / 150) % 10;
        ctx.arc(CAR_WIDTH / 2, CAR_HEIGHT / 2, CAR_WIDTH + pulse, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();

      // Draw Particles (Smoke, Exhaust fire, Sparks, Flying text)
      particlesRef.current.forEach((p) => {
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

      // Speed lines during high speed / nitro boost
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

      ctx.restore(); // Restore shake translation

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      sound.stopEngine();
    };
  }, [
    mode,
    theme,
    vehicle,
    tunedStats,
    isPaused,
    touchInput,
    onGameOver,
    onStatsUpdate,
    spawnSparks,
    spawnTextParticle,
  ]);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-slate-950">
      <canvas
        ref={canvasRef}
        className="w-full h-full max-w-xl mx-auto block cursor-crosshair"
      />
    </div>
  );
};
