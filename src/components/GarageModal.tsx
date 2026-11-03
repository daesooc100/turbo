import React, { useState } from 'react';
import { Vehicle, VehicleUpgrades, UserSaveData } from '../types/game';
import { VEHICLES, UPGRADE_PRICES, DEFAULT_UPGRADES } from '../utils/constants';
import { calculateVehicleStats } from '../utils/storage';
import { sound } from '../utils/audio';
import { ArrowLeft, Check, Lock, Zap, Gauge, Shield, Wrench, Magnet, Flame, Palette } from 'lucide-react';

interface GarageModalProps {
  saveData: UserSaveData;
  onUpdateSaveData: (updater: (prev: UserSaveData) => UserSaveData) => void;
  onClose: () => void;
}

const COLOR_PALETTE = [
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#eab308', // Amber Gold
  '#8b5cf6', // Purple
  '#10b981', // Emerald
  '#ec4899', // Pink
  '#f8fafc', // White
  '#0f172a', // Deep Slate
];

export const GarageModal: React.FC<GarageModalProps> = ({
  saveData,
  onUpdateSaveData,
  onClose,
}) => {
  const [selectedId, setSelectedId] = useState<string>(saveData.selectedVehicleId);
  const currentVehicle = VEHICLES.find((v) => v.id === selectedId) || VEHICLES[0];
  const isUnlocked = saveData.unlockedVehicles.includes(selectedId);
  const isEquipped = saveData.selectedVehicleId === selectedId;

  const currentUpgrades: VehicleUpgrades =
    saveData.upgrades[selectedId] || { ...DEFAULT_UPGRADES };

  const currentStats = calculateVehicleStats(selectedId, currentUpgrades);

  // Buy Car Handler
  const handleBuyCar = () => {
    if (saveData.coins < currentVehicle.price) return;

    sound.playPowerup();
    onUpdateSaveData((prev) => ({
      ...prev,
      coins: prev.coins - currentVehicle.price,
      unlockedVehicles: [...prev.unlockedVehicles, currentVehicle.id],
      selectedVehicleId: currentVehicle.id,
    }));
  };

  // Equip Car Handler
  const handleEquipCar = () => {
    sound.playCoin();
    onUpdateSaveData((prev) => ({
      ...prev,
      selectedVehicleId: selectedId,
    }));
  };

  // Upgrade Part Handler
  const handleUpgrade = (part: keyof VehicleUpgrades) => {
    const currentLevel = currentUpgrades[part] || 0;
    if (currentLevel >= 5) return;
    const cost = UPGRADE_PRICES[currentLevel];
    if (saveData.coins < cost) return;

    sound.playPowerup();
    onUpdateSaveData((prev) => {
      const existingVehicleUpgrades = prev.upgrades[selectedId] || { ...DEFAULT_UPGRADES };
      return {
        ...prev,
        coins: prev.coins - cost,
        upgrades: {
          ...prev.upgrades,
          [selectedId]: {
            ...existingVehicleUpgrades,
            [part]: currentLevel + 1,
          },
        },
      };
    });
  };

  // Change Paint Color
  const handleChangeColor = (hex: string) => {
    sound.playCoin();
    onUpdateSaveData((prev) => ({
      ...prev,
      vehicleColors: {
        ...prev.vehicleColors,
        [selectedId]: hex,
      },
    }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col p-4 sm:p-6 overflow-y-auto">
      {/* Top Header */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between pb-4 border-b border-slate-800">
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors cursor-pointer text-sm font-medium"
        >
          <ArrowLeft size={18} />
          <span>로비로 나가기</span>
        </button>

        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3.5 py-1.5 rounded-full">
          <span className="text-amber-400">🪙</span>
          <span className="font-mono-numbers font-bold text-amber-300">
            {saveData.coins.toLocaleString()}
          </span>
          <span className="text-xs text-amber-400/80">코인</span>
        </div>
      </div>

      {/* Main Garage Layout */}
      <div className="max-w-4xl w-full mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 my-auto pt-6">
        {/* Left: Vehicle Carousel Selector */}
        <div className="md:col-span-5 flex flex-col gap-4">
          <h2 className="text-sm font-semibold tracking-wider text-slate-400 uppercase">
            차량 컬렉션
          </h2>
          <div className="flex flex-col gap-2.5">
            {VEHICLES.map((car) => {
              const carUnlocked = saveData.unlockedVehicles.includes(car.id);
              const carSelected = selectedId === car.id;
              const carColor = saveData.vehicleColors[car.id] || car.color;

              return (
                <button
                  key={car.id}
                  onClick={() => {
                    setSelectedId(car.id);
                    sound.playCoin();
                  }}
                  className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    carSelected
                      ? 'bg-slate-900 border-cyan-500 shadow-lg shadow-cyan-950/30 ring-1 ring-cyan-500'
                      : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Color dot or preview */}
                    <div
                      className="w-5 h-8 rounded-md border border-slate-700 shadow-sm flex items-center justify-center shrink-0"
                      style={{ backgroundColor: carColor }}
                    />
                    <div>
                      <div className="text-sm font-bold text-slate-100">{car.nameKo}</div>
                      <div className="text-xs text-slate-400">최고 {car.speed} km/h</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {carUnlocked ? (
                      saveData.selectedVehicleId === car.id ? (
                        <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-md">
                          장착 중
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">보유함</span>
                      )
                    ) : (
                      <div className="flex items-center gap-1 text-xs font-mono font-bold text-amber-400 bg-amber-950/40 border border-amber-900/40 px-2 py-0.5 rounded-md">
                        <Lock size={12} />
                        <span>{car.price} 🪙</span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Car Showcase & Tuning Shop */}
        <div className="md:col-span-7 flex flex-col gap-5 bg-slate-900/60 border border-slate-800 p-5 rounded-3xl">
          {/* Car Hero Card */}
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-black text-white">{currentVehicle.nameKo}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{currentVehicle.description}</p>
              </div>

              {/* Action Button: Equip or Buy */}
              {isUnlocked ? (
                <button
                  onClick={handleEquipCar}
                  disabled={isEquipped}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isEquipped
                      ? 'bg-slate-800 text-slate-400 cursor-default'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40'
                  }`}
                >
                  {isEquipped ? (
                    <>
                      <Check size={14} /> 장착됨
                    </>
                  ) : (
                    '선택하기'
                  )}
                </button>
              ) : (
                <button
                  onClick={handleBuyCar}
                  disabled={saveData.coins < currentVehicle.price}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    saveData.coins >= currentVehicle.price
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-950/40'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Lock size={14} />
                  <span>{currentVehicle.price} 코인으로 잠금 해제</span>
                </button>
              )}
            </div>

            {/* Color Customizer */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Palette size={13} /> 도색:
              </span>
              <div className="flex items-center gap-1.5">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c}
                    onClick={() => handleChangeColor(c)}
                    className="w-5 h-5 rounded-full border border-slate-700 hover:scale-110 transition-transform cursor-pointer"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Current Performance Radar Bars */}
          <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span className="flex items-center gap-1">
                  <Gauge size={13} className="text-cyan-400" /> 최고 속도
                </span>
                <span className="font-mono-numbers font-bold text-white">
                  {currentStats.topSpeed} km/h
                </span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400"
                  style={{ width: `${Math.min(100, (currentStats.topSpeed / 310) * 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span className="flex items-center gap-1">
                  <Zap size={13} className="text-amber-400" /> 가속도
                </span>
                <span className="font-mono-numbers font-bold text-white">
                  {currentStats.acceleration}
                </span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400"
                  style={{ width: `${Math.min(100, (currentStats.acceleration / 55) * 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span className="flex items-center gap-1">
                  <Wrench size={13} className="text-emerald-400" /> 핸들링
                </span>
                <span className="font-mono-numbers font-bold text-white">
                  {currentStats.handling}
                </span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400"
                  style={{ width: `${Math.min(100, (currentStats.handling / 55) * 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span className="flex items-center gap-1">
                  <Shield size={13} className="text-rose-400" /> 내구도 (장갑)
                </span>
                <span className="font-mono-numbers font-bold text-white">
                  Lv.{currentStats.armor}
                </span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-400"
                  style={{ width: `${(currentStats.armor / 4) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Performance Tuning Shop */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              성능 튜닝 & 업그레이드
            </h4>

            {[
              {
                id: 'speedLevel' as const,
                label: '엔진 출력 (최고 속도)',
                icon: Gauge,
                color: 'text-cyan-400',
              },
              {
                id: 'accelLevel' as const,
                label: '터보 트윈 (가속력)',
                icon: Zap,
                color: 'text-amber-400',
              },
              {
                id: 'handlingLevel' as const,
                label: '서스펜션 (핸들링 회피)',
                icon: Wrench,
                color: 'text-emerald-400',
              },
              {
                id: 'nitroLevel' as const,
                label: '니트로 부스터 탱크 용량',
                icon: Flame,
                color: 'text-sky-400',
              },
              {
                id: 'magnetLevel' as const,
                label: '마그넷 코인 흡수기 지속시간',
                icon: Magnet,
                color: 'text-purple-400',
              },
            ].map((part) => {
              const currentLvl = currentUpgrades[part.id] || 0;
              const isMax = currentLvl >= 5;
              const nextPrice = !isMax ? UPGRADE_PRICES[currentLvl] : 0;
              const canAfford = saveData.coins >= nextPrice;

              return (
                <div
                  key={part.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80"
                >
                  <div className="flex items-center gap-2.5">
                    <part.icon size={16} className={part.color} />
                    <div>
                      <div className="text-xs font-bold text-slate-200">{part.label}</div>
                      {/* 5-step upgrade dots */}
                      <div className="flex items-center gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map((step) => (
                          <div
                            key={step}
                            className={`w-3.5 h-1.5 rounded-sm ${
                              step <= currentLvl ? 'bg-cyan-400' : 'bg-slate-800'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {isMax ? (
                    <span className="text-xs font-bold text-slate-500 px-3 py-1">MAX</span>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(part.id)}
                      disabled={!canAfford}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        canAfford
                          ? 'bg-slate-800 hover:bg-cyan-600 text-slate-100 border border-slate-700 hover:border-cyan-400'
                          : 'bg-slate-900/60 text-slate-600 border border-slate-800/80 cursor-not-allowed'
                      }`}
                    >
                      +{nextPrice} 🪙
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
