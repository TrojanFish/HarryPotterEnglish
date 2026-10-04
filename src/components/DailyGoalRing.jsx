import React from 'react';
import { Timer, Check, Sparkles } from 'lucide-react';

/**
 * DailyGoalRing — Duolingo-style Daily 5-Min Goal Progress Ring (每日魔法契约进度环)
 * Visualizes the student's daily listening target (default: 5 minutes / 300 seconds).
 * Glowing golden burst on 100% completion.
 * Zero emojis, strictly parchment-compatible design.
 */
export function DailyGoalRing({
  todaySeconds = 0,
  targetSeconds = 300, // 5 minutes standard Duolingo micro-session
  size = 46,
  strokeWidth = 3.5,
  onClick,
  isParchment = true,
  minimal = false
}) {
  const percent = targetSeconds > 0 ? Math.min(100, Math.round((todaySeconds / targetSeconds) * 100)) : 0;
  const isCompleted = percent >= 100;
  
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  const currentMinutes = (todaySeconds / 60).toFixed(1);
  const targetMinutes = Math.round(targetSeconds / 60);

  const ringSvg = (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg 
        width={size} 
        height={size} 
        className="rotate-[-90deg] transition-all"
      >
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={isCompleted ? '#fcd34d' : '#e8ddd0'}
          strokeWidth={strokeWidth}
        />
        {/* Animated Progress Stroke */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={isCompleted ? '#10b981' : '#f59e0b'}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>

      {/* Center Icon */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {isCompleted ? (
          <Check size={size * 0.45} className="text-emerald-700 stroke-[3]" />
        ) : (
          <span className="font-sans font-extrabold text-[10px] text-amber-900">
            {percent}%
          </span>
        )}
      </div>
    </div>
  );

  if (minimal) {
    return ringSvg;
  }

  return (
    <button
      onClick={onClick}
      className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-2xl border transition-all duration-300 active:scale-95 cursor-pointer ${
        isCompleted
          ? 'bg-amber-100/90 border-amber-400/90 text-amber-950 ring-2 ring-amber-300/60'
          : 'bg-white/90 border-amber-300/80 hover:bg-amber-50 text-amber-950 hover:border-amber-400'
      }`}
      title={`今日魔法契约: 已听 ${currentMinutes} / ${targetMinutes} 分钟 (${percent}%)`}
      aria-label={`今日魔法契约目标进度 ${percent}%`}
    >
      {ringSvg}

      {/* Progress Label */}
      <div className="flex flex-col text-left">
        <div className="flex items-center gap-1 font-bold text-xs leading-tight text-amber-950">
          {isCompleted ? (
            <>
              <Sparkles size={12} className="text-amber-600 animate-spin-slow" />
              <span>今日契约达成！</span>
            </>
          ) : (
            <>
              <Timer size={12} className="text-amber-700" />
              <span>今日契约 <span className="font-mono font-bold">{percent}%</span></span>
            </>
          )}
        </div>
        <span className="text-[11px] font-reading text-stone-500 leading-tight">
          {currentMinutes}/{targetMinutes} 分钟
        </span>
      </div>
    </button>
  );
}

export default DailyGoalRing;
