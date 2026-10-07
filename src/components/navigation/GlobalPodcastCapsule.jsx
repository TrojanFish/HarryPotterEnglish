import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
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
 * - Desktop (>= 768px): Centered floating parchment glass capsule with sentence transport & sleep timer
 * - Mobile (< 768px): Compact bottom-docked capsule with Apple HIG 44px touch targets
 * - Strictly 100% Lucide React SVG, zero Unicode emojis
 */
function GlobalPodcastCapsuleComponent({
  currentBook,
  currentChapter,
  isPlaying = false,
  onPlayPause,
  onPrevSentence,
  onNextSentence,
  onSeek,
  onSeekRelative,
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

  const rates = [0.8, 1.0, 1.25, 1.5, 2.0];
  const handleSpeedCycle = () => {
    if (!onChangePlaybackRate) return;
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = currentIndex === -1 || currentIndex === rates.length - 1 ? rates[0] : rates[currentIndex + 1];
    onChangePlaybackRate(nextRate);
  };

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
      {/* ── 1. Mobile Version (< 768px): Harmonized Warm Parchment Capsule ── */}
      <div className="md:hidden fixed bottom-[calc(3.4rem+max(0.75rem,calc(env(safe-area-inset-bottom,0px)+0.25rem)))] left-2.5 right-2.5 z-40 rounded-2xl bg-[#fbf9f5] text-[#1e1610] border border-amber-300 flex flex-col overflow-hidden select-none animate-slideUp shadow-sm">
        {/* Top Slim Audio Scrubber Line */}
        <div className="h-1 bg-amber-500/15 w-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-200"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between p-2.5 gap-2">
          {/* Clickable Info Area -> Enter Player */}
          <div
            onClick={handleOpen}
            className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer pr-1"
            title="点击进入全功能精听教室"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-300/50 flex items-center justify-center font-bold text-xs text-amber-700 shrink-0">
              <Headphones size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-amber-950 truncate leading-tight">
                {cleanTitle}
              </h4>
              <p className="text-[10px] text-stone-500 font-mono font-medium truncate mt-0.5 flex items-center gap-1.5">
                <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                {sleepTimerMode && (
                  <span className="bg-amber-100 text-amber-900 border border-amber-200 px-1 py-0.2 rounded text-[9px] flex items-center gap-0.5">
                    <Moon size={9} /> {sleepTimerRemaining}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Quick Transport Buttons (Unified Parchment Buttons) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Prev Sentence */}
            {onPrevSentence && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPrevSentence();
                }}
                className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl border border-[#e8ddd0] bg-white hover:bg-stone-50 text-stone-700 hover:text-amber-950 flex items-center justify-center active:scale-95 transition-all cursor-pointer shrink-0"
                title="上一句"
                aria-label="上一句"
              >
                <SkipBack size={16} />
              </button>
            )}

            {/* Play / Pause (44x44px Amber Primary Circle) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onPlayPause) onPlayPause();
              }}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center active:scale-95 transition-all cursor-pointer shadow-none shrink-0"
              title={isPlaying ? '暂停 (Space)' : '播放 (Space)'}
              aria-label={isPlaying ? '暂停音频' : '播放音频'}
            >
              {isPlaying ? (
                <Pause size={18} className="fill-current" />
              ) : (
                <Play size={18} className="fill-current translate-x-0.5" />
              )}
            </button>

            {/* Next Sentence */}
            {onNextSentence && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNextSentence();
                }}
                className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl border border-[#e8ddd0] bg-white hover:bg-stone-50 text-stone-700 hover:text-amber-950 flex items-center justify-center active:scale-95 transition-all cursor-pointer shrink-0"
                title="下一句"
                aria-label="下一句"
              >
                <SkipForward size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. Desktop Full-Width Docked Player Console (>= 768px, Spotify Scheme A) ── */}
      <div className="hidden md:flex fixed bottom-0 left-0 right-0 z-40 h-20 bg-[#fbf9f5] border-t border-[#e8ddd0] text-[#1e1610] items-center justify-between px-4 lg:px-8 select-none shadow-sm animate-slideUp">
        {/* Left: Thumbnail & Chapter Details (w-1/4 min-w-[200px]) */}
        <div
          onClick={handleOpen}
          className="flex items-center gap-3 w-1/4 min-w-[200px] max-w-xs cursor-pointer group"
          title="点击进入全功能精听教室"
        >
          <div className="w-12 h-12 rounded-xl overflow-hidden border border-amber-300/80 shrink-0 bg-stone-900 flex items-center justify-center group-hover:border-amber-500 transition-colors">
            {currentBook?.id ? (
              <img
                src={`/api/raw/podcasts/${currentBook.id}/cover.jpg`}
                alt="Cover"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <Headphones size={20} className="text-amber-400" />
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
            <p className="text-xs text-stone-500 font-reading truncate mt-0.5">
              {bookTitle}
            </p>
          </div>
        </div>

        {/* Center: Transport Controls & Scrubber Timeline */}
        <div className="flex-1 max-w-xl mx-4 flex flex-col items-center justify-center gap-1">
          {/* Controls Cluster */}
          <div className="flex items-center gap-3">
            {onPrevSentence && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPrevSentence();
                }}
                className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-xl border border-[#e8ddd0] bg-white flex items-center justify-center text-stone-600 hover:text-amber-950 hover:border-amber-300 transition-colors active:scale-95 cursor-pointer"
                title="上一句 (←)"
                aria-label="上一句"
              >
                <SkipBack size={15} />
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onPlayPause) onPlayPause();
              }}
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

            {onNextSentence && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onNextSentence();
                }}
                className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-xl border border-[#e8ddd0] bg-white flex items-center justify-center text-stone-600 hover:text-amber-950 hover:border-amber-300 transition-colors active:scale-95 cursor-pointer"
                title="下一句 (→)"
                aria-label="下一句"
              >
                <SkipForward size={15} />
              </button>
            )}
          </div>

          {/* Scrubber Timeline */}
          <div className="w-full flex items-center gap-2">
            <span className="text-[10px] font-mono text-stone-500 min-w-[36px] text-right">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.1"
              value={currentTime}
              onChange={(e) => onSeek && onSeek(parseFloat(e.target.value))}
              className="flex-1 h-1.5 py-1 appearance-none cursor-pointer bg-[#e8ddd0] accent-amber-500 rounded-lg"
              aria-label="音频时间进度条"
            />
            <span className="text-[10px] font-mono text-stone-500 min-w-[36px]">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Right: Tools & Expand Button (w-1/4 min-w-[200px] flex justify-end) */}
        <div className="w-1/4 min-w-[200px] max-w-xs flex items-center justify-end gap-2.5">
          {onChangePlaybackRate && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSpeedCycle();
              }}
              className={`w-9 h-9 min-w-[36px] min-h-[36px] rounded-xl border text-xs font-mono font-bold flex items-center justify-center whitespace-nowrap transition-colors active:scale-95 cursor-pointer select-none ${
                playbackRate !== 1.0
                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                  : 'border-[#e8ddd0] bg-white text-stone-700 hover:text-amber-950 hover:border-amber-300'
              }`}
              title="切换播放倍速"
              aria-label="播放倍速"
            >
              <span>{playbackRate}x</span>
            </button>
          )}

          {onToggleSleepTimer && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSleepTimer();
              }}
              className={`min-h-[36px] rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
                sleepTimerMode
                  ? 'px-2.5 gap-1 bg-amber-500 text-white border-amber-600 font-bold'
                  : 'w-9 border-[#e8ddd0] bg-white text-stone-600 hover:text-amber-950 hover:border-amber-300'
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
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (handleOpen) handleOpen();
            }}
            className="duo-btn-primary min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
            title="进入全功能精听教室（字幕、查词、跟读、听写）"
          >
            <span>进入精听</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </>
  );
}

export const GlobalPodcastCapsule = React.memo(GlobalPodcastCapsuleComponent);
export default GlobalPodcastCapsule;
