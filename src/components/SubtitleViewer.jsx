import React, { useEffect, useRef, useState } from 'react';
import { 
  Play, 
  Repeat, 
  Languages, 
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
 * SubtitleViewer — Kid-friendly bilingual listening & reading area.
 * - Large legible font with generous line-height for students
 * - Interactive word clicking with instant IPA phonetic & Chinese popover
 * - Lumos focus highlighting the active sentence with warm golden halo
 * - Quick sentence playback, loop, shadowing recording, and copy buttons
 * - Intelligent auto-follow scroll with manual pause and quick re-center
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
  onSaveToVocab
}) {
  const activeCueRef = useRef(null);
  const containerRef = useRef(null);
  const [revealedSentences, setRevealedSentences] = useState({});
  const [fontSize, setFontSize] = useState(() => {
    try {
      return localStorage.getItem('hp_subtitle_font_size') || 'large';
    } catch {
      return 'large';
    }
  }); // 'normal' | 'large' | 'huge'
  const [isFollowActive, setIsFollowActive] = useState(true);
  const [copiedCueId, setCopiedCueId] = useState(null);
  const [speakingCueId, setSpeakingCueId] = useState(null);

  // Smoothly scroll active cue into center if auto-follow is active
  const scrollToActiveCue = () => {
    if (activeCueRef.current) {
      activeCueRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
      setIsFollowActive(true);
    }
  };

  useEffect(() => {
    if (isFollowActive && activeCueRef.current) {
      activeCueRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [activeCueIndex, isFollowActive]);

  // Copy full sentence text
  const handleCopySentence = (cue) => {
    if (navigator && navigator.clipboard) {
      navigator.clipboard.writeText(cue.text).then(() => {
        setCopiedCueId(cue.id);
        setTimeout(() => setCopiedCueId(null), 1800);
      }).catch(e => console.warn(e));
    }
  };

  // Speak sentence with clean British English synthesis
  const handleSpeakSentence = (cue) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cue.text);
      utterance.lang = 'en-GB';
      utterance.rate = 0.85;
      setSpeakingCueId(cue.id);
      utterance.onend = () => setSpeakingCueId(null);
      utterance.onerror = () => setSpeakingCueId(null);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Toggle single sentence reveal in blind mode
  const toggleSentenceReveal = (cueId) => {
    setRevealedSentences(prev => ({
      ...prev,
      [cueId]: !prev[cueId]
    }));
  };

  const getFontSizeClass = () => {
    if (fontSize === 'huge') return 'text-xl sm:text-2xl leading-loose tracking-wide';
    if (fontSize === 'large') return 'text-lg sm:text-xl leading-relaxed tracking-wide';
    return 'text-base sm:text-lg leading-relaxed tracking-wide';
  };

  return (
    <div className="relative flex-1 overflow-y-auto px-3 sm:px-6 py-4 max-w-4xl mx-auto w-full pb-16" ref={containerRef}>
      {/* ── Subtitle Toolbar for Students ─────────────────────────── */}
      <div className={`flex flex-wrap items-center justify-between gap-2.5 mb-5 p-3.5 rounded-3xl border transition-colors ${
        isParchment
          ? 'bg-white/95 border-[#eee5d8] shadow-xs text-[#2b1f14]'
          : 'bg-slate-900/80 border-slate-800 text-slate-300'
      }`}>
        {/* Left: Cue counts & status */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-800 font-bold font-mono">
            <Headphones size={13} />
            <span>全章 {cues.length} 个精听句</span>
          </span>

          {studyMode === 'blind' && (
            <span className="text-amber-800 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-400/30 flex items-center gap-1 font-semibold">
              <EyeOff size={13} /> 魔法磨耳朵模式（迷雾遮罩）
            </span>
          )}
        </div>

        {/* Right: Reading controls for students */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Follow audio toggle */}
          <button
            onClick={() => {
              const next = !isFollowActive;
              setIsFollowActive(next);
              if (next) scrollToActiveCue();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 shadow-xs cursor-pointer ${
              isFollowActive
                ? 'bg-amber-500/20 border-amber-400 text-amber-950 font-bold'
                : 'border-amber-200/80 bg-white/80 text-slate-600 hover:bg-amber-50 hover:border-amber-400'
            }`}
            title="开启/关闭滚动跟随朗读进度"
          >
            <LocateFixed size={13} className="text-amber-700" />
            <span>{isFollowActive ? '跟随朗读：开' : '跟随朗读：关'}</span>
          </button>

          {/* 3-Level Font Size Segmented Selector (Kid-friendly eye protection) */}
          <div className="flex items-center rounded-xl border border-amber-200/80 bg-white/80 p-0.5 shadow-xs text-xs font-bold">
            <span className="px-2 text-slate-500 flex items-center gap-1">
              <Type size={13} className="text-amber-700" />
              <span className="hidden sm:inline">字号:</span>
            </span>
            {[
              { id: 'normal', label: '标准', title: '标准字号 (18px)' },
              { id: 'large',  label: '大号', title: '大号字号 (22px，推荐视力保护)' },
              { id: 'huge',   label: '超大', title: '超大字号 (26px，适合大屏/平板)' }
            ].map((sizeOpt) => {
              const isSelected = fontSize === sizeOpt.id;
              return (
                <button
                  key={sizeOpt.id}
                  onClick={() => {
                    setFontSize(sizeOpt.id);
                    try { localStorage.setItem('hp_subtitle_font_size', sizeOpt.id); } catch {}
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-all active:scale-95 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-white font-bold shadow-xs'
                      : 'text-amber-950/80 hover:text-amber-950 hover:bg-amber-50'
                  }`}
                  title={sizeOpt.title}
                >
                  {sizeOpt.label}
                </button>
              );
            })}
          </div>

          {/* Translation Toggle */}
          <button
            onClick={() => setShowTranslation(!showTranslation)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 shadow-xs cursor-pointer ${
              showTranslation
                ? 'bg-amber-500/20 border-amber-400 text-amber-950 shadow-xs'
                : 'border-amber-200/80 bg-white/80 text-slate-600 hover:bg-amber-50 hover:border-amber-400'
            }`}
            title="开启/关闭中文双语译文"
          >
            <Languages size={14} className="text-amber-700" />
            <span>{showTranslation ? '双语译文：开' : '双语译文：关'}</span>
          </button>
        </div>
      </div>

      {/* ── Cues List (Sentence Cards) ────────────────────────────── */}
      <div className="space-y-3.5">
        {cues.map((cue, idx) => {
          const isActive = idx === activeCueIndex;
          const tokens = tokenizeSentence(cue.text);
          const isRevealed = revealedSentences[cue.id];
          const prevCue = idx > 0 ? cues[idx - 1] : null;
          const currentChunk = Math.floor((cue.startTime || 0) / 300);
          const prevChunk = prevCue ? Math.floor((prevCue.startTime || 0) / 300) : 0;
          const isNewWaypoint = idx > 0 && currentChunk > prevChunk && (cue.startTime || 0) >= 300;

          return (
            <React.Fragment key={cue.id}>
              {/* Duolingo Micro-Waypoint 5-minute chunk milestone divider */}
              {isNewWaypoint && (
                <div className="flex items-center gap-3 my-5 py-1 select-none">
                  <div className="h-0.5 flex-1 bg-gradient-to-r from-transparent via-amber-300 to-amber-400/80" />
                  <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-100/90 border border-amber-300 shadow-xs text-xs font-bold text-amber-950">
                    <Award size={14} className="text-amber-600" />
                    <span>第 {currentChunk} 哨所里程碑 · 已精听 {currentChunk * 5} 分钟</span>
                  </div>
                  <div className="h-0.5 flex-1 bg-gradient-to-r from-amber-400/80 via-amber-300 to-transparent" />
                </div>
              )}

              <div
                ref={isActive ? activeCueRef : null}
                className={`group relative rounded-3xl p-5 sm:p-6 transition-all duration-300 border-2 ${
                  isActive
                    ? isParchment
                      ? 'lumos-active bg-[#fffdfa] border-amber-500 border-l-[6px] border-l-amber-500 shadow-md ring-2 ring-amber-400/20'
                      : 'lumos-active bg-slate-900 border-amber-400 border-l-[6px] border-l-amber-400 shadow-xl'
                    : isParchment
                    ? 'duo-card border-[#eee5d8] hover:border-amber-300 hover:shadow-md'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
              {/* Cue Header with Controls */}
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2.5 py-0.5 rounded-lg font-mono font-bold ${
                    isActive 
                      ? 'bg-amber-500 text-white shadow-sm' 
                      : isParchment
                      ? 'bg-amber-100/70 text-amber-900'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    第 {idx + 1} 句
                  </span>
                  <span className="font-mono text-xs text-slate-400">
                    {formatTime(cue.startTime)} - {formatTime(cue.endTime)}
                  </span>
                  {isActive && (
                    <span className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-bold animate-pulse">
                      <Sparkles size={12} />
                      <span>正在朗读</span>
                    </span>
                  )}
                </div>

                {/* Sentence Action Buttons */}
                <div className="flex items-center space-x-1 sm:space-x-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                  {/* Replay this sentence */}
                  <button
                    onClick={() => onSeekToCue(cue)}
                    className="p-1.5 rounded-lg border border-amber-200/60 bg-white/70 hover:bg-amber-100/80 text-slate-600 hover:text-amber-800 hover:border-amber-400 transition-all active:scale-90 cursor-pointer shadow-2xs"
                    title="从原声音频播放本句"
                  >
                    <Play size={13} className="fill-current" />
                  </button>

                  {/* Clean British TTS Speak */}
                  <button
                    onClick={() => handleSpeakSentence(cue)}
                    className={`p-1.5 rounded-lg border transition-all active:scale-90 cursor-pointer shadow-2xs ${
                      speakingCueId === cue.id 
                        ? 'text-amber-900 bg-amber-200 border-amber-400 font-bold' 
                        : 'border-amber-200/60 bg-white/70 hover:bg-amber-100/80 text-slate-600 hover:text-amber-800 hover:border-amber-400'
                    }`}
                    title="清晰单句朗读示范 (英音)"
                  >
                    <Volume2 size={13} className={speakingCueId === cue.id ? 'animate-bounce' : ''} />
                  </button>

                  {/* Loop this sentence */}
                  <button
                    onClick={() => {
                      if (!isActive) onSeekToCue(cue);
                      onToggleLoopSentence();
                    }}
                    className={`p-1.5 rounded-lg border transition-all active:scale-90 cursor-pointer shadow-2xs ${
                      isActive && isLoopSentence 
                        ? 'text-amber-900 bg-amber-200 border-amber-400 font-bold' 
                        : 'border-amber-200/60 bg-white/70 hover:bg-amber-100/80 text-slate-600 hover:text-amber-800 hover:border-amber-400'
                    }`}
                    title="单句精听循环"
                  >
                    <Repeat size={13} />
                  </button>

                  {/* Copy sentence text */}
                  <button
                    onClick={() => handleCopySentence(cue)}
                    className="p-1.5 rounded-lg border border-amber-200/60 bg-white/70 hover:bg-amber-100/80 text-slate-600 hover:text-amber-800 hover:border-amber-400 transition-all active:scale-90 cursor-pointer shadow-2xs"
                    title={copiedCueId === cue.id ? "已复制本句英文" : "复制本句英文"}
                  >
                    {copiedCueId === cue.id ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  </button>

                  {/* Shadowing Voice Recording */}
                  <button
                    onClick={() => onRecordCue(cue)}
                    className="px-2.5 py-1 rounded-lg border border-amber-300/80 bg-amber-50/80 hover:bg-amber-100 text-amber-900 hover:border-amber-400 transition-all active:scale-95 cursor-pointer flex items-center gap-1 shadow-2xs font-bold"
                    title="跟读施咒（AI发音评分）"
                  >
                    <Mic size={13} className="text-amber-700" />
                    <span className="text-[11px] hidden sm:inline">跟读</span>
                  </button>

                  {/* Blind mode reveal toggle */}
                  {studyMode === 'blind' && (
                    <button
                      onClick={() => toggleSentenceReveal(cue.id)}
                      className="p-1.5 rounded-lg border border-indigo-200/80 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-800 transition-all active:scale-90 cursor-pointer"
                      title={isRevealed ? "开启迷雾遮罩" : "驱散迷雾显形"}
                    >
                      {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  )}
                </div>
              </div>

              {/* English Text with Clickable Words */}
              <div 
                className={`font-reading ${getFontSizeClass()} select-text transition-all duration-300 ${
                  studyMode === 'blind' && !isRevealed && !isActive
                    ? 'blur-[6px] hover:blur-none select-none opacity-40'
                    : ''
                }`}
              >
                {tokens.map((token, tokenIdx) => {
                  if (!token.isWord) {
                    return <span key={tokenIdx}>{token.text}</span>;
                  }

                  const cleanWord = token.text.toLowerCase().replace(/[^a-z]/g, '');
                  const isHpTerm = Boolean(HP_LORE_DICTIONARY[cleanWord]);

                  return (
                    <span
                      key={tokenIdx}
                      onClick={() => onWordClick(token.text, cue)}
                      className={`cursor-pointer px-1 py-0.5 rounded-md transition-all inline-block group/word relative ${
                        isHpTerm 
                          ? 'border-b-2 border-amber-500 font-semibold text-amber-800 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/25' 
                          : isActive 
                            ? 'font-medium text-amber-950 dark:text-amber-100 hover:bg-amber-400/20 hover:text-amber-700' 
                            : 'hover:bg-amber-400/15 hover:text-amber-700 dark:hover:text-amber-300'
                      }`}
                      title={isHpTerm ? `魔法专有名词: ${token.text} (点击查看百科背景)` : '点击查看中文释义与纯正英音发音'}
                    >
                      {token.text}
                      {isHpTerm && (
                        <Sparkles className="w-2.5 h-2.5 text-amber-500 inline ml-0.5 align-super" />
                      )}
                    </span>
                  );
                })}
              </div>

              {/* Chinese Translation */}
              {showTranslation && cue.translation && (
                <div className={`mt-3 pt-2.5 border-t border-dashed text-sm sm:text-base font-reading leading-relaxed ${
                  isParchment 
                    ? 'border-amber-200/80 text-[#735839]' 
                    : 'border-slate-800 text-slate-400'
                }`}>
                  {cue.translation}
                </div>
              )}
            </div>
          </React.Fragment>
        );
      })}
      </div>

      {/* Floating Locate Active Cue Button */}
      {cues.length > 0 && activeCueIndex >= 0 && (
        <button
          onClick={scrollToActiveCue}
          className="fixed bottom-24 right-5 sm:right-8 z-30 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-md hover:shadow-lg border border-amber-400/90 bg-white/95 text-amber-950 font-bold text-xs transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-xs"
          title="快速定位到正在朗读的句子"
        >
          <LocateFixed size={14} className="text-amber-600" />
          <span>定位朗读 (第 {activeCueIndex + 1} 句)</span>
        </button>
      )}
    </div>
  );
}
