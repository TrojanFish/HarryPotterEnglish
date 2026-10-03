import React, { useState, useRef, useEffect } from 'react';
import {
  Bookmark,
  EyeOff,
  PenTool,
  HelpCircle,
  Volume2,
  Library,
  Download,
  Flame,
  HardDrive,
  ChevronDown,
  Sparkles,
  Headphones,
  ArrowLeft,
  SlidersHorizontal,
  GraduationCap
} from 'lucide-react';

/**
 * Modern Duolingo-styled Header for Hogwarts Magic English.
 * - Clean, uncluttered layout with 3 clear visual zones
 * - Modern tactile view switcher & gamified status pills
 * - Unified quick tools dropdown for offline storage, shortcuts, and app install
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
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const toolsMenuRef = useRef(null);

  // Close tools menu on outside click
  useEffect(() => {
    if (!showToolsMenu) return;
    const handleClickOutside = (e) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target)) {
        setShowToolsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showToolsMenu]);

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
      icon: <EyeOff size={14} className="text-indigo-500" /> 
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
      className={`h-16 shrink-0 sticky top-0 z-40 hidden md:flex items-center justify-between px-4 sm:px-6 border-b transition-colors duration-300 backdrop-blur-xl ${
        isParchment
          ? 'bg-[#ffffff]/90 border-[#ede4d5] text-[#1e1610] shadow-[0_2px_12px_rgba(160,110,60,0.05)]'
          : 'bg-[#0f172a]/95 border-[#1e293b] text-[#f1f5f9] shadow-lg'
      }`}
    >
      {/* ── LEFT: Logo, Navigation & Student Title ─────────────────── */}
      <div className="flex items-center gap-3 shrink-0">
        {/* If in player view, show Back to Bookshelf button */}
        {currentView === 'player' && (
          <button
            onClick={() => onSwitchView && onSwitchView('bookshelf')}
            className="duo-pill text-xs sm:text-sm hover:border-amber-400 group cursor-pointer"
            title="返回霍格沃茨书架选书"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform text-amber-700" />
            <span>返回书架</span>
          </button>
        )}

        {/* Brand Logo (shown on tablet, hidden on desktop where DesktopSidebar has it) */}
        <div 
          onClick={() => {
            if (currentView === 'player' && onSwitchView) {
              onSwitchView('bookshelf');
            } else {
              onOpenShelf();
            }
          }}
          className="flex lg:hidden items-center gap-2.5 cursor-pointer group select-none"
          title="点击返回魔法书房"
        >
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20 group-hover:scale-105 active:scale-95 transition-transform">
            <Sparkles className="w-5 h-5 text-amber-950" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <h1 className="font-magical font-bold text-base sm:text-lg tracking-wide text-amber-950 dark:text-amber-200">
                霍格沃茨魔法英语
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-800 text-amber-100 font-sans font-bold shadow-2xs">
                <GraduationCap size={10} />
                <span>少儿原版</span>
              </span>
            </div>
            <p className="text-[11px] font-medium text-[#7a644c]">
              听魔法原著 · 轻松学地道英语
            </p>
          </div>
        </div>

        {/* Desktop breadcrumb when in bookshelf */}
        {currentView === 'bookshelf' && (
          <div className="hidden lg:flex items-center gap-2 text-xs font-bold text-amber-950">
            <span className="text-stone-400 font-reading">当前位置：</span>
            <span className="font-magical text-amber-900">魔法书房 · 原著全卷藏书阁</span>
          </div>
        )}

        {/* Tablet book switcher */}
        {currentView === 'player' && (
          <button
            onClick={onOpenShelf}
            className="flex lg:hidden items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl border border-amber-300/80 bg-white/90 text-amber-950 font-bold truncate max-w-[170px] shadow-xs active:scale-95 transition-all"
            title="切换原著故事"
          >
            <Library size={12} className="shrink-0 text-amber-600" />
            <span className="truncate">{currentBook ? (currentBook.cnTitle || currentBook.title) : '魔法书架'}</span>
            <ChevronDown size={11} className="shrink-0 text-amber-700" />
          </button>
        )}
      </div>

      {/* ── CENTER: Clean Modern Segmented Pill Switcher ────────────── */}
      <div className="flex items-center justify-center">
        {currentView === 'bookshelf' ? (
          <div className="flex rounded-2xl p-1 border border-[#e8ddcd] bg-[#f5ede2]/90 gap-1 shadow-inner">
            <button
              onClick={() => onSwitchView && onSwitchView('bookshelf')}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm active:scale-95 transition-all select-none cursor-pointer"
            >
              <Library size={14} />
              <span>魔法书架</span>
            </button>
            <button
              onClick={() => onSwitchView && onSwitchView('player')}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-[#665039] hover:bg-white/70 hover:text-[#2d2217] active:scale-95 transition-all select-none cursor-pointer"
              title="进入全功能精听教室"
            >
              <Headphones size={14} className="text-amber-700" />
              <span>精听教室</span>
            </button>
          </div>
        ) : (
          <div className="flex rounded-2xl p-1 border border-[#e8ddcd] bg-[#f5ede2]/90 gap-1 shadow-inner">
            {modes.map(({ key, label, icon, desc }) => {
              const isActive = studyMode === key;
              return (
                <button
                  key={key}
                  onClick={() => setStudyMode(key)}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm transition-all select-none cursor-pointer active:scale-95 ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm font-bold'
                      : 'text-[#665039] hover:bg-white/70 hover:text-[#2d2217] font-semibold'
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

      {/* ── RIGHT: Duolingo Gamified Status & Unified Tools ─────────── */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Daily Streak Flame Pill */}
        <button
          onClick={onOpenAnalytics}
          className="duo-pill text-xs hover:border-amber-400 group cursor-pointer"
          title={`今日打卡状态：已连续打卡 ${streakDays} 天，点击查看学业罗盘`}
        >
          <Flame size={15} className="text-orange-500 group-hover:scale-110 transition-transform" />
          <span className="font-mono font-bold text-amber-950">{streakDays} 天</span>
        </button>

        {/* Vocab Notebook Pill */}
        <button
          onClick={onOpenVocab}
          className="duo-pill text-xs hover:border-amber-400 group cursor-pointer"
          title="打开魔法生词本"
        >
          <Bookmark size={14} className="text-amber-700 group-hover:scale-110 transition-transform" />
          <span className="font-bold text-amber-950">{vocabCount} 词</span>
        </button>

        {/* Unified Tools Dropdown (Offline Cache, Shortcuts, PWA Install) */}
        <div className="relative" ref={toolsMenuRef}>
          <button
            onClick={() => setShowToolsMenu(!showToolsMenu)}
            className="duo-pill p-2 sm:px-2.5 sm:py-2 text-xs hover:border-amber-400 cursor-pointer"
            title="魔法工具箱 (离线行囊、快捷键、安装 App)"
          >
            <SlidersHorizontal size={14} className="text-amber-800" />
            {cachedChaptersCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            )}
          </button>

          {/* Floating Tools Dropdown Menu */}
          {showToolsMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-3xl bg-white/95 backdrop-blur-xl border-2 border-[#ece2d4] shadow-2xl p-2 z-50 animate-fadeIn select-none space-y-1">
              <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-amber-100 mb-1">
                魔法辅助工具
              </div>

              {/* Offline Storage Item */}
              <button
                onClick={() => {
                  setShowToolsMenu(false);
                  onOpenStorageManager();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-amber-50 text-left text-xs font-bold text-amber-950 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <HardDrive size={14} />
                  </div>
                  <span>离线魔法行囊</span>
                </div>
                <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {cachedChaptersCount} 章
                </span>
              </button>

              {/* Shortcuts Item */}
              <button
                onClick={() => {
                  setShowToolsMenu(false);
                  onOpenShortcuts();
                }}
                className="w-full flex items-center gap-2 p-2.5 rounded-2xl hover:bg-amber-50 text-left text-xs font-bold text-amber-950 cursor-pointer transition-all"
              >
                <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <HelpCircle size={14} />
                </div>
                <span>快捷键与使用秘籍</span>
              </button>

              {/* PWA Install Item */}
              {canInstallPwa && (
                <button
                  onClick={() => {
                    setShowToolsMenu(false);
                    onInstallPwa();
                  }}
                  className="w-full flex items-center gap-2 p-2.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-left text-xs font-bold text-amber-900 cursor-pointer transition-all"
                >
                  <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                    <Download size={14} />
                  </div>
                  <span>安装到桌面 App</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
