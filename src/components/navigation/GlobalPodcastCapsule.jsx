import React, { useState, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Headphones,
  Moon,
  ChevronRight
} from 'lucide-react';
import { formatEnglishText } from '../../utils/vttParser';
import { GoldenSnitchScrubber } from '../common/GoldenSnitchScrubber.jsx';
import { magicalSound } from '../../utils/magicalSound.js';

/**
 * GlobalPodcastCapsule — Universal Persistent Podcast Audio Controller
 * Unified workspace-width docked player console with top-mounted subtle hidden progress bar:
 * - Desktop & Tablet (>= 768px): Unified workspace-width docked console (max-w-7xl aligned)
 * - Mobile (< 768px): Unified full-width bottom bar, seamlessly stacking on Bookshelf and flush on secondary views
 * - Top Flush Scrubber: Minimal 2px line expanding to 5px on hover/touch with scrubber head & time preview
 * - Apple HIG 44px touch ergonomics, zero Unicode emojis, warm parchment palette (#fbf9f5, #e8ddd0, #1e1610)
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
  isMobile = false,
  currentView = 'bookshelf'
}) {
  if (!currentChapter) return null;

  const handleOpen = onEnterPlayer || onOpenPlayer;

  const [hoverSeekTime, setHoverSeekTime] = useState(null);
  const [hoverPercent, setHoverPercent] = useState(0);
  const [isHoveringScrubber, setIsHoveringScrubber] = useState(false);
  const scrubberRef = useRef(null);

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

  // Top scrubber interaction handlers
  const handleScrubberMouseMove = (e) => {
    if (!scrubberRef.current || duration <= 0) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverPercent(pos * 100);
    setHoverSeekTime(pos * duration);
    setIsHoveringScrubber(true);
  };

  const handleScrubberMouseLeave = () => {
    setIsHoveringScrubber(false);
    setHoverSeekTime(null);
  };

  const handleScrubberClick = (e) => {
    e.stopPropagation();
    if (!onSeek || !scrubberRef.current || duration <= 0) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(pos * duration);
  };

  const handleTouchSeek = (e) => {
    if (!onSeek || !scrubberRef.current || duration <= 0) return;
    const touch = e.touches[0];
    if (!touch) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
    onSeek(pos * duration);
  };

  return (
    <>
      {/* ── 1. Mobile Version (< 768px): Unified Full-Width Docked Console ── */}
      <div className="md:hidden w-full shrink-0 bg-[#fbf9f5] border-t border-[#e8ddd0] text-[#1e1610] relative z-30 select-none shadow-none">
        {/* Top Flush Hidden/Subtle Interactive Progress Scrubber */}
        <div
          ref={scrubberRef}
          onClick={handleScrubberClick}
          onTouchStart={handleTouchSeek}
          onTouchMove={handleTouchSeek}
          className="capsule-top-scrubber absolute -top-1.5 left-0 right-0 h-3 z-30 cursor-pointer flex items-center group/scrubber"
          title="点击或拖动调整播放进度"
          aria-label="音频时间进度条"
        >
          <div className="w-full bg-[#e8ddd0]/90 h-[2px] group-hover/scrubber:h-[4px] group-active/scrubber:h-[4px] transition-all duration-150 relative">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-150 relative"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -right-3 pointer-events-none opacity-0 group-hover/scrubber:opacity-100 transition-opacity">
                <GoldenSnitchScrubber progress={progressPercent} size={12} isHovered={isPlaying} />
              </div>
            </div>
          </div>
        </div>

        <div className="w-full h-16 px-3.5 flex items-center justify-between gap-2.5">
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

          {/* Quick Transport Buttons (Unified Standard 44px/48px Touch Targets) */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Prev Sentence */}
            {onPrevSentence && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPrevSentence();
                }}
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl border border-[#e8ddd0] bg-white hover:bg-stone-50 text-stone-700 hover:text-amber-950 flex items-center justify-center active:scale-95 transition-all cursor-pointer shrink-0"
                title="上一句"
                aria-label="上一句"
              >
                <SkipBack size={18} />
              </button>
            )}

            {/* Play / Pause (48x48px Amber Primary Circle) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onPlayPause) onPlayPause();
              }}
              className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center border-2 border-amber-600 active:scale-95 transition-all cursor-pointer shadow-none shrink-0"
              title={isPlaying ? '暂停 (Space)' : '播放 (Space)'}
              aria-label={isPlaying ? '暂停音频' : '播放音频'}
            >
              {isPlaying ? (
                <Pause size={20} className="fill-current" />
              ) : (
                <Play size={20} className="fill-current translate-x-0.5" />
              )}
            </button>

            {/* Next Sentence */}
            {onNextSentence && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onNextSentence();
                }}
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl border border-[#e8ddd0] bg-white hover:bg-stone-50 text-stone-700 hover:text-amber-950 flex items-center justify-center active:scale-95 transition-all cursor-pointer shrink-0"
                title="下一句"
                aria-label="下一句"
              >
                <SkipForward size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. Desktop & Tablet Docked Player Console (>= 768px): Unified Workspace Width ── */}
      <div className="hidden md:block w-full shrink-0 h-20 bg-[#fbf9f5] border-t border-[#e8ddd0] text-[#1e1610] relative z-30 select-none shadow-none">
        {/* Top Flush Subtle Hidden Interactive Progress Scrubber */}
        <div
          ref={scrubberRef}
          onMouseMove={handleScrubberMouseMove}
          onMouseLeave={handleScrubberMouseLeave}
          onClick={handleScrubberClick}
          className="capsule-top-scrubber absolute -top-1.5 left-0 right-0 h-4 z-40 cursor-pointer flex items-center group/scrubber"
          title="点击或拖动调整播放进度"
          aria-label="音频时间进度条"
        >
          {/* Track background */}
          <div className="w-full bg-[#e8ddd0]/80 h-[2px] group-hover/scrubber:h-[5px] transition-all duration-150 relative overflow-visible">
            {/* Progress fill */}
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-600 relative transition-all duration-150"
              style={{ width: `${progressPercent}%` }}
            >
              {/* Golden Snitch thumb head on hover */}
              <div className="absolute top-1/2 -translate-y-1/2 -right-3 pointer-events-none opacity-0 group-hover/scrubber:opacity-100 transition-opacity">
                <GoldenSnitchScrubber progress={progressPercent} size={14} isHovered={isPlaying} />
              </div>
            </div>

            {/* Hover preview tooltip */}
            {isHoveringScrubber && hoverSeekTime !== null && (
              <div
                className="absolute -top-7 -translate-x-1/2 px-2 py-0.5 rounded-md bg-stone-900 text-stone-100 text-[10px] font-mono font-bold shadow-sm pointer-events-none whitespace-nowrap z-50 animate-fadeIn"
                style={{ left: `${hoverPercent}%` }}
              >
                {formatTime(hoverSeekTime)}
              </div>
            )}
          </div>
        </div>

        {/* Content Container Aligned to max-w-7xl with page views */}
        <div className="max-w-7xl mx-auto w-full h-full px-4 lg:px-8 flex items-center justify-between relative">
          {/* Left: Thumbnail & Chapter Details (w-1/4 min-w-[200px]) */}
          <div
            onClick={handleOpen}
            className="flex items-center gap-3 w-1/4 min-w-[200px] max-w-xs cursor-pointer group z-10"
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
              <p className="text-xs text-stone-500 font-reading truncate mt-0.5 flex items-center gap-2">
                <span>{bookTitle}</span>
                <span className="text-stone-300">·</span>
                <span className="font-mono text-[11px] text-amber-900/80">{formatTime(currentTime)} / {formatTime(duration)}</span>
              </p>
            </div>
          </div>

          {/* Center: Harmonized Ergonomic Transport Cluster without bulky range input */}
          <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center justify-center gap-1 py-1 z-20">
            <div className="flex items-center gap-3 sm:gap-4">
              {onPrevSentence && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPrevSentence();
                  }}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl border border-[#e8ddd0] bg-white hover:bg-amber-50/50 flex items-center justify-center text-stone-600 hover:text-amber-950 hover:border-amber-300 transition-colors active:scale-95 cursor-pointer shadow-none"
                  title="上一句 (←)"
                  aria-label="上一句"
                >
                  <SkipBack size={18} />
                </button>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onPlayPause) onPlayPause();
                }}
                className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center border-2 border-amber-600 active:scale-95 transition-all cursor-pointer shadow-none shrink-0"
                title={isPlaying ? '暂停音频 (Space)' : '继续播放 (Space)'}
                aria-label={isPlaying ? '暂停音频' : '继续播放'}
              >
                {isPlaying ? (
                  <Pause size={20} className="fill-current" />
                ) : (
                  <Play size={20} className="fill-current translate-x-0.5" />
                )}
              </button>

              {onNextSentence && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNextSentence();
                  }}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl border border-[#e8ddd0] bg-white hover:bg-amber-50/50 flex items-center justify-center text-stone-600 hover:text-amber-950 hover:border-amber-300 transition-colors active:scale-95 cursor-pointer shadow-none"
                  title="下一句 (→)"
                  aria-label="下一句"
                >
                  <SkipForward size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Right: Tools & Expand Button (w-1/4 min-w-[200px] flex justify-end) */}
          <div className="w-1/4 min-w-[200px] max-w-xs flex items-center justify-end gap-2.5 z-10">
            {onChangePlaybackRate && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSpeedCycle();
                }}
                className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl border text-xs font-mono font-bold flex items-center justify-center whitespace-nowrap transition-colors active:scale-95 cursor-pointer select-none ${
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
                className={`w-11 h-11 min-w-[44px] min-h-[44px] shrink-0 rounded-xl border flex flex-col items-center justify-center transition-colors cursor-pointer select-none overflow-hidden ${
                  sleepTimerMode
                    ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                    : 'w-11 h-11 border-[#e8ddd0] bg-white text-stone-600 hover:text-amber-950 hover:border-amber-300'
                }`}
                title={sleepTimerMode ? `睡眠定时生效中: ${sleepTimerRemaining}` : '开启睡眠定时'}
                aria-label="睡眠定时"
              >
                {sleepTimerMode ? (
                  <>
                    <Moon size={11} className="shrink-0 -mb-0.5" />
                    <span className="text-[9px] font-bold font-mono leading-tight tracking-tight truncate max-w-[38px] text-center">
                      {sleepTimerRemaining}
                    </span>
                  </>
                ) : (
                  <Moon size={16} />
                )}
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (handleOpen) handleOpen();
              }}
              className="duo-btn-primary min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
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

export const GlobalPodcastCapsule = React.memo(GlobalPodcastCapsuleComponent);
export default GlobalPodcastCapsule;
