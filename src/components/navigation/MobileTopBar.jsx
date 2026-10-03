import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  ArrowLeft,
  Flame,
  SlidersHorizontal,
  HardDrive,
  HelpCircle,
  Download,
  ChevronDown,
  Library,
  Volume2,
  EyeOff,
  Zap
} from 'lucide-react';
import { formatEnglishText } from '../../utils/vttParser';

/**
 * MobileTopBar — Minimalist Top App Bar for Mobile Phones (< 768px)
 * Replaces the cluttered 7-button desktop header on narrow screens:
 * - Left: Back to bookshelf / Chapter quick drawer trigger
 * - Center: Compact mode selector pill
 * - Right: Streak flame badge + Quick tools dropdown
 * - Strictly 100% Lucide SVG, zero Unicode emojis
 */
export function MobileTopBar({
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

  const rawChapterTitle = currentChapter ? (currentChapter.cnTitle || currentChapter.title) : '选择章节';
  const cleanChapterTitle = formatEnglishText(rawChapterTitle);

  return (
    <header className="md:hidden sticky top-0 z-30 pt-safe bg-white/95 border-b border-[#eee5d8] backdrop-blur-md px-3 flex items-center justify-between select-none min-h-[3.25rem]">
      {/* ── Left: Context Action ──────────────────────────────────── */}
      <div className="flex items-center gap-2 min-w-0">
        {currentView === 'player' ? (
          <button
            onClick={() => onSwitchView && onSwitchView('bookshelf')}
            className="duo-touch-target p-1.5 rounded-xl border border-[#eee5d8] bg-[#fbf9f5] hover:bg-stone-100 text-stone-700 active:scale-95 transition-colors"
            title="返回魔法书架"
          >
            <ArrowLeft size={16} />
          </button>
        ) : (
          <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-white shrink-0">
            <Sparkles size={16} className="text-white stroke-[2.5]" />
          </div>
        )}

        {/* Title or Chapter Trigger */}
        {currentView === 'player' ? (
          <button
            onClick={onOpenShelf}
            className="flex items-center gap-1 text-xs font-bold text-amber-950 truncate max-w-[160px] active:scale-95 transition-all text-left"
            title="点击切换书籍与章节"
          >
            <span className="truncate">
              {cleanChapterTitle}
            </span>
            <ChevronDown size={13} className="shrink-0 text-amber-700" />
          </button>
        ) : (
          <div className="flex flex-col min-w-0">
            <h1 className="font-magical font-bold text-sm text-amber-950 truncate">
              霍格沃茨魔法英语
            </h1>
            <span className="text-[10px] text-stone-500 font-reading leading-tight">
              原版有声书精听
            </span>
          </div>
        )}
      </div>

      {/* ── Center: Study Mode Pill (in Player View) ──────────────── */}
      {currentView === 'player' && (
        <div className="flex rounded-xl p-0.5 border border-[#eee5d8] bg-stone-100/70 gap-0.5">
          <button
            onClick={() => setStudyMode('normal')}
            className={`p-1 rounded-lg transition-all ${
              studyMode === 'normal' ? 'bg-amber-500 text-white' : 'text-stone-500'
            }`}
            title="双语精听"
          >
            <Volume2 size={13} />
          </button>
          <button
            onClick={() => setStudyMode('blind')}
            className={`p-1 rounded-lg transition-all ${
              studyMode === 'blind' ? 'bg-amber-500 text-white' : 'text-stone-500'
            }`}
            title="魔法磨耳朵"
          >
            <EyeOff size={13} />
          </button>
          <button
            onClick={() => setStudyMode('dictation')}
            className={`p-1 rounded-lg transition-all ${
              studyMode === 'dictation' ? 'bg-amber-500 text-white' : 'text-stone-500'
            }`}
            title="拼写大闯关"
          >
            <Zap size={13} />
          </button>
        </div>
      )}

      {/* ── Right: Streak & Quick Tools ───────────────────────────── */}
      <div className="flex items-center gap-1.5 shrink-0" ref={toolsRef}>
        {/* Streak Pill */}
        <button
          onClick={onOpenAnalytics}
          className="flex items-center gap-1 px-2 py-1 rounded-xl border border-[#eee5d8] bg-[#fbf9f5] text-xs font-mono font-bold text-orange-600 active:scale-95 transition-colors"
          title={`连续打卡 ${streakDays} 天`}
        >
          <Flame size={13} className="fill-orange-500 text-orange-500" />
          <span>{streakDays}d</span>
        </button>

        {/* Tools Menu Trigger */}
        <div className="relative">
          <button
            onClick={() => setShowTools(!showTools)}
            className="duo-touch-target p-1.5 rounded-xl border border-[#eee5d8] bg-[#fbf9f5] text-stone-600 hover:text-amber-950 active:scale-95 transition-colors"
            title="更多工具"
          >
            <SlidersHorizontal size={15} />
          </button>

          {/* Tools Popover */}
          {showTools && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-[#eee5d8] bg-white p-2 z-50 animate-fadeIn space-y-1">
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
    </header>
  );
}

export default MobileTopBar;
