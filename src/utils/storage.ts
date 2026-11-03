import { UserSaveData, VehicleUpgrades } from '../types/game';
import { VEHICLES, DEFAULT_UPGRADES } from './constants';

const STORAGE_KEY = 'turbo_drive_save_v1';

const DEFAULT_SAVE_DATA: UserSaveData = {
  coins: 150, // Starting bonus coins so player can experience upgrading right away!
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
    red_speeder: { ...DEFAULT_UPGRADES },
    cyber_lightning: { ...DEFAULT_UPGRADES },
    beast_suv: { ...DEFAULT_UPGRADES },
    formula_apex: { ...DEFAULT_UPGRADES },
    interceptor: { ...DEFAULT_UPGRADES },
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

export function loadSaveData(): UserSaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SAVE_DATA;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SAVE_DATA,
      ...parsed,
      highScores: {
        ...DEFAULT_SAVE_DATA.highScores,
        ...(parsed.highScores || {}),
      },
      stats: {
        ...DEFAULT_SAVE_DATA.stats,
        ...(parsed.stats || {}),
      },
      upgrades: {
        ...DEFAULT_SAVE_DATA.upgrades,
        ...(parsed.upgrades || {}),
      },
    };
  } catch {
    return DEFAULT_SAVE_DATA;
  }
}

export function saveSaveData(data: UserSaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or disabled in private browsing
  }
}

export function calculateVehicleStats(vehicleId: string, upgrades: VehicleUpgrades) {
  const base = VEHICLES.find((v) => v.id === vehicleId) || VEHICLES[0];
  const u = upgrades || DEFAULT_UPGRADES;

  return {
    topSpeed: Math.round(base.speed + (u.speedLevel || 0) * 12),
    acceleration: Math.round(base.acceleration + (u.accelLevel || 0) * 4),
    handling: Math.round(base.handling + (u.handlingLevel || 0) * 3),
    maxNitro: Math.round(100 + (u.nitroLevel || 0) * 15),
    magnetDuration: Math.round(10 + (u.magnetLevel || 0) * 2), // seconds
    armor: base.armor,
  };
}
