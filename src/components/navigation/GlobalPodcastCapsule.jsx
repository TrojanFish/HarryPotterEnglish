import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  SkipForward,
  Headphones,
  Moon,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { formatEnglishText } from '../../utils/vttParser';

/**
 * GlobalPodcastCapsule — Universal Persistent Podcast Audio Controller
 * Floats at the bottom across all views (Bookshelf, Vocab, Analytics, Storage):
 * - Desktop (>= 768px): Centered floating parchment glass capsule with 15s transport & sleep timer
 * - Mobile (< 768px): Compact bottom-docked capsule with Apple HIG 44px touch targets
 * - Strictly 100% Lucide React SVG, zero Unicode emojis
 */
export function GlobalPodcastCapsule({
  currentBook,
  currentChapter,
  isPlaying = false,
  onPlayPause,
  onSeekRelative,
  onNextSentence,
  onEnterPlayer,
  onOpenPlayer,
  currentTime = 0,
  duration = 0,
  playbackRate = 1.0,
  onChangePlaybackRate,
  sleepTimerMode,
  sleepTimerRemaining,
  onToggleSleepTimer,
  isMobile = false
}) {
  if (!currentChapter) return null;

  const handleOpen = onEnterPlayer || onOpenPlayer;

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;
  const cleanTitle = formatEnglishText(currentChapter.cnTitle || currentChapter.title);
  const bookTitle = currentBook ? (currentBook.cnTitle || currentBook.title) : '';

  return (
    <>
      {/* ── 1. Mobile Version (< 768px) ─────────────────────────────── */}
      <div className="md:hidden fixed bottom-[calc(3.4rem+max(0.75rem,calc(env(safe-area-inset-bottom,0px)+0.25rem)))] left-2.5 right-2.5 z-40 rounded-2xl bg-amber-500 text-white border border-amber-600 flex flex-col overflow-hidden select-none animate-slideUp shadow-none">
        {/* Top Slim Audio Scrubber Line */}
        <div className="h-1 bg-amber-600/40 w-full overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-200"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between p-2">
          {/* Clickable Info Area -> Enter Player */}
          <div
            onClick={handleOpen}
            className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer pr-1"
            title="点击进入全功能精听教室"
          >
            <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center font-bold text-xs text-white shrink-0">
              <Headphones size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-white truncate leading-tight">
                {cleanTitle}
              </h4>
              <p className="text-[10px] text-amber-100 font-mono font-medium truncate mt-0.5 flex items-center gap-1.5">
                <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                {sleepTimerMode && (
                  <span className="bg-amber-700/80 px-1 py-0.2 rounded text-[9px] flex items-center gap-0.5 text-amber-100">
                    <Moon size={9} /> {sleepTimerRemaining}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Quick Transport Buttons (Apple HIG >= 44x44pt touch targets) */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Seek -15s */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onSeekRelative) onSeekRelative(-15);
              }}
              className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl bg-white/15 hover:bg-white/25 text-white flex flex-col items-center justify-center active:scale-90 transition-transform cursor-pointer shrink-0"
              title="快退 15 秒"
              aria-label="快退 15 秒"
            >
              <RotateCcw size={14} />
              <span className="text-[7px] font-mono font-bold leading-none mt-0.5">15s</span>
            </button>

            {/* Play / Pause */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onPlayPause) onPlayPause();
              }}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-white text-amber-700 flex items-center justify-center active:scale-95 transition-transform cursor-pointer shadow-none shrink-0"
              title={isPlaying ? '暂停 (Space)' : '播放 (Space)'}
              aria-label={isPlaying ? '暂停音频' : '播放音频'}
            >
              {isPlaying ? (
                <Pause size={18} className="fill-current" />
              ) : (
                <Play size={18} className="fill-current translate-x-0.5" />
              )}
            </button>

            {/* Seek +15s */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onSeekRelative) onSeekRelative(15);
              }}
              className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl bg-white/15 hover:bg-white/25 text-white flex flex-col items-center justify-center active:scale-90 transition-transform cursor-pointer shrink-0"
              title="快进 15 秒"
              aria-label="快进 15 秒"
            >
              <RotateCw size={14} />
              <span className="text-[7px] font-mono font-bold leading-none mt-0.5">15s</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Desktop & Tablet Floating Capsule (>= 768px) ─────────── */}
      <div className="hidden md:flex fixed bottom-5 left-1/2 -translate-x-1/2 z-40 max-w-2xl w-[92%] rounded-2xl bg-white/95 border-2 border-amber-400/90 text-[#1e1610] backdrop-blur-xl flex-col overflow-hidden select-none animate-slideUp shadow-none">
        {/* Top Slim Audio Scrubber Line */}
        <div className="h-1 bg-amber-500/15 w-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-200"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between p-3 gap-3">
          {/* Left: Thumbnail & Chapter Details */}
          <div
            onClick={handleOpen}
            className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group"
            title="点击进入全功能精听教室"
          >
            <div className="w-11 h-11 rounded-xl overflow-hidden border border-amber-300 shrink-0 bg-stone-900 flex items-center justify-center">
              {currentBook?.id ? (
                <img
                  src={`/api/raw/podcasts/${currentBook.id}/cover.jpg`}
                  alt="Cover"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <Headphones size={18} className="text-amber-400" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                {isPlaying && (
                  <span className="flex items-center gap-0.5 text-amber-500 shrink-0">
                    <span className="w-[3px] h-2.5 bg-amber-500 rounded-full animate-wave-1" />
                    <span className="w-[3px] h-3.5 bg-amber-600 rounded-full animate-wave-2" />
                    <span className="w-[3px] h-2 bg-amber-400 rounded-full animate-wave-3" />
                  </span>
                )}
                <h4 className="font-magical font-bold text-sm text-amber-950 truncate group-hover:text-amber-800 transition-colors">
                  {cleanTitle}
                </h4>
              </div>
              <p className="text-[11px] text-stone-500 font-reading truncate mt-0.5 flex items-center gap-2">
                <span className="truncate">{bookTitle}</span>
                <span className="font-mono text-stone-400 shrink-0">{formatTime(currentTime)} / {formatTime(duration)}</span>
              </p>
            </div>
          </div>

          {/* Center: Transport Controls (15s Seek, Play/Pause, 15s Forward) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onSeekRelative && onSeekRelative(-15)}
              className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl border border-[#e8ddd0] bg-white flex flex-col items-center justify-center text-stone-600 hover:text-amber-950 hover:border-amber-300 transition-colors active:scale-95 cursor-pointer"
              title="快退 15 秒 (←15s)"
              aria-label="快退 15 秒"
            >
              <RotateCcw size={14} />
              <span className="text-[8px] font-mono font-bold leading-none mt-0.5">15s</span>
            </button>

            <button
              onClick={onPlayPause}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center border border-amber-600 active:scale-95 transition-all cursor-pointer shadow-none shrink-0"
              title={isPlaying ? '暂停音频 (Space)' : '继续播放 (Space)'}
              aria-label={isPlaying ? '暂停音频' : '继续播放'}
            >
              {isPlaying ? (
                <Pause size={18} className="fill-current" />
              ) : (
                <Play size={18} className="fill-current translate-x-0.5" />
              )}
            </button>

            <button
              onClick={() => onSeekRelative && onSeekRelative(15)}
              className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl border border-[#e8ddd0] bg-white flex flex-col items-center justify-center text-stone-600 hover:text-amber-950 hover:border-amber-300 transition-colors active:scale-95 cursor-pointer"
              title="快进 15 秒 (→15s)"
              aria-label="快进 15 秒"
            >
              <RotateCw size={14} />
              <span className="text-[8px] font-mono font-bold leading-none mt-0.5">15s</span>
            </button>
          </div>

          {/* Right: Sleep Timer, Speed & Expand CTA */}
          <div className="flex items-center gap-2 shrink-0">
            {onToggleSleepTimer && (
              <button
                type="button"
                onClick={onToggleSleepTimer}
                className={`min-h-[38px] rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
                  sleepTimerMode
                    ? 'px-2.5 gap-1 bg-amber-500 text-white border-amber-600 font-bold'
                    : 'w-[38px] border-[#e8ddd0] bg-white text-stone-600 hover:text-amber-950 hover:border-amber-300'
                }`}
                title={sleepTimerMode ? `睡眠定时生效中: ${sleepTimerRemaining}` : '开启睡眠定时'}
                aria-label="睡眠定时"
              >
                <Moon size={14} />
                {sleepTimerMode && (
                  <span className="text-[11px] font-mono">{sleepTimerRemaining}</span>
                )}
              </button>
            )}

            <button
              onClick={handleOpen}
              className="duo-btn-primary min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
              title="进入全功能精听教室（字幕、查词、跟读、听写）"
            >
              <span>进入精听</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default GlobalPodcastCapsule;
