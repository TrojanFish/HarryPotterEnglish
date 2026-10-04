import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trash2, 
  Volume2, 
  Download, 
  Sparkles, 
  Search, 
  CheckCircle,
  BookOpen,
  BrainCircuit,
  Bookmark
} from 'lucide-react';

import { generateAnkiTSV, downloadAnkiFile } from '../utils/ankiExport';

export function VocabularyDrawer({
  isOpen,
  onClose,
  vocabList,
  onRemoveWord,
  onClearAll,
  isParchment,
  onOpenSrs
}) {
  const [searchTerm, setSearchTerm] = useState('');
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
  const todayStr = new Date().toISOString().split('T')[0];

  const renderSrsBadge = (item) => {
    const level = item.srsLevel || item.srsBox || 1;
    const isDue = !item.nextReviewDate || item.nextReviewDate <= todayStr;

    const levelConfigs = {
      1: { label: 'Box 1 · 初学', color: 'bg-amber-100/90 text-amber-900 border-amber-300' },
      2: { label: 'Box 2 · 巩固', color: 'bg-amber-200/70 text-amber-950 border-amber-400' },
      3: { label: 'Box 3 · 熟记', color: 'bg-blue-100/90 text-blue-900 border-blue-300' },
      4: { label: 'Box 4 · 长效', color: 'bg-purple-100/90 text-purple-900 border-purple-300' },
      5: { label: 'Box 5 · 永久掌握', color: 'bg-emerald-100 text-emerald-900 border-emerald-400 font-bold' }
    };
    const config = levelConfigs[level] || levelConfigs[1];

    return (
      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
        <span className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold ${config.color}`}>
          {config.label}
        </span>
        {isDue && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold animate-pulse border border-amber-600" title="记忆封印松动，需要艾宾浩斯重铸">
            待重炼 · 封印松动
          </span>
        )}
      </div>
    );
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex items-end sm:items-stretch sm:justify-end animate-fadeIn"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:w-screen sm:max-w-md flex flex-col max-h-[92dvh] sm:max-h-full rounded-t-3xl sm:rounded-none border-t-2 sm:border-t-0 sm:border-l border-[#e8ddd0] bg-[#fbf9f5] text-[#1e1610] transition-colors duration-300 pb-safe overflow-hidden"
      >
        {/* Mobile Pull Handle Indicator */}
        <div className="sm:hidden w-10 h-1.5 bg-stone-300 rounded-full mx-auto my-2.5 shrink-0" />

        {/* Drawer Header */}
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-[#e8ddd0] bg-white flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <BookOpen className="w-5 h-5 text-amber-600 shrink-0" />
              <div className="min-w-0 flex-1">
                <h2 className="font-bold text-base sm:text-lg text-amber-950 truncate whitespace-nowrap">
                  <span className="font-magical">魔法生词本</span> <span className="font-mono font-bold text-amber-900">({vocabList.length})</span>
                </h2>
                <p className="text-[11px] sm:text-xs text-stone-500 truncate">精听原著词汇与例句笔记</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              {onOpenSrs && (
                <button
                  disabled={vocabList.length === 0}
                  onClick={() => {
                    onClose();
                    onOpenSrs();
                  }}
                  className="duo-btn-primary min-h-[44px] px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="启动艾宾浩斯智能翻转闪卡 (SRS 遗忘曲线算法)"
                >
                  <BrainCircuit size={15} className="shrink-0" />
                  <span>艾宾浩斯背词</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="duo-touch-target rounded-xl border border-[#e8ddd0] bg-white hover:bg-stone-100 text-stone-600 hover:text-amber-950 hover:border-amber-300 transition-all active:scale-90 cursor-pointer shrink-0"
                title="关闭生词本"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Search input - only show when vocabList has items */}
          {vocabList.length > 0 && (
                <div className="p-3 border-b border-[#e8ddd0] bg-white">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="search"
                      enterKeyHint="search"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck="false"
                      placeholder="搜索生词或中文释义..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-base sm:text-xs rounded-xl border border-[#e8ddd0] bg-stone-50 text-[#1e1610] focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Vocab Cards List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 ios-scroll">
                {vocabList.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 text-center my-auto">
                    <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border-2 border-amber-300/80 flex items-center justify-center text-amber-600 mb-4 animate-pulse">
                      <Bookmark size={28} className="text-amber-600" />
                    </div>
                    <h3 className="font-magical font-bold text-base text-amber-950 mb-1">
                      暂无生词 · 魔杖尚未收录新词
                    </h3>
                    <p className="text-xs text-stone-500 max-w-xs leading-relaxed mb-6">
                      在精听研读原著时，轻点任意英文单词即可实时查看权威释义，并一键收录至专属魔法生词本！
                    </p>
                    <button
                      onClick={onClose}
                      className="duo-btn-primary min-h-[44px] px-6 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      <Sparkles size={15} />
                      <span>去精听挑词入库</span>
                    </button>
                  </div>
                ) : filteredList.length === 0 ? (
                  <div className="text-center py-16 text-stone-400 text-xs">
                    <p className="font-bold text-sm text-stone-700 mb-1">未找到匹配生词</p>
                    <p className="text-xs mb-3">没有搜索到包含 “{searchTerm}” 的生词或释义</p>
                    <button
                      onClick={() => setSearchTerm('')}
                      className="duo-btn-secondary px-3 py-1.5 rounded-xl text-xs font-bold text-amber-900 cursor-pointer"
                    >
                      清除搜索条件
                    </button>
                  </div>
                ) : (
                  filteredList.map((item) => {
                    const isDue = !item.nextReviewDate || item.nextReviewDate <= todayStr;
                    return (
                      <div
                        key={item.id || item.word}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          isDue
                            ? 'bg-amber-500/5 border-amber-400/90 ring-1 ring-amber-400/30'
                            : 'duo-card duo-card-hover'
                        }`}
                      >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="flex items-center space-x-2 flex-wrap">
                            <h4 className="font-magical font-bold text-base text-amber-950">
                              {item.word}
                            </h4>
                            {item.phonetic && (
                              <span className="font-mono text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-800 font-semibold">
                                {item.phonetic}
                              </span>
                            )}
                            {item.isHpLore ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-900 border border-red-300/80 font-bold">
                                原著魔法
                              </span>
                            ) : item.tag === '中考核心' ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300/80 font-bold">
                                中考核心
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-300 font-bold">
                                进阶拓展
                              </span>
                            )}
                            {/* SRS status dot */}
                            {item.srsBox !== undefined && (
                              <span className={`inline-block w-2 h-2 rounded-full ml-1.5 align-middle ${
                                item.srsBox >= 5 ? 'bg-emerald-500' :
                                item.srsBox >= 4 ? 'bg-amber-400' :
                                item.srsBox >= 2 ? 'bg-orange-400' : 'bg-red-400'
                              }`} title={`SRS盒子 ${item.srsBox || 1}: ${item.srsBox >= 5 ? '已掌握' : '复习中'}`} />
                            )}
                          </div>
                          {renderSrsBadge(item)}
                        </div>

                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            onClick={() => playPronunciation(item.word)}
                            className="duo-touch-target rounded-xl border border-transparent hover:border-amber-300/80 bg-transparent hover:bg-amber-50 text-stone-500 hover:text-amber-800 transition-all active:scale-90 cursor-pointer"
                            title="试听纯正英音发音"
                          >
                            <Volume2 size={16} />
                          </button>
                          <button
                            onClick={() => onRemoveWord(item.word)}
                            className="duo-touch-target rounded-xl border border-transparent hover:border-rose-300/80 bg-transparent hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition-all active:scale-90 cursor-pointer"
                            title="从生词本移除"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm font-reading mt-1.5 font-bold text-amber-950">
                        {item.translation}
                      </p>

                      {item.context && (
                        <p className="text-[11px] font-reading italic mt-2 border-t border-[#e8ddd0] pt-1.5 line-clamp-2 text-stone-600">
                          "{item.context}"
                        </p>
                      )}
                    </div>
                  );
                })
              )}
              </div>

              {/* Bottom Actions */}
                <div className="p-4 border-t border-[#e8ddd0] bg-white flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      disabled={vocabList.length === 0}
                      onClick={handleExportAnki}
                      className="duo-btn-secondary min-h-[44px] flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs cursor-pointer"
                      title="导出为标准 Anki 卡片牌组 (.tsv)"
                    >
                      <Sparkles size={14} className="text-amber-600" />
                      <span>导出至 Anki (TSV)</span>
                    </button>

                    <button
                      disabled={vocabList.length === 0}
                      onClick={handleExportCSV}
                      className="duo-btn-secondary min-h-[44px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs cursor-pointer"
                      title="导出为通用表格 CSV 格式"
                    >
                      <Download size={14} />
                      <span>导出 CSV</span>
                    </button>
                  </div>

                  <button
                    disabled={vocabList.length === 0}
                    onClick={onClearAll}
                    className="min-h-[44px] px-2.5 py-1.5 rounded-xl text-xs font-bold text-stone-400 hover:text-rose-600 hover:bg-rose-50/80 transition-all active:scale-95 cursor-pointer"
                    title="清空生词本内所有单词"
                  >
                    清空生词本
                  </button>
                </div>

          {/* Toast Feedback Notification */}
          {toastMessage && (
            <div className="absolute bottom-20 left-4 right-4 z-50 animate-bounce">
              <div className="p-3 rounded-2xl bg-emerald-700/95 border border-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2">
                <CheckCircle size={15} />
                <span>{toastMessage}</span>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
