import React from 'react';
import {
  Play,
  Pause,
  SkipForward,
  Headphones
} from 'lucide-react';
import { formatEnglishText } from '../../utils/vttParser';

/**
 * MobileMiniPlayer — Floating Capsule Audio Player for Mobile (< 768px)
 * Appears above the bottom navigation bar when user is on Bookshelf or Vocab pages:
 * - Allows seamless background audio control without losing reading context
 * - 1-tap to expand into full Player view
 * - Strictly 100% Lucide SVG, zero Unicode emojis
 */
export function MobileMiniPlayer({
  currentBook,
  currentChapter,
  isPlaying = false,
  onTogglePlay,
  onPlayPause,
  onNextSentence,
  onEnterPlayer,
  onOpenPlayer,
  currentTime = 0,
  duration = 0
}) {
  if (!currentChapter) return null;

  const handleOpen = onEnterPlayer || onOpenPlayer;
  const handlePlayToggle = onPlayPause || onTogglePlay;

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const percent = duration > 0 ? Math.min(100, Math.round((currentTime / duration) * 100)) : 0;
  const cleanTitle = formatEnglishText(currentChapter.cnTitle || currentChapter.title);

  return (
    <div 
      className="md:hidden fixed bottom-[calc(3.2rem+max(0.875rem,calc(env(safe-area-inset-bottom,0px)+0.375rem)))] left-2.5 right-2.5 z-30 rounded-2xl bg-amber-500 text-white border border-amber-600 flex flex-col overflow-hidden select-none animate-slideUp"
    >
      <div className="flex items-center justify-between p-2.5">
        {/* Clickable Info Area -> Enter Player */}
        <div 
          onClick={handleOpen}
          className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
          title="点击进入全功能精听教室"
        >
          <div className="w-8 h-8 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center font-bold text-xs text-white shrink-0">
            <Headphones size={15} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-white truncate leading-tight">
              {cleanTitle}
            </h4>
            <p className="text-[10px] text-amber-100 font-mono font-medium truncate mt-0.5">
              {formatTime(currentTime)} / {formatTime(duration)} · {isPlaying ? '播放中' : '已暂停'}
            </p>
          </div>
        </div>

        {/* Quick Transport Buttons (Apple HIG >= 44x44pt touch targets) */}
        <div className="flex items-center gap-1 shrink-0 ml-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (handlePlayToggle) handlePlayToggle();
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

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onNextSentence) onNextSentence();
            }}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center active:scale-95 transition-transform cursor-pointer shrink-0"
            title="下一句 (→)"
            aria-label="跳转到下一句"
          >
            <SkipForward size={16} />
          </button>
        </div>
      </div>

      {/* Mini Progress Bar Line */}
      <div className="w-full bg-black/15 h-1">
        <div 
          className="bg-white h-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export default MobileMiniPlayer;
