import React, { useState, useEffect } from 'react';
import { Sparkles, Undo2, Check, RotateCcw } from 'lucide-react';
import { generateAccioTiles, cleanWord } from '../../utils/dictationEngine';
import { playCorrectChime, playMistakeThud } from '../../utils/spellAudioSynthesizer';

/**
 * AccioWordPicker — Mode 1: 见习巫师 · 飞来字块拼句
 * Tap-to-build sentence mode for primary students and touchscreens:
 * - Sentence words scrambled + 2-3 distractor words
 * - Interactive word tile tray with clean tap/click interaction
 * - Instant feedback and audio chime
 * - Zero emojis, pure parchment daylight palette
 */
export function AccioWordPicker({
  sentenceText,
  isParchment = true,
  onComplete,
  onReset
}) {
  const [data, setData] = useState(() => generateAccioTiles(sentenceText));
  const [selectedTiles, setSelectedTiles] = useState([]);
  const [shakingTileId, setShakingTileId] = useState(null);

  useEffect(() => {
    setData(generateAccioTiles(sentenceText));
    setSelectedTiles([]);
  }, [sentenceText]);

  const targetWords = data.targetWords;
  const isAllSelected = selectedTiles.length === targetWords.length;

  // Verify correctness in real time
  const targetCleans = targetWords.map(cleanWord);
  const currentCleans = selectedTiles.map(t => t.clean);

  // Check if currently picked sequence matches target prefixes
  const isSequenceCorrectSoFar = currentCleans.every((c, idx) => c === targetCleans[idx]);
  const isSentenceFullyCorrect = isAllSelected && isSequenceCorrectSoFar;

  // Notify parent component when full sentence is correctly assembled
  useEffect(() => {
    if (isSentenceFullyCorrect && onComplete) {
      playCorrectChime();
      onComplete({
        totalWords: targetWords.length,
        correctWords: targetWords.length,
        accuracy: 100,
        isCompleted: true
      });
    }
  }, [isSentenceFullyCorrect]);

  // Handle tile click in pool (select word)
  const handleSelectTile = (tile) => {
    if (selectedTiles.some(t => t.id === tile.id)) return;

    const nextIndex = selectedTiles.length;
    const expectedClean = targetCleans[nextIndex];

    // Check if this tile is the correct next word
    if (tile.clean === expectedClean) {
      playCorrectChime();
      setSelectedTiles(prev => [...prev, tile]);
    } else {
      // Wrong tile chosen: give tactile error shake
      playMistakeThud();
      setShakingTileId(tile.id);
      setTimeout(() => setShakingTileId(null), 500);
    }
  };

  // Handle tile click in answer tray (undo word)
  const handleRemoveTile = (indexToRemove) => {
    // Remove clicked tile and all subsequent tiles to maintain order
    setSelectedTiles(prev => prev.slice(0, indexToRemove));
  };

  // Clear all selections
  const handleClear = () => {
    setSelectedTiles([]);
    if (onReset) onReset();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ── Active Word Answer Tray ──────────────────────────────── */}
      <div className={`min-h-[110px] p-5 sm:p-6 rounded-3xl border-2 transition-all flex flex-col justify-between ${
        isSentenceFullyCorrect
          ? 'bg-emerald-500/10 border-emerald-500'
          : 'bg-[#fbf9f5] border-[#eee5d8]'
      }`}>
        <div className="flex items-center justify-between mb-3 text-xs font-semibold text-amber-800">
          <span className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-600" />
            <span>飞来咒施法槽 (按语序点击下方字块拼接咒语)</span>
          </span>
          <span className="font-mono">
            已就位: {selectedTiles.length} / {targetWords.length} 词
          </span>
        </div>

        {/* Selected Word Chips in Tray */}
        <div className="flex flex-wrap items-center gap-2.5 min-h-[44px]">
          {selectedTiles.length === 0 ? (
            <span className="text-sm font-reading italic text-slate-400 select-none py-1">
              仔细聆听原版朗读，点击下方散落的魔法字块...
            </span>
          ) : (
            selectedTiles.map((tile, idx) => (
              <button
                key={tile.id}
                onClick={() => handleRemoveTile(idx)}
                className="px-3.5 py-1.5 min-h-[40px] rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm sm:text-base border-b-3 border-amber-700 active:translate-y-0.5 active:border-b-1 cursor-pointer transition-all flex items-center gap-1.5 group select-none"
                title="点击撤回此词"
              >
                <span>{tile.text}</span>
                <Undo2 size={12} className="opacity-70 group-hover:opacity-100 transition-opacity" />
              </button>
            ))
          )}
        </div>

        {/* Success Banner */}
        {isSentenceFullyCorrect && (
          <div className="mt-3 pt-2 border-t border-emerald-500/30 flex items-center justify-between text-xs text-emerald-800 font-bold animate-fadeIn">
            <span className="flex items-center gap-1">
              <Check size={14} className="text-emerald-600" />
              <span>施法成功！完整拼出本句咒文</span>
            </span>
            <span className="text-amber-700 font-mono">满星达成</span>
          </div>
        )}
      </div>

      {/* ── Scrambled Word Tiles Pool ─────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-bold text-slate-500">
            散落的魔法字块 (含混淆项):
          </span>
          {selectedTiles.length > 0 && !isSentenceFullyCorrect && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-amber-900 transition-colors cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>重新拼装</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {data.tiles.map((tile) => {
            const isUsed = selectedTiles.some(t => t.id === tile.id);
            const isShaking = shakingTileId === tile.id;

            return (
              <button
                key={tile.id}
                disabled={isUsed || isSentenceFullyCorrect}
                onClick={() => handleSelectTile(tile)}
                className={`px-4 py-2 min-h-[44px] rounded-xl text-sm sm:text-base font-bold transition-all select-none ${
                  isUsed
                    ? 'opacity-20 scale-95 border-b-2 border-dashed border-amber-200 bg-amber-50/40 text-slate-400 cursor-not-allowed'
                    : isShaking
                    ? 'border-2 border-b-4 border-rose-500 bg-rose-50 text-rose-700 animate-bounce'
                    : 'border-1.5 border-amber-300 border-b-4 border-b-amber-400/90 bg-white/95 text-amber-950 hover:bg-amber-50 hover:border-amber-400 hover:border-b-amber-500 active:translate-y-1 active:border-b-2 cursor-pointer'
                }`}
              >
                {tile.text}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default AccioWordPicker;
