import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  SkipForward, 
  SkipBack, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  PenTool,
  Trophy,
  Flame,
  Star,
  Lightbulb
} from 'lucide-react';
import { tokenizeSentence } from '../utils/vttParser';
import { recordDictationSession } from '../utils/analyticsStore';

/**
 * DictationStudio — Gamified Spell Challenge (魔法拼写大闯关)
 * Designed specifically for primary and junior high school students:
 * - Word-by-word visual blank feedback
 * - Star rating system (3 stars for clean spelling)
 * - Combo streak tracking (连对计数)
 * - Slow replay audio & Magic Quill hints (羽毛笔提示)
 */
export function DictationStudio({
  cues,
  activeCueIndex,
  onSeekToCue,
  onPlayPause,
  isPlaying,
  isParchment,
  onNextCue,
  onPrevCue,
  chapterId = '',
  chapterTitle = '',
  onRecordResult
}) {
  const currentCue = cues[activeCueIndex];
  const [userInput, setUserInput] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [hintCount, setHintCount] = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const [totalStars, setTotalStars] = useState(0);
  const [stats, setStats] = useState({
    completedCount: 0,
    totalWords: 0,
    correctWords: 0,
  });

  const inputRef = useRef(null);

  // When active cue changes, reset user input and hints
  useEffect(() => {
    setUserInput('');
    setShowAnswer(false);
    setHintCount(0);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeCueIndex]);

  if (!currentCue) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 text-slate-400">
        <p>暂无精听字幕数据，请先选择章节</p>
      </div>
    );
  }

  // Tokenize target sentence into words
  const targetTokens = tokenizeSentence(currentCue.text);
  const targetWords = targetTokens
    .filter(t => t.isWord)
    .map(t => t.text.toLowerCase().replace(/[^a-z']/g, ''));

  // Tokenize user's typed input into words
  const userTokens = tokenizeSentence(userInput);
  const userWords = userTokens
    .filter(t => t.isWord)
    .map(t => t.text.toLowerCase().replace(/[^a-z']/g, ''));

  // Calculate live word matching
  let matchedCount = 0;
  const comparison = targetTokens.map((token) => {
    if (!token.isWord) {
      return { text: token.text, status: 'symbol' };
    }

    const cleanTarget = token.text.toLowerCase().replace(/[^a-z']/g, '');
    const currentWordIndex = targetWords.indexOf(cleanTarget, matchedCount);

    if (currentWordIndex !== -1 && currentWordIndex < userWords.length) {
      const typed = userWords[currentWordIndex];
      matchedCount = currentWordIndex + 1;
      if (typed === cleanTarget) {
        return { text: token.text, status: 'correct', typed };
      } else {
        return { text: token.text, status: 'wrong', typed };
      }
    }

    return { text: token.text, status: 'pending' };
  });

  // Calculate sentence accuracy
  const correctCount = comparison.filter(c => c.status === 'correct').length;
  const totalTargetWords = targetWords.length || 1;
  const accuracy = Math.round((correctCount / totalTargetWords) * 100);
  const isAllCorrect = correctCount === targetWords.length && targetWords.length > 0;

  // Star rating calculation
  const currentSentenceStars = isAllCorrect ? (hintCount === 0 ? 3 : hintCount === 1 ? 2 : 1) : 0;

  // Quill Hint: reveal next pending word
  const handleQuillHint = () => {
    const nextPending = targetWords[userWords.length];
    if (nextPending) {
      setUserInput(prev => (prev.trim() ? `${prev.trim()} ${nextPending} ` : `${nextPending} `));
      setHintCount(prev => prev + 1);
      if (inputRef.current) inputRef.current.focus();
    }
  };

  // Replay current sentence
  const handleReplayCurrent = () => {
    onSeekToCue(currentCue);
  };

  // Submit and advance to next sentence
  const handleNext = () => {
    const earnedStars = isAllCorrect ? (hintCount === 0 ? 3 : 2) : 1;
    if (isAllCorrect) {
      setStreakCount(s => s + 1);
      setTotalStars(t => t + earnedStars);
    } else {
      setStreakCount(0);
    }

    const sessionData = {
      chapterId: chapterId || 'hp-chapter',
      chapterTitle: chapterTitle || 'Hogwarts Dictation Practice',
      totalWords: targetWords.length,
      correctWords: correctCount,
      accuracy: accuracy
    };

    setStats(prev => ({
      completedCount: prev.completedCount + 1,
      totalWords: prev.totalWords + targetWords.length,
      correctWords: prev.correctWords + correctCount
    }));

    if (targetWords.length > 0) {
      recordDictationSession(sessionData);
      if (onRecordResult) {
        onRecordResult(sessionData);
      }
    }

    onNextCue();
  };

  return (
    <div className="flex-1 max-w-4xl mx-auto px-4 py-6 w-full flex flex-col justify-between pb-8">
      {/* ── Gamified Quest Header ─────────────────────────────────── */}
      <div className={`p-4 rounded-2xl border mb-5 flex flex-wrap items-center justify-between gap-3 shadow-sm ${
        isParchment
          ? 'bg-[#ffffff] border-[#e8dcb9] text-[#2d241c]'
          : 'bg-slate-900 border-slate-800 text-slate-200'
      }`}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-md">
            <Trophy size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-magical font-bold text-base sm:text-lg text-amber-800 dark:text-amber-400">
                魔法拼写大闯关 (Spell Quest)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30">
                闯关中
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-1">
              <span>第 {activeCueIndex + 1} / {cues.length} 句</span>
              <span>·</span>
              <Star size={12} className="text-amber-500 fill-amber-500 inline" />
              <span>已斩获 {totalStars} 颗魔法星</span>
            </p>
          </div>
        </div>

        {/* Combo & Accuracy */}
        <div className="flex items-center space-x-2">
          {streakCount > 1 && (
            <span className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full font-bold text-xs shadow-md animate-bounce">
              <Flame size={13} />
              <span>连对 {streakCount} 句!</span>
            </span>
          )}

          <span className={`px-3 py-1 rounded-full font-mono font-bold text-xs shadow-sm ${
            accuracy >= 80 
              ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40' 
              : accuracy >= 50
                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}>
            准确率: {accuracy}%
          </span>
        </div>
      </div>

      {/* ── Main Dictation Paper Card ─────────────────────────────── */}
      <div className={`p-6 sm:p-8 rounded-3xl border-2 transition-all shadow-md ${
        isParchment 
          ? 'bg-[#ffffff] border-[#e8dcb9] text-[#2c221e]' 
          : 'bg-slate-900 border-slate-800 text-slate-100'
      }`}>
        
        {/* Audio Playback & Replay bar */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-inherit">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleReplayCurrent}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:shadow-md text-xs font-bold transition-all shadow-sm"
              title="重新听本句慢速朗读"
            >
              <RotateCcw size={14} />
              <span>重播本句声音</span>
            </button>

            <button
              onClick={() => onPlayPause()}
              className="p-2 rounded-xl border border-gray-300 dark:border-slate-700 hover:border-amber-500 text-slate-600 dark:text-slate-300 transition-colors"
              title="播放 / 暂停"
            >
              {isPlaying ? <Pause size={15} /> : <Play size={15} />}
            </button>
          </div>

          {/* Reveal Answer Toggle */}
          <button
            onClick={() => setShowAnswer(!showAnswer)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-amber-600 transition-colors font-medium"
          >
            {showAnswer ? <EyeOff size={14} /> : <Eye size={14} />}
            <span>{showAnswer ? '隐藏原句' : '偷看原句'}</span>
          </button>
        </div>

        {/* Real-time Visual Word Matching Display */}
        <div className={`min-h-[100px] p-5 rounded-2xl border font-reading text-lg sm:text-xl leading-relaxed mb-6 ${
          isParchment 
            ? 'bg-[#faf6ee] border-[#e8dcb9]' 
            : 'bg-slate-950/70 border-slate-800'
        }`}>
          {showAnswer ? (
            <div className="text-amber-700 dark:text-amber-300 animate-fadeIn">
              <span className="text-xs uppercase tracking-wider text-slate-400 block mb-1 font-mono">
                原著标准文本：
              </span>
              "{currentCue.text}"
            </div>
          ) : (
            <div className="flex flex-wrap items-baseline gap-2">
              {comparison.map((item, i) => {
                if (item.status === 'symbol') {
                  return <span key={i} className="text-slate-400">{item.text}</span>;
                }

                if (item.status === 'correct') {
                  return (
                    <span 
                      key={i} 
                      className="text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-500/15 px-2 py-0.5 rounded-lg border-b-2 border-emerald-500 animate-fadeIn"
                    >
                      {item.typed}
                    </span>
                  );
                }

                if (item.status === 'wrong') {
                  return (
                    <span 
                      key={i} 
                      className="text-red-700 dark:text-red-300 line-through bg-red-500/15 px-2 py-0.5 rounded-lg border-b-2 border-red-500"
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
                    className="inline-flex items-center justify-center min-w-[48px] h-7 border-b-2 border-dashed border-amber-400 text-amber-500/40 text-xs font-mono font-bold select-none px-1"
                  >
                    ____
                  </span>
                );
              })}
            </div>
          )}

          {/* Chinese Translation Clue */}
          {currentCue.translation && (
            <div className="mt-3.5 pt-2.5 border-t border-dashed border-inherit text-xs sm:text-sm font-reading text-amber-900/80 dark:text-slate-400">
              中文释义线索：{currentCue.translation}
            </div>
          )}
        </div>

        {/* Student Typing Textarea */}
        <div className="relative">
          <textarea
            ref={inputRef}
            rows={3}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Tab') {
                e.preventDefault();
                handleQuillHint();
              } else if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleNext();
              }
            }}
            placeholder="仔细听原声，在这里输入英文单词... (按 Tab 获取羽毛笔提示，按 Enter 提交进入下一句)"
            className={`w-full p-4 rounded-2xl text-base sm:text-lg font-reading border-2 focus:outline-none transition-all resize-none ${
              isAllCorrect
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100 shadow-sm'
                : isParchment
                ? 'border-amber-300 focus:border-amber-500 bg-[#fffdfa] text-[#2c221e] focus:ring-2 focus:ring-amber-400/20'
                : 'border-slate-700 focus:border-amber-400 bg-slate-950 text-slate-100 focus:ring-2 focus:ring-amber-400/20'
            }`}
          />

          {isAllCorrect && (
            <div className="absolute right-4 bottom-4 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold animate-bounce shadow-lg">
              <CheckCircle2 size={16} />
              <span>拼写全对！获得满星评分</span>
            </div>
          )}
        </div>

        {/* Action Controls & Navigation */}
        <div className="mt-5 pt-3 border-t border-inherit flex flex-wrap items-center justify-between gap-3">
          {/* Left aids */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleQuillHint}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${
                isParchment
                  ? 'border-amber-400 bg-amber-50 text-amber-900 hover:bg-amber-100'
                  : 'border-slate-700 bg-slate-800 text-amber-300 hover:bg-slate-700'
              }`}
              title="羽毛笔魔法提示：自动补齐下一个单词 (快捷键: Tab)"
            >
              <Sparkles size={14} className="text-amber-500" />
              <span>羽毛笔提示 (Tab)</span>
            </button>

            <button
              onClick={() => setUserInput('')}
              className="px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-700 text-xs text-slate-400 hover:text-red-500 transition-colors"
            >
              清空重来
            </button>
          </div>

          {/* Right Navigation */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onPrevCue}
              disabled={activeCueIndex <= 0}
              className="px-3.5 py-2 rounded-xl border border-gray-300 dark:border-slate-700 text-xs disabled:opacity-30 hover:border-amber-400 flex items-center gap-1 font-semibold"
            >
              <SkipBack size={14} />
              <span>上一句</span>
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:shadow-md text-xs font-bold transition-all shadow-sm"
            >
              <span>{activeCueIndex >= cues.length - 1 ? '完成全章挑战' : '下一句 (Enter)'}</span>
              <SkipForward size={14} />
            </button>
          </div>
        </div>

      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="mt-4 text-center text-xs text-slate-400 flex items-center justify-center gap-4">
        <span><kbd className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-slate-800 text-amber-800 dark:text-amber-300 font-mono">Tab</kbd> 羽毛笔提示</span>
        <span><kbd className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-slate-800 text-amber-800 dark:text-amber-300 font-mono">Enter</kbd> 提交下一句</span>
        <span><kbd className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-slate-800 text-amber-800 dark:text-amber-300 font-mono">Space</kbd> 暂停/播放</span>
      </div>
    </div>
  );
}
