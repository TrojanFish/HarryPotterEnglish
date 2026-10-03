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
  Check
} from 'lucide-react';
import { getAnalyticsSummary } from '../utils/analyticsStore';

export function AnalyticsDashboard({
  isOpen,
  onClose,
  isParchment = true,
  vocabCount = 0
}) {
  const [summary, setSummary] = useState(null);
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);
  const [hoveredPointIndex, setHoveredPointIndex] = useState(null);
  const [showHonorScroll, setShowHonorScroll] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Reload statistics whenever modal opens
  useEffect(() => {
    if (isOpen) {
      const data = getAnalyticsSummary();
      setSummary(data);
    }
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Main Modal Container */}
      <div className={`relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl border shadow-2xl transition-all z-10 ${
        isParchment
          ? 'bg-[#fbf6ea] border-[#dec9a5] text-[#2d1e12]'
          : 'bg-[#0e1422] border-[#223147] text-[#e2d9c8]'
      }`}>
        
        {/* Header Bar */}
        <div className={`sticky top-0 z-20 flex items-center justify-between px-6 py-4 border-b backdrop-blur-md ${
          isParchment
            ? 'bg-[#f7eed9]/95 border-[#dec9a5]'
            : 'bg-[#0d131f]/95 border-[#202b3c]'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#740001] to-[#ae0001] text-amber-200 border border-amber-500/40 shadow-md">
              <BarChart2 size={20} className="text-[#fce498]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-magical tracking-wide text-[#d3a625] text-gold-glow flex items-center gap-2">
                霍格沃茨学业数据罗盘
                <span className="text-[11px] font-sans px-2 py-0.5 rounded-full bg-[#d3a625]/20 text-[#f3d38c] border border-[#d3a625]/30">
                  学情追踪
                </span>
              </h2>
              <p className={`text-xs ${isParchment ? 'text-[#7d6852]' : 'text-[#8c9ba5]'}`}>
                学习习惯追踪 · 听力专注时长 · 听写准确度罗盘
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowHonorScroll(!showHonorScroll)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300/80 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-xs hover:shadow active:scale-95 transition-all cursor-pointer"
              title="生成精美羊皮纸学业喜报，便于分享给家长或班级群"
            >
              <Award size={14} />
              <span>{showHonorScroll ? '返回学情图表' : '魔法学业喜报'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl border border-amber-200/80 bg-white/80 hover:bg-amber-100/70 text-slate-600 hover:text-amber-900 hover:border-amber-400 transition-all active:scale-90 shadow-2xs cursor-pointer"
              title="关闭罗盘 (ESC)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {showHonorScroll ? (
          <div className="p-6 sm:p-8 space-y-6 animate-fadeIn">
            <div className="p-6 sm:p-8 rounded-3xl border-2 border-amber-400/80 bg-gradient-to-br from-[#fffdf8] via-[#faf6ee] to-[#f5ecda] shadow-xl text-center relative overflow-hidden">
              {/* Background Watermark Accent */}
              <div className="absolute right-3 -bottom-6 pointer-events-none opacity-5 text-amber-700">
                <Award size={200} />
              </div>

              {/* Scroll Crest Header */}
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-900 border border-amber-400/40 text-xs font-bold mb-3 shadow-2xs">
                <Sparkles size={13} className="text-amber-700" />
                <span>霍格沃茨学业喜报 · 魔法之星荣誉卷轴</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-bold font-magical text-amber-950 mb-2">
                学海探秘 · 见证卓越成长
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 font-reading max-w-lg mx-auto mb-7 leading-relaxed">
                “以好奇为魔杖，以坚持为魔药。每一个专注聆听的清晨与夜晚，都在构筑你的纯正英语语感！”
              </p>

              {/* 4 Pillars Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-7">
                <div className="p-4 rounded-2xl border border-amber-200/90 bg-white/90 shadow-xs">
                  <div className="text-amber-700 flex items-center justify-center mb-1">
                    <Flame size={20} className="text-orange-500" />
                  </div>
                  <div className="font-magical font-bold text-2xl text-amber-950">
                    {currentSummary.streakDays} <span className="text-xs text-slate-400 font-normal">天</span>
                  </div>
                  <div className="text-xs text-slate-500 font-bold mt-0.5">连续坚持研读</div>
                </div>

                <div className="p-4 rounded-2xl border border-amber-200/90 bg-white/90 shadow-xs">
                  <div className="text-amber-700 flex items-center justify-center mb-1">
                    <Clock size={20} className="text-amber-600" />
                  </div>
                  <div className="font-magical font-bold text-2xl text-amber-950">
                    {weeklyMinutesTotal} <span className="text-xs text-slate-400 font-normal">分</span>
                  </div>
                  <div className="text-xs text-slate-500 font-bold mt-0.5">本周专注精听</div>
                </div>

                <div className="p-4 rounded-2xl border border-amber-200/90 bg-white/90 shadow-xs">
                  <div className="text-amber-700 flex items-center justify-center mb-1">
                    <BookOpen size={20} className="text-emerald-600" />
                  </div>
                  <div className="font-magical font-bold text-2xl text-amber-950">
                    {currentSummary.completedChaptersCount} <span className="text-xs text-slate-400 font-normal">章</span>
                  </div>
                  <div className="text-xs text-slate-500 font-bold mt-0.5">攻克原声章节</div>
                </div>

                <div className="p-4 rounded-2xl border border-amber-200/90 bg-white/90 shadow-xs">
                  <div className="text-amber-700 flex items-center justify-center mb-1">
                    <Bookmark size={20} className="text-blue-600" />
                  </div>
                  <div className="font-magical font-bold text-2xl text-amber-950">
                    {vocabCount} <span className="text-xs text-slate-400 font-normal">词</span>
                  </div>
                  <div className="text-xs text-slate-500 font-bold mt-0.5">魔法生词收录</div>
                </div>
              </div>

              {/* Share Action Bar */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleCopyHonorReport}
                  className="flex items-center gap-2 px-7 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg active:scale-95 cursor-pointer transition-all"
                >
                  {isCopied ? <Check size={16} /> : <Copy size={16} />}
                  <span>{isCopied ? '喜报文本已复制！可发给家长' : '一键复制喜报文本'}</span>
                </button>

                <button
                  onClick={() => setShowHonorScroll(false)}
                  className="px-5 py-2.5 rounded-2xl border border-amber-300/80 bg-white hover:bg-amber-50 text-amber-950 font-bold text-xs sm:text-sm shadow-xs active:scale-95 cursor-pointer transition-all"
                >
                  查看详细学情图表
                </button>
              </div>
            </div>
          </div>
        ) : (
        <div className="p-5 sm:p-6 space-y-6">

          {/* 4 Habit Tracking Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            
            {/* 1. Continuous Streak Days */}
            <div className={`p-4 rounded-xl border relative overflow-hidden flex flex-col justify-between ${
              isParchment
                ? 'bg-[#fffdf8] border-[#dec9a5] shadow-sm'
                : 'bg-[#131b2a] border-[#223147] shadow-lg'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold ${isParchment ? 'text-[#7d6852]' : 'text-[#8c9ba5]'}`}>
                  连续打卡天数
                </span>
                <div className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  <Flame size={16} className={currentSummary.streakDays > 0 ? 'animate-pulse text-orange-400' : 'text-gray-500'} />
                </div>
              </div>
              <div>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-3xl font-black font-mono text-orange-400">
                    {currentSummary.streakDays}
                  </span>
                  <span className={`text-xs ${isParchment ? 'text-[#7d6852]' : 'text-[#8c9ba5]'}`}>天</span>
                </div>
                <div className={`text-[11px] mt-1.5 flex items-center gap-1 ${
                  isParchment ? 'text-[#8c745c]' : 'text-[#708294]'
                }`}>
                  <Zap size={11} className="text-amber-400" />
                  <span>历史最长: {currentSummary.longestStreakDays} 天</span>
                </div>
              </div>
            </div>

            {/* 2. Total Listening Time */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between ${
              isParchment
                ? 'bg-[#fffdf8] border-[#dec9a5] shadow-sm'
                : 'bg-[#131b2a] border-[#223147] shadow-lg'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold ${isParchment ? 'text-[#7d6852]' : 'text-[#8c9ba5]'}`}>
                  累计专注听力
                </span>
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-[#d3a625] border border-amber-500/30">
                  <Clock size={16} />
                </div>
              </div>
              <div>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-3xl font-black font-mono text-[#d3a625]">
                    {totalHours > 0 ? `${totalHours}h` : ''}{totalMinutes}
                  </span>
                  <span className={`text-xs ${isParchment ? 'text-[#7d6852]' : 'text-[#8c9ba5]'}`}>
                    {totalHours > 0 ? '分钟' : '分钟'}
                  </span>
                </div>
                <div className={`text-[11px] mt-1.5 ${isParchment ? 'text-[#8c745c]' : 'text-[#708294]'}`}>
                  共 {currentSummary.totalListeningSeconds} 秒精听输入
                </div>
              </div>
            </div>

            {/* 3. Completed Chapters Count */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between ${
              isParchment
                ? 'bg-[#fffdf8] border-[#dec9a5] shadow-sm'
                : 'bg-[#131b2a] border-[#223147] shadow-lg'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold ${isParchment ? 'text-[#7d6852]' : 'text-[#8c9ba5]'}`}>
                  已学完章节
                </span>
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <BookOpen size={16} />
                </div>
              </div>
              <div>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-3xl font-black font-mono text-emerald-400">
                    {currentSummary.completedChaptersCount}
                  </span>
                  <span className={`text-xs ${isParchment ? 'text-[#7d6852]' : 'text-[#8c9ba5]'}`}>篇</span>
                </div>
                <div className={`text-[11px] mt-1.5 ${isParchment ? 'text-[#8c745c]' : 'text-[#708294]'}`}>
                  原著有声书通读成就
                </div>
              </div>
            </div>

            {/* 4. Mastered Vocabulary Count */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between ${
              isParchment
                ? 'bg-[#fffdf8] border-[#dec9a5] shadow-sm'
                : 'bg-[#131b2a] border-[#223147] shadow-lg'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold ${isParchment ? 'text-[#7d6852]' : 'text-[#8c9ba5]'}`}>
                  生词库收录
                </span>
                <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <Bookmark size={16} />
                </div>
              </div>
              <div>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-3xl font-black font-mono text-purple-400">
                    {vocabCount}
                  </span>
                  <span className={`text-xs ${isParchment ? 'text-[#7d6852]' : 'text-[#8c9ba5]'}`}>词</span>
                </div>
                <div className={`text-[11px] mt-1.5 ${isParchment ? 'text-[#8c745c]' : 'text-[#708294]'}`}>
                  支持一键导出至 Anki
                </div>
              </div>
            </div>

          </div>

          {/* Chart 1: Weekly Listening Minutes Bar Chart */}
          <div className={`p-5 rounded-2xl border ${
            isParchment
              ? 'bg-[#fffdf8] border-[#dec9a5]'
              : 'bg-[#131b2a] border-[#223147]'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Calendar size={16} className="text-[#d3a625]" />
                <h3 className="font-bold text-sm tracking-wide">
                  本周听力时长分布 (最近 7 天)
                </h3>
              </div>
              <span className={`text-xs ${isParchment ? 'text-[#7d6852]' : 'text-[#8c9ba5]'}`}>
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
                    <stop offset="0%" stopColor="#f3d38c" />
                    <stop offset="100%" stopColor="#d3a625" />
                  </linearGradient>
                  <linearGradient id="activeBarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ffb020" />
                    <stop offset="100%" stopColor="#e67e22" />
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
                        stroke={isParchment ? '#e8dcbe' : '#1e293b'} 
                        strokeDasharray={ratio === 0 ? '0' : '4 4'}
                        strokeWidth="1"
                      />
                      <text 
                        x="4" 
                        y={y - 4} 
                        fontSize="9" 
                        fill={isParchment ? '#998369' : '#64748b'}
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
                  const barH = maxWeeklyMinutes > 0 ? (d.minutes / maxWeeklyMinutes) * (chartHeight - 30) : 0;
                  const y = chartHeight - barH;
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
                        fill={isHovered ? (isParchment ? 'rgba(211,166,37,0.1)' : 'rgba(211,166,37,0.08)') : 'transparent'}
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
                        stroke={isHovered ? '#ffffff' : (isToday ? '#f39c12' : '#cba358')}
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
                          fill={isHovered ? '#d3a625' : (isParchment ? '#2d1e12' : '#e2d9c8')}
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
                        fill={isToday ? '#d3a625' : (isParchment ? '#5c4834' : '#94a3b8')}
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
                        fill={isParchment ? '#8c745c' : '#64748b'}
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
              <div className={`mt-2 text-xs flex items-center justify-center gap-2 font-mono py-1 rounded-lg ${
                isParchment ? 'bg-[#ede2c9] text-[#2d1e12]' : 'bg-[#182335] text-[#f3d38c]'
              }`}>
                <span>{weeklyData[hoveredBarIndex].date} ({dayZhMap[weeklyData[hoveredBarIndex].day] || weeklyData[hoveredBarIndex].day})</span>
                <span>•</span>
                <span>听力时长: <strong>{weeklyData[hoveredBarIndex].minutes}</strong> 分钟</span>
              </div>
            )}
          </div>

          {/* Chart 2: Dictation Accuracy History Trend Curve */}
          <div className={`p-5 rounded-2xl border ${
            isParchment
              ? 'bg-[#fffdf8] border-[#dec9a5]'
              : 'bg-[#131b2a] border-[#223147]'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <TrendingUp size={16} className="text-emerald-400" />
                <h3 className="font-bold text-sm tracking-wide">
                  听写练习准确率走势 (最近 10 次练习)
                </h3>
              </div>
              <span className={`text-xs ${isParchment ? 'text-[#7d6852]' : 'text-[#8c9ba5]'}`}>
                优秀基准线: 80% (O.W.L.s 优秀)
              </span>
            </div>

            {dictationData.length === 0 ? (
              // Empty State
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
                <Sparkles size={28} className="text-[#cba358] animate-bounce" />
                <p className="text-sm font-semibold">暂无听写练习记录</p>
                <p className={`text-xs max-w-sm ${isParchment ? 'text-[#7d6852]' : 'text-[#8c9ba5]'}`}>
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
                        stroke={isParchment ? '#dec9a5' : '#1e293b'} 
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
                          stroke={isHovered ? '#ffffff' : (isParchment ? '#fbf6ea' : '#0e1422')}
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
                          fill={isParchment ? '#8c745c' : '#64748b'}
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
              <div className={`mt-2 text-xs flex items-center justify-center gap-2 font-mono py-1 rounded-lg ${
                isParchment ? 'bg-[#ede2c9] text-[#2d1e12]' : 'bg-[#182335] text-emerald-300'
              }`}>
                <span>练习日期: {trendPoints[hoveredPointIndex].date}</span>
                <span>•</span>
                <span>听写准确率: <strong>{trendPoints[hoveredPointIndex].accuracy}%</strong></span>
              </div>
            )}
          </div>

        </div>
        )}

        {/* Footer info note */}
        <div className={`px-6 py-3 border-t text-[11px] flex items-center justify-between ${
          isParchment 
            ? 'bg-[#f7eed9] border-[#dec9a5] text-[#7d6852]' 
            : 'bg-[#0d131f] border-[#202b3c] text-[#8c9ba5]'
        }`}>
          <div className="flex items-center gap-1.5">
            <Info size={13} className="text-[#cba358]" />
            <span>数据已采用双键冗余持久化同步至本地存储，随时离线学习。</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-xs hover:shadow active:scale-95 cursor-pointer transition-all ring-1 ring-amber-300/30"
          >
            完成查看
          </button>
        </div>

      </div>
    </div>
  );
}

export default AnalyticsDashboard;
