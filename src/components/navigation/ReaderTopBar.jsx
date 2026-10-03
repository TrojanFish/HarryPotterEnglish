import React from 'react';
import {
  BookOpen,
  ChevronDown,
  Volume2,
  EyeOff,
  Zap,
  Languages,
  LocateFixed,
  HelpCircle
} from 'lucide-react';

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
  isFollowActive = true,
  setIsFollowActive,
  onOpenShortcuts
}) {
  const modes = [
    { key: 'normal', label: '双语精听', icon: <Volume2 size={14} /> },
    { key: 'blind', label: '魔法磨耳朵', icon: <EyeOff size={14} /> },
    { key: 'dictation', label: '拼写大闯关', icon: <Zap size={14} /> }
  ];

  const bookTitle = currentBook ? (currentBook.cnTitle || currentBook.title) : '魔法故事';
  const chapterTitle = currentChapter ? (currentChapter.cnTitle || currentChapter.title) : '选择章节';

  return (
    <div className="h-13 shrink-0 border-b border-[#eee5d8] bg-white/95 px-4 sm:px-6 flex items-center justify-between select-none">
      {/* ── Left: Current Book & Chapter Selector ─────────────────── */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenShelf}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#eee5d8] bg-[#fbf9f5] hover:border-amber-400 hover:bg-white text-amber-950 font-bold text-xs transition-colors cursor-pointer group max-w-[280px] sm:max-w-md"
          title="点击切换全书 17 个章节或其他原著"
        >
          <BookOpen size={14} className="text-amber-600 shrink-0 group-hover:scale-105 transition-transform" />
          <span className="truncate">
            <span className="text-stone-500 font-normal">{bookTitle} · </span>
            <span>{chapterTitle}</span>
          </span>
          <ChevronDown size={13} className="text-stone-400 shrink-0 ml-0.5 group-hover:text-amber-700" />
        </button>
      </div>

      {/* ── Center: 3 Study Modes (Flat, Clean Pills) ──────────────── */}
      <div className="hidden sm:flex items-center p-1 rounded-2xl bg-stone-100 border border-[#eee5d8] gap-1">
        {modes.map(({ key, label, icon }) => {
          const isActive = studyMode === key;
          return (
            <button
              key={key}
              onClick={() => setStudyMode(key)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-white'
                  : 'text-stone-600 hover:text-amber-950 hover:bg-white/80'
              }`}
            >
              {icon}
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Right: Reading Controls ─────────────────────────────────── */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Bilingual translation toggle */}
        {studyMode !== 'dictation' && (
          <button
            onClick={() => setShowTranslation && setShowTranslation(!showTranslation)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
              showTranslation
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-white text-stone-500 border-[#eee5d8] hover:border-amber-300'
            }`}
            title="开启/关闭中文双语译文"
          >
            <Languages size={13} className={showTranslation ? 'text-amber-600' : 'text-stone-400'} />
            <span className="hidden md:inline">{showTranslation ? '双语：开' : '双语：关'}</span>
          </button>
        )}

        {/* Auto follow scroll toggle */}
        {studyMode !== 'dictation' && setIsFollowActive && (
          <button
            onClick={() => setIsFollowActive(!isFollowActive)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
              isFollowActive
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-white text-stone-500 border-[#eee5d8] hover:border-amber-300'
            }`}
            title="跟随播放进度自动滚动"
          >
            <LocateFixed size={13} className={isFollowActive ? 'text-amber-600' : 'text-stone-400'} />
            <span className="hidden md:inline">跟随</span>
          </button>
        )}

        {/* Shortcuts */}
        {onOpenShortcuts && (
          <button
            onClick={onOpenShortcuts}
            className="p-1.5 rounded-xl border border-[#eee5d8] bg-white hover:border-amber-300 text-stone-500 hover:text-amber-950 transition-colors cursor-pointer"
            title="键盘快捷键指南"
          >
            <HelpCircle size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

export default ReaderTopBar;
