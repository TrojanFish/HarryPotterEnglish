import React from 'react';
import { ArrowLeft, BookOpen, ChevronDown, Volume2, EyeOff, Zap, Languages, LocateFixed, HelpCircle } from 'lucide-react';
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
    { key: 'normal', label: '双语精听', icon: <Volume2 size={14} /> },
    { key: 'blind', label: '魔法磨耳朵', icon: <EyeOff size={14} /> },
    { key: 'dictation', label: '拼写大闯关', icon: <Zap size={14} /> }
  ];

  const bookTitle = currentBook ? (currentBook.cnTitle || currentBook.title) : '魔法故事';
  const rawChapterTitle = currentChapter ? (currentChapter.cnTitle || currentChapter.title) : '选择章节';
  const chapterTitle = formatEnglishText(rawChapterTitle);

  return (
    <header className="sticky top-0 z-30 pt-safe bg-white/95 border-b border-[#e8ddd0] backdrop-blur-md select-none shrink-0">
      <div className="h-14 px-3 sm:px-6 flex items-center justify-between gap-2">
        {/* ── Left: Current Book & Chapter Selector ─────────────────── */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          {/* Mobile back to bookshelf - unified height & border styling with chapter pill */}
          {onBackToShelf && (
            <button
              onClick={onBackToShelf}
              className="sm:hidden w-9 h-9 flex items-center justify-center rounded-xl border border-[#e8ddd0] bg-[#fbf9f5] hover:border-amber-400 hover:bg-white text-stone-600 hover:text-amber-950 active:scale-95 transition-colors shrink-0 cursor-pointer"
              title="返回书架"
              aria-label="返回书架"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <button
            onClick={onOpenShelf}
            className="h-9 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 rounded-xl border border-[#e8ddd0] bg-[#fbf9f5] hover:border-amber-400 hover:bg-white text-amber-950 font-bold text-xs transition-colors cursor-pointer group max-w-[180px] sm:max-w-md truncate"
            title="点击切换全书 17 个章节或其他原著"
          >
            <BookOpen size={14} className="text-amber-600 shrink-0 group-hover:scale-105 transition-transform" />
            <span className="truncate">
              <span className="text-stone-500 font-normal hidden sm:inline">{bookTitle} · </span>
              <span>{chapterTitle}</span>
            </span>
            <ChevronDown size={13} className="text-stone-400 shrink-0 ml-0.5 group-hover:text-amber-700" />
            {isOfflinePlaying && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="离线模式" />
            )}
          </button>
        </div>

        {/* ── Center: 3 Study Modes (Icons on Mobile, Pills on Desktop) ──────────────── */}
        <div className="h-9 flex items-center p-0.5 sm:p-1 rounded-xl sm:rounded-2xl bg-stone-100 border border-[#e8ddd0] gap-0.5 sm:gap-1 shrink-0">
          {modes.map(({ key, label, icon }) => {
            const isActive = studyMode === key;
            return (
              <button
                key={key}
                onClick={() => setStudyMode(key)}
                className={`h-7 flex items-center gap-1.5 px-2 sm:px-3 rounded-lg sm:rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-white'
                    : 'text-stone-600 hover:text-amber-950 hover:bg-white/80'
                }`}
                title={label}
              >
                {icon}
                <span className="hidden sm:inline">{label}</span>
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
              className={`h-9 flex items-center gap-1 px-2.5 sm:px-3 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                showTranslation
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-white text-stone-500 border-[#e8ddd0] hover:border-amber-300'
              }`}
              title="开启/关闭中文双语译文"
            >
              <Languages size={13} className={showTranslation ? 'text-amber-600' : 'text-stone-400'} />
              <span className="hidden md:inline">{showTranslation ? '双语：开' : '双语：关'}</span>
            </button>
          )}

          {/* Shortcuts */}
          {onOpenShortcuts && (
            <button
              onClick={onOpenShortcuts}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-[#e8ddd0] bg-white hover:border-amber-300 text-stone-500 hover:text-amber-950 transition-colors cursor-pointer shrink-0"
              title="键盘快捷键与操作指南"
            >
              <HelpCircle size={14} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default ReaderTopBar;
