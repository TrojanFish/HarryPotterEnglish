import React, { useRef, useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipBack, 
  SkipForward, 
  Repeat, 
  Volume2, 
  VolumeX, 
  Gauge,
  Sparkles,
  Mic,
  Award
} from 'lucide-react';
import { formatTime } from '../utils/vttParser';
import { playCorrectChime } from '../utils/spellAudioSynthesizer';

/**
 * AudioPlayer — Elder Wand Bottom Audio Player designed for Students.
 * - Big comfortable Play/Pause button (easy to tap on tablets & phones)
 * - 5s rewind for repeating hard syllables
 * - Beginner speed controls: 0.75x (慢速磨耳朵), 1.0x (原速), 1.15x (进阶速)
 * - Clear sentence counter and glowing Elder Wand scrubber
 */
export function AudioPlayer({
  currentBook,
  currentChapter,
  audioSrc,
  currentTime,
  duration,
  isPlaying,
  onPlayPause,
  onSeek,
  onPrevSentence,
  onNextSentence,
  onReplayCurrentSentence,
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
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const prevVolumeRef = useRef(volume);
  const speedMenuContainerRef = useRef(null);

  useEffect(() => {
    if (!showSpeedMenu) return;
    const handleClickOutside = (e) => {
      if (speedMenuContainerRef.current && !speedMenuContainerRef.current.contains(e.target)) {
        setShowSpeedMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSpeedMenu]);

  const speedOptions = [
    { rate: 0.75, label: '0.75x (慢速磨耳朵)' },
    { rate: 0.85, label: '0.85x (稍慢)' },
    { rate: 1.0,  label: '1.0x (原速标准)' },
    { rate: 1.15, label: '1.15x (进阶提速)' },
    { rate: 1.25, label: '1.25x (挑战速)' },
  ];

  const handleVolumeToggle = () => {
    if (isMuted) {
      setIsMuted(false);
      onChangeVolume(prevVolumeRef.current || 0.85);
    } else {
      prevVolumeRef.current = volume;
      setIsMuted(true);
      onChangeVolume(0);
    }
  };

  // Rewind 5 seconds
  const handleRewind5s = () => {
    onSeek(Math.max(0, currentTime - 5));
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const coverUrl = currentBook ? `/api/raw/podcasts/${currentBook.id}/cover.jpg` : null;

  // ── Duolingo Micro-Waypoints (5-minute chunk milestones) ─────────
  const celebratedWaypointsRef = useRef(new Set());
  const [activeMilestoneToast, setActiveMilestoneToast] = useState(null);

  const waypoints = React.useMemo(() => {
    if (!duration || duration <= 0) return [];
    const list = [];
    const interval = 300; // 5 minutes in seconds
    if (duration > 360) {
      for (let t = interval; t < duration - 45; t += interval) {
        const idx = list.length + 1;
        list.push({
          id: `wp_${t}`,
          time: t,
          percent: (t / duration) * 100,
          label: `第 ${idx} 哨所 (${Math.round(t / 60)} 分钟)`,
          passed: currentTime >= t
        });
      }
    } else if (duration > 120) {
      [0.33, 0.66].forEach((ratio, idx) => {
        const t = Math.round(duration * ratio);
        list.push({
          id: `wp_${t}`,
          time: t,
          percent: ratio * 100,
          label: `微关卡 ${idx + 1}`,
          passed: currentTime >= t
        });
      });
    }
    return list;
  }, [duration, currentTime]);

  // Reset celebrated waypoints when chapter changes
  useEffect(() => {
    celebratedWaypointsRef.current.clear();
    setActiveMilestoneToast(null);
  }, [currentChapter?.id]);

  // Trigger celebration when user passes a new micro-waypoint during playback
  useEffect(() => {
    if (!isPlaying || !duration || duration <= 0) return;
    waypoints.forEach((wp) => {
      if (wp.passed && !celebratedWaypointsRef.current.has(wp.id)) {
        celebratedWaypointsRef.current.add(wp.id);
        setActiveMilestoneToast(`抵达 ${wp.label}！连续精听已达成，魔力充盈！`);
        playCorrectChime();
        const timer = setTimeout(() => {
          setActiveMilestoneToast(null);
        }, 4000);
        return () => clearTimeout(timer);
      }
    });
  }, [currentTime, isPlaying, duration, waypoints]);

  return (
    <div className={`shrink-0 border-t-2 transition-colors duration-300 backdrop-blur-xl select-none relative ${
      isParchment 
        ? 'bg-[#ffffff]/98 border-[#eee5d8] text-[#1e1610]' 
        : 'bg-[#0f172a]/95 border-slate-800 text-slate-100'
    }`}>
      {/* ── Micro-Waypoint Celebration Floating Toast ─────────────── */}
      {activeMilestoneToast && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-amber-900 text-white font-bold text-xs border border-amber-400/80 flex items-center gap-2 animate-bounce z-50 pointer-events-none">
          <Sparkles size={14} className="text-amber-300" />
          <span>{activeMilestoneToast}</span>
        </div>
      )}

      {/* ── Elder Wand Scrubber Bar with Lumos Sparkle Tip & Discrete Waypoints ── */}
      <div 
        className="w-full h-3 bg-amber-100/80 cursor-pointer relative group"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const ratio = Math.max(0, Math.min(1, clickX / rect.width));
          onSeek(ratio * duration);
        }}
        title="点击或拖动魔杖调整音频进度"
      >
        {/* Glow Active Fill */}
        <div 
          className="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 relative transition-all duration-100 ease-linear"
          style={{ width: `${progressPercent}%` }}
        >
          {/* Elder wand lumos tip */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white wand-pulse border-2 border-amber-500 transform scale-90 group-hover:scale-125 transition-transform" />
        </div>

        {/* Discrete Micro-Waypoint Milestone Jewel Pins */}
        {waypoints.map((wp) => (
          <div
            key={wp.id}
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 transition-all duration-300 pointer-events-auto cursor-pointer ${
              wp.passed
                ? 'w-3.5 h-3.5 rotate-45 bg-amber-400 border-2 border-amber-600 scale-110'
                : 'w-2.5 h-2.5 rotate-45 bg-amber-100/95 border border-amber-400/80 hover:scale-125 hover:bg-amber-200'
            }`}
            style={{ left: `${wp.percent}%` }}
            onClick={(e) => {
              e.stopPropagation();
              onSeek(wp.time);
            }}
            title={`${wp.label} · ${wp.passed ? '已点亮' : '点击前往'}`}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
        
        {/* ── Left: Thumbnail + Chapter Title + Progress (No text wrapping) ── */}
        <div className="flex items-center space-x-3 min-w-0 flex-1 sm:max-w-xs md:max-w-sm">
          {coverUrl && (
            <div className="w-9 h-12 aspect-[3/4] rounded-lg border border-[#eee5d8] overflow-hidden shrink-0 hidden sm:block bg-stone-100">
              <img
                src={coverUrl}
                alt="Book cover"
                onError={(e) => { e.target.style.display = 'none'; }}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center space-x-1.5 truncate">
              {isPlaying && (
                <span className="flex items-center gap-0.5 text-amber-500 shrink-0">
                  <span className="w-1 h-3 bg-amber-500 rounded-full animate-wave-1" />
                  <span className="w-1 h-4 bg-amber-600 rounded-full animate-wave-2" />
                  <span className="w-1 h-2 bg-amber-500 rounded-full animate-wave-3" />
                </span>
              )}
              <span 
                className="font-bold text-xs sm:text-sm text-amber-950 truncate" 
                title={currentChapter ? (currentChapter.cnTitle ? `${currentChapter.cnTitle} · ${currentChapter.title}` : currentChapter.title) : 'Chapter'}
              >
                {currentChapter ? (currentChapter.cnTitle || currentChapter.title) : 'Chapter'}
              </span>
            </div>

            <div className="flex items-center space-x-2 text-xs font-mono mt-0.5 text-stone-500 truncate">
              <span className="text-amber-700 font-bold">
                {formatTime(currentTime)}
              </span>
              <span>/</span>
              <span>{formatTime(duration)}</span>
              {totalCues > 0 && (
                <span className="text-stone-400">
                  · 第 {activeCueIndex + 1}/{totalCues} 句
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Center: Clean Transport Controls (Flat, Crisp, Shadow-free) ── */}
        <div className="flex items-center space-x-2">
          {/* Rewind 5s */}
          <button
            onClick={handleRewind5s}
            className="w-8 h-8 rounded-xl border border-[#eee5d8] bg-white hover:bg-stone-50 text-stone-600 hover:text-amber-950 hover:border-amber-300 transition-colors active:scale-95 flex items-center justify-center cursor-pointer relative"
            title="后退 5 秒"
          >
            <RotateCcw size={14} />
            <span className="absolute -bottom-1 -right-1 text-[8px] font-mono font-bold text-amber-900 bg-amber-100 rounded px-0.5 border border-amber-200">
              5s
            </span>
          </button>

          {/* Previous Sentence */}
          <button
            onClick={onPrevSentence}
            disabled={activeCueIndex <= 0}
            className="w-8 h-8 rounded-xl border border-[#eee5d8] bg-white text-stone-600 hover:text-amber-950 hover:border-amber-300 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors active:scale-95 flex items-center justify-center cursor-pointer"
            title="上一句 (快捷键: ←)"
          >
            <SkipBack size={15} />
          </button>

          {/* Main Play / Pause Button (Clean Flat 44px) */}
          <button
            onClick={onPlayPause}
            className="w-11 h-11 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center border border-amber-600 active:scale-95 transition-all cursor-pointer"
            title="播放 / 暂停 (快捷键: Space)"
          >
            {isPlaying ? (
              <Pause size={18} className="fill-current" />
            ) : (
              <Play size={18} className="fill-current translate-x-0.5" />
            )}
          </button>

          {/* Next Sentence */}
          <button
            onClick={onNextSentence}
            disabled={activeCueIndex >= totalCues - 1}
            className="w-8 h-8 rounded-xl border border-[#eee5d8] bg-white text-stone-600 hover:text-amber-950 hover:border-amber-300 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors active:scale-95 flex items-center justify-center cursor-pointer"
            title="下一句 (快捷键: →)"
          >
            <SkipForward size={15} />
          </button>

          {/* Single Sentence Loop Toggle */}
          <button
            onClick={onToggleLoopSentence}
            className={`w-8 h-8 rounded-xl border transition-colors active:scale-95 flex items-center justify-center cursor-pointer ${
              isLoopSentence 
                ? 'bg-amber-500 text-white border-amber-500 font-bold' 
                : 'border-[#eee5d8] bg-white text-stone-500 hover:text-amber-950 hover:border-amber-300'
            }`}
            title={isLoopSentence ? "单句循环：开启 (按 L 关闭)" : "单句循环：关闭 (按 L 开启)"}
          >
            <div className="relative">
              <Repeat size={14} />
              <span className="absolute -bottom-1.5 -right-1.5 text-[8px] font-bold">1</span>
            </div>
          </button>
        </div>

        {/* ── Right: Speed, Voice Recording & Volume (Clean Layout) ── */}
        <div className="hidden sm:flex items-center space-x-2.5 flex-1 justify-end min-w-0">
          {/* Quick 0.8x Slow Listening Toggle */}
          <button
            onClick={() => {
              if (playbackRate === 0.8) {
                onChangePlaybackRate(1.0);
              } else {
                onChangePlaybackRate(0.8);
              }
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
              playbackRate === 0.8
                ? 'bg-amber-500 text-white border-amber-500'
                : 'border-[#eee5d8] bg-white text-stone-700 hover:border-amber-300'
            }`}
            title="0.8x 慢速精听模式"
          >
            <Sparkles size={12} className={playbackRate === 0.8 ? 'text-white' : 'text-amber-600'} />
            <span>0.8x 慢速</span>
          </button>

          {/* Speed Selector */}
          <div className="relative" ref={speedMenuContainerRef}>
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="px-2.5 py-1.5 rounded-xl border border-[#eee5d8] bg-white text-stone-800 font-mono font-bold hover:border-amber-300 text-xs transition-colors cursor-pointer flex items-center space-x-1"
              title="调整朗读语速"
            >
              <Gauge size={13} className="text-amber-700" />
              <span>{playbackRate}x</span>
            </button>

            {showSpeedMenu && (
              <div className="absolute bottom-full mb-2 right-0 rounded-2xl border border-[#eee5d8] bg-white p-1.5 z-50 flex flex-col min-w-[150px]">
                {speedOptions.map(({ rate, label }) => (
                  <button
                    key={rate}
                    onClick={() => {
                      onChangePlaybackRate(rate);
                      setShowSpeedMenu(false);
                    }}
                    className={`px-3 py-1.5 text-xs text-left rounded-xl transition-colors cursor-pointer ${
                      playbackRate === rate 
                        ? 'bg-amber-500 text-white font-bold' 
                        : 'hover:bg-amber-50 text-stone-700 font-medium'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Shadowing Voice Recording Button */}
          <button
            onClick={onToggleRecorder}
            className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-1.5 transition-colors font-bold cursor-pointer ${
              isRecordingActive 
                ? 'bg-red-600 text-white border-red-600' 
                : 'border-[#eee5d8] bg-white text-stone-700 hover:border-amber-400 hover:text-amber-950'
            }`}
            title="开启单句跟读录音评测"
          >
            <Mic size={13} className={isRecordingActive ? 'text-white' : 'text-amber-700'} />
            <span className="hidden md:inline">跟读施咒</span>
          </button>

          {/* Volume Slider */}
          <div className="hidden lg:flex items-center space-x-1.5 pl-2 border-l border-[#eee5d8]">
            <button 
              onClick={handleVolumeToggle}
              className="p-1 rounded-lg text-stone-400 hover:text-amber-900 transition-colors cursor-pointer"
              title="静音 / 恢复音量"
            >
              {isMuted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onChangeVolume(val);
                if (isMuted && val > 0) setIsMuted(false);
              }}
              className="w-16 h-1.5 accent-amber-500 bg-stone-200 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
