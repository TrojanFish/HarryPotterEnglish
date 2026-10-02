import React, { useState } from 'react';
import { 
  Library, 
  ChevronDown, 
  ChevronUp, 
  RotateCw, 
  CheckCircle2, 
  WifiOff,
  Sparkles,
  BookOpen,
  Headphones
} from 'lucide-react';

/**
 * Sidebar — Left navigation for books & chapters designed for students.
 * - Shows book cover, reading level badge (入门级适合小学高年级/初中生)
 * - Chapter list with soundwave playing status
 * - Library quick switch button
 */
export function Sidebar({
  currentBook,
  currentChapter,
  onSelectChapter,
  onOpenShelf,
  onRefreshCatalog,
  isRefreshing = false,
  isParchment,
  isOfflinePlaying = false,
}) {
  const [isChaptersExpanded, setIsChaptersExpanded] = useState(true);
  const chapters = currentBook?.chapters || [];
  const coverUrl = currentBook ? `/api/raw/podcasts/${currentBook.id}/cover.jpg` : null;

  if (!currentBook) return null;

  return (
    <aside
      className={`hidden lg:flex flex-col w-[280px] shrink-0 border-r overflow-hidden transition-colors duration-300 select-none ${
        isParchment
          ? 'bg-[#faf6ee] border-[#e7dbc2]'
          : 'bg-[#0f172a] border-slate-800'
      }`}
    >
      {/* ── Book Card & Reading Level ──────────────────────────────── */}
      <div className="p-4 shrink-0">
        <div
          onClick={onOpenShelf}
          className={`relative group rounded-2xl p-3 border-2 transition-all cursor-pointer shadow-sm hover:shadow-md ${
            isParchment
              ? 'bg-[#ffffff] border-[#e5d6ba] hover:border-amber-400'
              : 'bg-slate-800/80 border-slate-700 hover:border-amber-400'
          }`}
          title="点击切换其他魔法小说"
        >
          <div className="flex gap-3 items-center">
            {/* 3:4 Book Cover */}
            <div className="w-16 h-22 aspect-[3/4] rounded-xl overflow-hidden border border-amber-400/60 shadow-md shrink-0 bg-slate-900 relative">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={currentBook.title}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentNode.classList.add('flex', 'items-center', 'justify-center', 'text-3xl');
                    e.target.parentNode.innerText = currentBook.cover || '🧙‍♂️';
                  }}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl">
                  {currentBook.cover || '🧙‍♂️'}
                </div>
              )}
            </div>

            {/* Book Info for Young Learners */}
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-800 dark:text-amber-300 text-[10px] font-bold mb-1">
                <Sparkles size={10} />
                <span>入门适读 ★☆☆</span>
              </div>
              <h2 className="font-magical font-bold text-sm leading-snug text-amber-900 dark:text-amber-300 line-clamp-2">
                {currentBook.cnTitle || currentBook.title}
              </h2>
              <p className="text-[11px] text-slate-500 font-reading italic truncate mt-0.5">
                {currentBook.title}
              </p>
            </div>
          </div>

          {/* Offline badge */}
          {isOfflinePlaying && (
            <div className="mt-2 flex items-center justify-center gap-1.5 py-1 px-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold">
              <WifiOff size={12} />
              <span>已进入离线畅听模式</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Chapter List Header ────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2 shrink-0 border-t border-b border-inherit">
        <div className="flex items-center gap-1.5 text-xs font-bold font-mono text-amber-800 dark:text-amber-300">
          <BookOpen size={14} />
          <span>全书目录 ({chapters.length} 章节)</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onRefreshCatalog}
            disabled={isRefreshing}
            className={`p-1 rounded-lg transition-colors ${
              isParchment ? 'hover:bg-amber-100 text-[#8c7452]' : 'hover:bg-slate-800 text-slate-400'
            }`}
            title="刷新章节"
          >
            <RotateCw size={12} className={isRefreshing ? 'animate-spin text-amber-500' : ''} />
          </button>
          <button
            onClick={() => setIsChaptersExpanded(!isChaptersExpanded)}
            className={`p-1 rounded-lg transition-colors ${
              isParchment ? 'hover:bg-amber-100 text-[#8c7452]' : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            {isChaptersExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* ── Scrollable Chapter Rows ────────────────────────────────── */}
      {isChaptersExpanded && (
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 min-h-0">
          {chapters.map((ch) => {
            const isActive = currentChapter?.id === ch.id;
            return (
              <button
                key={ch.id}
                onClick={() => onSelectChapter(ch.id)}
                className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center gap-2.5 group ${
                  isActive
                    ? isParchment
                      ? 'bg-amber-500/15 border-2 border-amber-500 text-amber-950 font-bold shadow-sm'
                      : 'bg-amber-500/20 border-2 border-amber-400 text-amber-200 font-bold shadow-sm'
                    : isParchment
                    ? 'hover:bg-[#f2e7d3] text-[#5c4a35] border border-transparent'
                    : 'hover:bg-slate-800 text-slate-300 border border-transparent'
                }`}
              >
                {/* Chapter Number Badge */}
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs shrink-0 font-bold ${
                    isActive
                      ? 'bg-amber-500 text-white shadow-sm'
                      : isParchment
                      ? 'bg-[#ede0ca] text-[#7a6042]'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {String(ch.number).padStart(2, '0')}
                </span>

                {/* Chapter Title & Audio wave if active */}
                <div className="flex-1 min-w-0">
                  <div className="truncate font-reading text-sm leading-snug">
                    {ch.title}
                  </div>
                  {ch.duration && (
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                      {ch.duration}
                    </div>
                  )}
                </div>

                {/* Sound wave icon when active */}
                {isActive ? (
                  <div className="flex items-center gap-0.5 text-amber-500 shrink-0">
                    <span className="w-1 h-3.5 bg-amber-500 rounded-full animate-wave-1" />
                    <span className="w-1 h-4.5 bg-amber-600 rounded-full animate-wave-2" />
                    <span className="w-1 h-2.5 bg-amber-500 rounded-full animate-wave-3" />
                  </div>
                ) : (
                  <CheckCircle2 size={13} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Bottom Library Switcher ────────────────────────────────── */}
      <div className="p-3 border-t border-inherit shrink-0">
        <button
          onClick={onOpenShelf}
          className={`w-full py-2.5 px-3 rounded-xl border-2 text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            isParchment
              ? 'border-amber-400 bg-amber-50 text-amber-900 hover:bg-amber-100 hover:shadow-sm'
              : 'border-slate-700 bg-slate-800 text-amber-300 hover:bg-slate-700'
          }`}
        >
          <Library size={15} />
          <span>浏览更多原著魔法故事</span>
        </button>
      </div>
    </aside>
  );
}
