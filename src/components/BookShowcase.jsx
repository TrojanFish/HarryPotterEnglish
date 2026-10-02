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
      <div className={`book-frame transition-all duration-300 overflow-hidden ${
        isParchment ? 'text-[#2c221e]' : 'text-[#e2d9c8]'
      }`}>
        {/* Main Banner Card */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Cover Art Image with Vintage Frame */}
          <div className="relative group shrink-0">
            <div className="w-28 sm:w-32 aspect-[3/4] rounded-lg overflow-hidden border-2 border-[#cba358]/60 shadow-2xl bg-black/40 relative transform transition-transform group-hover:scale-105 duration-300">
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
            <span className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-[#740001] text-amber-200 border border-[#cba358] shadow-md flex items-center justify-center">
              <Sparkles size={12} />
            </span>
          </div>

          {/* Book & Chapter Details */}
          <div className="flex-1 flex flex-col justify-between text-center sm:text-left min-w-0 w-full">
            <div>
              {/* Top Meta tag */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#cba358]/20 text-[#cba358] border border-[#cba358]/30 font-semibold font-mono">
                  Hogwarts Official Audio
                </span>
                {isOfflinePlaying ? (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-semibold flex items-center gap-1 shadow-sm animate-pulse">
                    <CheckCircle2 size={12} /> 离线极速畅听
                  </span>
                ) : (
                  <span className="text-[11px] text-[#8c9ba5] flex items-center gap-1">
                    <Headphones size={12} /> 原版朗读 · 316 句同步
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 className="text-xl sm:text-2xl font-magical font-bold text-[#f3d38c] text-gold-glow tracking-wide line-clamp-1">
                {currentBook.cnTitle || currentBook.title}
              </h2>
              <p className="text-xs text-[#8c9ba5] font-reading italic mt-0.5">
                {currentBook.title}
              </p>

              {/* Current Episode Highlight */}
              {currentChapter && (
                <div className="mt-3 p-2.5 rounded-lg bg-black/20 border border-gray-700/40 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 truncate">
                    <Sparkles size={14} className="text-[#cba358] shrink-0" />
                    <span className="font-semibold text-[#f3d38c] truncate">
                      第 {currentChapter.number} 章: {currentChapter.title}
                    </span>
                  </div>
                  {currentChapter.duration && (
                    <span className="flex items-center gap-1 text-[11px] text-[#8c9ba5] shrink-0 font-mono ml-2">
                      <Clock size={12} />
                      {currentChapter.duration}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="mt-3 pt-2.5 border-t border-gray-700/30 flex items-center justify-between">
              <button
                onClick={onOpenShelf}
                className="flex items-center gap-1.5 text-xs text-[#cba358] hover:underline font-semibold"
              >
                <Library size={14} />
                <span>浏览全部原著藏书 ({chapters.length} 章节)</span>
              </button>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 text-xs text-[#8c9ba5] hover:text-[#cba358] transition-colors"
              >
                <span>{isExpanded ? '收起目录' : '展开本卷章节'}</span>
                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
          </div>
        </div>

        {/* Collapsible Chapters Grid */}
        {isExpanded && (
          <div className="px-4 pb-4 pt-1 border-t border-gray-700/30 bg-black/10">
            <h4 className="text-[11px] uppercase tracking-wider text-[#8c9ba5] font-mono mb-2">
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
                    className={`p-2 rounded-lg text-left text-xs border transition-all truncate flex flex-col justify-between ${
                      isCurrent
                        ? 'border-[#cba358] bg-[#cba358]/20 text-[#f3d38c] font-bold shadow-sm'
                        : isParchment
                          ? 'border-[#dec9a5] bg-[#fffdf8] hover:border-[#cba358]'
                          : 'border-gray-800 bg-[#121822] text-[#8c9ba5] hover:text-gray-200 hover:border-gray-700'
                    }`}
                  >
                    <div className="truncate font-reading">
                      <span className="text-[#cba358] mr-1">#{ch.number}</span>
                      {ch.title}
                    </div>
                    {ch.duration && (
                      <span className="text-[10px] text-gray-400 font-mono mt-1">
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
