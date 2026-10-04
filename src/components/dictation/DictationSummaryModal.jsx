import React, { useState } from 'react';
import { 
  Trophy, 
  Star, 
  Award, 
  Sparkles, 
  RotateCcw, 
  BookmarkPlus, 
  CheckCircle2, 
  Flame, 
  ChevronRight,
  Shield,
  BookOpen
} from 'lucide-react';
import { HOGWARTS_HOUSES, calculateHousePoints } from '../../utils/dictationEngine';

/**
 * DictationSummaryModal — Hogwarts Quest Parchment Report Card (羊皮纸魔法成绩单)
 * Settlement screen shown after finishing a chapter's dictation quest:
 * - Star rating calculation (0 - 3 stars per sentence)
 * - House cup contribution points awarded to chosen house
 * - Wizard Rank title based on accuracy
 * - Potion Crucible (错词魔药重炼): view typos, 1-click add to vocabulary
 * - Zero emojis, pure parchment daylight palette
 */
export function DictationSummaryModal({
  isOpen,
  onClose,
  stats = { completedCount: 0, totalWords: 0, correctWords: 0 },
  totalStars = 0,
  maxStars = 0,
  accuracy = 0,
  mode = 'accio',
  errorWords = [],
  chapterTitle = '',
  onRetryErrors,
  onSaveErrorWordsToVocab,
  isParchment = true
}) {
  if (!isOpen) return null;

  // Selected Hogwarts house (persisted in localStorage)
  const [selectedHouseId, setSelectedHouseId] = useState(() => {
    try {
      return localStorage.getItem('hp_wizard_house') || 'gryffindor';
    } catch {
      return 'gryffindor';
    }
  });
  const [hasSavedVocab, setHasSavedVocab] = useState(false);

  const selectedHouse = HOGWARTS_HOUSES.find(h => h.id === selectedHouseId) || HOGWARTS_HOUSES[0];
  const housePoints = calculateHousePoints(mode, accuracy);

  const handleHouseChange = (houseId) => {
    setSelectedHouseId(houseId);
    try {
      localStorage.setItem('hp_wizard_house', houseId);
    } catch {}
  };

  // Determine honorific title
  const getRankTitle = () => {
    if (accuracy >= 95) return { title: '大魔法师 · 傲罗精英', desc: '字句纯熟，咒法浑然天成，堪比资深傲罗！', badgeColor: 'bg-amber-600 text-white' };
    if (accuracy >= 80) return { title: '杰出巫师 · 优等生', desc: '听力辨音敏锐，拼写功底扎实，表现优异！', badgeColor: 'bg-emerald-600 text-white' };
    if (accuracy >= 60) return { title: '进阶学徒 · 勤奋巫师', desc: '已初步掌握魔咒拼读规律，持之以恒定成大器！', badgeColor: 'bg-blue-700 text-white' };
    return { title: '初级学徒 · 魔法启蒙', desc: '温故而知新，多听慢速磨耳朵，再接再厉！', badgeColor: 'bg-amber-800 text-amber-100' };
  };

  const rank = getRankTitle();

  const handleSaveVocab = () => {
    if (onSaveErrorWordsToVocab && errorWords.length > 0) {
      onSaveErrorWordsToVocab(errorWords);
      setHasSavedVocab(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl max-h-[88dvh] sm:max-h-[85dvh] flex flex-col rounded-t-3xl sm:rounded-3xl border-t-2 sm:border-2 border-[#e8ddd0] bg-[#fbf9f5] text-[#1e1610] overflow-hidden transition-all pb-safe no-scrollbar"
      >
        {/* Mobile Pull Handle Indicator */}
        <div className="sm:hidden w-10 h-1.5 bg-stone-300 rounded-full mx-auto my-2.5 shrink-0" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-[#e8ddd0] bg-white text-center shrink-0">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white border-2 border-amber-500">
            <Trophy size={28} />
          </div>
          <h2 className="font-magical font-bold text-2xl text-amber-950">
            霍格沃茨学业试炼成绩单
          </h2>
          <p className="text-xs text-slate-500 font-reading italic mt-1">
            {chapterTitle || '魔法拼写大闯关'} · 试炼结算
          </p>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* 1. Honorific Rank Banner */}
          <div className="p-4 rounded-2xl border-2 border-[#e8ddd0] bg-white text-center">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 ${rank.badgeColor}`}>
              {rank.title}
            </span>
            <p className="text-xs text-slate-600 font-reading">
              {rank.desc}
            </p>
          </div>

          {/* 2. Key Metrics Grid */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3.5 rounded-2xl border-2 border-[#e8ddd0] bg-white">
              <div className="flex items-center justify-center gap-1 text-amber-600 mb-1">
                <Star size={16} className="fill-amber-500 text-amber-500" />
              </div>
              <div className="font-sans font-extrabold text-xl text-amber-950 font-mono">
                {totalStars} <span className="text-xs text-slate-400 font-normal">/ {maxStars}</span>
              </div>
              <div className="text-[11px] text-slate-500 font-bold mt-0.5">魔法星斩获</div>
            </div>

            <div className="p-3.5 rounded-2xl border-2 border-[#e8ddd0] bg-white">
              <div className="flex items-center justify-center gap-1 text-emerald-600 mb-1">
                <CheckCircle2 size={16} />
              </div>
              <div className="font-sans font-extrabold text-xl text-emerald-800 font-mono">
                {accuracy}%
              </div>
              <div className="text-[11px] text-slate-500 font-bold mt-0.5">全句准确率</div>
            </div>

            <div className="p-3.5 rounded-2xl border-2 border-[#e8ddd0] bg-white">
              <div className="flex items-center justify-center gap-1 text-amber-600 mb-1">
                <Award size={16} />
              </div>
              <div className="font-sans font-extrabold text-xl text-amber-950 font-mono">
                +{housePoints}
              </div>
              <div className="text-[11px] text-slate-500 font-bold mt-0.5">学院贡献分</div>
            </div>
          </div>

          {/* 3. House Affiliation Selector */}
          <div className="p-4 rounded-2xl border-2 border-[#e8ddd0] bg-white">
            <div className="text-xs font-bold text-amber-900 mb-2 flex items-center justify-between">
              <span>代表学院积分入账：</span>
              <span className="text-[11px] text-amber-700 font-semibold">{selectedHouse.name} (+{housePoints} 分)</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {HOGWARTS_HOUSES.map((house) => {
                const isSelected = house.id === selectedHouseId;
                return (
                  <button
                    key={house.id}
                    onClick={() => handleHouseChange(house.id)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center border-2 cursor-pointer ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500 text-white'
                        : 'border-[#e8ddd0] bg-[#fbf9f5] text-[#1e1610] hover:bg-stone-100'
                    }`}
                  >
                    {house.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Potion Crucible (错词魔药重炼) */}
          {errorWords.length > 0 ? (
            <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/40">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-rose-900 flex items-center gap-1">
                  <Sparkles size={13} className="text-rose-600" />
                  <span>错词魔药重炼炉 (共 {errorWords.length} 个拼写难词):</span>
                </span>
                {!hasSavedVocab && onSaveErrorWordsToVocab && (
                  <button
                    onClick={handleSaveVocab}
                    className="flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:text-amber-950 px-2 py-0.5 rounded-lg border border-amber-300 bg-white hover:bg-amber-50 cursor-pointer"
                  >
                    <BookmarkPlus size={12} />
                    <span>一键存入生词本</span>
                  </button>
                )}
                {hasSavedVocab && (
                  <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    <span>已加入生词本</span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {errorWords.map((word, i) => (
                  <span 
                    key={i}
                    className="px-2.5 py-1 rounded-lg border border-rose-200 bg-white text-rose-800 text-xs font-mono font-bold"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 text-center text-xs text-emerald-800 font-bold flex items-center justify-center gap-1.5">
              <CheckCircle2 size={15} />
              <span>完美施法！本章无任何拼写错词，魔药已纯净凝练！</span>
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#e8ddd0] bg-white flex items-center justify-between gap-3 shrink-0">
          {errorWords.length > 0 && onRetryErrors ? (
            <button
              onClick={onRetryErrors}
              className="duo-btn-secondary min-h-[48px] flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold cursor-pointer"
            >
              <RotateCcw size={15} />
              <span>重炼错词</span>
            </button>
          ) : <div />}

          <button
            onClick={onClose}
            className="duo-btn-primary min-h-[48px] flex items-center gap-2 px-6 sm:px-8 py-2.5 rounded-2xl text-xs sm:text-sm font-bold cursor-pointer ml-auto"
          >
            <span>完成本章试炼</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default DictationSummaryModal;
