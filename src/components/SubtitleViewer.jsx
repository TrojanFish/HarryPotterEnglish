import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  Mic,
  Eye,
  EyeOff,
  Sparkles,
  Type,
  Headphones,
  Copy,
  Check,
  LocateFixed,
  Compass,
  Award,
  Bookmark,
  RotateCcw,
  Zap
} from 'lucide-react';
import { tokenizeSentence, formatTime } from '../utils/vttParser';
import { HP_LORE_DICTIONARY } from '../data/hpDictionary';
import {
  extractKeywordRadar,
  formatSentenceMetrics,
  calculateBlindMastery
} from '../utils/blindListeningEngine';

/**
 * SentenceCard v2 (Memoized)
 * - Inactive: bg-white, no border (spacing separates)
 * - Normal Active: border-l-4 amber + bg-amber-50/60
 * - Blind Active: border-l-4 indigo + bg-indigo-50/50 + soundwave & keyword radar
 * - Blind Inactive: clean mist placeholder
 */
export const SentenceCard = React.memo(function SentenceCard({
  cue,
  idx,
  isActive,
  isRevealed,
  isBookmarked = false,
  onToggleBookmarkCue,
  studyMode,
  showTranslation,
  fontSizeClass,
  isParchment,
  onSeekToCue,
  onWordClick,
  onRecordCue,
  onCopySentence,
  copiedCueId,
  onToggleReveal,
  cardRef,
  onAssessSentence,
  isPlaying = false,
  currentTime = 0
}) {
  const tokens = useMemo(() => tokenizeSentence(cue.text), [cue.text]);
  const [clickedWord, setClickedWord] = useState(null);

  const wordTokens = useMemo(() => {
    return tokens.filter(t => t.isWord).map(t => ({
      text: t.text,
      weight: Math.max(2, t.text.length)
    }));
  }, [tokens]);

  const wordHighlights = useMemo(() => {
    if (!isActive || !isPlaying || wordTokens.length === 0) return null;
    const start = cue.startTime ?? cue.start ?? 0;
    const end = cue.endTime ?? cue.end ?? 0;
    const duration = Math.max(0.1, end - start);
    const elapsed = Math.max(0, currentTime - start);
    const progress = Math.min(1, Math.max(0, elapsed / duration));

    const totalWeight = wordTokens.reduce((acc, w) => acc + w.weight, 0);
    let accum = 0;
    const ranges = wordTokens.map(w => {
      const startRatio = accum / totalWeight;
      accum += w.weight;
      const endRatio = accum / totalWeight;
      return { startRatio, endRatio };
    });
    return { ranges, progress };
  }, [isActive, isPlaying, wordTokens, currentTime, cue.startTime, cue.endTime, cue.start, cue.end]);

  const handleWordClick = useCallback((e, word, cueObj) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    setClickedWord(word);
    setTimeout(() => setClickedWord(null), 500);
    onWordClick(word, cueObj);
  }, [onWordClick]);

  const handleCardClick = useCallback((e) => {
    // Guard 1: ignore clicks originating from interactive buttons
    if (e.target && e.target.closest && e.target.closest('button')) return;
    // Guard 2: ignore when user is selecting/highlighting text
    const selection = window.getSelection ? window.getSelection().toString() : '';
    if (selection && selection.trim().length > 0) return;
    onSeekToCue(cue);
  }, [cue, onSeekToCue]);

  const isBlind = studyMode === 'blind';
  const isVeiled = isBlind && !isRevealed;
  const metrics = useMemo(() => (isBlind ? formatSentenceMetrics(cue) : null), [isBlind, cue]);
  const radarWords = useMemo(() => (isBlind ? extractKeywordRadar(cue.text) : []), [isBlind, cue.text]);

  return (
    <div
      ref={cardRef}
      onClick={handleCardClick}
      title={isActive ? '点击重新播放此句' : '点击播放此句'}
      className={`group relative rounded-2xl transition-all duration-200 subtitle-item-render cursor-pointer active:scale-[0.995] ${
        isActive
          ? isBlind
            ? 'reading-hero-sentence border-l-4 border-l-indigo-600 bg-indigo-50/50 hover:bg-indigo-100/40 pl-3 pr-4 pt-3.5 pb-3.5 sm:pl-4 sm:pr-5 sm:pt-4 sm:pb-4 shadow-sm'
            : 'reading-hero-sentence border-l-4 border-l-amber-500 bg-amber-50/60 hover:bg-amber-100/40 pl-3 pr-4 pt-3.5 pb-3.5 sm:pl-4 sm:pr-5 sm:pt-4 sm:pb-4 shadow-sm'
          : 'reading-inactive-sentence border-l-4 border-l-transparent bg-white hover:bg-stone-50/80 pl-3 pr-4 pt-3.5 pb-3.5 sm:pl-4 sm:pr-5 sm:pt-4 sm:pb-4'
      }`}
    >
      {/* Header: timestamps (hover-only on inactive) + action buttons */}
      <div className={`flex items-center justify-between mb-2 gap-2 ${
        isActive ? 'opacity-100' : 'opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150'
      }`}>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-mono text-[10px] text-stone-400">
            {formatTime(cue.startTime)}
          </span>
          {isBookmarked && (
            <span className="inline-flex items-center gap-1 text-[10px] text-amber-800 font-bold bg-amber-100/90 px-1.5 py-0.5 rounded border border-amber-300">
              <Bookmark size={9} className="fill-current text-amber-600" />
              <span>已星标</span>
            </span>
          )}
          {isActive && (
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${
              isBlind ? 'text-indigo-800' : 'text-amber-700'
            }`}>
              <Sparkles size={10} />
              {isBlind ? '听力自测中' : '正在朗读'}
            </span>
          )}
          {isBlind && metrics && (
            <span className="font-mono text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200">
              {metrics.label}
            </span>
          )}
        </div>

        {/* Action buttons (Apple HIG >= 44x44pt ergonomic touch targets) */}
        <div className="flex items-center gap-1.5">
          {onToggleBookmarkCue && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmarkCue(cue);
              }}
              className={`min-w-[44px] min-h-[44px] rounded-xl border flex items-center justify-center transition-colors active:scale-95 cursor-pointer ${
                isBookmarked
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'border-[#e8ddd0] bg-white text-stone-500 hover:text-amber-950 hover:border-amber-300'
              }`}
              title={isBookmarked ? '已收录至疑难句 (点击取消)' : '星标收录此句 (Accio Bookmark)'}
              aria-label="星标收录此句"
            >
              <Bookmark size={13} className={isBookmarked ? 'fill-current text-amber-600' : ''} />
            </button>
          )}

          {isActive && !isBlind && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCopySentence(cue);
              }}
              className="hidden sm:inline-flex min-w-[44px] min-h-[44px] items-center justify-center rounded-xl border border-[#e8ddd0] bg-white text-stone-500 hover:text-amber-950 transition-colors active:scale-95 cursor-pointer"
              title={copiedCueId === cue.id ? '已复制' : '复制本句'}
              aria-label="复制本句"
            >
              {copiedCueId === cue.id
                ? <Check size={13} className="text-emerald-600" />
                : <Copy size={13} />}
            </button>
          )}

          {(!isBlind || isRevealed) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRecordCue(cue);
              }}
              className="min-h-[44px] min-w-[44px] rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 transition-colors active:scale-95 cursor-pointer flex items-center justify-center"
              title="跟读施咒（AI评分）"
              aria-label="跟读施咒AI评分"
            >
              <Mic size={14} className="text-amber-700" />
            </button>
          )}

          {isBlind && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleReveal(cue.id);
              }}
              className="min-w-[44px] min-h-[44px] rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 transition-colors active:scale-95 cursor-pointer flex items-center justify-center"
              title={isRevealed ? '重新遮罩' : '揭示本句'}
              aria-label={isRevealed ? '重新遮罩' : '揭示本句'}
            >
              {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          )}
        </div>
      </div>

      {/* Active Blindfold Workout Station (Veiled State) */}
      {isBlind && isActive && isVeiled ? (
        <div className="py-2.5 px-3.5 rounded-xl bg-white/90 border border-indigo-100 space-y-3">
          {/* Soundwave + Listening Status */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div
                className="flex items-end gap-1 h-5 px-2 py-1 bg-indigo-50 rounded-md border border-indigo-200/60"
                aria-label="声音波形"
              >
                <span className={`w-1 rounded-full bg-indigo-600 transition-all ${isPlaying ? 'animate-wave-1' : 'h-1.5'}`} />
                <span className={`w-1 rounded-full bg-indigo-600 transition-all ${isPlaying ? 'animate-wave-2' : 'h-2.5'}`} />
                <span className={`w-1 rounded-full bg-indigo-700 transition-all ${isPlaying ? 'animate-wave-3' : 'h-3.5'}`} />
                <span className={`w-1 rounded-full bg-indigo-600 transition-all ${isPlaying ? 'animate-wave-2' : 'h-2.5'}`} />
                <span className={`w-1 rounded-full bg-indigo-600 transition-all ${isPlaying ? 'animate-wave-1' : 'h-1.5'}`} />
              </div>
              <span className="text-xs font-bold text-indigo-950">
                {isPlaying ? '原声播放中 · 专注辨音' : '音频就绪 · 聆听原声并自测'}
              </span>
            </div>
            <span className="text-[11px] text-stone-400 font-reading italic hidden sm:inline">
              脱字幕听力自测模式
            </span>
          </div>

          {/* Keyword Radar Focus Tags */}
          {radarWords.length > 0 && (
            <div className="pt-2 border-t border-dashed border-indigo-100 flex items-center flex-wrap gap-1.5">
              <span className="text-[11px] font-bold text-stone-500 flex items-center gap-1">
                <Zap size={12} className="text-amber-600 fill-amber-500" />
                <span>听辨焦点雷达:</span>
              </span>
              {radarWords.map((item, rIdx) => (
                <span
                  key={rIdx}
                  className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-mono font-bold border ${
                    item.isHpLore
                      ? 'bg-amber-50 text-amber-900 border-amber-300'
                      : 'bg-stone-50 text-stone-700 border-stone-200'
                  }`}
                >
                  <span>{item.word}</span>
                  {item.isHpLore && (
                    <span className="text-[10px] text-amber-700 font-sans font-medium">原著词汇</span>
                  )}
                </span>
              ))}
            </div>
          )}

          {/* Lumos Reveal Button */}
          <div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleReveal(cue.id);
              }}
              className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-indigo-900 hover:bg-indigo-950 text-amber-100 border border-indigo-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer shadow-none"
              title="揭示英文原文及译文 (空格键)"
              aria-label="揭示英文原文及译文"
            >
              <Eye size={15} className="text-amber-300" />
              <span>Lumos 破雾对答案</span>
              <span className="text-[10px] font-mono font-bold text-indigo-300 bg-indigo-800/80 px-1.5 py-0.5 rounded border border-indigo-700">
                Space
              </span>
            </button>
          </div>
        </div>
      ) : isBlind && !isActive && isVeiled ? (
        /* Inactive Veiled Placeholder */
        <div
          onClick={(e) => {
            e.stopPropagation();
            onSeekToCue(cue);
          }}
          className="py-2 px-1 text-stone-400 text-xs italic cursor-pointer hover:text-stone-600 transition-colors flex items-center gap-2 select-none"
          title="点击从此句播放"
        >
          <EyeOff size={13} className="text-stone-400" />
          <span>迷雾遮罩 · 点击跳转播放</span>
          {metrics && (
            <span className="font-mono text-[10px] text-stone-300 not-italic">
              ({metrics.wordCount} 词)
            </span>
          )}
        </div>
      ) : (
        /* Revealed or Normal Mode Content */
        <>
          {/* English Text Tokens */}
          <div className={`font-reading ${fontSizeClass} select-text leading-[1.85] transition-all duration-300`}>
            {(() => {
              let wordCursor = 0;
              return tokens.map((token, tokenIdx) => {
                if (!token.isWord) return <span key={tokenIdx}>{token.text}</span>;
                const cleanWord = token.text.toLowerCase().replace(/[^a-z]/g, '');
                const isHpTerm = Boolean(HP_LORE_DICTIONARY[cleanWord]?.lore);
                const isClicked = clickedWord === token.text;

                const currentWordIdx = wordCursor++;
                let isSpeaking = false;
                let isSpoken = false;
                let isUpcoming = false;

                if (wordHighlights && wordHighlights.ranges[currentWordIdx]) {
                  const r = wordHighlights.ranges[currentWordIdx];
                  isSpeaking = wordHighlights.progress >= r.startRatio && wordHighlights.progress < r.endRatio;
                  isSpoken = wordHighlights.progress >= r.endRatio;
                  isUpcoming = wordHighlights.progress < r.startRatio;
                }

                // Apple Podcasts word illumination styling
                let wordClasses = '';
                if (isSpeaking) {
                  wordClasses = 'bg-amber-400/40 text-amber-950 font-bold ring-1 ring-amber-400/60 shadow-none rounded px-1 scale-[1.02] inline-block transition-all duration-150 speaking-word-glow';
                } else if (isSpoken) {
                  wordClasses = 'text-amber-950 font-semibold px-0.5 transition-colors';
                } else if (isUpcoming) {
                  wordClasses = 'text-stone-400/90 font-normal px-0.5 transition-colors';
                } else if (isActive) {
                  wordClasses = 'text-amber-950 font-medium hover:bg-amber-400/25 hover:text-amber-900 px-0.5';
                } else {
                  wordClasses = 'text-[#1e1610] hover:bg-amber-400/15 hover:text-amber-900 px-0.5';
                }

                return (
                  <span
                    key={tokenIdx}
                    onClick={(e) => handleWordClick(e, token.text, cue)}
                    className={`cursor-pointer inline rounded-sm touch-manipulation select-text py-0.5 px-1 -my-0.5 -mx-0.5 active:scale-95 transition-transform ${
                      isClicked ? 'word-click-flash' : ''
                    } ${
                      isHpTerm
                        ? 'border-b border-amber-400 text-amber-900 font-medium hover:bg-amber-100/60'
                        : ''
                    } ${wordClasses}`}
                    title={isHpTerm ? `魔法词汇: ${token.text}` : '点击查看释义'}
                  >
                    {token.text}
                  </span>
                );
              });
            })()}
          </div>

          {/* Chinese Translation */}
          {showTranslation && cue.translation && (
            <div className={`mt-2.5 pt-2 border-t border-dashed text-sm font-reading leading-relaxed ${
              isParchment ? 'border-amber-200/60 text-[#735839]' : 'border-slate-700 text-slate-400'
            }`}>
              {cue.translation}
            </div>
          )}

          {/* Self-Assessment Feedback Loop (Active Revealed Sentence in Blind Mode) */}
          {isBlind && isActive && (
            <div className="mt-3 pt-3 border-t border-indigo-100 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAssessSentence?.(cue.id, false);
                  }}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 active:scale-95 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="降速至 0.8x 慢速重听本句"
                  aria-label="没听清，0.8x 慢速重听"
                >
                  <RotateCcw size={14} className="text-stone-600" />
                  <span>没听清 (0.8x 慢速重听)</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAssessSentence?.(cue.id, true);
                  }}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white border border-emerald-600 active:scale-95 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-none"
                  title="标记听懂并进入下一句"
                  aria-label="听懂了，下一句"
                >
                  <Check size={14} />
                  <span>听懂了 (下一句)</span>
                </button>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleReveal(cue.id);
                }}
                className="min-h-[44px] px-2.5 py-1.5 text-stone-500 hover:text-stone-700 text-xs flex items-center gap-1 rounded-xl transition-colors cursor-pointer"
                title="重新隐藏文字"
                aria-label="重新隐藏文字"
              >
                <EyeOff size={13} />
                <span>重新遮罩</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
});

