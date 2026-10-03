import React, { useState, useEffect } from 'react';
import { 
  X, 
  Volume2, 
  Bookmark, 
  Sparkles, 
  Check, 
  ExternalLink,
  BookOpen,
  Lightbulb
} from 'lucide-react';
import { formatSyllables, getPhonicsTip } from '../utils/phonicsHelper';

/**
 * WordModal — Chinese Student Vocabulary Card
 * - Designed for Chinese elementary & middle school students:
 * - Pure Chinese definitions (中文释义)
 * - British pronunciation speech audio button
 * - Syllable breakdown and natural phonics rules
 * - Zero emoji symbols (uses clean Lucide icons)
 * - Links to Cambridge Chinese & Youdao dictionaries
 */
export function WordModal({
  wordData,
  currentSentence,
  onClose,
  onSaveToVocab,
  isSaved,
  isParchment
}) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!wordData) return null;

  const phonicsInfo = getPhonicsTip(wordData.word, wordData.phonetic);

  const playPronunciation = () => {
    if (wordData.audioUrl) {
      const audio = new Audio(wordData.audioUrl);
      setIsPlayingAudio(true);
      audio.play().catch(e => console.warn(e));
      audio.onended = () => setIsPlayingAudio(false);
    } else if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(wordData.word);
      utterance.lang = 'en-GB'; // British English for Harry Potter
      utterance.rate = 0.85; // Clear pace for students
      setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-lg rounded-3xl border-2 shadow-2xl p-6 sm:p-7 transition-all duration-300 ${
          isParchment 
            ? 'bg-[#ffffff] border-[#e8dcb9] text-[#2c221e]' 
            : 'bg-slate-900 border-slate-700 text-slate-100'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-amber-950 hover:bg-amber-100/70 border border-transparent hover:border-amber-300/80 transition-all active:scale-90 cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Word Header */}
        <div className="flex items-start justify-between pr-8 mb-4">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-2xl sm:text-3xl font-bold font-magical tracking-wide text-amber-950">
                {wordData.word}
              </h2>
              {wordData.isHpLore && (
                <span className="flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-red-800 text-amber-200 border border-amber-400/40 font-semibold shadow-xs">
                  <Sparkles size={11} />
                  <span>魔法专有名词</span>
                </span>
              )}
            </div>

            {/* Syllable Breakdown & Natural Phonics Tag for Students */}
            <div className="flex items-center flex-wrap gap-2 mt-1.5">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-amber-200/70 text-amber-950 border border-amber-300/90" title="音节拆分助记">
                音节: {formatSyllables(wordData.word)}
              </span>
              {phonicsInfo && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100/90 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                  <Sparkles size={11} className="text-emerald-700" />
                  <span>{phonicsInfo.rule}</span>
                </span>
              )}
            </div>

            {/* Phonetic & Pronunciation */}
            <div className="flex items-center space-x-3 mt-2.5">
              {wordData.phonetic && (
                <span className="font-mono text-sm px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-950 font-bold border border-amber-200/80">
                  {wordData.phonetic}
                </span>
              )}
              {wordData.pos && (
                <span className="text-xs px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-mono border border-amber-200/60">
                  {wordData.pos}
                </span>
              )}
              <button
                onClick={playPronunciation}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer ${
                  isPlayingAudio 
                    ? 'bg-amber-500 text-white border-amber-500 scale-105 shadow-md' 
                    : 'border-amber-400/80 bg-amber-50/80 hover:bg-amber-100 text-amber-950 hover:border-amber-500'
                }`}
                title="点击试听纯正英音朗读"
              >
                <Volume2 size={14} className={isPlayingAudio ? 'animate-bounce text-white' : 'text-amber-700'} />
                <span>{isPlayingAudio ? '朗读中...' : '纯正英音朗读'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Natural Phonics Guidance Box */}
        {phonicsInfo && (
          <div className="mb-3.5 p-3 rounded-2xl border border-emerald-300/80 bg-emerald-50/60 text-xs text-emerald-950 flex items-start gap-2 shadow-2xs">
            <Lightbulb size={15} className="text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-emerald-900">自然拼读点拨：</span>
              <span className="font-reading">{phonicsInfo.tip}</span>
            </div>
          </div>
        )}

        {/* Translation & Definitions (Pure Chinese for Chinese Students) */}
        <div className="space-y-3.5 my-4">
          <div className="p-4 rounded-2xl border border-amber-200/80 bg-amber-50/50">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-1 flex items-center gap-1.5">
              <BookOpen size={13} className="text-amber-700" />
              <span>中文释义</span>
            </h4>
            <p className="text-lg sm:text-xl font-reading font-bold text-amber-950 leading-snug">
              {wordData.translation}
            </p>
          </div>

          {/* Special Harry Potter Lore Box */}
          {wordData.lore && (
            <div className="p-4 rounded-2xl border border-amber-400/60 bg-gradient-to-br from-amber-500/10 via-red-500/5 to-transparent text-xs sm:text-sm">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold font-magical mb-1.5">
                <Sparkles size={14} className="text-amber-600" />
                <span>霍格沃茨原著背景与魔法百科：</span>
              </div>
              <p className="leading-relaxed text-amber-950 font-reading">
                {wordData.lore}
              </p>
            </div>
          )}

          {/* Context Sentence */}
          {currentSentence && (
            <div className="p-3.5 rounded-xl bg-white border border-amber-200/80 text-xs">
              <span className="text-slate-400 block mb-1">原书句子出处：</span>
              <p className="italic font-reading text-slate-700 leading-relaxed">
                "{currentSentence.text}"
              </p>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="mt-5 pt-3 border-t border-amber-200/80 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs">
            <a
              href={`https://dict.youdao.com/result?word=${encodeURIComponent(wordData.word.toLowerCase())}&lang=en`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-amber-200/70 bg-white/70 hover:bg-amber-50 text-slate-600 hover:text-amber-950 hover:border-amber-400 transition-all shadow-2xs"
            >
              <span>有道词典</span>
              <ExternalLink size={11} className="text-amber-700" />
            </a>
            <a
              href={`https://dictionary.cambridge.org/zhs/词典/英语-汉语-简体/${encodeURIComponent(wordData.word.toLowerCase())}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-amber-200/70 bg-white/70 hover:bg-amber-50 text-slate-600 hover:text-amber-950 hover:border-amber-400 transition-all shadow-2xs"
            >
              <span>剑桥双解</span>
              <ExternalLink size={11} className="text-amber-700" />
            </a>
          </div>

          <button
            onClick={() => onSaveToVocab(wordData, currentSentence)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-md active:scale-95 cursor-pointer ${
              isSaved
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25'
                : 'bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white hover:shadow-lg hover:shadow-amber-500/25'
            }`}
          >
            {isSaved ? (
              <>
                <Check size={16} />
                <span>已在生词本</span>
              </>
            ) : (
              <>
                <Bookmark size={16} />
                <span>收入魔法生词本</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
