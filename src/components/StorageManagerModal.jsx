import React, { useState, useEffect } from 'react';
import { 
  X, 
  HardDrive, 
  Trash2, 
  DownloadCloud, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  RefreshCw,
  FolderDown,
  Layers,
  BookOpen
} from 'lucide-react';
import { 
  getOfflineStorageInfo, 
  deleteCachedChapter, 
  saveChapterOffline, 
  isChapterCached 
} from '../utils/offlineStorage';

export function StorageManagerModal({
  isOpen,
  onClose,
  isParchment,
  currentBook,
  currentChapter,
  onPlayChapter
}) {
  const [storageInfo, setStorageInfo] = useState({
    usedBytes: 0,
    quotaBytes: 2 * 1024 * 1024 * 1024,
    chapters: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState(null); // { chapterId, progress }
  const [deletingId, setDeletingId] = useState(null);
  const [isCurrentCached, setIsCurrentCached] = useState(false);

  // Load offline storage metadata
  const refreshStorage = async () => {
    setIsLoading(true);
    try {
      const info = await getOfflineStorageInfo();
      setStorageInfo(info);
      if (currentChapter?.id) {
        const cached = await isChapterCached(currentChapter.id);
        setIsCurrentCached(cached);
      }
    } catch (err) {
      console.error('Failed to query offline storage:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshStorage();
    }
  }, [isOpen, currentChapter?.id]);

  if (!isOpen) return null;

  // Format bytes into human-readable string
  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Handle deleting a cached chapter
  const handleDelete = async (chapterId) => {
    setDeletingId(chapterId);
    try {
      await deleteCachedChapter(chapterId);
      await refreshStorage();
    } catch (err) {
      console.error('Failed to delete chapter:', err);
    } finally {
      setDeletingId(null);
    }
  };

  // Handle caching current chapter
  const handleDownloadCurrent = async () => {
    if (!currentChapter || !currentChapter.id) return;
    const chapterId = currentChapter.id;
    const title = currentChapter.title || `Chapter ${chapterId}`;
    const audioUrl = currentChapter.audioUrl || `/api/stream/audio/podcasts/${currentBook?.id || 'hp-book-1'}/episodes/${chapterId}`;
    const vttUrl = currentChapter.vttUrl || `/api/subtitles/podcasts/${currentBook?.id || 'hp-book-1'}/episodes/${chapterId}/subtitle.vtt`;

    setDownloadProgress({ chapterId, progress: 0 });

    try {
      await saveChapterOffline(
        {
          chapterId,
          title,
          audioUrl,
          vttUrl
        },
        ({ progress }) => {
          setDownloadProgress({ chapterId, progress });
        }
      );
      await refreshStorage();
    } catch (err) {
      console.error('Download failed:', err);
      alert('下载离线资源失败，请检查网络或后端代理');
    } finally {
      setDownloadProgress(null);
    }
  };

  const usedMB = (storageInfo.usedBytes / (1024 * 1024)).toFixed(1);
  const quotaMB = (storageInfo.quotaBytes / (1024 * 1024)).toFixed(0);
  const usedPercent = Math.min(100, Math.max(0, ((storageInfo.usedBytes / storageInfo.quotaBytes) * 100).toFixed(1)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className={`relative w-full max-w-2xl rounded-2xl shadow-2xl border overflow-hidden flex flex-col max-h-[85vh] transition-all duration-300 ${
          isParchment 
            ? 'bg-[#fbf6ea] border-[#dec9a5] text-[#2d1e12]' 
            : 'bg-[#0e1422] border-[#253248] text-[#e5e9f0]'
        }`}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isParchment ? 'border-[#dec9a5] bg-[#f5ecda]' : 'border-[#253248] bg-[#121929]'
        }`}>
          <div className="flex items-center space-x-2.5">
            <div className={`p-2 rounded-xl border ${
              isParchment 
                ? 'bg-[#edd8b6] border-[#cfb68d] text-[#8c6527]' 
                : 'bg-[#d3a625]/20 border-[#d3a625]/40 text-[#f3d38c]'
            }`}>
              <HardDrive size={20} />
            </div>
            <div>
              <h2 className="font-magical text-base sm:text-lg font-bold text-[#d3a625] flex items-center gap-2">
                魔法行囊 · 离线存储管理
              </h2>
              <p className={`text-xs ${isParchment ? 'text-[#7d6852]' : 'text-[#8c9ba5]'}`}>
                IndexedDB 原生双轨缓存 · 离线 MP3 极速音频与 WebVTT 同步字幕
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl border border-amber-200/80 bg-white/80 hover:bg-amber-100/70 text-slate-600 hover:text-amber-900 hover:border-amber-400 transition-all active:scale-90 shadow-2xs cursor-pointer"
            title="关闭魔法行囊"
          >
            <X size={18} />
          </button>
        </div>

        {/* Storage Quota Bar */}
        <div className={`p-5 border-b ${isParchment ? 'bg-[#fffcf4] border-[#dec9a5]' : 'bg-[#151c2c] border-[#253248]'}`}>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold flex items-center gap-1.5">
              <Layers size={14} className="text-[#d3a625]" />
              设备存储占用情况
            </span>
            <span className={`font-mono ${isParchment ? 'text-[#7d6852]' : 'text-[#8c9ba5]'}`}>
              {usedMB} MB / {quotaMB} MB ({usedPercent}%)
            </span>
          </div>
          <div className={`w-full h-3 rounded-full overflow-hidden p-0.5 border ${
            isParchment ? 'bg-[#ebdcc0] border-[#dec9a5]' : 'bg-[#0b0f16] border-[#202b3c]'
          }`}>
            <div 
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-[#d3a625] to-emerald-500 transition-all duration-500 shadow-sm"
              style={{ width: `${Math.max(usedPercent, 2)}%` }}
            />
          </div>

          {/* Quick Download Current Chapter Bar */}
          {currentChapter && (
            <div className={`mt-4 p-3 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
              isParchment ? 'bg-[#f4ebd9] border-[#dec9a5]' : 'bg-[#0f1726] border-[#253248]'
            }`}>
              <div className="flex items-center space-x-2.5 w-full sm:w-auto">
                <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-[#d3a625] truncate max-w-[280px]">
                    当前章节：{currentChapter.title || `Chapter ${currentChapter.id}`}
                  </div>
                  <div className={`text-[11px] ${isParchment ? 'text-[#7d6852]' : 'text-[#8c9ba5]'}`}>
                    {isCurrentCached ? '已保存在魔法行囊中，可 100% 离线顺畅精听' : '尚未缓存，可提前下载完整音频与字幕'}
                  </div>
                </div>
              </div>

              <div className="w-full sm:w-auto flex justify-end">
                {isCurrentCached ? (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
                    <CheckCircle2 size={14} />
                    <span>离线已就绪</span>
                  </span>
                ) : downloadProgress?.chapterId === currentChapter.id ? (
                  <div className="flex items-center gap-2 text-xs text-[#d3a625] font-semibold">
                    <RefreshCw size={14} className="animate-spin text-[#d3a625]" />
                    <span>下载中 {downloadProgress.progress}%</span>
                  </div>
                ) : (
                  <button
                    onClick={handleDownloadCurrent}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-sm hover:shadow-md active:scale-95 cursor-pointer transition-all ring-1 ring-amber-300/30"
                    title="离线缓存当前章节音频与同步字幕"
                  >
                    <DownloadCloud size={14} />
                    <span>一键缓存本章</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Cached Chapter List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className={`text-xs font-bold uppercase tracking-wider ${
              isParchment ? 'text-[#7d6852]' : 'text-[#8c9ba5]'
            }`}>
              已离线缓存章节 ({storageInfo.chapters.length})
            </h3>
            <button
              onClick={refreshStorage}
              className="text-xs flex items-center gap-1 px-2.5 py-1 rounded-xl border border-amber-300/70 bg-white/90 text-amber-900 hover:bg-amber-50 hover:border-amber-400 font-bold transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
              title="刷新本地离线存储信息"
            >
              <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
              <span>刷新</span>
            </button>
          </div>

          {storageInfo.chapters.length === 0 ? (
            <div className={`p-8 text-center rounded-2xl border border-dashed flex flex-col items-center justify-center ${
              isParchment ? 'border-[#dec9a5] bg-[#f9f3e5]' : 'border-gray-800 bg-[#0b0f16]/40'
            }`}>
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-[#d3a625] mb-2">
                <BookOpen size={24} className="text-[#d3a625]" />
              </div>
              <p className="text-sm font-semibold text-[#d3a625] mb-1">魔法行囊尚空</p>
              <p className={`text-xs max-w-sm ${isParchment ? 'text-[#7d6852]' : 'text-[#8c9ba5]'}`}>
                暂无离线下载章节。在有声书播放时点击缓存按钮，即使断网或在旅途中也能随时随地学习霍格沃茨原版音频！
              </p>
            </div>
          ) : (
            storageInfo.chapters.map((ch) => {
              const isPlayingThis = currentChapter?.id === ch.chapterId;
              const isDeleting = deletingId === ch.chapterId;

              return (
                <div
                  key={ch.chapterId}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                    isParchment 
                      ? 'bg-[#fffdf9] border-[#dec9a5] hover:border-[#8c6527]' 
                      : 'bg-[#121929] border-[#253248] hover:border-[#d3a625]/60'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                      isPlayingThis
                        ? 'bg-[#d3a625] text-black font-bold border-[#d3a625]'
                        : isParchment
                        ? 'bg-[#f0e2ca] text-[#8c6527] border-[#dec9a5]'
                        : 'bg-[#1a2336] text-[#f3d38c] border-[#2e3e59]'
                    }`}>
                      <CheckCircle2 size={16} />
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#d3a625] truncate">
                        {ch.title}
                      </div>
                      <div className={`text-[11px] flex items-center gap-2 mt-0.5 ${
                        isParchment ? 'text-[#7d6852]' : 'text-[#8c9ba5]'
                      }`}>
                        <span>大小: {formatBytes(ch.totalBytes)}</span>
                        <span>•</span>
                        <span>{new Date(ch.downloadedAt).toLocaleDateString()}</span>
                        {isPlayingThis && (
                          <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded text-[9px] font-bold">
                            正在播放
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {onPlayChapter && !isPlayingThis && (
                      <button
                        onClick={() => onPlayChapter(ch.chapterId)}
                        className="px-3 py-1.5 rounded-xl border border-amber-300/80 bg-white/90 hover:bg-amber-50 text-amber-950 hover:border-amber-400 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs hover:shadow active:scale-95 cursor-pointer"
                        title="立即从离线本地播放此章"
                      >
                        <Play size={13} fill="currentColor" />
                        <span className="hidden sm:inline">本地播放</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(ch.chapterId)}
                      disabled={isDeleting}
                      className="p-2 rounded-xl border border-rose-300/80 bg-rose-50/70 text-rose-600 hover:bg-rose-100 hover:border-rose-400 transition-all active:scale-90 cursor-pointer disabled:opacity-50"
                      title="删除此离线缓存以释放存储"
                    >
                      <Trash2 size={14} className={isDeleting ? 'animate-spin' : ''} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-3 border-t flex items-center justify-between text-xs ${
          isParchment ? 'border-[#dec9a5] bg-[#f5ecda]' : 'border-[#253248] bg-[#121929]'
        }`}>
          <span className={`text-[11px] ${isParchment ? 'text-[#7d6852]' : 'text-[#8c9ba5]'}`}>
            基于 HTML5 Blob URL 技术 · 断网即点即听
          </span>
          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-xl border border-amber-300/90 bg-white text-amber-950 font-bold hover:bg-amber-50 hover:border-amber-400 transition-all shadow-xs hover:shadow active:scale-95 cursor-pointer"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
}
