import React from 'react';
import {
  Library,
  Headphones,
  EyeOff,
  Zap,
  Bookmark,
  BarChart2,
  HardDrive,
  Flame,
  Sparkles,
  GraduationCap,
  Download
} from 'lucide-react';

/**
 * DesktopSidebar — Fixed Left Sidebar for Desktop & Wide Screens (>= 1024px)
 * Duolingo Web & Spotify Web inspired permanent navigation rail:
 * - 256px width, ivory parchment canvas (#fbf9f5)
 * - 3D tactile buttons for primary navigation items
 * - Integrated daily streak flame & 5-minute study contract progress widget
 * - Strictly 100% Lucide SVG icons, strictly zero Unicode emojis
 */
export function DesktopSidebar({
  currentView = 'bookshelf',
  onSwitchView,
  studyMode = 'normal',
  setStudyMode,
  streakDays = 0,
  todayListeningSeconds = 0,
  vocabCount = 0,
  cachedChaptersCount = 0,
  onOpenVocab,
  onOpenAnalytics,
  onOpenStorage,
  canInstallPwa = false,
  onInstallPwa
}) {
  const targetSeconds = 300; // 5-minute Duolingo-style daily habit
  const goalPercent = Math.min(100, Math.round((todayListeningSeconds / targetSeconds) * 100));
  const goalMinutes = (todayListeningSeconds / 60).toFixed(1);

  const navItems = [
    {
      id: 'bookshelf',
      label: '魔法书架 (Library)',
      desc: '原著书库与章节精选',
      icon: <Library size={18} className="shrink-0" />,
      isActive: currentView === 'bookshelf',
      onClick: () => onSwitchView && onSwitchView('bookshelf')
    },
    {
      id: 'player_normal',
      label: '原著精听 (Reader)',
      desc: '逐句同步双语伴读',
      icon: <Headphones size={18} className="shrink-0" />,
      isActive: currentView === 'player' && studyMode === 'normal',
      onClick: () => {
        if (onSwitchView) onSwitchView('player');
        if (setStudyMode) setStudyMode('normal');
      }
    },
    {
      id: 'player_blind',
      label: '魔法磨耳朵 (Blind)',
      desc: '迷雾遮罩盲听精进',
      icon: <EyeOff size={18} className="shrink-0" />,
      isActive: currentView === 'player' && studyMode === 'blind',
      onClick: () => {
        if (onSwitchView) onSwitchView('player');
        if (setStudyMode) setStudyMode('blind');
      }
    },
    {
      id: 'player_dictation',
      label: '拼写大闯关 (Quest)',
      desc: '魔咒打字趣味通关',
      icon: <Zap size={18} className="shrink-0" />,
      isActive: currentView === 'player' && studyMode === 'dictation',
      onClick: () => {
        if (onSwitchView) onSwitchView('player');
        if (setStudyMode) setStudyMode('dictation');
      }
    },
    {
      id: 'vocab',
      label: '魔法生词本 (Vocab)',
      desc: `${vocabCount} 个难词收藏与复习`,
      badge: vocabCount > 0 ? `${vocabCount}` : null,
      icon: <Bookmark size={18} className="shrink-0" />,
      isActive: false,
      onClick: onOpenVocab
    },
    {
      id: 'analytics',
      label: '学业罗盘 (Analytics)',
      desc: '连续打卡与学情趋势',
      icon: <BarChart2 size={18} className="shrink-0" />,
      isActive: false,
      onClick: onOpenAnalytics
    },
    {
      id: 'storage',
      label: '离线管理 (Storage)',
      desc: `已缓存 ${cachedChaptersCount} 个原声章节`,
      badge: cachedChaptersCount > 0 ? `${cachedChaptersCount}` : null,
      icon: <HardDrive size={18} className="shrink-0" />,
      isActive: false,
      onClick: onOpenStorage
    }
  ];

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col justify-between border-r-2 border-[#eee5d8] bg-[#fbf9f5] p-4 select-none h-full overflow-y-auto">
      {/* ── Top Brand & Navigation ─────────────────────────────────── */}
      <div className="space-y-5">
        {/* Brand Area */}
        <div 
          onClick={() => onSwitchView && onSwitchView('bookshelf')}
          className="flex items-center gap-2.5 px-2 cursor-pointer group"
          title="返回魔法书架"
        >
          <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-white group-hover:scale-105 active:scale-95 transition-transform">
            <Sparkles size={20} className="text-white stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <h1 className="font-magical font-bold text-base text-amber-950 tracking-tight">
                霍格沃茨英语
              </h1>
              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-red-800 text-amber-100 font-sans font-bold">
                <GraduationCap size={10} />
                <span>原版</span>
              </span>
            </div>
            <p className="text-[11px] font-medium text-stone-500 font-reading leading-tight mt-0.5">
              听魔法小说 · 学地道英语
            </p>
          </div>
        </div>

        {/* Navigation Item List */}
        <nav className="space-y-1.5" aria-label="桌面主导航">
          {navItems.map((item) => {
            const active = item.isActive;
            return (
              <button
                key={item.id}
                onClick={item.onClick}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-colors text-left cursor-pointer group ${
                  active
                    ? 'bg-amber-500 text-white border border-amber-600'
                    : 'text-stone-600 hover:text-amber-950 hover:bg-white border border-transparent hover:border-[#eee5d8]'
                }`}
                title={item.desc}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`${active ? 'text-white' : 'text-stone-500 group-hover:text-amber-700'} transition-colors`}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0 ${
                    active 
                      ? 'bg-white/20 text-white' 
                      : 'bg-amber-500/15 text-amber-800 border border-amber-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── Bottom Widgets: Streak & 5-Min Habit Progress ──────────── */}
      <div className="space-y-3 pt-4 border-t border-[#eee5d8]">
        {/* Habit Card */}
        <div 
          onClick={onOpenAnalytics}
          className="duo-card p-3.5 space-y-2 cursor-pointer hover:border-amber-400 transition-colors"
          title="点击查看学业罗盘与听力分布"
        >
          <div className="flex items-center justify-between text-xs font-bold text-amber-950">
            <span className="flex items-center gap-1.5 text-orange-600">
              <Flame size={15} className="fill-orange-500 text-orange-500" />
              <span>连续打卡</span>
            </span>
            <span className="font-mono font-bold text-orange-600">{streakDays} 天</span>
          </div>

          <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full transition-all duration-700" 
              style={{ width: `${goalPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-stone-500 font-reading">
            <span>今日契约: {goalMinutes} / 5 分钟</span>
            <span className="font-mono font-bold text-amber-900">{goalPercent}%</span>
          </div>
        </div>

        {/* Optional PWA Install Prompt */}
        {canInstallPwa && onInstallPwa && (
          <button
            onClick={onInstallPwa}
            className="w-full duo-btn-secondary min-h-[38px] flex items-center justify-center gap-1.5 text-xs font-bold"
            title="将应用安装至电脑桌面，支持秒开与离线学习"
          >
            <Download size={13} className="text-amber-700" />
            <span>安装桌面快捷应用</span>
          </button>
        )}
      </div>
    </aside>
  );
}

export default DesktopSidebar;
