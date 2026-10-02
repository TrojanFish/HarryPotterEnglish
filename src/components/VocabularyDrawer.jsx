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
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

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
    showToast('已导出 Anki 牌组文件 (.tsv)，可在 Anki 中直接导入！');
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
    showToast('已成功导出 CSV 单词表格！');
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
          <div className={`px-5 py-4 border-b flex items-center justify-between ${
            isParchment ? 'border-amber-200/80 bg-[#f7eedc]' : 'border-gray-700/40'
          }`}>
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-amber-700 dark:text-amber-400" />
              <div>
                <h2 className="font-magical font-bold text-lg text-amber-950 dark:text-[#cba358]">
                  魔法生词本 ({vocabList.length})
                </h2>
                <p className={`text-xs ${isParchment ? 'text-[#7a644c]' : 'text-[#8c9ba5]'}`}>精听原著词汇与例句笔记</p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setIsFlashcardMode(!isFlashcardMode)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer ${
                  isFlashcardMode 
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-500 shadow-sm' 
                    : 'border-amber-300/80 bg-white/90 text-amber-950 hover:bg-amber-50 hover:border-amber-400'
                }`}
                title="切换卡片翻转记忆模式与列表笔记"
              >
                <Layers size={14} />
                <span>{isFlashcardMode ? '列表笔记' : '卡片背词'}</span>
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-xl border border-amber-200/80 bg-white/80 hover:bg-amber-100/70 text-slate-600 hover:text-amber-900 hover:border-amber-400 transition-all active:scale-90 shadow-2xs cursor-pointer"
                title="关闭生词本"
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
                    className={`w-full min-h-[300px] my-6 rounded-2xl p-6 border-2 cursor-pointer flex flex-col items-center justify-center text-center transition-all duration-300 transform shadow-xl select-none ${
                      isParchment
                        ? isCardFlipped 
                          ? 'border-amber-400 bg-[#fffdf9] text-amber-950 shadow-md' 
                          : 'border-amber-200 bg-[#faf6ee] text-[#2c221e] hover:border-amber-400'
                        : isCardFlipped 
                          ? 'border-[#cba358] bg-[#182333]/90 text-amber-100' 
                          : 'border-[#384860] bg-[#141b26]/70 text-[#e2d9c8] hover:border-[#cba358]/60'
                    }`}
                  >
                    {!isCardFlipped ? (
                      <div>
                        <span className="text-xs font-mono uppercase tracking-widest text-[#8c9ba5] block mb-2">
                          正面 · QUESTION
                        </span>
                        <h3 className="text-3xl font-magical font-bold text-amber-700 dark:text-[#f3d38c] mb-2">
                          {currentFlashcard.word}
                        </h3>
                        {currentFlashcard.phonetic && (
                          <span className="font-mono text-sm text-[#8c9ba5] block mb-4">
                            {currentFlashcard.phonetic}
                          </span>
                        )}
                        <p className={`text-xs mt-4 ${isParchment ? 'text-amber-800/70' : 'text-gray-400'}`}>
                          轻点卡片翻转查看中文释义与例句
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <span className="text-xs font-mono uppercase tracking-widest text-amber-600 dark:text-[#cba358] block">
                          背面释义 · ANSWER
                        </span>
                        <h4 className="text-xl font-bold text-amber-900 dark:text-amber-200 font-reading">
                          {currentFlashcard.translation}
                        </h4>
                        {currentFlashcard.lore && (
                          <div className={`text-xs p-2.5 rounded-lg border flex items-start gap-1.5 text-left ${
                            isParchment
                              ? 'bg-amber-100/80 text-amber-950 border-amber-300'
                              : 'bg-[#740001]/30 text-amber-100/80 border-amber-400/30'
                          }`}>
                            <Sparkles size={13} className="text-amber-500 shrink-0 mt-0.5" />
                            <span>{currentFlashcard.lore}</span>
                          </div>
                        )}
                        {currentFlashcard.context && (
                          <p className={`text-xs italic font-reading mt-2 border-t pt-2 ${
                            isParchment ? 'text-[#6b553e] border-amber-200' : 'text-gray-300 border-gray-700/40'
                          }`}>
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
                      className="px-4 py-2 rounded-xl border border-amber-300/90 bg-white/95 text-amber-950 hover:bg-amber-50 hover:border-amber-400 font-bold text-xs shadow-xs hover:shadow active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all"
                      title="翻看上一张生词卡"
                    >
                      上一张
                    </button>
                    <button
                      onClick={() => playPronunciation(currentFlashcard.word)}
                      className="p-2.5 rounded-xl border border-amber-300/80 bg-white/90 text-amber-800 hover:bg-amber-50 hover:border-amber-400 shadow-xs hover:shadow active:scale-90 cursor-pointer transition-all"
                      title="朗读当前单词发音"
                    >
                      <Volume2 size={16} />
                    </button>
                    <button
                      disabled={flashcardIndex >= filteredList.length - 1}
                      onClick={() => {
                        setIsCardFlipped(false);
                        setFlashcardIndex(prev => Math.min(filteredList.length - 1, prev + 1));
                      }}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs disabled:opacity-30 disabled:pointer-events-none shadow-sm hover:shadow-md active:scale-95 cursor-pointer transition-all ring-1 ring-amber-300/30"
                      title="翻看下一张生词卡"
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
              <div className={`p-3 border-b ${
                isParchment ? 'border-amber-200/80 bg-[#f9f2e3]' : 'border-gray-700/30'
              }`}>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="搜索生词或中文释义..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border focus:outline-none transition-all ${
                      isParchment 
                        ? 'bg-white border-amber-200 text-amber-950 focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20' 
                        : 'bg-[#18202d] border-[#2d3a4f] text-[#e2d9c8] focus:ring-1 focus:ring-[#cba358]'
                    }`}
                  />
                </div>
              </div>

              {/* Vocab Cards List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {filteredList.length === 0 ? (
                  <div className="text-center py-16 text-slate-500 text-xs">
                    <p className="font-bold text-sm text-amber-900/80 mb-1">生词本暂无内容</p>
                    <p className="text-xs">在精听模式下轻点任意英文单词，即可收入生词本</p>
                  </div>
                ) : (
                  filteredList.map((item) => (
                    <div
                      key={item.id || item.word}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isParchment 
                          ? 'bg-[#ffffff] border-[#e8dcb9] hover:border-amber-400 shadow-sm' 
                          : 'bg-[#18202d]/80 border-[#2b394e] hover:border-[#3f5370]'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-magical font-bold text-base text-amber-950 dark:text-[#cba358]">
                            {item.word}
                          </h4>
                          {item.phonetic && (
                            <span className="font-mono text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-800 dark:text-[#8c9ba5] font-semibold">
                              {item.phonetic}
                            </span>
                          )}
                          {item.isHpLore && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#740001] text-amber-200 font-semibold shadow-sm">
                              魔法词
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => playPronunciation(item.word)}
                            className="p-1.5 rounded-xl border border-transparent hover:border-amber-300/80 bg-transparent hover:bg-amber-50 text-slate-400 hover:text-amber-800 transition-all active:scale-90 cursor-pointer"
                            title="试听纯正英音发音"
                          >
                            <Volume2 size={15} />
                          </button>
                          <button
                            onClick={() => onRemoveWord(item.word)}
                            className="p-1.5 rounded-xl border border-transparent hover:border-rose-300/80 bg-transparent hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all active:scale-90 cursor-pointer"
                            title="从生词本移除"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      <p className={`text-xs sm:text-sm font-reading mt-1.5 font-bold ${
                        isParchment ? 'text-amber-950' : 'text-amber-200/90'
                      }`}>
                        {item.translation}
                      </p>

                      {item.context && (
                        <p className={`text-[11px] font-reading italic mt-2 border-t pt-1.5 line-clamp-2 ${
                          isParchment ? 'text-[#735839] border-amber-200/80' : 'text-gray-400 border-gray-700/30'
                        }`}>
                          "{item.context}"
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Bottom Actions */}
              <div className={`p-4 border-t flex flex-wrap items-center justify-between gap-2 text-xs ${
                isParchment ? 'border-amber-200/80 bg-[#f7eedc]' : 'border-gray-700/40'
              }`}>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportAnki}
                    disabled={vocabList.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300/90 bg-amber-50/90 hover:bg-amber-100/80 text-amber-950 hover:border-amber-400 font-bold transition-all shadow-xs hover:shadow active:scale-95 cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                    title="导出为标准 Anki 卡片牌组 (.tsv)"
                  >
                    <Sparkles size={13} className="text-amber-600" />
                    <span>导出至 Anki (TSV)</span>
                  </button>

                  <button
                    onClick={handleExportCSV}
                    disabled={vocabList.length === 0}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-amber-300/70 bg-white/90 hover:bg-amber-50 text-amber-900 hover:border-amber-400 font-bold transition-all shadow-xs hover:shadow active:scale-95 cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                    title="导出为通用表格 CSV 格式"
                  >
                    <Download size={13} />
                    <span>导出 CSV</span>
                  </button>
                </div>

                <button
                  onClick={onClearAll}
                  disabled={vocabList.length === 0}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-rose-600 hover:bg-rose-50/80 transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                  title="清空生词本内所有单词"
                >
                  清空生词本
                </button>
              </div>
            </>
          )}

          {/* Toast Feedback Notification */}
          {toastMessage && (
            <div className="absolute bottom-20 left-4 right-4 z-50 animate-bounce">
              <div className="p-3 rounded-2xl bg-emerald-700/95 border border-emerald-500 text-white text-xs font-bold shadow-2xl flex items-center justify-center gap-2">
                <CheckCircle size={15} />
                <span>{toastMessage}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
