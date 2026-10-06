import React from 'react';
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  Headphones,
  Sparkles,
  EyeOff,
  Zap,
  Languages,
  HelpCircle
} from 'lucide-react';
import { formatEnglishText } from '../../utils/vttParser';

/**
 * ReaderTopBar — Minimalist Contextual Header for Study Classroom & Podcast Modes
 * Clean, flat, and shadow-free reading toolbar:
 * - Left: Back Button & Book/Chapter selector pill
 * - Center: Dual-Engine Switcher [随行播客 | 精研工坊] + Studio Sub-modes [精听 | 磨耳朵 | 听写]
 * - Right: Reading controls (双语译文 / 快捷键)
 * - Zero emojis, 100% Lucide React icons
 */
export function ReaderTopBar({
  currentBook,
  currentChapter,
  onOpenShelf,
  playerMode = 'podcast',
  onSwitchPlayerMode,
  studyMode = 'normal',
  setStudyMode,
  showTranslation = true,
  setShowTranslation,
  onToggleTranslation,
  isFollowActive = true,
  setIsFollowActive,
  onOpenShortcuts,
  onBackToShelf,
  isOfflinePlaying = false
}) {
  const modes = [
    { key: 'normal', label: '双语精听', icon: <Headphones size={13} /> },
    { key: 'blind', label: '魔法磨耳朵', icon: <EyeOff size={13} /> },
    { key: 'dictation', label: '拼写大闯关', icon: <Zap size={13} /> }
  ];

  const bookTitle = currentBook ? (currentBook.cnTitle || currentBook.title) : '魔法故事';
  const rawChapterTitle = currentChapter ? (currentChapter.cnTitle || currentChapter.title) : '选择章节';
  const chapterTitle = formatEnglishText(rawChapterTitle);

  return (
    <header className="sticky top-0 z-30 pt-safe bg-white/95 border-b border-[#e8ddd0] backdrop-blur-md select-none shrink-0">
      {/* ── Primary Top Bar Navigation Row ────────────────────────── */}
      <div className="h-14 px-3 sm:px-6 flex items-center justify-between gap-2">
        {/* ── Left: Back Button & Chapter Selector ─────────────────── */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {onBackToShelf && (
            <button
              onClick={onBackToShelf}
              className="sm:hidden w-10 h-10 min-w-[40px] flex items-center justify-center rounded-xl border border-[#e8ddd0] bg-[#fbf9f5] hover:border-amber-400 hover:bg-white text-stone-600 hover:text-amber-950 active:scale-95 transition-colors shrink-0 cursor-pointer"
              title="返回书架"
              aria-label="返回书架"
            >
              <ArrowLeft size={18} />
            </button>
          )}

          {/* Chapter Selector Pill */}
          <button
            onClick={onOpenShelf}
            className="h-10 flex items-center gap-1.5 sm:gap-2 px-3 rounded-xl border border-[#e8ddd0] bg-[#fbf9f5] hover:border-amber-400 hover:bg-white text-amber-950 font-bold text-xs sm:text-sm transition-colors cursor-pointer group min-w-0 max-w-[200px] sm:max-w-xs md:max-w-md truncate"
            title="点击切换全书章节或其他原著"
            aria-label="切换章节"
          >
            <BookOpen size={15} className="text-amber-600 shrink-0 group-hover:scale-105 transition-transform" />
            <span className="truncate">
              <span className="text-stone-500 font-normal hidden sm:inline">{bookTitle} · </span>
              <span>{chapterTitle}</span>
            </span>
            <ChevronDown size={14} className="text-stone-400 shrink-0 ml-0.5 group-hover:text-amber-700" />
            {isOfflinePlaying && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="离线模式" />
            )}
          </button>
        </div>

        {/* ── Center: Dual Engine Switcher [随行播客 | 精研工坊] ───────── */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex h-10 items-center p-1 rounded-2xl bg-stone-100 border border-[#e8ddd0] gap-1">
            <button
              type="button"
              onClick={() => onSwitchPlayerMode && onSwitchPlayerMode('podcast')}
              className={`h-8 min-h-[32px] flex items-center justify-center gap-1.5 px-3 sm:px-3.5 rounded-xl text-xs font-bold transition-colors cursor-pointer select-none ${
                playerMode === 'podcast'
                  ? 'bg-amber-500 text-white shadow-sm font-extrabold'
                  : 'text-stone-600 hover:text-amber-950 hover:bg-white/80'
              }`}
              aria-label="随行播客模式"
              aria-pressed={playerMode === 'podcast'}
            >
              <Headphones size={13} />
              <span>随行播客</span>
            </button>

            <button
              type="button"
              onClick={() => onSwitchPlayerMode && onSwitchPlayerMode('studio')}
              className={`h-8 min-h-[32px] flex items-center justify-center gap-1.5 px-3 sm:px-3.5 rounded-xl text-xs font-bold transition-colors cursor-pointer select-none ${
                playerMode === 'studio'
                  ? 'bg-amber-500 text-white shadow-sm font-extrabold'
                  : 'text-stone-600 hover:text-amber-950 hover:bg-white/80'
              }`}
              aria-label="精研工坊模式"
              aria-pressed={playerMode === 'studio'}
            >
              <Sparkles size={13} />
              <span>精研工坊</span>
            </button>
          </div>

          {/* If in Studio Mode on Desktop, show SLA Sub-modes */}
          {playerMode === 'studio' && (
            <div className="hidden lg:flex h-10 items-center p-1 rounded-2xl bg-stone-100 border border-[#e8ddd0] gap-1 shrink-0 animate-fadeIn">
              {modes.map(({ key, label, icon }) => {
                const isActive = studyMode === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setStudyMode(key)}
                    className={`h-8 min-h-[32px] flex items-center justify-center gap-1.5 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer select-none ${
                      isActive
                        ? 'bg-amber-500 text-white shadow-sm font-extrabold'
                        : 'text-stone-600 hover:text-amber-950 hover:bg-white/80'
                    }`}
                    aria-label={label}
                    aria-pressed={isActive}
                  >
                    {icon}
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Right: Reading Controls ─────────────────────────────────── */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Bilingual translation toggle */}
          {studyMode !== 'dictation' && (
            <button
              type="button"
              onClick={() => (onToggleTranslation ? onToggleTranslation() : setShowTranslation && setShowTranslation(!showTranslation))}
              className={`w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl border transition-colors cursor-pointer select-none ${
                showTranslation
                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                  : 'bg-white text-stone-600 border-[#e8ddd0] hover:border-amber-300 hover:text-amber-950'
              }`}
              title={showTranslation ? '双语译文：开 (点击关闭)' : '双语译文：关 (点击开启)'}
              aria-label="中英双语切换"
              aria-pressed={Boolean(showTranslation)}
            >
              <Languages size={17} className={showTranslation ? 'text-white' : 'text-stone-600'} />
            </button>
          )}

          {/* Shortcuts (desktop only) */}
          {onOpenShortcuts && (
            <button
              onClick={onOpenShortcuts}
              className="hidden sm:flex w-10 h-10 min-w-[40px] min-h-[40px] items-center justify-center rounded-xl border border-[#e8ddd0] bg-white hover:border-amber-300 text-stone-500 hover:text-amber-950 transition-colors cursor-pointer shrink-0"
              title="键盘快捷键与操作指南"
            >
              <HelpCircle size={15} />
            </button>
          )}
        </div>
      </div>

      {/* ── Mobile/Tablet Sub-bar when in Studio Mode (< 1024px) ───────── */}
      {playerMode === 'studio' && (
        <div className="lg:hidden px-3 pb-2 pt-0.5 animate-fadeIn">
          <div className="grid grid-cols-3 h-10 p-1 rounded-2xl bg-stone-100 border border-[#e8ddd0] gap-1 items-center">
            {modes.map(({ key, label, icon }) => {
              const isActive = studyMode === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStudyMode(key)}
                  className={`h-8 min-h-[32px] flex items-center justify-center gap-1 px-1 rounded-xl text-xs font-bold transition-colors cursor-pointer select-none ${
                    isActive
                      ? 'bg-amber-500 text-white shadow-sm font-extrabold'
                      : 'text-stone-600 hover:text-amber-950 active:bg-stone-200'
                  }`}
                  aria-label={label}
                  aria-pressed={isActive}
                >
                  {icon}
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}

export default ReaderTopBar;
