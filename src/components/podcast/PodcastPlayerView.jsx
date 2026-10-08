import React, { useState, useMemo, useTransition } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Moon,
  Sparkles,
  Headphones,
  BookOpen,
  ChevronRight,
  Disc3,
  RotateCcw,
  RotateCw
} from 'lucide-react';
import { PodcastLyricsStream } from './PodcastLyricsStream';
import { formatEnglishText } from '../../utils/vttParser';
import { GoldenSnitchScrubber } from '../common/GoldenSnitchScrubber.jsx';
import { magicalSound } from '../../utils/magicalSound.js';

/**
 * PodcastPlayerView — Immersive Podcast Companion Mode (播客随行视界)
 * - Distraction-free listening experience designed for commuting and relaxing
 * - Large album artwork with warm parchment lighting
 * - Apple Music / Spotify-style flowing bilingual lyrics stream
 * - Complete transport controls: 15s relative seek, sleep timer, speed cycle
 * - 1-Click seamless transition to SLA Studio Mode (精研研学工坊)
 * - Strictly 100% Lucide React icons, zero emojis
 */
function PodcastPlayerViewComponent({
  currentBook,
  currentChapter,
  cues = [],
  activeCueIndex = 0,
  currentTime = 0,
  duration = 0,
  isPlaying = false,
  playbackRate = 1.0,
  onChangePlaybackRate,
  onPlayPause,
  onSeek,
  onSeekRelative,
  onSeekToCue,
  onPrevSentence,
  onNextSentence,
  sleepTimerMode,
  sleepTimerRemaining,
  onToggleSleepTimer,
  showTranslation = true,
  onToggleTranslation,
  bookmarkedCueIds = new Set(),
  onToggleBookmarkCue,
  onSwitchToStudio,
  className = ''
}) {
  const [, startTransition] = useTransition();
  const [mobileTab, setMobileTab] = useState('lyrics'); // 'lyrics' | 'cover'

  const handleSwitchMobileTab = (tab) => {
    startTransition(() => {
      setMobileTab(tab);
    });
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const cleanChapterTitle = formatEnglishText(
    currentChapter ? (currentChapter.cnTitle || currentChapter.title) : '选择章节'
  );
  const bookTitle = currentBook ? (currentBook.cnTitle || currentBook.title) : '霍格沃茨有声原著';

  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  const handleSpeedCycle = () => {
    if (!onChangePlaybackRate) return;
    const rates = [0.8, 1.0, 1.25, 1.5];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = currentIndex === -1 || currentIndex === rates.length - 1 ? rates[0] : rates[currentIndex + 1];
    onChangePlaybackRate(nextRate);
  };

  const coverUrl = currentBook?.id ? `/api/raw/podcasts/${currentBook.id}/cover.jpg` : null;

  return (
    <div className={`relative flex flex-col h-full bg-[#fbf9f5] text-[#1e1610] overflow-hidden select-none ${className}`}>
      {/* ── Sub-header: Mobile Tab Switcher ───────── */}
      <div className="lg:hidden flex items-center justify-between px-4 py-2 border-b border-[#e8ddd0] bg-[#fbf9f5] shrink-0">
        {/* Mobile Tab Toggle (Apple HIG Touch Target & Dual-Channel Status) */}
        <div className="flex items-center p-1 rounded-xl bg-stone-100 border border-[#e8ddd0] gap-1">
          <button
            onClick={() => handleSwitchMobileTab('lyrics')}
            className={`min-h-[38px] px-3.5 rounded-lg text-xs font-bold transition-all duration-150 active:scale-[0.97] touch-manipulation transform-gpu cursor-pointer select-none ${
              mobileTab === 'lyrics'
                ? 'bg-amber-500 text-white shadow-sm font-extrabold'
                : 'text-stone-600 hover:text-amber-950 hover:bg-white/80'
            }`}
            aria-pressed={mobileTab === 'lyrics'}
          >
            歌词流
          </button>
          <button
            onClick={() => handleSwitchMobileTab('cover')}
            className={`min-h-[38px] px-3.5 rounded-lg text-xs font-bold transition-all duration-150 active:scale-[0.97] touch-manipulation transform-gpu cursor-pointer select-none ${
              mobileTab === 'cover'
                ? 'bg-amber-500 text-white shadow-sm font-extrabold'
                : 'text-stone-600 hover:text-amber-950 hover:bg-white/80'
            }`}
            aria-pressed={mobileTab === 'cover'}
          >
            封面
          </button>
        </div>

        {/* Current Sentence Progress Indicator */}
        <div className="flex items-center gap-1 text-xs font-mono text-stone-500 bg-[#fbf9f5] px-2.5 py-1.5 rounded-xl border border-[#e8ddd0]">
          <span className="font-bold text-amber-900">{cues.length > 0 ? activeCueIndex + 1 : 0}</span>
          <span className="text-stone-400">/</span>
          <span>{cues.length}</span>
        </div>
      </div>

      {/* ── Main Body: Responsive Dual-Column or Stacked ─────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        {/* ── Desktop Left Column (lg:flex) ─────────────────────────── */}
        <div className="hidden lg:flex flex-col justify-between p-6 lg:p-8 xl:p-10 lg:w-[400px] xl:w-[440px] border-r border-[#e8ddd0] bg-gradient-to-b from-white/80 to-[#f7f2ea]/70 shrink-0">
          {/* Top: Cover Art & Metadata */}
          <div className="flex flex-col items-center my-auto">
            <div className="relative group w-48 h-48 xl:w-56 xl:h-56 rounded-3xl overflow-hidden border-2 border-amber-300/80 bg-stone-900 flex items-center justify-center shadow-sm">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt="Cover"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <Headphones size={64} className="text-amber-400" />
              )}
              {/* Subtle Ambient Disc Badge */}
              <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/80 text-[10px] font-mono text-amber-200 border border-amber-400/30 flex items-center gap-1">
                <Disc3 size={12} className={isPlaying ? 'animate-spin' : ''} />
                <span>PODCAST</span>
              </div>
            </div>

            {/* Chapter & Book Metadata */}
            <div className="mt-5 text-center max-w-sm px-2">
              <h2 className="font-magical font-bold text-xl xl:text-2xl text-amber-950 truncate leading-snug">
                {cleanChapterTitle}
              </h2>
              <p className="font-reading text-sm text-stone-500 truncate mt-1">
                {bookTitle}
              </p>
            </div>
          </div>

          {/* Desktop Left Bottom: Unified Player Console */}
          <div className="flex flex-col gap-3 pt-5 border-t border-[#e8ddd0]/60">
            {/* Audio Scrubber */}
            <div className="w-full select-none">
              <div className="relative flex items-center h-6 group cursor-pointer">
                {/* Custom Background Track */}
                <div className="w-full h-1.5 sm:h-2 bg-[#e8ddd0] rounded-full overflow-hidden relative">
                  {/* Active Progress Fill */}
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-75"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Golden Snitch Thumb — Perfectly Centered on Track */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none transition-all duration-75 z-10"
                  style={{ left: `${progressPercent}%` }}
                >
                  <GoldenSnitchScrubber progress={progressPercent} size={18} isHovered={isPlaying} />
                </div>

                {/* Invisible Accessible Range Input Overlaid Over Track */}
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="0.1"
                  value={currentTime}
                  onChange={(e) => onSeek && onSeek(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 m-0 p-0"
                  aria-label="音频时间进度条"
                />
              </div>

              {/* Time Labels Aligned Flush with Track */}
              <div className="flex justify-between text-[11px] font-mono text-stone-500 mt-0.5 px-0.5 select-none">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Transport Controls Row - 5 Symmetrical buttons tailored for podcast */}
            <div className="flex items-center justify-center gap-2 sm:gap-2.5">
              {/* Skip backward 15s */}
              <button
                onClick={() => onSeekRelative && onSeekRelative(-15)}
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl border border-[#e8ddd0] bg-white flex items-center justify-center text-stone-700 hover:text-amber-950 hover:border-amber-300 active:scale-95 transition-colors cursor-pointer"
                title="快退 15 秒 (-15s)"
                aria-label="快退 15 秒"
              >
                <div className="relative flex items-center justify-center">
                  <RotateCcw size={18} />
                  <span className="absolute text-[8px] font-bold font-mono leading-none pt-0.5">15</span>
                </div>
              </button>

              {/* Prev Sentence */}
              {onPrevSentence && (
                <button
                  onClick={onPrevSentence}
                  disabled={activeCueIndex <= 0}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl border border-[#e8ddd0] bg-white flex items-center justify-center text-stone-700 hover:text-amber-950 hover:border-amber-300 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-colors cursor-pointer"
                  title="上一句 (←)"
                  aria-label="上一句"
                >
                  <SkipBack size={18} />
                </button>
              )}

              {/* Primary Play/Pause CTA (56x56px) */}
              <button
                onClick={onPlayPause}
                className="w-14 h-14 min-w-[56px] min-h-[56px] rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center border-2 border-amber-600 active:scale-95 transition-transform cursor-pointer shadow-none"
                title={isPlaying ? '暂停 (Space)' : '播放 (Space)'}
                aria-label={isPlaying ? '暂停' : '播放'}
              >
                {isPlaying ? (
                  <Pause size={24} className="fill-current" />
                ) : (
                  <Play size={24} className="fill-current translate-x-0.5" />
                )}
              </button>

              {/* Next Sentence */}
              {onNextSentence && (
                <button
                  onClick={onNextSentence}
                  disabled={activeCueIndex >= cues.length - 1}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl border border-[#e8ddd0] bg-white flex items-center justify-center text-stone-700 hover:text-amber-950 hover:border-amber-300 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-colors cursor-pointer"
                  title="下一句 (→)"
                  aria-label="下一句"
                >
                  <SkipForward size={18} />
                </button>
              )}

              {/* Skip forward 15s */}
              <button
                onClick={() => onSeekRelative && onSeekRelative(15)}
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl border border-[#e8ddd0] bg-white flex items-center justify-center text-stone-700 hover:text-amber-950 hover:border-amber-300 active:scale-95 transition-colors cursor-pointer"
                title="快进 15 秒 (+15s)"
                aria-label="快进 15 秒"
              >
                <div className="relative flex items-center justify-center">
                  <RotateCw size={18} />
                  <span className="absolute text-[8px] font-bold font-mono leading-none pt-0.5">15</span>
                </div>
              </button>
            </div>

            {/* Sub-controls: Sleep Timer, Speed - Both 44px standard rounded-xl */}
            <div className="flex items-center justify-center gap-3 pt-1">
              {/* Sleep Timer (44px) */}
              {(onToggleSleepTimer || sleepTimerMode) && (
                <button
                  type="button"
                  onClick={onToggleSleepTimer}
                  className={`w-11 h-11 min-w-[44px] min-h-[44px] shrink-0 rounded-xl border flex flex-col items-center justify-center transition-colors cursor-pointer select-none active:scale-95 overflow-hidden ${
                    sleepTimerMode
                      ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                      : 'border-[#e8ddd0] bg-white text-stone-600 hover:text-amber-950 hover:border-amber-300'
                  }`}
                  title={sleepTimerMode ? `安眠魔药生效中: ${sleepTimerRemaining}` : '开启安眠魔药定时'}
                  aria-label="睡眠定时"
                  aria-pressed={Boolean(sleepTimerMode)}
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

              {/* Speed Cycle (44px) */}
              <button
                type="button"
                onClick={handleSpeedCycle}
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
            </div>
          </div>
        </div>

        {/* ── Mobile Middle Canvas (< lg) / Desktop Right Column (lg:flex) ── */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-[#fbf9f5]">
          {/* Mobile: Cover View (< lg when mobileTab === 'cover') */}
          <div className={`lg:hidden flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center select-none ios-scroll ${
            mobileTab === 'cover' ? 'flex' : 'hidden'
          }`}>
            <div className="relative group w-48 h-48 sm:w-60 sm:h-60 rounded-3xl overflow-hidden border-2 border-amber-300/80 bg-stone-900 flex items-center justify-center shrink-0 shadow-sm">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt="Cover"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <Headphones size={56} className="text-amber-400" />
              )}
              <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/80 text-[10px] font-mono text-amber-200 border border-amber-400/30 flex items-center gap-1">
                <Disc3 size={12} className={isPlaying ? 'animate-spin' : ''} />
                <span>PODCAST</span>
              </div>
            </div>

            <div className="mt-5 text-center max-w-sm px-2">
              <h2 className="font-magical font-bold text-xl sm:text-2xl text-amber-950 truncate leading-snug">
                {cleanChapterTitle}
              </h2>
              <p className="font-reading text-sm text-stone-500 truncate mt-1">
                {bookTitle}
              </p>
            </div>
          </div>

          {/* Lyrics Stream: Desktop always (lg:flex) / Mobile when mobileTab === 'lyrics' */}
          <div className={`flex-1 flex flex-col overflow-hidden min-h-0 ${
            mobileTab === 'lyrics' ? 'flex' : 'hidden lg:flex'
          }`}>
            <PodcastLyricsStream
              cues={cues}
              activeCueIndex={activeCueIndex}
              onSeekToCue={onSeekToCue}
              showTranslation={showTranslation}
              bookmarkedCueIds={bookmarkedCueIds}
              onToggleBookmarkCue={onToggleBookmarkCue}
              className="flex-1"
            />
          </div>
        </div>
      </div>

      {/* ── Stationary Anchored Bottom Player Console (Mobile < 1024px) ── */}
      <div className="lg:hidden podcast-anchored-console border-t border-[#e8ddd0] bg-[#fbf9f5] px-3 sm:px-4 pt-2.5 pb-safe pb-3 flex flex-col gap-2 shrink-0 select-none">
        {/* Scrubber Line */}
        <div className="w-full flex items-center gap-2.5 select-none">
          <span className="text-[10px] font-mono text-stone-500 min-w-[34px] text-right shrink-0">{formatTime(currentTime)}</span>
          <div className="relative flex-1 flex items-center h-6 group cursor-pointer">
            {/* Custom Background Track */}
            <div className="w-full h-1.5 bg-[#e8ddd0] rounded-full overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-75"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {/* Golden Snitch Thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none transition-all duration-75 z-10"
              style={{ left: `${progressPercent}%` }}
            >
              <GoldenSnitchScrubber progress={progressPercent} size={16} isHovered={isPlaying} />
            </div>
            {/* Invisible Range Input */}
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.1"
              value={currentTime}
              onChange={(e) => onSeek && onSeek(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 m-0 p-0"
              aria-label="音频时间进度条"
            />
          </div>
          <span className="text-[10px] font-mono text-stone-500 min-w-[34px] shrink-0">{formatTime(duration)}</span>
        </div>

        {/* Mobile Layer 1: Auxiliary Tools Row (Sleep Timer & Speed) */}
        <div className="flex items-center justify-between px-3 pt-1 text-xs text-stone-500">
          {(onToggleSleepTimer || sleepTimerMode) ? (
            <button
              type="button"
              onClick={onToggleSleepTimer}
              className={`w-11 h-11 min-w-[44px] min-h-[44px] shrink-0 rounded-xl border flex flex-col items-center justify-center transition-colors cursor-pointer select-none active:scale-95 overflow-hidden ${
                sleepTimerMode
                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                  : 'border-[#e8ddd0] bg-white text-stone-600 hover:text-amber-950 hover:border-amber-300'
              }`}
              title={sleepTimerMode ? `安眠魔药生效中: ${sleepTimerRemaining}` : '开启安眠魔药定时'}
              aria-label="睡眠定时"
              aria-pressed={Boolean(sleepTimerMode)}
            >
              {sleepTimerMode ? (
                <>
                  <Moon size={11} className="shrink-0 -mb-0.5" />
                  <span className="text-[9px] font-bold font-mono leading-tight tracking-tight truncate max-w-[38px] text-center">
                    {sleepTimerRemaining}
                  </span>
                </>
              ) : (
                <Moon size={17} />
              )}
            </button>
          ) : <div />}

          <button
            type="button"
            onClick={handleSpeedCycle}
            className={`w-11 h-11 min-w-[44px] min-h-[44px] shrink-0 rounded-xl border text-xs font-mono font-bold flex items-center justify-center transition-colors active:scale-95 cursor-pointer select-none ${
              playbackRate !== 1.0
                ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                : 'border-[#e8ddd0] bg-white text-stone-700 hover:text-amber-950 hover:border-amber-300'
            }`}
            title="切换播放倍速"
            aria-label="播放倍速"
          >
            <span>{playbackRate}x</span>
          </button>
        </div>

        {/* Mobile Layer 2: Symmetrical 5-Button Podcast Thumb Cluster */}
        <div className="w-full max-w-sm mx-auto flex items-center justify-between px-2 sm:px-4 pt-1 pb-2">
          {/* Skip backward 15s */}
          <button
            type="button"
            onClick={() => onSeekRelative && onSeekRelative(-15)}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl border border-[#e8ddd0] bg-white flex items-center justify-center text-stone-700 hover:text-amber-950 active:scale-95 transition-colors cursor-pointer"
            title="快退 15 秒 (-15s)"
            aria-label="快退 15 秒"
          >
            <div className="relative flex items-center justify-center">
              <RotateCcw size={18} />
              <span className="absolute text-[8px] font-bold font-mono leading-none pt-0.5">15</span>
            </div>
          </button>

          {/* Prev Sentence */}
          <button
            type="button"
            onClick={onPrevSentence}
            disabled={activeCueIndex <= 0}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl border border-[#e8ddd0] bg-white flex items-center justify-center text-stone-700 hover:text-amber-950 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-colors cursor-pointer"
            title="上一句 (←)"
            aria-label="上一句"
          >
            <SkipBack size={18} />
          </button>

          {/* Play / Pause CTA (56×56px Center Anchor) */}
          <button
            type="button"
            onClick={onPlayPause}
            className="w-14 h-14 min-w-[56px] min-h-[56px] rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center border-2 border-amber-600 active:scale-95 transition-all cursor-pointer shadow-none"
            title={isPlaying ? '暂停 (Space)' : '播放 (Space)'}
            aria-label={isPlaying ? '暂停' : '播放'}
          >
            {isPlaying ? (
              <Pause size={24} className="fill-current" />
            ) : (
              <Play size={24} className="fill-current translate-x-0.5" />
            )}
          </button>

          {/* Next Sentence */}
          <button
            type="button"
            onClick={onNextSentence}
            disabled={activeCueIndex >= cues.length - 1}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl border border-[#e8ddd0] bg-white flex items-center justify-center text-stone-700 hover:text-amber-950 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-colors cursor-pointer"
            title="下一句 (→)"
            aria-label="下一句"
          >
            <SkipForward size={18} />
          </button>

          {/* Skip forward 15s */}
          <button
            type="button"
            onClick={() => onSeekRelative && onSeekRelative(15)}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl border border-[#e8ddd0] bg-white flex items-center justify-center text-stone-700 hover:text-amber-950 active:scale-95 transition-colors cursor-pointer"
            title="快进 15 秒 (+15s)"
            aria-label="快进 15 秒"
          >
            <div className="relative flex items-center justify-center">
              <RotateCw size={18} />
              <span className="absolute text-[8px] font-bold font-mono leading-none pt-0.5">15</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

export const PodcastPlayerView = React.memo(PodcastPlayerViewComponent);
export default PodcastPlayerView;
