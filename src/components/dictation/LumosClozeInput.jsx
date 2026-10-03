import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Check, Lightbulb } from 'lucide-react';
import { generateClozeStructure, cleanWord } from '../../utils/dictationEngine';
import { playCorrectChime, playMistakeThud } from '../../utils/spellAudioSynthesizer';

/**
 * LumosClozeInput — Mode 2: 高阶学徒 · 荧光挖空填空
 * Focuses on key vocabulary (nouns, verbs, adjectives, HP terms):
 * - Common functional words remain visible
 * - Content words blanked out with first-letter scaffold hint
 * - Inline input fields with auto-focus advance
 * - Zero emojis, pure parchment daylight palette
 */
export function LumosClozeInput({
  sentenceText,
  isParchment = true,
  onComplete,
  onQuillHintTrigger
}) {
  const [tokens, setTokens] = useState(() => generateClozeStructure(sentenceText));
  const [blankAnswers, setBlankAnswers] = useState({});
  const inputRefs = useRef([]);

  useEffect(() => {
    const newTokens = generateClozeStructure(sentenceText);
    setTokens(newTokens);
    setBlankAnswers({});
    inputRefs.current = [];
    // Focus first blank
    setTimeout(() => {
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    }, 100);
  }, [sentenceText]);

  // Extract all blank tokens
  const blanks = tokens.filter(t => t.isBlank);
  const totalBlanks = blanks.length;

  // Check correctness of all blanks
  const checkStatus = (blankToken, typedValue) => {
    const typedClean = cleanWord(typedValue || '');
    if (!typedClean) return 'empty';
    if (typedClean === blankToken.clean) return 'correct';
    return 'wrong';
  };

  const correctBlanksCount = blanks.filter(b => {
    const val = blankAnswers[b.blankIndex];
    return checkStatus(b, val) === 'correct';
  }).length;

  const isAllBlanksCorrect = totalBlanks > 0 && correctBlanksCount === totalBlanks;

  // Notify parent on full completion
  useEffect(() => {
    if (isAllBlanksCorrect && onComplete) {
      playCorrectChime();
      onComplete({
        totalWords: totalBlanks,
        correctWords: correctBlanksCount,
        accuracy: 100,
        isCompleted: true
      });
    }
  }, [isAllBlanksCorrect]);

  // Handle typing inside blank
  const handleChange = (blankIndex, value) => {
    setBlankAnswers(prev => ({ ...prev, [blankIndex]: value }));

    const currentBlank = blanks.find(b => b.blankIndex === blankIndex);
    if (currentBlank && cleanWord(value) === currentBlank.clean) {
      playCorrectChime();
      // Auto advance to next blank
      if (blankIndex < totalBlanks - 1 && inputRefs.current[blankIndex + 1]) {
        inputRefs.current[blankIndex + 1].focus();
      }
    }
  };

  // Keyboard navigation between blanks
  const handleKeyDown = (blankIndex, e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      // Jump to next blank
      if (blankIndex < totalBlanks - 1 && inputRefs.current[blankIndex + 1]) {
        inputRefs.current[blankIndex + 1].focus();
      }
    } else if (e.key === 'Backspace' && (!blankAnswers[blankIndex] || blankAnswers[blankIndex] === '')) {
      // Jump back to previous blank on backspace if empty
      if (blankIndex > 0 && inputRefs.current[blankIndex - 1]) {
        inputRefs.current[blankIndex - 1].focus();
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Fill current blank as hint
      const currentBlank = blanks.find(b => b.blankIndex === blankIndex);
      if (currentBlank) {
        setBlankAnswers(prev => ({ ...prev, [blankIndex]: currentBlank.text }));
        if (blankIndex < totalBlanks - 1 && inputRefs.current[blankIndex + 1]) {
          inputRefs.current[blankIndex + 1].focus();
        }
      }
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* ── Cloze Prompt Card ─────────────────────────────────────── */}
      <div className={`p-6 rounded-2xl border-2 transition-all leading-loose text-base sm:text-lg font-reading shadow-inner ${
        isAllBlanksCorrect
          ? 'bg-emerald-500/10 border-emerald-500'
          : 'bg-[#fbf9f5] border-[#eee5d8] text-[#1e1610]'
      }`}>
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-inherit text-xs font-semibold text-amber-800">
          <span className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-600" />
            <span>荧光闪烁 · 核心词挖空填补 (虚词已显现，填入关键实词)</span>
          </span>
          <span className="font-mono">
            进度: {correctBlanksCount} / {totalBlanks} 空
          </span>
        </div>

        {/* Sentence with Inline Blanks */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-3">
          {tokens.map((token, idx) => {
            if (!token.isWord) {
              return <span key={idx} className="text-slate-500 font-sans">{token.text}</span>;
            }

            if (!token.isBlank) {
              // Visible functional word
              return (
                <span key={idx} className="text-slate-700 font-medium">
                  {token.text}
                </span>
              );
            }

            // Blanked-out content word
            const blankIdx = token.blankIndex;
            const typedVal = blankAnswers[blankIdx] || '';
            const status = checkStatus(token, typedVal);

            return (
              <span key={idx} className="inline-flex items-center relative group">
                <input
                  ref={el => inputRefs.current[blankIdx] = el}
                  type="text"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck="false"
                  inputMode="text"
                  value={typedVal}
                  onChange={(e) => handleChange(blankIdx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(blankIdx, e)}
                  placeholder={`${token.firstLetter}${'•'.repeat(Math.min(token.clean.length - 1, 4))}`}
                  className={`w-28 sm:w-32 px-2.5 py-1 text-center font-bold text-base rounded-xl border-2 focus:outline-none transition-all ${
                    status === 'correct'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xs'
                      : status === 'wrong'
                      ? 'border-red-400 bg-red-50 text-red-700'
                      : 'border-amber-400/90 bg-white text-amber-950 focus:border-amber-600 focus:ring-2 focus:ring-amber-400/20'
                  }`}
                />
                {status === 'correct' && (
                  <Check size={14} className="absolute right-2 text-emerald-600 pointer-events-none" />
                )}
              </span>
            );
          })}
        </div>

        {/* Completion Banner */}
        {isAllBlanksCorrect && (
          <div className="mt-4 pt-3 border-t border-emerald-500/30 flex items-center justify-between text-xs text-emerald-800 font-bold animate-fadeIn">
            <span className="flex items-center gap-1">
              <Check size={14} className="text-emerald-600" />
              <span>本句核心单词全部准确拼写！</span>
            </span>
            <span className="text-amber-700 font-mono">获得满星评价</span>
          </div>
        )}
      </div>

      {/* Auxiliary Help Note */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span className="flex items-center gap-1">
          <Lightbulb size={13} className="text-amber-600" />
          <span>输入空格或按 Enter 自动跳转下一空，按 Tab 施展羽毛笔提示</span>
        </span>
      </div>
    </div>
  );
}

export default LumosClozeInput;
