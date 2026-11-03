import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onQuit,
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col items-center text-center">
        <h2 className="text-2xl font-black text-white tracking-tight mb-2">게임 일시정지</h2>
        <p className="text-xs text-slate-400 mb-6">잠시 숨을 고르고 레이스를 준비하세요.</p>

        <div className="w-full flex flex-col gap-2.5">
          <button
            onClick={onResume}
            className="w-full py-3.5 px-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-cyan-950/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Play size={18} fill="currentColor" /> 계속 달리기
          </button>

          <button
            onClick={onRestart}
            className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer"
          >
            <RotateCcw size={16} /> 처음부터 다시 하기
          </button>

          <button
            onClick={onQuit}
            className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer"
          >
            <Home size={16} /> 메인 로비로 이동
          </button>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-800 w-full flex items-center justify-between text-xs text-slate-400">
          <span>음향 효과</span>
          <button
            onClick={onToggleSound}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} className="text-slate-500" />}
          </button>
        </div>
      </div>
    </div>
  );
};
