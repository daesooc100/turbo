import React from 'react';
import { ArrowLeft, ArrowRight, ChevronUp, ChevronDown, Flame } from 'lucide-react';

interface TouchControlsProps {
  onInput: (action: 'left' | 'right' | 'accel' | 'brake' | 'nitro', active: boolean) => void;
  nitroAvailable: boolean;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ onInput, nitroAvailable }) => {
  return (
    <div className="w-full max-w-xl mx-auto px-4 py-3 flex items-center justify-between gap-4 select-none touch-none">
      {/* Left Steering Block */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onPointerDown={() => onInput('left', true)}
          onPointerUp={() => onInput('left', false)}
          onPointerLeave={() => onInput('left', false)}
          aria-label="좌측 방향 전환"
          className="w-16 h-16 rounded-2xl bg-slate-900/90 active:bg-cyan-600/30 border border-slate-700 active:border-cyan-400 text-slate-100 flex flex-col items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          <ArrowLeft size={24} />
          <span className="text-[10px] text-slate-400 font-mono">A / ◀</span>
        </button>

        <button
          type="button"
          onPointerDown={() => onInput('right', true)}
          onPointerUp={() => onInput('right', false)}
          onPointerLeave={() => onInput('right', false)}
          aria-label="우측 방향 전환"
          className="w-16 h-16 rounded-2xl bg-slate-900/90 active:bg-cyan-600/30 border border-slate-700 active:border-cyan-400 text-slate-100 flex flex-col items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          <ArrowRight size={24} />
          <span className="text-[10px] text-slate-400 font-mono">D / ▶</span>
        </button>
      </div>

      {/* Center Nitro Boost Button */}
      <div>
        <button
          type="button"
          onPointerDown={() => onInput('nitro', true)}
          onPointerUp={() => onInput('nitro', false)}
          onPointerLeave={() => onInput('nitro', false)}
          disabled={!nitroAvailable}
          aria-label="니트로 부스트 가동"
          className={`w-20 h-16 rounded-2xl flex flex-col items-center justify-center shadow-xl active:scale-95 transition-all border ${
            nitroAvailable
              ? 'bg-gradient-to-t from-cyan-600 to-sky-400 border-cyan-300 text-white shadow-cyan-500/25'
              : 'bg-slate-900/60 border-slate-800 text-slate-600 cursor-not-allowed'
          }`}
        >
          <Flame size={24} className={nitroAvailable ? 'animate-pulse' : ''} />
          <span className="text-[11px] font-bold tracking-tight">부스트</span>
          <span className="text-[9px] text-cyan-100/70 font-mono">SPACE</span>
        </button>
      </div>

      {/* Right Pedals Block (Brake & Gas) */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onPointerDown={() => onInput('brake', true)}
          onPointerUp={() => onInput('brake', false)}
          onPointerLeave={() => onInput('brake', false)}
          aria-label="브레이크 감속"
          className="w-16 h-16 rounded-2xl bg-slate-900/90 active:bg-rose-600/30 border border-slate-700 active:border-rose-500 text-rose-400 flex flex-col items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          <ChevronDown size={24} />
          <span className="text-[10px] text-slate-400 font-mono">S / ▼</span>
        </button>

        <button
          type="button"
          onPointerDown={() => onInput('accel', true)}
          onPointerUp={() => onInput('accel', false)}
          onPointerLeave={() => onInput('accel', false)}
          aria-label="가속 패달"
          className="w-16 h-16 rounded-2xl bg-slate-900/90 active:bg-emerald-600/30 border border-slate-700 active:border-emerald-400 text-emerald-400 flex flex-col items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          <ChevronUp size={24} />
          <span className="text-[10px] text-slate-400 font-mono">W / ▲</span>
        </button>
      </div>
    </div>
  );
};
