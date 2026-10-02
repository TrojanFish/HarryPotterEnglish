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
  Headphones
} from 'lucide-react';
import { tokenizeSentence, formatTime } from '../utils/vttParser';
import { HP_LORE_DICTIONARY } from '../data/hpDictionary';

/**
 * SubtitleViewer — Kid-friendly bilingual listening & reading area.
 * - Large legible font with generous line-height for students
 * - Interactive word clicking with instant IPA phonetic & Chinese popover
 * - Lumos focus highlighting the active sentence with warm golden halo
 * - Quick sentence playback, loop, and shadowing recording buttons
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
  const [fontSize, setFontSize] = useState('large'); // 'normal' | 'large' | 'huge'

  // Auto-scroll active cue smoothly into center
  useEffect(() => {
    if (activeCueRef.current) {
      activeCueRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [activeCueIndex]);

  // Toggle single sentence reveal in blind mode
  const toggleSentenceReveal = (cueId) => {
    setRevealedSentences(prev => ({
      ...prev,
      [cueId]: !prev[cueId]
    }));
  };

  const getFontSizeClass = () => {
    if (fontSize === 'huge') return 'text-xl sm:text-2xl leading-loose';
    if (fontSize === 'large') return 'text-lg sm:text-xl leading-relaxed';
    return 'text-base sm:text-lg leading-relaxed';
  };

  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 max-w-4xl mx-auto w-full pb-8" ref={containerRef}>
      {/* ── Subtitle Toolbar for Students ─────────────────────────── */}
      <div className={`flex flex-wrap items-center justify-between gap-2.5 mb-4 p-3 rounded-2xl border transition-colors ${
        isParchment
          ? 'bg-[#ffffff]/80 border-[#e8dcb9] shadow-sm text-[#4a3928]'
          : 'bg-slate-900/80 border-slate-800 text-slate-300'
      }`}>
        {/* Left: Cue counts & status */}
        <div className="flex items-center space-x-2 text-xs font-medium">
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold font-mono">
            <Headphones size={13} />
            <span>全章 {cues.length} 个精听句</span>
          </span>

          {studyMode === 'blind' && (
            <span className="text-indigo-600 dark:text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-400/30 flex items-center gap-1 font-semibold">
              <EyeOff size={13} /> 魔法磨耳朵模式（迷雾遮罩）
            </span>
          )}
        </div>

        {/* Right: Reading controls for students */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Font Size Selector (Very important for students!) */}
          <button
            onClick={() => {
              setFontSize(prev => prev === 'normal' ? 'large' : prev === 'large' ? 'huge' : 'normal');
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              isParchment
                ? 'border-amber-300/80 hover:bg-amber-100/60 text-[#7a5927]'
                : 'border-slate-700 hover:bg-slate-800 text-slate-300'
            }`}
            title="调整阅读字号（大字号更护眼）"
          >
            <Type size={14} />
            <span className="font-mono text-xs uppercase">{fontSize === 'normal' ? '标准' : fontSize === 'large' ? '大字' : '特大'}</span>
          </button>

          {/* Translation Toggle */}
          <button
            onClick={() => setShowTranslation(!showTranslation)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
              showTranslation
                ? isParchment
                  ? 'bg-amber-500/15 border-amber-400 text-amber-900 shadow-sm'
                  : 'bg-amber-500/20 border-amber-400 text-amber-300'
                : isParchment
                ? 'border-gray-300 text-gray-500 hover:bg-gray-100'
                : 'border-slate-700 text-slate-400 hover:bg-slate-800'
            }`}
            title="开启/关闭中文双语译文"
          >
            <Languages size={14} />
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

          return (
            <div
              key={cue.id}
              ref={isActive ? activeCueRef : null}
              className={`group relative rounded-2xl p-4 sm:p-5 transition-all duration-300 border-2 ${
                isActive
                  ? isParchment
                    ? 'lumos-active bg-[#fffcf5] border-amber-500 border-l-[6px] border-l-amber-500 shadow-md ring-2 ring-amber-400/20'
                    : 'lumos-active bg-slate-900 border-amber-400 border-l-[6px] border-l-amber-400 shadow-xl'
                  : isParchment
                  ? 'bg-[#ffffff] border-[#e7ddc8] hover:border-amber-300 hover:shadow-sm'
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
                    className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors"
                    title="从本句开始慢听"
                  >
                    <Play size={14} className="fill-current" />
                  </button>

                  {/* Loop this sentence */}
                  <button
                    onClick={() => {
                      if (!isActive) onSeekToCue(cue);
                      onToggleLoopSentence();
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isActive && isLoopSentence 
                        ? 'text-amber-600 bg-amber-100 dark:bg-amber-950 font-bold' 
                        : 'text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800'
                    }`}
                    title="单句精听循环"
                  >
                    <Repeat size={14} />
                  </button>

                  {/* Shadowing Voice Recording */}
                  <button
                    onClick={() => onRecordCue(cue)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
                    title="点击我来跟读施咒（AI发音评分）"
                  >
                    <Mic size={14} />
                    <span className="text-[11px] hidden sm:inline font-bold">跟读</span>
                  </button>

                  {/* Blind mode reveal toggle */}
                  {studyMode === 'blind' && (
                    <button
                      onClick={() => toggleSentenceReveal(cue.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800"
                      title={isRevealed ? "开启迷雾遮罩" : "驱散迷雾显形"}
                    >
                      {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
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
          );
        })}
      </div>
    </div>
  );
}
