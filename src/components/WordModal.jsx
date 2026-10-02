import React, { useState, useEffect } from 'react';
import { 
  X, 
  Volume2, 
  Bookmark, 
  Sparkles, 
  Check, 
  ExternalLink,
  BookOpen
} from 'lucide-react';

/**
 * WordModal — Chinese Student Vocabulary Card
 * - Designed for Chinese elementary & middle school students:
 * - Pure Chinese definitions (中文释义)
 * - British pronunciation speech audio button
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
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Word Header */}
        <div className="flex items-start justify-between pr-8 mb-4">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-2xl sm:text-3xl font-bold font-magical tracking-wide text-amber-800 dark:text-amber-300">
                {wordData.word}
              </h2>
              {wordData.isHpLore && (
                <span className="flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-red-700 text-amber-200 border border-amber-400/40 font-semibold shadow-sm">
                  <Sparkles size={11} />
                  <span>魔法专有名词</span>
                </span>
              )}
            </div>

            {/* Phonetic & Pronunciation */}
            <div className="flex items-center space-x-3 mt-2">
              {wordData.phonetic && (
                <span className="font-mono text-sm px-2.5 py-0.5 rounded-lg bg-amber-100/70 dark:bg-slate-800 text-amber-900 dark:text-amber-300 font-bold">
                  {wordData.phonetic}
                </span>
              )}
              {wordData.pos && (
                <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                  {wordData.pos}
                </span>
              )}
              <button
                onClick={playPronunciation}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold transition-all ${
                  isPlayingAudio 
                    ? 'bg-amber-500 text-white border-amber-500 scale-105 shadow-md' 
                    : 'border-amber-400/60 bg-amber-50 dark:bg-slate-800 text-amber-800 dark:text-amber-300 hover:bg-amber-100'
                }`}
                title="点击试听纯正英音朗读"
              >
                <Volume2 size={14} className={isPlayingAudio ? 'animate-bounce' : ''} />
                <span>{isPlayingAudio ? '朗读中...' : '纯正英音朗读'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Translation & Definitions (Pure Chinese for Chinese Students) */}
        <div className="space-y-3.5 my-4">
          <div className="p-4 rounded-2xl border border-amber-200/80 dark:border-slate-800 bg-amber-50/50 dark:bg-slate-800/50">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1.5">
              <BookOpen size={13} />
              <span>中文释义</span>
            </h4>
            <p className="text-lg sm:text-xl font-reading font-bold text-amber-950 dark:text-amber-200 leading-snug">
              {wordData.translation}
            </p>
          </div>

          {/* Special Harry Potter Lore Box */}
          {wordData.lore && (
            <div className="p-4 rounded-2xl border border-amber-400/60 bg-gradient-to-br from-amber-500/10 via-red-500/5 to-transparent text-xs sm:text-sm">
              <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-bold font-magical mb-1.5">
                <Sparkles size={14} className="text-amber-500" />
                <span>霍格沃茨原著背景与魔法百科：</span>
              </div>
              <p className="leading-relaxed text-amber-900/90 dark:text-amber-100/90 font-reading">
                {wordData.lore}
              </p>
            </div>
          )}

          {/* Context Sentence */}
          {currentSentence && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-gray-200 dark:border-slate-800 text-xs">
              <span className="text-slate-400 block mb-1">原书句子出处：</span>
              <p className="italic font-reading text-slate-700 dark:text-slate-300 leading-relaxed">
                "{currentSentence.text}"
              </p>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="mt-5 pt-3 border-t border-inherit flex items-center justify-between">
          <div className="flex items-center space-x-3 text-xs">
            <a
              href={`https://dict.youdao.com/result?word=${encodeURIComponent(wordData.word.toLowerCase())}&lang=en`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-slate-500 hover:text-amber-600 transition-colors"
            >
              <span>有道词典</span>
              <ExternalLink size={11} />
            </a>
            <a
              href={`https://dictionary.cambridge.org/zhs/词典/英语-汉语-简体/${encodeURIComponent(wordData.word.toLowerCase())}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-slate-500 hover:text-amber-600 transition-colors"
            >
              <span>剑桥双解</span>
              <ExternalLink size={11} />
            </a>
          </div>

          <button
            onClick={() => onSaveToVocab(wordData, currentSentence)}
            className={`flex items-center gap-1.5 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-md ${
              isSaved
                ? 'bg-emerald-700 text-white'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:scale-102 hover:shadow-amber-500/25'
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
