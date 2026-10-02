import React, { useState } from "react";
import {
  X,
  Trash2,
  Volume2,
  Download,
  Sparkles,
  Search,
  Layers,
  RotateCw,
  CheckCircle,
  BookOpen
} from "lucide-react";
import { generateAnkiTSV, downloadAnkiFile } from "../src/utils/ankiExport.js";
function VocabularyDrawer({
  isOpen,
  onClose,
  vocabList,
  onRemoveWord,
  onClearAll,
  isParchment
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFlashcardMode, setIsFlashcardMode] = useState(false);
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
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
  };
  const handleExportCSV = () => {
    if (vocabList.length === 0) return;
    const header = "Word,Phonetic,Part of Speech,Translation,Context\n";
    const rows = vocabList.map(
      (v) => `"${v.word}","${v.phonetic || ""}","${v.pos || ""}","${(v.translation || "").replace(/"/g, '""')}","${(v.context || "").replace(/"/g, '""')}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `hogwarts_vocab_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  const currentFlashcard = filteredList[flashcardIndex];
  return /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm" }, /* @__PURE__ */ React.createElement("div", { className: "absolute inset-y-0 right-0 max-w-full flex pl-10" }, /* @__PURE__ */ React.createElement("div", { className: `w-screen max-w-md shadow-2xl flex flex-col border-l transition-colors duration-300 ${isParchment ? "bg-[#fbf6ea] border-[#dec9a5] text-[#2c221e]" : "bg-[#121824] border-[#253245] text-[#e2d9c8]"}` }, /* @__PURE__ */ React.createElement("div", { className: "px-5 py-4 border-b border-gray-700/40 flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center space-x-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-xl" }, "\u{1F4DC}"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { className: "font-magical font-bold text-lg text-[#cba358]" }, "\u9B54\u6CD5\u751F\u8BCD\u672C (", vocabList.length, ")"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-[#8c9ba5]" }, "\u7CBE\u542C\u539F\u8457\u8BCD\u6C47\u4E0E\u4F8B\u53E5\u7B14\u8BB0"))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center space-x-1.5" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setIsFlashcardMode(!isFlashcardMode),
      className: `p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors ${isFlashcardMode ? "bg-[#cba358] text-[#0f141c] border-[#cba358] font-bold" : "border-gray-600/50 text-[#cba358] hover:bg-[#cba358]/20"}`,
      title: "\u5207\u6362\u5361\u7247\u7FFB\u8F6C\u8BB0\u5FC6\u6A21\u5F0F"
    },
    /* @__PURE__ */ React.createElement(Layers, { size: 14 }),
    /* @__PURE__ */ React.createElement("span", { className: "text-[11px]" }, isFlashcardMode ? "\u5217\u8868" : "\u5361\u7247\u80CC\u8BCD")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: onClose,
      className: "p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-700/30"
    },
    /* @__PURE__ */ React.createElement(X, { size: 18 })
  ))), isFlashcardMode ? /* @__PURE__ */ React.createElement("div", { className: "flex-1 p-6 flex flex-col justify-between items-center overflow-y-auto" }, filteredList.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "text-center py-20 text-[#8c9ba5]" }, /* @__PURE__ */ React.createElement("p", null, "\u751F\u8BCD\u672C\u8FD8\u662F\u7A7A\u7684\uFF0C\u5FEB\u53BB\u542C\u529B\u4E2D\u70B9\u51FB\u5355\u8BCD\u6536\u85CF\u5427\uFF01")) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "w-full flex justify-between items-center text-xs text-[#8c9ba5]" }, /* @__PURE__ */ React.createElement("span", null, "\u5361\u7247\u8FDB\u5EA6: ", flashcardIndex + 1, " / ", filteredList.length), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setIsCardFlipped(!isCardFlipped),
      className: "text-[#cba358] hover:underline flex items-center gap-1"
    },
    /* @__PURE__ */ React.createElement(RotateCw, { size: 12 }),
    " \u70B9\u51FB\u5361\u7247\u7FFB\u8F6C"
  )), /* @__PURE__ */ React.createElement(
    "div",
    {
      onClick: () => setIsCardFlipped(!isCardFlipped),
      className: `w-full min-h-[300px] my-6 rounded-2xl p-6 border-2 cursor-pointer flex flex-col items-center justify-center text-center transition-all duration-300 transform shadow-xl ${isCardFlipped ? "border-[#cba358] bg-[#182333]/90" : "border-[#384860] bg-[#141b26]/70 hover:border-[#cba358]/60"}`
    },
    !isCardFlipped ? /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-mono uppercase tracking-widest text-[#8c9ba5] block mb-2" }, "QUESTION"), /* @__PURE__ */ React.createElement("h3", { className: "text-3xl font-magical font-bold text-[#f3d38c] mb-2" }, currentFlashcard.word), currentFlashcard.phonetic && /* @__PURE__ */ React.createElement("span", { className: "font-mono text-sm text-[#8c9ba5] block mb-4" }, currentFlashcard.phonetic), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400 mt-4" }, "\u{1F449} \u70B9\u51FB\u67E5\u770B\u91CA\u4E49\u4E0E\u4F8B\u53E5")) : /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-mono uppercase tracking-widest text-[#cba358] block" }, "ANSWER"), /* @__PURE__ */ React.createElement("h4", { className: "text-xl font-bold text-amber-200 font-reading" }, currentFlashcard.translation), currentFlashcard.lore && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-amber-100/80 bg-[#740001]/30 p-2.5 rounded-lg border border-amber-400/30" }, "\u26A1 ", currentFlashcard.lore), currentFlashcard.context && /* @__PURE__ */ React.createElement("p", { className: "text-xs italic text-gray-300 font-reading mt-2 border-t border-gray-700/40 pt-2" }, '"', currentFlashcard.context, '"'))
  ), /* @__PURE__ */ React.createElement("div", { className: "flex items-center space-x-3 w-full justify-between" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      disabled: flashcardIndex <= 0,
      onClick: () => {
        setIsCardFlipped(false);
        setFlashcardIndex((prev) => Math.max(0, prev - 1));
      },
      className: "px-4 py-2 rounded-lg border border-gray-600/40 text-xs disabled:opacity-30 hover:border-[#cba358]"
    },
    "\u4E0A\u4E00\u5F20"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => playPronunciation(currentFlashcard.word),
      className: "p-2 rounded-full border border-[#cba358]/40 text-[#cba358]",
      title: "\u6717\u8BFB\u5355\u8BCD"
    },
    /* @__PURE__ */ React.createElement(Volume2, { size: 16 })
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      disabled: flashcardIndex >= filteredList.length - 1,
      onClick: () => {
        setIsCardFlipped(false);
        setFlashcardIndex((prev) => Math.min(filteredList.length - 1, prev + 1));
      },
      className: "px-4 py-2 rounded-lg bg-[#cba358] text-[#0f141c] font-bold text-xs disabled:opacity-30 hover:shadow-glow-gold"
    },
    "\u4E0B\u4E00\u5F20"
  )))) : (
    // List Mode
    /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "p-3 border-b border-gray-700/30" }, /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement(Search, { size: 14, className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" }), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        placeholder: "\u641C\u7D22\u751F\u8BCD\u6216\u4E2D\u6587\u91CA\u4E49...",
        value: searchTerm,
        onChange: (e) => setSearchTerm(e.target.value),
        className: `w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-[#cba358] ${isParchment ? "bg-[#fffdf8] border-[#dec9a5]" : "bg-[#18202d] border-[#2d3a4f] text-[#e2d9c8]"}`
      }
    ))), /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-y-auto p-4 space-y-3" }, filteredList.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "text-center py-16 text-[#8c9ba5] text-xs" }, /* @__PURE__ */ React.createElement("p", null, "\u6682\u65E0\u751F\u8BCD"), /* @__PURE__ */ React.createElement("p", { className: "mt-1 text-gray-500" }, "\u542C\u97F3\u9891\u65F6\u70B9\u51FB\u4EFB\u610F\u82F1\u6587\u5355\u8BCD\u5373\u53EF\u6536\u85CF")) : filteredList.map((item) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: item.id || item.word,
        className: `p-3.5 rounded-xl border transition-all ${isParchment ? "bg-[#fffdf8] border-[#dec9a5] hover:border-[#cba358]" : "bg-[#18202d]/80 border-[#2b394e] hover:border-[#3f5370]"}`
      },
      /* @__PURE__ */ React.createElement("div", { className: "flex items-start justify-between" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center space-x-2" }, /* @__PURE__ */ React.createElement("h4", { className: "font-magical font-bold text-base text-[#cba358]" }, item.word), item.phonetic && /* @__PURE__ */ React.createElement("span", { className: "font-mono text-xs text-[#8c9ba5]" }, item.phonetic), item.isHpLore && /* @__PURE__ */ React.createElement("span", { className: "text-[10px] px-1.5 py-0.2 rounded bg-[#740001] text-amber-200" }, "\u26A1 \u9B54\u6CD5")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center space-x-1" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => playPronunciation(item.word),
          className: "p-1 rounded text-gray-400 hover:text-[#cba358]",
          title: "\u53D1\u97F3"
        },
        /* @__PURE__ */ React.createElement(Volume2, { size: 14 })
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => onRemoveWord(item.word),
          className: "p-1 rounded text-gray-400 hover:text-rose-400",
          title: "\u79FB\u9664"
        },
        /* @__PURE__ */ React.createElement(Trash2, { size: 14 })
      ))),
      /* @__PURE__ */ React.createElement("p", { className: "text-xs font-reading text-amber-200/90 mt-1" }, item.translation),
      item.context && /* @__PURE__ */ React.createElement("p", { className: "text-[11px] font-reading italic text-gray-400 mt-2 border-t border-gray-700/30 pt-1.5 line-clamp-2" }, '"', item.context, '"')
    ))), /* @__PURE__ */ React.createElement("div", { className: "p-4 border-t border-gray-700/40 flex flex-wrap items-center justify-between gap-2 text-xs" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: handleExportAnki,
        disabled: vocabList.length === 0,
        className: `flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium transition-colors disabled:opacity-30 ${isParchment ? "border-[#8c6d37] bg-[#f0dfbe] text-[#4a3525] hover:bg-[#e4cfaa]" : "border-[#cba358]/60 bg-[#cba358]/10 text-[#f3d38c] hover:bg-[#cba358]/20"}`,
        title: "\u5BFC\u51FA\u4E3A\u6807\u51C6 Anki \u5361\u7247\u724C\u7EC4 (.tsv)"
      },
      /* @__PURE__ */ React.createElement(Sparkles, { size: 13, className: "text-[#cba358]" }),
      /* @__PURE__ */ React.createElement("span", null, "\u5BFC\u51FA\u81F3 Anki (TSV)")
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: handleExportCSV,
        disabled: vocabList.length === 0,
        className: `flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors disabled:opacity-30 ${isParchment ? "border-[#c2ad88] text-[#7d6852] hover:bg-[#f0e4cc]" : "border-gray-600/50 text-[#8c9ba5] hover:bg-gray-700/30"}`,
        title: "\u5BFC\u51FA\u4E3A\u901A\u7528\u8868\u683C CSV \u683C\u5F0F"
      },
      /* @__PURE__ */ React.createElement(Download, { size: 13 }),
      /* @__PURE__ */ React.createElement("span", null, "\u5BFC\u51FA CSV")
    )), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: onClearAll,
        disabled: vocabList.length === 0,
        className: "text-gray-400 hover:text-rose-400 disabled:opacity-30 transition-colors"
      },
      "\u6E05\u7A7A\u751F\u8BCD\u672C"
    )))
  ))));
}
export {
  VocabularyDrawer
};
