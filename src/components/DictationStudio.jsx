import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  SkipForward, 
  SkipBack, 
  CheckCircle2, 
  Trophy, 
  Flame, 
  Star, 
  Lightbulb,
  Volume2,
  VolumeX,
  Shield,
  Zap,
  Award,
  Languages
} from 'lucide-react';
import { tokenizeSentence, formatTime } from '../utils/vttParser';
import { recordDictationSession } from '../utils/analyticsStore';
import { cleanWord } from '../utils/dictationEngine';
import { 
  toggleSpellSound, 
  getSpellSoundStatus, 
  playCorrectChime, 
  playComboArpeggio, 
  playMistakeThud, 
  playVictoryFanfare 
} from '../utils/spellAudioSynthesizer';

import { AccioWordPicker } from './dictation/AccioWordPicker';
import { LumosClozeInput } from './dictation/LumosClozeInput';
import { AurorFullTyping } from './dictation/AurorFullTyping';
import { DuelingSurvivalBar } from './dictation/DuelingSurvivalBar';
import { DictationSummaryModal } from './dictation/DictationSummaryModal';

/**
 * DictationStudio — Hogwarts Gamified Spell Quest (魔法拼写大闯关)
 * Deeply harmonized into the Hogwarts study classroom:
 * - Clean sticky sub-header aligned with SubtitleViewer toolbar
 * - 4 progressive difficulty tiers with unified segmented control
 * - Focused single-card exercise surface with hero audio prompt
 * - Dedicated integrated bottom action & Duolingo feedback bar (zero player duplication)
 * - Zero emojis, 100% warm parchment design tokens, Apple HIG touch targets
 */
