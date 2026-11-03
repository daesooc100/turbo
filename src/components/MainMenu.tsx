import React from 'react';
import { GameMode, EnvironmentTheme, UserSaveData } from '../types/game';
import { VEHICLES } from '../utils/constants';
import { Play, Wrench, Trophy, Volume2, VolumeX, Sparkles, Sun, Sunset, Moon } from 'lucide-react';
import { sound } from '../utils/audio';

interface MainMenuProps {
  mode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  theme: EnvironmentTheme;
  onSelectTheme: (theme: EnvironmentTheme) => void;
  saveData: UserSaveData;
  onStartGame: () => void;
  onOpenGarage: () => void;
  onToggleSound: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  mode,
  onSelectMode,
  theme,
  onSelectTheme,
  saveData,
  onStartGame,
  onOpenGarage,
  onToggleSound,
}) => {
  const currentVehicle =
    VEHICLES.find((v) => v.id === saveData.selectedVehicleId) || VEHICLES[0];
  const carColor = saveData.vehicleColors[currentVehicle.id] || currentVehicle.color;
  const currentHighScore = saveData.highScores[mode] || 0;

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col p-4 sm:p-6 my-auto select-none">
      {/* Top Header: Coins & Audio */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-3.5 py-1.5 rounded-full shadow-md">
          <span className="text-amber-400">🪙</span>
          <span className="font-mono-numbers font-bold text-amber-300">
            {saveData.coins.toLocaleString()}
          </span>
          <span className="text-xs text-slate-400">코인</span>
        </div>

        <button
          onClick={onToggleSound}
          aria-label={saveData.soundEnabled ? '음소거' : '소리 켜기'}
          className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 shadow-md transition-colors cursor-pointer"
        >
          {saveData.soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} className="text-slate-500" />}
        </button>
      </div>

      {/* Main Title Banner */}
      <div className="text-center mb-6">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white drop-shadow-md">
          터보 드라이브
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
          고속도로 아케이드 레이싱 · 트래픽 회피 & 아슬아슬 추월
        </p>
      </div>

      {/* Mode Selector Segmented Tabs */}
      <div className="flex flex-col gap-2 mb-5">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          게임 모드 선택
        </label>
        <div className="grid grid-cols-3 gap-2 p-1 bg-slate-900/80 border border-slate-800 rounded-2xl">
          {[
            { id: 'ENDLESS' as const, label: '무한 고속도로', icon: '🛣️' },
            { id: 'TIME_ATTACK' as const, label: '타임 어택', icon: '⏱️' },
            { id: 'POLICE_CHASE' as const, label: '경찰 추격전', icon: '🚨' },
          ].map((m) => {
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => {
                  onSelectMode(m.id);
                  sound.playCoin();
                }}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
                  active
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-900/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span>{m.icon}</span>
                <span className="whitespace-nowrap">{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Equipped Car Card & High Score */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        {/* Car Showcase Card */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-6 h-10 rounded-lg border border-slate-700 shadow-md"
              style={{ backgroundColor: carColor }}
            />
            <div>
              <div className="text-xs text-slate-400">장착 중인 차량</div>
              <div className="text-sm font-bold text-slate-100">{currentVehicle.nameKo}</div>
            </div>
          </div>

          <button
            onClick={onOpenGarage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            <Wrench size={13} /> 차고 & 튜닝
          </button>
        </div>

        {/* High Score Card */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 flex items-center gap-1">
              <Trophy size={13} className="text-amber-400" /> 모드 최고 기록
            </div>
            <div className="font-mono-numbers text-xl font-black text-amber-300">
              {currentHighScore.toLocaleString()}{' '}
              <span className="text-xs font-normal text-slate-400">점</span>
            </div>
          </div>

          <div className="text-right text-xs text-slate-400">
            <div>총 주행 {((saveData.stats.totalDistance || 0) / 1000).toFixed(1)} km</div>
          </div>
        </div>
      </div>

      {/* Environment Theme Selector */}
      <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 p-3 rounded-2xl mb-6">
        <span className="text-xs text-slate-400 font-medium pl-2">도로 시간대 배경</span>
        <div className="flex items-center gap-1.5">
          {[
            { id: 'DAY' as const, label: '낮', icon: Sun },
            { id: 'SUNSET' as const, label: '노을', icon: Sunset },
            { id: 'NIGHT' as const, label: '밤', icon: Moon },
          ].map((t) => {
            const active = theme === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => {
                  onSelectTheme(t.id);
                  sound.playCoin();
                }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  active
                    ? 'bg-slate-800 text-cyan-400 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon size={14} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Start Race Button */}
      <button
        onClick={onStartGame}
        className="w-full py-4 px-6 rounded-2xl bg-cyan-500 hover:bg-cyan-400 active:scale-98 text-slate-950 font-black text-base sm:text-lg tracking-wide shadow-xl shadow-cyan-900/40 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
      >
        <Play size={20} fill="currentColor" />
        <span>레이스 시작하기</span>
      </button>

      {/* Control Guide Tip */}
      <div className="mt-5 text-center text-xs text-slate-400/80">
        조작법: <kbd className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">A / D</kbd> 또는 방향키로 조향 ·{' '}
        <kbd className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">W / S</kbd> 가속/감속 ·{' '}
        <kbd className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">Space</kbd> 니트로 부스터 (모바일 터치 패드 완벽 지원)
      </div>
    </div>
  );
};
