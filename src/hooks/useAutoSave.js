import { useState, useEffect, useRef, useCallback } from 'react';

export function useAutoSave(dirty, saveFn, { delay = 2500, enabled = true } = {}) {
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const timerRef = useRef(null);
  const saveFnRef = useRef(saveFn);
  const retryCountRef = useRef(0);
  const pendingRef = useRef(false);

  // Keep saveFn ref current without triggering effect re-runs
  useEffect(() => {
    saveFnRef.current = saveFn;
  }, [saveFn]);

  const executeSave = useCallback(async () => {
    if (saveStatus === 'saving') {
      pendingRef.current = true;
      return;
    }

    setSaveStatus('saving');
    try {
      await saveFnRef.current();
      setSaveStatus('saved');
      setLastSavedAt(new Date());
      retryCountRef.current = 0;

      // If changes came in during the save, re-queue
      if (pendingRef.current) {
        pendingRef.current = false;
        timerRef.current = setTimeout(executeSave, delay);
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
      retryCountRef.current += 1;

      if (retryCountRef.current <= 3) {
        // Exponential backoff: 1s, 2s, 4s
        const retryDelay = Math.pow(2, retryCountRef.current - 1) * 1000;
        setSaveStatus('saving');
        timerRef.current = setTimeout(executeSave, retryDelay);
      } else {
        setSaveStatus('error');
      }
    }
  }, [delay, saveStatus]);

  // Trigger debounced save when data becomes dirty
  useEffect(() => {
    if (!enabled || !dirty) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(executeSave, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [dirty, delay, enabled, executeSave]);

  const forceSave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    retryCountRef.current = 0;
    executeSave();
  }, [executeSave]);

  const clearError = useCallback(() => {
    retryCountRef.current = 0;
    setSaveStatus('idle');
  }, []);

  return { saveStatus, lastSavedAt, forceSave, clearError };
}
