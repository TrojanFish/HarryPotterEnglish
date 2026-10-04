import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  recordListeningSeconds, 
  getAnalyticsSummary, 
  checkAndApplyTimeTurnerProtection 
} from '../utils/analyticsStore';

/**
 * useStudyTracking Hook
 * Manages active listening time tracking, batched persistence to analytics store,
 * 35-minute continuous listening eye-care reminder prompt, and streak protection.
 */
export function useStudyTracking(isPlaying) {
  const [analyticsSummary, setAnalyticsSummary] = useState(() => {
    try {
      return getAnalyticsSummary();
    } catch {
      return null;
    }
  });

  const [showEyeCarePrompt, setShowEyeCarePrompt] = useState(false);
  const continuousListeningSecondsRef = useRef(0);
  const hasShownEyeCarePromptRef = useRef(false);
  const listeningSecondsAccumulator = useRef(0);

  // Initialize streak protection & refresh analytics on mount
  useEffect(() => {
    try {
      checkAndApplyTimeTurnerProtection();
      setAnalyticsSummary(getAnalyticsSummary());
    } catch {}
  }, []);

  // Flush active listening seconds
  const flushListeningSeconds = useCallback(() => {
    if (listeningSecondsAccumulator.current > 0) {
      recordListeningSeconds(listeningSecondsAccumulator.current);
      listeningSecondsAccumulator.current = 0;
      setAnalyticsSummary(getAnalyticsSummary());
    }
  }, []);

  // Active listening timer and 35-minute eye-care check
  useEffect(() => {
    let interval = null;

    if (isPlaying) {
      interval = setInterval(() => {
        // Accumulate active listening seconds
        listeningSecondsAccumulator.current += 1;
        continuousListeningSecondsRef.current += 1;

        // Batch flush every 5 seconds of active listening
        if (listeningSecondsAccumulator.current >= 5) {
          flushListeningSeconds();
        }

        // 35 minutes continuous listening check (2100 seconds) -> trigger eye-care prompt
        if (continuousListeningSecondsRef.current >= 2100 && !hasShownEyeCarePromptRef.current) {
          setShowEyeCarePrompt(true);
          hasShownEyeCarePromptRef.current = true;
        }
      }, 1000);
    } else {
      // Flush on pause
      flushListeningSeconds();
    }

    return () => {
      if (interval) clearInterval(interval);
      flushListeningSeconds();
    };
  }, [isPlaying, flushListeningSeconds]);

  // Flush remaining listening seconds on beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      flushListeningSeconds();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [flushListeningSeconds]);

  const dismissEyeCarePrompt = useCallback(() => {
    setShowEyeCarePrompt(false);
    continuousListeningSecondsRef.current = 0;
  }, []);

  const refreshAnalytics = useCallback(() => {
    setAnalyticsSummary(getAnalyticsSummary());
  }, []);

  return {
    analyticsSummary,
    refreshAnalytics,
    showEyeCarePrompt,
    dismissEyeCarePrompt,
    flushListeningSeconds
  };
}
