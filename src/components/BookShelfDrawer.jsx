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
import { PodcastEpisodeCard } from './podcast/PodcastEpisodeCard';

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
  isParchment,
  isPlaying = false,
  onTogglePlay,
  getChapterBookmarkCount
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
        className="w-full sm:w-screen sm:max-w-lg flex flex-col max-h-[92dvh] sm:max-h-full rounded-t-3xl sm:rounded-none border-t sm:border-t-0 sm:border-l border-[#e8ddd0] bg-[#fbf9f5] text-[#1e1610] transition-colors duration-300 pb-safe overflow-hidden"
      >
        {/* Mobile Pull Handle Indicator */}
        <div className="sm:hidden w-10 h-1.5 bg-stone-300 rounded-full mx-auto my-2.5 shrink-0" />

        {/* Header — Standardized h-14 (56px) */}
        <div className="h-14 px-4 sm:px-6 border-b border-[#e8ddd0] bg-white flex items-center justify-between gap-2 shrink-0 select-none">
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
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl border border-[#e8ddd0] bg-white hover:bg-stone-50 text-stone-600 hover:text-amber-950 hover:border-amber-300 transition-all active:scale-95 cursor-pointer shrink-0 disabled:opacity-50 flex items-center justify-center"
                title={isRefreshing ? '正在重新扫描 R2 存储桶...' : '重新扫描 R2 存储桶新文件'}
                aria-label={isRefreshing ? '正在重新扫描 R2 存储桶...' : '重新扫描 R2 存储桶新文件'}
              >
                <RotateCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
            )}

            <button
              onClick={onClose}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl border border-[#e8ddd0] bg-white hover:bg-stone-50 text-stone-500 hover:text-amber-950 flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0"
              title="关闭选单"
              aria-label="关闭选单"
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
              className={`flex-1 min-h-[38px] py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 select-none ${
                activeTab === 'chapters'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-stone-600 hover:text-amber-950 hover:bg-white/80'
              }`}
              aria-pressed={activeTab === 'chapters'}
            >
              <Layers size={13} />
              <span>章节目录 ({chapters.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('books')}
              className={`flex-1 min-h-[38px] py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 select-none ${
                activeTab === 'books'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-stone-600 hover:text-amber-950 hover:bg-white/80'
              }`}
              aria-pressed={activeTab === 'books'}
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
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="search"
                  enterKeyHint="search"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="搜索章节名或关键词..."
                  value={chapterSearch}
                  onChange={(e) => setChapterSearch(e.target.value)}
                  className="w-full h-11 min-h-[44px] pl-10 pr-9 rounded-xl text-base sm:text-xs border border-[#e8ddd0] bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 focus:outline-none transition-all"
                />
                {chapterSearch && (
                  <button
                    type="button"
                    onClick={() => setChapterSearch('')}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-2 duo-touch-target text-stone-400 hover:text-stone-700 cursor-pointer"
                    title="清空搜索"
                    aria-label="清空搜索"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Chapters Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5 ios-scroll">
              {filteredChapters.map((ch, idx) => (
                <PodcastEpisodeCard
                  key={ch.id}
                  chapter={ch}
                  chapterIndex={idx}
                  isCurrent={ch.id === selectedChapterId}
                  isPlaying={isPlaying && ch.id === selectedChapterId}
                  bookmarkCount={getChapterBookmarkCount ? getChapterBookmarkCount(currentBook?.id, ch.id) : 0}
                  onTogglePlay={onTogglePlay}
                  onSelectChapter={(id, autoPlay) => {
                    if (onSelectChapter) {
                      onSelectChapter(id, autoPlay);
                    }
                    onClose();
                  }}
                />
              ))}
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
                  className={`group relative rounded-2xl border p-3.5 cursor-pointer transition-all flex items-center gap-4 ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50/60 ring-1 ring-amber-400/50'
                      : 'border-[#e8ddd0] bg-white hover:border-amber-400'
                  }`}
                >
                  {/* Cover */}
                  <div className="w-16 h-20 sm:h-24 rounded-xl overflow-hidden border border-amber-300/80 bg-stone-900 shrink-0">
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
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold shrink-0">
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
                    className={`min-h-[44px] min-w-[44px] p-2 rounded-xl text-xs font-bold shrink-0 flex items-center justify-center active:scale-95 transition-all ${
                      isSelected
                        ? 'duo-btn-primary'
                        : 'duo-btn-secondary'
                    }`}
                    title="展开章节列表"
                    aria-label="展开章节列表"
                  >
                    <ChevronRight size={18} />
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
