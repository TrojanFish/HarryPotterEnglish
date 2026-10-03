import React, { useEffect, useState } from 'react';
import { Shield, ShieldAlert, Zap, Flame, Award, Timer } from 'lucide-react';
import { playMistakeThud, playComboArpeggio } from '../../utils/spellAudioSynthesizer';

/**
 * DuelingSurvivalBar — Mode 4: 决斗俱乐部 · 限时生存闯关状态条
 * Dueling Club game mechanics:
 * - 3 Protego Shields (HP)
 * - 25-second countdown timer per sentence
 * - Combo bonuses: 3 combo restores 1 shield + triggers Incendio flame
 * - Zero emojis, pure parchment daylight palette
 */
export function DuelingSurvivalBar({
  shields = 3,
  maxShields = 3,
  timeRemaining = 25,
  maxTime = 25,
  streakCount = 0,
  isPaused = false,
  onTimeout
}) {
  const timePercent = Math.max(0, Math.min(100, (timeRemaining / maxTime) * 100));
  const isUrgent = timeRemaining <= 6;

  return (
    <div className="p-3.5 sm:p-4 rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 via-white to-amber-50 flex flex-col gap-2.5 mb-5 select-none animate-fadeIn">
      <div className="flex items-center justify-between">
        {/* Shields (Protego) */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
            <Shield size={14} className="text-amber-700" />
            <span>盔甲护盾:</span>
          </span>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: maxShields }).map((_, idx) => {
              const isIntact = idx < shields;
              return (
                <div
                  key={idx}
                  className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                    isIntact
                      ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white'
                      : 'bg-slate-200 text-slate-400 border border-dashed border-slate-300'
                  }`}
                  title={isIntact ? '魔法护盾完好' : '护盾已破碎'}
                >
                  {isIntact ? <Shield size={15} /> : <ShieldAlert size={14} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Combo & Golden Snitch status */}
        <div className="flex items-center gap-2">
          {streakCount >= 3 && (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-orange-500 to-amber-600 text-white text-xs font-bold rounded-full animate-pulse">
              <Flame size={13} />
              <span>炽热连击 x{streakCount}</span>
            </span>
          )}

          <div className={`flex items-center gap-1 text-xs font-mono font-bold px-2.5 py-1 rounded-xl border ${
            isUrgent 
              ? 'border-red-400 bg-red-50 text-red-700 animate-bounce' 
              : 'border-amber-300 bg-white text-amber-900'
          }`}>
            <Timer size={13} className={isUrgent ? 'text-red-600' : 'text-amber-600'} />
            <span>{timeRemaining}s</span>
          </div>
        </div>
      </div>

      {/* Countdown Progress Line */}
      <div className="w-full h-2 rounded-full bg-amber-200/60 overflow-hidden relative">
        <div
          className={`h-full transition-all duration-1000 ease-linear rounded-full ${
            isUrgent
              ? 'bg-gradient-to-r from-red-500 to-orange-500 animate-pulse'
              : 'bg-gradient-to-r from-amber-500 to-amber-600'
          }`}
          style={{ width: `${timePercent}%` }}
        />
      </div>
    </div>
  );
}

export default DuelingSurvivalBar;
