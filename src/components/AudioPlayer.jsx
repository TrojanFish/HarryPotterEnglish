import React, { useRef, useState } from 'react';
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
  Mic
} from 'lucide-react';
import { formatTime } from '../utils/vttParser';

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

  return (
    <div className={`shrink-0 border-t transition-colors duration-300 shadow-xl backdrop-blur-md select-none ${
      isParchment 
        ? 'bg-[#ffffff]/95 border-[#e8dcb9] text-[#2c221e]' 
        : 'bg-[#0f172a]/95 border-slate-800 text-slate-100'
    }`}>
      {/* ── Elder Wand Scrubber Bar with Lumos Sparkle Tip ───────────── */}
      <div 
        className="w-full h-2.5 bg-gray-200 dark:bg-slate-800 cursor-pointer relative group"
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
      </div>

      <div className="max-w-7xl mx-auto px-4 py-2 sm:py-2.5 flex items-center justify-between gap-3">
        
        {/* ── Left: Thumbnail + Title + Sentence Count ─────────────── */}
        <div className="flex items-center space-x-3 w-full md:w-1/3 min-w-0">
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
              <span className="font-magical font-bold text-xs sm:text-sm text-amber-900 dark:text-amber-300 truncate">
                {currentChapter ? currentChapter.title : 'Chapter'}
              </span>
            </div>

            <div className="flex items-center space-x-2 text-[11px] font-mono mt-0.5 text-slate-500">
              <span className="text-amber-600 dark:text-amber-400 font-bold">
                {formatTime(currentTime)}
              </span>
              <span>/</span>
              <span>{formatTime(duration)}</span>
              {totalCues > 0 && (
                <span className="hidden sm:inline text-amber-700 dark:text-amber-300 font-bold">
                  (第 {activeCueIndex + 1}/{totalCues} 句)
                </span>
              )}
            </div>
          </div>

          {/* Shadowing recording toggle button */}
          <button
            onClick={onToggleRecorder}
            className={`p-1.5 rounded-xl border text-xs flex items-center gap-1 transition-all shrink-0 ml-auto ${
              isRecordingActive 
                ? 'bg-red-700 text-white border-red-500 shadow-md animate-pulse' 
                : isParchment
                ? 'border-amber-300/80 text-amber-800 hover:bg-amber-100/60'
                : 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-amber-300'
            }`}
            title="开启本句跟读施咒录音打分"
          >
            <Mic size={14} className="text-amber-600 dark:text-amber-400" />
            <span className="text-[11px] hidden lg:inline font-bold">跟读施咒</span>
          </button>
        </div>

        {/* ── Center: Main Playback Controls ───────────────────────── */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* Rewind 5s */}
          <button
            onClick={handleRewind5s}
            className="p-2 rounded-full hover:bg-amber-100 dark:hover:bg-slate-800 text-slate-500 hover:text-amber-600 transition-colors"
            title="后退 5 秒 (重听一遍)"
          >
            <RotateCcw size={16} />
          </button>

          {/* Single Sentence Loop Toggle */}
          <button
            onClick={onToggleLoopSentence}
            className={`p-2 rounded-full border transition-all ${
              isLoopSentence 
                ? 'bg-amber-500 text-white border-amber-500 shadow-md font-bold scale-105' 
                : 'border-gray-300 dark:border-slate-700 text-slate-400 hover:text-amber-600'
            }`}
            title={isLoopSentence ? "单句精听循环：已开启 (按 L 关闭)" : "开启单句精听循环 (按 L 开启)"}
          >
            <div className="relative">
              <Repeat size={16} />
              <span className="absolute -bottom-1 -right-1 text-[8px] font-black">1</span>
            </div>
          </button>

          {/* Previous Sentence */}
          <button
            onClick={onPrevSentence}
            disabled={activeCueIndex <= 0}
            className="p-2 rounded-full text-slate-500 hover:text-amber-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="上一句 (快捷键: 左箭头 ←)"
          >
            <SkipBack size={18} />
          </button>

          {/* Main Play / Pause Button (Big, Friendly 48px) */}
          <button
            onClick={onPlayPause}
            className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-amber-500/30"
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
            className="p-2 rounded-full text-slate-500 hover:text-amber-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="下一句 (快捷键: 右箭头 →)"
          >
            <SkipForward size={18} />
          </button>

          {/* Student Speed Selector */}
          <div className="relative">
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="px-2.5 py-1.5 rounded-xl border border-gray-300 dark:border-slate-700 text-xs font-mono font-bold hover:border-amber-500 hover:text-amber-600 transition-colors flex items-center space-x-1"
              title="调整朗读语速"
            >
              <Gauge size={13} />
              <span>{playbackRate}x</span>
            </button>

            {showSpeedMenu && (
              <div className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 rounded-2xl shadow-2xl border p-1.5 z-50 flex flex-col min-w-[170px] ${
                isParchment ? 'bg-[#ffffff] border-[#e8dcb9]' : 'bg-slate-900 border-slate-800'
              }`}>
                {speedOptions.map(({ rate, label }) => (
                  <button
                    key={rate}
                    onClick={() => {
                      onChangePlaybackRate(rate);
                      setShowSpeedMenu(false);
                    }}
                    className={`px-3 py-1.5 text-xs text-left rounded-xl transition-all ${
                      playbackRate === rate 
                        ? 'bg-amber-500 text-white font-bold shadow-sm' 
                        : 'hover:bg-amber-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
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
            className="text-slate-400 hover:text-amber-600 transition-colors"
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
            className="w-20 accent-amber-500 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            title="调节音量"
          />
        </div>

      </div>
    </div>
  );
}
