import React from 'react';
import { Play, Pause, Clock, Bookmark, Sparkles } from 'lucide-react';
import { formatEnglishText } from '../../utils/vttParser';

/**
 * PodcastEpisodeCard — Modern Podcast Episode Programme Showcase Card
 * - Episode badge (EP.01) with warm parchment styling
 * - Primary/Secondary bilingual title hierarchy
 * - Episode duration timestamp & Accio Bookmark counter
 * - Real-time soundwave pulse when current episode is playing
 * - Strictly 100% Lucide React icons, zero emojis
 */
export function PodcastEpisodeCard({
  chapter,
  chapterIndex = 0,
  isCurrent = false,
  isPlaying = false,
  bookmarkCount = 0,
  onSelectChapter
}) {
  if (!chapter) return null;

  const episodeNumber = String(chapter.number || chapterIndex + 1).padStart(2, '0');
  const cleanEnTitle = formatEnglishText(chapter.title);
  const primaryTitle = chapter.cnTitle || cleanEnTitle;
  const secondaryTitle = chapter.cnTitle && chapter.cnTitle !== cleanEnTitle ? cleanEnTitle : '';

  return (
    <div
      onClick={() => onSelectChapter && onSelectChapter(chapter.id, true)}
      className={`group flex items-center gap-3 px-3.5 py-3 rounded-2xl border cursor-pointer transition-all duration-200 select-none ${
        isCurrent
          ? 'border-amber-400/90 bg-amber-50/80 ring-1 ring-amber-400/40 shadow-none'
          : 'border-[#e8ddd0] bg-white hover:border-amber-300 hover:bg-stone-50/70'
      }`}
      role="button"
      tabIndex={0}
      aria-label={`第 ${episodeNumber} 集: ${primaryTitle}`}
    >
      {/* 1. Episode Index Badge (EP.01) */}
      <div
        className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex flex-col items-center justify-center shrink-0 border transition-colors ${
          isCurrent
            ? 'bg-amber-500 border-amber-600 text-white'
            : 'bg-[#fbf9f5] border-[#e8ddd0] text-amber-900 group-hover:border-amber-300'
        }`}
      >
        <span className="text-[9px] font-mono font-bold leading-none uppercase tracking-wider opacity-80">
          EP
        </span>
        <span className="text-xs font-mono font-black leading-none mt-0.5">
          {episodeNumber}
        </span>
      </div>

      {/* 2. Main Episode Information */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4
            className={`font-magical font-bold text-sm truncate transition-colors ${
              isCurrent ? 'text-amber-950' : 'text-stone-800 group-hover:text-amber-950'
            }`}
          >
            {primaryTitle}
          </h4>

          {/* Active Soundwave / Status Pill */}
          {isCurrent && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center gap-1 shrink-0">
              {isPlaying ? (
                <span className="flex items-center gap-0.5 text-white">
                  <span className="w-1 h-2 bg-white rounded-full animate-wave-1" />
                  <span className="w-1 h-3 bg-white rounded-full animate-wave-2" />
                  <span className="w-1 h-1.5 bg-white rounded-full animate-wave-3" />
                </span>
              ) : (
                <Sparkles size={10} />
              )}
              <span>{isPlaying ? '正在播放' : '当前章节'}</span>
            </span>
          )}
        </div>

        {/* English Subtitle */}
        {secondaryTitle && (
          <p className="text-[11px] text-stone-400 font-reading italic truncate mt-0.5">
            {secondaryTitle}
          </p>
        )}

        {/* Metadata Footer: Duration & Bookmarks */}
        <div className="flex items-center gap-2.5 mt-1 text-[10px] font-mono text-stone-400">
          {chapter.duration && (
            <span className="flex items-center gap-1">
              <Clock size={11} className="text-stone-400" />
              <span>{chapter.duration}</span>
            </span>
          )}

          {bookmarkCount > 0 && (
            <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold border border-amber-200">
              <Bookmark size={9} className="fill-current text-amber-600" />
              <span>{bookmarkCount} 疑句</span>
            </span>
          )}
        </div>
      </div>

      {/* 3. Action Play Button (Apple HIG >= 44x44px) */}
      <button
        type="button"
        className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center shrink-0 border transition-all active:scale-90 cursor-pointer ${
          isCurrent
            ? 'bg-amber-500 text-white border-amber-600'
            : 'border-[#e8ddd0] bg-white text-stone-600 hover:text-amber-950 hover:border-amber-300'
        }`}
        title={isCurrent && isPlaying ? '暂停此单集' : '播放此单集'}
        aria-label={isCurrent && isPlaying ? '暂停此单集' : '播放此单集'}
      >
        {isCurrent && isPlaying ? (
          <Pause size={16} className="fill-current" />
        ) : (
          <Play size={16} className="fill-current translate-x-0.5" />
        )}
      </button>
    </div>
  );
}

export default PodcastEpisodeCard;