/**
 * SubtitleViewer v2 — Refactored for clarity and mobile UX
 * - Two-row compact toolbar
 * - Touch swipe gesture (left/right) for sentence navigation
 * - Floating locate button at bottom-right
 * - Auditory decoding workout gym in blind mode
 */
export function SubtitleViewer({
  cues,
  activeCueIndex,
  onSeekToCue,
  onWordClick,
  studyMode,
  showTranslation,
  setShowTranslation,
  isLoopSentence,
  onToggleLoopSentence,
  onRecordCue,
  isParchment,
  onSaveToVocab,
  onPrevSentence,
  onNextSentence,
  bookmarkedCueIds = new Set(),
  onToggleBookmarkCue,
  isPlaying = false,
  playbackRate = 1.0,
  onChangePlaybackRate,
  onReplayCurrentSentence,
  currentTime = 0
}) {
  const activeCueRef = useRef(null);
  const containerRef = useRef(null);
  const [revealedSentences, setRevealedSentences] = useState({});
  const [blindAssessments, setBlindAssessments] = useState(() => ({}));
  const [fontSize, setFontSize] = useState(() => {
    try { return localStorage.getItem('hp_subtitle_font_size') || 'large'; } catch { return 'large'; }
  });
  const [isFollowActive, setIsFollowActive] = useState(true);
  const [copiedCueId, setCopiedCueId] = useState(null);

  // Touch gesture state
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const scrollToActiveCue = useCallback(() => {
    const container = containerRef.current;
    const target = activeCueRef.current;
    if (container && target) {
      const containerRect = container.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const offset = targetRect.top - containerRect.top + container.scrollTop;
      const targetScrollTop = offset - (container.clientHeight * 0.382);
      container.scrollTo({ top: Math.max(0, targetScrollTop), behavior: 'smooth' });
    } else if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    setIsFollowActive(true);
  }, []);

  useEffect(() => {
    if (isFollowActive && activeCueRef.current) {
      const container = containerRef.current;
      const target = activeCueRef.current;
      if (container && target) {
        const containerRect = container.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        const offset = targetRect.top - containerRect.top + container.scrollTop;
        const targetScrollTop = offset - (container.clientHeight * 0.382);
        container.scrollTo({ top: Math.max(0, targetScrollTop), behavior: 'smooth' });
      } else {
        target?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [activeCueIndex, isFollowActive]);

  const handleCopySentence = useCallback((cue) => {
    navigator?.clipboard?.writeText(cue.text).then(() => {
      setCopiedCueId(cue.id);
      setTimeout(() => setCopiedCueId(null), 1800);
    }).catch(() => {});
  }, []);

  const toggleSentenceReveal = useCallback((cueId) => {
    setRevealedSentences(prev => ({ ...prev, [cueId]: !prev[cueId] }));
  }, []);

  const handleAssessSentence = useCallback((cueId, isMastered) => {
    setBlindAssessments(prev => ({ ...prev, [cueId]: isMastered }));
    if (isMastered) {
      if (onChangePlaybackRate && playbackRate < 1.0) {
        onChangePlaybackRate(1.0);
      }
      if (onNextSentence) onNextSentence();
    } else {
      if (onChangePlaybackRate) onChangePlaybackRate(0.8);
      if (onReplayCurrentSentence) onReplayCurrentSentence();
    }
  }, [onNextSentence, onChangePlaybackRate, onReplayCurrentSentence, playbackRate]);

  // Space key shortcut in blind mode: toggle reveal for active sentence
  useEffect(() => {
    if (studyMode !== 'blind') return;
    const handleKeyDown = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return;
      if (e.code === 'Space' || e.key === ' ') {
        const currentCue = cues[activeCueIndex];
        if (currentCue) {
          e.preventDefault();
          e.stopPropagation();
          toggleSentenceReveal(currentCue.id);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [studyMode, cues, activeCueIndex, toggleSentenceReveal]);

  const fontSizeClass = useMemo(() => {
    if (fontSize === 'huge') return 'text-xl sm:text-2xl';
    if (fontSize === 'large') return 'text-lg sm:text-xl';
    return 'text-base sm:text-lg';
  }, [fontSize]);

  // Touch swipe handlers
  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    if (Math.abs(dx) > 60 && dy < 80) {
      if (dx < 0 && onNextSentence) onNextSentence();
      else if (dx > 0 && onPrevSentence) onPrevSentence();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }, [onNextSentence, onPrevSentence]);

  const reviewedCount = Object.keys(blindAssessments).length;
  const masteredCount = Object.values(blindAssessments).filter(Boolean).length;
  const masteryRate = calculateBlindMastery(masteredCount, reviewedCount);

  return (
    <div
      className="relative flex-1 overflow-y-auto w-full pb-4 ios-scroll"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={() => { if (isFollowActive) setIsFollowActive(false); }}
    >
      {/* ── Subtitle Cue Count & Font Sizing Ribbon (Full-Width Sticky) ── */}
      <div className={`sticky top-0 z-10 w-full border-b transition-colors ${
        isParchment
          ? 'bg-[#fbf9f4] border-[#e8ddd0]'
          : 'bg-[#0b0f19] border-slate-800'
      }`}>
        <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between gap-2">
          {/* Left: Mode Identity Badge & Sentence Progress & Mastery stats */}
          <div className="flex items-center gap-2 min-w-0 select-none flex-wrap">
            {studyMode === 'blind' ? (
              <>
                <span className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-indigo-950 font-magical shrink-0">
                  <EyeOff size={14} className="text-indigo-600" />
                  <span>魔法磨耳朵</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 border border-indigo-200 shrink-0">
                  迷雾盲听自测
                </span>
              </>
            ) : (
              <span className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-amber-950 font-magical shrink-0">
                <Headphones size={14} className="text-amber-600" />
                <span>双语精听</span>
              </span>
            )}
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-900 font-mono font-bold border border-amber-300/50 shrink-0">
              {`第 ${activeCueIndex + 1} / ${cues.length} 句`}
            </span>
            {studyMode === 'blind' && reviewedCount > 0 && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-mono font-bold border border-emerald-200 flex items-center gap-1 shrink-0">
                <Check size={11} className="text-emerald-600" />
                <span>{`听懂率 ${masteryRate}% (${masteredCount}/${reviewedCount})`}</span>
              </span>
            )}
          </div>

          {/* Right: Concise Font Size Cycle Control */}
          <button
            type="button"
            onClick={() => {
              const nextSize = fontSize === 'normal' ? 'large' : fontSize === 'large' ? 'huge' : 'normal';
              setFontSize(nextSize);
              try { localStorage.setItem('hp_subtitle_font_size', nextSize); } catch {}
            }}
            className="min-h-[44px] min-w-[44px] px-3 rounded-xl border border-[#e8ddd0] bg-white hover:border-amber-300 active:bg-amber-50/50 flex items-center justify-center gap-1.5 text-xs font-bold text-stone-700 hover:text-amber-950 transition-colors cursor-pointer select-none"
            title={`当前字号: ${fontSize === 'huge' ? '超大' : fontSize === 'large' ? '大号' : '标准'} (点击切换)`}
            aria-label="调节字号"
          >
            <Type size={14} className="text-amber-600" />
            <span className="font-mono text-[11px] font-extrabold text-amber-900">
              {fontSize === 'huge' ? 'A++' : fontSize === 'large' ? 'A+' : 'A'}
            </span>
          </button>
        </div>
      </div>

      {/* ── Sentence Cards (Centered Max-W Container) ─────────────── */}
      <div className="max-w-4xl mx-auto w-full px-3 sm:px-4 py-3 space-y-2">
        {cues.map((cue, idx) => {
          const isActive = idx === activeCueIndex;
          const isRevealed = Boolean(revealedSentences[cue.id]);
          const prevCue = idx > 0 ? cues[idx - 1] : null;
          const currentChunk = Math.floor((cue.startTime || 0) / 300);
          const prevChunk = prevCue ? Math.floor((prevCue.startTime || 0) / 300) : 0;
          const isNewWaypoint = idx > 0 && currentChunk > prevChunk && (cue.startTime || 0) >= 300;

          const isBookmarked = bookmarkedCueIds instanceof Set
            ? (bookmarkedCueIds.has(cue.id) || bookmarkedCueIds.has(String(cue.start)))
            : (Array.isArray(bookmarkedCueIds) && (bookmarkedCueIds.includes(cue.id) || bookmarkedCueIds.includes(String(cue.start))));

          return (
            <React.Fragment key={cue.id}>
              {/* 5-min milestone divider */}
              {isNewWaypoint && (
                <div className="flex items-center gap-3 my-4 select-none">
                  <div className="h-px flex-1 bg-amber-200" />
                  <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100/80 border border-amber-200 text-[11px] font-bold text-amber-800">
                    <Award size={12} className="text-amber-600" />
                    <span>已精听 <span className="font-mono">{currentChunk * 5}</span> 分钟</span>
                  </div>
                  <div className="h-px flex-1 bg-amber-200" />
                </div>
              )}

              <SentenceCard
                cardRef={isActive ? activeCueRef : null}
                cue={cue}
                idx={idx}
                isActive={isActive}
                isRevealed={isRevealed}
                isBookmarked={isBookmarked}
                onToggleBookmarkCue={onToggleBookmarkCue}
                studyMode={studyMode}
                showTranslation={showTranslation}
                fontSizeClass={fontSizeClass}
                isParchment={isParchment}
                onSeekToCue={onSeekToCue}
                onWordClick={onWordClick}
                onRecordCue={onRecordCue}
                onCopySentence={handleCopySentence}
                copiedCueId={copiedCueId}
                onToggleReveal={toggleSentenceReveal}
                onAssessSentence={handleAssessSentence}
                isPlaying={isPlaying}
                currentTime={isActive ? currentTime : 0}
              />
            </React.Fragment>
          );
        })}
      </div>

      {/* Floating locate button with compass re-anchor */}
      {!isFollowActive && cues.length > 0 && activeCueIndex >= 0 && (
        <button
          onClick={scrollToActiveCue}
          className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] sm:bottom-24 right-4 sm:right-8 z-30 flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-full border border-amber-300 bg-[#fbf9f4]/95 backdrop-blur-sm text-amber-950 font-bold text-xs active:scale-95 cursor-pointer shadow-md hover:bg-amber-50 transition-all select-none"
          title="视线锁定正在朗读的句子 (一键归位)"
          aria-label="视线锁定正在朗读的句子，一键归位"
        >
          <Compass size={15} className="text-amber-600 shrink-0" />
          <span>第 <span className="font-mono font-bold text-amber-800">{activeCueIndex + 1}</span> 句 · 一键归位</span>
        </button>
      )}
    </div>
  );
}

export default SubtitleViewer;

