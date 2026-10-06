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
  Sparkles
} from 'lucide-react';

/**
 * TabletRail — Compact 72px Icon Navigation Rail for Tablet Screens (768px - 1023px)
 * Designed for iPad and Android tablet touch interaction:
 * - High-touch targets (44px)
 * - Tooltip descriptions
 * - Strictly Lucide SVG, zero Unicode emojis
 */
export function TabletRail({
  currentView = 'bookshelf',
  onSwitchView,
  playerMode = 'podcast',
  onSwitchPlayerMode,
  studyMode = 'normal',
  setStudyMode,
  streakDays = 0,
  vocabCount = 0,
  cachedChaptersCount = 0,
  onOpenVocab,
  onOpenAnalytics,
  onOpenStorage
}) {
  const items = [
    {
      id: 'bookshelf',
      title: '魔法书架',
      icon: <Library size={20} />,
      isActive: currentView === 'bookshelf',
      onClick: () => onSwitchView && onSwitchView('bookshelf')
    },
    {
      id: 'podcast',
      title: '随行播客',
      icon: <Headphones size={20} />,
      isActive: currentView === 'player' && playerMode === 'podcast',
      onClick: () => {
        if (onSwitchView) onSwitchView('player');
        if (onSwitchPlayerMode) onSwitchPlayerMode('podcast');
      }
    },
    {
      id: 'player_normal',
      title: '原著精听',
      icon: <Sparkles size={20} />,
      isActive: currentView === 'player' && playerMode === 'studio' && studyMode === 'normal',
      onClick: () => {
        if (onSwitchView) onSwitchView('player');
        if (onSwitchPlayerMode) onSwitchPlayerMode('studio');
        if (setStudyMode) setStudyMode('normal');
      }
    },
    {
      id: 'player_blind',
      title: '魔法磨耳朵',
      icon: <EyeOff size={20} />,
      isActive: currentView === 'player' && playerMode === 'studio' && studyMode === 'blind',
      onClick: () => {
        if (onSwitchView) onSwitchView('player');
        if (onSwitchPlayerMode) onSwitchPlayerMode('studio');
        if (setStudyMode) setStudyMode('blind');
      }
    },
    {
      id: 'player_dictation',
      title: '拼写大闯关',
      icon: <Zap size={20} />,
      isActive: currentView === 'player' && playerMode === 'studio' && studyMode === 'dictation',
      onClick: () => {
        if (onSwitchView) onSwitchView('player');
        if (onSwitchPlayerMode) onSwitchPlayerMode('studio');
        if (setStudyMode) setStudyMode('dictation');
      }
    },
    {
      id: 'vocab',
      title: `生词本 (${vocabCount})`,
      icon: <Bookmark size={20} />,
      isActive: false,
      badge: vocabCount > 0 ? vocabCount : null,
      onClick: onOpenVocab
    },
    {
      id: 'analytics',
      title: '学业罗盘',
      icon: <BarChart2 size={20} />,
      isActive: false,
      onClick: onOpenAnalytics
    },
    {
      id: 'storage',
      title: `离线管理 (${cachedChaptersCount})`,
      icon: <HardDrive size={20} />,
      isActive: false,
      badge: cachedChaptersCount > 0 ? cachedChaptersCount : null,
      onClick: onOpenStorage
    }
  ];

  return (
    <aside className="hidden md:flex lg:hidden w-18 shrink-0 flex-col items-center justify-between border-r border-[#e8ddd0] bg-[#fbf9f5] py-4 px-2 select-none h-full">
      {/* Brand Icon */}
      <div className="flex flex-col items-center gap-4 w-full">
        <div 
          onClick={() => onSwitchView && onSwitchView('bookshelf')}
          className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-white active:scale-95 cursor-pointer"
          title="霍格沃茨魔法英语"
        >
          <Sparkles size={20} className="text-white stroke-[2.5]" />
        </div>

        {/* Icon Nav List */}
        <nav className="flex flex-col items-center gap-2 w-full">
          {items.map((item) => {
            const active = item.isActive;
            return (
              <button
                key={item.id}
                onClick={item.onClick}
                className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-colors cursor-pointer ${
                  active
                    ? 'bg-amber-500 text-white border border-amber-600'
                    : 'text-stone-500 hover:text-amber-950 hover:bg-white border border-transparent hover:border-[#e8ddd0]'
                }`}
                title={item.title}
                aria-label={item.title}
              >
                {item.icon}
                {item.badge && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-600 text-white font-mono font-bold text-[9px] flex items-center justify-center border border-white">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Streak badge at bottom */}
      <div 
        onClick={onOpenAnalytics}
        className="flex flex-col items-center cursor-pointer p-1.5 rounded-xl hover:bg-white text-orange-600 font-mono font-bold text-xs"
        title={`连续打卡 ${streakDays} 天`}
      >
        <Flame size={18} className="fill-orange-500 text-orange-500" />
        <span className="text-[10px]">{streakDays}d</span>
      </div>
    </aside>
  );
}

export default TabletRail;
