import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  Mic,
  Square,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Award,
  Info,
  Headphones
} from "lucide-react";
import { evaluatePronunciation, isSpeechRecognitionSupported } from "../src/utils/speechScoring.js";
function ShadowingRecorder({
  isOpen,
  onClose,
  currentCue,
  onPlayOriginalSnippet,
  isParchment,
  onShadowingScore
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState(null);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordingError, setRecordingError] = useState(null);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const recordedAudioRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef("");
  const recordedAudioUrlRef = useRef(null);
  const isRecordingRef = useRef(false);
  const safetyTimeoutRef = useRef(null);
  useEffect(() => {
    setIsSpeechSupported(isSpeechRecognitionSupported());
  }, []);
  const cleanupHardwareResources = useCallback(() => {
    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current);
      safetyTimeoutRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
      }
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
      }
    }
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => {
          if (track.readyState === "live") {
            track.stop();
          }
        });
      } catch (e) {
      }
      streamRef.current = null;
    }
    isRecordingRef.current = false;
  }, []);
  const cleanupAudioUrl = useCallback(() => {
    if (recordedAudioUrlRef.current) {
      try {
        URL.revokeObjectURL(recordedAudioUrlRef.current);
      } catch (e) {
      }
      recordedAudioUrlRef.current = null;
    }
  }, []);
  useEffect(() => {
    if (!isOpen) {
      cleanupHardwareResources();
      cleanupAudioUrl();
      setIsRecording(false);
      setIsEvaluating(false);
      setRecordedAudioUrl(null);
      setRecordSeconds(0);
      setRecordingError(null);
      setEvaluationResult(null);
      setLiveTranscript("");
      transcriptRef.current = "";
      setIsPlayingRecording(false);
      if (recordedAudioRef.current) {
        recordedAudioRef.current.pause();
      }
    }
  }, [isOpen, cleanupHardwareResources, cleanupAudioUrl]);
  useEffect(() => {
    return () => {
      cleanupHardwareResources();
      cleanupAudioUrl();
    };
  }, [cleanupHardwareResources, cleanupAudioUrl]);
  const startRecording = async () => {
    setRecordingError(null);
    setEvaluationResult(null);
    setLiveTranscript("");
    transcriptRef.current = "";
    cleanupAudioUrl();
    setRecordedAudioUrl(null);
    setIsPlayingRecording(false);
    if (recordedAudioRef.current) {
      recordedAudioRef.current.pause();
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);
        recordedAudioUrlRef.current = url;
        if (streamRef.current) {
          try {
            streamRef.current.getTracks().forEach((track) => {
              if (track.readyState === "live") track.stop();
            });
          } catch (e) {
          }
          streamRef.current = null;
        }
      };
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.lang = "en-US";
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.maxAlternatives = 1;
          recognition.onresult = (event) => {
            let combined = "";
            for (let i = 0; i < event.results.length; i++) {
              combined += event.results[i][0].transcript + " ";
            }
            const trimmed = combined.trim();
            transcriptRef.current = trimmed;
            setLiveTranscript(trimmed);
          };
          recognition.onerror = (event) => {
            console.warn("[SpeechRecognition] error:", event.error);
            if (event.error === "not-allowed") {
              setRecordingError("\u9EA6\u514B\u98CE\u8BED\u97F3\u8BC6\u522B\u6743\u9650\u53D7\u9650\uFF0C\u5F55\u97F3\u4ECD\u53EF\u7EE7\u7EED\uFF0C\u4F46\u65E0\u6CD5\u8FDB\u884CAI\u5B9E\u65F6\u8BC4\u5206\u3002");
            } else if (event.error === "network") {
              console.warn("[SpeechRecognition] network error encountered");
            }
          };
          recognition.start();
          recognitionRef.current = recognition;
        } catch (speechErr) {
          console.warn("[WebSpeech] Failed to start recognition:", speechErr);
        }
      }
      mediaRecorder.start(250);
      setIsRecording(true);
      isRecordingRef.current = true;
      setRecordSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1e3);
      if (timerRef.current && typeof timerRef.current.unref === "function") {
        timerRef.current.unref();
      }
    } catch (err) {
      console.error("Microphone access denied:", err);
      setRecordingError("\u65E0\u6CD5\u8BBF\u95EE\u9EA6\u514B\u98CE\uFF0C\u8BF7\u68C0\u67E5\u6D4F\u89C8\u5668\u9EA6\u514B\u98CE\u6743\u9650\u8BBE\u7F6E\u3002");
    }
  };
  const stopRecording = () => {
    if (!isRecordingRef.current && !isRecording) return;
    setIsRecording(false);
    isRecordingRef.current = false;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
      }
    }
    setIsEvaluating(true);
    let hasEvaluated = false;
    const runEvaluation = (spoken, isFallbackFlag = false) => {
      if (hasEvaluated) return;
      hasEvaluated = true;
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current);
        safetyTimeoutRef.current = null;
      }
      const result = evaluatePronunciation(
        currentCue ? currentCue.text : "",
        spoken,
        isFallbackFlag
      );
      setEvaluationResult(result);
      setIsEvaluating(false);
      if (onShadowingScore && typeof onShadowingScore === "function" && currentCue) {
        try {
          onShadowingScore({
            chapterId: currentCue.chapterId || "",
            cueId: currentCue.id,
            score: result.score
          });
        } catch (e) {
          console.warn("onShadowingScore error:", e);
        }
      }
    };
    safetyTimeoutRef.current = setTimeout(() => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
        }
        recognitionRef.current = null;
      }
      runEvaluation(transcriptRef.current, false);
    }, 1500);
    if (safetyTimeoutRef.current && typeof safetyTimeoutRef.current.unref === "function") {
      safetyTimeoutRef.current.unref();
    }
    if (recognitionRef.current) {
      recognitionRef.current.onend = () => {
        recognitionRef.current = null;
        runEvaluation(transcriptRef.current, false);
      };
      try {
        recognitionRef.current.stop();
      } catch (e) {
        runEvaluation(transcriptRef.current, true);
      }
    } else {
      runEvaluation("", true);
    }
  };
  const togglePlayRecording = () => {
    if (!recordedAudioRef.current) return;
    if (isPlayingRecording) {
      recordedAudioRef.current.pause();
      setIsPlayingRecording(false);
    } else {
      recordedAudioRef.current.currentTime = 0;
      recordedAudioRef.current.play().then(() => setIsPlayingRecording(true)).catch((err) => console.warn("Playback failed:", err));
      recordedAudioRef.current.onended = () => setIsPlayingRecording(false);
    }
  };
  if (!isOpen || !currentCue) return null;
  const getHogwartsGrade = (score) => {
    if (score >= 90) {
      return {
        letter: "O",
        title: "\u5353\u8D8A \xB7 Outstanding",
        quote: "\u201C\u5B9B\u5982\u8D6B\u654F\xB7\u683C\u5170\u6770\u822C\u6807\u51C6\u5730\u9053\uFF01\u7EAF\u6B63\u82F1\u4F26\u8154\u8C03\uFF0C\u683C\u5170\u82AC\u591A\u4E3A\u4F60\u52A0 10 \u5206\uFF01\u201D",
        badgeClass: "border-emerald-500 text-emerald-300 bg-emerald-950/50",
        parchmentBadge: "border-emerald-700 text-emerald-900 bg-emerald-100"
      };
    } else if (score >= 75) {
      return {
        letter: "E",
        title: "\u8D85\u4E4E\u671F\u5F85 \xB7 Exceeds Expectations",
        quote: "\u201C\u4EE4\u4EBA\u8D5E\u53F9\uFF01\u8282\u594F\u4E0E\u53D1\u97F3\u90FD\u975E\u5E38\u81EA\u7136\uFF0C\u5C55\u73B0\u51FA\u9AD8\u5E74\u7EA7\u5B66\u957F\u7684\u8BED\u8C03\u98CE\u8303\u3002\u201D",
        badgeClass: "border-amber-400 text-amber-800 bg-amber-500/20",
        parchmentBadge: "border-amber-500 text-amber-900 bg-amber-100"
      };
    } else if (score >= 60) {
      return {
        letter: "A",
        title: "\u53CA\u683C \xB7 Acceptable",
        quote: "\u201C\u901A\u8FC7\u8003\u6838\uFF01\u4E3B\u4F53\u53D1\u97F3\u6E05\u6670\uFF0C\u6CE8\u610F\u9EC4\u8272\u6807\u8BB0\u8BCD\u6C47\u7684\u53D1\u97F3\u4E0E\u91CD\u97F3\u5F31\u8BFB\u3002\u201D",
        badgeClass: "border-amber-500 text-amber-400 bg-amber-950/50",
        parchmentBadge: "border-amber-700 text-amber-900 bg-amber-100"
      };
    } else {
      return {
        letter: "P",
        title: "\u5C1A\u9700\u7EC3\u4E60 \xB7 Needs Practice",
        quote: "\u201C\u9B54\u6CD5\u5171\u9E23\u7A0D\u5F31\u3002\u4E0D\u59A8\u70B9\u51FB\u2018\u64AD\u653E\u539F\u97F3\u2019\u591A\u542C\u4E24\u904D\u539F\u58F0\uFF0C\u518D\u91CD\u65B0\u5F55\u97F3\u8DDF\u8BFB\u3002\u201D",
        badgeClass: "border-rose-500 text-rose-400 bg-rose-950/50",
        parchmentBadge: "border-rose-700 text-rose-900 bg-rose-100"
      };
    }
  };
  const gradeInfo = evaluationResult ? getHogwartsGrade(evaluationResult.score) : null;
  const matchedCount = evaluationResult ? evaluationResult.words.filter((w) => w.status === "matched").length : 0;
  const totalCount = evaluationResult ? evaluationResult.words.length : 0;
  return /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" }, /* @__PURE__ */ React.createElement("div", { className: "relative w-full max-w-xl rounded-t-3xl sm:rounded-3xl border-t sm:border border-[#e8ddd0] bg-[#fbf9f5] text-[#1e1610] p-5 sm:p-6 max-h-[88dvh] sm:max-h-[85dvh] overflow-y-auto pb-safe transition-all duration-300 no-scrollbar" }, /* @__PURE__ */ React.createElement("div", { className: "sm:hidden w-10 h-1.5 bg-stone-300 rounded-full mx-auto mb-3 shrink-0" }), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-4 pb-3 border-b border-[#e8ddd0]" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center space-x-2" }, /* @__PURE__ */ React.createElement("div", { className: "p-1.5 rounded-xl bg-amber-500/15 text-amber-700 border border-amber-300/80" }, /* @__PURE__ */ React.createElement(Mic, { size: 18 })), /* @__PURE__ */ React.createElement("h3", { className: "font-magical font-bold text-lg text-amber-950" }, "\u672C\u53E5\u8DDF\u8BFB\u4E0E AI \u8BED\u97F3\u8BC4\u5206 (Shadowing & Scoring)")), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: onClose,
      className: "duo-touch-target rounded-xl border border-[#e8ddd0] bg-white hover:bg-stone-100 text-stone-600 hover:text-amber-950 hover:border-amber-300 transition-all active:scale-90 cursor-pointer",
      title: "\u5173\u95ED\u8DDF\u8BFB\u5F55\u97F3"
    },
    /* @__PURE__ */ React.createElement(X, { size: 18 })
  )), /* @__PURE__ */ React.createElement("div", { className: "p-4 rounded-2xl border border-[#e8ddd0] bg-white mb-4 transition-all" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-[11px] font-magical uppercase tracking-wider font-bold text-amber-900 flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement(Sparkles, { size: 12, className: "text-amber-600" }), /* @__PURE__ */ React.createElement("span", null, "\u539F\u8457\u6717\u8BFB\u76EE\u6807\u53E5 Target Sentence")), evaluationResult && /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 text-[10px]" }, /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1 text-emerald-600 font-semibold" }, /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded-full bg-emerald-500 inline-block" }), " \u51C6\u786E"), /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1 text-amber-600 font-semibold" }, /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded-full bg-amber-500 inline-block" }), " \u76F8\u4F3C"), /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1 text-rose-600 font-semibold" }, /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded-full bg-rose-500 inline-block" }), " \u504F\u5DEE/\u9057\u6F0F"))), !evaluationResult ? /* @__PURE__ */ React.createElement("p", { className: `font-reading text-base sm:text-lg leading-relaxed ${isParchment ? "text-amber-950 font-medium" : "text-[#f3d38c]"}` }, '"', currentCue.text, '"') : /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-1.5 py-1" }, evaluationResult.words.map((w, idx) => {
    let badgeStyle = "";
    if (w.status === "matched") {
      badgeStyle = isParchment ? "bg-emerald-100/90 border-emerald-600/40 text-emerald-900" : "bg-emerald-950/60 border-emerald-500/50 text-emerald-300";
    } else if (w.status === "partial") {
      badgeStyle = isParchment ? "bg-amber-100/90 border-amber-600/40 text-amber-900" : "bg-amber-950/60 border-amber-500/50 text-amber-300";
    } else {
      badgeStyle = isParchment ? "bg-rose-100/90 border-rose-600/40 text-rose-900 line-through opacity-85" : "bg-rose-950/60 border-rose-500/50 text-rose-300 line-through opacity-85";
    }
    const tooltipText = w.matchedSpokenWord ? `\u8BC6\u522B\u53D1\u97F3: "${w.matchedSpokenWord}" (${w.status === "matched" ? "\u53D1\u97F3\u51C6\u786E (100%)" : "\u53D1\u97F3\u76F8\u4F3C (60%)"})` : w.status === "inaccurate" ? "\u672A\u8BC6\u522B\u5230\u8BE5\u5355\u8BCD\u6216\u53D1\u97F3\u504F\u5DEE\u8F83\u5927 (0%)" : "\u53D1\u97F3\u51C6\u786E (100%)";
    return /* @__PURE__ */ React.createElement(
      "span",
      {
        key: idx,
        title: tooltipText,
        className: `inline-flex items-center px-2 py-0.5 rounded-md text-sm sm:text-base font-reading border transition-all cursor-default ${badgeStyle}`
      },
      w.word
    );
  })), currentCue.translation && /* @__PURE__ */ React.createElement("p", { className: `text-xs font-reading mt-2.5 ${isParchment ? "text-[#7a644c]" : "text-[#8c9ba5]"}` }, currentCue.translation), evaluationResult && evaluationResult.transcript && /* @__PURE__ */ React.createElement("div", { className: `mt-3 pt-2.5 border-t text-xs flex items-center justify-between ${isParchment ? "border-amber-200/80 text-[#7a644c]" : "border-gray-700/30 text-[#8c9ba5]"}` }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: isParchment ? "text-amber-900 font-semibold" : "text-gray-400 font-semibold" }, "\u4F60\u6717\u8BFB\u7684\u5185\u5BB9\uFF1A"), /* @__PURE__ */ React.createElement("span", { className: `italic ml-1 ${isParchment ? "text-amber-950 font-medium" : "text-gray-200"}` }, '"', evaluationResult.transcript, '"')), evaluationResult.latencyMs !== void 0 && /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-slate-400 font-mono" }, evaluationResult.latencyMs, "ms"))), isRecording && /* @__PURE__ */ React.createElement("div", { className: "p-3.5 mb-4 rounded-2xl bg-amber-500/10 border border-amber-300/80 animate-pulse" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-xs text-amber-900 mb-1" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "relative flex h-2.5 w-2.5" }, /* @__PURE__ */ React.createElement("span", { className: "animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" }), /* @__PURE__ */ React.createElement("span", { className: "relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" })), /* @__PURE__ */ React.createElement("span", { className: "font-semibold" }, "\u6B63\u5728\u5B9E\u65F6\u8046\u542C... (", recordSeconds, "s)")), /* @__PURE__ */ React.createElement("span", { className: "text-[11px] text-stone-500" }, "\u5927\u58F0\u8DDF\u8BFB\u4E0A\u65B9\u82F1\u6587\u53E5\u5B50")), /* @__PURE__ */ React.createElement("p", { className: "text-sm font-reading text-stone-800 min-h-[1.5rem] italic" }, liveTranscript || "\uFF08\u7B49\u5F85\u4F60\u7684\u58F0\u97F3...\uFF09")), isEvaluating && /* @__PURE__ */ React.createElement("div", { className: "p-3 mb-4 rounded-2xl bg-amber-500/10 border border-amber-300/80 flex items-center justify-center space-x-2 text-amber-900" }, /* @__PURE__ */ React.createElement(Sparkles, { className: "animate-spin text-amber-600", size: 16 }), /* @__PURE__ */ React.createElement("span", { className: "text-xs font-semibold" }, "\u6B63\u5728\u8FDB\u884C AI \u9B54\u6CD5\u8BED\u97F3\u8BC4\u5206...")), evaluationResult && gradeInfo && !isEvaluating && /* @__PURE__ */ React.createElement("div", { className: "p-4 rounded-2xl border border-[#e8ddd0] bg-white mb-4 flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center space-x-3.5" }, /* @__PURE__ */ React.createElement("div", { className: `flex flex-col items-center justify-center w-16 h-16 rounded-2xl border ${gradeInfo.parchmentBadge}` }, /* @__PURE__ */ React.createElement("span", { className: "font-mono font-extrabold text-lg leading-tight" }, evaluationResult.score, "%"), /* @__PURE__ */ React.createElement("span", { className: "text-[9px] uppercase tracking-wider font-sans font-bold" }, "Grade ", gradeInfo.letter)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("h4", { className: "font-magical font-bold text-sm text-amber-950" }, gradeInfo.title), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] px-2 py-0.5 rounded-full border border-amber-300/80 font-mono font-semibold bg-amber-50 text-amber-900" }, matchedCount, "/", totalCount, " \u8BCD\u5339\u914D")), /* @__PURE__ */ React.createElement("p", { className: "text-xs mt-1 font-reading leading-snug text-stone-600" }, gradeInfo.quote)))), !isSpeechSupported && /* @__PURE__ */ React.createElement("div", { className: "p-3 mb-4 rounded-2xl border border-amber-300/80 bg-amber-500/10 text-xs flex items-center gap-2 text-amber-900" }, /* @__PURE__ */ React.createElement(Info, { size: 14, className: "shrink-0 text-amber-600" }), /* @__PURE__ */ React.createElement("span", null, "\u5F53\u524D\u6D4F\u89C8\u5668\u672A\u5F00\u542F Web Speech API\uFF0C\u97F3\u9891\u5F55\u5236\u4E0E\u539F\u97F3\u56DE\u653E\u6B63\u5E38\uFF0CAI \u81EA\u52A8\u8BC4\u5206\u63A8\u8350\u4F7F\u7528 Chrome / Edge\u3002")), recordingError && /* @__PURE__ */ React.createElement("div", { className: "p-3 mb-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-700 text-xs flex items-center gap-2" }, /* @__PURE__ */ React.createElement(AlertCircle, { size: 14, className: "shrink-0" }), /* @__PURE__ */ React.createElement("span", null, recordingError)), /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between p-3.5 rounded-2xl border border-[#e8ddd0] bg-white" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center space-x-2.5" }, /* @__PURE__ */ React.createElement("div", { className: "w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-300/80 flex items-center justify-center shrink-0" }, /* @__PURE__ */ React.createElement(Volume2, { className: "w-4 h-4 text-amber-700" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "track-a-badge text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-300/80 bg-amber-50 text-amber-900" }, "Track A \u539F\u58F0"), /* @__PURE__ */ React.createElement("span", { className: "text-xs font-bold text-amber-950" }, "\u539F\u7248\u6717\u8BFB\u539F\u97F3")), /* @__PURE__ */ React.createElement("span", { className: "text-[11px] text-stone-500 block mt-0.5" }, "\u7EAF\u6B63\u82F1\u5F0F\u539F\u8457\u6717\u8BFB\u53D1\u97F3"))), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => onPlayOriginalSnippet(currentCue),
      disabled: isRecording || isEvaluating,
      className: "duo-btn-secondary min-h-[44px] min-w-[44px] flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-40 disabled:pointer-events-none cursor-pointer",
      title: "\u64AD\u653E\u5F53\u524D\u53E5\u539F\u8457\u539F\u58F0\u6717\u8BFB"
    },
    /* @__PURE__ */ React.createElement(Volume2, { size: 14 }),
    /* @__PURE__ */ React.createElement("span", null, "\u64AD\u653E\u539F\u97F3")
  )), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl border border-[#e8ddd0] bg-white gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center space-x-2.5 min-w-0" }, /* @__PURE__ */ React.createElement("div", { className: "w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-300/80 flex items-center justify-center shrink-0" }, /* @__PURE__ */ React.createElement(Headphones, { className: "w-4 h-4 text-amber-700" })), /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "track-b-badge text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-300/80 bg-amber-50 text-amber-900" }, "Track B \u5F55\u97F3"), /* @__PURE__ */ React.createElement("span", { className: "text-xs font-bold text-amber-950 truncate" }, "\u4F60\u7684\u8DDF\u8BFB\u5F55\u97F3")), /* @__PURE__ */ React.createElement("span", { className: "text-[11px] text-stone-500 truncate block mt-0.5" }, isRecording ? `\u6B63\u5728\u5F55\u97F3\u4E2D... ${recordSeconds}s` : recordedAudioUrl ? "\u5F55\u97F3\u5B8C\u6210\uFF0C\u53EF\u5BF9\u6BD4\u64AD\u653E" : "\u5C1A\u672A\u5F55\u5236"))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 shrink-0" }, !isRecording ? /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: startRecording,
      disabled: isEvaluating,
      className: "duo-btn-danger min-h-[44px] min-w-[44px] flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 whitespace-nowrap",
      title: "\u5F00\u59CB\u9EA6\u514B\u98CE\u8DDF\u8BFB\u5F55\u97F3\u4E0E AI \u8BED\u97F3\u6253\u5206"
    },
    /* @__PURE__ */ React.createElement(Mic, { size: 14, className: "shrink-0" }),
    /* @__PURE__ */ React.createElement("span", { className: "whitespace-nowrap" }, recordedAudioUrl ? "\u91CD\u65B0\u5F55\u97F3" : "\u5F00\u59CB\u5F55\u97F3")
  ) : /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: stopRecording,
      className: "duo-btn-danger min-h-[44px] min-w-[44px] flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold animate-pulse cursor-pointer ring-2 ring-rose-300 whitespace-nowrap",
      title: "\u505C\u6B62\u5F55\u97F3\u5E76\u89E6\u53D1 AI \u8BC4\u5206"
    },
    /* @__PURE__ */ React.createElement(Square, { size: 14, className: "shrink-0" }),
    /* @__PURE__ */ React.createElement("span", { className: "whitespace-nowrap" }, "\u505C\u6B62\u5F55\u97F3")
  ), recordedAudioUrl && !isRecording && /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: togglePlayRecording,
      disabled: isEvaluating,
      className: "duo-btn-primary min-h-[44px] min-w-[44px] flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 whitespace-nowrap",
      title: isPlayingRecording ? "\u6682\u505C\u56DE\u653E" : "\u56DE\u653E\u81EA\u5DF1\u5F55\u5236\u7684\u97F3\u9891"
    },
    isPlayingRecording ? /* @__PURE__ */ React.createElement(Pause, { size: 14, className: "shrink-0" }) : /* @__PURE__ */ React.createElement(Play, { size: 14, className: "shrink-0" }),
    /* @__PURE__ */ React.createElement("span", { className: "whitespace-nowrap" }, "\u56DE\u653E\u5F55\u97F3")
  )))), recordedAudioUrl && /* @__PURE__ */ React.createElement("audio", { ref: recordedAudioRef, src: recordedAudioUrl, className: "hidden" }), /* @__PURE__ */ React.createElement("div", { className: "mt-4 text-center text-xs text-stone-500" }, "\u5EFA\u8BAE\uFF1A\u5148\u542C\u4E00\u904D\u539F\u58F0\u8BED\u8C03\u91CD\u97F3\uFF0C\u518D\u70B9\u51FB\u201C\u5F00\u59CB\u5F55\u97F3\u201D\u5927\u58F0\u8DDF\u8BFB\uFF0C\u53CD\u590D\u6BD4\u5BF9\u7EA0\u6B63\u8FDE\u8BFB\u548C\u53D1\u97F3\u7EC6\u8282\u3002")));
}
export {
  ShadowingRecorder
};
