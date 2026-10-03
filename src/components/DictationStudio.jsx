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
  Award
} from 'lucide-react';
import { tokenizeSentence } from '../utils/vttParser';
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
 * 4 Progressive Difficulty Levels:
 * 1. 见习巫师 · 飞来字块 (Accio) — Word puzzle builder with distractors
 * 2. 高阶学徒 · 荧光挖空 (Lumos) — Core content word cloze with first-letter micro-glow
 * 3. 傲罗特训 · 全句盲听 (Auror) — Classic full sentence typing with fog of war
 * 4. 决斗俱乐部 · 限时生存 (Dueling) — 3 Protego shields + 25s timer per sentence
 * 
 * Features:
 * - Pure Web Audio synthetic chimes & fanfares
 * - Potion Crucible (错词魔药重炼)
 * - House cup points settlement report card
 * - Zero emojis, pure parchment daylight palette
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
  chapterId = '',
  chapterTitle = '',
  onRecordResult,
  playbackRate = 1.0,
  onChangePlaybackRate
}) {
  const currentCue = cues[activeCueIndex];

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
  }, [activeCueIndex]);

  // Handle advancing from feedback sheet
  const handleFeedbackContinue = () => {
    setFeedbackState(null);
    handleNext();
  };

  // Keyboard shortcut: Press Enter on bottom sheet to advance immediately
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
          // Timeout! Deduct 1 shield
          playMistakeThud();
          setShields(s => Math.max(0, s - 1));
          return 25; // Reset timer for next try
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [difficultyMode, shields, activeCueIndex]);

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
    .map(t => cleanWord(t.text));

  // Audio replay handlers
  const handleReplayCurrent = (slow = false) => {
    if (slow && onChangePlaybackRate) {
      onChangePlaybackRate(0.8);
    } else if (!slow && onChangePlaybackRate && playbackRate !== 1.0) {
      onChangePlaybackRate(1.0);
    }
    if (onSeekToCue) {
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
      // Track hint words into error/review pool
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
      // Dueling bonus: restore shield on 3+ combo
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

    // Trigger Duolingo Bottom Feedback Sheet
    setFeedbackState({
      isCorrect: true,
      accuracy: 100,
      streak: streakCount + 1,
      sentence: currentCue.text
    });
  };

  // Handle advancing to next cue
  const handleNext = () => {
    // If on last cue of chapter, open summary report card
    if (activeCueIndex >= cues.length - 1) {
      playVictoryFanfare();
      setIsSummaryOpen(true);
      return;
    }

    if (onNextCue) {
      onNextCue();
    }
  };

  // Save error words into user vocabulary list
  const handleSaveErrorsToVocab = (wordsToSave) => {
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
    <div className="flex-1 max-w-4xl mx-auto px-4 py-6 w-full flex flex-col justify-between pb-8 select-none">
      
      {/* ── 1. Gamified Quest Top Status Bar ──────────────────────── */}
      <div className={`p-4 rounded-3xl border-2 mb-5 flex flex-wrap items-center justify-between gap-3 shadow-sm ${
        isParchment
          ? 'bg-[#ffffff] border-[#e8dcb9] text-[#2d241c]'
          : 'bg-slate-900 border-slate-800 text-slate-200'
      }`}>
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-md">
            <Trophy size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-magical font-bold text-base sm:text-lg text-amber-900">
                魔法拼写大闯关 (Spell Quest)
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 font-bold border border-emerald-500/30">
                第 {activeCueIndex + 1} / {cues.length} 句
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
              <Star size={13} className="text-amber-500 fill-amber-500 inline" />
              <span>已斩获 {totalStars} 颗魔法星</span>
              <span>·</span>
              <span>连对 {streakCount} 句</span>
            </p>
          </div>
        </div>

        {/* Combo & Sound Controls */}
        <div className="flex items-center space-x-2">
          {streakCount >= 2 && (
            <span className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-full font-bold text-xs shadow-md animate-bounce">
              <Flame size={13} />
              <span>连对 x{streakCount}!</span>
            </span>
          )}

          {/* Sound Toggle Button */}
          <button
            onClick={handleToggleSound}
            className={`p-2 rounded-xl border transition-all active:scale-90 cursor-pointer ${
              soundEnabled
                ? 'border-amber-300 bg-amber-50 text-amber-800'
                : 'border-slate-300 bg-slate-100 text-slate-400'
            }`}
            title={soundEnabled ? '魔咒合成音效: 已开启 (点击静音)' : '魔咒合成音效: 已静音 (点击开启)'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
      </div>

      {/* ── 2. Difficulty Tier Selector Tabs ───────────────────────── */}
      <div className="flex items-center justify-between gap-1.5 p-1.5 bg-[#f0e7d5] rounded-2xl mb-5 border border-amber-200/80 overflow-x-auto">
        {[
          { key: 'accio',   label: '见习巫师 · 飞来字块', desc: '字块拼句', icon: <Sparkles size={13} /> },
          { key: 'lumos',   label: '高阶学徒 · 荧光挖空', desc: '核心挖空', icon: <Lightbulb size={13} /> },
          { key: 'auror',   label: '傲罗特训 · 全句盲听', desc: '全句默写', icon: <Award size={13} /> },
          { key: 'dueling', label: '决斗俱乐部 · 限时生存', desc: '护盾血量', icon: <Shield size={13} /> },
        ].map((tier) => {
          const isActive = difficultyMode === tier.key;
          return (
            <button
              key={tier.key}
              onClick={() => handleDifficultyChange(tier.key)}
              className={`flex-1 min-w-[120px] py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 text-white shadow-sm'
                  : 'text-amber-950/80 hover:text-amber-950 hover:bg-white/60'
              }`}
            >
              {tier.icon}
              <span className="truncate">{tier.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── 3. Mode 4 Special: Dueling Club Survival Bar ───────────── */}
      {difficultyMode === 'dueling' && (
        <DuelingSurvivalBar
          shields={shields}
          maxShields={3}
          timeRemaining={timeRemaining}
          maxTime={25}
          streakCount={streakCount}
        />
      )}

      {/* ── 4. Main Dictation Paper Card ───────────────────────────── */}
      <div className={`p-6 sm:p-8 rounded-3xl border-2 transition-all shadow-md ${
        isParchment 
          ? 'bg-[#ffffff] border-[#e8dcb9] text-[#2c221e]' 
          : 'bg-slate-900 border-slate-800 text-slate-100'
      }`}>
        
        {/* Audio Playback & Replay bar */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-inherit">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleReplayCurrent(false)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-xs hover:shadow active:scale-95 transition-all cursor-pointer"
              title="重新听本句原速朗读"
            >
              <RotateCcw size={14} />
              <span>原速重播 (1.0x)</span>
            </button>

            {onChangePlaybackRate && (
              <button
                onClick={() => handleReplayCurrent(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-300/80 bg-white/90 hover:bg-amber-50 text-amber-950 hover:border-amber-400 text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                title="以 0.8x 慢速重播本句，辨析生词发音细节"
              >
                <Sparkles size={13} className="text-amber-600" />
                <span>慢速精听 (0.8x)</span>
              </button>
            )}

            <button
              onClick={() => onPlayPause && onPlayPause()}
              className="p-2 rounded-xl border border-amber-200/80 bg-white/90 hover:bg-amber-50 text-amber-950 hover:border-amber-400 transition-all active:scale-95 shadow-xs cursor-pointer"
              title="播放 / 暂停"
            >
              {isPlaying ? <Pause size={15} /> : <Play size={15} />}
            </button>
          </div>

          <span className="text-xs font-mono font-bold text-slate-400">
            {difficultyMode === 'accio' && '飞来字块拼装'}
            {difficultyMode === 'lumos' && '核心词汇挖空'}
            {difficultyMode === 'auror' && '全句盲听默写'}
            {difficultyMode === 'dueling' && '限时生存试炼'}
          </span>
        </div>

        {/* ── Sub-Mode Interactive Components ─────────────────────── */}
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

        {/* Action Controls & Navigation */}
        <div className="mt-6 pt-4 border-t border-inherit flex flex-wrap items-center justify-between gap-3">
          {/* Left aids (Quill hint for Auror/Dueling mode) */}
          <div className="flex items-center space-x-2">
            {(difficultyMode === 'auror' || difficultyMode === 'dueling') && (
              <button
                onClick={handleQuillHint}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-amber-400 bg-amber-50/80 hover:bg-amber-100/90 text-amber-950 hover:border-amber-500 text-xs font-bold transition-all active:scale-95 shadow-xs cursor-pointer"
                title="羽毛笔魔法提示：自动补齐下一个单词 (快捷键: Tab)"
              >
                <Sparkles size={14} className="text-amber-600" />
                <span>羽毛笔提示 (Tab)</span>
              </button>
            )}

            {(difficultyMode === 'auror' || difficultyMode === 'dueling') && (
              <button
                onClick={() => setUserInput('')}
                className="px-3.5 py-2 rounded-xl border border-amber-200/80 bg-white/80 hover:bg-rose-50 text-xs text-slate-500 hover:text-rose-600 hover:border-rose-300 transition-all active:scale-95 cursor-pointer shadow-2xs"
              >
                清空重来
              </button>
            )}
          </div>

          {/* Right Navigation */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onPrevCue}
              disabled={activeCueIndex <= 0}
              className="duo-btn-secondary min-h-[42px] px-4 py-2 rounded-xl text-xs disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 font-bold shadow-xs cursor-pointer"
            >
              <SkipBack size={14} />
              <span>上一句</span>
            </button>

            <button
              onClick={handleNext}
              className="duo-btn-primary min-h-[42px] flex items-center gap-1.5 px-6 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md cursor-pointer"
            >
              <span>{activeCueIndex >= cues.length - 1 ? '完成试炼并结算' : '下一句 (Enter)'}</span>
              <SkipForward size={14} />
            </button>
          </div>
        </div>

      </div>

      {/* ── Duolingo Bottom Feedback Sheet ────────────────────────── */}
      {feedbackState && (
        <div 
          className={`fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-5 border-t-2 shadow-2xl transition-all transform animate-fadeIn ${
            feedbackState.isCorrect 
              ? 'bg-[#d7f0db] border-emerald-500 text-emerald-950' 
              : 'bg-[#fed7d7] border-rose-400 text-rose-950'
          }`}
        >
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 text-left w-full sm:w-auto">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                feedbackState.isCorrect ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
              }`}>
                {feedbackState.isCorrect ? (
                  <CheckCircle2 size={28} className="stroke-[2.5]" />
                ) : (
                  <RotateCcw size={26} />
                )}
              </div>
              <div>
                <h4 className="font-magical font-bold text-lg sm:text-xl leading-tight">
                  {feedbackState.isCorrect ? '太棒了！施法完全正确！' : '咒文存在微小偏差'}
                </h4>
                <p className="text-xs sm:text-sm font-reading mt-0.5 opacity-90">
                  {feedbackState.isCorrect ? (
                    feedbackState.streak >= 2 
                      ? `连对第 ${feedbackState.streak} 句！魔法能量正在激增！` 
                      : '精准拼写出整句咒语，获得满星魔力！'
                  ) : (
                    `标准咒语：${feedbackState.sentence || currentCue.text}`
                  )}
                </p>
              </div>
            </div>

            <button
              onClick={handleFeedbackContinue}
              className={`w-full sm:w-auto min-h-[48px] px-8 py-3 rounded-2xl text-sm sm:text-base font-bold shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 ${
                feedbackState.isCorrect ? 'duo-btn-success' : 'duo-btn-danger'
              }`}
            >
              <span>{activeCueIndex >= cues.length - 1 ? '完成试炼并结算 (Enter)' : '继续下一句 (Enter)'}</span>
              <SkipForward size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── 5. Chapter Quest Summary Report Card Modal ─────────────── */}
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
          // Restart first cue
          if (onSeekToCue && cues[0]) onSeekToCue(cues[0]);
        }}
        onSaveErrorWordsToVocab={handleSaveErrorsToVocab}
        isParchment={isParchment}
      />

    </div>
  );
}

export default DictationStudio;
