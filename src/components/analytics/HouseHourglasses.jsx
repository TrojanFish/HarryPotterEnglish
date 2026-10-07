import React from 'react';
import { Sparkles, Trophy, Shield, RefreshCw } from 'lucide-react';
import { HOUSES } from '../../constants/hogwartsTheme.js';
import { WaxSealBadge } from '../common/WaxSealBadge.jsx';

/**
 * HouseHourglasses — Great Hall Four Houses Gem Hourglasses (礼堂四大学院魔法沙漏)
 * - Gryffindor: Ruby red gems
 * - Slytherin: Emerald green gems
 * - Ravenclaw: Sapphire blue gems
 * - Hufflepuff: Topaz yellow gems
 * Dynamically computes user's earned House Points from listening time and chapter conquests.
 * Strictly 100% Zero-Emoji Compliant.
 */
export function HouseHourglasses({
  userHouse = 'gryffindor',
  summary = {},
  onOpenHouseSelector
}) {
  // Calculate earned points
  const listeningMins = Math.floor((summary?.totalListeningSeconds || 0) / 60);
  const chapterPts = (summary?.completedChaptersCount || 0) * 50;
  const streakPts = (summary?.streakDays || 0) * 20;
  const userEarnedPts = listeningMins + chapterPts + streakPts;

  // Base house points baseline
  const housePoints = {
    gryffindor: 280 + (userHouse === 'gryffindor' ? userEarnedPts : 0),
    slytherin: 270 + (userHouse === 'slytherin' ? userEarnedPts : 0),
    ravenclaw: 260 + (userHouse === 'ravenclaw' ? userEarnedPts : 0),
    hufflepuff: 250 + (userHouse === 'hufflepuff' ? userEarnedPts : 0)
  };

  const maxPoints = Math.max(...Object.values(housePoints), 400);

  const houseList = ['gryffindor', 'slytherin', 'ravenclaw', 'hufflepuff'];

  return (
    <div className="house-hourglasses-container p-4 sm:p-5 rounded-2xl border border-amber-300/80 bg-gradient-to-b from-[#fbf9f5] to-amber-50/50 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-800 border border-amber-400/50">
            <Trophy size={16} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold font-magical text-amber-950 flex items-center gap-1.5 flex-wrap">
              <span>礼堂学院沙漏 · 学院杯争夺战</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-900 border border-amber-300 font-sans font-bold whitespace-nowrap shrink-0">
                House Points
              </span>
            </h3>
            <p className="text-[11px] text-stone-500">
              每专注聆听 1 分钟 +1 分 · 征服章节 +50 分 · 连续执杖 +20 分/天
            </p>
          </div>
        </div>

        {onOpenHouseSelector && (
          <button
            onClick={onOpenHouseSelector}
            className="duo-touch-target px-2.5 py-1.5 rounded-xl border border-amber-300/80 bg-white hover:bg-amber-50 text-[11px] font-bold text-amber-900 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
            title="重新挑选学院归属"
            aria-label="切换学院"
          >
            <RefreshCw size={12} />
            <span className="hidden sm:inline">重新分院</span>
          </button>
        )}
      </div>

      {/* 4 Glass Hourglasses Grid */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        {houseList.map((id) => {
          const house = HOUSES[id];
          const points = housePoints[id];
          const fillPercent = Math.min(100, Math.max(15, Math.round((points / maxPoints) * 100)));
          const isUser = userHouse === id;

          return (
            <div
              key={id}
              className={`flex flex-col items-center p-2.5 sm:p-3 rounded-xl border transition-all ${
                isUser
                  ? 'bg-white border-amber-400 ring-2 ring-amber-400/30 shadow-sm'
                  : 'bg-white/60 border-stone-200/80 hover:bg-white'
              }`}
            >
              {/* House Title */}
              <div className="flex items-center gap-1 mb-1.5 text-center">
                <span className="text-[11px] sm:text-xs font-bold text-amber-950 truncate">
                  {house.nameZh}
                </span>
                {isUser && (
                  <WaxSealBadge text="H" size={14} title="你的学籍所属学院" />
                )}
              </div>

              {/* Glass Tube Container */}
              <div className="relative w-10 sm:w-12 h-28 sm:h-36 rounded-full border-2 border-stone-300/90 bg-stone-100/60 p-1 flex flex-col justify-end overflow-hidden shadow-inner">
                {/* Subtle glass reflection highlight */}
                <div className="absolute inset-y-0 left-1 w-1 bg-white/70 rounded-full pointer-events-none z-10" />

                {/* Gem Fill */}
                <div
                  className="w-full rounded-b-full rounded-t-sm transition-all duration-700 ease-out relative overflow-hidden"
                  style={{
                    height: `${fillPercent}%`,
                    backgroundColor: house.gemColor,
                    boxShadow: `0 0 10px ${house.gemColor}66`
                  }}
                >
                  {/* Gem Shimmer Effect */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/30" />
                </div>
              </div>

              {/* Points Tally */}
              <div className="mt-2 text-center">
                <div className="text-xs sm:text-sm font-bold font-mono text-amber-950">
                  {points}
                  <span className="text-[9px] text-stone-500 ml-0.5 font-sans">分</span>
                </div>
                <div className="text-[9px] text-stone-400 truncate max-w-[55px] sm:max-w-none">
                  {house.nameEn}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default HouseHourglasses;
