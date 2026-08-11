import React, { useMemo } from 'react';
import type { MonthConfig, CalendarCell, WeekNote, CourseGroup } from '../types';
import { generateCellKey, getChineseMonthLabel } from '../types';
import { CalendarCellComponent } from './CalendarCell';
import { getWeekDayNameMondayStart, calculateWeekNumbers, makeDate } from '../utils/dateUtils';

interface CalendarGridProps {
  months: MonthConfig[];
  selectedCellKeys: string[];
  editingCellKey: string | null;
  noteColor: string;
  weekNoteColor: string;
  dateFontSize: number;
  noteFontSize: number;
  tableHeight: number;
  noteColumnWidth: number;
  dateColumnWidth: number;
  weekStartNumber: number;
  courseGroups: CourseGroup[];
  onCellMouseDown: (cellKey: string, isCtrlKey: boolean, isShiftKey: boolean) => void;
  onCellMouseEnter: (cellKey: string) => void;
  onCellMouseUp: () => void;
  onCellDoubleClick: (cellKey: string) => void;
  onCellContextMenu: (cellKey: string, x: number, y: number) => void;
  onUpdateCell: (cellKey: string, updates: Partial<CalendarCell>) => void;
  onUpdateWeekNote: (year: number, month: number, weekNumber: number, note: string) => void;
  onAddWeekNote: (year: number, month: number, weekNumber: number) => void;
  showScreenshotMode?: boolean;
  courseNumberWidth: number;
  courseNumberHeight: number;
  courseNumberFontSize: number;
}

