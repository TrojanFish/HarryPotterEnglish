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
    const id = (book?.id || '').toLowerCase();
    const title = (book?.title || '').toLowerCase();
    if (id.includes('book-1') || title.includes('philosopher') || title.includes('sorcerer'))
      return { level: '入门基础', color: 'bg-amber-100 text-amber-800' };
    if (id.includes('book-2') || title.includes('chamber'))
      return { level: '初级进阶', color: 'bg-emerald-100 text-emerald-800' };
    if (id.includes('book-3') || title.includes('azkaban'))
      return { level: '中阶挑战', color: 'bg-blue-100 text-blue-800' };
    if (id.includes('prince') || title.includes('prince'))
      return { level: '名著双语', color: 'bg-indigo-100 text-indigo-800' };
    if (id.includes('tales') || id.includes('tiny'))
      return { level: '童话启蒙', color: 'bg-rose-100 text-rose-800' };
    return { level: '原版精选', color: 'bg-stone-100 text-stone-700' };
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
          选一本魔法故事，开启今日听力探险 · 每日 5 分钟，磨亮你的英语魔杖
        </p>
      </div>

      {/* ── 2. Horizontal Task Strip ────────────────────────────────── */}
      <div className="flex gap-3 overflow-x-auto pb-2 mb-6 snap-x snap-mandatory no-scrollbar">
        {/* Card 1: Daily goal */}
        <div
          onClick={onOpenAnalytics}
          className="snap-start shrink-0 w-48 sm:w-52 duo-card p-3.5 cursor-pointer hover:border-amber-400 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-amber-800 flex items-center gap-1">
              <Sparkles size={11} className="text-amber-600" />
              今日契约
            </span>
            <DailyGoalRing todaySeconds={todayListeningSeconds} targetSeconds={300} isParchment={isParchment} size={36} minimal={true} />
          </div>
          <p className="font-bold text-sm text-amber-950 leading-tight">
            {todayListeningSeconds >= 300 ? '今日达成！' : <>还差 <span className="font-mono font-bold">{Math.max(1, Math.ceil((300 - todayListeningSeconds) / 60))}</span> 分钟</>}
          </p>
          <p className="text-[11px] font-mono text-stone-500 mt-0.5">
            今日 {todayMinutes} 分钟 · {goalPercent}%
          </p>
        </div>

        {/* Card 2: Streak */}
        <div
          onClick={onOpenAnalytics}
          className="snap-start shrink-0 w-48 sm:w-52 duo-card p-3.5 cursor-pointer hover:border-amber-400 transition-colors"
        >
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-orange-700 mb-1.5">
            <Flame size={13} className="text-orange-500" />
            连续打卡
          </div>
          <p className="font-bold text-base text-amber-950">
            <span className="font-mono font-extrabold text-lg">{streakDays}</span> 天连胜
            {streakDays >= 3 && (
              <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-bold align-middle">
                连击
              </span>
            )}
          </p>
          <p className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-1">
            <RotateCcw size={9} className="text-amber-500" />
            时间转换器 x{timeTurnersCount}
          </p>
        </div>

        {/* Card 3: SRS */}
        <div
          onClick={onOpenSrs}
          className="snap-start shrink-0 w-48 sm:w-52 duo-card p-3.5 cursor-pointer hover:border-amber-400 transition-colors"
        >
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 mb-1.5">
            <BrainCircuit size={13} className="text-indigo-600" />
            艾宾浩斯复习
          </div>
          <p className="font-bold text-sm text-amber-950">
            {effectiveDueCount > 0 ? <><span className="font-mono font-bold">{effectiveDueCount}</span> 词待复习</> : '记忆封印稳固'}
          </p>
          <p className="text-[11px] text-stone-500 mt-0.5">
            共收录 <span className="font-mono font-bold">{vocabCount}</span> 词
          </p>
        </div>
      </div>

      {/* ── 3. Hero Continue Card (full-width, if active) ─────────── */}
      {currentBookObj && currentChapterObj && (
        <div className="duo-card p-4 sm:p-5 mb-8 border-2 border-amber-300/80">
          <div className="flex items-center gap-4">
            {/* Book cover: flat, no 3D */}
            <div
              onClick={onEnterPlayer}
              className="w-14 h-20 sm:w-16 sm:h-24 rounded-xl overflow-hidden border-2 border-amber-400 shrink-0 cursor-pointer bg-stone-900 hover:scale-105 transition-transform"
            >
              {!coverErrorMap[currentBookObj.id] ? (
                <img
                  src={`/api/raw/podcasts/${currentBookObj.id}/cover.jpg`}
                  alt={currentBookObj.title}
                  className="w-full h-full object-cover"
                  onError={() => handleImageError(currentBookObj.id)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-amber-950/40">
                  <BookOpen size={18} className="text-amber-400" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-amber-700 mb-0.5">
                {currentBookObj.cnTitle || currentBookObj.title}
              </p>
              <h3 className="font-magical font-bold text-base sm:text-lg text-amber-950 truncate">
                {currentChapterObj.cnTitle || currentChapterObj.title}
              </h3>
              <div className="mt-2 w-full h-1.5 rounded-full bg-amber-100 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all"
                  style={{ width: `${Math.max(3, resumeProgressPercent)}%` }}
                />
              </div>
              <p className="text-[11px] font-mono text-amber-700 mt-1">
                {formatTime(currentTime)} / {formatTime(duration)}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 mt-4 pt-4 border-t border-[#eee4d5]">
            <button
              onClick={onEnterPlayer}
              className="duo-btn-primary flex-1 min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5"
            >
              {isPlaying ? <Pause size={15} className="fill-current" /> : <Play size={15} className="fill-current" />}
              {isPlaying ? '正在精听' : '继续精听'}
            </button>
            <button
              onClick={() => setInspectingBook(currentBookObj)}
              className="duo-btn-secondary min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1"
            >
              <Layers size={14} />
              目录
            </button>
          </div>
        </div>
      )}

      {/* ── 4. Book Grid (horizontal layout cards) ─────────────────── */}
      <section className="mb-14">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#eee4d5]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-700">
              <BookOpen size={18} />
            </div>
            <div>
              <h2 className="font-magical font-bold text-lg sm:text-xl text-amber-950">霍格沃茨魔法书架</h2>
              <p className="text-xs text-stone-500 font-reading">难度由浅入深 · 逐句原版原音同步</p>
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
                className={`duo-card p-4 flex items-center gap-4 hover:border-amber-400 transition-colors ${
                  isSelected ? 'border-2 border-amber-400' : ''
                }`}
              >
                {/* Cover: flat, square-ish, no 3D */}
                <div
                  onClick={() => setInspectingBook(book)}
                  className="w-16 h-20 sm:w-20 sm:h-24 rounded-xl overflow-hidden border-2 border-amber-300/60 shrink-0 cursor-pointer bg-stone-900 hover:scale-105 transition-transform"
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

                {/* Book info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${levelInfo.color}`}>
                      {levelInfo.level}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">当前</span>
                    )}
                  </div>
                  <h3 className="font-magical font-bold text-sm sm:text-base text-amber-950 truncate leading-snug">
                    {book.cnTitle || book.title}
                  </h3>
                  <p className="text-[11px] text-stone-400 italic truncate">{book.title}</p>
                  <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-stone-500 font-semibold">
                    <Layers size={11} className="text-amber-600" />
                    {chapters.length} 章节
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => {
                      onSelectBook(book.id);
                      if (chapters.length > 0) onSelectChapter(chapters[0].id, true);
                      onEnterPlayer();
                    }}
                    className="duo-btn-primary min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1"
                  >
                    <Play size={12} className="fill-current" />
                    精听
                  </button>
                  <button
                    onClick={() => setInspectingBook(book)}
                    className="duo-btn-secondary min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1"
                  >
                    <Layers size={12} />
                    目录
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
            className="w-full max-w-2xl max-h-[88dvh] sm:max-h-[85dvh] flex flex-col rounded-t-3xl sm:rounded-3xl border-t-2 sm:border-2 border-[#e8ddd0] bg-[#fbf9f5] overflow-hidden pb-safe no-scrollbar"
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
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-stone-400 hover:text-stone-700 cursor-pointer duo-touch-target">
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
                      <button className="duo-btn-secondary min-h-[36px] px-2.5 py-1.5 rounded-xl text-[11px] font-bold shrink-0 flex items-center gap-1">
                        <Play size={11} className="fill-current" />
                        <span className="hidden sm:inline">精听</span>
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
