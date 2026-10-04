import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Sparkles,
  Layers,
  RotateCw,
  Library,
  Search,
  Clock,
  Play,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { formatEnglishText } from '../utils/vttParser';

export function BookShelfDrawer({
  isOpen,
  onClose,
  books = [],
  selectedBookId,
  selectedChapterId,
  onSelectBook,
  onSelectChapter,
  onRefreshCatalog,
  isRefreshing,
  isParchment
}) {
  const [activeTab, setActiveTab] = useState('chapters'); // 'chapters' | 'books'
  const [chapterSearch, setChapterSearch] = useState('');
  const [coverErrorMap, setCoverErrorMap] = useState({});

  if (!isOpen) return null;

  const validBooks = (books || []).filter(b => b.chapters && b.chapters.length > 0);
  const currentBook = validBooks.find(b => b.id === selectedBookId) || validBooks[0];
  const chapters = currentBook?.chapters || [];

  const filteredChapters = chapters.filter(ch => {
    if (!chapterSearch.trim()) return true;
    const q = chapterSearch.toLowerCase();
    return (ch.title || '').toLowerCase().includes(q)
      || (ch.cnTitle || '').includes(q)
      || String(ch.number).includes(q);
  });

  const handleImageError = (bookId) => {
    setCoverErrorMap(prev => ({ ...prev, [bookId]: true }));
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-md flex items-end sm:items-stretch sm:justify-end animate-fadeIn"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:w-screen sm:max-w-xl flex flex-col max-h-[92dvh] sm:max-h-full rounded-t-3xl sm:rounded-none border-t-2 sm:border-t-0 sm:border-l border-[#e8ddd0] bg-[#fbf9f5] text-[#1e1610] transition-colors duration-300 pb-safe overflow-hidden"
      >
        {/* Mobile Pull Handle Indicator */}
        <div className="sm:hidden w-10 h-1.5 bg-stone-300 rounded-full mx-auto my-2.5 shrink-0" />

        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#e8ddd0] bg-white flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0 flex-1">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-700 border border-amber-300/80 shrink-0">
              <Library className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-magical font-bold text-base sm:text-lg text-amber-950 truncate">
                {activeTab === 'chapters'
                  ? (currentBook?.cnTitle || currentBook?.title || '章节选单')
                  : '霍格沃茨书架 (Magic Library)'}
              </h3>
              <p className="text-[11px] sm:text-xs text-stone-500 truncate">
                {activeTab === 'chapters'
                  ? `全卷共 ${chapters.length} 个精听章节 · 点击即播`
                  : '原版有声书库 · 自由切换阅读'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {activeTab === 'books' && onRefreshCatalog && (
              <button
                onClick={onRefreshCatalog}
                disabled={isRefreshing}
                className="duo-btn-secondary min-h-[44px] flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
                title="重新扫描 R2 存储桶新文件"
              >
                <RotateCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">{isRefreshing ? '扫描中...' : '刷新藏书'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="duo-touch-target rounded-xl border border-[#e8ddd0] bg-white hover:bg-stone-100 text-stone-600 hover:text-amber-950 hover:border-amber-300 transition-all active:scale-90 cursor-pointer shrink-0"
              title="关闭选单"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="px-4 sm:px-6 py-2.5 bg-white border-b border-[#e8ddd0] flex items-center justify-center shrink-0">
          <div className="flex rounded-xl p-1 bg-stone-100 border border-[#e8ddd0] gap-1 w-full max-w-sm">
            <button
              onClick={() => setActiveTab('chapters')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'chapters'
                  ? 'bg-amber-500 text-white'
                  : 'text-stone-600 hover:text-amber-950'
              }`}
            >
              <Layers size={13} />
              <span>章节目录 ({chapters.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('books')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'books'
                  ? 'bg-amber-500 text-white'
                  : 'text-stone-600 hover:text-amber-950'
              }`}
            >
              <BookOpen size={13} />
              <span>全部原著 ({validBooks.length})</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Chapters List */}
        {activeTab === 'chapters' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Search Input */}
            <div className="p-3 sm:px-6 border-b border-[#e8ddd0] bg-[#fbf9f5] shrink-0">
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="search"
                  enterKeyHint="search"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  placeholder="搜索章节名或关键词..."
                  value={chapterSearch}
                  onChange={(e) => setChapterSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 rounded-xl text-sm border border-amber-200 bg-white focus:border-amber-500 focus:outline-none transition-all"
                />
                {chapterSearch && (
                  <button
                    onClick={() => setChapterSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Chapters Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5 ios-scroll">
              {filteredChapters.map((ch, idx) => {
                const isCurrent = ch.id === selectedChapterId;
                const cleanTitle = formatEnglishText(ch.title);
                const hasDistinctCn = ch.cnTitle && ch.cnTitle.trim() !== '' && ch.cnTitle.trim() !== cleanTitle;

                return (
                  <div
                    key={ch.id}
                    onClick={() => {
                      if (onSelectChapter) {
                        onSelectChapter(ch.id, true);
                      }
                      onClose();
                    }}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl border cursor-pointer transition-all ${
                      isCurrent
                        ? 'border-l-4 border-l-amber-500 border-[#e8ddd0] bg-amber-50/70 ring-1 ring-amber-400/40'
                        : 'border-[#e8ddd0] bg-white hover:border-amber-400 hover:bg-stone-50/80'
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-magical font-bold text-xs shrink-0 ${
                      isCurrent ? 'bg-amber-500 text-white' : 'bg-amber-500/15 text-amber-800'
                    }`}>
                      {ch.number || idx + 1}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-magical font-bold text-sm text-amber-950 truncate">
                          {hasDistinctCn ? ch.cnTitle : cleanTitle}
                        </h4>
                        {isCurrent && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold shrink-0">
                            正在精听
                          </span>
                        )}
                      </div>
                      {hasDistinctCn && (
                        <p className="text-[11px] text-stone-400 font-reading italic truncate">{cleanTitle}</p>
                      )}
                      {ch.duration && (
                        <p className="text-[10px] text-stone-400 font-mono mt-0.5 flex items-center gap-1">
                          <Clock size={10} />{ch.duration}
                        </p>
                      )}
                    </div>

                    <button className={`min-h-[44px] px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1 transition-all ${
                      isCurrent
                        ? 'bg-amber-500 text-white'
                        : 'duo-btn-secondary'
                    }`}>
                      <Play size={11} className="fill-current" />
                      <span>{isCurrent ? '播放中' : '播放'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Books List */}
        {activeTab === 'books' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 ios-scroll">
            {validBooks.map((book) => {
              const isSelected = book.id === selectedBookId;
              const apiBase = import.meta.env.VITE_API_BASE || '';
              const coverUrl = `${apiBase}/api/raw/podcasts/${book.id}/cover.jpg`;
              const chapterCount = (book.chapters || []).length;

              return (
                <div
                  key={book.id}
                  onClick={() => {
                    if (onSelectBook) {
                      onSelectBook(book.id);
                    }
                    setActiveTab('chapters');
                  }}
                  className={`group relative rounded-2xl border-2 p-3.5 cursor-pointer transition-all flex items-center gap-4 ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50/60'
                      : 'border-[#e8ddd0] bg-white hover:border-amber-400'
                  }`}
                >
                  {/* Cover */}
                  <div className="w-16 h-22 rounded-xl overflow-hidden border border-amber-300/80 bg-stone-900 shrink-0">
                    {!coverErrorMap[book.id] ? (
                      <img
                        src={coverUrl}
                        alt={book.title}
                        onError={() => handleImageError(book.id)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-amber-950/30 text-amber-500 font-magical font-bold text-xs tracking-wider">
                        {book.code || 'HP'}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="font-magical font-bold text-base text-amber-950 group-hover:text-amber-700 transition-colors truncate">
                        {book.cnTitle || book.title}
                      </h4>
                      {isSelected && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold shrink-0">
                          当前
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 font-reading italic truncate">
                      {book.title}
                    </p>
                    <p className="text-[11px] text-stone-500 mt-1 flex items-center gap-1">
                      <Layers size={11} className="text-amber-600" />
                      <span>{chapterCount} 章节</span>
                    </p>
                  </div>

                  {/* Action */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectBook) onSelectBook(book.id);
                      setActiveTab('chapters');
                    }}
                    className={`min-h-[44px] px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1 ${
                      isSelected
                        ? 'duo-btn-primary'
                        : 'duo-btn-secondary'
                    }`}
                  >
                    <span>查看章节</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-[#e8ddd0] bg-white text-center text-xs text-stone-500 shrink-0">
          提示：可在目录中直接点播任意章节，也可在“全部原著”中阅读其他魔法故事
        </div>
      </div>
    </div>
  );
}

export default BookShelfDrawer;
