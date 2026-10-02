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
  Info
} from "lucide-react";
import { getAnalyticsSummary } from "../src/utils/analyticsStore.js";
function AnalyticsDashboard({
  isOpen,
  onClose,
  isParchment = false,
  vocabCount = 0
}) {
  const [summary, setSummary] = useState(null);
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);
  const [hoveredPointIndex, setHoveredPointIndex] = useState(null);
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
  const weeklyData = currentSummary.weeklyListeningMinutes || [];
  const maxWeeklyMinutes = Math.max(15, ...weeklyData.map((d) => d.minutes || 0));
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
  return /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn" }, /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0", onClick: onClose, "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("div", { className: `relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl border shadow-2xl transition-all z-10 ${isParchment ? "bg-[#fbf6ea] border-[#dec9a5] text-[#2d1e12]" : "bg-[#0e1422] border-[#223147] text-[#e2d9c8]"}` }, /* @__PURE__ */ React.createElement("div", { className: `sticky top-0 z-20 flex items-center justify-between px-6 py-4 border-b backdrop-blur-md ${isParchment ? "bg-[#f7eed9]/95 border-[#dec9a5]" : "bg-[#0d131f]/95 border-[#202b3c]"}` }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center space-x-3" }, /* @__PURE__ */ React.createElement("div", { className: "p-2 rounded-xl bg-gradient-to-br from-[#740001] to-[#ae0001] text-amber-200 border border-amber-500/40 shadow-md" }, /* @__PURE__ */ React.createElement(BarChart2, { size: 20, className: "text-[#fce498]" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { className: "text-lg sm:text-xl font-bold font-magical tracking-wide text-[#d3a625] text-gold-glow flex items-center gap-2" }, "\u970D\u683C\u6C83\u8328\u5B66\u4E1A\u6570\u636E\u7F57\u76D8", /* @__PURE__ */ React.createElement("span", { className: "text-[11px] font-sans px-2 py-0.5 rounded-full bg-[#d3a625]/20 text-[#f3d38c] border border-[#d3a625]/30" }, "Visual Analytics")), /* @__PURE__ */ React.createElement("p", { className: `text-xs ${isParchment ? "text-[#7d6852]" : "text-[#8c9ba5]"}` }, "\u5B66\u4E60\u4E60\u60EF\u8FFD\u8E2A \xB7 \u542C\u529B\u4E13\u6CE8\u65F6\u957F \xB7 \u542C\u5199\u51C6\u786E\u5EA6\u7F57\u76D8"))), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: onClose,
      className: `p-2 rounded-xl border transition-colors ${isParchment ? "border-[#dec9a5] hover:bg-[#ede2c9] text-[#7d6852]" : "border-gray-700 hover:border-gray-500 hover:bg-gray-800 text-gray-400 hover:text-white"}`,
      title: "\u5173\u95ED\u7F57\u76D8 (ESC)"
    },
    /* @__PURE__ */ React.createElement(X, { size: 18 })
  )), /* @__PURE__ */ React.createElement("div", { className: "p-5 sm:p-6 space-y-6" }, /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" }, /* @__PURE__ */ React.createElement("div", { className: `p-4 rounded-xl border relative overflow-hidden flex flex-col justify-between ${isParchment ? "bg-[#fffdf8] border-[#dec9a5] shadow-sm" : "bg-[#131b2a] border-[#223147] shadow-lg"}` }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-2" }, /* @__PURE__ */ React.createElement("span", { className: `text-xs font-semibold ${isParchment ? "text-[#7d6852]" : "text-[#8c9ba5]"}` }, "\u8FDE\u7EED\u6253\u5361\u5929\u6570"), /* @__PURE__ */ React.createElement("div", { className: "p-1.5 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30" }, /* @__PURE__ */ React.createElement(Flame, { size: 16, className: currentSummary.streakDays > 0 ? "animate-pulse text-orange-400" : "text-gray-500" }))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "flex items-baseline space-x-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "text-3xl font-black font-mono text-orange-400" }, currentSummary.streakDays), /* @__PURE__ */ React.createElement("span", { className: `text-xs ${isParchment ? "text-[#7d6852]" : "text-[#8c9ba5]"}` }, "\u5929")), /* @__PURE__ */ React.createElement("div", { className: `text-[11px] mt-1.5 flex items-center gap-1 ${isParchment ? "text-[#8c745c]" : "text-[#708294]"}` }, /* @__PURE__ */ React.createElement(Zap, { size: 11, className: "text-amber-400" }), /* @__PURE__ */ React.createElement("span", null, "\u5386\u53F2\u6700\u957F: ", currentSummary.longestStreakDays, " \u5929")))), /* @__PURE__ */ React.createElement("div", { className: `p-4 rounded-xl border flex flex-col justify-between ${isParchment ? "bg-[#fffdf8] border-[#dec9a5] shadow-sm" : "bg-[#131b2a] border-[#223147] shadow-lg"}` }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-2" }, /* @__PURE__ */ React.createElement("span", { className: `text-xs font-semibold ${isParchment ? "text-[#7d6852]" : "text-[#8c9ba5]"}` }, "\u7D2F\u8BA1\u4E13\u6CE8\u542C\u529B"), /* @__PURE__ */ React.createElement("div", { className: "p-1.5 rounded-lg bg-amber-500/20 text-[#d3a625] border border-amber-500/30" }, /* @__PURE__ */ React.createElement(Clock, { size: 16 }))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "flex items-baseline space-x-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "text-3xl font-black font-mono text-[#d3a625]" }, totalHours > 0 ? `${totalHours}h` : "", totalMinutes), /* @__PURE__ */ React.createElement("span", { className: `text-xs ${isParchment ? "text-[#7d6852]" : "text-[#8c9ba5]"}` }, totalHours > 0 ? "\u5206\u949F" : "\u5206\u949F")), /* @__PURE__ */ React.createElement("div", { className: `text-[11px] mt-1.5 ${isParchment ? "text-[#8c745c]" : "text-[#708294]"}` }, "\u5171 ", currentSummary.totalListeningSeconds, " \u79D2\u7CBE\u542C\u8F93\u5165"))), /* @__PURE__ */ React.createElement("div", { className: `p-4 rounded-xl border flex flex-col justify-between ${isParchment ? "bg-[#fffdf8] border-[#dec9a5] shadow-sm" : "bg-[#131b2a] border-[#223147] shadow-lg"}` }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-2" }, /* @__PURE__ */ React.createElement("span", { className: `text-xs font-semibold ${isParchment ? "text-[#7d6852]" : "text-[#8c9ba5]"}` }, "\u5DF2\u5B66\u5B8C\u7AE0\u8282"), /* @__PURE__ */ React.createElement("div", { className: "p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" }, /* @__PURE__ */ React.createElement(BookOpen, { size: 16 }))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "flex items-baseline space-x-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "text-3xl font-black font-mono text-emerald-400" }, currentSummary.completedChaptersCount), /* @__PURE__ */ React.createElement("span", { className: `text-xs ${isParchment ? "text-[#7d6852]" : "text-[#8c9ba5]"}` }, "\u7BC7")), /* @__PURE__ */ React.createElement("div", { className: `text-[11px] mt-1.5 ${isParchment ? "text-[#8c745c]" : "text-[#708294]"}` }, "\u539F\u8457\u6709\u58F0\u4E66\u901A\u8BFB\u6210\u5C31"))), /* @__PURE__ */ React.createElement("div", { className: `p-4 rounded-xl border flex flex-col justify-between ${isParchment ? "bg-[#fffdf8] border-[#dec9a5] shadow-sm" : "bg-[#131b2a] border-[#223147] shadow-lg"}` }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-2" }, /* @__PURE__ */ React.createElement("span", { className: `text-xs font-semibold ${isParchment ? "text-[#7d6852]" : "text-[#8c9ba5]"}` }, "\u751F\u8BCD\u5E93\u6536\u5F55"), /* @__PURE__ */ React.createElement("div", { className: "p-1.5 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30" }, /* @__PURE__ */ React.createElement(Bookmark, { size: 16 }))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "flex items-baseline space-x-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "text-3xl font-black font-mono text-purple-400" }, vocabCount), /* @__PURE__ */ React.createElement("span", { className: `text-xs ${isParchment ? "text-[#7d6852]" : "text-[#8c9ba5]"}` }, "\u8BCD")), /* @__PURE__ */ React.createElement("div", { className: `text-[11px] mt-1.5 ${isParchment ? "text-[#8c745c]" : "text-[#708294]"}` }, "\u652F\u6301\u4E00\u952E\u5BFC\u51FA\u81F3 Anki")))), /* @__PURE__ */ React.createElement("div", { className: `p-5 rounded-2xl border ${isParchment ? "bg-[#fffdf8] border-[#dec9a5]" : "bg-[#131b2a] border-[#223147]"}` }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center space-x-2" }, /* @__PURE__ */ React.createElement(Calendar, { size: 16, className: "text-[#d3a625]" }), /* @__PURE__ */ React.createElement("h3", { className: "font-bold text-sm tracking-wide" }, "\u672C\u5468\u542C\u529B\u65F6\u957F\u5206\u5E03 (\u6700\u8FD1 7 \u5929)")), /* @__PURE__ */ React.createElement("span", { className: `text-xs ${isParchment ? "text-[#7d6852]" : "text-[#8c9ba5]"}` }, "\u5355\u4F4D: \u5206\u949F (min)")), /* @__PURE__ */ React.createElement("div", { className: "relative w-full overflow-x-auto" }, /* @__PURE__ */ React.createElement(
    "svg",
    {
      viewBox: `0 0 ${chartWidth} ${chartHeight + 35}`,
      className: "w-full h-44 sm:h-52 select-none"
    },
    /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("linearGradient", { id: "goldBarGradient", x1: "0%", y1: "0%", x2: "0%", y2: "100%" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: "#f3d38c" }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: "#d3a625" })), /* @__PURE__ */ React.createElement("linearGradient", { id: "activeBarGradient", x1: "0%", y1: "0%", x2: "0%", y2: "100%" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: "#ffb020" }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: "#e67e22" }))),
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
          stroke: isParchment ? "#e8dcbe" : "#1e293b",
          strokeDasharray: ratio === 0 ? "0" : "4 4",
          strokeWidth: "1"
        }
      ), /* @__PURE__ */ React.createElement(
        "text",
        {
          x: "4",
          y: y - 4,
          fontSize: "9",
          fill: isParchment ? "#998369" : "#64748b",
          fontFamily: "monospace"
        },
        val,
        "m"
      ));
    }),
    weeklyData.map((d, idx) => {
      const x = barGap + idx * (barWidth + barGap);
      const barH = maxWeeklyMinutes > 0 ? d.minutes / maxWeeklyMinutes * (chartHeight - 30) : 0;
      const y = chartHeight - barH;
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
            fill: isHovered ? isParchment ? "rgba(211,166,37,0.1)" : "rgba(211,166,37,0.08)" : "transparent",
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
            stroke: isHovered ? "#ffffff" : isToday ? "#f39c12" : "#cba358",
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
            fill: isHovered ? "#d3a625" : isParchment ? "#2d1e12" : "#e2d9c8"
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
            fill: isToday ? "#d3a625" : isParchment ? "#5c4834" : "#94a3b8"
          },
          d.day,
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
            fill: isParchment ? "#8c745c" : "#64748b"
          },
          d.date ? d.date.slice(5) : ""
        )
      );
    })
  )), hoveredBarIndex !== null && weeklyData[hoveredBarIndex] && /* @__PURE__ */ React.createElement("div", { className: `mt-2 text-xs flex items-center justify-center gap-2 font-mono py-1 rounded-lg ${isParchment ? "bg-[#ede2c9] text-[#2d1e12]" : "bg-[#182335] text-[#f3d38c]"}` }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4C5} ", weeklyData[hoveredBarIndex].date, " (", weeklyData[hoveredBarIndex].day, ")"), /* @__PURE__ */ React.createElement("span", null, "\u2022"), /* @__PURE__ */ React.createElement("span", null, "\u{1F3A7} \u542C\u529B\u65F6\u957F: ", /* @__PURE__ */ React.createElement("strong", null, weeklyData[hoveredBarIndex].minutes), " \u5206\u949F"))), /* @__PURE__ */ React.createElement("div", { className: `p-5 rounded-2xl border ${isParchment ? "bg-[#fffdf8] border-[#dec9a5]" : "bg-[#131b2a] border-[#223147]"}` }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center space-x-2" }, /* @__PURE__ */ React.createElement(TrendingUp, { size: 16, className: "text-emerald-400" }), /* @__PURE__ */ React.createElement("h3", { className: "font-bold text-sm tracking-wide" }, "\u542C\u5199\u7EC3\u4E60\u51C6\u786E\u7387\u8D70\u52BF (\u6700\u8FD1 10 \u6B21\u7EC3\u4E60)")), /* @__PURE__ */ React.createElement("span", { className: `text-xs ${isParchment ? "text-[#7d6852]" : "text-[#8c9ba5]"}` }, "\u4F18\u79C0\u57FA\u51C6\u7EBF: 80% (O.W.L.s \u4F18\u79C0)")), dictationData.length === 0 ? (
    // Empty State
    /* @__PURE__ */ React.createElement("div", { className: "py-12 flex flex-col items-center justify-center text-center space-y-2" }, /* @__PURE__ */ React.createElement(Sparkles, { size: 28, className: "text-[#cba358] animate-bounce" }), /* @__PURE__ */ React.createElement("p", { className: "text-sm font-semibold" }, "\u6682\u65E0\u542C\u5199\u7EC3\u4E60\u8BB0\u5F55"), /* @__PURE__ */ React.createElement("p", { className: `text-xs max-w-sm ${isParchment ? "text-[#7d6852]" : "text-[#8c9ba5]"}` }, "\u5207\u6362\u81F3\u9876\u90E8\u3010\u542C\u5199\u5DE5\u574A\u3011\u5B8C\u6210\u7B2C 1 \u7BC7\u9010\u53E5\u542C\u5199\uFF0C\u51C6\u786E\u7387\u8D70\u52BF\u56FE\u5C06\u5728\u6B64\u81EA\u52A8\u7ED8\u5236\uFF01"))
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
            stroke: isParchment ? "#dec9a5" : "#1e293b",
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
              stroke: isHovered ? "#ffffff" : isParchment ? "#fbf6ea" : "#0e1422",
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
              fill: isParchment ? "#8c745c" : "#64748b"
            },
            pt.date ? pt.date.slice(5) : `#${idx + 1}`
          )
        );
      })
    ))
  ), hoveredPointIndex !== null && trendPoints[hoveredPointIndex] && /* @__PURE__ */ React.createElement("div", { className: `mt-2 text-xs flex items-center justify-center gap-2 font-mono py-1 rounded-lg ${isParchment ? "bg-[#ede2c9] text-[#2d1e12]" : "bg-[#182335] text-emerald-300"}` }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4C5} \u7EC3\u4E60\u65E5\u671F: ", trendPoints[hoveredPointIndex].date), /* @__PURE__ */ React.createElement("span", null, "\u2022"), /* @__PURE__ */ React.createElement("span", null, "\u{1F3AF} \u542C\u5199\u51C6\u786E\u7387: ", /* @__PURE__ */ React.createElement("strong", null, trendPoints[hoveredPointIndex].accuracy, "%"))))), /* @__PURE__ */ React.createElement("div", { className: `px-6 py-3 border-t text-[11px] flex items-center justify-between ${isParchment ? "bg-[#f7eed9] border-[#dec9a5] text-[#7d6852]" : "bg-[#0d131f] border-[#202b3c] text-[#8c9ba5]"}` }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement(Info, { size: 13, className: "text-[#cba358]" }), /* @__PURE__ */ React.createElement("span", null, "\u6570\u636E\u5DF2\u91C7\u7528\u53CC\u952E\u5197\u4F59\u6301\u4E45\u5316\u540C\u6B65\u81F3\u672C\u5730\u5B58\u50A8\uFF0C\u968F\u65F6\u79BB\u7EBF\u5B66\u4E60\u3002")), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: onClose,
      className: "px-3 py-1 rounded-lg bg-[#d3a625] text-[#090d14] font-bold text-xs hover:bg-[#e0b435] transition-colors"
    },
    "\u5B8C\u6210\u67E5\u770B"
  ))));
}
var stdin_default = AnalyticsDashboard;
export {
  AnalyticsDashboard,
  stdin_default as default
};
