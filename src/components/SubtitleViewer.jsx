import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  Play,
  Mic,
  Eye,
  EyeOff,
  Sparkles,
  Type,
  Volume2,
  Headphones,
  Copy,
  Check,
  LocateFixed,
  Award
} from 'lucide-react';
import { tokenizeSentence, formatTime } from '../utils/vttParser';
import { HP_LORE_DICTIONARY } from '../data/hpDictionary';

/**
 * SentenceCard v2 (Memoized)
 * - No "第 X 句" number badge (removed noise)
 * - Timestamps only on hover
 * - Active: border-l-4 amber + bg-amber-50/60
 * - Inactive: bg-white, no border (spacing separates)
 * - Blind mode: opacity/letter-spacing (no GPU blur)
 */
const SentenceCard = React.memo(function SentenceCard({
  cue,
  idx,
  isActive,
  isRevealed,
  studyMode,
  showTranslation,
  fontSizeClass,
  isParchment,
  onSeekToCue,
  onWordClick,
  onRecordCue,
  onSpeakSentence,
  onCopySentence,
  speakingCueId,
  copiedCueId,
  onToggleReveal,
  cardRef
}) {
  const tokens = useMemo(() => tokenizeSentence(cue.text), [cue.text]);
  const [clickedWord, setClickedWord] = useState(null);

  const handleWordClick = useCallback((word, cueObj) => {
    setClickedWord(word);
    setTimeout(() => setClickedWord(null), 500);
    onWordClick(word, cueObj);
  }, [onWordClick]);

  const isBlindHidden = studyMode === 'blind' && !isRevealed && !isActive;

  return (
    <div
      ref={cardRef}
      className={`group relative rounded-2xl transition-all duration-200 subtitle-item-render ${
        isActive
          ? 'reading-hero-sentence border-l-4 border-l-amber-500 bg-amber-50/60 pl-3 pr-4 pt-3.5 pb-3.5 sm:pl-4 sm:pr-5 sm:pt-4 sm:pb-4 shadow-sm'
          : 'reading-inactive-sentence border-l-4 border-l-transparent bg-white hover:bg-stone-50/80 pl-3 pr-4 pt-3.5 pb-3.5 sm:pl-4 sm:pr-5 sm:pt-4 sm:pb-4'
      }`}
    >
      {/* Header: timestamps (hover-only on inactive) + action buttons */}
      <div className={`flex items-center justify-between mb-2 gap-2 ${
        isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 transition-opacity duration-150'
      }`}>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] text-stone-400">
            {formatTime(cue.startTime)}
          </span>
          {isActive && (
            <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-bold">
              <Sparkles size={10} />
              正在朗读
            </span>
          )}
        </div>

        {/* Action buttons (Apple HIG >= 44x44pt ergonomic touch targets) */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onSeekToCue(cue)}
            className="min-w-[44px] min-h-[44px] rounded-xl border border-[#e8ddd0] bg-white hover:bg-stone-50 text-stone-600 hover:text-amber-950 hover:border-amber-300 transition-colors active:scale-95 cursor-pointer flex items-center justify-center"
            title="从此句播放"
            aria-label="从此句播放"
          >
            <Play size={13} className="fill-current translate-x-0.5" />
          </button>

          {isActive && (
            <>
              <button
                onClick={() => onSpeakSentence(cue)}
                className={`hidden sm:inline-flex min-w-[44px] min-h-[44px] items-center justify-center rounded-xl border transition-colors active:scale-95 cursor-pointer ${
                  speakingCueId === cue.id
                    ? 'text-amber-900 bg-amber-100 border-amber-300'
                    : 'border-[#e8ddd0] bg-white text-stone-500 hover:text-amber-950'
                }`}
                title="朗读示范 (英音)"
                aria-label="朗读示范"
              >
                <Volume2 size={13} className={speakingCueId === cue.id ? 'animate-bounce' : ''} />
              </button>

              <button
                onClick={() => onCopySentence(cue)}
                className="hidden sm:inline-flex min-w-[44px] min-h-[44px] items-center justify-center rounded-xl border border-[#e8ddd0] bg-white text-stone-500 hover:text-amber-950 transition-colors active:scale-95 cursor-pointer"
                title={copiedCueId === cue.id ? '已复制' : '复制本句'}
                aria-label="复制本句"
              >
                {copiedCueId === cue.id
                  ? <Check size={13} className="text-emerald-600" />
                  : <Copy size={13} />}
              </button>
            </>
          )}

          <button
            onClick={() => onRecordCue(cue)}
            className="min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 transition-colors active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 font-bold text-xs"
            title="跟读施咒（AI评分）"
            aria-label="跟读施咒AI评分"
          >
            <Mic size={13} className="text-amber-700" />
            <span className="hidden sm:inline">跟读</span>
          </button>

          {studyMode === 'blind' && (
            <button
              onClick={() => onToggleReveal(cue.id)}
              className="min-w-[44px] min-h-[44px] rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 transition-colors active:scale-95 cursor-pointer flex items-center justify-center"
              title={isRevealed ? '重新遮罩' : '揭示本句'}
              aria-label={isRevealed ? '重新遮罩' : '揭示本句'}
            >
              {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          )}
        </div>
      </div>

      {/* English Text */}
      <div
        className={`font-reading ${fontSizeClass} select-text leading-[1.85] transition-all duration-300 ${
          isBlindHidden ? 'opacity-0 select-none pointer-events-none' : ''
        }`}
      >
        {isBlindHidden ? (
          <span className="italic text-stone-300 text-sm">— 迷雾遮罩：聆听原声辨认内容 —</span>
        ) : (
          tokens.map((token, tokenIdx) => {
            if (!token.isWord) return <span key={tokenIdx}>{token.text}</span>;
            const cleanWord = token.text.toLowerCase().replace(/[^a-z]/g, '');
            const isHpTerm = Boolean(HP_LORE_DICTIONARY[cleanWord]?.lore);
            const isClicked = clickedWord === token.text;
            return (
              <span
                key={tokenIdx}
                onClick={() => handleWordClick(token.text, cue)}
                className={`cursor-pointer inline rounded-sm transition-colors ${
                  isClicked ? 'word-click-flash' : ''
                } ${
                  isHpTerm
                    ? 'border-b border-amber-400 text-amber-900 font-medium hover:bg-amber-100/60 px-0.5'
                    : isActive
                      ? 'text-amber-950 hover:bg-amber-400/25 hover:text-amber-900 px-0.5'
                      : 'text-[#1e1610] hover:bg-amber-400/15 hover:text-amber-900 px-0.5'
                }`}
                title={isHpTerm ? `魔法词汇: ${token.text}` : '点击查看释义'}
              >
                {token.text}
              </span>
            );
          })
        )}
      </div>

      {/* Chinese Translation */}
      {showTranslation && cue.translation && !isBlindHidden && (
        <div className={`mt-2.5 pt-2 border-t border-dashed text-sm font-reading leading-relaxed ${
          isParchment ? 'border-amber-200/60 text-[#735839]' : 'border-slate-700 text-slate-400'
        }`}>
          {cue.translation}
        </div>
      )}
    </div>
  );
});

