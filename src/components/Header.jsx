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
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-amber-400/80 bg-white/90 hover:bg-amber-50 text-amber-950 font-bold text-xs sm:text-sm shadow-xs hover:shadow transition-all active:scale-95 group cursor-pointer"
            title="返回霍格沃茨书架选书"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform text-amber-700" />
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
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 active:scale-95 transition-transform">
            <Sparkles className="w-5 h-5 text-amber-950" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <h1 className="font-magical font-bold text-base sm:text-lg tracking-wide text-amber-800 dark:text-amber-300">
                霍格沃茨魔法英语
              </h1>
              <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full bg-red-800 text-amber-200 font-sans font-semibold shadow-xs">
                青少精听
              </span>
            </div>
            <p className="text-[11px] hidden md:block font-medium text-[#7a644c]">
              听魔法小说 · 轻松学地道英语
            </p>
          </div>
        </div>

        {/* Mobile book switcher */}
        {currentView === 'player' && (
          <button
            onClick={onOpenShelf}
            className="flex lg:hidden items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl border border-amber-300/90 bg-white/90 text-amber-950 font-bold truncate max-w-[130px] sm:max-w-[180px] shadow-xs active:scale-95 transition-all"
            title="切换原著故事"
          >
            <Library size={12} className="shrink-0 text-amber-600" />
            <span className="truncate">{currentBook ? (currentBook.cnTitle || currentBook.title) : '魔法书架'}</span>
            <ChevronDown size={11} className="shrink-0 text-amber-700" />
          </button>
        )}
      </div>

      {/* ── CENTER: Contextual Switcher ───────────────────────────── */}
      <div className="flex items-center justify-center">
        {currentView === 'bookshelf' ? (
          /* Bookshelf Navigation Pill */
          <div className="flex rounded-2xl p-1 border border-[#dfceb5] bg-[#f0e5d4] gap-1 shadow-inner">
            <button
              onClick={() => onSwitchView && onSwitchView('bookshelf')}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm active:scale-95 transition-all select-none cursor-pointer"
            >
              <Library size={14} />
              <span>魔法书架</span>
            </button>
            <button
              onClick={() => onSwitchView && onSwitchView('player')}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-[#6b5235] hover:bg-[#e6d8c3] hover:text-[#2d2217] active:scale-95 transition-all select-none cursor-pointer"
              title="进入全功能精听教室"
            >
              <Headphones size={14} className="text-amber-700" />
              <span>精听教室</span>
            </button>
          </div>
        ) : (
          /* Player 3 Core Learning Modes */
          <div className="flex rounded-2xl p-1 border border-[#dfceb5] bg-[#f0e5d4] gap-1 shadow-inner">
            {modes.map(({ key, label, icon, desc }) => {
              const isActive = studyMode === key;
              return (
                <button
                  key={key}
                  onClick={() => setStudyMode(key)}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm transition-all select-none cursor-pointer active:scale-95 ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm font-bold scale-[1.02]'
                      : 'text-[#6b5235] hover:bg-[#e6d8c3] hover:text-[#2d2217] font-semibold'
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
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* PWA Install */}
        {canInstallPwa && (
          <button
            onClick={onInstallPwa}
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold shadow-xs hover:shadow active:scale-95 transition-all cursor-pointer"
            title="一键安装到桌面，随时随地听故事"
          >
            <Download size={13} />
            <span>下载 App</span>
          </button>
        )}

        {/* Vocab Notebook */}
        <button
          onClick={onOpenVocab}
          className="relative p-2 sm:px-3 sm:py-1.5 rounded-xl border border-amber-300/80 bg-white/90 hover:bg-amber-50 text-amber-950 hover:border-amber-400 flex items-center gap-1.5 text-xs font-bold shadow-xs hover:shadow active:scale-95 transition-all cursor-pointer"
          title="我的魔法生词本"
        >
          <Bookmark size={15} className="text-amber-700" />
          <span className="hidden md:inline">生词本</span>
          {vocabCount > 0 && (
            <span className="min-w-[18px] h-[18px] px-1 bg-red-700 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
              {vocabCount}
            </span>
          )}
        </button>

        {/* Achievement Compass */}
        <button
          onClick={onOpenAnalytics}
          className="relative p-2 sm:px-3 sm:py-1.5 rounded-xl border border-amber-300/80 bg-white/90 hover:bg-amber-50 text-amber-950 hover:border-amber-400 flex items-center gap-1.5 text-xs font-bold shadow-xs hover:shadow active:scale-95 transition-all cursor-pointer"
          title={`学业成就 · 连续打卡 ${streakDays} 天`}
        >
          <BarChart2 size={15} className="text-amber-700" />
          <span className="hidden md:inline">成就</span>
          {streakDays > 0 ? (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] rounded-full font-bold shadow-xs animate-pulse">
              <Flame size={10} />
              {streakDays}天
            </span>
          ) : (
            <span className="hidden lg:inline text-[10px] text-amber-800 font-semibold">0天</span>
          )}
        </button>

        {/* Offline Storage */}
        <button
          onClick={onOpenStorageManager}
          className="relative p-2 rounded-xl border border-amber-300/80 bg-white/90 hover:bg-amber-50 text-amber-950 hover:border-amber-400 shadow-xs hover:shadow active:scale-95 transition-all cursor-pointer"
          title={`魔法行囊（离线下载）：已下载 ${cachedChaptersCount} 章`}
        >
          <HardDrive size={15} className="text-emerald-700" />
          {cachedChaptersCount > 0 && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
          )}
        </button>

        {/* Shortcuts */}
        <button
          onClick={onOpenShortcuts}
          className="p-2 rounded-xl border border-amber-300/80 bg-white/90 hover:bg-amber-50 text-amber-950 hover:border-amber-400 shadow-xs hover:shadow active:scale-95 transition-all cursor-pointer"
          title="使用秘籍与快捷键指南"
        >
          <HelpCircle size={15} className="text-amber-700" />
        </button>
      </div>
    </header>
  );
}
