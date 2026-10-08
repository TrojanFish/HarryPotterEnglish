import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Volume2,
  Bookmark,
  Sparkles,
  Check,
  ExternalLink,
  BookOpen,
  Lightbulb,
  GraduationCap,
  ChevronRight
} from 'lucide-react';
import { formatSyllables, getPhonicsTip } from '../utils/phonicsHelper';

export function WordModal({
  wordData,
  currentSentence,
  onClose,
  onSaveToVocab,
  isSaved,
  isParchment
}) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeTab, setActiveTab] = useState(() => (wordData?.lore ? 'lore' : 'meaning'));

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Reset tab when word changes (default to lore tab if the word possesses wizarding lore)
  useEffect(() => {
    setActiveTab(wordData?.lore ? 'lore' : 'meaning');
  }, [wordData?.word, wordData?.lore]);

  // Clean up any ongoing TTS speech on modal unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!wordData) return null;

  const phonicsInfo = getPhonicsTip(wordData.word, wordData.phonetic);
  const hasLore = Boolean(wordData.lore);
  const hasPhonics = Boolean(phonicsInfo?.tip);

  const playPronunciation = () => {
    if (wordData.audioUrl) {
      const audio = new Audio(wordData.audioUrl);
      setIsPlayingAudio(true);
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => setIsPlayingAudio(false);
      audio.play().catch(() => setIsPlayingAudio(false));
    } else if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(wordData.word);
      utt.lang = 'en-GB';
      utt.rate = 0.85;
      setIsPlayingAudio(true);
      utt.onend = () => setIsPlayingAudio(false);
      utt.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utt);
    }
  };

  const tabs = [
    { id: 'meaning', label: '释义' },
    ...(hasPhonics ? [{ id: 'phonics', label: '语音' }] : []),
    ...(hasLore   ? [{ id: 'lore',    label: '魔法' }] : []),
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border-t sm:border border-[#e8ddd0] bg-white text-[#1e1610] max-h-[88dvh] sm:max-h-[85dvh] overflow-y-auto pb-safe flex flex-col no-scrollbar"
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden w-10 h-1.5 bg-stone-300 rounded-full mx-auto my-2.5 shrink-0" />

        {/* Header: word + phonetic + play + close */}
        <div className="px-5 sm:px-6 pt-4 sm:pt-5 pb-3 border-b border-[#e8ddd0] shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="font-bold text-2xl sm:text-3xl text-amber-950 leading-tight break-words">
                  {wordData.word}
                </h2>
                <button
                  onClick={playPronunciation}
                  className={`w-11 h-11 rounded-full border flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                    isPlayingAudio
                      ? 'bg-amber-500 text-white border-amber-600'
                      : 'border-[#e8ddd0] bg-white text-stone-500 hover:text-amber-900 hover:border-amber-300'
                  }`}
                  title="朗读发音 (英音)"
                >
                  <Volume2 size={16} className={isPlayingAudio ? 'animate-pulse' : ''} />
                </button>
              </div>
              {wordData.phonetic && (
                <p className="text-stone-500 font-mono text-base mt-0.5">/{wordData.phonetic}/</p>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl border border-[#e8ddd0] bg-white hover:bg-stone-50 text-stone-500 hover:text-amber-950 flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0"
              title="关闭 (ESC)"
              aria-label="关闭"
            >
              <X size={18} />
            </button>
          </div>

          {/* Part of speech badge */}
          {wordData.pos && (
            <span className="inline-block mt-2 text-[11px] px-2 py-0.5 rounded bg-stone-100 text-stone-600 font-bold">
              {wordData.pos}
            </span>
          )}
        </div>

        {/* Tab Bar */}
        {tabs.length > 1 && (
          <div className="flex border-b border-[#e8ddd0] shrink-0 px-5 sm:px-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-selected={activeTab === tab.id}
                className={`px-3 py-2.5 text-xs font-bold transition-all cursor-pointer relative touch-manipulation active:scale-[0.98] ${
                  activeTab === tab.id
                    ? 'text-amber-900'
                    : 'text-stone-400 hover:text-stone-700'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4">
          {/* Meaning tab */}
          {activeTab === 'meaning' && (
            <div className="space-y-4">
              {/* Translation */}
              <div>
                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">中文释义</p>
                <p className="text-lg font-bold text-amber-950 leading-snug">{wordData.translation}</p>
                {wordData.definition && (
                  <p className="text-sm text-stone-600 mt-1 leading-relaxed">{wordData.definition}</p>
                )}
              </div>

              {/* Context sentence */}
              {currentSentence && (
                <div className="bg-[#f7f3ed] rounded-2xl p-3.5 border border-[#e8ddd0]">
                  <p className="text-[11px] font-bold text-stone-400 mb-1.5">原著例句</p>
                  <p className="text-sm font-reading text-stone-700 leading-relaxed">
                    {currentSentence.text?.split(new RegExp(`(${wordData.word})`, 'gi')).map((part, i) =>
                      part.toLowerCase() === wordData.word.toLowerCase()
                        ? <mark key={i} className="bg-amber-200 text-amber-950 font-bold rounded px-0.5">{part}</mark>
                        : part
                    )}
                  </p>
                  {currentSentence.translation && (
                    <p className="text-xs text-stone-500 mt-1.5 font-reading">{currentSentence.translation}</p>
                  )}
                </div>
              )}

              {/* External links */}
              <div className="flex gap-2">
                <a
                  href={`https://dictionary.cambridge.org/zhs/%E8%AF%8D%E5%85%B8/%E8%8B%B1%E8%AF%AD-%E6%B1%89%E8%AF%AD-%u7B80%u4F53/${encodeURIComponent(wordData.word)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg border border-[#e8ddd0] text-stone-600 hover:text-amber-900 hover:border-amber-300 transition-colors font-bold"
                >
                  <ExternalLink size={11} />
                  剑桥词典
                </a>
                <a
                  href={`https://www.youdao.com/result?word=${encodeURIComponent(wordData.word)}&lang=en`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg border border-[#e8ddd0] text-stone-600 hover:text-amber-900 hover:border-amber-300 transition-colors font-bold"
                >
                  <ExternalLink size={11} />
                  有道词典
                </a>
              </div>
            </div>
          )}

          {/* Phonics tab */}
          {activeTab === 'phonics' && phonicsInfo && (
            <div className="space-y-3">
              <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb size={15} className="text-amber-600" />
                  <p className="text-xs font-bold text-amber-800">自然拼读口诀</p>
                </div>
                <p className="text-sm font-reading text-amber-950 leading-relaxed">{phonicsInfo.tip}</p>
              </div>
              {phonicsInfo.syllables && (
                <div>
                  <p className="text-xs font-bold text-stone-400 mb-1">音节拆解</p>
                  <p className="text-xl font-mono text-amber-900 tracking-widest">{phonicsInfo.syllables}</p>
                </div>
              )}
            </div>
          )}

          {/* Lore tab */}
          {activeTab === 'lore' && wordData.lore && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} className="text-amber-600" />
                <p className="text-xs font-bold text-amber-800">霍格沃茨魔法档案</p>
              </div>
              <p className="text-sm font-reading text-stone-700 leading-relaxed">{wordData.lore}</p>
              {wordData.example && (
                <div className="mt-3 bg-[#f7f3ed] rounded-xl p-3 border border-[#e8ddd0]">
                  <p className="text-[11px] font-bold text-stone-400 mb-1">经典台词</p>
                  <p className="text-sm italic font-reading text-stone-700">{wordData.example}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer: Save button */}
        <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-3 border-t border-[#e8ddd0] shrink-0">
          <button
            onClick={() => onSaveToVocab && onSaveToVocab(wordData, currentSentence)}
            className={`w-full min-h-[48px] rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer border ${
              isSaved
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'duo-btn-primary'
            }`}
          >
            {isSaved
              ? (<><Check size={16} className="text-emerald-600" /><span>已收录到生词本</span></>)
              : (<><Bookmark size={15} /><span>收录到生词本</span></>)
            }
          </button>
        </div>
      </div>
    </div>
  );
}

export default WordModal;
