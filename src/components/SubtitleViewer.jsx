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
    if (fontSize === 'huge') return 'text-xl sm:text-2xl leading-relaxed';
    if (fontSize === 'large') return 'text-lg sm:text-xl leading-relaxed';
    return 'text-base sm:text-lg leading-relaxed';
  };

  return (
    <div className="relative flex-1 overflow-y-auto px-3 sm:px-6 py-3 sm:py-4 max-w-4xl mx-auto w-full pb-16" ref={containerRef}>
      {/* ── Subtitle Toolbar for Students (Sleek Single-Row Responsive Layout) ── */}
      <div className={`flex items-center justify-between gap-1.5 sm:gap-2 mb-3 sm:mb-4 px-2.5 sm:px-3.5 py-2 rounded-2xl border transition-colors ${
        isParchment
          ? 'bg-white/95 border-[#eee5d8] shadow-2xs text-[#2b1f14]'
          : 'bg-slate-900/80 border-slate-800 text-slate-300'
      }`}>
        {/* Left: Cue counts & status + Quick Toggles */}
        <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
          <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/15 text-amber-800 font-bold font-mono text-[11px] sm:text-xs shrink-0">
            <Headphones size={12} className="text-amber-700" />
            <span className="hidden sm:inline">全章 </span>{cues.length}<span className="hidden sm:inline"> 个精听</span>句
          </span>

          {studyMode === 'blind' && (
            <span className="text-amber-800 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-400/30 flex items-center gap-1 font-semibold text-[11px] sm:text-xs shrink-0">
              <EyeOff size={12} /> <span className="hidden sm:inline">磨耳朵模式</span><span className="sm:hidden">迷雾</span>
            </span>
          )}

          {/* Follow audio toggle */}
          <button
            onClick={() => {
              const next = !isFollowActive;
              setIsFollowActive(next);
              if (next) scrollToActiveCue();
            }}
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg border text-[11px] sm:text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0 ${
              isFollowActive
                ? 'bg-amber-500/20 border-amber-400 text-amber-950 font-bold'
                : 'border-[#eee5d8] bg-white/80 text-stone-500 hover:bg-amber-50'
            }`}
            title="开启/关闭滚动跟随朗读进度"
          >
            <LocateFixed size={12} className="text-amber-700" />
            <span className="hidden sm:inline">跟随朗读: {isFollowActive ? '开' : '关'}</span>
            <span className="sm:hidden">{isFollowActive ? '跟随' : '静止'}</span>
          </button>

          {/* Translation Toggle */}
          <button
            onClick={() => setShowTranslation(!showTranslation)}
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg border text-[11px] sm:text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0 ${
              showTranslation
                ? 'bg-amber-500/20 border-amber-400 text-amber-950 font-bold'
                : 'border-[#eee5d8] bg-white/80 text-stone-500 hover:bg-amber-50'
            }`}
            title="开启/关闭中文双语译文"
          >
            <Languages size={12} className="text-amber-700" />
            <span className="hidden sm:inline">双语译文: {showTranslation ? '开' : '关'}</span>
            <span className="sm:hidden">{showTranslation ? '译文' : '隐译'}</span>
          </button>
        </div>

        {/* Right: 3-Level Font Size Segmented Selector */}
        <div className="flex items-center rounded-lg border border-[#eee5d8] bg-stone-50/80 p-0.5 text-[11px] sm:text-xs font-bold shrink-0">
          <span className="hidden md:flex px-1.5 text-stone-500 items-center gap-1">
            <Type size={12} className="text-amber-700" />
            <span>字号:</span>
          </span>
          {[
            { id: 'normal', label: '标准', short: '中', title: '标准字号' },
            { id: 'large',  label: '大号', short: '大', title: '大号字号 (推荐)' },
            { id: 'huge',   label: '超大', short: '特', title: '超大字号' }
          ].map((sizeOpt) => {
            const isSelected = fontSize === sizeOpt.id;
            return (
              <button
                key={sizeOpt.id}
                onClick={() => {
                  setFontSize(sizeOpt.id);
                  try { localStorage.setItem('hp_subtitle_font_size', sizeOpt.id); } catch {}
                }}
                className={`px-1.5 sm:px-2 py-0.5 rounded-md transition-all active:scale-95 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-white font-bold shadow-2xs'
                    : 'text-stone-600 hover:text-amber-950'
                }`}
                title={sizeOpt.title}
              >
                <span className="hidden sm:inline">{sizeOpt.label}</span>
                <span className="sm:hidden">{sizeOpt.short}</span>
              </button>
            );
          })}
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
                className={`group relative rounded-2xl p-3.5 sm:p-5 transition-colors duration-200 border subtitle-item-render ${
                  isActive
                    ? 'border-amber-400 bg-amber-500/5 border-l-4 border-l-amber-500'
                    : 'border-[#eee5d8] bg-white hover:border-amber-300'
                }`}
              >
              {/* Cue Header with Controls */}
              <div className="flex items-center justify-between mb-2 gap-2">
                <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0">
                  <span className={`text-[11px] sm:text-xs px-2 py-0.5 rounded-lg font-mono font-bold shrink-0 ${
                    isActive 
                      ? 'bg-amber-500 text-white' 
                      : 'bg-stone-100 text-stone-500'
                  }`}>
                    第 {idx + 1} 句
                  </span>
                  <span className="font-mono text-[11px] sm:text-xs text-stone-400 shrink-0">
                    {formatTime(cue.startTime)} - {formatTime(cue.endTime)}
                  </span>
                  {isActive && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-xs text-amber-700 font-bold shrink-0">
                      <Sparkles size={12} />
                      <span>正在朗读</span>
                    </span>
                  )}
                </div>

                {/* Sentence Action Buttons: Clean on active, hover-only on inactive */}
                <div className={`flex items-center space-x-1 sm:space-x-1.5 shrink-0 transition-opacity ${
                  isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}>
                  {/* Replay this sentence */}
                  <button
                    onClick={() => onSeekToCue(cue)}
                    className="p-1 sm:p-1.5 rounded-lg border border-[#eee5d8] bg-white hover:bg-stone-50 text-stone-600 hover:text-amber-950 hover:border-amber-300 transition-colors active:scale-95 cursor-pointer"
                    title="从原声音频播放本句"
                  >
                    <Play size={13} className="fill-current" />
                  </button>

                  {/* Clean British TTS Speak (Desktop/Tablet only to avoid mobile crowding) */}
                  {isActive && (
                    <button
                      onClick={() => handleSpeakSentence(cue)}
                      className={`hidden sm:inline-flex p-1.5 rounded-lg border transition-colors active:scale-95 cursor-pointer ${
                        speakingCueId === cue.id 
                          ? 'text-amber-900 bg-amber-100 border-amber-300 font-bold' 
                          : 'border-[#eee5d8] bg-white hover:bg-stone-50 text-stone-600 hover:text-amber-950'
                      }`}
                      title="朗读示范 (英音)"
                    >
                      <Volume2 size={13} className={speakingCueId === cue.id ? 'animate-bounce' : ''} />
                    </button>
                  )}

                  {/* Copy sentence text (Desktop/Tablet only) */}
                  {isActive && (
                    <button
                      onClick={() => handleCopySentence(cue)}
                      className="hidden sm:inline-flex p-1.5 rounded-lg border border-[#eee5d8] bg-white hover:bg-stone-50 text-stone-600 hover:text-amber-950 transition-colors active:scale-95 cursor-pointer"
                      title={copiedCueId === cue.id ? "已复制本句英文" : "复制本句英文"}
                    >
                      {copiedCueId === cue.id ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    </button>
                  )}

                  {/* Shadowing Voice Recording */}
                  <button
                    onClick={() => onRecordCue(cue)}
                    className="px-2 sm:px-2.5 py-1 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 transition-colors active:scale-95 cursor-pointer flex items-center gap-1 font-bold text-xs"
                    title="跟读施咒（AI发音评分）"
                  >
                    <Mic size={13} className="text-amber-700" />
                    <span>跟读</span>
                  </button>

                  {/* Blind mode reveal toggle */}
                  {studyMode === 'blind' && (
                    <button
                      onClick={() => toggleSentenceReveal(cue.id)}
                      className="p-1 sm:p-1.5 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 transition-colors active:scale-95 cursor-pointer"
                      title={isRevealed ? "开启迷雾遮罩" : "驱散迷雾显形"}
                    >
                      {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  )}
                </div>
              </div>

              {/* English Text with Clickable Words (Clean Typography without Intrusive Sparkles) */}
              <div 
                className={`font-reading ${getFontSizeClass()} select-text transition-all duration-300 leading-[1.75] ${
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
                  // Only treat words that have HP lore notes as magical lore terms
                  const isHpTerm = Boolean(HP_LORE_DICTIONARY[cleanWord]?.lore);

                  return (
                    <span
                      key={tokenIdx}
                      onClick={() => onWordClick(token.text, cue)}
                      className={`cursor-pointer transition-colors inline group/word relative ${
                        isHpTerm 
                          ? 'border-b border-amber-400 text-amber-900 font-medium hover:bg-amber-100/50 px-0.5 rounded-xs' 
                          : isActive 
                            ? 'text-amber-950 font-normal hover:bg-amber-400/20 hover:text-amber-900 rounded-xs' 
                            : 'text-[#1e1610] hover:bg-amber-400/15 hover:text-amber-900 rounded-xs'
                      }`}
                      title={isHpTerm ? `魔法专有名词: ${token.text} (点击查看百科背景与发音)` : '点击查看中文释义与发音'}
                    >
                      {token.text}
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

      {/* Floating Locate Active Cue Button (Only shown if manual scroll disabled auto-follow) */}
      {!isFollowActive && cues.length > 0 && activeCueIndex >= 0 && (
        <button
          onClick={scrollToActiveCue}
          className="fixed bottom-24 right-5 sm:right-8 z-30 flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-amber-300 bg-white text-amber-950 font-bold text-xs transition-colors active:scale-95 cursor-pointer"
          title="快速定位到正在朗读的句子"
        >
          <LocateFixed size={13} className="text-amber-600" />
          <span>定位朗读 (第 {activeCueIndex + 1} 句)</span>
        </button>
      )}
    </div>
  );
}
