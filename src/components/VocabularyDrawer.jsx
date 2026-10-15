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
  Bookmark,
  Printer,
  Headphones
} from 'lucide-react';

import { printParchmentCards } from '../utils/parchmentPdfGenerator';
import { WaxSealBadge } from './common/WaxSealBadge.jsx';
import { OWLS_GRADES, getOwlsGrade } from '../constants/hogwartsTheme.js';

/**
 * VocabularyDrawer — Comprehensive Study Notebook & Starred Sentences Workshop
 * - Tab 1: 核心生词本 (Vocabulary list with Leitner 5-Box Spaced Repetition)
 * - Tab 2: 疑难句专练 (Starred / Bookmarked Sentences from Podcast & Studio modes)
 * - Apple HIG >= 44x44px touch targets, zero emojis
 */
export function VocabularyDrawer({
  isOpen,
  onClose,
  vocabList = [],
  onRemoveWord,
  onClearAll,
  isParchment,
  onOpenSrs,
  initialTab = 'words',
  bookmarkedSentences = [],
  onRemoveBookmark,
  onClearAllBookmarks,
  onPlaySentence,
  isPageView = false
}) {
  const [drawerTab, setDrawerTab] = useState(initialTab); // 'words' | 'sentences'
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showClearSentencesConfirm, setShowClearSentencesConfirm] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  useEffect(() => {
    if (!isOpen && !isPageView) {
      setShowClearConfirm(false);
      setShowClearSentencesConfirm(false);
      return;
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPageView, onClose]);

  if (!isOpen && !isPageView) return null;

  const filteredVocab = (vocabList || []).filter(item => 
    (item.word || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.translation && item.translation.includes(searchTerm))
  );

  const filteredSentences = (bookmarkedSentences || []).filter(item =>
    (item.text || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.translation && item.translation.includes(searchTerm))
  );

  const playPronunciation = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-GB';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
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

  const handleExportSentencesCSV = () => {
    if (bookmarkedSentences.length === 0) return;
    const header = 'Sentence,Translation,Chapter,RecordedAt\n';
    const rows = bookmarkedSentences.map(s => 
      `"${(s.text || '').replace(/"/g, '""')}","${(s.translation || '').replace(/"/g, '""')}","${s.chapterId || ''}","${s.createdAt || ''}"`
    ).join('\n');

    const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `hogwarts_sentences_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('已成功导出疑难句集表格！');
  };

  const handlePrintParchmentPdf = () => {
    if (vocabList.length === 0) return;
    printParchmentCards(vocabList, {
      title: '霍格沃茨魔法精听生词闪卡 · Hogwarts Study Flashcards',
      subtitle: 'A4 双列便携剪裁卡 · 艾宾浩斯记忆追踪版'
    });
    showToast('已调起打印预览，可直接打印或「另存为 PDF」！');
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const boxCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let dueCount = 0;
  (vocabList || []).forEach(item => {
    const lvl = item.srsLevel || item.srsBox || 1;
    boxCounts[lvl] = (boxCounts[lvl] || 0) + 1;
    if (!item.nextReviewDate || item.nextReviewDate <= todayStr) {
      dueCount += 1;
    }
  });

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
    const owlsGrade = getOwlsGrade(level);
    const isMastered = level >= 5;
    const config = levelConfigs[Math.max(1, Math.min(5, level))] || levelConfigs[1];

    return (
      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
        {isMastered && (
          <WaxSealBadge text="O" size={20} title="O.W.L.s 杰出级 (Outstanding) · 大师级无杖掌握" />
        )}
        <span className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold ${config.color}`}>
          O.W.L.s {owlsGrade.grade} · {config.label}
        </span>
        {isDue && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold animate-pulse border border-amber-600" title="记忆封印松动，需要艾宾浩斯重铸">
            待重炼 · 封印松动
          </span>
        )}
      </div>
    );
  };

  const drawerContent = (
    <div 
      onClick={(e) => e.stopPropagation()}
      className={isPageView
        ? "w-full h-full flex flex-col bg-[#fbf9f5] text-[#1e1610] pb-safe overflow-hidden"
        : "w-full sm:w-screen sm:max-w-lg flex flex-col max-h-[92dvh] sm:max-h-full rounded-t-3xl sm:rounded-none border-t sm:border-t-0 sm:border-l border-[#e8ddd0] bg-[#fbf9f5] text-[#1e1610] transition-colors duration-300 pb-safe overflow-hidden"
      }
    >
      {/* Mobile Pull Handle Indicator */}
      {!isPageView && <div className="sm:hidden w-10 h-1.5 bg-stone-300 rounded-full mx-auto my-2.5 shrink-0" />}

      {/* Drawer Header — Standardized h-14 (56px) */}
      <div className={`shrink-0 z-20 ${isPageView ? 'pt-safe' : ''} border-b border-[#e8ddd0] bg-white select-none`}>
        <div className="h-14 px-4 sm:px-6 flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5 min-w-0 flex-1">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-700 border border-amber-300/80 shrink-0">
              {drawerTab === 'words' ? (
                <BookOpen size={18} className="text-amber-700 sm:w-5 sm:h-5" />
              ) : (
                <Bookmark size={18} className="text-amber-700 sm:w-5 sm:h-5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-magical font-bold text-sm sm:text-lg text-amber-950 flex items-center gap-1.5 sm:gap-2 truncate">
                <span>{drawerTab === 'words' ? '魔法生词本' : '冥想盆疑难句'}</span>
                <span className="text-[10px] sm:text-[11px] font-sans px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 font-bold shrink-0">
                  {drawerTab === 'words' ? `${vocabList.length} 词` : `${bookmarkedSentences.length} 句`}
                </span>
              </h2>
              <p className="text-[10px] sm:text-xs text-stone-500 font-reading truncate mt-0.5">
                {drawerTab === 'words' 
                  ? '高频原著生词 · 艾宾浩斯遗忘曲线智能重铸' 
                  : '原声重点长难句 · 回听原声与深度背诵突破'}
              </p>
            </div>
          </div>

          {/* Tab Switcher: 生词本 vs 疑难句 */}
          <div className="flex items-center p-1 rounded-xl bg-stone-100 border border-[#e8ddd0] gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                setDrawerTab('words');
                setSearchTerm('');
              }}
              className={`min-h-[38px] px-2.5 sm:px-3 rounded-lg text-xs font-bold transition-all cursor-pointer select-none touch-manipulation active:scale-[0.98] ${
                drawerTab === 'words'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-stone-600 hover:text-amber-950 hover:bg-white/80'
              }`}
              aria-pressed={drawerTab === 'words'}
            >
              生词本 ({vocabList.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setDrawerTab('sentences');
                setSearchTerm('');
              }}
              className={`min-h-[38px] px-2.5 sm:px-3 rounded-lg text-xs font-bold transition-all cursor-pointer select-none touch-manipulation active:scale-[0.98] ${
                drawerTab === 'sentences'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-stone-600 hover:text-amber-950 hover:bg-white/80'
              }`}
              aria-pressed={drawerTab === 'sentences'}
            >
              冥想盆疑难句 ({bookmarkedSentences.length})
            </button>
          </div>

          {drawerTab === 'words' && onOpenSrs && vocabList.length > 0 && (
            <button
              onClick={() => {
                onClose();
                onOpenSrs();
              }}
              className="duo-btn-primary min-h-[44px] min-w-[44px] w-11 h-11 rounded-xl text-xs font-bold flex items-center justify-center cursor-pointer shrink-0 active:scale-95"
              title="启动艾宾浩斯智能翻转闪卡 (SRS 遗忘曲线算法)"
              aria-label="启动艾宾浩斯智能翻转闪卡"
            >
              <BrainCircuit size={18} className="shrink-0" />
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl border border-[#e8ddd0] bg-white hover:bg-stone-50 flex items-center justify-center text-stone-500 hover:text-amber-950 transition-all active:scale-95 cursor-pointer shrink-0"
              title={isPageView ? "返回" : "关闭研学本"}
              aria-label="关闭研学本"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

        {/* ── Sub-header: Leitner strip (when in words tab) ───────────── */}
        {drawerTab === 'words' && vocabList.length > 0 && (
          <div className="leitner-distribution px-4 py-2.5 bg-amber-50/70 border-b border-[#e8ddd0]">
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 mb-1.5">
              <span className="flex items-center gap-1.5">
                <BrainCircuit size={13} className="text-amber-700" />
                <span>O.W.L.s 巫师等级考试记忆阶梯 (Leitner 5-Box)</span>
              </span>
              {dueCount > 0 ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-900 font-bold border border-amber-300/80">
                  今日 {dueCount} 词待复习
                </span>
              ) : (
                <span className="text-[10px] text-stone-500 font-medium">今日记忆已牢固</span>
              )}
            </div>
            <div className="grid grid-cols-5 gap-1.5 text-center">
              {[
                { box: 1, grade: 'T', label: 'Box 1 · T (巨怪级 · 初学)', short: 'T · 初学', color: 'bg-amber-100 text-amber-900 border-amber-300' },
                { box: 2, grade: 'D', label: 'Box 2 · D (糟糕级 · 巩固)', short: 'D · 巩固', color: 'bg-amber-200/70 text-amber-950 border-amber-400' },
                { box: 3, grade: 'P', label: 'Box 3 · P (勉强级 · 熟记)', short: 'P · 熟记', color: 'bg-blue-100 text-blue-900 border-blue-300' },
                { box: 4, grade: 'A', label: 'Box 4 · A (及格级 · 长效)', short: 'A · 长效', color: 'bg-purple-100 text-purple-900 border-purple-300' },
                { box: 5, grade: 'O', label: 'Box 5 · O (杰出级 · 永久掌握)', short: 'O · 永久掌握', color: 'bg-emerald-100 text-emerald-900 border-emerald-400 font-bold' }
              ].map(({ box, grade, label, short, color }) => {
                const count = boxCounts[box] || 0;
                return (
                  <div key={box} className={`p-1 rounded-lg border text-[10px] ${color}`} title={label}>
                    <div className="font-extrabold font-mono text-xs flex items-center justify-center gap-0.5">
                      <span>{count}</span>
                      <span className="text-[9px] opacity-75 font-magical font-bold">({grade})</span>
                    </div>
                    <div className="truncate text-[9px] font-medium">{short}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Search Input ────────────────────────────────────────────── */}
        {((drawerTab === 'words' && vocabList.length > 0) ||
          (drawerTab === 'sentences' && bookmarkedSentences.length > 0)) && (
          <div className="p-3 border-b border-[#e8ddd0] bg-white">
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="search"
                enterKeyHint="search"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder={drawerTab === 'words' ? "搜索生词或中文释义..." : "搜索疑难句或中文释义..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-11 min-h-[44px] pl-10 pr-9 text-base sm:text-xs rounded-xl border border-[#e8ddd0] bg-stone-50 text-[#1e1610] focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-2 duo-touch-target text-stone-400 hover:text-stone-700 cursor-pointer"
                  title="清空搜索"
                  aria-label="清空搜索"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Tab 1: Vocab Cards List ─────────────────────────────────── */}
        {drawerTab === 'words' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3 ios-scroll">
            {vocabList.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 text-center my-auto">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-300/60 flex items-center justify-center text-amber-700 mb-3">
                  <Bookmark size={24} className="text-amber-700" />
                </div>
                <h3 className="font-magical font-bold text-base text-amber-950 mb-1">
                  暂无生词 · 魔杖尚未收录新词
                </h3>
                <p className="text-xs text-stone-500 max-w-xs leading-relaxed mb-6">
                  在精听研读原著时，轻点任意英文单词即可实时查看权威释义，并一键收录至专属魔法生词本！
                </p>
                <button
                  onClick={onClose}
                  className="duo-btn-primary min-h-[44px] px-6 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Sparkles size={15} />
                  <span>去精听挑词入库</span>
                </button>
              </div>
            ) : filteredVocab.length === 0 ? (
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
              filteredVocab.map((item) => {
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
                        </div>

                        {renderSrsBadge(item)}

                        <p className="text-sm font-reading text-stone-700 mt-2 font-medium">
                          {item.translation}
                        </p>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          onClick={() => playPronunciation(item.word)}
                          className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl border border-[#e8ddd0] bg-white flex items-center justify-center text-stone-600 hover:text-amber-950 active:scale-90 transition-all cursor-pointer"
                          title="发音朗读"
                          aria-label={`朗读 ${item.word}`}
                        >
                          <Volume2 size={16} />
                        </button>

                        <button
                          onClick={() => onRemoveWord(item.id || item.word)}
                          className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl border border-[#e8ddd0] bg-white flex items-center justify-center text-stone-400 hover:text-rose-600 active:scale-90 transition-all cursor-pointer"
                          title="移出生词本"
                          aria-label={`删除 ${item.word}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

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
        )}

        {/* ── Tab 2: Starred Sentences List ───────────────────────────── */}
        {drawerTab === 'sentences' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3 ios-scroll">
            {bookmarkedSentences.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 text-center my-auto">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-300/60 flex items-center justify-center text-amber-700 mb-3">
                  <Bookmark size={24} className="text-amber-700" />
                </div>
                <h3 className="font-magical font-bold text-base text-amber-950 mb-1">
                  暂无星标疑句 · 随时随地收录
                </h3>
                <p className="text-xs text-stone-500 max-w-xs leading-relaxed mb-6">
                  在播客随行或精听研读时，遇到听不懂或值得精细背诵的长难句，点击星标即可收录至此处集中突破！
                </p>
                <button
                  onClick={onClose}
                  className="duo-btn-primary min-h-[44px] px-6 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Sparkles size={15} />
                  <span>去听播客星标疑句</span>
                </button>
              </div>
            ) : filteredSentences.length === 0 ? (
              <div className="text-center py-16 text-stone-400 text-xs">
                <p className="font-bold text-sm text-stone-700 mb-1">未找到匹配疑难句</p>
                <p className="text-xs mb-3">没有搜索到包含 “{searchTerm}” 的句子或释义</p>
                <button
                  onClick={() => setSearchTerm('')}
                  className="duo-btn-secondary px-3 py-1.5 rounded-xl text-xs font-bold text-amber-900 cursor-pointer"
                >
                  清除搜索条件
                </button>
              </div>
            ) : (
              filteredSentences.map((item) => (
                <div
                  key={item.id || item.cueId}
                  className="p-3.5 rounded-2xl border border-[#e8ddd0] bg-white hover:border-amber-300 transition-all duo-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-reading text-sm sm:text-base font-semibold text-amber-950 leading-relaxed">
                        {item.text}
                      </p>
                      {item.translation && (
                        <p className="font-reading text-xs sm:text-sm text-stone-500 mt-1.5 leading-relaxed">
                          {item.translation}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {onPlaySentence && (
                        <button
                          onClick={() => {
                            onClose();
                            onPlaySentence(item);
                          }}
                          className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 flex items-center justify-center text-amber-900 active:scale-90 transition-all cursor-pointer"
                          title="定位播放原著英音原声"
                          aria-label="回听原著原声"
                        >
                          <Headphones size={15} />
                        </button>
                      )}

                      <button
                        onClick={() => playPronunciation(item.text)}
                        className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl border border-[#e8ddd0] bg-white flex items-center justify-center text-stone-600 hover:text-amber-950 active:scale-90 transition-all cursor-pointer"
                        title="发音朗读整句"
                        aria-label="发音朗读整句"
                      >
                        <Volume2 size={16} />
                      </button>

                      {onRemoveBookmark && (
                        <button
                          onClick={() => onRemoveBookmark(item.id || item.cueId)}
                          className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl border border-[#e8ddd0] bg-white flex items-center justify-center text-stone-400 hover:text-rose-600 active:scale-90 transition-all cursor-pointer"
                          title="取消收录此疑难句"
                          aria-label="取消收录此疑难句"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Bottom Actions (When in sentences tab) ────────────────────── */}
        {drawerTab === 'sentences' && bookmarkedSentences.length > 0 && (
          <div className="p-3.5 sm:p-4 border-t border-[#e8ddd0] bg-white flex flex-col gap-2 shrink-0">
            {showClearSentencesConfirm ? (
              <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2.5 p-3 rounded-2xl bg-rose-50 border border-rose-200 animate-fadeIn">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-900 min-w-0">
                  <Trash2 size={15} className="text-rose-600 shrink-0" />
                  <span>确定清空全部 {bookmarkedSentences.length} 个疑难句？此操作无法撤销</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => setShowClearSentencesConfirm(false)}
                    className="px-3.5 py-2 min-h-[44px] rounded-xl border border-stone-300 bg-white text-stone-700 font-bold text-xs hover:bg-stone-50 cursor-pointer active:scale-95"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => {
                      setShowClearSentencesConfirm(false);
                      if (onClearAllBookmarks) onClearAllBookmarks();
                    }}
                    className="px-3.5 py-2 min-h-[44px] rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 cursor-pointer active:scale-95"
                  >
                    确认清空
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportSentencesCSV}
                    className="duo-btn-primary min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs whitespace-nowrap active:scale-95 font-bold cursor-pointer"
                    title="导出所有星标疑难句为 CSV 表格"
                    aria-label="导出疑难句表格"
                  >
                    <Download size={14} className="shrink-0" />
                    <span>导出疑难句 (CSV)</span>
                  </button>
                  <span className="text-xs text-stone-500 font-reading hidden sm:inline ml-1">
                    共收录 <span className="font-mono font-bold text-amber-900">{bookmarkedSentences.length}</span> 句重点长难句
                  </span>
                </div>
                {onClearAllBookmarks && (
                  <button
                    onClick={() => setShowClearSentencesConfirm(true)}
                    className="min-h-[44px] min-w-[44px] rounded-xl border border-rose-200 text-rose-700 bg-rose-50/60 hover:bg-rose-100 hover:border-rose-300 transition-all flex items-center justify-center active:scale-95 cursor-pointer"
                    title="清空所有疑难句"
                    aria-label="清空所有疑难句"
                  >
                    <Trash2 size={15} className="text-rose-600 shrink-0" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Bottom Actions (When in words tab) ───────────────────────── */}
        {drawerTab === 'words' && vocabList.length > 0 && (
          <div className="p-3.5 sm:p-4 border-t border-[#e8ddd0] bg-white flex flex-col gap-2 shrink-0">
            {showClearConfirm ? (
              <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2.5 p-3 rounded-2xl bg-rose-50 border border-rose-200 animate-fadeIn">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-900 min-w-0">
                  <Trash2 size={15} className="text-rose-600 shrink-0" />
                  <span>确定清空全部 {vocabList.length} 个生词？此操作无法撤销</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-3.5 py-2 min-h-[44px] rounded-xl border border-stone-300 bg-white text-stone-700 font-bold text-xs hover:bg-stone-50 cursor-pointer active:scale-95"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => {
                      setShowClearConfirm(false);
                      onClearAll();
                    }}
                    className="px-3.5 py-2 min-h-[44px] rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 cursor-pointer active:scale-95"
                  >
                    确认清空
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    disabled={vocabList.length === 0}
                    onClick={handlePrintParchmentPdf}
                    className={`duo-btn-primary min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs whitespace-nowrap active:scale-95 font-bold ${vocabList.length === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    title="生成标准 A4 羊皮纸剪裁闪卡，直接打印或保存为 PDF"
                    aria-label="打印羊皮纸单词卡 (PDF)"
                  >
                    <Printer size={14} className="shrink-0" />
                    <span>打印羊皮纸单词卡 (PDF)</span>
                  </button>

                  <button
                    disabled={vocabList.length === 0}
                    onClick={handleExportCSV}
                    className={`duo-btn-secondary min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-xs active:scale-95 ${vocabList.length === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    title="导出为通用表格 CSV 格式"
                    aria-label="导出为通用表格 CSV 格式"
                  >
                    <Download size={15} className="shrink-0 text-stone-600" />
                  </button>
                </div>

                <button
                  disabled={vocabList.length === 0}
                  onClick={() => setShowClearConfirm(true)}
                  className={`min-h-[44px] min-w-[44px] rounded-xl border border-rose-200 text-rose-700 bg-rose-50/60 transition-all flex items-center justify-center ${vocabList.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-rose-100 hover:border-rose-300 active:scale-95 cursor-pointer'}`}
                  title="清空生词本内所有单词"
                  aria-label="清空生词本"
                >
                  <Trash2 size={15} className="text-rose-600 shrink-0" />
                </button>
              </div>
            )}
          </div>
        )}

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
  );

  if (isPageView) {
    return drawerContent;
  }

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex items-end sm:items-stretch sm:justify-end animate-fadeIn"
      onClick={onClose}
    >
      {drawerContent}
    </div>
  );
}

export default VocabularyDrawer;