interface WeekRow {
  weekKey: string;
  weekNumber: number;
  year: number;
  month: number;
  monthLabel: string;
  cells: (CalendarCell | null)[];
  weekNote?: WeekNote;
  monthSpan?: number;
  isMonthFirstRow?: boolean;
  monthGroupKey?: string;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  months,
  selectedCellKeys,
  editingCellKey,
  noteColor,
  weekNoteColor,
  dateFontSize,
  noteFontSize,
  tableHeight,
  noteColumnWidth,
  dateColumnWidth,
  weekStartNumber,
  courseGroups,
  onCellMouseDown,
  onCellMouseEnter,
  onCellMouseUp,
  onCellDoubleClick,
  onCellContextMenu,
  onUpdateCell,
  onUpdateWeekNote,
  onAddWeekNote,
  showScreenshotMode = false,
  courseNumberWidth,
  courseNumberHeight,
  courseNumberFontSize,
}) => {
  const weekDaysMonFirst = ['一', '二', '三', '四', '五', '六', '日'];

  const weekNumbers = useMemo(() => {
    return calculateWeekNumbers(
      months.map((m) => ({ year: m.year, month: m.month, cells: m.cells })),
      weekStartNumber
    );
  }, [months, weekStartNumber]);

  const getWeekNote = (monthConfig: MonthConfig, weekNumber: number): WeekNote | undefined => {
    return monthConfig.weekNotes.find((w) => w.weekNumber === weekNumber);
  };

  const [editingWeekNote, setEditingWeekNote] = React.useState<{ year: number; month: number; weekNumber: number; value: string } | null>(null);

  const weekRows = useMemo<WeekRow[]>(() => {
    const rows: WeekRow[] = [];
    const processedWeeks = new Set<string>();

    const allCellsWithMonth: { cell: CalendarCell; year: number; month: number; monthConfig: MonthConfig }[] = [];
    for (const monthConfig of months) {
      for (const cell of monthConfig.cells) {
        allCellsWithMonth.push({ cell, year: monthConfig.year, month: monthConfig.month, monthConfig });
      }
    }

    allCellsWithMonth.sort((a, b) => {
      const dateA = makeDate(a.cell.year, a.cell.month, a.cell.dayOfMonth);
      const dateB = makeDate(b.cell.year, b.cell.month, b.cell.dayOfMonth);
      return dateA.getTime() - dateB.getTime();
    });

    for (const weekInfo of weekNumbers) {
      if (processedWeeks.has(weekInfo.weekKey)) continue;
      processedWeeks.add(weekInfo.weekKey);

      const weekCells: (CalendarCell | null)[] = [];
      let hasMonthFirst = false;
      let assignedMonth = 0;
      let assignedYear = 0;

      const weekStart = weekInfo.weekStart;

      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const currentDate = new Date(weekStart);
        currentDate.setDate(weekStart.getDate() + dayOffset);

        const matchingCell = allCellsWithMonth.find(({ cell }) => {
          const cellDate = makeDate(cell.year, cell.month, cell.dayOfMonth);
          return cellDate.getTime() === currentDate.getTime();
        });

        if (matchingCell) {
          weekCells.push(matchingCell.cell);
          if (matchingCell.cell.isMonthStart) {
            hasMonthFirst = true;
            assignedMonth = matchingCell.cell.month;
            assignedYear = matchingCell.cell.year;
          }
        } else {
          weekCells.push(null);
        }
      }

      if (!hasMonthFirst && weekCells.length > 0) {
        const firstCell = weekCells.find((c) => c !== null);
        if (firstCell) {
          assignedMonth = firstCell.month;
          assignedYear = firstCell.year;
        }
      }

      const monthLabel = getChineseMonthLabel(assignedMonth);
      const monthGroupKey = `${assignedYear}-${assignedMonth}`;

      let weekNote: WeekNote | undefined;
      for (const monthConfig of months) {
        weekNote = getWeekNote(monthConfig, weekInfo.weekNumber);
        if (weekNote) break;
      }

      rows.push({
        weekKey: weekInfo.weekKey,
        weekNumber: weekInfo.weekNumber,
        year: assignedYear,
        month: assignedMonth,
        monthLabel,
        cells: weekCells,
        weekNote,
        monthGroupKey,
      });
    }

    const rowsWithMonthSpan: WeekRow[] = [];
    let i = 0;
    while (i < rows.length) {
      const currentGroupKey = rows[i].monthGroupKey;
      let spanCount = 1;
      let j = i + 1;
      while (j < rows.length && rows[j].monthGroupKey === currentGroupKey) {
        spanCount++;
        j++;
      }
      for (let k = i; k < j; k++) {
        rowsWithMonthSpan.push({
          ...rows[k],
          monthSpan: k === i ? spanCount : 0,
          isMonthFirstRow: k === i,
        });
      }
      i = j;
    }

    return rowsWithMonthSpan;
  }, [months, weekNumbers]);

  const getMonthCellClass = (rowIdx: number, colIdx: number): string => {
    const row = weekRows[rowIdx];
    if (!row) return '';

    const cell = row.cells[colIdx];
    if (!cell) return '';

    const cellMonth = cell.month;
    const cellYear = cell.year;

    const classes: string[] = [];

    const aboveRow = weekRows[rowIdx - 1];
    const aboveCell = aboveRow?.cells[colIdx];
    if (!aboveCell || aboveCell.month !== cellMonth || aboveCell.year !== cellYear) {
      classes.push('month-group-top');
    }

    const belowRow = weekRows[rowIdx + 1];
    const belowCell = belowRow?.cells[colIdx];
    if (!belowCell || belowCell.month !== cellMonth || belowCell.year !== cellYear) {
      classes.push('month-group-bottom');
    }

    if (colIdx === 0) {
      classes.push('month-group-left');
    } else {
      const leftCell = row.cells[colIdx - 1];
      if (!leftCell || leftCell.month !== cellMonth || leftCell.year !== cellYear) {
        classes.push('month-group-left');
      }
    }

    if (colIdx === 6) {
      classes.push('month-group-right');
    } else {
      const rightCell = row.cells[colIdx + 1];
      if (!rightCell || rightCell.month !== cellMonth || rightCell.year !== cellYear) {
        classes.push('month-group-right');
      }
    }

    if (classes.includes('month-group-top') && classes.includes('month-group-left')) {
      classes.push('month-group-tl');
    }
    if (classes.includes('month-group-top') && classes.includes('month-group-right')) {
      classes.push('month-group-tr');
    }
    if (classes.includes('month-group-bottom') && classes.includes('month-group-left')) {
      classes.push('month-group-bl');
    }
    if (classes.includes('month-group-bottom') && classes.includes('month-group-right')) {
      classes.push('month-group-br');
    }

    return classes.join(' ');
  };

  return (
    <div className="calendar-grid" onMouseUp={onCellMouseUp} onMouseLeave={onCellMouseUp}>
      <div className="calendar-table" style={{ '--note-col-width': `${noteColumnWidth}px`, '--date-col-width': `${dateColumnWidth}px` } as React.CSSProperties}>
        <div className="table-header">
          <div className="month-header-cell">月份</div>
          <div className="corner-cell">周次</div>
          {weekDaysMonFirst.map((day, idx) => (
            <div key={idx} className={`weekday-cell ${day === '日' || day === '六' ? 'weekend' : ''}`}>
              {getWeekDayNameMondayStart(idx === 6 ? 0 : idx + 1)}
            </div>
          ))}
          <div className="notes-header-cell">备注</div>
        </div>

        <div className="table-body">
          {weekRows.map((row, rowIdx) => {
            const gridRow = rowIdx + 1;
            return (
              <React.Fragment key={row.weekKey}>
                {row.isMonthFirstRow && (
                  <div
                    className="month-cell month-cell-merged"
                    style={{ gridRow: `${gridRow} / span ${row.monthSpan}`, gridColumn: '1' }}
                  >
                    {row.monthLabel}
                  </div>
                )}
                <div className="week-number-cell" style={{ gridRow: `${gridRow}`, gridColumn: '2' }}>
                  {row.weekNumber}
                </div>
                {row.cells.map((cell, colIdx) => {
                  const gridCol = colIdx + 3;
                  if (!cell) {
                    return <div key={colIdx} className={`empty-cell ${getMonthCellClass(rowIdx, colIdx)}`} style={{ gridRow: `${gridRow}`, gridColumn: `${gridCol}`, minHeight: `${tableHeight}px` }} />;
                  }
                  const cellKey = generateCellKey(cell.year, cell.month, cell.dayOfMonth);
                  const monthCellClass = getMonthCellClass(rowIdx, colIdx);
                  return (
                    <CalendarCellComponent
                      key={cellKey}
                      cell={cell}
                      isSelected={selectedCellKeys.includes(cellKey)}
                      isEditing={editingCellKey === cellKey}
                      noteColor={noteColor}
                      dateFontSize={dateFontSize}
                      noteFontSize={noteFontSize}
                      courseGroups={courseGroups}
                      onMouseDown={onCellMouseDown}
                      onMouseEnter={onCellMouseEnter}
                      onDoubleClick={onCellDoubleClick}
                      onContextMenu={onCellContextMenu}
                      onUpdate={onUpdateCell}
                      extraStyle={{ gridRow: `${gridRow}`, gridColumn: `${gridCol}`, minHeight: `${tableHeight}px` }}
                      monthGroupClass={monthCellClass}
                      showScreenshotMode={showScreenshotMode}
                      courseNumberWidth={courseNumberWidth}
                      courseNumberHeight={courseNumberHeight}
                      courseNumberFontSize={courseNumberFontSize}
                    />
                  );
                })}
                <div className="week-note-cell" style={{ gridRow: `${gridRow}`, gridColumn: '10' }}>
                  {editingWeekNote && editingWeekNote.weekNumber === row.weekNumber ? (
                    <textarea
                      value={editingWeekNote.value}
                      onChange={(e) => setEditingWeekNote({ ...editingWeekNote, value: e.target.value })}
                      onBlur={() => {
                        if (editingWeekNote.value) {
                          onUpdateWeekNote(row.year, row.month, row.weekNumber, editingWeekNote.value);
                        }
                        setEditingWeekNote(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (editingWeekNote.value) {
                            onUpdateWeekNote(row.year, row.month, row.weekNumber, editingWeekNote.value);
                          }
                          setEditingWeekNote(null);
                        }
                      }}
                      autoFocus
                      placeholder="本周备注... (Enter 保存, Shift+Enter 换行)"
                      style={{ minHeight: '60px' }}
                    />
                  ) : row.weekNote ? (
                    <div
                      className="week-note-text"
                      style={{ color: weekNoteColor, fontSize: `${noteFontSize}px` }}
                      onDoubleClick={() => setEditingWeekNote({ year: row.year, month: row.month, weekNumber: row.weekNote!.weekNumber, value: row.weekNote!.note })}
                    >
                      {row.weekNote.note}
                    </div>
                  ) : showScreenshotMode ? (
                    <span className="week-note-placeholder">&nbsp;</span>
                  ) : (
                    <button
                      className="add-week-note-btn"
                      onClick={() => {
                        onAddWeekNote(row.year, row.month, row.weekNumber);
                        setEditingWeekNote({ year: row.year, month: row.month, weekNumber: row.weekNumber, value: '' });
                      }}
                    >
                      + 添加
                    </button>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
