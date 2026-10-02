import React from 'react';
import {
  Bookmark,
  EyeOff,
  PenTool,
  HelpCircle,
  Volume2,
  Library,
  Download,
  BarChart2,
  Flame,
  HardDrive,
  ChevronDown,
  Sparkles,
  Headphones,
  ArrowLeft,
} from 'lucide-react';

/**
 * Student-friendly Header for Primary & Junior High Learners.
 * - Clear, large, friendly mode switcher with fun badges
 * - Visual "魔法学徒" student rank
 * - Exclusively eye-protecting daylight parchment mode
 */
export function Header({
  books = [],
  selectedBook,
  selectedChapter,
  setSelectedChapter,
  studyMode,
  setStudyMode,
  isParchment = true,
  onOpenVocab,
  onOpenShortcuts,
  onOpenShelf,
  onRefreshCatalog,
  isRefreshing,
  onInstallPwa,
  canInstallPwa,
  vocabCount = 0,
  onOpenAnalytics,
  streakDays = 0,
  onOpenStorageManager,
  cachedChaptersCount = 0,
  currentView = 'bookshelf',
  onSwitchView,
}) {
  const currentBook = (books && books.find((b) => b.id === selectedBook)) || books[0];

  // Student-friendly mode configurations
  const modes = [
    { 
      key: 'normal', 
      label: '双语精听', 
      desc: '原版音频 · 逐句同步',
      icon: <Volume2 size={14} className="text-amber-500" /> 
    },
    { 
      key: 'blind',  
      label: '魔法磨耳朵', 
      desc: '迷雾遮罩 · 盲听训练',
      icon: <EyeOff size={14} className="text-indigo-400" /> 
    },
    { 
      key: 'dictation', 
      label: '拼写大闯关', 
      desc: '魔咒打字 · 趣味背词',
      icon: <PenTool size={14} className="text-emerald-500" /> 
    },
  ];

  return (
    <header
      className={`h-16 shrink-0 sticky top-0 z-40 flex items-center justify-between px-3 sm:px-6 border-b transition-colors duration-300 backdrop-blur-md ${
        isParchment
          ? 'bg-[#ffffff]/92 border-[#e8dcb9] text-[#2d241c] shadow-[0_2px_12px_rgba(180,140,70,0.08)]'
          : 'bg-[#0f172a]/95 border-[#1e293b] text-[#f1f5f9] shadow-lg'
      }`}
    >
      {/* ── LEFT: Logo, Navigation & Student Title ─────────────────── */}
      <div className="flex items-center gap-3 shrink-0">
        {/* If in player view, show Back to Bookshelf button */}
        {currentView === 'player' && (
          <button
            onClick={() => onSwitchView && onSwitchView('bookshelf')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold text-xs sm:text-sm transition-all shadow-sm group ${
              isParchment
                ? 'border-amber-400 bg-amber-500/15 hover:bg-amber-500/25 text-amber-900'
                : 'border-amber-500/40 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300'
            }`}
            title="返回霍格沃茨书架选书"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">返回书架</span>
            <span className="sm:hidden">书架</span>
          </button>
        )}

        <div 
          onClick={() => {
            if (currentView === 'player' && onSwitchView) {
              onSwitchView('bookshelf');
            } else {
              onOpenShelf();
            }
          }}
          className="flex items-center gap-2 cursor-pointer group select-none"
          title="点击返回魔法书房"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-amber-950" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <h1 className="font-magical font-bold text-base sm:text-lg tracking-wide text-amber-700 dark:text-amber-400">
                霍格沃茨魔法英语
              </h1>
              <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full bg-red-800 text-amber-200 font-sans font-semibold">
                青少精听
              </span>
            </div>
            <p className={`text-[11px] hidden md:block font-medium ${isParchment ? 'text-[#8c7452]' : 'text-slate-400'}`}>
              听魔法小说 · 轻松学地道英语
            </p>
          </div>
        </div>

        {/* Mobile book switcher */}
        {currentView === 'player' && (
          <button
            onClick={onOpenShelf}
            className={`flex lg:hidden items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl border font-semibold truncate max-w-[130px] sm:max-w-[180px] ${
              isParchment
                ? 'border-amber-300 bg-amber-50 text-amber-900'
                : 'border-slate-700 bg-slate-800 text-amber-300'
            }`}
            title="切换原著故事"
          >
            <Library size={12} className="shrink-0" />
            <span className="truncate">{currentBook ? (currentBook.cnTitle || currentBook.title) : '魔法书架'}</span>
            <ChevronDown size={11} className="shrink-0" />
          </button>
        )}
      </div>

      {/* ── CENTER: Contextual Switcher ───────────────────────────── */}
      <div className="flex items-center justify-center">
        {currentView === 'bookshelf' ? (
          /* Bookshelf Navigation Pill */
          <div
            className={`flex rounded-2xl p-1 border gap-1 shadow-inner ${
              isParchment ? 'bg-[#f4ebe1] border-[#e2d3be]' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <button
              onClick={() => onSwitchView && onSwitchView('bookshelf')}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md select-none"
            >
              <Library size={14} />
              <span>魔法书架</span>
            </button>
            <button
              onClick={() => onSwitchView && onSwitchView('player')}
              className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all select-none ${
                isParchment
                  ? 'text-[#6b5438] hover:bg-[#e9ded0] hover:text-[#2d241c]'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-amber-300'
              }`}
              title="进入全功能精听教室"
            >
              <Headphones size={14} />
              <span>精听教室</span>
            </button>
          </div>
        ) : (
          /* Player 3 Core Learning Modes */
          <div
            className={`flex rounded-2xl p-1 border gap-1 shadow-inner ${
              isParchment ? 'bg-[#f4ebe1] border-[#e2d3be]' : 'bg-slate-900 border-slate-800'
            }`}
          >
            {modes.map(({ key, label, icon, desc }) => {
              const isActive = studyMode === key;
              return (
                <button
                  key={key}
                  onClick={() => setStudyMode(key)}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all select-none ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md font-bold scale-[1.02]'
                      : isParchment
                      ? 'text-[#6b5438] hover:bg-[#e9ded0] hover:text-[#2d241c]'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-amber-300'
                  }`}
                  title={desc}
                >
                  {icon}
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── RIGHT: Gamified Student Tools ─────────────────────────── */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* PWA Install */}
        {canInstallPwa && (
          <button
            onClick={onInstallPwa}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400 text-amber-800 dark:text-amber-200 text-xs font-bold hover:shadow-md transition-all"
            title="一键安装到桌面，随时随地听故事"
          >
            <Download size={13} />
            <span>下载 App</span>
          </button>
        )}

        {/* Vocab Notebook */}
        <button
          onClick={onOpenVocab}
          className={`relative p-2 sm:px-2.5 sm:py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-all ${
            isParchment
              ? 'border-amber-300/80 bg-amber-50/60 text-[#7a5927] hover:bg-amber-100/60'
              : 'border-slate-700 bg-slate-800/80 text-amber-300 hover:bg-slate-800'
          }`}
          title="我的魔法生词本"
        >
          <Bookmark size={15} className="text-amber-600 dark:text-amber-400" />
          <span className="hidden md:inline">生词本</span>
          {vocabCount > 0 && (
            <span className="min-w-[18px] h-[18px] px-1 bg-red-700 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow">
              {vocabCount}
            </span>
          )}
        </button>

        {/* Achievement Compass */}
        <button
          onClick={onOpenAnalytics}
          className={`relative p-2 sm:px-2.5 sm:py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-all ${
            isParchment
              ? 'border-amber-300/80 bg-amber-50/60 text-[#7a5927] hover:bg-amber-100/60'
              : 'border-slate-700 bg-slate-800/80 text-amber-300 hover:bg-slate-800'
          }`}
          title={`学业成就 · 连续打卡 ${streakDays} 天`}
        >
          <BarChart2 size={15} className="text-amber-600 dark:text-amber-400" />
          <span className="hidden md:inline">成就</span>
          {streakDays > 0 ? (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] rounded-full font-bold shadow animate-pulse">
              <Flame size={10} />
              {streakDays}天
            </span>
          ) : (
            <span className="hidden lg:inline text-[10px] text-amber-700 dark:text-amber-400">0天</span>
          )}
        </button>

        {/* Offline Storage */}
        <button
          onClick={onOpenStorageManager}
          className={`relative p-2 rounded-xl border transition-all ${
            isParchment
              ? 'border-amber-300/80 bg-amber-50/60 text-[#7a5927] hover:bg-amber-100/60'
              : 'border-slate-700 bg-slate-800/80 text-amber-300 hover:bg-slate-800'
          }`}
          title={`魔法行囊（离线下载）：已下载 ${cachedChaptersCount} 章`}
        >
          <HardDrive size={15} className="text-emerald-600 dark:text-emerald-400" />
          {cachedChaptersCount > 0 && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
          )}
        </button>


        {/* Shortcuts */}
        <button
          onClick={onOpenShortcuts}
          className={`p-2 rounded-xl border transition-all ${
            isParchment
              ? 'border-amber-300/80 bg-amber-50/60 text-[#7a5927] hover:bg-amber-100/60'
              : 'border-slate-700 bg-slate-800/80 text-amber-300 hover:bg-slate-800'
          }`}
          title="使用秘籍与快捷键指南"
        >
          <HelpCircle size={15} />
        </button>
      </div>
    </header>
  );
}
