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
  CheckCircle2,
  Search,
  BrainCircuit,
  RotateCcw,
  BarChart2
} from 'lucide-react';
import { formatTime, formatEnglishText } from '../utils/vttParser';
import { DailyGoalRing } from './DailyGoalRing';
import { getCefrInfo } from '../data/books';

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
  dueReviewCount = 0,
  isParchment,
  onOpenVocab,
  onOpenAnalytics,
  onOpenStorage,
  onOpenSrs
}) {
  const [inspectingBook, setInspectingBook] = useState(null);
  const [chapterSearch, setChapterSearch] = useState('');
  const [coverErrorMap, setCoverErrorMap] = useState({});

  const effectiveDueCount = dueWordsCount || dueReviewCount || 0;

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return '早安，霍格沃茨学徒！';
    if (h >= 12 && h < 18) return '下午好，霍格沃茨学徒！';
    return '晚上好，霍格沃茨学徒！';
  };

  const displayBooks = (books || []).filter(b => b.chapters?.length > 0);
  const currentBookObj = displayBooks.find(b => b.id === selectedBook) || displayBooks[0];
  const currentChapterObj = currentBookObj
    ? (currentBookObj.chapters || []).find(c => c.id === selectedChapter) || currentBookObj.chapters?.[0]
    : null;

  const getReadingLevel = (book) => {
    const cefr = getCefrInfo(book);
    const pillClass = cefr.code === 'A2' ? 'cefr-pill-a2'
      : cefr.code === 'B1' ? 'cefr-pill-b1'
      : cefr.code === 'B2' ? 'cefr-pill-b2'
      : 'cefr-pill-c1';
    return {
      level: `CEFR ${cefr.code} ${cefr.label}`,
      pillClass: `cefr-pill ${pillClass}`,
      code: cefr.code,
      label: cefr.label,
      description: cefr.description
    };
  };

  const handleImageError = (bookId) =>
    setCoverErrorMap(prev => ({ ...prev, [bookId]: true }));

  const resumeProgressPercent = duration > 0 ? Math.round((currentTime / duration) * 100) : 0;
  const todayMinutes = Math.floor(todayListeningSeconds / 60);
  const goalPercent = Math.min(100, Math.round((todayListeningSeconds / 300) * 100));

  return (
    <div className="flex-1 overflow-y-auto pb-36 pt-4 sm:pt-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full select-none ios-scroll">

      {/* ── 1. Header greeting ─────────────────────────────────────── */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="p-1.5 rounded-xl bg-amber-500/15 text-amber-600">
            <Sparkles size={16} />
          </span>
          <h2 className="font-magical font-bold text-xl sm:text-2xl text-amber-950">
            {getGreeting()}
          </h2>
        </div>
        <p className="text-xs text-[#7a6448] font-reading ml-1">
          选一本魔法故事开启今日听力探险 每日 5 分钟磨亮你的英语魔杖
        </p>
      </div>

      {/* ── 2. Unified 4-Card Responsive Grid ─────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {/* Card 1: Daily goal */}
        <div
          onClick={onOpenAnalytics}
          className="duo-card p-3.5 cursor-pointer hover:border-amber-400 transition-colors flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-amber-800 flex items-center gap-1.5">
              <Sparkles size={12} className="text-amber-600" />
              今日契约
            </span>
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
              todayListeningSeconds >= 300
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300/60'
                : 'bg-amber-100 text-amber-800 border border-amber-300/60'
            }`}>
              {todayListeningSeconds >= 300 ? '已达成' : `${goalPercent}%`}
            </span>
          </div>

          <p className="font-bold text-amber-950 flex items-baseline gap-1 my-1">
            {todayListeningSeconds >= 300 ? (
              <span className="font-magical text-base text-emerald-800">今日达成！</span>
            ) : (
              <>
                <span className="font-mono font-extrabold text-lg">{Math.max(1, Math.ceil((300 - todayListeningSeconds) / 60))}</span>
                <span className="text-sm font-bold">分钟待听</span>
              </>
            )}
          </p>

          <div className="flex items-center justify-between text-[11px] font-mono text-stone-500 mt-0.5">
            <span className="flex items-center gap-1">
              <Clock size={10} className="text-amber-500" />
              已听 {todayMinutes} 分钟
            </span>
            <span className="font-semibold text-amber-800">{goalPercent}%</span>
          </div>
        </div>

        {/* Card 2: Streak */}
        <div
          onClick={onOpenAnalytics}
          className="duo-card p-3.5 cursor-pointer hover:border-amber-400 transition-colors flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-orange-700 flex items-center gap-1.5">
              <Flame size={12} className="text-orange-500" />
              连续打卡
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-300/60">
              {streakDays >= 3 ? '连击加成' : '保持中'}
            </span>
          </div>

          <p className="font-bold text-amber-950 flex items-baseline gap-1 my-1">
            <span className="font-mono font-extrabold text-lg">{streakDays}</span>
            <span className="text-sm font-bold">天连胜</span>
          </p>

          <div className="flex items-center justify-between text-[11px] text-stone-500 mt-0.5">
            <span className="flex items-center gap-1 font-mono">
              <RotateCcw size={10} className="text-amber-500" />
              时间转换器 x{timeTurnersCount}
            </span>
            <span className="text-[10px] text-stone-400">学业罗盘</span>
          </div>
        </div>

        {/* Card 3: SRS */}
        <div
          onClick={onOpenSrs}
          className="duo-card p-3.5 cursor-pointer hover:border-amber-400 transition-colors flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-indigo-700 flex items-center gap-1.5">
              <BrainCircuit size={12} className="text-indigo-600" />
              艾宾浩斯复习
            </span>
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
              effectiveDueCount > 0
                ? 'bg-rose-100 text-rose-800 border border-rose-300/60'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-300/60'
            }`}>
              {effectiveDueCount > 0 ? '待复习' : '稳固'}
            </span>
          </div>

          <p className="font-bold text-amber-950 flex items-baseline gap-1 my-1">
            {effectiveDueCount > 0 ? (
              <>
                <span className="font-mono font-extrabold text-lg">{effectiveDueCount}</span>
                <span className="text-sm font-bold">词待复习</span>
              </>
            ) : (
              <span className="font-magical text-base text-stone-800">记忆封印稳固</span>
            )}
          </p>

          <div className="flex items-center justify-between text-[11px] text-stone-500 mt-0.5">
            <span className="flex items-center gap-1 font-mono">
              <Bookmark size={10} className="text-indigo-500" />
              共收录 {vocabCount} 词
            </span>
            <span className="text-[10px] text-stone-400">词汇重铸</span>
          </div>
        </div>

        {/* Card 4: Continue listening hero card */}
        {currentBookObj && currentChapterObj ? (
          <div
            onClick={onEnterPlayer}
            className="duo-card p-3.5 cursor-pointer hover:border-amber-400 transition-colors flex flex-col justify-between group border-amber-300/80 bg-amber-50/30"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5 truncate">
                <Headphones size={12} className="text-amber-600 shrink-0" />
                <span className="truncate">{isPlaying ? '正在精听' : '继续精听'}</span>
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setInspectingBook(currentBookObj);
                  }}
                  className="w-9 h-9 min-w-[36px] min-h-[36px] duo-touch-target rounded-xl border border-[#e8ddd0] bg-white hover:bg-amber-50 text-stone-600 hover:text-amber-950 flex items-center justify-center active:scale-90 transition-all cursor-pointer shadow-none"
                  title="查看章节目录"
                  aria-label="查看章节目录"
                >
                  <Layers size={14} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePlay();
                  }}
                  className="w-9 h-9 min-w-[36px] min-h-[36px] duo-touch-target rounded-xl bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center active:scale-90 transition-all cursor-pointer shadow-none"
                  title={isPlaying ? '暂停播放' : '继续精听'}
                  aria-label={isPlaying ? '暂停播放' : '继续精听'}
                >
                  {isPlaying ? <Pause size={14} className="fill-current" /> : <Play size={14} className="fill-current ml-0.5" />}
                </button>
              </div>
            </div>

            <div className="my-1 min-w-0">
              <h4 className="font-magical font-bold text-sm sm:text-base text-amber-950 truncate leading-snug group-hover:text-amber-800 transition-colors">
                {currentChapterObj.cnTitle || currentChapterObj.title}
              </h4>
              <div className="mt-1.5 w-full h-1 rounded-full bg-amber-200/60 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all"
                  style={{ width: `${Math.max(3, resumeProgressPercent)}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-stone-500 mt-0.5">
              <span className="flex items-center gap-1 text-stone-600 truncate max-w-[55%]">
                <BookOpen size={10} className="text-amber-600 shrink-0" />
                <span className="truncate">{currentBookObj.cnTitle || currentBookObj.title}</span>
              </span>
              <span className="font-mono text-amber-700 text-[10px] shrink-0">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
          </div>
        ) : (
          <div
            onClick={onEnterPlayer}
            className="duo-card p-3.5 cursor-pointer hover:border-amber-400 transition-colors flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-amber-800 flex items-center gap-1.5">
                <Headphones size={12} className="text-amber-600" />
                继续精听
              </span>
              <span className="text-[10px] font-mono text-stone-400">待启程</span>
            </div>
            <p className="font-magical font-bold text-sm text-stone-600 my-1">
              选章节开启原声探险
            </p>
            <div className="text-[11px] text-stone-400 flex items-center gap-1">
              <BookOpen size={10} /> 暂无播放记录
            </div>
          </div>
        )}
      </div>

      {/* ── 4. Book Grid (horizontal layout cards) ─────────────────── */}
      <section className="mb-14">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#eee4d5]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-700">
              <BookOpen size={18} />
            </div>
            <div>
              <h2 className="font-magical font-bold text-lg sm:text-xl text-amber-950">霍格沃茨魔法书架</h2>
              <p className="text-xs text-stone-500 font-reading">难度由浅入深 逐句原版原音同步</p>
            </div>
          </div>
          <span className="hidden sm:flex items-center gap-1 text-xs text-amber-800 bg-amber-500/10 px-3 py-1.5 rounded-full font-bold border border-amber-300/40">
            <Award size={12} className="text-amber-600" />
            全套收录
          </span>
        </div>

        <div className="space-y-3">
          {displayBooks.map((book) => {
            const levelInfo = getReadingLevel(book);
            const chapters = book.chapters || [];
            const isSelected = book.id === selectedBook;

            return (
              <div
                key={book.id}
                onClick={() => setInspectingBook(book)}
                className={`duo-card p-3.5 sm:p-4 flex items-center gap-3.5 sm:gap-4 hover:border-amber-400 transition-colors cursor-pointer group select-none ${
                  isSelected ? 'border-amber-400 ring-1 ring-amber-400/50' : ''
                }`}
              >
                {/* Cover: flat, square-ish, no 3D */}
                <div
                  className="w-14 h-20 sm:w-20 sm:h-24 rounded-xl overflow-hidden border border-amber-300/60 shrink-0 bg-stone-900 group-hover:scale-[1.02] transition-transform"
                >
                  {!coverErrorMap[book.id] ? (
                    <img
                      src={`/api/raw/podcasts/${book.id}/cover.jpg`}
                      alt={book.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(book.id)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-amber-950/40">
                      <BookOpen size={20} className="text-amber-400" />
                    </div>
                  )}
                </div>

                {/* Book info with plenty of breathing room */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={levelInfo.pillClass}>
                      {levelInfo.level}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-300/60">当前精听</span>
                    )}
                  </div>
                  <h3 className="font-magical font-bold text-sm sm:text-base text-amber-950 truncate leading-snug group-hover:text-amber-800 transition-colors">
                    {book.cnTitle || book.title}
                  </h3>
                  <p className="text-[11px] text-stone-400 italic truncate">{book.title}</p>
                  <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-stone-500 font-semibold">
                    <Layers size={11} className="text-amber-600" />
                    {chapters.length} 章节
                  </div>
                </div>

                {/* Actions: GitHub-style icon buttons (Play & Chapters) */}
                <div className="shrink-0 flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectBook(book.id);
                      if (chapters.length > 0) onSelectChapter(chapters[0].id, true);
                      onEnterPlayer();
                    }}
                    className="w-11 h-11 min-h-[44px] min-w-[44px] rounded-xl bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center border border-amber-600 active:scale-95 transition-all cursor-pointer shadow-none"
                    title="立即开始精听"
                    aria-label="立即精听"
                  >
                    <Play size={16} className="fill-current translate-x-0.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setInspectingBook(book);
                    }}
                    className="w-11 h-11 min-h-[44px] min-w-[44px] rounded-xl border border-[#e8ddd0] bg-white hover:bg-stone-50 text-stone-600 hover:text-amber-950 hover:border-amber-300 flex items-center justify-center active:scale-95 transition-all cursor-pointer shadow-none"
                    title="查看章节目录"
                    aria-label="查看章节目录"
                  >
                    <Layers size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 5. Chapter Selection Modal ──────────────────────────────── */}
      {inspectingBook && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => { setInspectingBook(null); setChapterSearch(''); }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[88dvh] sm:max-h-[85dvh] flex flex-col rounded-t-3xl sm:rounded-3xl border-t sm:border border-[#e8ddd0] bg-[#fbf9f5] overflow-hidden pb-safe no-scrollbar"
          >
            {/* Drag handle (mobile) */}
            <div className="sm:hidden w-10 h-1.5 bg-stone-300 rounded-full mx-auto my-2 shrink-0" />

            {/* Header */}
            <div className="px-4 sm:px-5 py-3.5 border-b border-[#e8ddd0] bg-white flex items-center gap-3 shrink-0">
              <div className="w-10 h-14 rounded-xl overflow-hidden border border-amber-400 shrink-0 bg-stone-900">
                {!coverErrorMap[inspectingBook.id] ? (
                  <img
                    src={`/api/raw/podcasts/${inspectingBook.id}/cover.jpg`}
                    alt="Cover"
                    className="w-full h-full object-cover"
                    onError={() => handleImageError(inspectingBook.id)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-magical text-amber-500 text-xs font-bold">
                    {inspectingBook.code || 'HP'}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-magical font-bold text-base text-amber-950 truncate">
                  {inspectingBook.cnTitle || inspectingBook.title}
                </h3>
                <p className="text-[11px] text-stone-500 font-reading">
                  全卷 {(inspectingBook.chapters || []).length} 章节
                </p>
              </div>
              <button
                onClick={() => { setInspectingBook(null); setChapterSearch(''); }}
                className="duo-touch-target p-2 rounded-xl border border-[#e8ddd0] hover:bg-amber-50 text-stone-500 hover:text-amber-900 transition-all active:scale-90 cursor-pointer"
                title="关闭章节选单"
                aria-label="关闭章节选单"
              >
                <X size={17} />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 sm:px-5 pt-3 pb-1 shrink-0">
              <div className="relative">
                <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="search" enterKeyHint="search"
                  autoCapitalize="none" autoCorrect="off" spellCheck="false"
                  value={chapterSearch}
                  onChange={e => setChapterSearch(e.target.value)}
                  placeholder="搜索章节名或关键词..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl text-base sm:text-sm border border-amber-200 bg-white focus:border-amber-500 focus:outline-none transition-all"
                />
                {chapterSearch && (
                  <button onClick={() => setChapterSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-stone-400 hover:text-stone-700 cursor-pointer duo-touch-target"
                    title="清除搜索内容"
                    aria-label="清除搜索内容"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Chapter list */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-3 space-y-2 ios-scroll">
              {(inspectingBook.chapters || [])
                .filter(ch => {
                  if (!chapterSearch.trim()) return true;
                  const q = chapterSearch.toLowerCase();
                  return (ch.title || '').toLowerCase().includes(q)
                    || (ch.cnTitle || '').includes(q)
                    || String(ch.number).includes(q);
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
                      className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl border cursor-pointer transition-all ${
                        isCurrent
                          ? 'border-l-4 border-l-amber-500 border-[#e8ddd0] bg-amber-50/60'
                          : 'border-[#e8ddd0] bg-white hover:border-amber-400'
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
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
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500 text-white font-bold shrink-0">
                              当前
                            </span>
                          )}
                        </div>
                        {hasDistinctCn && (
                          <p className="text-[11px] text-stone-400 font-reading italic truncate">{cleanTitle}</p>
                        )}
                        {ch.duration && (
                          <p className="text-[10px] text-stone-400 font-mono mt-0.5 flex items-center gap-1">
                            <Clock size={9} />{ch.duration}
                          </p>
                        )}
                      </div>
                      <button 
                        className={`min-h-[44px] min-w-[44px] p-2 rounded-xl text-xs font-bold shrink-0 flex items-center justify-center active:scale-95 transition-all ${
                          isCurrent
                            ? 'bg-amber-500 text-white'
                            : 'duo-btn-secondary'
                        }`}
                        title={isCurrent ? '当前正在播放此章节' : '立即精听此章节'}
                        aria-label={isCurrent ? '当前正在播放此章节' : '立即精听此章节'}
                      >
                        <Play size={14} className="fill-current" />
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BookshelfView;
