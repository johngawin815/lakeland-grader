import { useState, useEffect, useRef, useCallback } from 'react';

export function useAutoSave(dirty, saveFn, { delay = 2500, enabled = true } = {}) {
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const timerRef = useRef(null);
  const saveFnRef = useRef(saveFn);
  const retryCountRef = useRef(0);
  const pendingRef = useRef(false);
  const isSavingRef = useRef(false); // use ref so executeSave doesn't need saveStatus as dep

  useEffect(() => {
    saveFnRef.current = saveFn;
  }, [saveFn]);

  const executeSave = useCallback(async () => {
    if (isSavingRef.current) {
      pendingRef.current = true;
      return;
    }

    isSavingRef.current = true;
    setSaveStatus('saving');
    try {
      await saveFnRef.current();
      isSavingRef.current = false;
      setSaveStatus('saved');
      setLastSavedAt(new Date());
      retryCountRef.current = 0;

      if (pendingRef.current) {
        pendingRef.current = false;
        timerRef.current = setTimeout(executeSave, delay);
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
      isSavingRef.current = false;
      retryCountRef.current += 1;

      if (retryCountRef.current <= 3) {
        const retryDelay = Math.pow(2, retryCountRef.current - 1) * 1000;
        timerRef.current = setTimeout(executeSave, retryDelay);
      } else {
        setSaveStatus('error');
      }
    }
  }, [delay]); // removed saveStatus from deps — isSavingRef handles the guard

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
