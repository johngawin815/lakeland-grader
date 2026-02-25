import { useState, useCallback } from 'react';

export function useUndoStack(maxHistory = 50) {
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);

  const push = useCallback((action) => {
    setPast(prev => {
      const next = [...prev, { ...action, timestamp: Date.now() }];
      // Trim to max history
      return next.length > maxHistory ? next.slice(next.length - maxHistory) : next;
    });
    // Any new action clears the redo stack
    setFuture([]);
  }, [maxHistory]);

  const undo = useCallback(() => {
    if (past.length === 0) return null;

    const action = past[past.length - 1];
    setPast(prev => prev.slice(0, -1));
    setFuture(prev => [action, ...prev]);
    return action;
  }, [past]);

  const redo = useCallback(() => {
    if (future.length === 0) return null;

    const action = future[0];
    setFuture(prev => prev.slice(1));
    setPast(prev => [...prev, action]);
    return action;
  }, [future]);

  const clear = useCallback(() => {
    setPast([]);
    setFuture([]);
  }, []);

  return {
    push,
    undo,
    redo,
    clear,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    historyLength: past.length,
  };
}
