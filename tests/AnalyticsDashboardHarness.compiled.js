import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { getAnalyticsSummary } from "../src/utils/analyticsStore.js";
import { syncEngine } from "../src/utils/syncEngine.js";
function AnalyticsDashboardHarness({
  initialSummary = null,
  isOpen,
  onClose,
  isParchment = true,
  vocabCount = 0
}) {
  const [summary, setSummary] = useState(initialSummary);
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);
  const [hoveredPointIndex, setHoveredPointIndex] = useState(null);
  const [showHonorScroll, setShowHonorScroll] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [syncState, setSyncState] = useState(() => ({
    status: syncEngine.status,
    meta: syncEngine.getMeta()
  }));
  const [pairCodeInput, setPairCodeInput] = useState("");
  const [pairMessage, setPairMessage] = useState(null);
  const [isPairing, setIsPairing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedSyncCode, setCopiedSyncCode] = useState(false);
  useEffect(() => {
    const unsub = syncEngine.subscribe((data) => {
      setSyncState({ status: data.status, meta: data.meta });
    });
    return unsub;
  }, []);
  const handleCopySyncCode = () => {
    const code = syncState.meta?.syncCode || "HP-DEMO";
    navigator?.clipboard?.writeText(code).then(() => {
      setCopiedSyncCode(true);
      setTimeout(() => setCopiedSyncCode(false), 2e3);
    }).catch(() => {
    });
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
      setPairMessage({ type: "success", text: res.message || "\u914D\u5BF9\u6210\u529F\uFF0C\u5DF2\u540C\u6B65\u4E91\u7AEF\u6863\u6848\uFF01" });
      setPairCodeInput("");
      setSummary(getAnalyticsSummary());
    } catch (err) {
      setPairMessage({ type: "error", text: err.message });
    } finally {
      setIsPairing(false);
    }
  };
  useEffect(() => {
    if (isOpen) {
      const data = getAnalyticsSummary();
      setSummary(data);
    }
  }, [isOpen]);
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  const currentSummary = summary || {
    totalListeningSeconds: 0,
    weeklyListeningMinutes: [
      { day: "Sun", date: "", minutes: 0 },
      { day: "Mon", date: "", minutes: 0 },
      { day: "Tue", date: "", minutes: 0 },
      { day: "Wed", date: "", minutes: 0 },
      { day: "Thu", date: "", minutes: 0 },
      { day: "Fri", date: "", minutes: 0 },
      { day: "Sat", date: "", minutes: 0 }
    ],
    dictationTrend: [],
    completedChaptersCount: 0,
    streakDays: 0,
    longestStreakDays: 0
  };
  const totalHours = Math.floor(currentSummary.totalListeningSeconds / 3600);
  const totalMinutes = Math.floor(currentSummary.totalListeningSeconds % 3600 / 60);
  const weeklyMinutesTotal = (currentSummary.weeklyListeningMinutes || []).reduce((acc, d) => acc + (d.minutes || 0), 0);
  const handleCopyHonorReport = () => {
    const text = `\u3010\u970D\u683C\u6C83\u8328\u5B66\u4E1A\u559C\u62A5 \xB7 \u9B54\u6CD5\u4E4B\u661F\u8363\u8A89\u5377\u8F74\u3011
[\u6253\u5361] \u8FDE\u7EED\u7814\u5B66\u6253\u5361\uFF1A${currentSummary.streakDays} \u5929\uFF08\u5386\u53F2\u6700\u957F\u8FDE\u7EED ${currentSummary.longestStreakDays} \u5929\uFF09
[\u542C\u529B] \u672C\u5468\u4E13\u6CE8\u7CBE\u542C\uFF1A${weeklyMinutesTotal} \u5206\u949F\uFF08\u7D2F\u8BA1\u7CBE\u542C ${totalHours} \u5C0F\u65F6 ${totalMinutes} \u5206\u949F\uFF09
[\u7AE0\u8282] \u653B\u514B\u539F\u58F0\u7AE0\u8282\uFF1A${currentSummary.completedChaptersCount} \u7AE0
[\u8BCD\u6C47] \u9B54\u6CD5\u751F\u8BCD\u7D2F\u8BA1\uFF1A${vocabCount} \u4E2A
[\u5BC4\u8BED] \u201C\u4EE5\u597D\u5947\u4E3A\u9B54\u6756\uFF0C\u4EE5\u575A\u6301\u4E3A\u9B54\u836F\u3002\u6BCF\u4E00\u4E2A\u4E13\u6CE8\u8046\u542C\u7684\u6E05\u6668\u4E0E\u591C\u665A\uFF0C\u90FD\u5728\u6784\u7B51\u7EAF\u6B63\u82F1\u8BED\u8BED\u611F\uFF01\u201D`;
    if (navigator && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2e3);
      }).catch((e) => console.warn(e));
    }
  };
  const weeklyData = currentSummary.weeklyListeningMinutes || [];
  const maxWeeklyMinutes = Math.max(15, ...weeklyData.map((d) => d.minutes || 0));
  const dayZhMap = {
    Sun: "\u5468\u65E5",
    Mon: "\u5468\u4E00",
    Tue: "\u5468\u4E8C",
    Wed: "\u5468\u4E09",
    Thu: "\u5468\u56DB",
    Fri: "\u5468\u4E94",
    Sat: "\u5468\u516D"
  };
  const chartHeight = 160;
  const chartWidth = 520;
  const barWidth = 36;
  const barGap = (chartWidth - barWidth * 7) / 8;
  const dictationData = currentSummary.dictationTrend || [];
  const trendSvgWidth = 520;
  const trendSvgHeight = 160;
  const trendPaddingX = 40;
  const trendPaddingY = 25;
  const trendPoints = dictationData.map((item, idx) => {
    const x = dictationData.length === 1 ? trendSvgWidth / 2 : trendPaddingX + idx / (dictationData.length - 1) * (trendSvgWidth - trendPaddingX * 2);
    const usableHeight = trendSvgHeight - trendPaddingY * 2;
    const y = trendSvgHeight - trendPaddingY - Math.min(100, Math.max(0, item.accuracy || 0)) / 100 * usableHeight;
    return { x, y, ...item };
  });
  const trendLinePath = trendPoints.length > 1 ? trendPoints.reduce((acc, pt, idx) => `${acc} ${idx === 0 ? "M" : "L"} ${pt.x},${pt.y}`, "") : "";
  const trendAreaPath = trendPoints.length > 1 ? `${trendLinePath} L ${trendPoints[trendPoints.length - 1].x},${trendSvgHeight - trendPaddingY} L ${trendPoints[0].x},${trendSvgHeight - trendPaddingY} Z` : "";
  const theme = isParchment ? {
    modalBg: "bg-[#fbf6ea]",
    modalBorder: "border-[#dec9a5]",
    primaryText: "text-[#2d1e12]",
    cardBg: "bg-[#fffdf8]",
    cardBorder: "border-[#dec9a5]",
    secondaryText: "text-[#7d6852]",
    unitText: "text-[#7d6852]",
    gridStroke: "#e8dcbe",
    axisFill: "#998369",
    headerBg: "bg-white/95"
  } : {
    modalBg: "bg-[#0e1422]",
    modalBorder: "border-[#223147]",
    primaryText: "text-[#e2d9c8]",
    cardBg: "bg-[#131b2a]",
    cardBorder: "border-[#223147]",
    secondaryText: "text-[#8c9ba5]",
    unitText: "text-[#8c9ba5]",
    gridStroke: "#1e293b",
    axisFill: "#64748b",
    headerBg: "bg-[#0e1422]/95"
  };
  return /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn" }, /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0", onClick: onClose, "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("div", { className: `relative w-full max-w-4xl max-h-[88dvh] sm:max-h-[85dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border-t sm:border ${theme.modalBorder} ${theme.modalBg} ${theme.primaryText} transition-all z-10 pb-safe flex flex-col no-scrollbar` }, /* @__PURE__ */ React.createElement("div", { className: "sm:hidden w-10 h-1.5 bg-stone-300 rounded-full mx-auto my-2.5 shrink-0" }), /* @__PURE__ */ React.createElement("div", { className: "sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-[#e8ddd0] bg-white/95 backdrop-blur-md gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center space-x-2.5 sm:space-x-3 min-w-0 flex-1" }, /* @__PURE__ */ React.createElement("div", { className: "p-2 rounded-xl bg-amber-500/15 text-amber-700 border border-amber-300/80 shrink-0" }, /* @__PURE__ */ React.createElement(BarChart2, { size: 18, className: "text-amber-600 sm:w-5 sm:h-5" })), /* @__PURE__ */ React.createElement("div", { className: "min-w-0 flex-1" }, /* @__PURE__ */ React.createElement("h2", { className: "text-sm sm:text-xl font-bold font-magical tracking-wide text-amber-950 truncate flex items-center gap-1.5 sm:gap-2" }, /* @__PURE__ */ React.createElement("span", null, "\u970D\u683C\u6C83\u8328\u5B66\u4E1A\u6570\u636E\u7F57\u76D8"), /* @__PURE__ */ React.createElement("span", { className: "hidden sm:inline-flex text-[11px] font-sans px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-900 border border-amber-300/80 font-bold shrink-0" }, "\u5B66\u60C5\u8FFD\u8E2A")), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] sm:text-xs text-stone-500 truncate" }, /* @__PURE__ */ React.createElement("span", { className: "sm:hidden" }, "\u5B66\u60C5\u4E60\u60EF\u4E0E\u4E13\u6CE8\u8FFD\u8E2A"), /* @__PURE__ */ React.createElement("span", { className: "hidden sm:inline" }, "\u5B66\u4E60\u4E60\u60EF\u8FFD\u8E2A \xB7 \u542C\u529B\u4E13\u6CE8\u65F6\u957F \xB7 \u542C\u5199\u51C6\u786E\u5EA6")))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center space-x-1.5 sm:space-x-2 shrink-0" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setShowHonorScroll(!showHonorScroll),
      className: "duo-btn-primary min-h-[44px] flex items-center gap-1 sm:gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap shrink-0",
      title: "\u751F\u6210\u7CBE\u7F8E\u7F8A\u76AE\u7EB8\u5B66\u4E1A\u559C\u62A5\uFF0C\u4FBF\u4E8E\u5206\u4EAB\u7ED9\u5BB6\u957F\u6216\u73ED\u7EA7\u7FA4"
    },
    /* @__PURE__ */ React.createElement(Award, { size: 14, className: "shrink-0" }),
    /* @__PURE__ */ React.createElement("span", null, showHonorScroll ? "\u8FD4\u56DE\u56FE\u8868" : "\u5B66\u4E1A\u559C\u62A5")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: onClose,
      className: "duo-touch-target rounded-xl border border-[#e8ddd0] bg-white hover:bg-stone-100 text-stone-600 hover:text-amber-950 hover:border-amber-300 transition-all active:scale-90 cursor-pointer shrink-0",
      title: "\u5173\u95ED\u7F57\u76D8 (ESC)"
    },
    /* @__PURE__ */ React.createElement(X, { size: 18 })
  ))), showHonorScroll ? /* @__PURE__ */ React.createElement("div", { className: "p-6 sm:p-8 space-y-6 animate-fadeIn" }, /* @__PURE__ */ React.createElement("div", { className: "p-6 sm:p-8 rounded-3xl border border-amber-400/80 bg-gradient-to-br from-white via-[#fbf9f5] to-amber-500/5 text-center relative overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: "absolute right-3 -bottom-6 pointer-events-none opacity-5 text-amber-700" }, /* @__PURE__ */ React.createElement(Award, { size: 200 })), /* @__PURE__ */ React.createElement("div", { className: "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-500/15 text-amber-900 border border-amber-400/50 text-xs font-bold mb-3" }, /* @__PURE__ */ React.createElement(Sparkles, { size: 13, className: "text-amber-700" }), /* @__PURE__ */ React.createElement("span", null, "\u970D\u683C\u6C83\u8328\u5B66\u4E1A\u559C\u62A5 \xB7 \u9B54\u6CD5\u4E4B\u661F\u8363\u8A89\u5377\u8F74")), /* @__PURE__ */ React.createElement("h3", { className: "text-2xl sm:text-3xl font-bold font-magical text-amber-950 mb-2" }, "\u5B66\u6D77\u63A2\u79D8 \xB7 \u89C1\u8BC1\u5353\u8D8A\u6210\u957F"), /* @__PURE__ */ React.createElement("p", { className: "text-xs sm:text-sm text-stone-600 font-reading max-w-lg mx-auto mb-7 leading-relaxed" }, "\u201C\u4EE5\u597D\u5947\u4E3A\u9B54\u6756\uFF0C\u4EE5\u575A\u6301\u4E3A\u9B54\u836F\u3002\u6BCF\u4E00\u4E2A\u4E13\u6CE8\u8046\u542C\u7684\u6E05\u6668\u4E0E\u591C\u665A\uFF0C\u90FD\u5728\u6784\u7B51\u4F60\u7684\u7EAF\u6B63\u82F1\u8BED\u8BED\u611F\uFF01\u201D"), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-7" }, /* @__PURE__ */ React.createElement("div", { className: "p-4 rounded-2xl border border-[#e8ddd0] bg-white" }, /* @__PURE__ */ React.createElement("div", { className: "text-amber-700 flex items-center justify-center mb-1" }, /* @__PURE__ */ React.createElement(Flame, { size: 20, className: "text-orange-500" })), /* @__PURE__ */ React.createElement("div", { className: "font-sans font-bold text-2xl text-amber-950" }, currentSummary.streakDays, " ", /* @__PURE__ */ React.createElement("span", { className: "text-xs text-stone-400 font-normal" }, "\u5929")), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-stone-500 font-bold mt-0.5" }, "\u8FDE\u7EED\u575A\u6301\u7814\u8BFB")), /* @__PURE__ */ React.createElement("div", { className: "p-4 rounded-2xl border border-[#e8ddd0] bg-white" }, /* @__PURE__ */ React.createElement("div", { className: "text-amber-700 flex items-center justify-center mb-1" }, /* @__PURE__ */ React.createElement(Clock, { size: 20, className: "text-amber-600" })), /* @__PURE__ */ React.createElement("div", { className: "font-sans font-bold text-2xl text-amber-950" }, weeklyMinutesTotal, " ", /* @__PURE__ */ React.createElement("span", { className: "text-xs text-stone-400 font-normal" }, "\u5206")), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-stone-500 font-bold mt-0.5" }, "\u672C\u5468\u4E13\u6CE8\u7CBE\u542C")), /* @__PURE__ */ React.createElement("div", { className: "p-4 rounded-2xl border border-[#e8ddd0] bg-white" }, /* @__PURE__ */ React.createElement("div", { className: "text-amber-700 flex items-center justify-center mb-1" }, /* @__PURE__ */ React.createElement(BookOpen, { size: 20, className: "text-emerald-600" })), /* @__PURE__ */ React.createElement("div", { className: "font-sans font-bold text-2xl text-amber-950" }, currentSummary.completedChaptersCount, " ", /* @__PURE__ */ React.createElement("span", { className: "text-xs text-stone-400 font-normal" }, "\u7AE0")), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-stone-500 font-bold mt-0.5" }, "\u653B\u514B\u539F\u58F0\u7AE0\u8282")), /* @__PURE__ */ React.createElement("div", { className: "p-4 rounded-2xl border border-[#e8ddd0] bg-white" }, /* @__PURE__ */ React.createElement("div", { className: "text-amber-700 flex items-center justify-center mb-1" }, /* @__PURE__ */ React.createElement(Bookmark, { size: 20, className: "text-blue-600" })), /* @__PURE__ */ React.createElement("div", { className: "font-sans font-bold text-2xl text-amber-950" }, vocabCount, " ", /* @__PURE__ */ React.createElement("span", { className: "text-xs text-stone-400 font-normal" }, "\u8BCD")), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-stone-500 font-bold mt-0.5" }, "\u9B54\u6CD5\u751F\u8BCD\u6536\u5F55"))), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center justify-center gap-3 pt-2" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleCopyHonorReport,
      className: "duo-btn-primary min-h-[44px] flex items-center gap-2 px-7 py-2.5 rounded-2xl text-xs sm:text-sm font-bold cursor-pointer"
    },
    isCopied ? /* @__PURE__ */ React.createElement(Check, { size: 16 }) : /* @__PURE__ */ React.createElement(Copy, { size: 16 }),
    /* @__PURE__ */ React.createElement("span", null, isCopied ? "\u559C\u62A5\u6587\u672C\u5DF2\u590D\u5236\uFF01\u53EF\u53D1\u7ED9\u5BB6\u957F" : "\u4E00\u952E\u590D\u5236\u559C\u62A5\u6587\u672C")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setShowHonorScroll(false),
      className: "duo-btn-secondary min-h-[44px] px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold cursor-pointer"
    },
    "\u67E5\u770B\u8BE6\u7EC6\u5B66\u60C5\u56FE\u8868"
  )))) : /* @__PURE__ */ React.createElement("div", { className: "p-5 sm:p-6 space-y-6" }, /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" }, /* @__PURE__ */ React.createElement("div", { className: `p-4 rounded-2xl border ${theme.cardBorder} ${theme.cardBg} relative overflow-hidden flex flex-col justify-between` }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-2" }, /* @__PURE__ */ React.createElement("span", { className: `text-xs font-semibold ${theme.secondaryText}` }, "\u8FDE\u7EED\u6253\u5361\u5929\u6570"), /* @__PURE__ */ React.createElement("div", { className: "p-1.5 rounded-xl bg-orange-500/15 text-orange-500 border border-orange-500/30" }, /* @__PURE__ */ React.createElement(Flame, { size: 16, className: currentSummary.streakDays > 0 ? "animate-pulse text-orange-500" : "text-stone-400" }))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "flex items-baseline space-x-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "text-2xl sm:text-3xl font-bold font-mono text-orange-500 tracking-tight" }, currentSummary.streakDays), /* @__PURE__ */ React.createElement("span", { className: `text-xs ${theme.unitText}` }, "\u5929")), /* @__PURE__ */ React.createElement("div", { className: `text-[11px] mt-1.5 flex items-center gap-1 ${theme.secondaryText} font-medium` }, /* @__PURE__ */ React.createElement(Zap, { size: 11, className: "text-amber-500" }), /* @__PURE__ */ React.createElement("span", null, "\u5386\u53F2\u6700\u957F: ", currentSummary.longestStreakDays, " \u5929")))), /* @__PURE__ */ React.createElement("div", { className: `p-4 rounded-2xl border ${theme.cardBorder} ${theme.cardBg} flex flex-col justify-between` }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-2" }, /* @__PURE__ */ React.createElement("span", { className: `text-xs font-semibold ${theme.secondaryText}` }, "\u7D2F\u8BA1\u4E13\u6CE8\u542C\u529B"), /* @__PURE__ */ React.createElement("div", { className: "p-1.5 rounded-xl bg-amber-500/15 text-amber-700 border border-amber-300/80" }, /* @__PURE__ */ React.createElement(Clock, { size: 16 }))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "flex items-baseline space-x-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "text-2xl sm:text-3xl font-bold font-mono text-amber-700 tracking-tight" }, totalHours > 0 ? `${totalHours}h` : "", totalMinutes), /* @__PURE__ */ React.createElement("span", { className: `text-xs ${theme.unitText}` }, totalHours > 0 ? "\u5206\u949F" : "\u5206\u949F")), /* @__PURE__ */ React.createElement("div", { className: `text-[11px] mt-1.5 ${theme.secondaryText}` }, "\u5171 ", currentSummary.totalListeningSeconds, " \u79D2\u7CBE\u542C\u8F93\u5165"))), /* @__PURE__ */ React.createElement("div", { className: `p-4 rounded-2xl border ${theme.cardBorder} ${theme.cardBg} flex flex-col justify-between` }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-2" }, /* @__PURE__ */ React.createElement("span", { className: `text-xs font-semibold ${theme.secondaryText}` }, "\u5DF2\u5B66\u5B8C\u7AE0\u8282"), /* @__PURE__ */ React.createElement("div", { className: "p-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 border border-emerald-500/30" }, /* @__PURE__ */ React.createElement(BookOpen, { size: 16 }))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "flex items-baseline space-x-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "text-2xl sm:text-3xl font-bold font-mono text-emerald-600 tracking-tight" }, currentSummary.completedChaptersCount), /* @__PURE__ */ React.createElement("span", { className: `text-xs ${theme.unitText}` }, "\u7BC7")), /* @__PURE__ */ React.createElement("div", { className: `text-[11px] mt-1.5 ${theme.secondaryText}` }, "\u539F\u8457\u6709\u58F0\u4E66\u901A\u8BFB\u6210\u5C31"))), /* @__PURE__ */ React.createElement("div", { className: `p-4 rounded-2xl border ${theme.cardBorder} ${theme.cardBg} flex flex-col justify-between` }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-2" }, /* @__PURE__ */ React.createElement("span", { className: `text-xs font-semibold ${theme.secondaryText}` }, "\u751F\u8BCD\u5E93\u6536\u5F55"), /* @__PURE__ */ React.createElement("div", { className: "p-1.5 rounded-xl bg-amber-500/15 text-amber-800 border border-amber-300/60" }, /* @__PURE__ */ React.createElement(Bookmark, { size: 16 }))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "flex items-baseline space-x-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "text-2xl sm:text-3xl font-bold font-mono text-amber-900 tracking-tight" }, vocabCount), /* @__PURE__ */ React.createElement("span", { className: `text-xs ${theme.unitText}` }, "\u8BCD")), /* @__PURE__ */ React.createElement("div", { className: `text-[11px] mt-1.5 ${theme.secondaryText}` }, "\u652F\u6301\u6253\u5370\u7F8A\u76AE\u7EB8\u5355\u8BCD\u5361\u4E0E CSV")))), /* @__PURE__ */ React.createElement("div", { className: `p-5 rounded-3xl border ${theme.cardBorder} ${theme.cardBg}` }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center space-x-2" }, /* @__PURE__ */ React.createElement(Calendar, { size: 16, className: "text-amber-600" }), /* @__PURE__ */ React.createElement("h3", { className: "font-bold text-sm tracking-wide text-amber-950" }, "\u672C\u5468\u542C\u529B\u65F6\u957F\u5206\u5E03 (\u6700\u8FD1 7 \u5929)")), /* @__PURE__ */ React.createElement("span", { className: `text-xs ${theme.secondaryText}` }, "\u5355\u4F4D: \u5206\u949F (min)")), /* @__PURE__ */ React.createElement("div", { className: "relative w-full overflow-x-auto" }, /* @__PURE__ */ React.createElement(
    "svg",
    {
      viewBox: `0 0 ${chartWidth} ${chartHeight + 35}`,
      className: "w-full h-44 sm:h-52 select-none"
    },
    /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("linearGradient", { id: "goldBarGradient", x1: "0%", y1: "0%", x2: "0%", y2: "100%" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: "#fcd34d" }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: "#f59e0b" })), /* @__PURE__ */ React.createElement("linearGradient", { id: "activeBarGradient", x1: "0%", y1: "0%", x2: "0%", y2: "100%" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: "#fb923c" }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: "#ea580c" }))),
    [0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
      const y = chartHeight - ratio * (chartHeight - 30);
      const val = Math.round(ratio * maxWeeklyMinutes);
      return /* @__PURE__ */ React.createElement("g", { key: idx }, /* @__PURE__ */ React.createElement(
        "line",
        {
          x1: "0",
          y1: y,
          x2: chartWidth,
          y2: y,
          stroke: theme.gridStroke,
          strokeDasharray: ratio === 0 ? "0" : "4 4",
          strokeWidth: "1"
        }
      ), /* @__PURE__ */ React.createElement(
        "text",
        {
          x: "4",
          y: y - 4,
          fontSize: "9",
          fill: theme.axisFill,
          fontFamily: "monospace"
        },
        val,
        "m"
      ));
    }),
    weeklyData.map((d, idx) => {
      const x = barGap + idx * (barWidth + barGap);
      const safeMinutes = typeof d?.minutes === "number" && Number.isFinite(d.minutes) && d.minutes >= 0 ? d.minutes : 0;
      const barH = maxWeeklyMinutes > 0 ? safeMinutes / maxWeeklyMinutes * (chartHeight - 30) : 0;
      const y = chartHeight - (Number.isFinite(barH) ? barH : 0);
      const isHovered = hoveredBarIndex === idx;
      const isToday = idx === weeklyData.length - 1;
      return /* @__PURE__ */ React.createElement(
        "g",
        {
          key: idx,
          className: "cursor-pointer transition-all",
          onMouseEnter: () => setHoveredBarIndex(idx),
          onMouseLeave: () => setHoveredBarIndex(null)
        },
        /* @__PURE__ */ React.createElement(
          "rect",
          {
            x: x - barGap / 2,
            y: 10,
            width: barWidth + barGap,
            height: chartHeight + 20,
            fill: isHovered ? "rgba(245,158,11,0.08)" : "transparent",
            rx: "6"
          }
        ),
        /* @__PURE__ */ React.createElement(
          "rect",
          {
            x,
            y,
            width: barWidth,
            height: Math.max(3, barH),
            rx: "6",
            fill: isToday ? "url(#activeBarGradient)" : "url(#goldBarGradient)",
            stroke: isHovered ? "#ffffff" : isToday ? "#f97316" : "#f59e0b",
            strokeWidth: isHovered ? 2 : 1,
            className: "transition-all duration-200"
          }
        ),
        d.minutes > 0 && /* @__PURE__ */ React.createElement(
          "text",
          {
            x: x + barWidth / 2,
            y: y - 6,
            textAnchor: "middle",
            fontSize: "10",
            fontWeight: "bold",
            fontFamily: "monospace",
            fill: isHovered ? "#d97706" : "#1e1610"
          },
          d.minutes,
          "m"
        ),
        /* @__PURE__ */ React.createElement(
          "text",
          {
            x: x + barWidth / 2,
            y: chartHeight + 16,
            textAnchor: "middle",
            fontSize: "11",
            fontWeight: isToday ? "bold" : "normal",
            fill: isToday ? "#d97706" : "#78716c"
          },
          dayZhMap[d.day] || d.day,
          isToday ? " (\u4ECA)" : ""
        ),
        /* @__PURE__ */ React.createElement(
          "text",
          {
            x: x + barWidth / 2,
            y: chartHeight + 28,
            textAnchor: "middle",
            fontSize: "9",
            fontFamily: "monospace",
            fill: "#a89985"
          },
          d.date ? d.date.slice(5) : ""
        )
      );
    })
  )), hoveredBarIndex !== null && weeklyData[hoveredBarIndex] && /* @__PURE__ */ React.createElement("div", { className: "mt-2 text-xs flex items-center justify-center gap-2 font-mono py-1 rounded-xl bg-stone-100 border border-[#e8ddd0] text-[#1e1610]" }, /* @__PURE__ */ React.createElement("span", null, weeklyData[hoveredBarIndex].date, " (", dayZhMap[weeklyData[hoveredBarIndex].day] || weeklyData[hoveredBarIndex].day, ")"), /* @__PURE__ */ React.createElement("span", null, "\u2022"), /* @__PURE__ */ React.createElement("span", null, "\u542C\u529B\u65F6\u957F: ", /* @__PURE__ */ React.createElement("strong", null, weeklyData[hoveredBarIndex].minutes), " \u5206\u949F"))), /* @__PURE__ */ React.createElement("div", { className: `p-5 rounded-3xl border ${theme.cardBorder} ${theme.cardBg}` }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 mb-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center space-x-2" }, /* @__PURE__ */ React.createElement(TrendingUp, { size: 16, className: "text-emerald-500 shrink-0" }), /* @__PURE__ */ React.createElement("h3", { className: "font-bold text-xs sm:text-sm tracking-wide text-amber-950" }, "\u542C\u5199\u7EC3\u4E60\u51C6\u786E\u7387\u8D70\u52BF (\u6700\u8FD1 10 \u6B21\u7EC3\u4E60)")), /* @__PURE__ */ React.createElement("span", { className: `text-[11px] sm:text-xs ${theme.secondaryText} font-medium` }, "\u4F18\u79C0\u57FA\u51C6\u7EBF: 80% (O.W.L.s \u4F18\u79C0)")), dictationData.length === 0 ? (
    // Empty State
    /* @__PURE__ */ React.createElement("div", { className: "py-12 flex flex-col items-center justify-center text-center space-y-2" }, /* @__PURE__ */ React.createElement(Sparkles, { size: 28, className: "text-amber-500 animate-bounce" }), /* @__PURE__ */ React.createElement("p", { className: "text-sm font-semibold text-stone-700" }, "\u6682\u65E0\u542C\u5199\u7EC3\u4E60\u8BB0\u5F55"), /* @__PURE__ */ React.createElement("p", { className: "text-xs max-w-sm text-stone-500" }, "\u5207\u6362\u81F3\u9876\u90E8\u3010\u542C\u5199\u5DE5\u574A\u3011\u5B8C\u6210\u7B2C 1 \u7BC7\u9010\u53E5\u542C\u5199\uFF0C\u51C6\u786E\u7387\u8D70\u52BF\u56FE\u5C06\u5728\u6B64\u81EA\u52A8\u7ED8\u5236\uFF01"))
  ) : (
    // SVG Curve Chart
    /* @__PURE__ */ React.createElement("div", { className: "relative w-full overflow-x-auto" }, /* @__PURE__ */ React.createElement(
      "svg",
      {
        viewBox: `0 0 ${trendSvgWidth} ${trendSvgHeight + 25}`,
        className: "w-full h-44 sm:h-52 select-none"
      },
      /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("linearGradient", { id: "trendGradient", x1: "0%", y1: "0%", x2: "0%", y2: "100%" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: "#10b981", stopOpacity: "0.35" }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: "#10b981", stopOpacity: "0.0" }))),
      (() => {
        const usableHeight = trendSvgHeight - trendPaddingY * 2;
        const y80 = trendSvgHeight - trendPaddingY - 80 / 100 * usableHeight;
        return /* @__PURE__ */ React.createElement("g", null, /* @__PURE__ */ React.createElement(
          "line",
          {
            x1: trendPaddingX,
            y1: y80,
            x2: trendSvgWidth - trendPaddingX,
            y2: y80,
            stroke: "#10b981",
            strokeDasharray: "4 4",
            strokeWidth: "1.5",
            strokeOpacity: "0.6"
          }
        ), /* @__PURE__ */ React.createElement(
          "text",
          {
            x: trendSvgWidth - trendPaddingX + 5,
            y: y80 + 3,
            fontSize: "9",
            fill: "#10b981",
            fontFamily: "monospace"
          },
          "80%"
        ));
      })(),
      (() => {
        const y0 = trendSvgHeight - trendPaddingY;
        return /* @__PURE__ */ React.createElement(
          "line",
          {
            x1: trendPaddingX,
            y1: y0,
            x2: trendSvgWidth - trendPaddingX,
            y2: y0,
            stroke: theme.gridStroke,
            strokeWidth: "1.5"
          }
        );
      })(),
      trendAreaPath && /* @__PURE__ */ React.createElement("path", { d: trendAreaPath, fill: "url(#trendGradient)" }),
      trendLinePath && /* @__PURE__ */ React.createElement(
        "path",
        {
          d: trendLinePath,
          fill: "none",
          stroke: "#10b981",
          strokeWidth: "2.5",
          strokeLinecap: "round",
          strokeLinejoin: "round"
        }
      ),
      trendPoints.map((pt, idx) => {
        const isHovered = hoveredPointIndex === idx;
        const isExcellent = pt.accuracy >= 80;
        return /* @__PURE__ */ React.createElement(
          "g",
          {
            key: idx,
            className: "cursor-pointer",
            onMouseEnter: () => setHoveredPointIndex(idx),
            onMouseLeave: () => setHoveredPointIndex(null)
          },
          /* @__PURE__ */ React.createElement(
            "circle",
            {
              cx: pt.x,
              cy: pt.y,
              r: isHovered ? 7 : 5,
              fill: isExcellent ? "#10b981" : "#f59e0b",
              stroke: "#ffffff",
              strokeWidth: "2",
              className: "transition-all duration-150"
            }
          ),
          /* @__PURE__ */ React.createElement(
            "text",
            {
              x: pt.x,
              y: pt.y - 10,
              textAnchor: "middle",
              fontSize: "10",
              fontWeight: "bold",
              fontFamily: "monospace",
              fill: isExcellent ? "#10b981" : "#f59e0b"
            },
            pt.accuracy,
            "%"
          ),
          /* @__PURE__ */ React.createElement(
            "text",
            {
              x: pt.x,
              y: trendSvgHeight - trendPaddingY + 16,
              textAnchor: "middle",
              fontSize: "9",
              fontFamily: "monospace",
              fill: "#a89985"
            },
            pt.date ? pt.date.slice(5) : `#${idx + 1}`
          )
        );
      })
    ))
  ), hoveredPointIndex !== null && trendPoints[hoveredPointIndex] && /* @__PURE__ */ React.createElement("div", { className: "mt-2 text-xs flex items-center justify-center gap-2 font-mono py-1 rounded-xl bg-stone-100 border border-[#e8ddd0] text-emerald-800" }, /* @__PURE__ */ React.createElement("span", null, "\u7EC3\u4E60\u65E5\u671F: ", trendPoints[hoveredPointIndex].date), /* @__PURE__ */ React.createElement("span", null, "\u2022"), /* @__PURE__ */ React.createElement("span", null, "\u542C\u5199\u51C6\u786E\u7387: ", /* @__PURE__ */ React.createElement("strong", null, trendPoints[hoveredPointIndex].accuracy, "%"))), /* @__PURE__ */ React.createElement("div", { className: "p-4 sm:p-5 rounded-3xl border border-[#e8ddd0] bg-white space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center space-x-2" }, /* @__PURE__ */ React.createElement("div", { className: "w-8 h-8 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center shrink-0" }, /* @__PURE__ */ React.createElement(Cloud, { size: 16 })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "font-bold text-xs sm:text-sm text-amber-950" }, "\u9B54\u6CD5\u4E91\u6F2B\u6E38 \xB7 \u591A\u8BBE\u5907\u589E\u91CF\u540C\u6B65"), /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-stone-500 font-reading" }, "\u672C\u5730\u4F18\u5148 (0ms \u79BB\u7EBF\u53EF\u7528) \xB7 \u8DE8\u624B\u673A/\u5E73\u677F/\u7535\u8111\u5B9E\u65F6\u6F2B\u6E38"))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: `inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${syncState.status === "synced" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : syncState.status === "syncing" || isSyncing ? "bg-amber-50 text-amber-800 border-amber-200" : syncState.status === "offline" ? "bg-stone-100 text-stone-600 border-stone-200" : "bg-amber-50 text-amber-800 border-amber-200"}` }, /* @__PURE__ */ React.createElement("span", { className: `w-1.5 h-1.5 rounded-full ${syncState.status === "synced" ? "bg-emerald-500" : "bg-amber-500"}` }), /* @__PURE__ */ React.createElement("span", null, syncState.status === "synced" ? "\u5DF2\u540C\u6B65" : syncState.status === "syncing" || isSyncing ? "\u540C\u6B65\u4E2D" : "\u79BB\u7EBF\u53EF\u7528")), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleManualSync,
      disabled: isSyncing,
      className: "duo-btn-secondary min-h-[44px] min-w-[44px] w-11 h-11 rounded-xl text-xs font-bold flex items-center justify-center cursor-pointer active:scale-95 disabled:opacity-50 shrink-0",
      title: isSyncing ? "\u6B63\u5728\u4E0E\u4E91\u7AEF\u540C\u6B65..." : "\u7ACB\u5373\u4E0E\u4E91\u7AEF\u540C\u6B65\u6700\u65B0\u6570\u636E",
      "aria-label": isSyncing ? "\u6B63\u5728\u4E0E\u4E91\u7AEF\u540C\u6B65..." : "\u7ACB\u5373\u4E0E\u4E91\u7AEF\u540C\u6B65\u6700\u65B0\u6570\u636E"
    },
    /* @__PURE__ */ React.createElement(RefreshCw, { size: 14, className: isSyncing ? "animate-spin text-amber-600" : "text-stone-500" })
  ))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[#f0e8dc]" }, /* @__PURE__ */ React.createElement("div", { className: "p-3.5 rounded-2xl bg-[#fbf9f5] border border-[#e8ddd0]" }, /* @__PURE__ */ React.createElement("p", { className: "text-[11px] font-bold text-stone-500 mb-1" }, "\u672C\u673A\u9B54\u6CD5\u901A\u884C\u7801 (Passcode)"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "font-mono font-bold text-lg text-amber-950 tracking-wider" }, syncState.meta?.syncCode || "HP-DEMO"), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleCopySyncCode,
      className: "duo-btn-secondary min-h-[44px] min-w-[44px] w-11 h-11 rounded-xl text-xs font-bold flex items-center justify-center cursor-pointer active:scale-95 shrink-0",
      title: copiedSyncCode ? "\u5DF2\u590D\u5236\u9B54\u6CD5\u901A\u884C\u7801" : "\u590D\u5236\u672C\u673A\u9B54\u6CD5\u901A\u884C\u7801",
      "aria-label": copiedSyncCode ? "\u5DF2\u590D\u5236\u9B54\u6CD5\u901A\u884C\u7801" : "\u590D\u5236\u672C\u673A\u9B54\u6CD5\u901A\u884C\u7801"
    },
    copiedSyncCode ? /* @__PURE__ */ React.createElement(Check, { size: 15, className: "text-emerald-600" }) : /* @__PURE__ */ React.createElement(Copy, { size: 15, className: "text-stone-600" })
  )), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-stone-500 mt-1.5 font-reading" }, "\u5728\u53E6\u4E00\u53F0\u8BBE\u5907\uFF08\u5982 iPhone \u6216\u65B0\u7535\u8111\uFF09\u8F93\u5165\u6B64\u53E3\u4EE4\uFF0C\u4E24\u7AEF\u751F\u8BCD\u672C\u4E0E\u6253\u5361\u8FDB\u5EA6\u5C06\u81EA\u52A8\u5408\u5E76\u3002")), /* @__PURE__ */ React.createElement("form", { onSubmit: handlePairDevice, className: "p-3.5 rounded-2xl bg-[#fbf9f5] border border-[#e8ddd0] flex flex-col justify-between" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-[11px] font-bold text-stone-500 mb-1.5" }, "\u8FDE\u63A5\u5176\u4ED6\u8BBE\u5907\u901A\u884C\u7801"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      value: pairCodeInput,
      onChange: (e) => setPairCodeInput(e.target.value.toUpperCase()),
      placeholder: "\u4F8B\u5982 HP-8F29",
      maxLength: 10,
      autoCapitalize: "characters",
      autoCorrect: "off",
      spellCheck: "false",
      className: "min-w-0 flex-1 h-11 px-3.5 rounded-xl border border-amber-200 bg-white font-mono text-sm font-bold focus:border-amber-500 focus:outline-none uppercase"
    }
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "submit",
      disabled: isPairing || !pairCodeInput.trim(),
      className: "duo-btn-primary h-11 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer disabled:opacity-50"
    },
    isPairing ? /* @__PURE__ */ React.createElement(RefreshCw, { size: 13, className: "animate-spin shrink-0" }) : /* @__PURE__ */ React.createElement(Smartphone, { size: 13, className: "shrink-0" }),
    /* @__PURE__ */ React.createElement("span", { className: "whitespace-nowrap" }, "\u914D\u5BF9\u5408\u5E76")
  ))), pairMessage && /* @__PURE__ */ React.createElement("p", { className: `text-[11px] font-bold mt-2 ${pairMessage.type === "success" ? "text-emerald-700" : "text-rose-600"}` }, pairMessage.text)))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center gap-1.5 text-[11px] text-stone-400 pt-3 select-none" }, /* @__PURE__ */ React.createElement(Info, { size: 12, className: "text-amber-600/70 shrink-0" }), /* @__PURE__ */ React.createElement("span", null, "\u5B66\u60C5\u4E0E\u751F\u8BCD\u6570\u636E\u672C\u5730\u6BEB\u79D2\u8BFB\u53D6\uFF0C\u5DF2\u8FDE\u63A5 Cloudflare D1 \u8FB9\u7F18\u589E\u91CF\u540C\u6B65"))))));
}
var stdin_default = AnalyticsDashboardHarness;
export {
  AnalyticsDashboardHarness,
  stdin_default as default
};
