import React from 'react';
import { X, BookOpen, Sparkles, Headphones, Layers, RotateCw, Library } from 'lucide-react';
import { formatEnglishText } from '../utils/vttParser';

export function BookShelfDrawer({
  isOpen,
  onClose,
  books,
  selectedBookId,
  onSelectBook,
  onRefreshCatalog,
  isRefreshing,
  isParchment
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="absolute inset-y-0 right-0 max-w-full flex w-full sm:w-auto">
        <div className="w-full sm:w-screen sm:max-w-xl flex flex-col border-l border-[#eee5d8] bg-[#fbf9f5] text-[#1e1610] transition-colors duration-300 pb-safe">
          {/* Header */}
          <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#eee5d8] bg-white flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2.5 min-w-0 flex-1">
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-700 border border-amber-300/80 shrink-0">
                <Library className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-magical font-bold text-base sm:text-xl text-amber-950 truncate">
                  霍格沃茨魔法书架 (Magic Library)
                </h3>
                <p className="text-[11px] sm:text-xs text-stone-500 truncate">原版有声小说 · 挑选你的专属英语故事</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Refresh Catalog Button */}
              <button
                onClick={onRefreshCatalog}
                disabled={isRefreshing}
                className="duo-btn-secondary min-h-[38px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
                title="重新扫描 R2 存储桶新文件"
              >
                <RotateCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">{isRefreshing ? '扫描中...' : '刷新藏书'}</span>
              </button>

              <button
                onClick={onClose}
                className="duo-touch-target rounded-xl border border-[#eee5d8] bg-white hover:bg-stone-100 text-stone-600 hover:text-amber-950 hover:border-amber-300 transition-all active:scale-90 cursor-pointer"
                title="关闭书架选单"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Book Cards Gallery */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {(books || []).filter(b => b.chapters && b.chapters.length > 0).map((book) => {
              const isSelected = book.id === selectedBookId;
              const apiBase = import.meta.env.VITE_API_BASE || '';
              const coverUrl = `${apiBase}/api/raw/podcasts/${book.id}/cover.jpg`;
              const chapterCount = (book.chapters || []).length;

              return (
                <div
                  key={book.id}
                  onClick={() => {
                    onSelectBook(book.id);
                    onClose();
                  }}
                  className={`group relative rounded-3xl border-2 p-4 cursor-pointer transition-all duration-300 flex flex-col sm:flex-row gap-4 ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-[#eee5d8] bg-white hover:border-amber-400'
                  }`}
                >
                  {/* Cover Art Image */}
                  <div className="w-24 aspect-[3/4] rounded-2xl overflow-hidden border border-amber-400/50 bg-stone-900 shrink-0 mx-auto sm:mx-0">
                    <img
                      src={coverUrl}
                      alt={book.title}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const fallback = e.target.nextElementSibling;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="w-full h-full hidden items-center justify-center bg-amber-950/30 text-amber-500 font-magical font-bold text-sm tracking-wider">
                      {book.code || 'HP'}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-center space-x-2">
                        <BookOpen size={16} className="text-amber-600 shrink-0" />
                        <h4 className="font-magical font-bold text-base text-amber-950 group-hover:text-amber-700 transition-colors truncate">
                          {book.cnTitle || book.title}
                        </h4>
                      </div>
                      <p className="text-xs text-stone-500 font-reading italic mt-0.5 truncate">
                        {book.title}
                      </p>

                      {book.description && (
                        <p className="text-xs text-stone-600 font-reading mt-2 line-clamp-2 leading-relaxed">
                          {book.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[#eee5d8] flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-xs text-stone-500">
                        <Layers size={13} className="text-amber-600" />
                        <span>共 {chapterCount} 个精听章节</span>
                      </span>

                      <span className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                        isSelected 
                          ? 'duo-btn-primary min-h-[32px] px-3 py-1 text-xs inline-flex items-center' 
                          : 'bg-stone-100 text-stone-700 border border-[#eee5d8] group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500'
                      }`}>
                        {isSelected ? '正在学习' : '进入本卷'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer note */}
          <div className="p-4 border-t border-[#eee5d8] bg-white text-center text-xs text-stone-500">
            提示：在 R2 存储桶上传新有声书或新章节后，点击右上角“刷新藏书”即可同步更新
          </div>
        </div>
      </div>
    </div>
  );
}
