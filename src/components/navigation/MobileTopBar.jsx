import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Flame,
  SlidersHorizontal,
  HardDrive,
  HelpCircle,
  Download,
  Library
} from 'lucide-react';

/**
 * MobileTopBar — Minimalist Top App Bar for Mobile Phones (< 768px)
 * Designed for Bookshelf View:
 * - Left: Hogwarts Magic English Brand Icon & Subtitle
 * - Right: Streak flame badge + Quick tools dropdown
 * - Strictly 100% Lucide SVG, zero Unicode emojis
 */
function MobileTopBarComponent({
  currentView = 'bookshelf',
  onSwitchView,
  currentBook,
  currentChapter,
  onOpenShelf,
  studyMode = 'normal',
  setStudyMode,
  streakDays = 0,
  onOpenAnalytics,
  onOpenStorage,
  onOpenShortcuts,
  cachedChaptersCount = 0,
  canInstallPwa = false,
  onInstallPwa
}) {
  const [showTools, setShowTools] = useState(false);
  const toolsRef = useRef(null);

  useEffect(() => {
    if (!showTools) return;
    const handleClickOutside = (e) => {
      if (toolsRef.current && !toolsRef.current.contains(e.target)) {
        setShowTools(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTools]);

  return (
    <header className="md:hidden shrink-0 z-30 pt-safe bg-[#fbf9f5] border-b border-[#e8ddd0] select-none touch-manipulation">
      <div className="h-14 px-3 flex items-center justify-between gap-2">
        {/* ── Left: Brand Identity ──────────────────────────────────── */}
        <div className="flex items-center space-x-2.5 min-w-0 flex-1">
          <div className="p-2 rounded-xl bg-amber-500/15 text-amber-700 border border-amber-300/80 shrink-0">
            <Sparkles size={18} className="text-amber-700" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-magical font-bold text-sm sm:text-base text-amber-950 flex items-center gap-1.5 truncate">
              <span>霍格沃茨魔法英语</span>
              <span className="text-[10px] font-sans px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 border border-amber-200 font-bold shrink-0">
                藏书阁
              </span>
            </h1>
            <p className="text-[10px] text-stone-500 font-reading leading-tight truncate mt-0.5">
              原版有声书精听 · 双轨沉浸研学
            </p>
          </div>
        </div>

      {/* ── Right: Streak & Quick Tools ───────────────────────────── */}
      <div className="flex items-center gap-1.5 shrink-0" ref={toolsRef}>
        {/* Streak Pill */}
        <button
          onClick={onOpenAnalytics}
          className="flex items-center gap-1 px-2.5 py-1 min-h-[44px] rounded-xl border border-[#e8ddd0] bg-[#fbf9f5] text-xs font-mono font-bold text-orange-600 active:scale-95 transition-colors cursor-pointer"
          title={`连续打卡 ${streakDays} 天`}
        >
          <Flame size={13} className="fill-orange-500 text-orange-500" />
          <span>{streakDays}d</span>
        </button>

        {/* Tools Menu Trigger */}
        <div className="relative">
          <button
            onClick={() => setShowTools(!showTools)}
            className="duo-touch-target p-1.5 rounded-xl border border-[#e8ddd0] bg-[#fbf9f5] text-stone-600 hover:text-amber-950 active:scale-95 transition-colors"
            title="更多工具"
          >
            <SlidersHorizontal size={15} />
          </button>

          {/* Tools Popover */}
          {showTools && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-[#e8ddd0] bg-white p-2 z-50 animate-fadeIn space-y-1">
              <button
                onClick={() => {
                  setShowTools(false);
                  onOpenStorage();
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold text-stone-700 hover:bg-amber-50 hover:text-amber-950 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <HardDrive size={14} className="text-amber-700" />
                  <span>离线章节</span>
                </div>
                <span className="text-[10px] text-stone-400 font-mono">{cachedChaptersCount}</span>
              </button>

              <button
                onClick={() => {
                  setShowTools(false);
                  onOpenShortcuts();
                }}
                className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-stone-700 hover:bg-amber-50 hover:text-amber-950 transition-colors"
              >
                <HelpCircle size={14} className="text-amber-700" />
                <span>快捷键指南</span>
              </button>

              {canInstallPwa && onInstallPwa && (
                <button
                  onClick={() => {
                    setShowTools(false);
                    onInstallPwa();
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50/80 hover:bg-emerald-100/90 transition-colors"
                >
                  <Download size={14} />
                  <span>安装手机应用</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    </header>
  );
}

export const MobileTopBar = React.memo(MobileTopBarComponent);
export default MobileTopBar;
