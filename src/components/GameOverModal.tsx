import React, { useEffect } from 'react';
import { GameMode, GameStats } from '../types/game';
import confetti from 'canvas-confetti';
import { RotateCcw, Home, Wrench, Trophy, Sparkles } from 'lucide-react';

interface GameOverModalProps {
  mode: GameMode;
  stats: GameStats;
  isNewRecord: boolean;
  onRestart: () => void;
  onOpenGarage: () => void;
  onBackToMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  mode,
  stats,
  isNewRecord,
  onRestart,
  onOpenGarage,
  onBackToMenu,
}) => {
  useEffect(() => {
    if (isNewRecord) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [isNewRecord]);

  const distanceKm = (stats.distance / 1000).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center">
        {/* Title */}
        {isNewRecord ? (
          <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold mb-3 animate-bounce">
            <Trophy size={14} /> 최고 기록 갱신!
          </div>
        ) : (
          <div className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-2">
            게임 종료
          </div>
        )}

        <h2 className="text-3xl font-black text-white tracking-tight mb-1">
          {stats.score.toLocaleString()} 점
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          {mode === 'ENDLESS' && '무한 고속도로 질주 결과'}
          {mode === 'TIME_ATTACK' && '타임 어택 체크포인트 결과'}
          {mode === 'POLICE_CHASE' && '경찰 추격전 추격 결과'}
        </p>

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-2 gap-3 mb-6">
          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <div className="text-xs text-slate-400 mb-0.5">주행 거리</div>
            <div className="font-mono-numbers text-lg font-bold text-slate-100">
              {distanceKm} km
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <div className="text-xs text-slate-400 mb-0.5">획득 코인</div>
            <div className="font-mono-numbers text-lg font-bold text-amber-400 flex items-center justify-center gap-1">
              🪙 +{stats.coinsCollected}
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <div className="text-xs text-slate-400 mb-0.5">아슬아슬 추월</div>
            <div className="font-mono-numbers text-lg font-bold text-sky-400">
              {stats.nearMisses} 회
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <div className="text-xs text-slate-400 mb-0.5">최고 속도 달성</div>
            <div className="font-mono-numbers text-lg font-bold text-rose-400">
              {stats.maxSpeedReached} km/h
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            onClick={onRestart}
            className="w-full py-3.5 px-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-cyan-900/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <RotateCcw size={18} /> 다시 달리기 (Play Again)
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={onOpenGarage}
              className="py-3 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer"
            >
              <Wrench size={16} /> 차고 & 튜닝
            </button>

            <button
              onClick={onBackToMenu}
              className="py-3 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer"
            >
              <Home size={16} /> 메인 로비
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
