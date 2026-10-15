import React, { useState, useEffect, useRef } from 'react';
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
 * - Active indicator dot with 0ms optimistic highlighting
 * - Zero desync: Synchronized with currentView on every render
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
  const [optimisticTab, setOptimisticTab] = useState(null);
  const [prevView, setPrevView] = useState(currentView);
  const clearTimerRef = useRef(null);

  // Sync state during rendering: if currentView changed, clear optimisticTab immediately
  if (prevView !== currentView) {
    setPrevView(currentView);
    setOptimisticTab(null);
  }

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    };
  }, []);

  // When currentView prop changes, also guarantee optimisticTab is cleared
  useEffect(() => {
    setOptimisticTab(null);
  }, [currentView]);

  const tabs = [
    {
      id: 'bookshelf',
      label: '图书馆',
      icon: <Library size={20} />,
      onClick: () => onSwitchView && onSwitchView('bookshelf')
    },
    {
      id: 'player',
      label: '魔咒精研',
      icon: <Headphones size={20} />,
      onClick: () => onSwitchView && onSwitchView('player')
    },
    {
      id: 'vocab',
      label: '魔法宝典',
      icon: <Bookmark size={20} />,
      badge: vocabCount > 0 ? vocabCount : null,
      onClick: () => onOpenVocab ? onOpenVocab() : (onSwitchView && onSwitchView('vocab'))
    },
    {
      id: 'analytics',
      label: '巫师档案',
      icon: <BarChart2 size={20} />,
      onClick: () => onOpenAnalytics ? onOpenAnalytics() : (onSwitchView && onSwitchView('analytics'))
    }
  ];

  const handleTabClick = (tab) => {
    setOptimisticTab(tab.id);
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    // Safety fallback: if view transition doesn't update within 350ms, clear optimistic override
    clearTimerRef.current = setTimeout(() => {
      setOptimisticTab(null);
    }, 350);

    if (tab.onClick) {
      tab.onClick();
    }
  };

  const activeTabId = optimisticTab || currentView;

  return (
    <nav 
      aria-label="移动端底部导航"
      className="md:hidden w-full shrink-0 z-40 bg-[#fbf9f5] border-t border-[#e8ddd0] flex items-center justify-around px-2 pt-1 pb-safe select-none touch-manipulation"
    >
      {tabs.map((tab) => {
        const active = activeTabId === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabClick(tab)}
            aria-current={active ? 'page' : undefined}
            aria-selected={active}
            className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 relative transition-colors cursor-pointer active:scale-95 touch-manipulation ${
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
