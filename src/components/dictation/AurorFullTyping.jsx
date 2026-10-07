import React, { useRef, useEffect } from 'react';
import { CheckCircle2, Eye, EyeOff, Sparkles } from 'lucide-react';
import { tokenizeSentence } from '../../utils/vttParser';
import { cleanWord } from '../../utils/dictationEngine';

/**
 * AurorFullTyping — Mode 3: 傲罗实战 · 全句盲听打字
 * Full sentence blind typing for advanced practice:
 * - Real-time word-by-word visual blank feedback
 * - Fog of war with toggleable reveal
 * - Tab for quill hint, Enter to submit
 * - Zero emojis, pure parchment daylight palette
 */
export function AurorFullTyping({
  currentCue,
  userInput,
  setUserInput,
  showAnswer,
  setShowAnswer,
  isParchment = true,
  onEnterNext,
  onQuillHint
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentCue]);

  // Handle mobile virtual keyboard appearance (Visual Viewport API)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    const handleViewportChange = () => {
      if (document.activeElement === inputRef.current) {
        inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    };
    window.visualViewport.addEventListener('resize', handleViewportChange);
    return () => window.visualViewport?.removeEventListener('resize', handleViewportChange);
  }, []);

  if (!currentCue) return null;

  // Tokenize target sentence into words
  const targetTokens = tokenizeSentence(currentCue.text);
  const targetWords = targetTokens
    .filter(t => t.isWord)
    .map(t => cleanWord(t.text));

  // Tokenize user's typed input into words
  const userTokens = tokenizeSentence(userInput);
  const userWords = userTokens
    .filter(t => t.isWord)
    .map(t => cleanWord(t.text));

  // Calculate live word matching sequentially by word index
  let wordIdx = 0;
  const comparison = targetTokens.map((token) => {
    if (!token.isWord) {
      return { text: token.text, status: 'symbol' };
    }

    const cleanTarget = cleanWord(token.text);
    const normTarget = cleanTarget.replace(/['’\-]/g, '');
    const currentWordIndex = wordIdx++;

    if (currentWordIndex < userWords.length) {
      const typed = userWords[currentWordIndex];
      const normTyped = typed.replace(/['’\-]/g, '');
      if (typed === cleanTarget || (normTyped && normTyped === normTarget)) {
        return { text: token.text, status: 'correct', typed };
      } else {
        return { text: token.text, status: 'wrong', typed };
      }
    }

    return { text: token.text, status: 'pending' };
  });

  const correctCount = comparison.filter(c => c.status === 'correct').length;
  const isAllCorrect = correctCount === targetWords.length && targetWords.length > 0;

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* ── Real-time Visual Word Matching Display ─────────────────── */}
      <div className={`min-h-[110px] p-5 sm:p-6 rounded-2xl border font-reading text-lg sm:text-xl leading-relaxed transition-all ${
        isAllCorrect
          ? 'bg-emerald-500/10 border-emerald-500'
          : 'bg-[#fbf9f5] border-[#e8ddd0] text-[#1e1610]'
      }`}>
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-inherit text-xs font-semibold text-amber-800">
          <span className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-600" />
            <span>无声咒实战台 (盲听默写，实时逐词校对)</span>
          </span>
          <button
            onClick={() => setShowAnswer(!showAnswer)}
            className="flex items-center gap-1 text-xs text-amber-900/80 hover:text-amber-950 font-semibold cursor-pointer transition-colors"
          >
            {showAnswer ? <EyeOff size={13} /> : <Eye size={13} />}
            <span>{showAnswer ? '隐藏原句' : '偷看原句'}</span>
          </button>
        </div>

        {showAnswer ? (
          <div className="text-amber-900 animate-fadeIn">
            <span className="text-xs uppercase tracking-wider text-slate-400 block mb-1 font-mono">
              原著标准咒文：
            </span>
            "{currentCue.text}"
          </div>
        ) : (
          <div className="flex flex-wrap items-baseline gap-2">
            {comparison.map((item, i) => {
              if (item.status === 'symbol') {
                return <span key={i} className="text-slate-400 font-sans">{item.text}</span>;
              }

              if (item.status === 'correct') {
                return (
                  <span 
                    key={i} 
                    className="text-emerald-800 font-bold bg-emerald-500/15 px-2 py-0.5 rounded-lg border-b-2 border-emerald-500 animate-fadeIn"
                  >
                    {item.typed}
                  </span>
                );
              }

              if (item.status === 'wrong') {
                return (
                  <span 
                    key={i} 
                    className="text-red-700 line-through bg-red-500/15 px-2 py-0.5 rounded-lg border-b-2 border-red-500"
                    title={`输入了: ${item.typed}，应为: ${item.text}`}
                  >
                    {item.typed}
                  </span>
                );
              }

              // Pending word blank
              return (
                <span 
                  key={i} 
                  className="inline-flex items-center justify-center min-w-[50px] px-2.5 py-0.5 rounded-lg border border-dashed border-amber-400/80 bg-amber-50/70 text-amber-700 text-xs font-mono font-bold select-none"
                  title={`待拼写单词 (${item.text.length} 个字母)`}
                >
                  {Array(Math.min(item.text.length, 6)).fill('•').join(' ')}
                </span>
              );
            })}
          </div>
        )}

        {/* Chinese Translation Clue */}
        {currentCue.translation && (
          <div className="mt-3.5 pt-2.5 border-t border-dashed border-inherit text-xs sm:text-sm font-reading text-amber-900/80">
            中文释义线索：{currentCue.translation}
          </div>
        )}
      </div>

      {/* ── Student Typing Textarea ─────────────────────────────────── */}
      <div className="relative">
        <textarea
          ref={inputRef}
          rows={3}
          value={userInput}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Tab') {
              e.preventDefault();
              if (onQuillHint) onQuillHint();
            } else if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (onEnterNext) onEnterNext();
            }
          }}
          placeholder="仔细听原声，在此完整输入英文句子... (按 Tab 获取羽毛笔提示，按 Enter 提交进入下一句)"
          className={`w-full p-4 rounded-2xl text-base sm:text-lg font-reading border focus:outline-none transition-all resize-none ${
            isAllCorrect
              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-950'
              : 'border-[#e8ddd0] focus:border-amber-500 bg-white text-[#1e1610] focus:ring-2 focus:ring-amber-400/20'
          }`}
        />

        {isAllCorrect && (
          <div className="absolute right-4 bottom-4 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold animate-bounce">
            <CheckCircle2 size={16} />
            <span>拼写全对！获得满星评分</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default AurorFullTyping;
