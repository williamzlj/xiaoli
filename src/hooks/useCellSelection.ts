import { useState, useCallback, useRef } from 'react';
import type { SelectedCells } from '../types';

export function useCellSelection() {
  const [selection, setSelection] = useState<SelectedCells>({
    cellKeys: [],
    anchorKey: null,
  });

  const isDraggingRef = useRef(false);
  const dragStartKeyRef = useRef<string | null>(null);

  const selectSingle = useCallback((cellKey: string) => {
    setSelection({ cellKeys: [cellKey], anchorKey: cellKey });
  }, []);

  const selectMultiple = useCallback((cellKeys: string[]) => {
    setSelection({ cellKeys, anchorKey: cellKeys[0] || null });
  }, []);

  const toggleCell = useCallback((cellKey: string) => {
    setSelection((prev) => {
      const isSelected = prev.cellKeys.includes(cellKey);
      const newKeys = isSelected
        ? prev.cellKeys.filter((k) => k !== cellKey)
        : [...prev.cellKeys, cellKey];
      return { cellKeys: newKeys, anchorKey: newKeys[0] || null };
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelection({ cellKeys: [], anchorKey: null });
  }, []);

  const handleCellMouseDown = useCallback((cellKey: string, isCtrlKey: boolean, isShiftKey: boolean) => {
    if (isShiftKey && selection.anchorKey) {
      const allCells = document.querySelectorAll('[data-cell-key]');
      const keys = Array.from(allCells).map((el) => el.getAttribute('data-cell-key') || '').filter(Boolean);
      const anchorIdx = keys.indexOf(selection.anchorKey);
      const currentIdx = keys.indexOf(cellKey);
      if (anchorIdx !== -1 && currentIdx !== -1) {
        const start = Math.min(anchorIdx, currentIdx);
        const end = Math.max(anchorIdx, currentIdx);
        const rangeKeys = keys.slice(start, end + 1);
        setSelection({ cellKeys: rangeKeys, anchorKey: selection.anchorKey });
        return;
      }
    }

    if (isCtrlKey) {
      toggleCell(cellKey);
    } else {
      selectSingle(cellKey);
    }

    isDraggingRef.current = true;
    dragStartKeyRef.current = cellKey;
  }, [selection.anchorKey, selectSingle, toggleCell]);

  const handleCellMouseEnter = useCallback((cellKey: string) => {
    if (!isDraggingRef.current || !dragStartKeyRef.current) return;

    const allCells = document.querySelectorAll('[data-cell-key]');
    const keys = Array.from(allCells).map((el) => el.getAttribute('data-cell-key') || '').filter(Boolean);
    const startIdx = keys.indexOf(dragStartKeyRef.current);
    const currentIdx = keys.indexOf(cellKey);

    if (startIdx !== -1 && currentIdx !== -1) {
      const start = Math.min(startIdx, currentIdx);
      const end = Math.max(startIdx, currentIdx);
      const rangeKeys = keys.slice(start, end + 1);
      setSelection({ cellKeys: rangeKeys, anchorKey: dragStartKeyRef.current });
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    dragStartKeyRef.current = null;
  }, []);

  const isSelected = useCallback((cellKey: string): boolean => {
    return selection.cellKeys.includes(cellKey);
  }, [selection.cellKeys]);

  const hasSelection = useCallback((): boolean => {
    return selection.cellKeys.length > 0;
  }, [selection.cellKeys.length]);

  const getSelectedCount = useCallback((): number => {
    return selection.cellKeys.length;
  }, [selection.cellKeys.length]);

  return {
    selection,
    selectSingle,
    selectMultiple,
    toggleCell,
    clearSelection,
    handleCellMouseDown,
    handleCellMouseEnter,
    handleMouseUp,
    isSelected,
    hasSelection,
    getSelectedCount,
  };
}
