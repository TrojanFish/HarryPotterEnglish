import { useState, useRef, useEffect, useCallback } from 'react';
import { markChapterCompleted } from '../utils/analyticsStore';

/**
 * useAudioPlayback Hook
 * Encapsulates audio element state, playback control, sentence-level seeking/looping,
 * rate/volume adjustments, screen WakeLock management, stall recovery, and W3C MediaSession API.
 */
export function useAudioPlayback({
  cues = [],
  currentBookObj = null,
  currentChapterObj = null,
  onChapterAutoAdvance = null,
  disableCueAutoAdvance = false
}) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [volume, setVolume] = useState(0.85);
  const [isLoopSentence, setIsLoopSentence] = useState(false);
  const [stopAtCueEnd, setStopAtCueEndState] = useState(false);
  const stopAtCueEndRef = useRef(false);
  const setStopAtCueEnd = useCallback((val) => {
    stopAtCueEndRef.current = Boolean(val);
    setStopAtCueEndState(Boolean(val));
  }, []);
  const [activeCueIndex, setActiveCueIndex] = useState(0);
  const lastTimeUpdateRef = useRef(0);

  // 1. Synchronize audio playback properties
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Persist current playback position for breakpoint continue learning
  useEffect(() => {
    if (currentTime > 0 && currentBookObj?.id && currentChapterObj?.id) {
      try {
        localStorage.setItem('hp_last_position', JSON.stringify({
          bookId: currentBookObj.id,
          chapterId: currentChapterObj.id,
          currentTime,
          duration,
          updatedAt: Date.now()
        }));
      } catch {}
    }
  }, [currentTime, duration, currentBookObj?.id, currentChapterObj?.id]);

  // 2. Play / Pause Control
  const togglePlayPause = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        setStopAtCueEnd(false);
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        console.warn('[Audio] Autoplay / play prevented:', err.message);
        setIsPlaying(false);
      }
    }
  }, [isPlaying, setStopAtCueEnd]);

  const seekTo = useCallback((time) => {
    const audio = audioRef.current;
    if (!audio) return;
    const target = Math.max(0, Math.min(time, duration || audio.duration || 0));
    audio.currentTime = target;
    setCurrentTime(target);
  }, [duration]);

  const seekRelative = useCallback((offsetSeconds) => {
    const audio = audioRef.current;
    if (!audio) return;
    const current = audio.currentTime || currentTime || 0;
    const target = Math.max(0, Math.min(current + offsetSeconds, duration || audio.duration || 0));
    seekTo(target);
  }, [currentTime, duration, seekTo]);

  // 3. Sentence Navigation Controls
  const seekToCue = useCallback((target, autoPlay = true, options = {}) => {
    if (!cues || cues.length === 0) return;

    let targetCue = null;
    let targetIndex = -1;

    if (typeof target === 'number') {
      targetIndex = Math.max(0, Math.min(target, cues.length - 1));
      targetCue = cues[targetIndex];
    } else if (target && typeof target === 'object') {
      targetIndex = cues.findIndex(c => c.id === target.id);
      targetCue = target;
    }

    if (targetCue) {
      if (targetIndex !== -1) setActiveCueIndex(targetIndex);
      if (options && options.stopAtEnd) {
        setStopAtCueEnd(true);
      } else {
        setStopAtCueEnd(false);
      }
      seekTo(targetCue.startTime);
      if (autoPlay && audioRef.current) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }
  }, [cues, seekTo]);

  const handlePrevSentence = useCallback(() => {
    if (activeCueIndex > 0) {
      seekToCue(activeCueIndex - 1);
    }
  }, [activeCueIndex, seekToCue]);

  const handleNextSentence = useCallback(() => {
    if (activeCueIndex < cues.length - 1) {
      seekToCue(activeCueIndex + 1);
    }
  }, [activeCueIndex, cues.length, seekToCue]);

  const handleReplayCurrentSentence = useCallback((options = {}) => {
    seekToCue(activeCueIndex, true, options);
  }, [activeCueIndex, seekToCue]);

  // 4. Audio Element Event Handlers
  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const now = audio.currentTime;

    if (cues && cues.length > 0) {
      const currentCue = cues[activeCueIndex];

      // Single sentence stop enforcement (e.g. Dictation mode or single sentence preview)
      if (stopAtCueEndRef.current && currentCue) {
        if (now >= currentCue.endTime - 0.08) {
          audio.pause();
          setIsPlaying(false);
          setStopAtCueEnd(false);
          audio.currentTime = currentCue.startTime;
          return;
        }
      }

      // Sentence looping enforcement
      if (isLoopSentence && currentCue) {
        if (now >= currentCue.endTime - 0.15) {
          audio.currentTime = currentCue.startTime;
          return;
        }
      }

      // Determine current active cue (only if auto-advancing cues is enabled)
      if (!disableCueAutoAdvance) {
        if (!currentCue || now < currentCue.startTime || now >= currentCue.endTime) {
          const idx = cues.findIndex(c => now >= c.startTime && now < c.endTime);
          if (idx !== -1 && idx !== activeCueIndex) {
            setActiveCueIndex(idx);
          }
        }
      }
    }

    // Hook chapter completion near audio end
    if (duration > 0 && now >= duration - 1.5 && currentChapterObj?.id) {
      markChapterCompleted(currentChapterObj.id);
    }

    // Throttle scrubber state update to every 250ms to avoid excessive re-renders
    const perfNow = performance.now();
    if (perfNow - lastTimeUpdateRef.current >= 250) {
      lastTimeUpdateRef.current = perfNow;
      setCurrentTime(now);
    }
  }, [cues, activeCueIndex, isLoopSentence, duration, currentChapterObj, disableCueAutoAdvance, setStopAtCueEnd]);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    if (currentChapterObj?.id) {
      markChapterCompleted(currentChapterObj.id);
    }
    if (onChapterAutoAdvance) {
      onChapterAutoAdvance();
    }
  }, [currentChapterObj, onChapterAutoAdvance]);

  // Stall recovery
  const stallTimeoutRef = useRef(null);
  const handleWaiting = useCallback(() => {
    if (stallTimeoutRef.current) clearTimeout(stallTimeoutRef.current);
    stallTimeoutRef.current = setTimeout(() => {
      if (isPlaying && audioRef.current && audioRef.current.paused) {
        audioRef.current.play().catch(() => {});
      }
    }, 3000);
  }, [isPlaying]);

  const handleCanPlay = useCallback(() => {
    if (stallTimeoutRef.current) {
      clearTimeout(stallTimeoutRef.current);
      stallTimeoutRef.current = null;
    }
  }, []);

  const handleAudioError = useCallback((e) => {
    console.warn('[Audio] Transient streaming error:', e);
    if (audioRef.current && isPlaying && currentTime > 0) {
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.load();
          audioRef.current.currentTime = currentTime;
          audioRef.current.play().catch(() => {});
        }
      }, 1000);
    }
  }, [isPlaying, currentTime]);

  // 5. Screen WakeLock API
  const wakeLockRef = useRef(null);
  const requestWakeLock = useCallback(async () => {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator && !wakeLockRef.current) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      } catch {}
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch {}
      wakeLockRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isPlaying) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }
    return () => {
      releaseWakeLock();
    };
  }, [isPlaying, requestWakeLock, releaseWakeLock]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isPlaying) {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isPlaying, requestWakeLock]);

  // 6. W3C MediaSession API (Lock screen, Dynamic Island, Control Center, AirPods)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    if (currentBookObj && currentChapterObj) {
      const chapterTitle = currentChapterObj.title || currentBookObj.cnTitle || '魔法英语精听';
      const artistName = 'J.K. Rowling - 霍格沃茨魔法学院';
      const albumName = currentBookObj.cnTitle || currentBookObj.title || '哈利·波特原版有声书';
      const origin = window.location.origin;
      const coverUrl = currentBookObj.id 
        ? `${origin}/api/raw/podcasts/${currentBookObj.id}/cover.jpg` 
        : `${origin}/apple-touch-icon.png`;

      try {
        navigator.mediaSession.metadata = new window.MediaMetadata({
          title: chapterTitle,
          artist: artistName,
          album: albumName,
          artwork: [
            { src: coverUrl, sizes: '512x512', type: 'image/jpeg' },
            { src: `${origin}/apple-touch-icon.png`, sizes: '180x180', type: 'image/png' },
            { src: `${origin}/icon.svg`, sizes: '192x192', type: 'image/svg+xml' }
          ]
        });
      } catch (e) {
        console.warn('[MediaSession] Metadata setup:', e);
      }
    }

    try {
      navigator.mediaSession.setActionHandler('play', () => {
        if (audioRef.current) {
          audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
        }
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        if (audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
      });
      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        const offset = details.seekOffset || 5;
        if (audioRef.current) {
          audioRef.current.currentTime = Math.max(audioRef.current.currentTime - offset, 0);
        }
      });
      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        const offset = details.seekOffset || 5;
        if (audioRef.current) {
          audioRef.current.currentTime = Math.min(audioRef.current.currentTime + offset, duration);
        }
      });
      navigator.mediaSession.setActionHandler('previoustrack', handlePrevSentence);
      navigator.mediaSession.setActionHandler('nexttrack', handleNextSentence);
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) seekTo(details.seekTime);
      });
    } catch (e) {
      console.warn('[MediaSession] Action handlers error:', e);
    }
  }, [currentBookObj, currentChapterObj, duration, handlePrevSentence, handleNextSentence, seekTo]);

  // Sync MediaSession playbackState (Lock screen play/pause icon)
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  // Sync MediaSession positionState (Lock screen timeline scrubber)
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator && 'setPositionState' in navigator.mediaSession) {
      if (duration > 0 && Number.isFinite(duration) && Number.isFinite(currentTime)) {
        try {
          navigator.mediaSession.setPositionState({
            duration: Math.max(duration, 0),
            playbackRate: playbackRate || 1.0,
            position: Math.min(Math.max(currentTime, 0), duration)
          });
        } catch (e) {}
      }
    }
  }, [currentTime, duration, playbackRate]);

  return {
    audioRef,
    isPlaying,
    setIsPlaying,
    currentTime,
    setCurrentTime,
    duration,
    playbackRate,
    setPlaybackRate,
    volume,
    setVolume,
    isLoopSentence,
    setIsLoopSentence,
    activeCueIndex,
    setActiveCueIndex,
    activeCue: cues[activeCueIndex] || null,
    togglePlayPause,
    seekTo,
    seekRelative,
    seekToCue,
    handlePrevSentence,
    handleNextSentence,
    handleReplayCurrentSentence,
    stopAtCueEnd,
    setStopAtCueEnd,
    handleTimeUpdate,
    handleLoadedMetadata,
    handleEnded,
    handleWaiting,
    handleCanPlay,
    handleAudioError
  };
}
