import React from "react";
import {
  Sparkles,
  Bookmark,
  EyeOff,
  PenTool,
  Sun,
  Moon,
  HelpCircle,
  Volume2,
  Library,
  Download,
  RotateCw,
  BarChart2,
  Flame
} from "lucide-react";
function Header({
  books = [],
  selectedBook,
  setSelectedBook,
  selectedChapter,
  setSelectedChapter,
  studyMode,
  setStudyMode,
  isParchment,
  setIsParchment,
  onOpenVocab,
  onOpenShortcuts,
  onOpenShelf,
  onRefreshCatalog,
  isRefreshing,
  onInstallPwa,
  canInstallPwa,
  vocabCount = 0,
  onOpenAnalytics,
  streakDays = 0
}) {
  const currentBook = books && books.find((b) => b.id === selectedBook) || books[0];
  return /* @__PURE__ */ React.createElement("header", { className: `border-b transition-colors duration-300 ${isParchment ? "bg-[#fbf6ea] border-[#dec9a5] text-[#2d1e12]" : "bg-[#0b0f16]/95 border-[#202b3c] text-[#e2d9c8] backdrop-blur-md"} sticky top-0 z-40 px-4 py-2.5 shadow-xl` }, /* @__PURE__ */ React.createElement("div", { className: "max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center space-x-3 w-full md:w-auto justify-between md:justify-start" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center space-x-2.5" }, /* @__PURE__ */ React.createElement("span", { className: "text-2xl animate-float" }, "\u26A1"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { className: "font-magical text-lg sm:text-xl font-bold tracking-wider text-[#d3a625] text-gold-glow flex items-center gap-2" }, "Hogwarts Audio English", /* @__PURE__ */ React.createElement("span", { className: "text-[10px] px-2 py-0.5 rounded-full bg-[#740001] text-amber-200 border border-amber-400/40 font-sans uppercase font-semibold" }, "\u9752\u5C11\u7248\u7CBE\u542C")), /* @__PURE__ */ React.createElement("p", { className: `text-[11px] ${isParchment ? "text-[#7d6852]" : "text-[#8c9ba5]"}` }, "\u970D\u683C\u6C83\u8328\u539F\u7248\u6709\u58F0\u4E66 \xB7 \u9010\u53E5\u7CBE\u542C \xB7 \u542C\u5199\u6253\u5B57 \xB7 \u9B54\u6CD5\u8BCD\u5178"))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center space-x-1.5 md:hidden" }, canInstallPwa && /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: onInstallPwa,
      className: "p-1.5 rounded-lg border border-[#d3a625] bg-[#d3a625]/20 text-[#f3d38c]",
      title: "\u5B89\u88C5\u5230\u684C\u9762"
    },
    /* @__PURE__ */ React.createElement(Download, { size: 16 })
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: onOpenShelf,
      className: "p-1.5 rounded-lg border border-[#cba358]/40 text-[#cba358]",
      title: "\u6253\u5F00\u9B54\u6CD5\u4E66\u67B6"
    },
    /* @__PURE__ */ React.createElement(Library, { size: 16 })
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: onOpenAnalytics,
      className: "p-1.5 rounded-lg border border-[#d3a625]/60 bg-[#d3a625]/10 text-[#f3d38c] relative",
      title: "\u67E5\u770B\u5B66\u4E1A\u6570\u636E\u7F57\u76D8"
    },
    /* @__PURE__ */ React.createElement(BarChart2, { size: 16 }),
    streakDays > 0 && /* @__PURE__ */ React.createElement("span", { className: "absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-500 rounded-full border border-black animate-pulse" })
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setIsParchment(!isParchment),
      title: "\u5207\u6362\u4E3B\u9898",
      className: "p-1.5 rounded-lg border border-[#cba358]/40 text-[#cba358]"
    },
    isParchment ? /* @__PURE__ */ React.createElement(Moon, { size: 16 }) : /* @__PURE__ */ React.createElement(Sun, { size: 16 })
  ))), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-2 w-full md:w-auto" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: onOpenShelf,
      className: "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#cba358]/50 bg-[#cba358]/10 text-[#f3d38c] hover:bg-[#cba358]/20 text-xs font-semibold transition-all shadow-sm",
      title: "\u67E5\u770B\u5168\u90E8 R2 \u539F\u8457\u85CF\u4E66"
    },
    /* @__PURE__ */ React.createElement(Library, { size: 14, className: "text-[#cba358]" }),
    /* @__PURE__ */ React.createElement("span", { className: "truncate max-w-[140px] sm:max-w-[200px]" }, currentBook ? currentBook.cnTitle || currentBook.title : "\u9B54\u6CD5\u4E66\u67B6")
  ), /* @__PURE__ */ React.createElement("div", { className: "flex items-center space-x-1 text-sm" }, /* @__PURE__ */ React.createElement(Sparkles, { size: 14, className: "text-[#cba358]" }), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: selectedChapter,
      onChange: (e) => setSelectedChapter(e.target.value),
      className: `text-xs rounded-lg px-2.5 py-1.5 border font-reading focus:outline-none focus:ring-1 focus:ring-[#cba358] transition-colors max-w-[220px] truncate ${isParchment ? "bg-[#fffdf8] border-[#dec9a5] text-[#2d1e12]" : "bg-[#151c27] border-[#2b394e] text-[#e2d9c8]"}`
    },
    (currentBook?.chapters || []).map((ch) => /* @__PURE__ */ React.createElement("option", { key: ch.id, value: ch.id }, "Ch.", ch.number, ": ", ch.title, " ", ch.duration ? `(${ch.duration})` : ""))
  )), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: onRefreshCatalog,
      disabled: isRefreshing,
      className: "p-1.5 rounded-lg border border-gray-700 hover:border-[#cba358] text-gray-400 hover:text-[#cba358] transition-colors",
      title: "\u5B9E\u65F6\u5237\u65B0 R2 \u6700\u65B0\u7AE0\u8282"
    },
    /* @__PURE__ */ React.createElement(RotateCw, { size: 13, className: isRefreshing ? "animate-spin text-[#cba358]" : "" })
  )), /* @__PURE__ */ React.createElement("div", { className: "flex items-center space-x-2 w-full md:w-auto justify-end" }, canInstallPwa && /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: onInstallPwa,
      className: "hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#d3a625] bg-gradient-to-r from-[#d3a625]/20 to-[#cba358]/20 text-[#f3d38c] hover:shadow-glow-gold text-xs font-semibold transition-all animate-pulse",
      title: "\u4E00\u952E\u5B89\u88C5\u4E3A\u72EC\u7ACB\u684C\u9762\u5E94\u7528"
    },
    /* @__PURE__ */ React.createElement(Download, { size: 13 }),
    /* @__PURE__ */ React.createElement("span", null, "\u5B89\u88C5 App")
  ), /* @__PURE__ */ React.createElement("div", { className: `flex rounded-lg p-0.5 border text-xs ${isParchment ? "bg-[#ede2c9] border-[#dec9a5]" : "bg-[#151c27] border-[#283549]"}` }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setStudyMode("normal"),
      className: `px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${studyMode === "normal" ? "bg-[#d3a625] text-[#090d14] font-bold shadow-sm" : "text-[#8c9ba5] hover:text-[#f3d38c]"}`,
      title: "\u53CC\u8BED\u7CBE\u542C\u4E0E\u540C\u6B65\u9AD8\u4EAE"
    },
    /* @__PURE__ */ React.createElement(Volume2, { size: 13 }),
    /* @__PURE__ */ React.createElement("span", null, "\u7CBE\u542C")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setStudyMode("blind"),
      className: `px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${studyMode === "blind" ? "bg-[#d3a625] text-[#090d14] font-bold shadow-sm" : "text-[#8c9ba5] hover:text-[#f3d38c]"}`,
      title: "\u76F2\u542C\u78E8\u8033\u6735\u6A21\u5F0F\uFF08\u5B57\u5E55\u8FF7\u96FE\u906E\u7F69\uFF09"
    },
    /* @__PURE__ */ React.createElement(EyeOff, { size: 13 }),
    /* @__PURE__ */ React.createElement("span", null, "\u76F2\u542C")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setStudyMode("dictation"),
      className: `px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${studyMode === "dictation" ? "bg-[#d3a625] text-[#090d14] font-bold shadow-sm" : "text-[#8c9ba5] hover:text-[#f3d38c]"}`,
      title: "\u8FDB\u5165\u542C\u5199\u6253\u5B57\u7EC3\u4E60\u5DE5\u574A"
    },
    /* @__PURE__ */ React.createElement(PenTool, { size: 13 }),
    /* @__PURE__ */ React.createElement("span", null, "\u542C\u5199\u5DE5\u574A")
  )), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setIsParchment(!isParchment),
      title: "\u5207\u6362\u7F8A\u76AE\u7EB8 / \u9B54\u6CD5\u591C\u7A7A\u4E3B\u9898",
      className: "hidden md:flex p-1.5 rounded-lg border border-[#cba358]/40 hover:bg-[#cba358]/20 text-[#cba358] transition-colors"
    },
    isParchment ? /* @__PURE__ */ React.createElement(Moon, { size: 15 }) : /* @__PURE__ */ React.createElement(Sun, { size: 15 })
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: onOpenVocab,
      title: "\u6253\u5F00\u9B54\u6CD5\u751F\u8BCD\u672C",
      className: "relative flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#cba358]/40 text-[#cba358] hover:bg-[#cba358]/20 text-xs font-semibold transition-colors"
    },
    /* @__PURE__ */ React.createElement(Bookmark, { size: 14 }),
    /* @__PURE__ */ React.createElement("span", { className: "hidden sm:inline" }, "\u751F\u8BCD\u672C"),
    vocabCount > 0 && /* @__PURE__ */ React.createElement("span", { className: "ml-0.5 px-1.5 py-0.2 bg-[#740001] text-white text-[10px] rounded-full font-bold" }, vocabCount)
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: onOpenAnalytics,
      title: `\u6253\u5F00\u970D\u683C\u6C83\u8328\u5B66\u4E1A\u6570\u636E\u7F57\u76D8${streakDays > 0 ? ` (\u5DF2\u8FDE\u7EED\u6253\u5361 ${streakDays} \u5929)` : ""}`,
      className: "relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#d3a625]/60 bg-[#d3a625]/10 hover:bg-[#d3a625]/20 text-[#f3d38c] text-xs font-semibold transition-all shadow-sm group"
    },
    /* @__PURE__ */ React.createElement(BarChart2, { size: 14, className: "text-[#d3a625] group-hover:scale-110 transition-transform" }),
    /* @__PURE__ */ React.createElement("span", { className: "hidden sm:inline" }, "\u5B66\u4E1A\u7F57\u76D8"),
    streakDays > 0 ? /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-0.5 px-1.5 py-0.2 bg-gradient-to-r from-orange-600 to-amber-600 text-white text-[10px] rounded-full font-bold shadow" }, /* @__PURE__ */ React.createElement(Flame, { size: 10, className: "animate-pulse text-amber-200" }), /* @__PURE__ */ React.createElement("span", null, `${streakDays}\u5929`)) : /* @__PURE__ */ React.createElement("span", { className: "ml-0.5 px-1.5 py-0.2 bg-[#d3a625]/30 text-[#fce498] text-[10px] rounded-full font-bold" }, "0\u5929")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: onOpenShortcuts,
      title: "\u5FEB\u6377\u952E\u6307\u5357",
      className: "p-1.5 rounded-lg border border-gray-700 text-[#8c9ba5] hover:text-[#cba358] transition-colors"
    },
    /* @__PURE__ */ React.createElement(HelpCircle, { size: 15 })
  ))));
}
export {
  Header
};
