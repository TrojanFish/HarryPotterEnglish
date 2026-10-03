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
    <div className={`shrink-0 border-t transition-colors duration-300 shadow-[0_-8px_30px_rgba(160,110,60,0.06)] backdrop-blur-xl select-none relative ${
      isParchment 
        ? 'bg-[#ffffff]/95 border-[#ede4d5] text-[#1e1610]' 
        : 'bg-[#0f172a]/95 border-slate-800 text-slate-100'
    }`}>
      {/* ── Micro-Waypoint Celebration Floating Toast ─────────────── */}
      {activeMilestoneToast && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-amber-900 text-white font-bold text-xs shadow-xl border border-amber-400/80 flex items-center gap-2 animate-bounce z-50 pointer-events-none">
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
          className="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 relative transition-all duration-100 ease-linear shadow-sm"
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
                ? 'w-3.5 h-3.5 rotate-45 bg-amber-400 border-2 border-amber-600 shadow-[0_0_8px_rgba(245,158,11,0.9)] scale-110'
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

      <div className="max-w-7xl mx-auto px-4 py-2 sm:py-2.5 flex items-center justify-between gap-3">
        
        {/* ── Left: Thumbnail + Title + Sentence Count ─────────────── */}
        <div className="flex items-center space-x-2.5 sm:space-x-3 flex-1 md:w-1/3 md:flex-initial min-w-0">
          {coverUrl && (
            <div className="w-10 h-13 aspect-[3/4] rounded-lg border border-amber-400/60 shadow-sm overflow-hidden shrink-0 hidden sm:block bg-slate-900">
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
              <span className="font-magical font-bold text-xs sm:text-sm text-amber-900 truncate" title={currentChapter ? (currentChapter.cnTitle ? `${currentChapter.cnTitle} · ${currentChapter.title}` : currentChapter.title) : 'Chapter'}>
                {currentChapter ? (currentChapter.cnTitle ? `${currentChapter.cnTitle} · ${currentChapter.title}` : currentChapter.title) : 'Chapter'}
              </span>
            </div>

            <div className="flex items-center space-x-2 text-[11px] font-mono mt-0.5 text-slate-500">
              <span className="text-amber-600 font-bold">
                {formatTime(currentTime)}
              </span>
              <span>/</span>
              <span>{formatTime(duration)}</span>
              {totalCues > 0 && (
                <span className="hidden sm:inline text-amber-700 font-bold">
                  (第 {activeCueIndex + 1}/{totalCues} 句)
                </span>
              )}
              {waypoints.length > 0 && (
                <span 
                  className="hidden md:inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-900 border border-amber-400/40"
                  title="5分钟微关卡达成进度"
                >
                  <Award size={11} className="text-amber-600" />
                  <span>关卡 {waypoints.filter(w => w.passed).length}/{waypoints.length}</span>
                </span>
              )}
            </div>
          </div>

          {/* Shadowing recording toggle button */}
          <button
            onClick={onToggleRecorder}
            className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-1.5 transition-all shrink-0 ml-auto font-bold shadow-xs active:scale-95 cursor-pointer ${
              isRecordingActive 
                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white border-red-500 shadow-md animate-pulse' 
                : 'border-amber-300/80 bg-white/90 text-amber-950 hover:bg-amber-50 hover:border-amber-400'
            }`}
            title="开启本句跟读施咒录音打分"
          >
            <Mic size={14} className={isRecordingActive ? 'text-white' : 'text-amber-700'} />
            <span className="text-[11px] hidden sm:inline">跟读施咒</span>
          </button>
        </div>

        {/* ── Center: Main Playback Controls ───────────────────────── */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5">
          
          {/* Rewind 5s */}
          <button
            onClick={handleRewind5s}
            className="p-2.5 rounded-xl border border-amber-200/80 bg-white/80 hover:bg-amber-50 text-slate-600 hover:text-amber-800 hover:border-amber-400 transition-all active:scale-95 shadow-xs relative cursor-pointer"
            title="后退 5 秒 (重听片段)"
          >
            <RotateCcw size={15} />
            <span className="absolute -bottom-0.5 -right-0.5 text-[8px] font-mono font-bold text-amber-900 bg-amber-100 rounded px-0.5 border border-amber-300/80">
              5s
            </span>
          </button>

          {/* Replay Current Sentence */}
          <button
            onClick={onReplayCurrentSentence}
            className="p-2.5 rounded-xl border border-amber-200/80 bg-white/80 hover:bg-amber-50 text-slate-600 hover:text-amber-800 hover:border-amber-400 transition-all active:scale-95 shadow-xs relative cursor-pointer"
            title="从头重播当前句 (快捷键: R)"
          >
            <RotateCcw size={15} />
            <span className="absolute -bottom-0.5 -right-0.5 text-[8px] font-bold text-amber-900 bg-amber-100 rounded px-0.5 border border-amber-300/80">
              句
            </span>
          </button>

          {/* Single Sentence Loop Toggle */}
          <button
            onClick={onToggleLoopSentence}
            className={`p-2.5 rounded-xl border transition-all active:scale-95 shadow-xs cursor-pointer ${
              isLoopSentence 
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-500 shadow-sm font-bold scale-105' 
                : 'border-amber-200/80 bg-white/80 text-slate-500 hover:text-amber-800 hover:border-amber-400 hover:bg-amber-50'
            }`}
            title={isLoopSentence ? "单句精听循环：已开启 (按 L 关闭)" : "开启单句精听循环 (按 L 开启)"}
          >
            <div className="relative">
              <Repeat size={15} />
              <span className="absolute -bottom-1 -right-1 text-[8px] font-black">1</span>
            </div>
          </button>

          {/* Previous Sentence */}
          <button
            onClick={onPrevSentence}
            disabled={activeCueIndex <= 0}
            className="p-2.5 rounded-xl border border-amber-200/80 bg-white/80 text-slate-600 hover:text-amber-800 hover:border-amber-400 hover:bg-amber-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 shadow-xs cursor-pointer"
            title="上一句 (快捷键: 左箭头 ←)"
          >
            <SkipBack size={16} />
          </button>

          {/* Main Play / Pause Button (Hero 48px with 3D physical depth) */}
          <button
            onClick={onPlayPause}
            className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-white flex items-center justify-center border-b-4 border-amber-700 active:border-b-0 active:translate-y-1 transition-all shadow-md hover:shadow-lg hover:shadow-amber-500/30 cursor-pointer"
            title="播放 / 暂停 (快捷键: 空格键 Space)"
          >
            {isPlaying ? (
              <Pause size={22} className="fill-current" />
            ) : (
              <Play size={22} className="fill-current translate-x-0.5" />
            )}
          </button>

          {/* Next Sentence */}
          <button
            onClick={onNextSentence}
            disabled={activeCueIndex >= totalCues - 1}
            className="duo-touch-target p-2.5 rounded-xl border border-amber-200/80 bg-white/80 text-slate-600 hover:text-amber-800 hover:border-amber-400 hover:bg-amber-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 shadow-xs cursor-pointer"
            title="下一句 (快捷键: 右箭头 →)"
          >
            <SkipForward size={16} />
          </button>

          {/* Quick 0.8x Slow Listening Toggle (Kid-friendly acoustic training) */}
          <button
            onClick={() => {
              if (playbackRate === 0.8) {
                onChangePlaybackRate(1.0);
              } else {
                onChangePlaybackRate(0.8);
              }
            }}
            className={`hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 shadow-xs cursor-pointer ${
              playbackRate === 0.8
                ? 'bg-amber-500 text-white border-amber-500 shadow-sm scale-105'
                : 'border-amber-200/80 bg-white/80 text-amber-900 hover:bg-amber-50 hover:border-amber-400'
            }`}
            title={playbackRate === 0.8 ? "当前为 0.8x 慢速磨耳朵模式，点击恢复 1.0x 原速" : "一键开启 0.8x 慢速磨耳朵精听（辨析连读与爆破音）"}
          >
            <Sparkles size={12} className={playbackRate === 0.8 ? 'text-white' : 'text-amber-600'} />
            <span>{playbackRate === 0.8 ? '0.8x 慢速中' : '0.8x 慢速'}</span>
          </button>

          {/* Student Speed Selector */}
          <div className="relative" ref={speedMenuContainerRef}>
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="px-3 py-2 rounded-xl border border-amber-200/80 bg-white/80 text-amber-950 font-mono font-bold hover:border-amber-400 hover:bg-amber-50 text-xs transition-all active:scale-95 shadow-xs flex items-center space-x-1 cursor-pointer"
              title="调整朗读语速"
            >
              <Gauge size={13} className="text-amber-700" />
              <span>{playbackRate}x</span>
            </button>

            {showSpeedMenu && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 rounded-2xl shadow-xl border border-[#e8dcb9] bg-[#ffffff] p-1.5 z-50 flex flex-col min-w-[170px]">
                {speedOptions.map(({ rate, label }) => (
                  <button
                    key={rate}
                    onClick={() => {
                      onChangePlaybackRate(rate);
                      setShowSpeedMenu(false);
                    }}
                    className={`px-3 py-1.5 text-xs text-left rounded-xl transition-all cursor-pointer ${
                      playbackRate === rate 
                        ? 'bg-amber-500 text-white font-bold shadow-xs' 
                        : 'hover:bg-amber-100/70 text-slate-700 font-medium'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Volume Slider ─────────────────────────────────── */}
        <div className="hidden md:flex items-center space-x-2 w-1/3 justify-end">
          <button 
            onClick={handleVolumeToggle}
            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-800 hover:bg-amber-100/60 transition-colors cursor-pointer"
            title="静音 / 恢复音量"
          >
            {isMuted || volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setIsMuted(false);
              onChangeVolume(parseFloat(e.target.value));
            }}
            className="w-20 accent-amber-500 h-1.5 bg-amber-100 rounded-lg cursor-pointer"
            title="调节音量"
          />
        </div>

      </div>
    </div>
  );
}
