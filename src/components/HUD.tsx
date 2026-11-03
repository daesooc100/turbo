import React from 'react';
import { GameMode, GameStats, PlayerState } from '../types/game';
import { Volume2, VolumeX, Pause, Play, Flame, Shield, Compass } from 'lucide-react';

interface HUDProps {
  mode: GameMode;
  stats: GameStats;
  player: PlayerState;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isPaused: boolean;
  onTogglePause: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  mode,
  stats,
  player,
  soundEnabled,
  onToggleSound,
  isPaused,
  onTogglePause,
}) => {
  const nitroPercent = Math.min(100, Math.round((player.nitro / player.maxNitro) * 100));
  const healthPercent = Math.max(0, Math.min(100, Math.round(player.health)));
  const distanceKm = (stats.distance / 1000).toFixed(2);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-10">
      {/* Top Bar: Stats & Controls */}
      <div className="flex items-start justify-between gap-4">
        {/* Left: Score & Distance */}
        <div className="flex flex-col gap-1 bg-slate-900/80 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-800 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">점수</span>
            <span className="font-mono-numbers text-xl font-bold text-amber-400">
              {stats.score.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>거리 <strong className="text-slate-200 font-mono-numbers">{distanceKm} km</strong></span>
            <span>·</span>
            <span className="flex items-center gap-1 text-amber-300">
              🪙 <strong className="font-mono-numbers">{stats.coinsCollected}</strong>
            </span>
          </div>
        </div>

        {/* Center: Mode Special Metric (Timer or Police Meter) */}
        {mode === 'TIME_ATTACK' && (
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-md border shadow-lg ${
              stats.timeRemaining <= 10
                ? 'bg-rose-950/80 border-rose-500 text-rose-400 animate-pulse'
                : 'bg-slate-900/80 border-slate-800 text-slate-200'
            }`}
          >
            <span className="text-xs font-semibold">남은 시간</span>
            <span className="font-mono-numbers text-2xl font-black">
              {Math.max(0, stats.timeRemaining).toFixed(1)}s
            </span>
          </div>
        )}

        {mode === 'POLICE_CHASE' && (
          <div className="flex flex-col items-center bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-800 shadow-lg">
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
              <span className="animate-ping inline-block w-2 h-2 rounded-full bg-rose-500" />
              <span>경찰과의 거리</span>
              <span className="font-mono-numbers font-bold text-rose-400">
                {Math.round(stats.policeDistance)}%
              </span>
            </div>
            <div className="w-28 h-2 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-150 ${
                  stats.policeDistance < 30 ? 'bg-rose-500' : 'bg-amber-400'
                }`}
                style={{ width: `${stats.policeDistance}%` }}
              />
            </div>
          </div>
        )}

        {/* Right: Quick Action Buttons (Interactive pointer-events enabled) */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={onToggleSound}
            aria-label={soundEnabled ? '음소거' : '소리 켜기'}
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 active:scale-95 border border-slate-800 text-slate-200 shadow-md transition-all cursor-pointer"
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} className="text-slate-500" />}
          </button>
          <button
            onClick={onTogglePause}
            aria-label={isPaused ? '계속하기' : '일시정지'}
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 active:scale-95 border border-slate-800 text-slate-200 shadow-md transition-all cursor-pointer"
          >
            {isPaused ? <Play size={18} /> : <Pause size={18} />}
          </button>
        </div>
      </div>

      {/* Middle Banner: Combo Multiplier Alert */}
      {stats.combo > 1 && (
        <div className="self-center animate-bounce flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/90 to-orange-500/90 text-white font-black text-sm shadow-xl border border-amber-300/40">
          <span>🔥 아슬아슬 추월 콤보!</span>
          <span className="font-mono-numbers text-base font-black">x{stats.combo}</span>
        </div>
      )}

      {/* Bottom Gauges: Speedometer, Nitro, Durability */}
      <div className="flex items-end justify-between gap-4">
        {/* Speedometer Display */}
        <div className="bg-slate-900/85 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-800 shadow-xl flex items-baseline gap-2">
          <span className="font-mono-numbers text-4xl sm:text-5xl font-black tracking-tight text-white">
            {Math.round(player.speed)}
          </span>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">KM/H</span>
        </div>

        {/* Center Gauges: Durability & Nitro Boost Meter */}
        <div className="flex-1 max-w-xs flex flex-col gap-2 bg-slate-900/85 backdrop-blur-md p-3 rounded-2xl border border-slate-800 shadow-xl">
          {/* Health / Durability */}
          <div>
            <div className="flex justify-between items-center text-xs font-medium mb-1">
              <span className="text-slate-400 flex items-center gap-1">
                <Shield size={13} className="text-emerald-400" /> 차량 내구도
              </span>
              <span className="font-mono-numbers text-slate-200">{healthPercent}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
              <div
                className={`h-full transition-all duration-200 ${
                  healthPercent > 50
                    ? 'bg-emerald-500'
                    : healthPercent > 25
                    ? 'bg-amber-500'
                    : 'bg-rose-500 animate-pulse'
                }`}
                style={{ width: `${healthPercent}%` }}
              />
            </div>
          </div>

          {/* Nitro Boost Gauge */}
          <div>
            <div className="flex justify-between items-center text-xs font-medium mb-1">
              <span className="text-slate-400 flex items-center gap-1">
                <Flame
                  size={13}
                  className={player.isNitroActive ? 'text-cyan-400 animate-bounce' : 'text-slate-400'}
                />{' '}
                니트로 터보
              </span>
              <span className="font-mono-numbers text-cyan-300">{nitroPercent}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
              <div
                className={`h-full transition-all duration-100 ${
                  player.isNitroActive
                    ? 'bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.8)]'
                    : 'bg-cyan-600'
                }`}
                style={{ width: `${nitroPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
