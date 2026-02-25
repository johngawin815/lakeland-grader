import { useCallback, useRef } from 'react';

export function useGridKeyboard({ rows, cols, tableRef }) {
  const currentCell = useRef({ row: 0, col: 0 });

  const focusCell = useCallback((row, col) => {
    if (!tableRef.current) return;
    const clampedRow = Math.max(0, Math.min(row, rows - 1));
    const clampedCol = Math.max(0, Math.min(col, cols - 1));
    const input = tableRef.current.querySelector(
      `[data-row="${clampedRow}"][data-col="${clampedCol}"]`
    );
    if (input) {
      input.focus();
      input.select();
      currentCell.current = { row: clampedRow, col: clampedCol };
    }
  }, [rows, cols, tableRef]);

  const handleKeyDown = useCallback((e) => {
    const { row, col } = currentCell.current;

    switch (e.key) {
      case 'Tab': {
        e.preventDefault();
        if (e.shiftKey) {
          // Move left, wrap to previous row
          if (col > 0) focusCell(row, col - 1);
          else if (row > 0) focusCell(row - 1, cols - 1);
        } else {
          // Move right, wrap to next row
          if (col < cols - 1) focusCell(row, col + 1);
          else if (row < rows - 1) focusCell(row + 1, 0);
        }
        break;
      }
      case 'Enter': {
        e.preventDefault();
        // Move down in same column
        if (e.shiftKey) {
          if (row > 0) focusCell(row - 1, col);
        } else {
          if (row < rows - 1) focusCell(row + 1, col);
        }
        break;
      }
      case 'ArrowUp': {
        if (e.altKey || e.ctrlKey) return;
        e.preventDefault();
        if (row > 0) focusCell(row - 1, col);
        break;
      }
      case 'ArrowDown': {
        if (e.altKey || e.ctrlKey) return;
        e.preventDefault();
        if (row < rows - 1) focusCell(row + 1, col);
        break;
      }
      case 'ArrowLeft': {
        if (e.altKey || e.ctrlKey) return;
        const input = e.target;
        // Only navigate if cursor is at the start of the input
        if (input.selectionStart === 0 && input.selectionEnd === 0 && col > 0) {
          e.preventDefault();
          focusCell(row, col - 1);
        }
        break;
      }
      case 'ArrowRight': {
        if (e.altKey || e.ctrlKey) return;
        const el = e.target;
        // Only navigate if cursor is at the end of the input
        if (el.selectionStart === el.value.length && col < cols - 1) {
          e.preventDefault();
          focusCell(row, col + 1);
        }
        break;
      }
      case 'Escape': {
        e.target.blur();
        break;
      }
      default:
        break;
    }
  }, [rows, cols, focusCell]);

  const onCellFocus = useCallback((row, col) => {
    currentCell.current = { row, col };
  }, []);

  return { handleKeyDown, onCellFocus, focusCell };
}