export function DictationStudio({
  cues = [],
  activeCueIndex = 0,
  onSeekToCue,
  onPlayPause,
  isPlaying = false,
  isParchment = true,
  onNextCue,
  onPrevCue,
  onNextSentence,
  onPrevSentence,
  onCloseStudio,
  chapterId = '',
  chapterTitle = '',
  onRecordResult,
  playbackRate = 1.0,
  onChangePlaybackRate,
  onSaveErrorWordsToVocab,
  onReplayCurrentSentence
}) {
  const currentCue = cues[activeCueIndex];
  const advanceNext = onNextSentence || onNextCue;
  const advancePrev = onPrevSentence || onPrevCue;

  // 1. Difficulty Mode Selector ('accio' | 'lumos' | 'auror' | 'dueling')
  const [difficultyMode, setDifficultyMode] = useState(() => {
    try {
      return localStorage.getItem('hp_dictation_mode') || 'accio';
    } catch {
      return 'accio';
    }
  });

  const handleDifficultyChange = (mode) => {
    setDifficultyMode(mode);
    try {
      localStorage.setItem('hp_dictation_mode', mode);
    } catch {}
  };

  // Sound effects toggle
  const [soundEnabled, setSoundEnabled] = useState(() => getSpellSoundStatus());

  const handleToggleSound = () => {
    const newState = toggleSpellSound();
    setSoundEnabled(newState);
  };

  // 2. Gameplay state
  const [userInput, setUserInput] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [hintCount, setHintCount] = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const [totalStars, setTotalStars] = useState(0);
  const [errorWords, setErrorWords] = useState([]);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [feedbackState, setFeedbackState] = useState(null);
  const [showTranslationClue, setShowTranslationClue] = useState(false);

  // Dueling Mode survival state
  const [shields, setShields] = useState(3);
  const [timeRemaining, setTimeRemaining] = useState(25);

  const [stats, setStats] = useState({
    completedCount: 0,
    totalWords: 0,
    correctWords: 0,
  });

  // Reset inputs when active sentence changes
  useEffect(() => {
    setUserInput('');
    setShowAnswer(false);
    setHintCount(0);
    setTimeRemaining(25);
    setFeedbackState(null);
    setShowTranslationClue(false);
  }, [activeCueIndex]);

  // Handle advancing from feedback sheet
  const handleFeedbackContinue = () => {
    setFeedbackState(null);
    handleNext();
  };

  // Keyboard shortcut: Press Enter on bottom feedback to advance immediately
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (feedbackState && e.key === 'Enter') {
        e.preventDefault();
        handleFeedbackContinue();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [feedbackState, activeCueIndex, cues.length]);

  // Dueling Mode: Timer countdown
  useEffect(() => {
    if (difficultyMode !== 'dueling') return;
    if (shields <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          playMistakeThud();
          setShields(s => Math.max(0, s - 1));
          return 25;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [difficultyMode, shields, activeCueIndex]);

  if (!currentCue) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 text-stone-400">
        <p>暂无精听字幕数据，请先选择章节</p>
      </div>
    );
  }

  // Tokenize target sentence into words
  const targetTokens = tokenizeSentence(currentCue.text);
  const targetWords = targetTokens
    .filter(t => t.isWord)
    .map(t => cleanWord(t.text));

  // Audio replay handlers
  const handleReplayCurrent = (slow = false) => {
    if (slow && onChangePlaybackRate) {
      onChangePlaybackRate(0.8);
    } else if (!slow && onChangePlaybackRate && playbackRate !== 1.0) {
      onChangePlaybackRate(1.0);
    }
    if (onReplayCurrentSentence && currentCue) {
      onReplayCurrentSentence(currentCue);
    } else if (onSeekToCue && currentCue) {
      onSeekToCue(currentCue);
    }
  };

  // Quill Hint: auto-advance or fill word
  const handleQuillHint = () => {
    const userWords = tokenizeSentence(userInput)
      .filter(t => t.isWord)
      .map(t => cleanWord(t.text));

    const nextPending = targetWords[userWords.length];
    if (nextPending) {
      setUserInput(prev => (prev.trim() ? `${prev.trim()} ${nextPending} ` : `${nextPending} `));
      setHintCount(prev => prev + 1);
      if (!errorWords.includes(nextPending)) {
        setErrorWords(prev => [...prev, nextPending]);
      }
    }
  };

  // Handle successful completion from sub-mode components
  const handleSubModeComplete = (result) => {
    const earnedStars = hintCount === 0 ? 3 : hintCount === 1 ? 2 : 1;
    const newStreak = streakCount + 1;
    setStreakCount(newStreak);
    setTotalStars(t => t + earnedStars);

    if (newStreak >= 3) {
      playComboArpeggio();
      if (difficultyMode === 'dueling' && shields < 3) {
        setShields(s => Math.min(3, s + 1));
      }
    }

    setStats(prev => ({
      completedCount: prev.completedCount + 1,
      totalWords: prev.totalWords + (result.totalWords || targetWords.length),
      correctWords: prev.correctWords + (result.correctWords || targetWords.length)
    }));

    // Record session data
    const sessionData = {
      chapterId: chapterId || 'hp-chapter',
      chapterTitle: chapterTitle || 'Hogwarts Dictation Practice',
      totalWords: targetWords.length,
      correctWords: targetWords.length,
      accuracy: 100
    };

    recordDictationSession(sessionData);
    if (onRecordResult) {
      onRecordResult(sessionData);
    }

    // Trigger Celebratory Feedback Sheet
    setFeedbackState({
      isCorrect: true,
      accuracy: 100,
      streak: streakCount + 1,
      sentence: currentCue.text
    });
  };

  // Handle advancing to next cue
  const handleNext = () => {
    if (activeCueIndex >= cues.length - 1) {
      playVictoryFanfare();
      setIsSummaryOpen(true);
      return;
    }

    if (advanceNext) {
      advanceNext();
    }
  };

  // Save error words into user vocabulary list
  const handleSaveErrorsToVocab = (wordsToSave) => {
    if (onSaveErrorWordsToVocab) {
      onSaveErrorWordsToVocab(wordsToSave);
      return;
    }
    try {
      const saved = localStorage.getItem('hp_vocab_list');
      const currentList = saved ? JSON.parse(saved) : [];
      const newItems = wordsToSave
        .filter(w => !currentList.some(item => item.word.toLowerCase() === w.toLowerCase()))
        .map(w => ({
          id: Date.now() + Math.random().toString(),
          word: w,
          front: w,
          translation: '魔法拼写错词重炼',
          context: currentCue ? currentCue.text : '',
          chapterId: chapterId || '',
          dateAdded: new Date().toLocaleDateString()
        }));
      localStorage.setItem('hp_vocab_list', JSON.stringify([...newItems, ...currentList]));
    } catch {}
  };

  const overallAccuracy = stats.totalWords > 0 
    ? Math.round((stats.correctWords / stats.totalWords) * 100) 
    : 100;

  const maxStarsPossible = cues.length * 3;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fbf9f4] text-[#1e1610] select-none overflow-hidden">
      
      {/* ── 1. Sticky Mode Sub-Header (Integrated with Study TopBar) ── */}
      <div className="sticky top-0 z-20 bg-[#fbf9f4]/95 border-b border-[#e8ddd0] backdrop-blur-md px-4 sm:px-6 py-2.5 shrink-0">
        {/* Row 1: Quest Status, Stars & Audio Toggles */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-amber-950 font-magical shrink-0">
              <Zap size={15} className="text-amber-600" />
              <span>拼写大闯关</span>
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-900 font-mono font-bold border border-amber-300/60 shrink-0">
              第 {activeCueIndex + 1} / {cues.length} 句
            </span>
            {streakCount >= 2 && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-bold border border-orange-200 shrink-0">
                <Flame size={11} className="text-orange-500" />
                <span>连对 x{streakCount}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Stars counter */}
            <div className="flex items-center gap-1 text-xs text-amber-900 font-bold bg-amber-50 px-2 sm:px-2.5 py-1 rounded-xl border border-amber-200/80">
              <Star size={13} className="text-amber-500 fill-amber-500" />
              <span>{totalStars} 星</span>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={handleToggleSound}
              className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
                soundEnabled
                  ? 'border-amber-300 bg-amber-50 text-amber-800'
                  : 'border-[#e8ddd0] bg-white text-stone-400 hover:border-amber-300'
              }`}
              title={soundEnabled ? '魔咒合成音效：开 (点击静音)' : '魔咒合成音效：关 (点击开启)'}
            >
              {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>

            {/* Trophy report trigger */}
            <button
              onClick={() => setIsSummaryOpen(true)}
              className="w-8 h-8 rounded-xl border border-[#e8ddd0] bg-white hover:border-amber-300 text-stone-500 hover:text-amber-950 flex items-center justify-center transition-colors cursor-pointer"
              title="查看全卷成绩单"
            >
              <Trophy size={14} className="text-amber-600" />
            </button>
          </div>
        </div>

        {/* Row 2: 4-Tier Difficulty Segmented Control */}
        <div className="mt-2 h-8 sm:h-9 flex items-center p-0.5 sm:p-1 rounded-xl bg-stone-100/90 border border-[#e8ddd0] gap-0.5 sm:gap-1">
          {[
            { key: 'accio',   label: '见习 · 飞来字块', short: '字块拼装', icon: <Sparkles size={12} /> },
            { key: 'lumos',   label: '学徒 · 荧光挖空', short: '核心挖空', icon: <Lightbulb size={12} /> },
            { key: 'auror',   label: '傲罗 · 全句盲听', short: '全句默写', icon: <Award size={12} /> },
            { key: 'dueling', label: '决斗 · 限时生存', short: '限时试炼', icon: <Shield size={12} /> },
          ].map((tier) => {
            const isActive = difficultyMode === tier.key;
            return (
              <button
                key={tier.key}
                onClick={() => handleDifficultyChange(tier.key)}
                className={`flex-1 h-7 sm:h-7.5 px-1 sm:px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-stone-600 hover:text-amber-950 hover:bg-white/80'
                }`}
              >
                {tier.icon}
                <span className="hidden sm:inline">{tier.label}</span>
                <span className="sm:hidden">{tier.short}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2. Scrollable Central Exercise Area ───────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:py-6 ios-scroll">
        <div className="max-w-3xl mx-auto w-full space-y-4">

          {/* Dueling Club Survival Bar (if dueling mode) */}
          {difficultyMode === 'dueling' && (
            <DuelingSurvivalBar
              shields={shields}
              maxShields={3}
              timeRemaining={timeRemaining}
              maxTime={25}
              streakCount={streakCount}
            />
          )}

          {/* Main Dictation Challenge Card */}
          <div className="p-5 sm:p-7 rounded-2xl border border-[#e8ddd0] bg-white text-[#1e1610] transition-all">

            {/* Audio Hero Listening Station */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-[#eee5d8]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleReplayCurrent(false)}
                  className="h-10 sm:h-11 px-3.5 sm:px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm flex items-center gap-2 active:scale-95 transition-all cursor-pointer border border-amber-600"
                  title="重新听本句原速朗读 (Space)"
                >
                  {isPlaying ? (
                    <span className="flex items-center gap-0.5 text-white shrink-0">
                      <span className="w-[3px] h-3 bg-white rounded-full animate-wave-1" />
                      <span className="w-[3px] h-4 bg-white rounded-full animate-wave-2" />
                      <span className="w-[3px] h-2 bg-white rounded-full animate-wave-3" />
                    </span>
                  ) : (
                    <RotateCcw size={14} className="shrink-0" />
                  )}
                  <span>{isPlaying ? '正在朗读...' : '重播本句 (1.0x)'}</span>
                </button>

                {onChangePlaybackRate && (
                  <button
                    onClick={() => handleReplayCurrent(true)}
                    className={`h-10 sm:h-11 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer ${
                      playbackRate === 0.8
                        ? 'bg-amber-100 text-amber-900 border-amber-400'
                        : 'border-[#e8ddd0] bg-white text-stone-700 hover:border-amber-300'
                    }`}
                    title="慢速重播，辨析连读弱读"
                  >
                    <Sparkles size={13} className="text-amber-600" />
                    <span>慢速 0.8x</span>
                  </button>
                )}

                {/* Translation hint toggle */}
                {currentCue.translation && (
                  <button
                    onClick={() => setShowTranslationClue(prev => !prev)}
                    className={`h-10 sm:h-11 px-2.5 sm:px-3 rounded-xl border text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                      showTranslationClue
                        ? 'bg-amber-50 text-amber-900 border-amber-300'
                        : 'border-[#e8ddd0] bg-white text-stone-500 hover:border-amber-300'
                    }`}
                    title="遇到困难？点击查看中文释义线索"
                  >
                    <Languages size={13} className={showTranslationClue ? 'text-amber-600' : 'text-stone-400'} />
                    <span className="hidden sm:inline">{showTranslationClue ? '隐藏译文' : '译文线索'}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-stone-400 font-mono">
                <span>{formatTime(currentCue.startTime)}</span>
              </div>
            </div>

            {/* Revealed Chinese clue */}
            {showTranslationClue && currentCue.translation && (
              <div className="mb-5 p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs sm:text-sm text-[#735839] font-reading leading-relaxed animate-fadeIn">
                <span className="font-bold text-amber-900 mr-1.5">原著线索：</span>
                {currentCue.translation}
              </div>
            )}

            {/* Sub-Mode Interactive Components */}
            {difficultyMode === 'accio' && (
              <AccioWordPicker
                sentenceText={currentCue.text}
                isParchment={isParchment}
                onComplete={handleSubModeComplete}
                onReset={() => setHintCount(0)}
              />
            )}

            {difficultyMode === 'lumos' && (
              <LumosClozeInput
                sentenceText={currentCue.text}
                isParchment={isParchment}
                onComplete={handleSubModeComplete}
                onQuillHintTrigger={handleQuillHint}
              />
            )}

            {(difficultyMode === 'auror' || difficultyMode === 'dueling') && (
              <AurorFullTyping
                currentCue={currentCue}
                userInput={userInput}
                setUserInput={setUserInput}
                showAnswer={showAnswer}
                setShowAnswer={setShowAnswer}
                isParchment={isParchment}
                onEnterNext={handleNext}
                onQuillHint={handleQuillHint}
              />
            )}

            {/* Typing aids (Auror / Dueling) */}
            {(difficultyMode === 'auror' || difficultyMode === 'dueling') && (
              <div className="mt-5 pt-3.5 border-t border-[#eee5d8] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleQuillHint}
                    className="h-9 px-3 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                    title="自动补齐下一个单词 (快捷键: Tab)"
                  >
                    <Sparkles size={13} className="text-amber-600" />
                    <span>羽毛笔提示 (Tab)</span>
                  </button>
                  <button
                    onClick={() => setUserInput('')}
                    className="h-9 px-3 rounded-xl border border-[#e8ddd0] bg-white hover:bg-rose-50 text-stone-500 hover:text-rose-600 text-xs font-bold active:scale-95 transition-all cursor-pointer"
                  >
                    清空重来
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── 3. Dedicated Integrated Bottom Action & Feedback Bar ──────── */}
      <div className={`shrink-0 border-t pb-safe transition-all ${
        feedbackState
          ? feedbackState.isCorrect
            ? 'bg-[#d7f0db] border-emerald-500 text-emerald-950'
            : 'bg-[#fed7d7] border-rose-400 text-rose-950'
          : 'bg-white border-[#e8ddd0] text-[#1e1610]'
      }`}>
        {feedbackState ? (
          /* Duolingo Celebratory Feedback State */
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white ${
                feedbackState.isCorrect ? 'bg-emerald-600' : 'bg-rose-600'
              }`}>
                {feedbackState.isCorrect ? <CheckCircle2 size={22} /> : <RotateCcw size={20} />}
              </div>
              <div className="min-w-0">
                <h4 className="font-magical font-bold text-sm sm:text-base leading-tight">
                  {feedbackState.isCorrect ? '太棒了！拼写完全正确！' : '咒文存在微小偏差'}
                </h4>
                <p className="text-xs font-reading opacity-90 truncate mt-0.5">
                  {feedbackState.isCorrect
                    ? (feedbackState.streak >= 2 ? `连对第 ${feedbackState.streak} 句！魔力充盈！` : '精准拼写出整句咒语，获得满星魔力！')
                    : `标准咒文：${feedbackState.sentence || currentCue.text}`}
                </p>
              </div>
            </div>

            <button
              onClick={handleFeedbackContinue}
              className={`w-full sm:w-auto h-11 px-6 sm:px-8 rounded-xl font-bold text-xs sm:text-sm text-white cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-2 ${
                feedbackState.isCorrect ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              <span>{activeCueIndex >= cues.length - 1 ? '完成试炼并结算 (Enter)' : '继续下一句 (Enter)'}</span>
              <SkipForward size={15} />
            </button>
          </div>
        ) : (
          /* Active Exercise Navigation Bar */
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3">
            <button
              onClick={advancePrev}
              disabled={activeCueIndex <= 0}
              className="h-11 px-3 sm:px-4 rounded-xl border border-[#e8ddd0] bg-white text-stone-600 hover:text-amber-950 hover:border-amber-300 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-colors cursor-pointer"
              title="上一句 (←)"
            >
              <SkipBack size={15} />
              <span className="hidden sm:inline">上一句</span>
            </button>

            <button
              onClick={handleNext}
              className="h-11 px-5 sm:px-6 rounded-xl duo-btn-primary text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer active:scale-95 shadow-none"
              title="下一句 (Enter)"
            >
              <span>{activeCueIndex >= cues.length - 1 ? '完成试炼并结算' : '跳过 / 下一句'}</span>
              <SkipForward size={15} />
            </button>
          </div>
        )}
      </div>

      {/* ── 4. Chapter Quest Summary Report Card Modal ─────────────── */}
      <DictationSummaryModal
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        stats={stats}
        totalStars={totalStars}
        maxStars={maxStarsPossible}
        accuracy={overallAccuracy}
        mode={difficultyMode}
        errorWords={errorWords}
        chapterTitle={chapterTitle}
        onRetryErrors={() => {
          setIsSummaryOpen(false);
          if (onSeekToCue && cues[0]) onSeekToCue(cues[0]);
        }}
        onSaveErrorWordsToVocab={handleSaveErrorsToVocab}
        isParchment={isParchment}
      />
    </div>
  );
}

export default DictationStudio;
