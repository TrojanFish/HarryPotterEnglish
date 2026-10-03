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
import { formatTime, formatEnglishText } from '../utils/vttParser';
import { DailyGoalRing } from './DailyGoalRing';

/**
 * Modern Duolingo-styled BookshelfView for Young English Learners.
 * - Clean ivory parchment surfaces with modern soft ambient shadows
 * - 3-Card Gamified Quest Dashboard (5-Min Daily Goal, Streak Shield, Leitner Flashcards)
 * - Hero Card: Instant 1-click continuation of current adventure
 * - Modern 3D Story Card Grid with CEFR levels and tactile buttons (no dated wooden ladders)
 * - Zero emojis, crisp typography, and touch accessibility
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
        ribbonColor: 'bg-amber-600 text-amber-50'
      };
    }
    if (bookId.includes('book-2') || title.includes('chamber')) {
      return {
        level: '初级进阶级',
        desc: '拓展词汇 700+ · 紧凑叙事 · 强化辨音能力',
        ribbon: '密室 · 冒险升级',
        ribbonColor: 'bg-emerald-700 text-emerald-50'
      };
    }
    if (bookId.includes('book-3') || title.includes('azkaban')) {
      return {
        level: '中阶挑战级',
        desc: '原版精读 900+ · 丰富句式 · 初中进阶首选',
        ribbon: '阿兹卡班 · 进阶挑战',
        ribbonColor: 'bg-blue-800 text-blue-50'
      };
    }
    if (bookId.includes('prince') || title.includes('prince')) {
      return {
        level: '双语名著级',
        desc: '词汇 600+ · 纯美哲理 · 朗读优美治愈',
        ribbon: '小王子 · 世界名著',
        ribbonColor: 'bg-indigo-700 text-indigo-50'
      };
    }
    if (bookId.includes('tales') || title.includes('tale') || bookId.includes('tiny')) {
      return {
        level: '童话启蒙级',
        desc: '启蒙词汇 300+ · 简易绘本 · 趣味小故事',
        ribbon: '微光童话 · 快乐启蒙',
        ribbonColor: 'bg-rose-700 text-rose-50'
      };
    }
    return {
      level: '精选有声级',
      desc: `全书共收录 ${(book?.chapters || []).length} 个精听章节 · 原版同步`,
      ribbon: '原版精选',
      ribbonColor: 'bg-amber-700 text-amber-50'
    };
  };

  const handleImageError = (bookId) => {
    setCoverErrorMap(prev => ({ ...prev, [bookId]: true }));
  };

  const resumeProgressPercent = duration > 0 ? Math.round((currentTime / duration) * 100) : 0;

  return (
    <div className="flex-1 overflow-y-auto pb-64 sm:pb-32 pt-4 sm:pt-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full select-none">
      
      {/* ── 1. Unified Student Quest & Resume Hub ───────────────────── */}
      <section className="mb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1.5 rounded-xl bg-amber-500/15 text-amber-600 shadow-2xs">
                <Sparkles size={18} />
              </span>
              <h2 className="font-magical font-bold text-2xl sm:text-3xl text-amber-950 tracking-tight">
                {getGreeting()}
              </h2>
            </div>
            <p className="text-xs sm:text-sm font-reading text-[#7a6448]">
              选一本魔法故事，开启今日听力探险 · 每日 5 分钟，磨亮你的英语魔杖
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenStorage}
              className="duo-pill text-xs hover:border-emerald-400 group cursor-pointer"
              title="查看已下载离线章节"
            >
              <HardDrive size={13} className="text-emerald-700 group-hover:scale-110 transition-transform" />
              <span>已下载 {cachedChaptersCount} 章</span>
            </button>
            <button
              onClick={onOpenVocab}
              className="duo-pill text-xs hover:border-amber-400 group cursor-pointer"
              title="打开魔法生词本"
            >
              <Bookmark size={13} className="text-amber-700 group-hover:scale-110 transition-transform" />
              <span>生词本 {vocabCount} 词</span>
            </button>
          </div>
        </div>

        {/* Unified Dashboard Grid: Left Hero Continue Card (7 cols) + Right Quest Cards (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Left: Compact, Sleek Continue Adventure Card */}
          {currentBookObj && currentChapterObj ? (
            <div className="lg:col-span-7 duo-card p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden border-2 border-amber-300/80 shadow-md">
              <div className="flex items-start gap-4 sm:gap-5 min-w-0">
                {/* 3D Floating Book Preview (Compact) */}
                <div 
                  onClick={onEnterPlayer}
                  className="w-20 sm:w-24 aspect-[3/4] rounded-xl overflow-hidden border-2 border-amber-400 shadow-lg shrink-0 cursor-pointer ibooks-book ibooks-book-spine bg-slate-900 relative group transition-transform hover:scale-105"
                  title="点击直接进入精听教室"
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
                      <BookOpen size={22} className="mb-1" />
                      <span className="font-magical text-[10px] font-bold">{currentBookObj.code || 'HP'}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Info Column */}
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-900 text-[11px] font-bold border border-amber-300/40">
                    <Clock size={11} className="text-amber-700" />
                    <span>上次研读进度 · 随时续播</span>
                  </div>

                  <h3 className="font-magical font-bold text-lg sm:text-xl text-amber-950 truncate">
                    {currentBookObj.cnTitle || currentBookObj.title}
                  </h3>

                  <p className="text-xs font-semibold text-amber-800 truncate">
                    第 {currentChapterObj.number || 1} 章 · {currentChapterObj.cnTitle || currentChapterObj.title}
                  </p>

                  {/* Progress Line */}
                  <div className="pt-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1">
                      <span>本章进度</span>
                      <span className="font-mono text-amber-700 font-bold">{resumeProgressPercent > 0 ? `已听 ${resumeProgressPercent}%` : '即刻开启'}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-amber-100 overflow-hidden border border-amber-200/80">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(5, resumeProgressPercent)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 pt-4 mt-3 border-t border-[#f0e6d6]">
                <button
                  onClick={onEnterPlayer}
                  className="duo-btn-primary flex-1 min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 shadow-sm"
                  title="立即进入精听教室并继续播放"
                >
                  <Play size={14} className="fill-current" />
                  <span>继续精听本章</span>
                </button>

                <button
                  onClick={() => setInspectingBook(currentBookObj)}
                  className="duo-btn-secondary min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-2xs"
                  title="浏览完整章节目录"
                >
                  <Layers size={13} />
                  <span>目录</span>
                </button>
              </div>
            </div>
          ) : null}

          {/* Right: 3 Compact Gamified Quest Cards */}
          <div className={`${currentBookObj && currentChapterObj ? 'lg:col-span-5' : 'lg:col-span-12'} flex flex-col justify-between gap-3`}>
            
            {/* Card 1: 5-Minute Daily Goal Progress */}
            <div 
              onClick={onOpenAnalytics}
              className="duo-card duo-card-hover p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer flex-1"
              title="点击查看学业罗盘与今日听力分布"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 mb-0.5">
                  <Sparkles size={13} className="text-amber-600" />
                  <span>今日 5 分钟契约</span>
                </div>
                <h4 className="font-magical font-bold text-base text-amber-950 truncate">
                  {todayListeningSeconds >= 300 ? '今日契约已达成！' : `还差 ${Math.max(1, Math.ceil((300 - todayListeningSeconds) / 60))} 分钟`}
                </h4>
                <p className="text-[11px] text-slate-500 font-reading">
                  已精听 {Math.floor(todayListeningSeconds / 60)} 分钟 · 达成获魔力石
                </p>
              </div>
              <div className="shrink-0 scale-90">
                <DailyGoalRing
                  todaySeconds={todayListeningSeconds}
                  targetSeconds={300}
                  onClick={onOpenAnalytics}
                  isParchment={isParchment}
                />
              </div>
            </div>

            {/* Card 2: Streak & Time-Turner Freeze Shield */}
            <div 
              onClick={onOpenAnalytics}
              className="duo-card duo-card-hover p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer flex-1"
              title="点击查看连胜记录与时间转换器状态"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-orange-700 mb-0.5">
                  <Flame size={13} className="text-orange-500" />
                  <span>连续打卡天数</span>
                </div>
                <h4 className="font-magical font-bold text-base text-amber-950 truncate flex items-center gap-1.5">
                  <span>{streakDays} 天连胜</span>
                  {streakDays >= 3 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-bold border border-orange-200">
                      连击
                    </span>
                  )}
                </h4>
                <div className="flex items-center gap-1 text-[11px] text-amber-800 font-reading">
                  <RotateCcw size={10} className="text-amber-600 animate-spin-slow" />
                  <span>转换器 x{timeTurnersCount} (漏卡自动护体)</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0 shadow-2xs">
                <Flame size={20} />
              </div>
            </div>

            {/* Card 3: Duolingo Leitner SRS Review Card */}
            <div 
              onClick={onOpenSrs}
              className="duo-card duo-card-hover p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer flex-1"
              title="进入艾宾浩斯智能翻转闪卡强化记忆"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 mb-0.5">
                  <BrainCircuit size={13} className="text-indigo-600" />
                  <span>艾宾浩斯记忆重铸</span>
                </div>
                <h4 className="font-magical font-bold text-base text-amber-950 truncate">
                  {dueWordsCount > 0 ? `${dueWordsCount} 词封印松动` : '记忆封印稳固'}
                </h4>
                <p className="text-[11px] text-slate-500 font-reading">
                  {dueWordsCount > 0 ? '复习期已到，点击重铸' : `共收录 ${vocabCount} 词`}
                </p>
              </div>
              <div className="shrink-0">
                {dueWordsCount > 0 ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); onOpenSrs(); }}
                    className="duo-btn-primary min-h-[36px] px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-sm animate-pulse"
                  >
                    <span>重炼</span>
                    <ChevronRight size={12} />
                  </button>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-2xs">
                    <BrainCircuit size={20} />
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── 3. Modern Story Library Cards Grid (No Wooden Planks) ──── */}
      <section className="mb-14">
        {/* Section Title */}
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#eee4d5]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-amber-500/15 text-amber-700">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="font-magical font-bold text-xl sm:text-2xl text-amber-950">
                霍格沃茨魔法书架
              </h2>
              <p className="text-xs text-slate-500 font-reading">
                专为中小学英语进阶设计 · 难度由浅入深 · 逐句原版原音同步
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-amber-900 bg-amber-500/10 px-3.5 py-1.5 rounded-full font-bold border border-amber-300/40">
            <Award size={14} className="text-amber-600" />
            <span>全套收录 · 随点随听</span>
          </div>
        </div>

        {/* Modern 3-Column / 2-Column Responsive Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {displayBooks.map((book, bookIdx) => {
            const levelInfo = getReadingLevelBadge(book, bookIdx);
            const chapters = book.chapters || [];
            const isCurrentlySelected = book.id === selectedBook;

            return (
              <div 
                key={book.id} 
                className="duo-card duo-card-hover p-6 flex flex-col justify-between relative group overflow-hidden border-2 hover:border-amber-400"
              >
                {/* Level Ribbon draped from top right */}
                <div className={`absolute top-0 right-6 z-20 px-3 py-1 rounded-b-xl text-[10px] font-bold shadow-md tracking-wider ${levelInfo.ribbonColor}`}>
                  {levelInfo.ribbon}
                </div>

                {/* Top Section: Cover + Title + Tags */}
                <div>
                  <div className="flex items-start gap-4 mb-4">
                    {/* 3D Book Cover with Rounded Corners */}
                    <div 
                      onClick={() => setInspectingBook(book)}
                      className="w-24 sm:w-28 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-amber-300 shadow-md shrink-0 cursor-pointer ibooks-book ibooks-book-spine bg-slate-900 relative"
                      title={`点击翻开《${book.cnTitle || book.title}》章节选单`}
                    >
                      {!coverErrorMap[book.id] ? (
                        <img 
                          src={`/api/raw/podcasts/${book.id}/cover.jpg`}
                          alt={book.title}
                          onError={() => handleImageError(book.id)}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-amber-950/40 text-amber-400">
                          <BookOpen size={24} className="mb-1" />
                          <span className="font-magical text-xs font-bold">{book.code || 'HP'}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                    </div>

                    {/* Book Metadata */}
                    <div className="min-w-0 flex-1 pt-1 space-y-1.5">
                      <span className="inline-block text-[10px] px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-900 font-bold border border-amber-300/40">
                        {levelInfo.level}
                      </span>
                      
                      <h3 className="font-magical font-bold text-lg text-amber-950 leading-snug line-clamp-2">
                        {book.cnTitle || book.title}
                      </h3>
                      
                      <p className="text-xs font-reading italic text-slate-500 line-clamp-1">
                        {book.title}
                      </p>

                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold pt-1">
                        <Layers size={13} className="text-amber-600 shrink-0" />
                        <span>共 {chapters.length} 章节</span>
                      </div>
                    </div>
                  </div>

                  {/* Book Description */}
                  <p className="text-xs font-reading text-slate-600 line-clamp-2 mb-4 leading-relaxed bg-[#fbf8f2] p-2.5 rounded-xl border border-[#efe7da]">
                    {book.description || levelInfo.desc}
                  </p>
                </div>

                {/* Bottom Actions: 3D Squishy Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-[#f0e6d6]">
                  <button
                    onClick={() => {
                      onSelectBook(book.id);
                      if (chapters.length > 0) {
                        onSelectChapter(chapters[0].id, true);
                      }
                      onEnterPlayer();
                    }}
                    className="duo-btn-primary flex-1 min-h-[42px] py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                    title={`从第 1 章开始精听《${book.cnTitle || book.title}》`}
                  >
                    <Play size={13} className="fill-current" />
                    <span>开始精听</span>
                  </button>

                  <button
                    onClick={() => setInspectingBook(book)}
                    className="duo-btn-secondary min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-2xs"
                    title={`翻开《${book.cnTitle || book.title}》完整章节选单`}
                  >
                    <Layers size={13} />
                    <span>目录</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      </section>

      {/* ── 4. Chapter Selection Modal (Native Bottom Sheet on Mobile) ── */}
      {inspectingBook && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => { setInspectingBook(null); setChapterSearch(''); }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[88vh] sm:max-h-[85vh] flex flex-col rounded-t-3xl sm:rounded-3xl border-t-2 sm:border-2 border-[#eee5d8] bg-[#fbf9f5] text-[#1e1610] shadow-2xl overflow-hidden transition-all pb-safe"
          >
            {/* Mobile Pull Handle Indicator */}
            <div className="sm:hidden w-10 h-1 bg-stone-300 rounded-full mx-auto my-2 shrink-0" />

            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#eee5d8] flex items-center justify-between shrink-0 bg-white gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-11 sm:w-12 aspect-[3/4] rounded-xl overflow-hidden border border-amber-400 shadow-sm shrink-0 bg-slate-900">
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
                <div className="min-w-0 flex-1">
                  <h3 className="font-magical font-bold text-base sm:text-lg text-amber-950 truncate">
                    {inspectingBook.cnTitle || inspectingBook.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 font-reading italic truncate">
                    全卷共 {(inspectingBook.chapters || []).length} 个精听章节 · 原版同步
                  </p>
                </div>
              </div>

              <button 
                onClick={() => {
                  setInspectingBook(null);
                  setChapterSearch('');
                }}
                className="duo-touch-target p-2 rounded-xl border border-amber-200 bg-white hover:bg-amber-100 text-slate-600 hover:text-amber-900 transition-all active:scale-90 shadow-2xs cursor-pointer shrink-0"
                title="关闭章节目录"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Search Input */}
            <div className="px-4 sm:px-5 pt-3 pb-1 shrink-0">
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={chapterSearch}
                  onChange={(e) => setChapterSearch(e.target.value)}
                  placeholder="按关键词快速筛选章节（如：第一章、Boy、魔药）..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl text-xs font-reading border border-amber-200 bg-white text-amber-950 focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 focus:outline-none transition-all"
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
                const cleanTitle = formatEnglishText(ch.title);
                const hasDistinctCn = ch.cnTitle && ch.cnTitle.trim() !== '' && ch.cnTitle.trim() !== cleanTitle;

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
                        : 'border-[#eee5d8] bg-white hover:border-amber-400 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-magical font-bold text-xs shrink-0 ${
                        isCurrent 
                          ? 'bg-amber-500 text-white shadow' 
                          : 'bg-amber-500/15 text-amber-800'
                      }`}>
                        {ch.number || idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-magical font-bold text-sm text-amber-950 truncate">
                            {hasDistinctCn ? ch.cnTitle : cleanTitle}
                          </h4>
                          {isCurrent && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold shrink-0">
                              上次在此
                            </span>
                          )}
                        </div>
                        {hasDistinctCn && (
                          <p className="text-[11px] text-slate-500 font-reading italic truncate">
                            {cleanTitle}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      className="duo-btn-secondary min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1 shadow-2xs"
                    >
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
          <div className="relative p-3 sm:p-4 rounded-3xl border-2 border-amber-300 bg-white/95 text-[#1e1610] shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 overflow-hidden">
            {/* Top Slim Audio Scrubber Line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500/15">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-200"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
            
            {/* Play/Pause & Soundwave indicator */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                onClick={onTogglePlay}
                className="w-12 h-12 rounded-2xl duo-btn-primary flex items-center justify-center shrink-0 shadow-md cursor-pointer"
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
                  <h4 className="font-magical font-bold text-xs sm:text-sm text-amber-950 truncate">
                    {currentChapterObj.cnTitle || currentChapterObj.title}
                  </h4>
                  <span className="text-[11px] text-slate-500 font-mono shrink-0">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                {/* Subtitle Cue Preview */}
                {activeCue && (
                  <p className="text-xs font-reading text-slate-600 truncate mt-0.5">
                    {activeCue.text}
                  </p>
                )}
              </div>
            </div>

            {/* Enter Full Player CTA Button */}
            <button
              onClick={onEnterPlayer}
              className="duo-btn-primary min-h-[42px] px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
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
