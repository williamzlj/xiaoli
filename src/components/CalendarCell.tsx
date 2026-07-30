import React, { useState } from 'react';
import type { CalendarCell, CourseGroup } from '../types';
import { generateCellKey } from '../types';
import { formatCourseNumber } from '../utils/dateUtils';

interface CalendarCellProps {
  cell: CalendarCell;
  isSelected: boolean;
  isEditing: boolean;
  noteColor: string;
  dateFontSize: number;
  noteFontSize: number;
  courseGroups?: CourseGroup[];
  onMouseDown: (cellKey: string, isCtrlKey: boolean, isShiftKey: boolean) => void;
  onMouseEnter: (cellKey: string) => void;
  onDoubleClick: (cellKey: string) => void;
  onContextMenu: (cellKey: string, x: number, y: number) => void;
  onUpdate: (cellKey: string, updates: Partial<CalendarCell>) => void;
  extraStyle?: React.CSSProperties;
  monthGroupClass?: string;
  showScreenshotMode?: boolean;
}

export const CalendarCellComponent: React.FC<CalendarCellProps> = ({
  cell,
  isSelected,
  isEditing,
  noteColor,
  dateFontSize,
  noteFontSize,
  courseGroups = [],
  onMouseDown,
  onMouseEnter,
  onDoubleClick,
  onContextMenu,
  onUpdate,
  extraStyle,
  monthGroupClass,
  showScreenshotMode = false,
}) => {
  const [editValue, setEditValue] = useState('');
  const [editField, setEditField] = useState<'note' | null>(null);
  const cellKey = generateCellKey(cell.year, cell.month, cell.dayOfMonth);

  const handleClick = (e: React.MouseEvent) => {
    if (isEditing) return;
    if (e.button !== 0) return;
    onMouseDown(cellKey, e.ctrlKey || e.metaKey, e.shiftKey);
  };

  const handleDoubleClick = () => {
    onDoubleClick(cellKey);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu(cellKey, e.clientX, e.clientY);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editField === 'note') {
      onUpdate(cellKey, { note: editValue });
    }
    setEditField(null);
    setEditValue('');
  };

  const startEditNote = () => {
    setEditField('note');
    setEditValue(cell.note);
  };

  const getGroupColor = (groupId: string): string => {
    const group = courseGroups.find((g) => g.id === groupId);
    return group?.color || '#667eea';
  };

  const getGroupName = (groupId: string): string => {
    const group = courseGroups.find((g) => g.id === groupId);
    return group?.name || '';
  };

  return (
    <div
      data-cell-key={cellKey}
      className={`calendar-cell ${isSelected ? 'selected' : ''} ${cell.weekDay === 0 || cell.weekDay === 6 ? 'weekend' : ''} ${monthGroupClass || ''}`}
      style={{ backgroundColor: cell.bgColor, ...extraStyle }}
      onMouseDown={handleClick}
      onMouseEnter={() => onMouseEnter(cellKey)}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
    >
      <div className="cell-content">
        <div className="cell-date" style={{ fontSize: `${dateFontSize}px`, textAlign: 'center', fontWeight: 'bold' }}>
          {cell.isMonthStart ? `${cell.month}月${cell.dayOfMonth}日` : cell.dayOfMonth}
        </div>

        <div className="cell-course-numbers">
          {cell.courseNumbers?.map((cn, idx) => (
            <div
              key={idx}
              className="cell-course-number"
              style={{ backgroundColor: getGroupColor(cn.groupId) }}
              title={`${getGroupName(cn.groupId)} - 第${cn.number}次课`}
            >
              {formatCourseNumber(cn.number)}
            </div>
          ))}
        </div>

        {!editField && cell.note && (
          <div className="cell-note" style={{ color: noteColor, fontSize: `${noteFontSize}px`, textAlign: 'center' }} onClick={startEditNote} title="点击编辑备注">
            {cell.note}
          </div>
        )}
      </div>

      {editField && (
        <form className="cell-edit-form" onSubmit={handleEditSubmit}>
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleEditSubmit}
            autoFocus
            placeholder="输入备注..."
          />
        </form>
      )}

      {!showScreenshotMode && (
        <div className="cell-edit-hints">
          <button
            className="hint-btn"
            onClick={(e) => { e.stopPropagation(); startEditNote(); }}
            title="添加备注"
          >
            📝
          </button>
        </div>
      )}
    </div>
  );
};
