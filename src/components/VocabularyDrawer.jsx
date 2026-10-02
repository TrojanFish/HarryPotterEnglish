import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trash2, 
  Volume2, 
  Download, 
  Sparkles, 
  Search, 
  Layers, 
  RotateCw,
  CheckCircle,
  BookOpen
} from 'lucide-react';

import { generateAnkiTSV, downloadAnkiFile } from '../utils/ankiExport';

export function VocabularyDrawer({
  isOpen,
  onClose,
  vocabList,
  onRemoveWord,
  onClearAll,
  isParchment
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFlashcardMode, setIsFlashcardMode] = useState(false);
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredList = vocabList.filter(item => 
    item.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.translation && item.translation.includes(searchTerm))
  );

  const playPronunciation = (word) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-GB';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleExportAnki = () => {
    if (!vocabList || vocabList.length === 0) return;
    const content = generateAnkiTSV(vocabList, { deckName: 'Hogwarts Magic English' });
    downloadAnkiFile(content, `hogwarts_anki_${Date.now()}.tsv`);
  };

  const handleExportCSV = () => {
    if (vocabList.length === 0) return;
    const header = 'Word,Phonetic,Part of Speech,Translation,Context\n';
    const rows = vocabList.map(v => 
      `"${v.word}","${v.phonetic || ''}","${v.pos || ''}","${(v.translation || '').replace(/"/g, '""')}","${(v.context || '').replace(/"/g, '""')}"`
    ).join('\n');

    const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `hogwarts_vocab_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const currentFlashcard = filteredList[flashcardIndex];

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div 
          onClick={(e) => e.stopPropagation()}
          className={`w-screen max-w-md shadow-2xl flex flex-col border-l transition-colors duration-300 ${
          isParchment 
            ? 'bg-[#fbf6ea] border-[#dec9a5] text-[#2c221e]' 
            : 'bg-[#121824] border-[#253245] text-[#e2d9c8]'
        }`}>
          {/* Drawer Header */}
          <div className="px-5 py-4 border-b border-gray-700/40 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <div>
                <h2 className="font-magical font-bold text-lg text-[#cba358]">
                  魔法生词本 ({vocabList.length})
                </h2>
                <p className="text-xs text-[#8c9ba5]">精听原著词汇与例句笔记</p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setIsFlashcardMode(!isFlashcardMode)}
                className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
                  isFlashcardMode 
                    ? 'bg-[#cba358] text-[#0f141c] border-[#cba358] font-bold' 
                    : 'border-gray-600/50 text-[#cba358] hover:bg-[#cba358]/20'
                }`}
                title="切换卡片翻转记忆模式"
              >
                <Layers size={14} />
                <span className="text-[11px]">{isFlashcardMode ? '列表' : '卡片背词'}</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-700/30"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Flashcard Mode */}
          {isFlashcardMode ? (
            <div className="flex-1 p-6 flex flex-col justify-between items-center overflow-y-auto">
              {filteredList.length === 0 ? (
                <div className="text-center py-20 text-[#8c9ba5]">
                  <p>生词本还是空的，快去听力中点击单词收藏吧！</p>
                </div>
              ) : (
                <>
                  <div className="w-full flex justify-between items-center text-xs text-[#8c9ba5]">
                    <span>卡片进度: {flashcardIndex + 1} / {filteredList.length}</span>
                    <button 
                      onClick={() => setIsCardFlipped(!isCardFlipped)}
                      className="text-[#cba358] hover:underline flex items-center gap-1"
                    >
                      <RotateCw size={12} /> 点击卡片翻转
                    </button>
                  </div>

                  {/* Flashcard Body */}
                  <div 
                    onClick={() => setIsCardFlipped(!isCardFlipped)}
                    className={`w-full min-h-[300px] my-6 rounded-2xl p-6 border-2 cursor-pointer flex flex-col items-center justify-center text-center transition-all duration-300 transform shadow-xl ${
                      isCardFlipped 
                        ? 'border-[#cba358] bg-[#182333]/90' 
                        : 'border-[#384860] bg-[#141b26]/70 hover:border-[#cba358]/60'
                    }`}
                  >
                    {!isCardFlipped ? (
                      <div>
                        <span className="text-xs font-mono uppercase tracking-widest text-[#8c9ba5] block mb-2">
                          QUESTION
                        </span>
                        <h3 className="text-3xl font-magical font-bold text-[#f3d38c] mb-2">
                          {currentFlashcard.word}
                        </h3>
                        {currentFlashcard.phonetic && (
                          <span className="font-mono text-sm text-[#8c9ba5] block mb-4">
                            {currentFlashcard.phonetic}
                          </span>
                        )}
                        <p className="text-xs text-gray-400 mt-4">
                          点击卡片查看中文释义与例句
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <span className="text-xs font-mono uppercase tracking-widest text-[#cba358] block">
                          ANSWER
                        </span>
                        <h4 className="text-xl font-bold text-amber-200 font-reading">
                          {currentFlashcard.translation}
                        </h4>
                        {currentFlashcard.lore && (
                          <div className="text-xs text-amber-100/80 bg-[#740001]/30 p-2.5 rounded-lg border border-amber-400/30 flex items-start gap-1.5 text-left">
                            <Sparkles size={13} className="text-amber-400 shrink-0 mt-0.5" />
                            <span>{currentFlashcard.lore}</span>
                          </div>
                        )}
                        {currentFlashcard.context && (
                          <p className="text-xs italic text-gray-300 font-reading mt-2 border-t border-gray-700/40 pt-2">
                            "{currentFlashcard.context}"
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Navigation controls */}
                  <div className="flex items-center space-x-3 w-full justify-between">
                    <button
                      disabled={flashcardIndex <= 0}
                      onClick={() => {
                        setIsCardFlipped(false);
                        setFlashcardIndex(prev => Math.max(0, prev - 1));
                      }}
                      className="px-4 py-2 rounded-lg border border-gray-600/40 text-xs disabled:opacity-30 hover:border-[#cba358]"
                    >
                      上一张
                    </button>
                    <button
                      onClick={() => playPronunciation(currentFlashcard.word)}
                      className="p-2 rounded-full border border-[#cba358]/40 text-[#cba358]"
                      title="朗读单词"
                    >
                      <Volume2 size={16} />
                    </button>
                    <button
                      disabled={flashcardIndex >= filteredList.length - 1}
                      onClick={() => {
                        setIsCardFlipped(false);
                        setFlashcardIndex(prev => Math.min(filteredList.length - 1, prev + 1));
                      }}
                      className="px-4 py-2 rounded-lg bg-[#cba358] text-[#0f141c] font-bold text-xs disabled:opacity-30 hover:shadow-glow-gold"
                    >
                      下一张
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            // List Mode
            <>
              {/* Search input */}
              <div className="p-3 border-b border-gray-700/30">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索生词或中文释义..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-[#cba358] ${
                      isParchment ? 'bg-[#fffdf8] border-[#dec9a5]' : 'bg-[#18202d] border-[#2d3a4f] text-[#e2d9c8]'
                    }`}
                  />
                </div>
              </div>

              {/* Vocab Cards List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {filteredList.length === 0 ? (
                  <div className="text-center py-16 text-[#8c9ba5] text-xs">
                    <p>暂无生词</p>
                    <p className="mt-1 text-gray-500">听音频时点击任意英文单词即可收藏</p>
                  </div>
                ) : (
                  filteredList.map((item) => (
                    <div
                      key={item.id || item.word}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isParchment 
                          ? 'bg-[#fffdf8] border-[#dec9a5] hover:border-[#cba358]' 
                          : 'bg-[#18202d]/80 border-[#2b394e] hover:border-[#3f5370]'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-magical font-bold text-base text-[#cba358]">
                            {item.word}
                          </h4>
                          {item.phonetic && (
                            <span className="font-mono text-xs text-[#8c9ba5]">
                              {item.phonetic}
                            </span>
                          )}
                          {item.isHpLore && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#740001] text-amber-200 font-semibold">
                              魔法词
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => playPronunciation(item.word)}
                            className="p-1 rounded text-gray-400 hover:text-[#cba358]"
                            title="发音"
                          >
                            <Volume2 size={14} />
                          </button>
                          <button
                            onClick={() => onRemoveWord(item.word)}
                            className="p-1 rounded text-gray-400 hover:text-rose-400"
                            title="移除"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs font-reading text-amber-200/90 mt-1">
                        {item.translation}
                      </p>

                      {item.context && (
                        <p className="text-[11px] font-reading italic text-gray-400 mt-2 border-t border-gray-700/30 pt-1.5 line-clamp-2">
                          "{item.context}"
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Bottom Actions */}
              <div className="p-4 border-t border-gray-700/40 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportAnki}
                    disabled={vocabList.length === 0}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium transition-colors disabled:opacity-30 ${
                      isParchment
                        ? 'border-[#8c6d37] bg-[#f0dfbe] text-[#4a3525] hover:bg-[#e4cfaa]'
                        : 'border-[#cba358]/60 bg-[#cba358]/10 text-[#f3d38c] hover:bg-[#cba358]/20'
                    }`}
                    title="导出为标准 Anki 卡片牌组 (.tsv)"
                  >
                    <Sparkles size={13} className="text-[#cba358]" />
                    <span>导出至 Anki (TSV)</span>
                  </button>

                  <button
                    onClick={handleExportCSV}
                    disabled={vocabList.length === 0}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors disabled:opacity-30 ${
                      isParchment
                        ? 'border-[#c2ad88] text-[#7d6852] hover:bg-[#f0e4cc]'
                        : 'border-gray-600/50 text-[#8c9ba5] hover:bg-gray-700/30'
                    }`}
                    title="导出为通用表格 CSV 格式"
                  >
                    <Download size={13} />
                    <span>导出 CSV</span>
                  </button>
                </div>

                <button
                  onClick={onClearAll}
                  disabled={vocabList.length === 0}
                  className="text-gray-400 hover:text-rose-400 disabled:opacity-30 transition-colors"
                >
                  清空生词本
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
