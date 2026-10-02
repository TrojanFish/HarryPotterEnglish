import React, { useState, useRef, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { evaluatePronunciation, isSpeechRecognitionSupported } from '../utils/speechScoring';

export function ShadowingRecorder({
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

  // AI Speech Scoring states
  const [liveTranscript, setLiveTranscript] = useState('');
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const recordedAudioRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');
  const recordedAudioUrlRef = useRef(null);
  const isRecordingRef = useRef(false);
  const safetyTimeoutRef = useRef(null);

  // Check speech recognition capability
  useEffect(() => {
    setIsSpeechSupported(isSpeechRecognitionSupported());
  }, []);

  // Comprehensive hardware track and timer cleanup
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
        // ignore
      }
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach(track => {
          if (track.readyState === 'live') {
            track.stop();
          }
        });
      } catch (e) {
        // ignore
      }
      streamRef.current = null;
    }
    isRecordingRef.current = false;
  }, []);

  // Revoke Blob object URLs to avoid memory leaks
  const cleanupAudioUrl = useCallback(() => {
    if (recordedAudioUrlRef.current) {
      try {
        URL.revokeObjectURL(recordedAudioUrlRef.current);
      } catch (e) {
        // ignore
      }
      recordedAudioUrlRef.current = null;
    }
  }, []);

  // Clean up when modal closes or currentCue changes
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
      setLiveTranscript('');
      transcriptRef.current = '';
      setIsPlayingRecording(false);
      if (recordedAudioRef.current) {
        recordedAudioRef.current.pause();
      }
    }
  }, [isOpen, cleanupHardwareResources, cleanupAudioUrl]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      cleanupHardwareResources();
      cleanupAudioUrl();
    };
  }, [cleanupHardwareResources, cleanupAudioUrl]);

  // Start recording (MediaRecorder + Web Speech API concurrently)
  const startRecording = async () => {
    setRecordingError(null);
    setEvaluationResult(null);
    setLiveTranscript('');
    transcriptRef.current = '';

    // Revoke previous audio blob if any
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

      // 1. Initialize MediaRecorder for audio playback
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);
        recordedAudioUrlRef.current = url;

        // Release hardware mic stream tracks
        if (streamRef.current) {
          try {
            streamRef.current.getTracks().forEach(track => {
              if (track.readyState === 'live') track.stop();
            });
          } catch (e) {}
          streamRef.current = null;
        }
      };

      // 2. Initialize Web Speech API concurrently
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.lang = 'en-US';
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.maxAlternatives = 1;

          recognition.onresult = (event) => {
            let combined = '';
            for (let i = 0; i < event.results.length; i++) {
              combined += event.results[i][0].transcript + ' ';
            }
            const trimmed = combined.trim();
            transcriptRef.current = trimmed;
            setLiveTranscript(trimmed);
          };

          recognition.onerror = (event) => {
            console.warn('[SpeechRecognition] error:', event.error);
            if (event.error === 'not-allowed') {
              setRecordingError('麦克风语音识别权限受限，录音仍可继续，但无法进行AI实时评分。');
            } else if (event.error === 'network') {
              console.warn('[SpeechRecognition] network error encountered');
            }
          };

          recognition.start();
          recognitionRef.current = recognition;
        } catch (speechErr) {
          console.warn('[WebSpeech] Failed to start recognition:', speechErr);
        }
      }

      mediaRecorder.start(250);
      setIsRecording(true);
      isRecordingRef.current = true;
      setRecordSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordSeconds(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Microphone access denied:', err);
      setRecordingError('无法访问麦克风，请检查浏览器麦克风权限设置。');
    }
  };

  // Stop recording with 1,500ms safety timeout to guarantee <2s latency SLA
  const stopRecording = () => {
    if (!isRecordingRef.current && !isRecording) return;
    setIsRecording(false);
    isRecordingRef.current = false;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
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
        currentCue ? currentCue.text : '',
        spoken,
        isFallbackFlag
      );
      setEvaluationResult(result);
      setIsEvaluating(false);

      // Invoke optional analytics store callback for Milestone 2
      if (onShadowingScore && typeof onShadowingScore === 'function' && currentCue) {
        try {
          onShadowingScore({
            chapterId: currentCue.chapterId || '',
            cueId: currentCue.id,
            score: result.score
          });
        } catch (e) {
          console.warn('onShadowingScore error:', e);
        }
      }
    };

    // 1,500ms safety timeout: ensures evaluation completes strictly within 2 seconds
    safetyTimeoutRef.current = setTimeout(() => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
        recognitionRef.current = null;
      }
      runEvaluation(transcriptRef.current, false);
    }, 1500);

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
      runEvaluation('', true);
    }
  };

  const togglePlayRecording = () => {
    if (!recordedAudioRef.current) return;
    if (isPlayingRecording) {
      recordedAudioRef.current.pause();
      setIsPlayingRecording(false);
    } else {
      recordedAudioRef.current.currentTime = 0;
      recordedAudioRef.current.play()
        .then(() => setIsPlayingRecording(true))
        .catch(err => console.warn('Playback failed:', err));
      recordedAudioRef.current.onended = () => setIsPlayingRecording(false);
    }
  };

  if (!isOpen || !currentCue) return null;

  // Hogwarts O.W.L. Tier Grade Specifications
  const getHogwartsGrade = (score) => {
    if (score >= 90) {
      return {
        letter: 'O',
        title: '卓越 · Outstanding',
        quote: '“宛如赫敏·格兰杰般标准地道！纯正英伦腔调，格兰芬多为你加 10 分！”',
        badgeClass: 'border-emerald-500 text-emerald-400 bg-emerald-950/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]',
        parchmentBadge: 'border-emerald-700 text-emerald-900 bg-emerald-100'
      };
    } else if (score >= 75) {
      return {
        letter: 'E',
        title: '超乎期待 · Exceeds Expectations',
        quote: '“令人赞叹！节奏与发音都非常自然，展现出高年级学长的语调风范。”',
        badgeClass: 'border-[#cba358] text-[#f3d38c] bg-[#cba358]/20 shadow-[0_0_15px_rgba(203,163,88,0.3)]',
        parchmentBadge: 'border-[#946b2d] text-[#744210] bg-[#fbf0d9]'
      };
    } else if (score >= 60) {
      return {
        letter: 'A',
        title: '及格 · Acceptable',
        quote: '“通过考核！主体发音清晰，注意黄色标记词汇的发音与重音弱读。”',
        badgeClass: 'border-amber-500 text-amber-400 bg-amber-950/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]',
        parchmentBadge: 'border-amber-700 text-amber-900 bg-amber-100'
      };
    } else {
      return {
        letter: 'P',
        title: '尚需练习 · Needs Practice',
        quote: '“魔法共鸣稍弱。不妨点击‘播放原音’多听两遍原声，再重新录音跟读。”',
        badgeClass: 'border-rose-500 text-rose-400 bg-rose-950/50 shadow-[0_0_15px_rgba(244,63,94,0.3)]',
        parchmentBadge: 'border-rose-700 text-rose-900 bg-rose-100'
      };
    }
  };

  const gradeInfo = evaluationResult ? getHogwartsGrade(evaluationResult.score) : null;
  const matchedCount = evaluationResult 
    ? evaluationResult.words.filter(w => w.status === 'matched').length 
    : 0;
  const totalCount = evaluationResult ? evaluationResult.words.length : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className={`relative w-full max-w-xl rounded-2xl border shadow-2xl p-6 transition-all duration-300 ${
        isParchment 
          ? 'bg-[#fbf6ea] border-[#dec9a5] text-[#2c221e]' 
          : 'bg-[#141b26] border-[#2b3a4f] text-[#e2d9c8]'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-700/40">
          <div className="flex items-center space-x-2">
            <Mic className="text-[#cba358]" size={20} />
            <h3 className="font-magical font-bold text-lg text-[#cba358]">
              本句跟读与 AI 语音评分 (Shadowing & Scoring)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Target Sentence Box & Word-Level Badges */}
        <div className="p-4 rounded-xl bg-black/25 border border-gray-700/40 mb-4 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-magical uppercase tracking-wider text-[#cba358]">
              原著朗读目标句 · Target Sentence
            </span>
            {/* Legend */}
            {evaluationResult && (
              <div className="flex items-center gap-2 text-[10px]">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> 准确
                </span>
                <span className="flex items-center gap-1 text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span> 相似
                </span>
                <span className="flex items-center gap-1 text-rose-400">
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span> 偏差/遗漏
                </span>
              </div>
            )}
          </div>

          {/* Interactive Word Badges or Default Sentence */}
          {!evaluationResult ? (
            <p className="font-reading text-base sm:text-lg leading-relaxed text-[#f3d38c]">
              "{currentCue.text}"
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5 py-1">
              {evaluationResult.words.map((w, idx) => {
                let badgeStyle = '';
                if (w.status === 'matched') {
                  badgeStyle = isParchment
                    ? 'bg-emerald-100/90 border-emerald-600/40 text-emerald-900 shadow-sm'
                    : 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 shadow-sm';
                } else if (w.status === 'partial') {
                  badgeStyle = isParchment
                    ? 'bg-amber-100/90 border-amber-600/40 text-amber-900 shadow-sm'
                    : 'bg-amber-950/60 border-amber-500/50 text-amber-300 shadow-sm';
                } else {
                  badgeStyle = isParchment
                    ? 'bg-rose-100/90 border-rose-600/40 text-rose-900 line-through opacity-85 shadow-sm'
                    : 'bg-rose-950/60 border-rose-500/50 text-rose-300 line-through opacity-85 shadow-sm';
                }

                const tooltipText = w.matchedSpokenWord
                  ? `识别发音: "${w.matchedSpokenWord}" (${w.status === 'matched' ? '发音准确 (100%)' : '发音相似 (60%)'})`
                  : (w.status === 'inaccurate' ? '未识别到该单词或发音偏差较大 (0%)' : '发音准确 (100%)');

                return (
                  <span
                    key={idx}
                    title={tooltipText}
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-sm sm:text-base font-reading border transition-all cursor-default ${badgeStyle}`}
                  >
                    {w.word}
                  </span>
                );
              })}
            </div>
          )}

          {currentCue.translation && (
            <p className="text-xs text-[#8c9ba5] font-reading mt-2.5">
              {currentCue.translation}
            </p>
          )}

          {/* Transcript Footer */}
          {evaluationResult && evaluationResult.transcript && (
            <div className="mt-3 pt-2.5 border-t border-gray-700/30 text-xs text-[#8c9ba5] flex items-center justify-between">
              <div>
                <span className="text-gray-400 font-semibold">你朗读的内容：</span>
                <span className="italic text-gray-200 ml-1">"{evaluationResult.transcript}"</span>
              </div>
              {evaluationResult.latencyMs !== undefined && (
                <span className="text-[10px] text-gray-500 font-mono">
                  {evaluationResult.latencyMs}ms
                </span>
              )}
            </div>
          )}
        </div>

        {/* Real-time Listening Wave & Interim Transcript */}
        {isRecording && (
          <div className="p-3 mb-4 rounded-xl bg-[#cba358]/10 border border-[#cba358]/30 animate-pulse">
            <div className="flex items-center justify-between text-xs text-[#cba358] mb-1">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
                <span className="font-semibold">正在实时聆听... ({recordSeconds}s)</span>
              </div>
              <span className="text-[11px] text-[#8c9ba5]">大声跟读上方英文句子</span>
            </div>
            <p className="text-sm font-reading text-gray-200 min-h-[1.5rem] italic">
              {liveTranscript || '（等待你的声音...）'}
            </p>
          </div>
        )}

        {/* Evaluating Spinner */}
        {isEvaluating && (
          <div className="p-3 mb-4 rounded-xl bg-[#cba358]/10 border border-[#cba358]/30 flex items-center justify-center space-x-2 text-[#f3d38c]">
            <Sparkles className="animate-spin text-[#cba358]" size={16} />
            <span className="text-xs font-semibold">正在进行 AI 魔法语音评分...</span>
          </div>
        )}

        {/* Overall Score Badge Card & Hogwarts O.W.L. Grade */}
        {evaluationResult && gradeInfo && !isEvaluating && (
          <div className="p-4 rounded-xl border border-gray-700/40 bg-gradient-to-r from-gray-900/60 to-gray-800/40 mb-4 shadow-magic-card flex items-center justify-between">
            <div className="flex items-center space-x-3.5">
              <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl border-2 font-magical font-black text-xl shadow-inner ${
                isParchment ? gradeInfo.parchmentBadge : gradeInfo.badgeClass
              }`}>
                <span>{evaluationResult.score}%</span>
                <span className="text-[9px] uppercase tracking-wider -mt-1 font-sans">
                  等阶 {gradeInfo.letter}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-magical font-bold text-sm text-[#cba358]">
                    {gradeInfo.title}
                  </h4>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700">
                    {matchedCount}/{totalCount} 词匹配
                  </span>
                </div>
                <p className="text-xs text-gray-300 mt-1 font-reading leading-snug">
                  {gradeInfo.quote}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Browser compatibility fallback notice */}
        {!isSpeechSupported && (
          <div className="p-2.5 mb-4 rounded-lg bg-amber-950/30 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
            <Info size={14} className="shrink-0" />
            <span>当前浏览器未开启 Web Speech API，音频录制与原音回放正常，AI 自动评分推荐使用 Chrome / Edge。</span>
          </div>
        )}

        {/* Error message */}
        {recordingError && (
          <div className="p-3 mb-4 rounded-lg bg-rose-900/30 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{recordingError}</span>
          </div>
        )}

        {/* Dual Playback Control Bar */}
        <div className="space-y-3">
          {/* 1. Original Narrator Audio */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-gray-700/30 bg-gray-800/20">
            <div className="flex items-center space-x-2.5">
              <Volume2 className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <span className="text-xs font-semibold block text-gray-300">原版朗读原音</span>
                <span className="text-[11px] text-[#8c9ba5]">纯正英式青少年发音</span>
              </div>
            </div>
            <button
              onClick={() => onPlayOriginalSnippet(currentCue)}
              disabled={isRecording || isEvaluating}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#cba358]/20 border border-[#cba358]/40 text-[#cba358] hover:bg-[#cba358]/30 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold transition-all"
            >
              <Volume2 size={14} />
              <span>播放原音</span>
            </button>
          </div>

          {/* 2. User Recording Box */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-gray-700/30 bg-gray-800/20">
            <div className="flex items-center space-x-2.5">
              <Headphones className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <span className="text-xs font-semibold block text-gray-300">你的跟读录音</span>
                <span className="text-[11px] text-[#8c9ba5]">
                  {isRecording 
                    ? `正在录音中... ${recordSeconds}s` 
                    : recordedAudioUrl 
                      ? '录音完成，可对比播放' 
                      : '尚未录制'}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  disabled={isEvaluating}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#740001] text-white hover:bg-red-800 text-xs font-semibold transition-all shadow-sm disabled:opacity-50"
                >
                  <Mic size={14} />
                  <span>{recordedAudioUrl ? '重新录音' : '开始录音'}</span>
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 text-white animate-pulse text-xs font-semibold shadow-sm"
                >
                  <Square size={14} />
                  <span>停止录音</span>
                </button>
              )}

              {recordedAudioUrl && !isRecording && (
                <button
                  onClick={togglePlayRecording}
                  disabled={isEvaluating}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#cba358] text-[#0f141c] hover:shadow-glow-gold text-xs font-bold transition-all disabled:opacity-50"
                >
                  {isPlayingRecording ? <Pause size={14} /> : <Play size={14} />}
                  <span>回放录音</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Hidden Audio element for recorded audio */}
        {recordedAudioUrl && (
          <audio ref={recordedAudioRef} src={recordedAudioUrl} className="hidden" />
        )}

        {/* Tips footer */}
        <div className="mt-4 text-center text-xs text-[#8c9ba5]">
          建议：先听一遍原声语调重音，再点击“开始录音”大声跟读，反复比对纠正连读和发音细节。
        </div>
      </div>
    </div>
  );
}
