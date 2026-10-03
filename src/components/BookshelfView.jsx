import React, { useState } from 'react';
import { 
  BookOpen, 
  Play, 
  Pause, 
  Flame, 
  Headphones, 
  Bookmark, 
  HardDrive, 
  Sparkles, 
  ChevronRight, 
  Layers, 
  Award, 
  X, 
  Clock, 
  Compass, 
  CheckCircle2, 
  Search,
  BrainCircuit,
  RotateCcw
} from 'lucide-react';
import { formatTime } from '../utils/vttParser';
import { DailyGoalRing } from './DailyGoalRing';

/**
 * BookshelfView — Classical iBooks-style Bookshelf for Young English Learners.
 * - Warm wooden / aged parchment bookshelf with 3D physical book rendering
 * - "上次学到" 1-click resume hero card
 * - Elementary / Junior High reading level tags with pure Chinese annotations
 * - Zero emojis, clean Lucide iconography
 * - Seamless floating mini-player when listening in background
 */
export function BookshelfView({
  books = [],
  selectedBook,
  selectedChapter,
  onSelectBook,
  onSelectChapter,
  onEnterPlayer,
  isPlaying,
  onTogglePlay,
  currentTime = 0,
  duration = 0,
  activeCue,
  streakDays = 0,
  vocabCount = 0,
  cachedChaptersCount = 0,
  todayListeningSeconds = 0,
  timeTurnersCount = 1,
  dueWordsCount = 0,
  isParchment,
  onOpenVocab,
  onOpenAnalytics,
  onOpenStorage,
  onOpenSrs
}) {
  // Modal state for viewing a specific book's chapters
  const [inspectingBook, setInspectingBook] = useState(null);
  const [chapterSearch, setChapterSearch] = useState('');
  const [coverErrorMap, setCoverErrorMap] = useState({});

  // Time-of-day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return '早安，霍格沃茨学徒！';
    if (hour >= 12 && hour < 18) return '下午好，霍格沃茨学徒！';
    return '晚上好，霍格沃茨学徒！';
  };

  // Filter only books that actually have audio files/chapters
  const displayBooks = (books || []).filter(b => b.chapters && b.chapters.length > 0);

  // Find active book & chapter objects
  const currentBookObj = displayBooks.find(b => b.id === selectedBook) || displayBooks[0];
  const currentChapterObj = currentBookObj 
    ? (currentBookObj.chapters || []).find(c => c.id === selectedChapter) || (currentBookObj.chapters || [])[0]
    : null;

  // Reading level tags based on book ID and metadata
  const getReadingLevelBadge = (book, index) => {
    const bookId = (book?.id || '').toLowerCase();
    const title = (book?.title || '').toLowerCase();
    
    if (bookId.includes('book-1') || title.includes('sorcerer') || title.includes('philosopher')) {
      return {
        level: '入门基础级',
        desc: '基础词汇 500+ · 纯中文释义 · 语速温和适中',
        ribbon: '魔法石 · 入门首选',
        ribbonColor: 'bg-amber-600 text-amber-100'
      };
    }
    if (bookId.includes('book-2') || title.includes('chamber')) {
      return {
        level: '初级进阶级',
        desc: '拓展词汇 700+ · 紧凑叙事 · 强化辨音能力',
        ribbon: '密室 · 冒险升级',
        ribbonColor: 'bg-emerald-700 text-emerald-100'
      };
    }
    if (bookId.includes('book-3') || title.includes('azkaban')) {
      return {
        level: '中阶挑战级',
        desc: '原版精读 900+ · 丰富句式 · 初中进阶首选',
        ribbon: '阿兹卡班 · 进阶挑战',
        ribbonColor: 'bg-blue-800 text-blue-100'
      };
    }
    if (bookId.includes('prince') || title.includes('prince')) {
      return {
        level: '双语名著级',
        desc: '词汇 600+ · 纯美哲理 · 朗读优美治愈',
        ribbon: '小王子 · 世界名著',
        ribbonColor: 'bg-indigo-700 text-indigo-100'
      };
    }
    if (bookId.includes('tales') || title.includes('tale') || bookId.includes('tiny')) {
      return {
        level: '童话启蒙级',
        desc: '启蒙词汇 300+ · 简易绘本 · 趣味小故事',
        ribbon: '微光童话 · 快乐启蒙',
        ribbonColor: 'bg-rose-700 text-rose-100'
      };
    }
    return {
      level: '精选有声级',
      desc: `全书共收录 ${(book?.chapters || []).length} 个精听章节 · 原版同步`,
      ribbon: '原版精选',
      ribbonColor: 'bg-amber-700 text-amber-100'
    };
  };

  const handleImageError = (bookId) => {
    setCoverErrorMap(prev => ({ ...prev, [bookId]: true }));
  };

  const resumeProgressPercent = duration > 0 ? Math.round((currentTime / duration) * 100) : 0;

  return (
    <div className="flex-1 overflow-y-auto pb-28 pt-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full select-none">
      
      {/* ── 1. Student Greeting & Achievement Status Strip ───────────── */}
      <section className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-600">
              <Sparkles size={18} />
            </span>
            <h2 className="font-magical font-bold text-xl sm:text-2xl text-amber-900">
              {getGreeting()}
            </h2>
          </div>
          <p className={`text-xs sm:text-sm font-reading ${isParchment ? 'text-[#7a6448]' : 'text-slate-400'}`}>
            欢迎来到霍格沃茨原版英语有声书房 · 选一本故事，磨亮你的英语魔杖
          </p>
        </div>

        {/* Quick Achievement Chips */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Daily 5-Min Goal Progress Ring */}
          <DailyGoalRing
            todaySeconds={todayListeningSeconds}
            targetSeconds={300}
            onClick={onOpenAnalytics}
            isParchment={isParchment}
          />

          {/* Streak */}
          <button 
            onClick={onOpenAnalytics}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300/80 bg-white/90 hover:bg-amber-50 text-amber-950 hover:border-amber-400 font-bold transition-all shadow-xs hover:shadow active:scale-95 cursor-pointer"
            title="查看霍格沃茨学业数据罗盘"
          >
            <Flame size={14} className="text-orange-500" />
            <span>连续打卡 {streakDays} 天</span>
          </button>

          {/* Duolingo Time-Turner Streak Freeze Badge */}
          <div 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300/80 bg-amber-50/90 text-amber-950 font-bold transition-all shadow-xs"
            title="时间转换器守护中：若某天漏打卡将自动消耗1个护体，保住连胜"
          >
            <RotateCcw size={13} className="text-amber-700 animate-spin-slow" />
            <span>转换器 x{timeTurnersCount}</span>
          </div>

          {/* Duolingo Spaced Repetition Flashcards Action */}
          {dueWordsCount > 0 ? (
            <button 
              onClick={onOpenSrs}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-amber-500 bg-amber-500 hover:bg-amber-600 text-white font-bold transition-all shadow-md active:scale-95 cursor-pointer animate-pulse"
              title="今日有生词等待艾宾浩斯智能翻转闪卡复习"
            >
              <BrainCircuit size={14} className="text-amber-100" />
              <span>今日待复习 ({dueWordsCount} 词)</span>
            </button>
          ) : vocabCount > 0 ? (
            <button 
              onClick={onOpenSrs}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300/80 bg-white/90 hover:bg-amber-50 text-amber-950 hover:border-amber-400 font-bold transition-all shadow-xs hover:shadow active:scale-95 cursor-pointer"
              title="进入艾宾浩斯智能翻转闪卡强化记忆"
            >
              <BrainCircuit size={14} className="text-amber-600" />
              <span>智能翻卡</span>
            </button>
          ) : null}

          {/* Vocab Notebook */}
          <button 
            onClick={onOpenVocab}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300/80 bg-white/90 hover:bg-amber-50 text-amber-950 hover:border-amber-400 font-bold transition-all shadow-xs hover:shadow active:scale-95 cursor-pointer"
            title="打开魔法生词本"
          >
            <Bookmark size={14} className="text-amber-600" />
            <span>生词本 {vocabCount} 词</span>
          </button>

          {/* Offline Cache */}
          <button 
            onClick={onOpenStorage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300/80 bg-emerald-50/80 hover:bg-emerald-100/70 text-emerald-950 hover:border-emerald-400 font-bold transition-all shadow-xs hover:shadow active:scale-95 cursor-pointer"
            title="管理离线魔法行囊缓存"
          >
            <HardDrive size={14} className="text-emerald-600" />
            <span>已下载 {cachedChaptersCount} 章</span>
          </button>
        </div>
      </section>

      {/* ── 2. "上次学到 · 随时续播" Hero Card ─────────────────────────── */}
      {currentBookObj && currentChapterObj && (
        <section className="mb-10">
          <div className={`relative overflow-hidden rounded-3xl p-5 sm:p-7 border-2 transition-all shadow-lg ${
            isParchment 
              ? 'bg-gradient-to-r from-[#ffffff] via-[#fbf7ee] to-[#f5ecda] border-[#e2d2b4]' 
              : 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-amber-500/30'
          }`}>
            
            {/* Background Crest Watermark Accent */}
            <div className="absolute right-4 -bottom-6 pointer-events-none opacity-5 text-amber-600">
              <Compass size={220} />
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
              {/* 3D Floating Book Preview */}
              <div 
                onClick={onEnterPlayer}
                className="w-24 sm:w-28 aspect-[3/4] rounded-xl overflow-hidden border-2 border-amber-400/80 shadow-2xl shrink-0 cursor-pointer ibooks-book ibooks-book-spine bg-slate-900 relative group"
                title="点击进入播放器"
              >
                {!coverErrorMap[currentBookObj.id] ? (
                  <img 
                    src={`/api/raw/podcasts/${currentBookObj.id}/cover.jpg`}
                    alt={currentBookObj.title}
                    onError={() => handleImageError(currentBookObj.id)}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-amber-950/40 text-amber-400">
                    <BookOpen size={24} className="mb-1" />
                    <span className="font-magical text-xs font-bold">{currentBookObj.code || 'HP'}</span>
                  </div>
                )}
                {/* Glow Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                <span className="absolute bottom-1.5 left-0 right-0 text-center font-magical text-[10px] text-amber-200 font-bold">
                  {currentBookObj.code || 'HP'}
                </span>
              </div>

              {/* Information Column */}
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-800 text-xs font-bold mb-2">
                  <Clock size={12} />
                  <span>上次学习进度 · 随时无缝续播</span>
                </div>

                <h3 className="font-magical font-bold text-lg sm:text-xl text-amber-950 truncate">
                  {currentBookObj.cnTitle || currentBookObj.title}
                </h3>
                <p className="text-xs font-reading italic text-slate-500 mb-3 truncate">
                  {currentBookObj.title}
                </p>

                {/* Current Chapter Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                    <span className="text-amber-700 font-bold truncate">
                      第 {currentChapterObj.number || 1} 章 · {currentChapterObj.cnTitle || currentChapterObj.title}
                    </span>
                    <span className="text-slate-500 shrink-0 font-mono ml-2">
                      {resumeProgressPercent > 0 ? `已听 ${resumeProgressPercent}%` : '即刻开启'}
                    </span>
                  </div>

                  {/* Progress Line */}
                  <div className="w-full h-2 rounded-full bg-amber-100/80 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(5, resumeProgressPercent)}%` }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <button
                    onClick={onEnterPlayer}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-sm shadow-md hover:shadow-lg active:scale-95 cursor-pointer transition-all ring-1 ring-amber-300/30"
                    title="立即进入精听教室并继续播放"
                  >
                    <Play size={16} className="fill-current" />
                    <span>继续精听本章</span>
                  </button>

                  <button
                    onClick={() => setInspectingBook(currentBookObj)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-amber-300/90 bg-white/95 hover:bg-amber-50/90 text-amber-950 hover:border-amber-400 font-bold text-xs sm:text-sm shadow-xs hover:shadow active:scale-95 cursor-pointer transition-all"
                    title="浏览《哈利·波特》完整章节目录"
                  >
                    <Layers size={15} />
                    <span>查看完整章节目录</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── 3. Classical iBooks Wooden Bookshelf Gallery ───────────────── */}
      <section className="mb-14">
        {/* Section Title */}
        <div className="flex items-center justify-between mb-8 pb-3 border-b border-amber-200/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="font-magical font-bold text-lg sm:text-xl text-amber-950">
                霍格沃茨魔法书架
              </h2>
              <p className="text-xs text-slate-500">
                专为中小学英语进阶设计 · 难度由浅入深 · 纯中文对照辅助
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-xs text-amber-700 bg-amber-500/10 px-3 py-1.5 rounded-full font-bold">
            <Award size={13} />
            <span>全套收录 · 随点随听</span>
          </div>
        </div>

        {/* Bookshelf Rows Grid */}
        <div className="space-y-12">
          {displayBooks.map((book, bookIdx) => {
            const levelInfo = getReadingLevelBadge(book, bookIdx);
            const chapters = book.chapters || [];
            const isCurrentlySelected = book.id === selectedBook;

            return (
              <div key={book.id} className="relative">
                {/* Book Card Display standing on the shelf plank */}
                <div className="flex flex-col md:flex-row items-center md:items-end gap-6 px-4 pb-3">
                  
                  {/* Physical 3D Book on the Shelf */}
                  <div 
                    onClick={() => setInspectingBook(book)}
                    className="relative group cursor-pointer ibooks-book shrink-0"
                    title={`点击翻开《${book.cnTitle || book.title}》章节选单`}
                  >
                    {/* Ribbon Bookmark draped from top */}
                    <div className={`absolute -top-3 right-4 z-20 px-2 py-0.5 rounded-b-md text-[10px] font-bold shadow-md tracking-wider ${levelInfo.ribbonColor}`}>
                      {levelInfo.ribbon}
                    </div>

                    {/* Book Cover with Spine & Shadow */}
                    <div className="w-36 sm:w-44 aspect-[3/4] rounded-r-xl rounded-l-sm overflow-hidden border-2 border-amber-400/80 ibooks-book-spine bg-slate-900 relative">
                      {!coverErrorMap[book.id] ? (
                        <img 
                          src={`/api/raw/podcasts/${book.id}/cover.jpg`}
                          alt={book.title}
                          onError={() => handleImageError(book.id)}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-amber-950/40 text-amber-400">
                          <BookOpen size={32} className="mb-2" />
                          <span className="font-magical text-base font-bold">{book.code || 'HP'}</span>
                          <span className="text-[11px] text-amber-300 mt-1 line-clamp-2">{book.cnTitle || book.title}</span>
                        </div>
                      )}

                      {/* Gloss sheen overlay */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity" />

                      {/* Spine Crease Visual Highlight */}
                      <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/40 via-transparent to-transparent pointer-events-none" />
                    </div>
                  </div>

                  {/* Book Metadata & Action Controls next to the book */}
                  <div className="flex-1 min-w-0 text-center md:text-left space-y-2.5 pb-2">
                    {/* Level Pill */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-900 text-xs font-bold">
                      <Sparkles size={12} className="text-amber-600" />
                      <span>{levelInfo.level}</span>
                      <span className="text-slate-400">|</span>
                      <span className="font-normal">{levelInfo.desc}</span>
                    </div>

                    <h3 className="font-magical font-bold text-xl sm:text-2xl text-amber-950">
                      {book.cnTitle || book.title}
                    </h3>
                    <p className="text-xs sm:text-sm font-reading italic text-slate-500 line-clamp-2">
                      {book.description || book.title}
                    </p>

                    <div className="flex items-center justify-center md:justify-start gap-4 text-xs font-semibold text-slate-600">
                      <span className="flex items-center gap-1">
                        <Layers size={14} className="text-amber-500" />
                        <span>共 {chapters.length} 个精听章节</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        <span>逐句音频同步</span>
                      </span>
                    </div>

                    {/* Book Actions */}
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1">
                      <button
                        onClick={() => {
                          onSelectBook(book.id);
                          if (chapters.length > 0) {
                            onSelectChapter(chapters[0].id, true);
                          }
                          onEnterPlayer();
                        }}
                        className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs sm:text-sm shadow-sm hover:shadow-md active:scale-95 cursor-pointer transition-all ring-1 ring-amber-300/30"
                        title={`从第一章开始精听《${book.cnTitle || book.title}》`}
                      >
                        <Play size={14} className="fill-current" />
                        <span>从第一章开始精听</span>
                      </button>

                      <button
                        onClick={() => setInspectingBook(book)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-amber-300/80 bg-white/90 hover:bg-amber-50 text-amber-950 hover:border-amber-400 font-bold text-xs sm:text-sm shadow-xs hover:shadow active:scale-95 cursor-pointer transition-all"
                        title={`翻开《${book.cnTitle || book.title}》完整章节选单`}
                      >
                        <Layers size={14} />
                        <span>翻开章节目录</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Realistic iBooks Wooden Shelf Plank with Brass Archive Plaque */}
                <div className="relative mt-2">
                  <div className="ibooks-shelf-plank w-full flex items-center justify-between px-6 overflow-hidden">
                    <div className="h-[2px] w-16 bg-gradient-to-r from-transparent via-amber-100/50 to-transparent rounded-full" />
                    <div className="text-[10px] font-magical font-bold text-[#5c3e16] tracking-widest uppercase opacity-80 flex items-center gap-1.5 py-0.5">
                      <Sparkles size={9} className="text-amber-700/70" />
                      <span>Hogwarts Archive · {book.code || 'HP'} · 《{book.cnTitle || book.title}》</span>
                      <Sparkles size={9} className="text-amber-700/70" />
                    </div>
                    <div className="h-[2px] w-16 bg-gradient-to-r from-transparent via-amber-100/50 to-transparent rounded-full" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 4. Chapter Selection Drawer / Modal ───────────────────────── */}
      {inspectingBook && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => { setInspectingBook(null); setChapterSearch(''); }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl border-2 shadow-2xl overflow-hidden transition-all ${
              isParchment 
                ? 'bg-[#fbf8f2] border-[#e2d2b4] text-[#2d241c]' 
                : 'bg-slate-900 border-amber-500/40 text-slate-100'
            }`}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-amber-200/60 flex items-center justify-between shrink-0 bg-amber-500/5">
              <div className="flex items-center gap-3">
                <div className="w-12 aspect-[3/4] rounded-lg overflow-hidden border border-amber-400 shadow-sm shrink-0 bg-slate-900">
                  {!coverErrorMap[inspectingBook.id] ? (
                    <img 
                      src={`/api/raw/podcasts/${inspectingBook.id}/cover.jpg`} 
                      alt="Cover" 
                      className="w-full h-full object-cover" 
                      onError={() => handleImageError(inspectingBook.id)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-magical text-amber-500 font-bold text-xs">
                      {inspectingBook.code || 'HP'}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-magical font-bold text-base sm:text-lg text-amber-950">
                    {inspectingBook.cnTitle || inspectingBook.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-reading italic">
                    全卷共 {(inspectingBook.chapters || []).length} 个精听章节
                  </p>
                </div>
              </div>

              <button 
                onClick={() => {
                  setInspectingBook(null);
                  setChapterSearch('');
                }}
                className="p-2 rounded-xl border border-amber-200/80 bg-white/80 hover:bg-amber-100/70 text-slate-600 hover:text-amber-900 hover:border-amber-400 transition-all active:scale-90 shadow-2xs cursor-pointer"
                title="关闭章节目录"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Search Input */}
            <div className="px-5 pt-3 pb-1 shrink-0">
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={chapterSearch}
                  onChange={(e) => setChapterSearch(e.target.value)}
                  placeholder="按关键词快速筛选章节（如：第一章、Boy、魔药）..."
                  className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs font-reading border focus:outline-none transition-all ${
                    isParchment 
                      ? 'bg-white border-amber-200 text-amber-950 focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20' 
                      : 'bg-slate-800 border-slate-700 text-slate-200 focus:border-amber-400'
                  }`}
                />
                {chapterSearch && (
                  <button
                    onClick={() => setChapterSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 active:scale-90 cursor-pointer transition-all"
                    title="清空搜索"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Chapters List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5">
              {(inspectingBook.chapters || [])
                .filter(ch => {
                  if (!chapterSearch.trim()) return true;
                  const q = chapterSearch.toLowerCase();
                  return (ch.title || '').toLowerCase().includes(q) || (ch.cnTitle || '').includes(q) || String(ch.number).includes(q);
                })
                .map((ch, idx) => {
                const isCurrent = inspectingBook.id === selectedBook && ch.id === selectedChapter;
                return (
                  <div
                    key={ch.id}
                    onClick={() => {
                      onSelectBook(inspectingBook.id);
                      onSelectChapter(ch.id, true);
                      setInspectingBook(null);
                      onEnterPlayer();
                    }}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                      isCurrent 
                        ? 'border-amber-500 bg-amber-500/15 shadow-sm' 
                        : isParchment 
                          ? 'border-[#e8dcb9] bg-white hover:border-amber-400 hover:shadow-sm' 
                          : 'border-slate-800 bg-slate-800/60 hover:border-amber-400'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-magical font-bold text-xs shrink-0 ${
                        isCurrent 
                          ? 'bg-amber-500 text-white shadow' 
                          : 'bg-amber-500/20 text-amber-800'
                      }`}>
                        {ch.number || idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-magical font-bold text-sm text-amber-950 dark:text-amber-200 truncate">
                            {ch.cnTitle || ch.title}
                          </h4>
                          {isCurrent && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold shrink-0">
                              上次在此
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 font-reading italic truncate">
                          {ch.title}
                        </p>
                      </div>
                    </div>

                    <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-amber-300/60 bg-amber-500/15 hover:bg-gradient-to-r hover:from-amber-500 hover:to-amber-600 text-amber-900 hover:text-white text-xs font-bold shrink-0 shadow-2xs hover:shadow-sm active:scale-95 cursor-pointer transition-all">
                      <Play size={12} className="fill-current" />
                      <span>开始精听</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── 5. Floating Mini-Player Capsule (when audio is active) ─────── */}
      {(currentTime > 0 || isPlaying) && currentChapterObj && (
        <div className="fixed bottom-4 left-4 right-4 max-w-3xl mx-auto z-40 animate-fade-in">
          <div className={`relative p-3 sm:p-4 rounded-3xl border-2 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 overflow-hidden ${
            isParchment 
              ? 'bg-[#ffffff]/95 border-amber-300 text-[#2d241c] shadow-[0_8px_30px_rgba(180,140,70,0.2)]' 
              : 'bg-slate-900/95 border-amber-500/50 text-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.5)]'
          }`}>
            {/* Top Slim Audio Scrubber Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500/15">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-200"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
            
            {/* Play/Pause & Soundwave indicator */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                onClick={onTogglePlay}
                className="w-12 h-12 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 text-white flex items-center justify-center shrink-0 shadow-md hover:shadow-lg active:scale-95 cursor-pointer transition-all ring-2 ring-white/60 hover:from-amber-600 hover:to-amber-700"
                title={isPlaying ? '暂停音频 (空格键)' : '继续播放 (空格键)'}
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} className="fill-current ml-0.5" />}
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {isPlaying && (
                    <span className="flex items-center gap-0.5 text-amber-500 shrink-0">
                      <span className="w-1 h-3 bg-amber-500 rounded-full animate-wave-1" />
                      <span className="w-1 h-4 bg-amber-600 rounded-full animate-wave-2" />
                      <span className="w-1 h-2 bg-amber-500 rounded-full animate-wave-3" />
                    </span>
                  )}
                  <h4 className="font-magical font-bold text-xs sm:text-sm text-amber-900 dark:text-amber-300 truncate">
                    {currentChapterObj.cnTitle || currentChapterObj.title}
                  </h4>
                  <span className="text-[11px] text-slate-500 font-mono shrink-0">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                {/* Subtitle Cue Preview */}
                {activeCue && (
                  <p className="text-xs font-reading text-slate-600 dark:text-slate-300 truncate mt-0.5">
                    {activeCue.text}
                  </p>
                )}
              </div>
            </div>

            {/* Enter Full Player CTA Button */}
            <button
              onClick={onEnterPlayer}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-sm hover:shadow-md active:scale-95 text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer"
              title="进入全功能精听教室（字幕、查词、跟读、听写）"
            >
              <span>进入精听教室</span>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default BookshelfView;
