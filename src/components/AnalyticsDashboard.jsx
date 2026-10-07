import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Clock, 
  BookOpen, 
  Bookmark, 
  TrendingUp, 
  BarChart2, 
  X, 
  Award, 
  Sparkles, 
  Calendar,
  Zap,
  Info,
  Copy,
  Check,
  Cloud,
  RefreshCw,
  Smartphone
} from 'lucide-react';
import { getAnalyticsSummary } from '../utils/analyticsStore';
import { syncEngine } from '../utils/syncEngine';
import { HouseHourglasses } from './analytics/HouseHourglasses.jsx';
import { OwlsCertificateModal } from './analytics/OwlsCertificateModal.jsx';
import { HOUSES } from '../constants/hogwartsTheme.js';

export function AnalyticsDashboard({
  isOpen,
  onClose,
  isParchment = true,
  vocabCount = 0,
  isPageView = false,
  userHouse = 'gryffindor',
  onOpenHouseSelector
}) {
  const [summary, setSummary] = useState(null);
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);
  const [hoveredPointIndex, setHoveredPointIndex] = useState(null);
  const [showHonorScroll, setShowHonorScroll] = useState(false);
  const [showOwlsCertificate, setShowOwlsCertificate] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const activeHouse = userHouse || (typeof window !== 'undefined' && localStorage.getItem('hp_user_house')) || 'gryffindor';

  // Local-First Sync State
  const [syncState, setSyncState] = useState(() => ({
    status: syncEngine.status,
    meta: syncEngine.getMeta()
  }));
  const [pairCodeInput, setPairCodeInput] = useState('');
  const [pairMessage, setPairMessage] = useState(null);
  const [isPairing, setIsPairing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedSyncCode, setCopiedSyncCode] = useState(false);

  // Subscribe to syncEngine status updates
  useEffect(() => {
    const unsub = syncEngine.subscribe((data) => {
      setSyncState({ status: data.status, meta: data.meta });
    });
    return unsub;
  }, []);

  const handleCopySyncCode = () => {
    const code = syncState.meta?.syncCode || 'HP-DEMO';
    navigator?.clipboard?.writeText(code).then(() => {
      setCopiedSyncCode(true);
      setTimeout(() => setCopiedSyncCode(false), 2000);
    }).catch(() => {});
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await syncEngine.triggerSync();
      setSummary(getAnalyticsSummary());
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePairDevice = async (e) => {
    e.preventDefault();
    if (!pairCodeInput.trim()) return;
    setIsPairing(true);
    setPairMessage(null);
    try {
      const res = await syncEngine.pairDevice(pairCodeInput.trim());
      setPairMessage({ type: 'success', text: res.message || '配对成功，已同步云端档案！' });
      setPairCodeInput('');
      setSummary(getAnalyticsSummary());
    } catch (err) {
      setPairMessage({ type: 'error', text: err.message });
    } finally {
      setIsPairing(false);
    }
  };

  // Reload statistics whenever modal opens or page view is active
  useEffect(() => {
    if (isOpen || isPageView) {
      const data = getAnalyticsSummary();
      setSummary(data);
    }
  }, [isOpen, isPageView]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen && !isPageView) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPageView, onClose]);

  if (!isOpen && !isPageView) return null;

  const currentSummary = summary || {
    totalListeningSeconds: 0,
    weeklyListeningMinutes: [
      { day: 'Sun', date: '', minutes: 0 },
      { day: 'Mon', date: '', minutes: 0 },
      { day: 'Tue', date: '', minutes: 0 },
      { day: 'Wed', date: '', minutes: 0 },
      { day: 'Thu', date: '', minutes: 0 },
      { day: 'Fri', date: '', minutes: 0 },
      { day: 'Sat', date: '', minutes: 0 }
    ],
    dictationTrend: [],
    completedChaptersCount: 0,
    streakDays: 0,
    longestStreakDays: 0
  };

  // Convert total listening time to hours and minutes
  const totalHours = Math.floor(currentSummary.totalListeningSeconds / 3600);
  const totalMinutes = Math.floor((currentSummary.totalListeningSeconds % 3600) / 60);
  const weeklyMinutesTotal = (currentSummary.weeklyListeningMinutes || []).reduce((acc, d) => acc + (d.minutes || 0), 0);

  // Copy honor scroll text for parents/teachers (100% 0-emoji compliant)
  const handleCopyHonorReport = () => {
    const text = `【霍格沃茨学业喜报 · 魔法之星荣誉卷轴】\n` +
      `[打卡] 连续研学打卡：${currentSummary.streakDays} 天（历史最长连续 ${currentSummary.longestStreakDays} 天）\n` +
      `[听力] 本周专注精听：${weeklyMinutesTotal} 分钟（累计精听 ${totalHours} 小时 ${totalMinutes} 分钟）\n` +
      `[章节] 攻克原声章节：${currentSummary.completedChaptersCount} 章\n` +
      `[词汇] 魔法生词累计：${vocabCount} 个\n` +
      `[寄语] “以好奇为魔杖，以坚持为魔药。每一个专注聆听的清晨与夜晚，都在构筑纯正英语语感！”`;
    
    if (navigator && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }).catch(e => console.warn(e));
    }
  };

  // Bar Chart calculations
  const weeklyData = currentSummary.weeklyListeningMinutes || [];
  const maxWeeklyMinutes = Math.max(15, ...weeklyData.map(d => d.minutes || 0));
  const dayZhMap = {
    Sun: '周日',
    Mon: '周一',
    Tue: '周二',
    Wed: '周三',
    Thu: '周四',
    Fri: '周五',
    Sat: '周六',
  };
  const chartHeight = 160;
  const chartWidth = 520;
  const barWidth = 36;
  const barGap = (chartWidth - barWidth * 7) / 8;

  // Trend line chart calculations
  const dictationData = currentSummary.dictationTrend || [];
  const trendSvgWidth = 520;
  const trendSvgHeight = 160;
  const trendPaddingX = 40;
  const trendPaddingY = 25;

  const trendPoints = dictationData.map((item, idx) => {
    const x = dictationData.length === 1 
      ? trendSvgWidth / 2 
      : trendPaddingX + (idx / (dictationData.length - 1)) * (trendSvgWidth - trendPaddingX * 2);
    // Accuracy 0-100 maps to (trendSvgHeight - trendPaddingY) down to trendPaddingY
    const usableHeight = trendSvgHeight - trendPaddingY * 2;
    const y = trendSvgHeight - trendPaddingY - (Math.min(100, Math.max(0, item.accuracy || 0)) / 100) * usableHeight;
    return { x, y, ...item };
  });

  // Generate SVG path for trend line
  const trendLinePath = trendPoints.length > 1
    ? trendPoints.reduce((acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x},${pt.y}`, '')
    : '';

  // Generate closed area path for fill gradient
  const trendAreaPath = trendPoints.length > 1
    ? `${trendLinePath} L ${trendPoints[trendPoints.length - 1].x},${trendSvgHeight - trendPaddingY} L ${trendPoints[0].x},${trendSvgHeight - trendPaddingY} Z`
    : '';

  const theme = isParchment ? {
    modalBg: 'bg-[#fbf6ea]',
    modalBorder: 'border-[#dec9a5]',
    primaryText: 'text-[#2d1e12]',
    cardBg: 'bg-[#fffdf8]',
    cardBorder: 'border-[#dec9a5]',
    secondaryText: 'text-[#7d6852]',
    unitText: 'text-[#7d6852]',
    gridStroke: '#e8dcbe',
    axisFill: '#998369',
    headerBg: 'bg-white/95'
  } : {
    modalBg: 'bg-[#0e1422]',
    modalBorder: 'border-[#223147]',
    primaryText: 'text-[#e2d9c8]',
    cardBg: 'bg-[#131b2a]',
    cardBorder: 'border-[#223147]',
    secondaryText: 'text-[#8c9ba5]',
    unitText: 'text-[#8c9ba5]',
    gridStroke: '#1e293b',
    axisFill: '#64748b',
    headerBg: 'bg-[#0e1422]/95'
  };

  const dashboardContent = (
    <div className={isPageView
      ? `w-full h-full overflow-hidden ${theme.modalBg} ${theme.primaryText} transition-all flex flex-col`
      : `relative w-full max-w-4xl max-h-[88dvh] sm:max-h-[85dvh] overflow-hidden rounded-t-3xl sm:rounded-2xl border-t sm:border ${theme.modalBorder} ${theme.modalBg} ${theme.primaryText} transition-all z-10 flex flex-col`
    }>
      
      {/* Mobile Pull Handle Indicator */}
      {!isPageView && <div className="sm:hidden w-10 h-1.5 bg-stone-300 rounded-full mx-auto my-2.5 shrink-0" />}

      {/* Header Bar */}
      <div className="shrink-0 z-20 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-[#e8ddd0] bg-white/95 backdrop-blur-md gap-2 select-none">
        <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0 flex-1">
          <div className="p-2 rounded-xl bg-amber-500/15 text-amber-700 border border-amber-300/80 shrink-0">
            <BarChart2 size={18} className="text-amber-600 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm sm:text-xl font-bold font-magical tracking-wide text-amber-950 truncate flex items-center gap-1.5 sm:gap-2">
              <span>霍格沃茨学业数据罗盘</span>
              <span className="hidden sm:inline-flex text-[11px] font-sans px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-900 border border-amber-300/80 font-bold shrink-0">
                学情追踪
              </span>
            </h2>
            <p className="text-[10px] sm:text-xs text-stone-500 truncate">
              <span className="sm:hidden">学情习惯与专注追踪</span>
              <span className="hidden sm:inline">学习习惯追踪 · 听力专注时长 · 听写准确度</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          <button
            onClick={() => setShowOwlsCertificate(true)}
            className="duo-btn-primary min-h-[44px] flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap shrink-0"
            title="生成官方霍格沃茨 O.W.L.s 学业荣誉通报证书，支持直接打印与分享"
          >
            <Award size={14} className="shrink-0" />
            <span className="hidden sm:inline">学业喜报 (O.W.L.s 证书)</span>
            <span className="sm:hidden">学业喜报</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="duo-touch-target rounded-xl border border-[#e8ddd0] bg-white hover:bg-stone-100 text-stone-600 hover:text-amber-950 hover:border-amber-300 transition-all active:scale-90 cursor-pointer shrink-0"
              title={isPageView ? "返回" : "关闭罗盘 (ESC)"}
              aria-label={isPageView ? "返回" : "关闭罗盘"}
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

        {/* Content Body - Only inner content scrolls */}
        <div className={`flex-1 overflow-y-auto overscroll-contain no-scrollbar ${isPageView ? 'pb-36 pb-safe' : 'pb-6'}`}>
        {showHonorScroll ? (
          <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6 animate-fadeIn">
            <div className="p-6 sm:p-8 rounded-3xl border border-amber-400/80 bg-gradient-to-br from-white via-[#fbf9f5] to-amber-500/5 text-center relative overflow-hidden">
              {/* Background Watermark Accent */}
              <div className="absolute right-3 -bottom-6 pointer-events-none opacity-5 text-amber-700">
                <Award size={200} />
              </div>

              {/* Scroll Crest Header */}
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-500/15 text-amber-900 border border-amber-400/50 text-xs font-bold mb-3">
                <Sparkles size={13} className="text-amber-700" />
                <span>霍格沃茨学业喜报 · 魔法之星荣誉卷轴</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-bold font-magical text-amber-950 mb-2">
                学海探秘 · 见证卓越成长
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 font-reading max-w-lg mx-auto mb-7 leading-relaxed">
                “以好奇为魔杖，以坚持为魔药。每一个专注聆听的清晨与夜晚，都在构筑你的纯正英语语感！”
              </p>

              {/* 4 Pillars Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-7">
                <div className="p-4 rounded-2xl border border-[#e8ddd0] bg-white">
                  <div className="text-amber-700 flex items-center justify-center mb-1">
                    <Flame size={20} className="text-orange-500" />
                  </div>
                  <div className="font-sans font-bold text-2xl text-amber-950">
                    {currentSummary.streakDays} <span className="text-xs text-stone-400 font-normal">天</span>
                  </div>
                  <div className="text-xs text-stone-500 font-bold mt-0.5">连续坚持研读</div>
                </div>

                <div className="p-4 rounded-2xl border border-[#e8ddd0] bg-white">
                  <div className="text-amber-700 flex items-center justify-center mb-1">
                    <Clock size={20} className="text-amber-600" />
                  </div>
                  <div className="font-sans font-bold text-2xl text-amber-950">
                    {weeklyMinutesTotal} <span className="text-xs text-stone-400 font-normal">分</span>
                  </div>
                  <div className="text-xs text-stone-500 font-bold mt-0.5">本周专注精听</div>
                </div>

                <div className="p-4 rounded-2xl border border-[#e8ddd0] bg-white">
                  <div className="text-amber-700 flex items-center justify-center mb-1">
                    <BookOpen size={20} className="text-emerald-600" />
                  </div>
                  <div className="font-sans font-bold text-2xl text-amber-950">
                    {currentSummary.completedChaptersCount} <span className="text-xs text-stone-400 font-normal">章</span>
                  </div>
                  <div className="text-xs text-stone-500 font-bold mt-0.5">攻克原声章节</div>
                </div>

                <div className="p-4 rounded-2xl border border-[#e8ddd0] bg-white">
                  <div className="text-amber-700 flex items-center justify-center mb-1">
                    <Bookmark size={20} className="text-blue-600" />
                  </div>
                  <div className="font-sans font-bold text-2xl text-amber-950">
                    {vocabCount} <span className="text-xs text-stone-400 font-normal">词</span>
                  </div>
                  <div className="text-xs text-stone-500 font-bold mt-0.5">魔法生词收录</div>
                </div>
              </div>

              {/* Share Action Bar */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleCopyHonorReport}
                  className="duo-btn-primary min-h-[44px] flex items-center gap-2 px-7 py-2.5 rounded-xl text-xs sm:text-sm font-bold cursor-pointer"
                >
                  {isCopied ? <Check size={16} /> : <Copy size={16} />}
                  <span>{isCopied ? '喜报文本已复制！可发给家长' : '一键复制喜报文本'}</span>
                </button>

                <button
                  onClick={() => setShowHonorScroll(false)}
                  className="duo-btn-secondary min-h-[44px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold cursor-pointer"
                >
                  查看详细学情图表
                </button>
              </div>
            </div>
          </div>
        ) : (
        <div className="px-4 py-5 sm:p-6 max-w-6xl mx-auto w-full space-y-6">
          {/* Great Hall Four Houses Gem Hourglasses */}
          <HouseHourglasses
            userHouse={activeHouse}
            summary={currentSummary}
            onOpenHouseSelector={onOpenHouseSelector}
          />

          {/* 4 Habit Tracking Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            
            {/* 1. Continuous Streak Days */}
            <div className={`p-4 rounded-2xl border ${theme.cardBorder} ${theme.cardBg} relative overflow-hidden flex flex-col justify-between`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold ${theme.secondaryText}`}>
                  连续打卡天数
                </span>
                <div className="p-1.5 rounded-xl bg-orange-500/15 text-orange-500 border border-orange-500/30">
                  <Flame size={16} className={currentSummary.streakDays > 0 ? 'animate-pulse text-orange-500' : 'text-stone-400'} />
                </div>
              </div>
              <div>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-2xl sm:text-3xl font-bold font-mono text-orange-500 tracking-tight">
                    {currentSummary.streakDays}
                  </span>
                  <span className={`text-xs ${theme.unitText}`}>天</span>
                </div>
                <div className={`text-[11px] mt-1.5 flex items-center gap-1 ${theme.secondaryText} font-medium`}>
                  <Zap size={11} className="text-amber-500" />
                  <span>历史最长: {currentSummary.longestStreakDays} 天</span>
                </div>
              </div>
            </div>

            {/* 2. Total Listening Time */}
            <div className={`p-4 rounded-2xl border ${theme.cardBorder} ${theme.cardBg} flex flex-col justify-between`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold ${theme.secondaryText}`}>
                  累计专注听力
                </span>
                <div className="p-1.5 rounded-xl bg-amber-500/15 text-amber-700 border border-amber-300/80">
                  <Clock size={16} />
                </div>
              </div>
              <div>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-2xl sm:text-3xl font-bold font-mono text-amber-700 tracking-tight">
                    {totalHours > 0 ? `${totalHours}h` : ''}{totalMinutes}
                  </span>
                  <span className={`text-xs ${theme.unitText}`}>
                    {totalHours > 0 ? '分钟' : '分钟'}
                  </span>
                </div>
                <div className={`text-[11px] mt-1.5 ${theme.secondaryText}`}>
                  共 {currentSummary.totalListeningSeconds} 秒精听输入
                </div>
              </div>
            </div>

            {/* 3. Completed Chapters Count */}
            <div className={`p-4 rounded-2xl border ${theme.cardBorder} ${theme.cardBg} flex flex-col justify-between`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold ${theme.secondaryText}`}>
                  已学完章节
                </span>
                <div className="p-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                  <BookOpen size={16} />
                </div>
              </div>
              <div>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-600 tracking-tight">
                    {currentSummary.completedChaptersCount}
                  </span>
                  <span className={`text-xs ${theme.unitText}`}>篇</span>
                </div>
                <div className={`text-[11px] mt-1.5 ${theme.secondaryText}`}>
                  原著有声书通读成就
                </div>
              </div>
            </div>

            {/* 4. Mastered Vocabulary Count */}
            <div className={`p-4 rounded-2xl border ${theme.cardBorder} ${theme.cardBg} flex flex-col justify-between`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold ${theme.secondaryText}`}>
                  生词库收录
                </span>
                <div className="p-1.5 rounded-xl bg-amber-500/15 text-amber-800 border border-amber-300/60">
                  <Bookmark size={16} />
                </div>
              </div>
              <div>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-2xl sm:text-3xl font-bold font-mono text-amber-900 tracking-tight">
                    {vocabCount}
                  </span>
                  <span className={`text-xs ${theme.unitText}`}>词</span>
                </div>
                <div className={`text-[11px] mt-1.5 ${theme.secondaryText}`}>
                  支持打印羊皮纸单词卡与 CSV
                </div>
              </div>
            </div>

          </div>

          {/* Chart 1: Weekly Listening Minutes Bar Chart */}
          <div className={`p-5 rounded-3xl border ${theme.cardBorder} ${theme.cardBg}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Calendar size={16} className="text-amber-600" />
                <h3 className="font-bold text-sm tracking-wide text-amber-950">
                  本周听力时长分布 (最近 7 天)
                </h3>
              </div>
              <span className={`text-xs ${theme.secondaryText}`}>
                单位: 分钟 (min)
              </span>
            </div>

            {/* SVG Bar Chart */}
            <div className="relative w-full overflow-x-auto">
              <svg 
                viewBox={`0 0 ${chartWidth} ${chartHeight + 35}`} 
                className="w-full h-44 sm:h-52 select-none"
              >
                <defs>
                  <linearGradient id="goldBarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#fcd34d" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                  <linearGradient id="activeBarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#fb923c" />
                    <stop offset="100%" stopColor="#ea580c" />
                  </linearGradient>
                </defs>

                {/* Subtle horizontal grid lines */}
                {[0, 0.25, 0.5, 0.75, 1.0].map((ratio, idx) => {
                  const y = chartHeight - ratio * (chartHeight - 30);
                  const val = Math.round(ratio * maxWeeklyMinutes);
                  return (
                    <g key={idx}>
                      <line 
                        x1="0" 
                        y1={y} 
                        x2={chartWidth} 
                        y2={y} 
                        stroke={theme.gridStroke} 
                        strokeDasharray={ratio === 0 ? '0' : '4 4'}
                        strokeWidth="1"
                      />
                      <text 
                        x="4" 
                        y={y - 4} 
                        fontSize="9" 
                        fill={theme.axisFill}
                        fontFamily="monospace"
                      >
                        {val}m
                      </text>
                    </g>
                  );
                })}

                {/* Bars for 7 days */}
                {weeklyData.map((d, idx) => {
                  const x = barGap + idx * (barWidth + barGap);
                  const safeMinutes = (typeof d?.minutes === 'number' && Number.isFinite(d.minutes) && d.minutes >= 0) ? d.minutes : 0;
                  const barH = maxWeeklyMinutes > 0 ? (safeMinutes / maxWeeklyMinutes) * (chartHeight - 30) : 0;
                  const y = chartHeight - (Number.isFinite(barH) ? barH : 0);
                  const isHovered = hoveredBarIndex === idx;
                  const isToday = idx === weeklyData.length - 1;

                  return (
                    <g 
                      key={idx}
                      className="cursor-pointer transition-all"
                      onMouseEnter={() => setHoveredBarIndex(idx)}
                      onMouseLeave={() => setHoveredBarIndex(null)}
                    >
                      {/* Interactive hover background column */}
                      <rect
                        x={x - barGap / 2}
                        y={10}
                        width={barWidth + barGap}
                        height={chartHeight + 20}
                        fill={isHovered ? 'rgba(245,158,11,0.08)' : 'transparent'}
                        rx="6"
                      />

                      {/* Actual value bar */}
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={Math.max(3, barH)}
                        rx="6"
                        fill={isToday ? 'url(#activeBarGradient)' : 'url(#goldBarGradient)'}
                        stroke={isHovered ? '#ffffff' : (isToday ? '#f97316' : '#f59e0b')}
                        strokeWidth={isHovered ? 2 : 1}
                        className="transition-all duration-200"
                      />

                      {/* Minutes text on top of bar */}
                      {d.minutes > 0 && (
                        <text
                          x={x + barWidth / 2}
                          y={y - 6}
                          textAnchor="middle"
                          fontSize="10"
                          fontWeight="bold"
                          fontFamily="monospace"
                          fill={isHovered ? '#d97706' : '#1e1610'}
                        >
                          {d.minutes}m
                        </text>
                      )}

                      {/* Day Label (e.g. 周一, 周二) */}
                      <text
                        x={x + barWidth / 2}
                        y={chartHeight + 16}
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight={isToday ? 'bold' : 'normal'}
                        fill={isToday ? '#d97706' : '#78716c'}
                      >
                        {dayZhMap[d.day] || d.day}
                        {isToday ? ' (今)' : ''}
                      </text>

                      {/* Date label (MM-DD) */}
                      <text
                        x={x + barWidth / 2}
                        y={chartHeight + 28}
                        textAnchor="middle"
                        fontSize="9"
                        fontFamily="monospace"
                        fill="#a89985"
                      >
                        {d.date ? d.date.slice(5) : ''}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Hover Tooltip Info */}
            {hoveredBarIndex !== null && weeklyData[hoveredBarIndex] && (
              <div className="mt-2 text-xs flex items-center justify-center gap-2 font-mono py-1 rounded-xl bg-stone-100 border border-[#e8ddd0] text-[#1e1610]">
                <span>{weeklyData[hoveredBarIndex].date} ({dayZhMap[weeklyData[hoveredBarIndex].day] || weeklyData[hoveredBarIndex].day})</span>
                <span>•</span>
                <span>听力时长: <strong>{weeklyData[hoveredBarIndex].minutes}</strong> 分钟</span>
              </div>
            )}
          </div>

          {/* Chart 2: Dictation Accuracy History Trend Curve */}
          <div className={`p-5 rounded-3xl border ${theme.cardBorder} ${theme.cardBg}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 mb-4">
              <div className="flex items-center space-x-2">
                <TrendingUp size={16} className="text-emerald-500 shrink-0" />
                <h3 className="font-bold text-xs sm:text-sm tracking-wide text-amber-950">
                  听写练习准确率走势 (最近 10 次练习)
                </h3>
              </div>
              <span className={`text-[11px] sm:text-xs ${theme.secondaryText} font-medium`}>
                优秀基准线: 80% (O.W.L.s 优秀)
              </span>
            </div>

            {dictationData.length === 0 ? (
              // Empty State
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
                <Sparkles size={28} className="text-amber-500 animate-bounce" />
                <p className="text-sm font-semibold text-stone-700">暂无听写练习记录</p>
                <p className="text-xs max-w-sm text-stone-500">
                  切换至顶部【听写工坊】完成第 1 篇逐句听写，准确率走势图将在此自动绘制！
                </p>
              </div>
            ) : (
              // SVG Curve Chart
              <div className="relative w-full overflow-x-auto">
                <svg 
                  viewBox={`0 0 ${trendSvgWidth} ${trendSvgHeight + 25}`} 
                  className="w-full h-44 sm:h-52 select-none"
                >
                  <defs>
                    <linearGradient id="trendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Guideline: 80% Benchmark */}
                  {(() => {
                    const usableHeight = trendSvgHeight - trendPaddingY * 2;
                    const y80 = trendSvgHeight - trendPaddingY - (80 / 100) * usableHeight;
                    return (
                      <g>
                        <line 
                          x1={trendPaddingX} 
                          y1={y80} 
                          x2={trendSvgWidth - trendPaddingX} 
                          y2={y80} 
                          stroke="#10b981" 
                          strokeDasharray="4 4" 
                          strokeWidth="1.5" 
                          strokeOpacity="0.6"
                        />
                        <text 
                          x={trendSvgWidth - trendPaddingX + 5} 
                          y={y80 + 3} 
                          fontSize="9" 
                          fill="#10b981" 
                          fontFamily="monospace"
                        >
                          80%
                        </text>
                      </g>
                    );
                  })()}

                  {/* Axis Baseline: 0% */}
                  {(() => {
                    const y0 = trendSvgHeight - trendPaddingY;
                    return (
                      <line 
                        x1={trendPaddingX} 
                        y1={y0} 
                        x2={trendSvgWidth - trendPaddingX} 
                        y2={y0} 
                        stroke={theme.gridStroke} 
                        strokeWidth="1.5"
                      />
                    );
                  })()}

                  {/* Gradient Area under trend curve */}
                  {trendAreaPath && (
                    <path d={trendAreaPath} fill="url(#trendGradient)" />
                  )}

                  {/* Trend connecting line */}
                  {trendLinePath && (
                    <path 
                      d={trendLinePath} 
                      fill="none" 
                      stroke="#10b981" 
                      strokeWidth="2.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Data Points */}
                  {trendPoints.map((pt, idx) => {
                    const isHovered = hoveredPointIndex === idx;
                    const isExcellent = pt.accuracy >= 80;
                    return (
                      <g 
                        key={idx}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredPointIndex(idx)}
                        onMouseLeave={() => setHoveredPointIndex(null)}
                      >
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isHovered ? 7 : 5}
                          fill={isExcellent ? '#10b981' : '#f59e0b'}
                          stroke="#ffffff"
                          strokeWidth="2"
                          className="transition-all duration-150"
                        />

                        {/* Text label above point */}
                        <text
                          x={pt.x}
                          y={pt.y - 10}
                          textAnchor="middle"
                          fontSize="10"
                          fontWeight="bold"
                          fontFamily="monospace"
                          fill={isExcellent ? '#10b981' : '#f59e0b'}
                        >
                          {pt.accuracy}%
                        </text>

                        {/* Date label below axis */}
                        <text
                          x={pt.x}
                          y={trendSvgHeight - trendPaddingY + 16}
                          textAnchor="middle"
                          fontSize="9"
                          fontFamily="monospace"
                          fill="#a89985"
                        >
                          {pt.date ? pt.date.slice(5) : `#${idx + 1}`}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            )}

            {/* Hover Tooltip for Trend Point */}
            {hoveredPointIndex !== null && trendPoints[hoveredPointIndex] && (
              <div className="mt-2 text-xs flex items-center justify-center gap-2 font-mono py-1 rounded-xl bg-stone-100 border border-[#e8ddd0] text-emerald-800">
                <span>练习日期: {trendPoints[hoveredPointIndex].date}</span>
                <span>•</span>
                <span>听写准确率: <strong>{trendPoints[hoveredPointIndex].accuracy}%</strong></span>
              </div>
            )}
            {/* Section: Local-First Cloud Sync & Device Pairing */}
            <div className="p-4 sm:p-5 rounded-3xl border border-[#e8ddd0] bg-white space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center shrink-0">
                    <Cloud size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-amber-950">
                      魔法云漫游 · 多设备增量同步
                    </h3>
                    <p className="text-[11px] text-stone-500 font-reading">
                      本地优先 (0ms 离线可用) · 跨手机/平板/电脑实时漫游
                    </p>
                  </div>
                </div>

                {/* Sync status badge + Sync button */}
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                    syncState.status === 'synced'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : syncState.status === 'syncing' || isSyncing
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : syncState.status === 'offline'
                      ? 'bg-stone-100 text-stone-600 border-stone-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      syncState.status === 'synced' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`} />
                    <span>{syncState.status === 'synced' ? '已同步' : (syncState.status === 'syncing' || isSyncing) ? '同步中' : '离线可用'}</span>
                  </span>

                  <button
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="duo-btn-secondary min-h-[44px] min-w-[44px] w-11 h-11 rounded-xl text-xs font-bold flex items-center justify-center cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
                    title={isSyncing ? '正在与云端同步...' : '立即与云端同步最新数据'}
                    aria-label={isSyncing ? '正在与云端同步...' : '立即与云端同步最新数据'}
                  >
                    <RefreshCw size={14} className={isSyncing ? 'animate-spin text-amber-600' : 'text-stone-500'} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[#f0e8dc]">
                {/* Passcode card */}
                <div className="p-3.5 rounded-2xl bg-[#fbf9f5] border border-[#e8ddd0]">
                  <p className="text-[11px] font-bold text-stone-500 mb-1">本机魔法通行码 (Passcode)</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-lg text-amber-950 tracking-wider">
                      {syncState.meta?.syncCode || 'HP-DEMO'}
                    </span>
                    <button
                      onClick={handleCopySyncCode}
                      className="duo-btn-secondary min-h-[44px] min-w-[44px] w-11 h-11 rounded-xl text-xs font-bold flex items-center justify-center cursor-pointer active:scale-95 shrink-0"
                      title={copiedSyncCode ? '已复制魔法通行码' : '复制本机魔法通行码'}
                      aria-label={copiedSyncCode ? '已复制魔法通行码' : '复制本机魔法通行码'}
                    >
                      {copiedSyncCode ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} className="text-stone-600" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-stone-500 mt-1.5 font-reading">
                    在另一台设备（如 iPhone 或新电脑）输入此口令，两端生词本与打卡进度将自动合并。
                  </p>
                </div>

                {/* Pairing Form */}
                <form onSubmit={handlePairDevice} className="p-3.5 rounded-2xl bg-[#fbf9f5] border border-[#e8ddd0] flex flex-col justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-stone-500 mb-1.5">连接其他设备通行码</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={pairCodeInput}
                        onChange={(e) => setPairCodeInput(e.target.value.toUpperCase())}
                        placeholder="例如 HP-8F29"
                        maxLength={10}
                        autoCapitalize="characters"
                        autoCorrect="off"
                        spellCheck="false"
                        className="min-w-0 flex-1 h-11 px-3.5 rounded-xl border border-amber-200 bg-white font-mono text-sm font-bold focus:border-amber-500 focus:outline-none uppercase"
                      />
                      <button
                        type="submit"
                        disabled={isPairing || !pairCodeInput.trim()}
                        className="duo-btn-primary h-11 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer disabled:opacity-50"
                      >
                        {isPairing ? <RefreshCw size={13} className="animate-spin shrink-0" /> : <Smartphone size={13} className="shrink-0" />}
                        <span className="whitespace-nowrap">配对合并</span>
                      </button>
                    </div>
                  </div>

                  {pairMessage && (
                    <p className={`text-[11px] font-bold mt-2 ${
                      pairMessage.type === 'success' ? 'text-emerald-700' : 'text-rose-600'
                    }`}>
                      {pairMessage.text}
                    </p>
                  )}
                </form>
              </div>
            </div>

            {/* Bottom subtle note */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-400 pt-3 select-none">
              <Info size={12} className="text-amber-600/70 shrink-0" />
              <span>学情与生词数据本地毫秒读取，已连接 Cloudflare D1 边缘增量同步</span>
            </div>
          </div>
        </div>
        )}
        </div>

        {/* O.W.L.s Academic Certificate Modal */}
        <OwlsCertificateModal
          isOpen={showOwlsCertificate}
          onClose={() => setShowOwlsCertificate(false)}
          userHouse={activeHouse}
          summary={currentSummary}
          vocabCount={vocabCount}
        />
      </div>
  );

  if (isPageView) {
    return dashboardContent;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      {dashboardContent}
    </div>
  );
}

export default AnalyticsDashboard;
