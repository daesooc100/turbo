export type GameMode = 'ENDLESS' | 'TIME_ATTACK' | 'POLICE_CHASE';
export type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'GARAGE';
export type EnvironmentTheme = 'DAY' | 'SUNSET' | 'NIGHT';

export interface Vehicle {
  id: string;
  name: string;
  nameKo: string;
  price: number;
  unlocked: boolean;
  color: string;
  secondaryColor: string;
  accentColor: string;
  description: string;
  speed: number;       // Base top speed (180 - 280 km/h)
  acceleration: number;// Accel factor
  handling: number;    // Lateral movement speed
  armor: number;       // Max hits/durability (1 - 4)
  style: 'sport' | 'muscle' | 'cyber' | 'formula' | 'suv' | 'police';
}

export interface VehicleUpgrades {
  speedLevel: number;      // 0 - 5
  accelLevel: number;      // 0 - 5
  handlingLevel: number;   // 0 - 5
  nitroLevel: number;      // 0 - 5
  magnetLevel: number;     // 0 - 5
}

export interface TrafficCar {
  id: number;
  x: number;
  y: number;
  targetX: number;
  lane: number;
  targetLane: number;
  width: number;
  height: number;
  speed: number;
  color: string;
  type: 'sedan' | 'truck' | 'taxi' | 'sports' | 'police' | 'bus';
  isChangingLane: boolean;
  laneChangeTimer: number;
  laneBlinker: 'none' | 'left' | 'right';
  hasPassedPlayer: boolean;
  nearMissAwarded: boolean;
  sirenActive?: boolean;
}

export type PickupType = 'coin' | 'nitro' | 'repair' | 'shield' | 'magnet';

export interface PickupItem {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: PickupType;
  value: number;
  collected: boolean;
  pulseTimer: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  type: 'smoke' | 'spark' | 'fire' | 'coin' | 'speedline' | 'text';
  text?: string;
}

export interface PlayerState {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number; // km/h
  targetSpeed: number;
  maxSpeed: number;
  acceleration: number;
  handling: number;
  nitro: number; // 0 - 100
  maxNitro: number;
  isNitroActive: boolean;
  health: number; // Current health (0 - 100)
  maxHealth: number;
  shieldTimer: number; // Seconds remaining
  magnetTimer: number;
  turnDirection: number; // -1 left, 1 right, 0 straight
  isBraking: boolean;
  invulnerableTimer: number; // After getting hit
}

export interface GameStats {
  score: number;
  distance: number; // meters
  coinsCollected: number;
  nearMisses: number;
  maxSpeedReached: number;
  combo: number;
  comboTimer: number;
  timeRemaining: number; // For Time Attack (seconds)
  policeDistance: number; // For Police Chase (0 - 100, 0 = caught)
}

export interface UserSaveData {
  coins: number;
  selectedVehicleId: string;
  unlockedVehicles: string[];
  vehicleColors: Record<string, string>;
  upgrades: Record<string, VehicleUpgrades>;
  highScores: {
    ENDLESS: number;
    TIME_ATTACK: number;
    POLICE_CHASE: number;
  };
  stats: {
    totalDistance: number;
    totalGames: number;
    totalNearMisses: number;
  };
  soundEnabled: boolean;
}
