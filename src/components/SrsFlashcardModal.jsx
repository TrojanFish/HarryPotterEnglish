import React, { useState, useEffect } from 'react';
import { 
  X, 
  RotateCcw, 
  Volume2, 
  Check, 
  Sparkles, 
  BookOpen, 
  Trophy, 
  Award,
  ChevronRight,
  Flame,
  BrainCircuit
} from 'lucide-react';
import { formatSyllables, getPhonicsTip } from '../utils/phonicsHelper';
import { processReviewResult, getDueWords } from '../utils/srsEngine';
import { playCorrectChime, playMistakeThud, playVictoryFanfare } from '../utils/spellAudioSynthesizer';

/**
 * SrsFlashcardModal — Duolingo-style Flashcard Spaced Repetition (艾宾浩斯翻转闪卡)
 * Features:
 * - Card 3D Flip (Front: Word, Phonetics, Syllables, Audio; Back: Chinese definition, context quote, lore)
 * - 2-button judgment: [还需重炼 (Forgot)] vs [已牢固掌握 (Remembered)]
 * - Progress bar and instant audio feedback
 * - Settlement celebration upon finishing daily due words
 * - Zero emojis, pure parchment daylight palette
 */
export function SrsFlashcardModal({
  isOpen,
  onClose,
  vocabList = [],
  onUpdateVocabList,
  isParchment = true
}) {
  const [dueWords, setDueWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [sessionStats, setSessionStats] = useState({ remembered: 0, forgotten: 0 });
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const due = getDueWords(vocabList);
      setDueWords(due);
      setCurrentIndex(0);
      setIsFlipped(false);
      setIsFinished(false);
      setSessionStats({ remembered: 0, forgotten: 0 });
    }
  }, [isOpen, vocabList]);

  if (!isOpen) return null;

  const currentWord = dueWords[currentIndex];

  // Speech pronunciation audio
  const handlePlayAudio = () => {
    if (!currentWord) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentWord.word);
      utterance.lang = 'en-GB';
      utterance.rate = 0.85;
      setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  // User judgment
  const handleAnswer = (isRemembered) => {
    if (!currentWord) return;

    if (isRemembered) {
      playCorrectChime();
      setSessionStats(prev => ({ ...prev, remembered: prev.remembered + 1 }));
    } else {
      playMistakeThud();
      setSessionStats(prev => ({ ...prev, forgotten: prev.forgotten + 1 }));
    }

    // Update SRS schedule in vocabList
    const updatedList = processReviewResult(currentWord.id || currentWord.word, isRemembered, vocabList);
    if (onUpdateVocabList) {
      onUpdateVocabList(updatedList);
    }

    // Advance to next word
    if (currentIndex < dueWords.length - 1) {
      setIsFlipped(false);
      setCurrentIndex(prev => prev + 1);
    } else {
      playVictoryFanfare();
      setIsFinished(true);
    }
  };

  const phonics = currentWord ? getPhonicsTip(currentWord.word, currentWord.phonetic) : null;
  const progressPercent = dueWords.length > 0 ? Math.round(((currentIndex + (isFinished ? 1 : 0)) / dueWords.length) * 100) : 100;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in select-none"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-lg rounded-3xl border-2 shadow-2xl p-6 sm:p-7 flex flex-col justify-between min-h-[480px] transition-all ${
          isParchment 
            ? 'bg-[#fcf9f2] border-[#e2d2b4] text-[#2c221e]' 
            : 'bg-slate-900 border-slate-700 text-slate-100'
        }`}
      >
        {/* Top Header & Progress */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-200/80 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-800 border border-amber-400/40 shadow-xs">
              <BrainCircuit size={18} className="text-amber-700" />
            </div>
            <div>
              <h3 className="font-magical font-bold text-base text-amber-950">
                艾宾浩斯魔法闪卡复习
              </h3>
              <p className="text-[11px] text-slate-500 font-reading">
                {dueWords.length === 0 ? '暂无待复习生词' : `今日待复习: 第 ${currentIndex + 1} / ${dueWords.length} 词`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-amber-950 hover:bg-amber-100/70 border border-transparent hover:border-amber-300 transition-all active:scale-90 cursor-pointer"
            title="关闭复习"
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress Bar Line */}
        <div className="w-full h-2 rounded-full bg-amber-200/60 overflow-hidden mb-5">
          <div 
            className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* ── Main Content Area ─────────────────────────────────────── */}
        {dueWords.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-700">
              <Check size={32} />
            </div>
            <h4 className="font-magical font-bold text-xl text-amber-950">
              今日魔法词汇全部复习完毕！
            </h4>
            <p className="text-xs text-slate-600 font-reading max-w-xs leading-relaxed">
              暂无已到期的待复习生词。艾宾浩斯记忆曲线将在下个记忆衰减节点（明天）自动为你提醒。
            </p>
            <button
              onClick={onClose}
              className="mt-3 px-6 py-2 rounded-xl bg-amber-500 text-white font-bold text-xs shadow-xs hover:bg-amber-600 active:scale-95 cursor-pointer"
            >
              完成返回
            </button>
          </div>
        ) : isFinished ? (
          /* Settlement Screen */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-lg">
              <Trophy size={32} />
            </div>
            <h4 className="font-magical font-bold text-2xl text-amber-950">
              太棒了！今日闪卡复习圆满达成
            </h4>
            <p className="text-xs text-slate-600 font-reading leading-relaxed">
              本次巩固了 {dueWords.length} 个魔法单词，艾宾浩斯算法已为你重新调整下次复习周期。
            </p>

            <div className="grid grid-cols-2 gap-3 w-full max-w-xs my-2">
              <div className="p-3 rounded-2xl border border-emerald-200 bg-emerald-50 text-center">
                <span className="text-xs text-emerald-800 font-bold block">牢固掌握</span>
                <span className="font-magical font-bold text-xl text-emerald-900">{sessionStats.remembered} 词</span>
              </div>
              <div className="p-3 rounded-2xl border border-rose-200 bg-rose-50 text-center">
                <span className="text-xs text-rose-800 font-bold block">需再重炼</span>
                <span className="font-magical font-bold text-xl text-rose-900">{sessionStats.forgotten} 词</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="px-7 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 text-white font-bold text-xs shadow-md active:scale-95 cursor-pointer hover:shadow-lg transition-all"
            >
              收入魔法行囊并返回
            </button>
          </div>
        ) : (
          /* Flashcard Container with Flip Animation */
          <div 
            onClick={() => setIsFlipped(!isFlipped)}
            className="flex-1 flex flex-col justify-between p-6 sm:p-7 rounded-2xl border-2 border-amber-300/80 bg-white/95 shadow-md cursor-pointer hover:border-amber-400 transition-all relative group"
            title="点击卡片翻转查看释义"
          >
            {/* Front of Card (English Word & Phonics) */}
            {!isFlipped ? (
              <div className="space-y-4 my-auto text-center animate-fadeIn">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-mono font-bold border border-amber-200">
                  <span>记忆等级: Box {currentWord.srsLevel || 1} / 5</span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-bold font-magical text-amber-950 tracking-wide">
                  {currentWord.word}
                </h2>

                <div className="flex items-center justify-center flex-wrap gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-900 font-mono font-bold">
                    {formatSyllables(currentWord.word)}
                  </span>
                  {currentWord.phonetic && (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200/80 text-slate-600 font-mono">
                      {currentWord.phonetic}
                    </span>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayAudio();
                    }}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer ${
                      isPlayingAudio
                        ? 'bg-amber-500 text-white border-amber-500 scale-105'
                        : 'border-amber-300 bg-amber-50/80 text-amber-950 hover:bg-amber-100'
                    }`}
                  >
                    <Volume2 size={15} />
                    <span>{isPlayingAudio ? '朗读中...' : '点击试听纯正英音'}</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 font-reading italic pt-3">
                  (点击卡片任意区域，翻转查看中文释义与原著例句)
                </p>
              </div>
            ) : (
              /* Back of Card (Chinese Translation, Context & Lore) */
              <div className="space-y-4 my-auto animate-fadeIn text-left">
                <div className="border-b border-amber-200/80 pb-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                    {currentWord.word} · 详细解析
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {currentWord.pos || '单词'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/60">
                  <span className="text-xs font-bold text-amber-800 block mb-0.5">中文释义：</span>
                  <p className="font-bold text-lg font-reading text-amber-950 leading-snug">
                    {currentWord.translation || currentWord.definition || '暂无释义'}
                  </p>
                </div>

                {currentWord.context && (
                  <div className="p-3 rounded-xl border border-dashed border-amber-300 bg-white text-xs font-reading text-slate-700 leading-relaxed">
                    <span className="text-amber-800 font-bold block mb-0.5">原著语境例句：</span>
                    "{currentWord.context}"
                  </div>
                )}

                {phonics && (
                  <div className="p-2.5 rounded-xl border border-emerald-300 bg-emerald-50/60 text-xs text-emerald-950">
                    <span className="font-bold text-emerald-900">自然拼读助记：</span>
                    <span>{phonics.tip}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Bottom Action Buttons ─────────────────────────────────── */}
        {!isFinished && dueWords.length > 0 && (
          <div className="pt-4 border-t border-amber-200/80 grid grid-cols-2 gap-3 mt-4">
            <button
              onClick={() => handleAnswer(false)}
              className="py-3 px-4 rounded-2xl border-2 border-rose-300 bg-rose-50/80 hover:bg-rose-100 text-rose-900 font-bold text-xs sm:text-sm shadow-xs active:scale-95 cursor-pointer transition-all flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={15} />
              <span>还需重炼 (没记住)</span>
            </button>

            <button
              onClick={() => handleAnswer(true)}
              className="py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg active:scale-95 cursor-pointer transition-all flex items-center justify-center gap-1.5"
            >
              <Check size={16} />
              <span>已牢固掌握 (进阶)</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default SrsFlashcardModal;
