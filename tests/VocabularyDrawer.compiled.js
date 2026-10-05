import React, { useState, useEffect } from "react";
import {
  X,
  Trash2,
  Volume2,
  Download,
  Sparkles,
  Search,
  CheckCircle,
  BookOpen,
  BrainCircuit,
  Bookmark,
  Printer
} from "lucide-react";
import { generateAnkiTSV, downloadAnkiFile } from "../src/utils/ankiExport.js";
import { printParchmentCards } from "../src/utils/parchmentPdfGenerator.js";
function VocabularyDrawer({
  isOpen,
  onClose,
  vocabList,
  onRemoveWord,
  onClearAll,
  isParchment,
  onOpenSrs
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [toastMessage, setToastMessage] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };
  useEffect(() => {
    if (!isOpen) {
      setShowClearConfirm(false);
      return;
    }
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  const filteredList = vocabList.filter(
    (item) => item.word.toLowerCase().includes(searchTerm.toLowerCase()) || item.translation && item.translation.includes(searchTerm)
  );
  const playPronunciation = (word) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = "en-GB";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };
  const handleExportAnki = () => {
    if (!vocabList || vocabList.length === 0) return;
    const content = generateAnkiTSV(vocabList, { deckName: "Hogwarts Magic English" });
    downloadAnkiFile(content, `hogwarts_anki_${Date.now()}.tsv`);
    showToast("\u5DF2\u5BFC\u51FA Anki \u724C\u7EC4\u6587\u4EF6 (.tsv)\uFF0C\u53EF\u5728 Anki \u4E2D\u76F4\u63A5\u5BFC\u5165\uFF01");
  };
  const handleExportAnkiCloze = () => {
    if (!vocabList || vocabList.length === 0) return;
    const content = generateAnkiTSV(vocabList, { deckName: "Hogwarts Magic English (Cloze)", cloze: true });
    downloadAnkiFile(content, `hogwarts_anki_cloze_${Date.now()}.tsv`);
    showToast("\u5DF2\u5BFC\u51FA Anki Cloze \u586B\u7A7A\u5361\u724C\u7EC4 (.tsv)\uFF01");
  };
  const handleExportCSV = () => {
    if (vocabList.length === 0) return;
    const header = "Word,Phonetic,Part of Speech,Translation,Context\n";
    const rows = vocabList.map(
      (v) => `"${v.word}","${v.phonetic || ""}","${v.pos || ""}","${(v.translation || "").replace(/"/g, '""')}","${(v.context || "").replace(/"/g, '""')}"`
    ).join("\n");
    const blob = new Blob(["\uFEFF" + header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `hogwarts_vocab_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("\u5DF2\u6210\u529F\u5BFC\u51FA CSV \u5355\u8BCD\u8868\u683C\uFF01");
  };
  const handlePrintParchmentPdf = () => {
    if (vocabList.length === 0) return;
    printParchmentCards(vocabList, {
      title: "\u970D\u683C\u6C83\u8328\u9B54\u6CD5\u7CBE\u542C\u751F\u8BCD\u95EA\u5361 \xB7 Hogwarts Study Flashcards",
      subtitle: "A4 \u53CC\u5217\u4FBF\u643A\u526A\u88C1\u5361 \xB7 \u827E\u5BBE\u6D69\u65AF\u8BB0\u5FC6\u8FFD\u8E2A\u7248"
    });
    showToast("\u5DF2\u8C03\u8D77\u6253\u5370\u9884\u89C8\uFF0C\u53EF\u76F4\u63A5\u6253\u5370\u6216\u300C\u53E6\u5B58\u4E3A PDF\u300D\uFF01");
  };
  const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const boxCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let dueCount = 0;
  (vocabList || []).forEach((item) => {
    const lvl = item.srsLevel || item.srsBox || 1;
    boxCounts[lvl] = (boxCounts[lvl] || 0) + 1;
    if (!item.nextReviewDate || item.nextReviewDate <= todayStr) {
      dueCount += 1;
    }
  });
  const renderSrsBadge = (item) => {
    const level = item.srsLevel || item.srsBox || 1;
    const isDue = !item.nextReviewDate || item.nextReviewDate <= todayStr;
    const levelConfigs = {
      1: { label: "Box 1 \xB7 \u521D\u5B66", color: "bg-amber-100/90 text-amber-900 border-amber-300" },
      2: { label: "Box 2 \xB7 \u5DE9\u56FA", color: "bg-amber-200/70 text-amber-950 border-amber-400" },
      3: { label: "Box 3 \xB7 \u719F\u8BB0", color: "bg-blue-100/90 text-blue-900 border-blue-300" },
      4: { label: "Box 4 \xB7 \u957F\u6548", color: "bg-purple-100/90 text-purple-900 border-purple-300" },
      5: { label: "Box 5 \xB7 \u6C38\u4E45\u638C\u63E1", color: "bg-emerald-100 text-emerald-900 border-emerald-400 font-bold" }
    };
    const config = levelConfigs[level] || levelConfigs[1];
    return /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 mt-1 flex-wrap" }, /* @__PURE__ */ React.createElement("span", { className: `text-[10px] px-2 py-0.5 rounded-md border font-semibold ${config.color}` }, config.label), isDue && /* @__PURE__ */ React.createElement("span", { className: "text-[10px] px-1.5 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold animate-pulse border border-amber-600", title: "\u8BB0\u5FC6\u5C01\u5370\u677E\u52A8\uFF0C\u9700\u8981\u827E\u5BBE\u6D69\u65AF\u91CD\u94F8" }, "\u5F85\u91CD\u70BC \xB7 \u5C01\u5370\u677E\u52A8"));
  };
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex items-end sm:items-stretch sm:justify-end animate-fadeIn",
      onClick: onClose
    },
    /* @__PURE__ */ React.createElement(
      "div",
      {
        onClick: (e) => e.stopPropagation(),
        className: "w-full sm:w-screen sm:max-w-md flex flex-col max-h-[92dvh] sm:max-h-full rounded-t-3xl sm:rounded-none border-t sm:border-t-0 sm:border-l border-[#e8ddd0] bg-[#fbf9f5] text-[#1e1610] transition-colors duration-300 pb-safe overflow-hidden"
      },
      /* @__PURE__ */ React.createElement("div", { className: "sm:hidden w-10 h-1.5 bg-stone-300 rounded-full mx-auto my-2.5 shrink-0" }),
      /* @__PURE__ */ React.createElement("div", { className: "px-4 sm:px-5 py-3.5 sm:py-4 border-b border-[#e8ddd0] bg-white flex items-center justify-between gap-2 shrink-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center space-x-2 min-w-0 flex-1" }, /* @__PURE__ */ React.createElement(BookOpen, { className: "w-5 h-5 text-amber-600 shrink-0" }), /* @__PURE__ */ React.createElement("div", { className: "min-w-0 flex-1" }, /* @__PURE__ */ React.createElement("h2", { className: "font-bold text-base sm:text-lg text-amber-950 truncate whitespace-nowrap" }, /* @__PURE__ */ React.createElement("span", { className: "font-magical" }, "\u9B54\u6CD5\u751F\u8BCD\u672C (", vocabList.length, ")")), /* @__PURE__ */ React.createElement("p", { className: "text-[11px] sm:text-xs text-stone-500 truncate" }, "\u7CBE\u542C\u539F\u8457\u8BCD\u6C47\u4E0E\u4F8B\u53E5\u7B14\u8BB0"))), onOpenSrs && vocabList.length > 0 && /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => {
            onClose();
            onOpenSrs();
          },
          className: "duo-btn-primary min-h-[44px] px-3 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap",
          title: "\u542F\u52A8\u827E\u5BBE\u6D69\u65AF\u667A\u80FD\u7FFB\u8F6C\u95EA\u5361 (SRS \u9057\u5FD8\u66F2\u7EBF\u7B97\u6CD5)"
        },
        /* @__PURE__ */ React.createElement(BrainCircuit, { size: 15, className: "shrink-0" }),
        /* @__PURE__ */ React.createElement("span", null, "\u827E\u5BBE\u6D69\u65AF\u80CC\u8BCD")
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: onClose,
          className: "duo-touch-target rounded-xl border border-[#e8ddd0] bg-white hover:bg-stone-100 text-stone-600 hover:text-amber-950 hover:border-amber-300 transition-all active:scale-90 cursor-pointer shrink-0",
          title: "\u5173\u95ED\u751F\u8BCD\u672C"
        },
        /* @__PURE__ */ React.createElement(X, { size: 18 })
      )),
      vocabList.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "leitner-distribution px-4 py-2.5 bg-amber-50/70 border-b border-[#e8ddd0]" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-[11px] font-bold text-amber-900 mb-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement(BrainCircuit, { size: 13, className: "text-amber-700" }), /* @__PURE__ */ React.createElement("span", null, "\u827E\u5BBE\u6D69\u65AF 5 \u7BB1\u8BB0\u5FC6\u66F2\u7EBF")), dueCount > 0 ? /* @__PURE__ */ React.createElement("span", { className: "text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-900 font-bold border border-amber-300/80" }, "\u4ECA\u65E5 ", dueCount, " \u8BCD\u5F85\u590D\u4E60") : /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-stone-500 font-medium" }, "\u4ECA\u65E5\u8BB0\u5FC6\u5DF2\u7262\u56FA")), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-5 gap-1.5 text-center" }, [
        { box: 1, label: "Box 1 \xB7 \u521D\u5B66", short: "\u521D\u5B66", color: "bg-amber-100 text-amber-900 border-amber-300" },
        { box: 2, label: "Box 2 \xB7 \u5DE9\u56FA", short: "\u5DE9\u56FA", color: "bg-amber-200/70 text-amber-950 border-amber-400" },
        { box: 3, label: "Box 3 \xB7 \u719F\u8BB0", short: "\u719F\u8BB0", color: "bg-blue-100 text-blue-900 border-blue-300" },
        { box: 4, label: "Box 4 \xB7 \u957F\u6548", short: "\u957F\u6548", color: "bg-purple-100 text-purple-900 border-purple-300" },
        { box: 5, label: "Box 5 \xB7 \u6C38\u4E45\u638C\u63E1", short: "\u6C38\u4E45\u638C\u63E1", color: "bg-emerald-100 text-emerald-900 border-emerald-400 font-bold" }
      ].map(({ box, label, short, color }) => {
        const count = boxCounts[box] || 0;
        return /* @__PURE__ */ React.createElement("div", { key: box, className: `p-1 rounded-lg border text-[10px] ${color}`, title: label }, /* @__PURE__ */ React.createElement("div", { className: "font-extrabold font-mono text-xs" }, count), /* @__PURE__ */ React.createElement("div", { className: "truncate text-[9px]" }, short));
      }))),
      vocabList.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "p-3 border-b border-[#e8ddd0] bg-white" }, /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement(Search, { size: 14, className: "absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" }), /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "search",
          enterKeyHint: "search",
          autoCapitalize: "none",
          autoCorrect: "off",
          spellCheck: "false",
          placeholder: "\u641C\u7D22\u751F\u8BCD\u6216\u4E2D\u6587\u91CA\u4E49...",
          value: searchTerm,
          onChange: (e) => setSearchTerm(e.target.value),
          className: "w-full pl-9 pr-3 py-2 text-base sm:text-sm rounded-xl border border-[#e8ddd0] bg-stone-50 text-[#1e1610] focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 transition-all"
        }
      ))),
      /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-y-auto p-4 space-y-3 ios-scroll" }, vocabList.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col items-center justify-center py-16 px-4 text-center my-auto" }, /* @__PURE__ */ React.createElement("div", { className: "w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-300/80 flex items-center justify-center text-amber-600 mb-4 animate-pulse" }, /* @__PURE__ */ React.createElement(Bookmark, { size: 28, className: "text-amber-600" })), /* @__PURE__ */ React.createElement("h3", { className: "font-magical font-bold text-base text-amber-950 mb-1" }, "\u6682\u65E0\u751F\u8BCD \xB7 \u9B54\u6756\u5C1A\u672A\u6536\u5F55\u65B0\u8BCD"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-stone-500 max-w-xs leading-relaxed mb-6" }, "\u5728\u7CBE\u542C\u7814\u8BFB\u539F\u8457\u65F6\uFF0C\u8F7B\u70B9\u4EFB\u610F\u82F1\u6587\u5355\u8BCD\u5373\u53EF\u5B9E\u65F6\u67E5\u770B\u6743\u5A01\u91CA\u4E49\uFF0C\u5E76\u4E00\u952E\u6536\u5F55\u81F3\u4E13\u5C5E\u9B54\u6CD5\u751F\u8BCD\u672C\uFF01"), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: onClose,
          className: "duo-btn-primary min-h-[44px] px-6 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 cursor-pointer active:scale-95"
        },
        /* @__PURE__ */ React.createElement(Sparkles, { size: 15 }),
        /* @__PURE__ */ React.createElement("span", null, "\u53BB\u7CBE\u542C\u6311\u8BCD\u5165\u5E93")
      )) : filteredList.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "text-center py-16 text-stone-400 text-xs" }, /* @__PURE__ */ React.createElement("p", { className: "font-bold text-sm text-stone-700 mb-1" }, "\u672A\u627E\u5230\u5339\u914D\u751F\u8BCD"), /* @__PURE__ */ React.createElement("p", { className: "text-xs mb-3" }, "\u6CA1\u6709\u641C\u7D22\u5230\u5305\u542B \u201C", searchTerm, "\u201D \u7684\u751F\u8BCD\u6216\u91CA\u4E49"), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => setSearchTerm(""),
          className: "duo-btn-secondary px-3 py-1.5 rounded-xl text-xs font-bold text-amber-900 cursor-pointer"
        },
        "\u6E05\u9664\u641C\u7D22\u6761\u4EF6"
      )) : filteredList.map((item) => {
        const isDue = !item.nextReviewDate || item.nextReviewDate <= todayStr;
        return /* @__PURE__ */ React.createElement(
          "div",
          {
            key: item.id || item.word,
            className: `p-3.5 rounded-2xl border transition-all ${isDue ? "bg-amber-500/5 border-amber-400/90 ring-1 ring-amber-400/30" : "duo-card duo-card-hover"}`
          },
          /* @__PURE__ */ React.createElement("div", { className: "flex items-start justify-between" }, /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0 pr-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center space-x-2 flex-wrap" }, /* @__PURE__ */ React.createElement("h4", { className: "font-magical font-bold text-base text-amber-950" }, item.word), item.phonetic && /* @__PURE__ */ React.createElement("span", { className: "font-mono text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-800 font-semibold" }, item.phonetic), item.isHpLore ? /* @__PURE__ */ React.createElement("span", { className: "text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-900 border border-red-300/80 font-bold" }, "\u539F\u8457\u9B54\u6CD5") : item.tag === "\u4E2D\u8003\u6838\u5FC3" ? /* @__PURE__ */ React.createElement("span", { className: "text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300/80 font-bold" }, "\u4E2D\u8003\u6838\u5FC3") : /* @__PURE__ */ React.createElement("span", { className: "text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-300 font-bold" }, "\u8FDB\u9636\u62D3\u5C55"), item.srsBox !== void 0 && /* @__PURE__ */ React.createElement("span", { className: `inline-block w-2 h-2 rounded-full ml-1.5 align-middle ${item.srsBox >= 5 ? "bg-emerald-500" : item.srsBox >= 4 ? "bg-amber-400" : item.srsBox >= 2 ? "bg-orange-400" : "bg-red-400"}`, title: `SRS\u76D2\u5B50 ${item.srsBox || 1}: ${item.srsBox >= 5 ? "\u5DF2\u638C\u63E1" : "\u590D\u4E60\u4E2D"}` })), renderSrsBadge(item)), /* @__PURE__ */ React.createElement("div", { className: "flex items-center space-x-1 shrink-0" }, /* @__PURE__ */ React.createElement(
            "button",
            {
              onClick: () => playPronunciation(item.word),
              className: "duo-touch-target rounded-xl border border-transparent hover:border-amber-300/80 bg-transparent hover:bg-amber-50 text-stone-500 hover:text-amber-800 transition-all active:scale-90 cursor-pointer",
              title: "\u8BD5\u542C\u7EAF\u6B63\u82F1\u97F3\u53D1\u97F3"
            },
            /* @__PURE__ */ React.createElement(Volume2, { size: 16 })
          ), /* @__PURE__ */ React.createElement(
            "button",
            {
              onClick: () => onRemoveWord(item.word),
              className: "duo-touch-target rounded-xl border border-transparent hover:border-rose-300/80 bg-transparent hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition-all active:scale-90 cursor-pointer",
              title: "\u4ECE\u751F\u8BCD\u672C\u79FB\u9664"
            },
            /* @__PURE__ */ React.createElement(Trash2, { size: 16 })
          ))),
          /* @__PURE__ */ React.createElement("p", { className: "text-xs sm:text-sm font-reading mt-1.5 font-bold text-amber-950" }, item.translation),
          item.context && /* @__PURE__ */ React.createElement("p", { className: "text-[11px] font-reading italic mt-2 border-t border-[#e8ddd0] pt-1.5 line-clamp-2 text-stone-600" }, '"', item.context, '"')
        );
      })),
      /* @__PURE__ */ React.createElement("div", { className: "p-3.5 sm:p-4 border-t border-[#e8ddd0] bg-white flex flex-col gap-2 shrink-0" }, showClearConfirm ? /* @__PURE__ */ React.createElement("div", { className: "w-full flex flex-col sm:flex-row items-center justify-between gap-2.5 p-3 rounded-2xl bg-rose-50 border border-rose-200 animate-fadeIn" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 text-xs font-bold text-rose-900 min-w-0" }, /* @__PURE__ */ React.createElement(Trash2, { size: 15, className: "text-rose-600 shrink-0" }), /* @__PURE__ */ React.createElement("span", null, "\u786E\u5B9A\u6E05\u7A7A\u5168\u90E8 ", vocabList.length, " \u4E2A\u751F\u8BCD\uFF1F\u6B64\u64CD\u4F5C\u65E0\u6CD5\u64A4\u9500")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => setShowClearConfirm(false),
          className: "px-3.5 py-2 min-h-[44px] rounded-xl border border-stone-300 bg-white text-stone-700 font-bold text-xs hover:bg-stone-50 cursor-pointer active:scale-95"
        },
        "\u53D6\u6D88"
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => {
            setShowClearConfirm(false);
            onClearAll();
          },
          className: "px-3.5 py-2 min-h-[44px] rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 cursor-pointer active:scale-95"
        },
        "\u786E\u8BA4\u6E05\u7A7A"
      ))) : /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center justify-between gap-2 text-xs" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 flex-wrap" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          disabled: vocabList.length === 0,
          onClick: handlePrintParchmentPdf,
          className: `duo-btn-primary min-h-[44px] flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs whitespace-nowrap active:scale-95 font-bold ${vocabList.length === 0 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`,
          title: "\u751F\u6210\u6807\u51C6 A4 \u7F8A\u76AE\u7EB8\u526A\u88C1\u95EA\u5361\uFF0C\u76F4\u63A5\u6253\u5370\u6216\u4FDD\u5B58\u4E3A PDF"
        },
        /* @__PURE__ */ React.createElement(Printer, { size: 14, className: "shrink-0" }),
        /* @__PURE__ */ React.createElement("span", null, "\u6253\u5370\u7F8A\u76AE\u7EB8\u5355\u8BCD\u5361 (PDF)")
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          disabled: vocabList.length === 0,
          onClick: handleExportAnki,
          className: `duo-btn-secondary min-h-[44px] flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs whitespace-nowrap active:scale-95 ${vocabList.length === 0 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`,
          title: "\u5BFC\u51FA\u4E3A\u6807\u51C6 Anki \u5361\u7247\u724C\u7EC4 (.tsv)"
        },
        /* @__PURE__ */ React.createElement(Sparkles, { size: 14, className: "text-amber-600 shrink-0" }),
        /* @__PURE__ */ React.createElement("span", null, "\u5BFC\u51FA\u81F3 Anki (TSV)")
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          disabled: vocabList.length === 0,
          onClick: handleExportAnkiCloze,
          className: `duo-btn-secondary min-h-[44px] flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs whitespace-nowrap active:scale-95 ${vocabList.length === 0 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`,
          title: "\u5BFC\u51FA\u4E3A Anki \u6316\u7A7A\u586B\u7A7A\u5361 (Cloze Deletion)"
        },
        /* @__PURE__ */ React.createElement(BrainCircuit, { size: 14, className: "text-amber-700 shrink-0" }),
        /* @__PURE__ */ React.createElement("span", null, "Anki \u6316\u7A7A\u5361")
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          disabled: vocabList.length === 0,
          onClick: handleExportCSV,
          className: `duo-btn-secondary min-h-[44px] flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs whitespace-nowrap active:scale-95 ${vocabList.length === 0 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`,
          title: "\u5BFC\u51FA\u4E3A\u901A\u7528\u8868\u683C CSV \u683C\u5F0F"
        },
        /* @__PURE__ */ React.createElement(Download, { size: 14, className: "shrink-0" }),
        /* @__PURE__ */ React.createElement("span", null, "\u5BFC\u51FA CSV")
      )), /* @__PURE__ */ React.createElement(
        "button",
        {
          disabled: vocabList.length === 0,
          onClick: () => setShowClearConfirm(true),
          className: `min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold border border-rose-200 text-rose-700 bg-rose-50/60 transition-all whitespace-nowrap flex items-center gap-1.5 ${vocabList.length === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-rose-100 hover:border-rose-300 active:scale-95 cursor-pointer"}`,
          title: "\u6E05\u7A7A\u751F\u8BCD\u672C\u5185\u6240\u6709\u5355\u8BCD"
        },
        /* @__PURE__ */ React.createElement(Trash2, { size: 14, className: "text-rose-600 shrink-0" }),
        /* @__PURE__ */ React.createElement("span", null, "\u6E05\u7A7A\u751F\u8BCD\u672C")
      ))),
      toastMessage && /* @__PURE__ */ React.createElement("div", { className: "absolute bottom-20 left-4 right-4 z-50 animate-bounce" }, /* @__PURE__ */ React.createElement("div", { className: "p-3 rounded-2xl bg-emerald-700/95 border border-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2" }, /* @__PURE__ */ React.createElement(CheckCircle, { size: 15 }), /* @__PURE__ */ React.createElement("span", null, toastMessage)))
    )
  );
}
export {
  VocabularyDrawer
};
