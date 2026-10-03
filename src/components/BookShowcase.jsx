import React, { useState } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Library, 
  CheckCircle2, 
  Headphones 
} from 'lucide-react';

export function BookShowcase({
  currentBook,
  currentChapter,
  onSelectChapter,
  onOpenShelf,
  isParchment,
  isOfflinePlaying = false
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!currentBook) return null;

  // R2 Cover Image URL
  const coverUrl = `/api/raw/podcasts/${currentBook.id}/cover.jpg`;
  const chapters = currentBook.chapters || [];

  return (
    <div className="max-w-5xl mx-auto px-4 pt-4 pb-2 w-full">
      <div className="duo-card overflow-hidden text-[#1e1610]">
        {/* Main Banner Card */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Cover Art Image with Vintage Frame */}
          <div className="relative group shrink-0">
            <div className="w-28 sm:w-32 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-amber-400 shadow-lg bg-amber-950/10 relative transform transition-transform group-hover:scale-105 duration-300">
              <img
                src={coverUrl}
                alt={currentBook.title}
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fallback = e.target.nextElementSibling;
                  if (fallback) fallback.style.display = 'flex';
                }}
                className="w-full h-full object-cover"
              />
              <div className="w-full h-full hidden items-center justify-center bg-amber-950/30 text-amber-500 font-magical font-bold text-lg tracking-wider">
                {currentBook.code || 'HP'}
              </div>
              {/* Subtle magical gloss sheen */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Floating House Crest badge */}
            <span className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-amber-500 text-white border-2 border-white shadow-md flex items-center justify-center">
              <Sparkles size={12} />
            </span>
          </div>

          {/* Book & Chapter Details */}
          <div className="flex-1 flex flex-col justify-between text-center sm:text-left min-w-0 w-full">
            <div>
              {/* Top Meta tag */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 border border-amber-500/30 font-semibold font-mono">
                  Hogwarts Official Audio
                </span>
                {isOfflinePlaying ? (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 border border-emerald-500/40 font-semibold flex items-center gap-1 shadow-sm animate-pulse">
                    <CheckCircle2 size={12} /> 离线极速畅听
                  </span>
                ) : (
                  <span className="text-[11px] text-stone-500 flex items-center gap-1">
                    <Headphones size={12} /> 原版朗读 · 316 句同步
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 className="text-xl sm:text-2xl font-magical font-bold text-amber-950 tracking-wide line-clamp-1">
                {currentBook.cnTitle || currentBook.title}
              </h2>
              <p className="text-xs text-stone-500 font-reading italic mt-0.5">
                {currentBook.title}
              </p>

              {/* Current Episode Highlight */}
              {currentChapter && (
                <div className="mt-3 p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/80 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 truncate">
                    <Sparkles size={14} className="text-amber-600 shrink-0" />
                    <span className="font-semibold text-amber-950 truncate">
                      第 {currentChapter.number} 章: {currentChapter.title}
                    </span>
                  </div>
                  {currentChapter.duration && (
                    <span className="flex items-center gap-1 text-[11px] text-stone-500 shrink-0 font-mono ml-2">
                      <Clock size={12} />
                      {currentChapter.duration}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="mt-3 pt-2.5 border-t border-amber-200/80 flex items-center justify-between">
              <button
                onClick={onOpenShelf}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300/80 bg-white/90 hover:bg-amber-50 text-amber-950 hover:border-amber-400 text-xs font-bold transition-all shadow-xs hover:shadow active:scale-95 cursor-pointer"
                title="打开魔法书架浏览全部原著"
              >
                <Library size={14} />
                <span>浏览全部原著藏书 ({chapters.length} 章节)</span>
              </button>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-amber-200/80 bg-white/80 hover:bg-amber-50 text-amber-900 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
                title={isExpanded ? '收起本卷章节' : '展开本卷章节'}
              >
                <span>{isExpanded ? '收起目录' : '展开本卷章节'}</span>
                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
          </div>
        </div>

        {/* Collapsible Chapters Grid */}
        {isExpanded && (
          <div className="px-4 pb-4 pt-1 border-t border-amber-200/80 bg-amber-50/50">
            <h4 className="text-[11px] uppercase tracking-wider text-amber-900/80 font-mono font-bold mb-2">
              全书章节快速跳转：
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
              {chapters.map((ch) => {
                const isCurrent = currentChapter && currentChapter.id === ch.id;
                return (
                  <button
                    key={ch.id}
                    onClick={() => {
                      onSelectChapter(ch.id);
                      setIsExpanded(false);
                    }}
                    className={`p-2 rounded-xl text-left text-xs border transition-all truncate flex flex-col justify-between cursor-pointer active:scale-95 shadow-2xs hover:shadow-xs ${
                      isCurrent
                        ? 'border-amber-500 bg-amber-500/20 text-amber-950 font-bold shadow-sm'
                        : 'border-[#eee5d8] bg-white hover:border-amber-400 text-amber-950 hover:bg-amber-50/70'
                    }`}
                  >
                    <div className="truncate font-reading">
                      <span className="text-amber-600 font-bold mr-1">#{ch.number}</span>
                      {ch.title}
                    </div>
                    {ch.duration && (
                      <span className="text-[10px] text-slate-500 font-mono mt-1">
                        {ch.duration}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
