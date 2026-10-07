import React from 'react';
import { Shield, Check, X, Sparkles, Award } from 'lucide-react';
import { HOUSES } from '../../constants/hogwartsTheme.js';

export function HouseSelectorModal({
  isOpen,
  currentHouse = 'gryffindor',
  onClose,
  onSelectHouse
}) {
  if (!isOpen) return null;

  const houseList = Object.values(HOUSES);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn select-none">
      <div 
        className="relative w-full max-w-2xl rounded-t-3xl sm:rounded-2xl border-t sm:border border-[#e8ddd0] bg-[#fbf9f5] text-[#1e1610] p-5 sm:p-7 max-h-[90dvh] overflow-y-auto pb-safe transition-all"
        role="dialog"
        aria-label="霍格沃茨四大学院分院仪式"
      >
        {/* Mobile Pull Handle Indicator */}
        <div className="sm:hidden w-10 h-1.5 bg-stone-300 rounded-full mx-auto my-2.5 shrink-0" />

        {/* Header Bar */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#e8ddd0]">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-700 border border-amber-300/80">
              <Shield size={20} className="text-amber-700" />
            </div>
            <div>
              <h3 className="font-magical font-bold text-lg sm:text-xl text-amber-950 flex items-center gap-2">
                <span>霍格沃茨分院典礼</span>
                <span className="text-[11px] font-sans px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 font-bold">
                  The Sorting
                </span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                选择你的学业归属学院，专属学院色与纹章将点亮界面，每日精听亦为学院争光
              </p>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl border border-[#e8ddd0] bg-white hover:bg-stone-50 flex items-center justify-center text-stone-500 hover:text-amber-950 transition-all active:scale-95 cursor-pointer shrink-0"
              title="关闭"
              aria-label="关闭"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Four Houses Selection Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 my-2">
          {houseList.map((house) => {
            const isSelected = currentHouse === house.id;
            return (
              <button
                key={house.id}
                type="button"
                onClick={() => {
                  if (onSelectHouse) onSelectHouse(house.id);
                }}
                className={`group relative p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer touch-manipulation active:scale-[0.98] ${
                  isSelected
                    ? 'bg-white shadow-md ring-2 ring-offset-1'
                    : 'bg-[#fffdf8] hover:bg-white hover:border-amber-300'
                }`}
                style={{
                  borderColor: isSelected ? house.primaryColor : '#e8ddd0',
                  ringColor: isSelected ? house.primaryColor : 'transparent'
                }}
              >
                {/* Active Check Badge */}
                {isSelected && (
                  <div 
                    className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-white shadow-sm"
                    style={{ backgroundColor: house.primaryColor }}
                  >
                    <Check size={14} className="stroke-[3]" />
                  </div>
                )}

                {/* House Title and Animal */}
                <div className="flex items-center gap-2 mb-1.5">
                  <span 
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-inner"
                    style={{ backgroundColor: house.primaryColor }}
                  />
                  <h4 className="font-magical font-bold text-base text-amber-950">
                    {house.nameZh}
                  </h4>
                  <span className="text-xs font-mono text-stone-400">
                    ({house.nameEn})
                  </span>
                  <span 
                    className="ml-auto mr-7 text-[10px] font-bold px-2 py-0.5 rounded-md border"
                    style={{ 
                      backgroundColor: house.bgLight,
                      color: house.primaryColor,
                      borderColor: house.borderColor
                    }}
                  >
                    {house.animal}
                  </span>
                </div>

                {/* Traits & Founder */}
                <p className="text-xs text-stone-600 line-clamp-1 mb-1 font-medium">
                  特质：{house.trait}
                </p>

                {/* Motto */}
                <div 
                  className="mt-2 text-[11px] font-reading italic px-2.5 py-1.5 rounded-xl border"
                  style={{
                    backgroundColor: isSelected ? house.bgLight : '#faf6ee',
                    color: house.primaryColor,
                    borderColor: isSelected ? house.borderColor : '#f0e6d8'
                  }}
                >
                  “{house.mottoZh}”
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="mt-5 pt-3 border-t border-[#e8ddd0] flex items-center justify-between">
          <p className="text-[11px] text-stone-400 flex items-center gap-1">
            <Sparkles size={13} className="text-amber-500" />
            <span>可随时在巫师档案中重新进行学院分院</span>
          </p>

          <button
            type="button"
            onClick={onClose}
            className="duo-btn-primary min-h-[48px] px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold cursor-pointer active:scale-95 transition-all"
          >
            确认选定
          </button>
        </div>
      </div>
    </div>
  );
}

export default HouseSelectorModal;