/**
 * SubtitleViewer v2 — Refactored for clarity and mobile UX
 * - Two-row compact toolbar
 * - Touch swipe gesture (left/right) for sentence navigation
 * - Floating locate button at bottom-right
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
  onNextSentence
}) {
  const activeCueRef = useRef(null);
  const containerRef = useRef(null);
  const [revealedSentences, setRevealedSentences] = useState({});
  const [fontSize, setFontSize] = useState(() => {
    try { return localStorage.getItem('hp_subtitle_font_size') || 'large'; } catch { return 'large'; }
  });
  const [isFollowActive, setIsFollowActive] = useState(true);
  const [copiedCueId, setCopiedCueId] = useState(null);
  const [speakingCueId, setSpeakingCueId] = useState(null);

  // Touch gesture state
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const scrollToActiveCue = useCallback(() => {
    activeCueRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setIsFollowActive(true);
  }, []);

  useEffect(() => {
    if (isFollowActive && activeCueRef.current) {
      activeCueRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeCueIndex, isFollowActive]);

  const handleCopySentence = useCallback((cue) => {
    navigator?.clipboard?.writeText(cue.text).then(() => {
      setCopiedCueId(cue.id);
      setTimeout(() => setCopiedCueId(null), 1800);
    }).catch(() => {});
  }, []);

  const handleSpeakSentence = useCallback((cue) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(cue.text);
      utt.lang = 'en-GB';
      utt.rate = 0.85;
      setSpeakingCueId(cue.id);
      utt.onend = () => setSpeakingCueId(null);
      utt.onerror = () => setSpeakingCueId(null);
      window.speechSynthesis.speak(utt);
    }
  }, []);

  const toggleSentenceReveal = useCallback((cueId) => {
    setRevealedSentences(prev => ({ ...prev, [cueId]: !prev[cueId] }));
  }, []);

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

  return (
    <div
      className="relative flex-1 overflow-y-auto max-w-4xl mx-auto w-full pb-4 ios-scroll"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={() => { if (isFollowActive) setIsFollowActive(false); }}
    >
      {/* ── Subtitle Cue Count & Font Sizing Ribbon ──────────────── */}
      <div className={`sticky top-0 z-10 px-3 sm:px-4 py-2 border-b flex items-center justify-between gap-2 transition-colors ${
        isParchment
          ? 'bg-[#fbf9f4]/95 border-[#e8ddd0] backdrop-blur-sm'
          : 'bg-[#0b0f19]/95 border-slate-800'
      }`}>
        <span className="flex items-center gap-1.5 text-xs font-bold text-amber-900 select-none">
          <Headphones size={13} className="text-amber-600" />
          <span>全章共 <span className="font-mono">{cues.length}</span> 句原声</span>
          {studyMode === 'blind' && (
            <span className="ml-1 px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[10px] font-bold">
              迷雾模式
            </span>
          )}
        </span>

        {/* Font size 3-step switch */}
        <div className="flex items-center rounded-xl border border-[#e8ddd0] bg-stone-50/80 p-0.5 select-none">
          <span className="px-1.5 hidden sm:flex items-center gap-1 text-[11px] text-stone-400">
            <Type size={11} />
          </span>
          {[
            { id: 'normal', label: '标准', short: 'A' },
            { id: 'large',  label: '大号', short: 'A+' },
            { id: 'huge',   label: '超大', short: 'A++' }
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setFontSize(s.id);
                try { localStorage.setItem('hp_subtitle_font_size', s.id); } catch {}
              }}
              className={`px-2 py-0.5 min-h-[30px] min-w-[28px] inline-flex items-center justify-center rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                fontSize === s.id ? 'bg-amber-500 text-white' : 'text-stone-600 hover:text-amber-950'
              }`}
            >
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{s.short}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Sentence Cards ────────────────────────────────────────── */}
      <div className="px-3 sm:px-4 py-3 space-y-2">
        {cues.map((cue, idx) => {
          const isActive = idx === activeCueIndex;
          const isRevealed = Boolean(revealedSentences[cue.id]);
          const prevCue = idx > 0 ? cues[idx - 1] : null;
          const currentChunk = Math.floor((cue.startTime || 0) / 300);
          const prevChunk = prevCue ? Math.floor((prevCue.startTime || 0) / 300) : 0;
          const isNewWaypoint = idx > 0 && currentChunk > prevChunk && (cue.startTime || 0) >= 300;

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
                studyMode={studyMode}
                showTranslation={showTranslation}
                fontSizeClass={fontSizeClass}
                isParchment={isParchment}
                onSeekToCue={onSeekToCue}
                onWordClick={onWordClick}
                onRecordCue={onRecordCue}
                onSpeakSentence={handleSpeakSentence}
                onCopySentence={handleCopySentence}
                speakingCueId={speakingCueId}
                copiedCueId={copiedCueId}
                onToggleReveal={toggleSentenceReveal}
              />
            </React.Fragment>
          );
        })}
      </div>

      {/* Floating locate button */}
      {!isFollowActive && cues.length > 0 && activeCueIndex >= 0 && (
        <button
          onClick={scrollToActiveCue}
          className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] sm:bottom-24 right-4 sm:right-8 z-30 flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-full border border-amber-300 bg-white/95 backdrop-blur-sm text-amber-950 font-bold text-xs active:scale-95 cursor-pointer shadow-none"
          title="定位到正在朗读的句子"
          aria-label="定位到正在朗读的句子"
        >
          <LocateFixed size={14} className="text-amber-600 shrink-0" />
          <span>定位 (第 <span className="font-mono font-bold">{activeCueIndex + 1}</span> 句)</span>
        </button>
      )}
    </div>
  );
}

export default SubtitleViewer;
