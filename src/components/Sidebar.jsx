import React, { useState, useEffect } from 'react';
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
  const [coverError, setCoverError] = useState(false);
  const chapters = currentBook?.chapters || [];
  const coverUrl = currentBook ? `/api/raw/podcasts/${currentBook.id}/cover.jpg` : null;

  useEffect(() => {
    setCoverError(false);
  }, [coverUrl]);

  if (!currentBook) return null;

  return (
    <aside
      className="hidden lg:flex flex-col w-[280px] shrink-0 border-r border-[#e8ddd0] bg-[#fbf9f5] overflow-hidden transition-colors duration-300 select-none"
    >
      {/* ── Book Card & Reading Level ──────────────────────────────── */}
      <div className="p-4 shrink-0">
        <div
          onClick={onOpenShelf}
          className="relative group rounded-3xl p-3 border-2 border-[#e8ddd0] bg-white hover:border-amber-400 transition-all cursor-pointer"
          title="点击切换其他魔法小说"
        >
          <div className="flex gap-3 items-center">
            {/* 3:4 Book Cover */}
            <div className="w-16 h-22 aspect-[3/4] rounded-xl overflow-hidden border border-amber-400/60 shrink-0 bg-slate-900 relative">
              {coverUrl && !coverError ? (
                <img
                  src={coverUrl}
                  alt={currentBook.title}
                  onError={() => setCoverError(true)}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-amber-950/30 text-amber-500 p-1 text-center">
                  <BookOpen className="w-6 h-6 mb-1" />
                  <span className="font-magical text-[11px] font-bold text-amber-400 leading-tight">
                    {currentBook.code || 'HP'}
                  </span>
                </div>
              )}
            </div>

            {/* Book Info for Young Learners */}
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-900 text-[10px] font-bold mb-1">
                <Sparkles size={10} />
                <span>
                  {currentBook.id?.includes('book-1') 
                    ? '入门适读 · 基础难度' 
                    : currentBook.id?.includes('book-2')
                    ? '初级进阶 · 辨音训练'
                    : currentBook.id?.includes('book-3')
                    ? '中阶挑战 · 进阶精读'
                    : currentBook.id?.includes('prince')
                    ? '世界名著 · 纯美双语'
                    : currentBook.id?.includes('tales') || currentBook.id?.includes('tiny')
                    ? '启蒙绘本 · 趣味童话'
                    : '原版精选 · 有声精听'}
                </span>
              </div>
              <h2 className="font-magical font-bold text-sm leading-snug text-amber-950 line-clamp-2">
                {currentBook.cnTitle || currentBook.title}
              </h2>
              <p className="text-[11px] text-stone-500 font-reading italic truncate mt-0.5">
                {currentBook.title}
              </p>
            </div>
          </div>

          {/* Offline badge */}
          {isOfflinePlaying && (
            <div className="mt-2 flex items-center justify-center gap-1.5 py-1 px-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 rounded-lg text-xs font-bold">
              <WifiOff size={12} />
              <span>已进入离线畅听模式</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Chapter List Header ────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2 shrink-0 border-t border-b border-[#e8ddd0] bg-white">
        <div className="flex items-center gap-1.5 text-xs font-bold font-mono text-amber-900">
          <BookOpen size={14} />
          <span>全书目录 ({chapters.length} 章节)</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onRefreshCatalog}
            disabled={isRefreshing}
            className="p-1.5 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl border border-[#e8ddd0] bg-white hover:bg-stone-100 text-stone-600 hover:text-amber-950 transition-all active:scale-90 cursor-pointer disabled:opacity-50"
            title="重新扫描目录"
          >
            <RotateCw size={12} className={isRefreshing ? 'animate-spin text-amber-500' : ''} />
          </button>
          <button
            onClick={() => setIsChaptersExpanded(!isChaptersExpanded)}
            className="p-1.5 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl border border-[#e8ddd0] bg-white hover:bg-stone-100 text-stone-600 hover:text-amber-950 transition-all active:scale-90 cursor-pointer"
            title={isChaptersExpanded ? '收起目录' : '展开目录'}
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
                className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center gap-2.5 group cursor-pointer active:scale-[0.98] ${
                  isActive
                    ? 'bg-amber-500/10 border-2 border-amber-500 text-amber-950 font-bold'
                    : 'hover:bg-stone-200/50 text-stone-700 border border-transparent'
                }`}
              >
                {/* Chapter Number Badge */}
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs shrink-0 font-bold ${
                    isActive
                      ? 'bg-amber-500 text-white'
                      : 'bg-stone-200/80 text-stone-600'
                  }`}
                >
                  {String(ch.number).padStart(2, '0')}
                </span>

                {/* Chapter Title & Audio wave if active */}
                <div className="flex-1 min-w-0">
                  <div className="truncate font-reading text-xs sm:text-sm font-semibold leading-snug">
                    {ch.cnTitle || ch.title}
                  </div>
                  {ch.cnTitle && (
                    <div className="text-[11px] font-reading text-stone-500 truncate mt-0.5">
                      {ch.title}
                    </div>
                  )}
                  {ch.duration && (
                    <div className="text-[10px] font-mono text-stone-400 mt-0.5">
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
                  <CheckCircle2 size={13} className="text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Bottom Library Switcher ────────────────────────────────── */}
      <div className="p-3 border-t border-[#e8ddd0] bg-white shrink-0">
        <button
          onClick={onOpenShelf}
          className="duo-btn-secondary min-h-[40px] w-full text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
          title="翻开霍格沃茨书架"
        >
          <Library size={15} />
          <span>浏览更多原著魔法故事</span>
        </button>
      </div>
    </aside>
  );
}
