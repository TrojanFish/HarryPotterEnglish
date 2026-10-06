import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Bookmark, BookmarkCheck, LocateFixed } from 'lucide-react';
import { formatEnglishText } from '../../utils/vttParser';

/**
 * PodcastLyricsStream — Apple Music & Spotify Style Flowing Lyrics Subtitle Stream
 * - Large, distraction-free typography for effortless reading while listening
 * - Active sentence lighting with smooth auto-centering scroll
 * - Preceding/succeeding sentences softly dimmed with hover reveal
 * - 1-Click instant seek to any sentence
 * - Accio Bookmark: 1-click star/bookmark for later studio review
 * - Strictly 100% Lucide React icons, zero emojis
 */
export function PodcastLyricsStream({
  cues = [],
  activeCueIndex = 0,
  onSeekToCue,
  showTranslation = true,
  bookmarkedCueIds = new Set(),
  onToggleBookmarkCue,
  className = ''
}) {
  const containerRef = useRef(null);
  const activeLineRef = useRef(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const userScrollTimeoutRef = useRef(null);

  // Auto-scroll to active sentence when it changes
  useEffect(() => {
    if (isUserScrolling || !activeLineRef.current || !containerRef.current) return;

    activeLineRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }, [activeCueIndex, isUserScrolling]);

  // Handle user manual scroll: pause auto-scroll temporarily
  const handleScroll = useCallback(() => {
    setIsUserScrolling(true);
    if (userScrollTimeoutRef.current) {
      clearTimeout(userScrollTimeoutRef.current);
    }
    userScrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 4000);
  }, []);

  const resumeAutoScroll = useCallback(() => {
    setIsUserScrolling(false);
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, []);

  return (
    <div className={`relative flex flex-col h-full overflow-hidden select-none ${className}`}>
      {/* Flowing Lyrics Scroll Area */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 sm:px-8 py-20 space-y-8 scroll-smooth no-scrollbar"
        role="region"
        aria-label="播客双语歌词流"
      >
        {cues.map((cue, idx) => {
          const isActive = idx === activeCueIndex;
          const isPast = idx < activeCueIndex;
          const isBookmarked = bookmarkedCueIds instanceof Set
            ? bookmarkedCueIds.has(cue.id)
            : Array.isArray(bookmarkedCueIds) && bookmarkedCueIds.includes(cue.id);
          const cleanText = formatEnglishText(cue.text);

          return (
            <div
              key={cue.id || idx}
              ref={isActive ? activeLineRef : null}
              className={`group flex items-start justify-between gap-4 py-2 transition-all duration-300 rounded-2xl cursor-pointer ${
                isActive
                  ? 'active-lyric-cue text-amber-950 font-bold scale-[1.01]'
                  : isPast
                  ? 'inactive-lyric-cue text-stone-400 opacity-60 hover:opacity-100 hover:text-stone-700'
                  : 'inactive-lyric-cue text-stone-500 opacity-70 hover:opacity-100 hover:text-stone-800'
              }`}
              onClick={() => onSeekToCue && onSeekToCue(cue)}
            >
              {/* Main Lyrics Text */}
              <div className="flex-1 min-w-0">
                <p
                  className={`font-reading leading-relaxed transition-colors duration-200 ${
                    isActive
                      ? 'text-xl sm:text-2xl text-amber-950 drop-shadow-sm font-semibold'
                      : 'text-lg sm:text-xl'
                  }`}
                >
                  {cleanText}
                </p>

                {showTranslation && cue.translation && (
                  <p
                    className={`font-reading text-sm sm:text-base leading-relaxed mt-1.5 transition-colors duration-200 ${
                      isActive
                        ? 'text-amber-800/90 font-medium'
                        : 'text-stone-400 group-hover:text-stone-600'
                    }`}
                  >
                    {cue.translation}
                  </p>
                )}
              </div>

              {/* Bookmark Affordance (Apple HIG >= 44x44px touch target) */}
              {onToggleBookmarkCue && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleBookmarkCue(cue);
                  }}
                  className={`min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-90 cursor-pointer ${
                    isBookmarked
                      ? 'bg-amber-100 text-amber-700 border border-amber-300'
                      : 'opacity-0 group-hover:opacity-100 sm:opacity-0 focus:opacity-100 text-stone-400 hover:text-amber-800 hover:bg-stone-100 border border-transparent'
                  }`}
                  title={isBookmarked ? '已收录至疑难生词句' : '星标收录此句 (Accio Bookmark)'}
                  aria-label={isBookmarked ? '取消收录' : '星标收录'}
                >
                  {isBookmarked ? (
                    <BookmarkCheck size={20} className="fill-current text-amber-600" />
                  ) : (
                    <Bookmark size={20} />
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Follow Button if user scrolled away */}
      {isUserScrolling && (
        <button
          onClick={resumeAutoScroll}
          className="absolute bottom-6 right-6 min-h-[44px] px-3.5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-2 border border-amber-600 active:scale-95 transition-all cursor-pointer shadow-none z-20 animate-fadeIn"
          title="回滚到当前播放句子"
        >
          <LocateFixed size={16} />
          <span>跟随播放</span>
        </button>
      )}
    </div>
  );
}

export default PodcastLyricsStream;
