import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Volume2,
  VolumeX,
  Mic,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { formatTime } from '../utils/vttParser';
import { playCorrectChime } from '../utils/spellAudioSynthesizer';

/**
 * AudioPlayer — Refactored v2.0 Player Bar
 * Two-row layout: thin scrubber line + compact controls
 * - All controls visible on mobile (no hidden sm:flex)
 * - Speed: one-tap 3-step cycle (0.8x → 1.0x → 1.25x)
 * - Volume moved to overflow sheet on mobile
 * - Milestone toast positioned at top-center of screen
 */
export function AudioPlayer({
  currentBook,
  currentChapter,
  currentTime,
  duration,
  isPlaying,
  onPlayPause,
  onSeek,
  onPrevSentence,
  onNextSentence,
  isLoopSentence,
  onToggleLoopSentence,
  playbackRate,
  onChangePlaybackRate,
  volume,
  onChangeVolume,
  activeCue,
  totalCues,
  activeCueIndex,
  isParchment,
  onToggleRecorder,
  isRecordingActive
}) {
  const [isMuted, setIsMuted] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  const prevVolumeRef = useRef(volume);
  const volumeRef = useRef(null);
  const isDragging = useRef(false);

  // Speed cycle: 0.8 → 1.0 → 1.25 → repeat
  const SPEED_STEPS = [0.8, 1.0, 1.25];
  const handleSpeedCycle = useCallback(() => {
    const idx = SPEED_STEPS.indexOf(playbackRate);
    const next = SPEED_STEPS[(idx + 1) % SPEED_STEPS.length];
    onChangePlaybackRate(next);
  }, [playbackRate, onChangePlaybackRate]);

  const handleVolumeToggle = useCallback(() => {
    if (isMuted) {
      setIsMuted(false);
      onChangeVolume(prevVolumeRef.current || 0.85);
    } else {
      prevVolumeRef.current = volume;
      setIsMuted(true);
      onChangeVolume(0);
    }
  }, [isMuted, volume, onChangeVolume]);

  // Close volume popup on outside click
  useEffect(() => {
    if (!showVolume) return;
    const handle = (e) => {
      if (volumeRef.current && !volumeRef.current.contains(e.target)) {
        setShowVolume(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [showVolume]);

  // Milestone celebration
  const celebratedRef = useRef(new Set());
  const [milestoneToast, setMilestoneToast] = useState(null);

  const waypoints = React.useMemo(() => {
    if (!duration || duration <= 0) return [];
    const list = [];
    if (duration > 360) {
      for (let t = 300; t < duration - 45; t += 300) {
        list.push({ id: `wp_${t}`, time: t, label: `已精听 ${Math.round(t / 60)} 分钟` });
      }
    }
    return list;
  }, [duration]);

  useEffect(() => {
    celebratedRef.current.clear();
    setMilestoneToast(null);
  }, [currentChapter?.id]);

  useEffect(() => {
    if (!isPlaying || !duration) return;
    waypoints.forEach((wp) => {
      if (currentTime >= wp.time && !celebratedRef.current.has(wp.id)) {
        celebratedRef.current.add(wp.id);
        setMilestoneToast(`${wp.label}，魔力充盈！`);
        playCorrectChime();
        const t = setTimeout(() => setMilestoneToast(null), 4000);
        return () => clearTimeout(t);
      }
    });
  }, [currentTime, isPlaying, duration, waypoints]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Draggable scrubber
  const handleScrubClick = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(ratio * duration);
  }, [duration, onSeek]);

  const speedLabel = playbackRate === 1.0 ? '1x' : `${playbackRate}x`;
  const chapterTitle = currentChapter
    ? (currentChapter.cnTitle || currentChapter.title || '')
    : '';

  return (
    <div className={`shrink-0 relative pb-safe select-none ${
      isParchment
        ? 'bg-white border-t border-[#e8ddd0] text-[#1e1610]'
        : 'bg-[#0f172a]/95 border-t border-slate-800 text-slate-100'
    }`}>
      {/* ── Milestone Toast (screen top-center) ─────────────────── */}
      {milestoneToast && (
        <div className="fixed top-4 left-1/2 z-50 pointer-events-none animate-slide-down"
          style={{ transform: 'translateX(-50%)' }}>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-900 text-white text-xs font-bold border border-amber-400/60">
            <Sparkles size={13} className="text-amber-300 shrink-0" />
            <span>{milestoneToast}</span>
          </div>
        </div>
      )}

      {/* ── Thin Scrubber Bar ─────────────────────────────────────── */}
      <div
        className="w-full scrubber-track bg-amber-100/80 cursor-pointer group relative"
        onClick={handleScrubClick}
        title="点击调整播放进度"
      >
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-100 ease-linear relative"
          style={{ width: `${progressPercent}%` }}
        >
          {/* Scrub thumb */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* ── Main Controls Row ─────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 px-3 sm:px-4 pt-2 pb-3">

        {/* Left: Playback info (chapter title shown only on desktop to eliminate duplicate top bar header) */}
        <div className="flex items-center gap-2 min-w-0 shrink-0 sm:flex-1 sm:max-w-xs">
          {isPlaying && (
            <span className="flex items-center gap-0.5 text-amber-500 shrink-0">
              <span className="w-[3px] h-3 bg-amber-500 rounded-full animate-wave-1" />
              <span className="w-[3px] h-4 bg-amber-600 rounded-full animate-wave-2" />
              <span className="w-[3px] h-2 bg-amber-400 rounded-full animate-wave-3" />
            </span>
          )}
          <div className="min-w-0">
            <p className="hidden sm:block font-bold text-xs text-amber-950 truncate leading-tight">
              {chapterTitle || '选择章节'}
            </p>
            <p className="text-[11px] font-mono text-stone-500 font-medium leading-tight whitespace-nowrap">
              {formatTime(currentTime)}
              {totalCues > 0 && <span className="ml-1 text-stone-400 font-normal">· {activeCueIndex + 1}/{totalCues}句</span>}
            </p>
          </div>
        </div>

        {/* Center: Transport Controls */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Rewind / Prev Sentence */}
          <button
            onClick={onPrevSentence}
            disabled={activeCueIndex <= 0}
            className="w-11 h-11 shrink-0 rounded-xl border border-[#e8ddd0] bg-white flex items-center justify-center text-stone-600 hover:text-amber-950 hover:border-amber-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors active:scale-95 cursor-pointer"
            title="上一句 (←)"
          >
            <SkipBack size={16} />
          </button>

          {/* Main Play / Pause (48px / 44px — Apple HIG compliant) */}
          <button
            onClick={onPlayPause}
            className="w-12 h-12 shrink-0 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center border border-amber-600 active:scale-95 transition-all cursor-pointer"
            title="播放/暂停 (Space)"
          >
            {isPlaying
              ? <Pause size={20} className="fill-current" />
              : <Play size={20} className="fill-current translate-x-0.5" />}
          </button>

          {/* Next Sentence */}
          <button
            onClick={onNextSentence}
            disabled={activeCueIndex >= totalCues - 1}
            className="w-11 h-11 shrink-0 rounded-xl border border-[#e8ddd0] bg-white flex items-center justify-center text-stone-600 hover:text-amber-950 hover:border-amber-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors active:scale-95 cursor-pointer"
            title="下一句 (→)"
          >
            <SkipForward size={16} />
          </button>

          {/* Loop Toggle */}
          <button
            onClick={onToggleLoopSentence}
            className={`w-11 h-11 shrink-0 rounded-xl border flex items-center justify-center transition-colors active:scale-95 cursor-pointer ${
              isLoopSentence
                ? 'bg-amber-500 text-white border-amber-600'
                : 'border-[#e8ddd0] bg-white text-stone-500 hover:text-amber-950 hover:border-amber-300'
            }`}
            title={isLoopSentence ? '单句循环：开 (L)' : '单句循环：关 (L)'}
          >
            <div className="relative">
              <Repeat size={14} />
              <span className="absolute -bottom-1.5 -right-1.5 text-[8px] font-bold">1</span>
            </div>
          </button>
        </div>

        {/* Right: Speed + Record + Volume */}
        <div className="flex items-center gap-1.5 sm:gap-2 justify-end flex-1 shrink-0">
          {/* Speed cycle button — always visible, all screen sizes, 44px square target */}
          <button
            onClick={handleSpeedCycle}
            className={`w-11 h-11 shrink-0 rounded-xl border text-xs font-mono font-bold flex items-center justify-center whitespace-nowrap transition-colors cursor-pointer select-none ${
              playbackRate !== 1.0
                ? 'bg-amber-500 text-white border-amber-500'
                : 'border-[#e8ddd0] bg-white text-stone-700 hover:border-amber-300'
            }`}
            title="点击切换速度: 0.8x → 1.0x → 1.25x"
          >
            <span className="whitespace-nowrap">{speedLabel}</span>
          </button>

          {/* Mic / Shadowing — always visible */}
          <button
            onClick={onToggleRecorder}
            className={`w-11 h-11 shrink-0 rounded-xl border flex items-center justify-center text-xs transition-colors cursor-pointer ${
              isRecordingActive
                ? 'bg-red-600 text-white border-red-600'
                : 'border-[#e8ddd0] bg-white text-stone-600 hover:border-amber-400 hover:text-amber-950'
            }`}
            title="跟读施咒（AI发音评分）"
          >
            <Mic size={16} className={isRecordingActive ? 'text-white' : 'text-amber-700'} />
          </button>

          {/* Volume — hover/click slider (desktop only) */}
          <div 
            className="relative hidden sm:block" 
            ref={volumeRef}
            onMouseEnter={() => setShowVolume(true)}
            onMouseLeave={() => setShowVolume(false)}
          >
            <button
              onClick={handleVolumeToggle}
              className="w-11 h-11 rounded-xl border border-[#e8ddd0] bg-white flex items-center justify-center text-stone-500 hover:text-amber-950 hover:border-amber-300 transition-colors cursor-pointer"
              title={isMuted ? '点击取消静音' : '点击静音，悬浮调节音量'}
            >
              {(isMuted || volume === 0) ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            {showVolume && (
              <div className="absolute bottom-full mb-2 right-0 bg-white border border-[#e8ddd0] rounded-2xl p-3 w-36 z-50 animate-fadeIn">
                <div className="flex items-center justify-between text-xs text-stone-600 mb-2 font-medium">
                  <span>音量调节</span>
                  <button 
                    onClick={handleVolumeToggle}
                    className="text-[11px] font-bold text-amber-700 hover:underline cursor-pointer"
                  >
                    {isMuted ? '取消静音' : '静音'}
                  </button>
                </div>
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    onChangeVolume(val);
                    if (isMuted && val > 0) setIsMuted(false);
                  }}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <p className="text-center text-xs font-mono text-stone-500 mt-1.5">{Math.round((isMuted ? 0 : volume) * 100)}%</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AudioPlayer;
