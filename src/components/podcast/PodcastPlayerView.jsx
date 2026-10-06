import React, { useState, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  Moon,
  Sparkles,
  Headphones,
  BookOpen,
  Languages,
  ChevronRight,
  Disc3
} from 'lucide-react';
import { PodcastLyricsStream } from './PodcastLyricsStream';
import { formatEnglishText } from '../../utils/vttParser';

/**
 * PodcastPlayerView — Immersive Podcast Companion Mode (播客随行视界)
 * - Distraction-free listening experience designed for commuting and relaxing
 * - Large album artwork with warm parchment lighting
 * - Apple Music / Spotify-style flowing bilingual lyrics stream
 * - Complete transport controls: 15s relative seek, sleep timer, speed cycle
 * - 1-Click seamless transition to SLA Studio Mode (精研研学工坊)
 * - Strictly 100% Lucide React icons, zero emojis
 */
export function PodcastPlayerView({
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
  const [mobileTab, setMobileTab] = useState('lyrics'); // 'lyrics' | 'cover'

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
      <div className="lg:hidden flex items-center justify-between px-4 py-2 border-b border-[#e8ddd0] bg-white/80 backdrop-blur-sm shrink-0">
        {/* Mobile Tab Toggle (Apple HIG Touch Target & Dual-Channel Status) */}
        <div className="flex items-center p-1 rounded-xl bg-stone-100 border border-[#e8ddd0] gap-1">
          <button
            onClick={() => setMobileTab('lyrics')}
            className={`min-h-[38px] px-3.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none ${
              mobileTab === 'lyrics'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-stone-600 hover:text-amber-950 hover:bg-white/80'
            }`}
            aria-pressed={mobileTab === 'lyrics'}
          >
            歌词流
          </button>
          <button
            onClick={() => setMobileTab('cover')}
            className={`min-h-[38px] px-3.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none ${
              mobileTab === 'cover'
                ? 'bg-amber-500 text-white shadow-sm'
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
        {/* ── Left Column: Cover Artwork & Transport (Desktop always, Mobile when 'cover') ── */}
        <div
          className={`lg:flex flex-col justify-between p-6 lg:p-10 lg:w-[420px] xl:w-[460px] border-r border-[#e8ddd0] bg-gradient-to-b from-white/60 to-[#f7f2ea]/60 shrink-0 overflow-y-auto ${
            mobileTab === 'cover' ? 'flex flex-1' : 'hidden lg:flex'
          }`}
        >
          {/* Top: Cover Art */}
          <div className="flex flex-col items-center">
            <div className="relative group w-48 h-48 sm:w-60 sm:h-60 lg:w-64 lg:h-64 rounded-3xl overflow-hidden border-2 border-amber-300/80 bg-stone-900 flex items-center justify-center">
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
              <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-mono text-amber-200 border border-amber-400/30 flex items-center gap-1">
                <Disc3 size={12} className={isPlaying ? 'animate-spin' : ''} />
                <span>PODCAST</span>
              </div>
            </div>

            {/* Chapter & Book Metadata */}
            <div className="mt-6 text-center max-w-sm px-2">
              <h2 className="font-magical font-bold text-xl sm:text-2xl text-amber-950 truncate leading-snug">
                {cleanChapterTitle}
              </h2>
              <p className="font-reading text-sm text-stone-500 truncate mt-1">
                {bookTitle}
              </p>
            </div>
          </div>

          {/* Desktop Left Bottom: Controls & Studio Switch */}
          <div className="mt-6 flex flex-col gap-4">
            {/* Audio Scrubber */}
            <div className="w-full">
              <div className="relative flex items-center">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="0.1"
                  value={currentTime}
                  onChange={(e) => onSeek && onSeek(parseFloat(e.target.value))}
                  className="w-full h-2 py-2 rounded-lg appearance-none cursor-pointer bg-[#e8ddd0] accent-amber-500"
                  aria-label="音频时间进度条"
                />
              </div>
              <div className="flex justify-between text-[11px] font-mono text-stone-500 mt-1.5">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Transport Controls Row (15s Seek, Prev/Next, Play/Pause) */}
            <div className="flex items-center justify-center gap-3">
              {/* Seek -15s */}
              <button
                onClick={() => onSeekRelative && onSeekRelative(-15)}
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl border border-[#e8ddd0] bg-white flex flex-col items-center justify-center text-stone-700 hover:text-amber-950 hover:border-amber-300 active:scale-90 transition-all cursor-pointer"
                title="快退 15 秒 (←15s)"
                aria-label="快退 15 秒"
              >
                <RotateCcw size={16} />
                <span className="text-[8px] font-mono font-bold leading-none mt-0.5">15s</span>
              </button>

              {/* Prev Sentence */}
              {onPrevSentence && (
                <button
                  onClick={onPrevSentence}
                  disabled={activeCueIndex <= 0}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl border border-[#e8ddd0] bg-white flex items-center justify-center text-stone-600 hover:text-amber-950 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-colors cursor-pointer"
                  title="上一句"
                  aria-label="上一句"
                >
                  <SkipBack size={18} />
                </button>
              )}

              {/* Primary Play/Pause CTA */}
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
                  className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl border border-[#e8ddd0] bg-white flex items-center justify-center text-stone-600 hover:text-amber-950 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-colors cursor-pointer"
                  title="下一句"
                  aria-label="下一句"
                >
                  <SkipForward size={18} />
                </button>
              )}

              {/* Seek +15s */}
              <button
                onClick={() => onSeekRelative && onSeekRelative(15)}
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl border border-[#e8ddd0] bg-white flex flex-col items-center justify-center text-stone-700 hover:text-amber-950 hover:border-amber-300 active:scale-90 transition-all cursor-pointer"
                title="快进 15 秒 (→15s)"
                aria-label="快进 15 秒"
              >
                <RotateCw size={16} />
                <span className="text-[8px] font-mono font-bold leading-none mt-0.5">15s</span>
              </button>
            </div>

            {/* Sub-controls: Sleep Timer, Speed, Translation */}
            <div className="flex items-center justify-center gap-2.5 pt-1">
              {/* Sleep Timer */}
              {(onToggleSleepTimer || sleepTimerMode) && (
                <button
                  type="button"
                  onClick={onToggleSleepTimer}
                  className={`relative w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl border flex items-center justify-center transition-colors cursor-pointer select-none ${
                    sleepTimerMode
                      ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                      : 'border-[#e8ddd0] bg-white text-stone-600 hover:text-amber-950 hover:border-amber-300'
                  }`}
                  title={sleepTimerMode ? `睡眠定时生效中: ${sleepTimerRemaining}` : '开启睡眠定时'}
                  aria-label="睡眠定时"
                  aria-pressed={Boolean(sleepTimerMode)}
                >
                  <Moon size={18} />
                  {sleepTimerMode && (
                    <span className="absolute -top-1 -right-1 text-[9px] font-mono font-bold bg-amber-700 text-white px-1.5 py-0.5 rounded-full border border-white leading-none shadow-sm">
                      {sleepTimerRemaining}
                    </span>
                  )}
                </button>
              )}

              {/* Speed Cycle */}
              <button
                type="button"
                onClick={handleSpeedCycle}
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl border border-[#e8ddd0] bg-white text-stone-700 hover:text-amber-950 hover:border-amber-300 font-mono text-xs font-bold transition-colors cursor-pointer select-none"
                title="切换播放倍速"
                aria-label="播放倍速"
              >
                {playbackRate}x
              </button>

              {/* Bilingual Translation Toggle */}
              {onToggleTranslation && (
                <button
                  type="button"
                  onClick={onToggleTranslation}
                  className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl border flex items-center justify-center transition-colors cursor-pointer select-none ${
                    showTranslation
                      ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                      : 'border-[#e8ddd0] bg-white text-stone-400 hover:text-stone-700 hover:border-amber-300'
                  }`}
                  title={showTranslation ? '双语译文：开 (点击关闭)' : '双语译文：关 (点击开启)'}
                  aria-label="中英双语切换"
                  aria-pressed={showTranslation}
                >
                  <Languages size={18} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Right Column: Flowing Lyrics Stream (Desktop always, Mobile when 'lyrics') ── */}
        <div
          className={`flex-1 flex flex-col overflow-hidden min-h-0 bg-[#fbf9f5] ${
            mobileTab === 'lyrics' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <PodcastLyricsStream
            cues={cues}
            activeCueIndex={activeCueIndex}
            onSeekToCue={onSeekToCue}
            showTranslation={showTranslation}
            bookmarkedCueIds={bookmarkedCueIds}
            onToggleBookmarkCue={onToggleBookmarkCue}
            className="flex-1"
          />

          {/* Mobile Bottom Sticky Transport Bar when viewing lyrics */}
          <div className="lg:hidden border-t border-[#e8ddd0] bg-white/95 backdrop-blur-md p-3 flex flex-col gap-2 shrink-0">
            {/* Scrubber Line */}
            <div className="w-full flex items-center gap-2">
              <span className="text-[10px] font-mono text-stone-500">{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max={duration || 100}
                step="0.1"
                value={currentTime}
                onChange={(e) => onSeek && onSeek(parseFloat(e.target.value))}
                className="flex-1 h-2 py-2 rounded-lg appearance-none cursor-pointer bg-[#e8ddd0] accent-amber-500"
                aria-label="音频时间进度条"
              />
              <span className="text-[10px] font-mono text-stone-500">{formatTime(duration)}</span>
            </div>

            {/* Quick Transport Controls */}
            <div className="flex items-center justify-between px-2">
              <button
                onClick={() => onSeekRelative && onSeekRelative(-15)}
                className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl border border-[#e8ddd0] bg-white flex flex-col items-center justify-center text-stone-700 active:scale-90 cursor-pointer"
                title="快退 15 秒"
              >
                <RotateCcw size={14} />
                <span className="text-[7px] font-mono font-bold leading-none mt-0.5">15s</span>
              </button>

              <button
                onClick={onPlayPause}
                className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center border-2 border-amber-600 active:scale-95 cursor-pointer shadow-none"
                title="播放/暂停"
              >
                {isPlaying ? (
                  <Pause size={20} className="fill-current" />
                ) : (
                  <Play size={20} className="fill-current translate-x-0.5" />
                )}
              </button>

              <button
                onClick={() => onSeekRelative && onSeekRelative(15)}
                className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl border border-[#e8ddd0] bg-white flex flex-col items-center justify-center text-stone-700 active:scale-90 cursor-pointer"
                title="快进 15 秒"
              >
                <RotateCw size={14} />
                <span className="text-[7px] font-mono font-bold leading-none mt-0.5">15s</span>
              </button>

              {(onToggleSleepTimer || sleepTimerMode) && (
                <button
                  type="button"
                  onClick={onToggleSleepTimer}
                  className={`min-h-[40px] rounded-xl border flex items-center justify-center transition-colors cursor-pointer select-none ${
                    sleepTimerMode
                      ? 'px-2 gap-1 bg-amber-500 text-white border-amber-600 font-bold'
                      : 'w-10 border-[#e8ddd0] bg-white text-stone-600 hover:text-amber-950'
                  }`}
                  title={sleepTimerMode ? `睡眠定时生效中: ${sleepTimerRemaining}` : '开启睡眠定时'}
                  aria-label="睡眠定时"
                >
                  <Moon size={14} />
                  {sleepTimerMode && (
                    <span className="text-[10px] font-mono">{sleepTimerRemaining}</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PodcastPlayerView;
