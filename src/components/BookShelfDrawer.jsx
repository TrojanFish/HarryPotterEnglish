import React from 'react';
import { X, BookOpen, Sparkles, Headphones, Layers, RotateCw, Library } from 'lucide-react';

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
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-8 sm:pl-16">
        <div className={`w-screen max-w-xl shadow-2xl flex flex-col border-l transition-colors duration-300 ${
          isParchment 
            ? 'bg-[#fbf6ea] border-[#dec9a5] text-[#2c221e]' 
            : 'bg-[#101622] border-[#253245] text-[#e2d9c8]'
        }`}>
          {/* Header */}
          {/* Header */}
          <div className={`px-6 py-4 border-b flex items-center justify-between ${
            isParchment ? 'border-[#e5d6ba] bg-[#faf6ee]' : 'border-slate-800 bg-slate-900'
          }`}>
            <div className="flex items-center space-x-2.5">
              <Library className="w-6 h-6 text-amber-600" />
              <div>
                <h3 className="font-magical font-bold text-lg sm:text-xl text-amber-800">
                  霍格沃茨魔法书架 (Magic Library)
                </h3>
                <p className="text-xs text-slate-500">原版有声小说 · 挑选你的专属英语故事</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Refresh Catalog Button */}
              <button
                onClick={onRefreshCatalog}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300/80 bg-white/90 text-amber-950 hover:bg-amber-50 hover:border-amber-400 text-xs font-bold transition-all shadow-xs hover:shadow active:scale-95 cursor-pointer disabled:opacity-50"
                title="重新扫描 R2 存储桶新文件"
              >
                <RotateCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">{isRefreshing ? '扫描中...' : '刷新藏书'}</span>
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-xl border border-amber-200/80 bg-white/80 hover:bg-amber-100/70 text-slate-600 hover:text-amber-900 hover:border-amber-400 transition-all active:scale-90 shadow-2xs cursor-pointer"
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
                  className={`group relative rounded-2xl border-2 p-4 cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5 flex flex-col sm:flex-row gap-4 ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/15 shadow-md'
                      : isParchment
                        ? 'border-[#e8dcb9] bg-[#ffffff] hover:border-amber-400 hover:shadow-sm'
                        : 'border-slate-800 bg-slate-900/80 hover:border-amber-400'
                  }`}
                >
                  {/* Cover Art Image */}
                  <div className="w-24 aspect-[3/4] rounded-xl overflow-hidden border border-amber-400/50 shadow-md bg-slate-900 shrink-0 mx-auto sm:mx-0">
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
                        <h4 className="font-magical font-bold text-base text-amber-900 group-hover:text-amber-600 transition-colors truncate">
                          {book.cnTitle || book.title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 font-reading italic mt-0.5 truncate">
                        {book.title}
                      </p>

                      {book.description && (
                        <p className="text-xs text-slate-600 font-reading mt-2 line-clamp-2 leading-relaxed">
                          {book.description}
                        </p>
                      )}
                    </div>

                    <div className={`mt-3 pt-2 border-t flex items-center justify-between text-xs ${
                      isParchment ? 'border-amber-200/80' : 'border-gray-700/30'
                    }`}>
                      <span className={`flex items-center gap-1 text-xs ${
                        isParchment ? 'text-[#7a644c]' : 'text-[#8c9ba5]'
                      }`}>
                        <Layers size={13} className="text-amber-500" />
                        <span>共 {chapterCount} 个精听章节</span>
                      </span>

                      <span className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shadow-2xs group-hover:shadow-sm ${
                        isSelected 
                          ? 'bg-amber-500 text-white shadow-sm' 
                          : 'bg-amber-50 text-amber-900 border border-amber-300/80 group-hover:bg-gradient-to-r group-hover:from-amber-500 group-hover:to-amber-600 group-hover:text-white group-hover:border-amber-500'
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
          <div className="p-4 border-t border-gray-700/40 text-center text-xs text-[#8c9ba5]">
            提示：在 R2 存储桶上传新有声书或新章节后，点击右上角“刷新藏书”即可同步更新
          </div>
        </div>
      </div>
    </div>
  );
}
