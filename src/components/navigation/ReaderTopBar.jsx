import React from 'react';
import { ArrowLeft, BookOpen, ChevronDown, Headphones, EyeOff, Zap, Languages, LocateFixed, HelpCircle } from 'lucide-react';
import { formatEnglishText } from '../../utils/vttParser';

/**
 * ReaderTopBar — Minimalist Contextual Header for Study Classroom
 * Clean, flat, and shadow-free reading toolbar:
 * - Left: Book & Chapter indicator with 1-click chapter drawer trigger
 * - Center: 3 Study modes (双语精听 / 魔法磨耳朵 / 拼写大闯关)
 * - Right: Reading controls (双语译文 / 跟随朗读 / 快捷键)
 * - Strictly zero duplicate navigation (no redundant back buttons or streak badges)
 */
export function ReaderTopBar({
  currentBook,
  currentChapter,
  onOpenShelf,
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
    { key: 'normal', label: '双语精听', icon: <Headphones size={14} /> },
    { key: 'blind', label: '魔法磨耳朵', icon: <EyeOff size={14} /> },
    { key: 'dictation', label: '拼写大闯关', icon: <Zap size={14} /> }
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
          {/* Mobile back to bookshelf - comfortable 40px touch zone */}
          {onBackToShelf && (
            <button
              onClick={onBackToShelf}
              className="sm:hidden w-10 h-10 flex items-center justify-center rounded-xl border border-[#e8ddd0] bg-[#fbf9f5] hover:border-amber-400 hover:bg-white text-stone-600 hover:text-amber-950 active:scale-95 transition-colors shrink-0 cursor-pointer"
              title="返回书架"
              aria-label="返回书架"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          {/* Chapter Selector Pill */}
          <button
            onClick={onOpenShelf}
            className="h-10 flex items-center gap-1.5 sm:gap-2 px-3 rounded-xl border border-[#e8ddd0] bg-[#fbf9f5] hover:border-amber-400 hover:bg-white text-amber-950 font-bold text-xs sm:text-sm transition-colors cursor-pointer group min-w-0 max-w-full sm:max-w-md truncate"
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

        {/* ── Center: 3 Study Modes (Desktop Only >= 640px) ─────────── */}
        <div className="hidden sm:flex h-10 items-center p-1 rounded-2xl bg-stone-100 border border-[#e8ddd0] gap-1 shrink-0">
          {modes.map(({ key, label, icon }) => {
            const isActive = studyMode === key;
            return (
              <button
                key={key}
                onClick={() => setStudyMode(key)}
                className={`h-8 flex items-center gap-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-stone-600 hover:text-amber-950 hover:bg-white/80'
                }`}
                title={label}
              >
                {icon}
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Right: Reading Controls ─────────────────────────────────── */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Bilingual translation toggle */}
          {studyMode !== 'dictation' && (
            <button
              onClick={() => (onToggleTranslation ? onToggleTranslation() : setShowTranslation && setShowTranslation(!showTranslation))}
              className={`h-10 min-w-[40px] flex items-center justify-center gap-1 px-2.5 sm:px-3 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                showTranslation
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-white text-stone-500 border-[#e8ddd0] hover:border-amber-300'
              }`}
              title="开启/关闭中文双语译文"
              aria-label="中英双语切换"
            >
              <Languages size={15} className={showTranslation ? 'text-amber-600' : 'text-stone-400'} />
              <span className="hidden sm:inline">{showTranslation ? '双语：开' : '双语：关'}</span>
            </button>
          )}

          {/* Shortcuts (desktop only) */}
          {onOpenShortcuts && (
            <button
              onClick={onOpenShortcuts}
              className="hidden sm:flex w-10 h-10 items-center justify-center rounded-xl border border-[#e8ddd0] bg-white hover:border-amber-300 text-stone-500 hover:text-amber-950 transition-colors cursor-pointer shrink-0"
              title="键盘快捷键与操作指南"
            >
              <HelpCircle size={15} />
            </button>
          )}
        </div>
      </div>

      {/* ── Mobile Layer 2: iOS Segmented Control for Study Modes (< 640px) ── */}
      <div className="sm:hidden px-3 pb-2 pt-0.5">
        <div className="grid grid-cols-3 p-1 rounded-xl bg-stone-100 border border-[#e8ddd0] gap-1">
          {modes.map(({ key, label, icon }) => {
            const isActive = studyMode === key;
            return (
              <button
                key={key}
                onClick={() => setStudyMode(key)}
                className={`min-h-[38px] flex items-center justify-center gap-1 px-1 rounded-lg text-xs font-bold transition-all cursor-pointer select-none ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-stone-600 hover:text-amber-950 active:bg-stone-200'
                }`}
                title={label}
                aria-pressed={isActive}
              >
                {icon}
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}

export default ReaderTopBar;
