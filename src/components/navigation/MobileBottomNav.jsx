import React from 'react';
import {
  Library,
  Headphones,
  Bookmark,
  BarChart2
} from 'lucide-react';

/**
 * MobileBottomNav — Native Mobile Bottom Navigation Bar (< 768px)
 * Duolingo & Spotify Mobile standard navigation pattern:
 * - 4 high-frequency thumb-reachable tabs
 * - Active indicator dot
 * - Fixed bottom docking
 * - Strictly 100% Lucide SVG, zero Unicode emojis
 */
export function MobileBottomNav({
  currentView = 'bookshelf',
  onSwitchView,
  vocabCount = 0,
  onOpenVocab,
  onOpenAnalytics
}) {
  const tabs = [
    {
      id: 'bookshelf',
      label: '书架',
      icon: <Library size={20} />,
      isActive: currentView === 'bookshelf',
      onClick: () => onSwitchView && onSwitchView('bookshelf')
    },
    {
      id: 'player',
      label: '精听',
      icon: <Headphones size={20} />,
      isActive: currentView === 'player',
      onClick: () => onSwitchView && onSwitchView('player')
    },
    {
      id: 'vocab',
      label: '生词',
      icon: <Bookmark size={20} />,
      badge: vocabCount > 0 ? vocabCount : null,
      isActive: currentView === 'vocab',
      onClick: () => onOpenVocab ? onOpenVocab() : (onSwitchView && onSwitchView('vocab'))
    },
    {
      id: 'analytics',
      label: '我的',
      icon: <BarChart2 size={20} />,
      isActive: currentView === 'analytics',
      onClick: () => onOpenAnalytics ? onOpenAnalytics() : (onSwitchView && onSwitchView('analytics'))
    }
  ];

  return (
    <nav 
      aria-label="移动端底部导航"
      className="md:hidden w-full shrink-0 z-40 bg-[#fbf9f5] border-t border-[#e8ddd0] flex items-center justify-around px-2 pt-1 pb-safe select-none"
    >
      {tabs.map((tab) => {
        const active = tab.isActive;
        return (
          <button
            key={tab.id}
            onClick={tab.onClick}
            className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 relative transition-colors cursor-pointer active:scale-95 ${
              active ? 'text-amber-600' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            <div className="relative">
              {tab.icon}
              {tab.badge && (
                <span className="absolute -top-1 -right-2 px-1 min-w-[14px] h-3.5 rounded-full bg-amber-500 text-white font-mono font-bold text-[9px] flex items-center justify-center">
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}
            </div>
            <span className={`text-[10px] font-bold mt-0.5 ${active ? 'text-amber-900 font-extrabold' : ''}`}>
              {tab.label}
            </span>
            <span className={`w-1 h-1 rounded-full mt-0.5 transition-colors ${active ? 'bg-amber-600' : 'bg-transparent'}`} />
          </button>
        );
      })}
    </nav>
  );
}

export default MobileBottomNav;
