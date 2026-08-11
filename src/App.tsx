import { useState, useEffect, useCallback, useRef } from 'react';
import type { CalendarProject, CalendarCell, MonthConfig, WeekNote } from './types';
import { generateCellKey, DEFAULT_DATE_COLUMN_WIDTH, DEFAULT_TABLE_HEIGHT, DEFAULT_NOTE_COLUMN_WIDTH, DEFAULT_NOTE_COLOR, DEFAULT_WEEK_NOTE_COLOR, DEFAULT_NOTE_FONT_SIZE, DEFAULT_DATE_FONT_SIZE, DEFAULT_TITLE_FONT_SIZE, DEFAULT_SUBTITLE_FONT_SIZE, DEFAULT_PRESET_COLORS, DEFAULT_WEEK_START_NUMBER, DEFAULT_TITLE_BG_COLOR, DEFAULT_TITLE_TEXT_COLOR, DEFAULT_COURSE_GROUPS, DEFAULT_SHOW_SCREENSHOT_MODE, DEFAULT_COURSE_NUMBER_WIDTH, DEFAULT_COURSE_NUMBER_HEIGHT, DEFAULT_COURSE_NUMBER_FONT_SIZE } from './types';
import { generateMonthCells, generateMonthsRange } from './utils/dateUtils';
import { exportToPNG, exportToPDF } from './utils/exportUtils';
import { useCellSelection } from './hooks/useCellSelection';
import { useLocalStorage } from './hooks/useLocalStorage';
import { TitleBar } from './components/TitleBar';
import { CalendarGrid } from './components/CalendarGrid';
import { FooterNotes } from './components/FooterNotes';
import { Toolbar } from './components/Toolbar';
import { ContextMenu } from './components/ContextMenu';
import './App.css';

function createDefaultProject(startYear: number, startMonth: number, startDay: number, endYear: number, endMonth: number, endDay: number): CalendarProject {
  const monthRange = generateMonthsRange(startYear, startMonth, startDay, endYear, endMonth, endDay);
  const months: MonthConfig[] = monthRange.map(({ year, month, startDay: sd, endDay: ed }) => ({
    year,
    month,
    cells: generateMonthCells(year, month, sd, ed),
    weekNotes: [],
  }));

  return {
    id: `project_${Date.now()}`,
    title: `${startYear}年秋季学期校历`,
    subtitle: `${startYear}年${startMonth}月${startDay}日 - ${endYear}年${endMonth}月${endDay}日`,
    teacherName: '张亮数理化',
    contact: '无锡海岸城',
    semesterStart: { year: startYear, month: startMonth, day: startDay },
    semesterEnd: { year: endYear, month: endMonth, day: endDay },
    months,
    courseGroups: [...DEFAULT_COURSE_GROUPS],
    activeGroupId: DEFAULT_COURSE_GROUPS[0].id,
    sideNotes: [
      '每周六周日不排课，用于学生休息',
      '国庆假期：10月1日~10月7日',
      '中小学春假：4月1日~4月3日',
      '期中考试：11月9日、11月10日',
      '期末考试周',
    ],
    footerNotes: [
      '春季学期中考班排课14次，其他年级排课15次',
      '中考期间部分学校会被用做考场，初一初二学生上课时间如需调整将另行通知，高中不受影响',
      '高考期间部分学校会被用做考场，高一高二学生上课时间如需调整将另行通知，初中不受影响',
    ],
    dateColumnWidth: DEFAULT_DATE_COLUMN_WIDTH,
    tableHeight: DEFAULT_TABLE_HEIGHT,
    noteColumnWidth: DEFAULT_NOTE_COLUMN_WIDTH,
    noteColor: DEFAULT_NOTE_COLOR,
    weekNoteColor: DEFAULT_WEEK_NOTE_COLOR,
    noteFontSize: DEFAULT_NOTE_FONT_SIZE,
    dateFontSize: DEFAULT_DATE_FONT_SIZE,
    titleFontSize: DEFAULT_TITLE_FONT_SIZE,
    subtitleFontSize: DEFAULT_SUBTITLE_FONT_SIZE,
    presetColors: DEFAULT_PRESET_COLORS.map(c => ({ ...c })),
    weekStartNumber: DEFAULT_WEEK_START_NUMBER,
    titleBgColor: DEFAULT_TITLE_BG_COLOR,
    titleTextColor: DEFAULT_TITLE_TEXT_COLOR,
    showScreenshotMode: DEFAULT_SHOW_SCREENSHOT_MODE,
    courseNumberWidth: DEFAULT_COURSE_NUMBER_WIDTH,
    courseNumberHeight: DEFAULT_COURSE_NUMBER_HEIGHT,
    courseNumberFontSize: DEFAULT_COURSE_NUMBER_FONT_SIZE,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

const STORAGE_KEY = 'school-calendar-projects';

function loadSavedProject(): CalendarProject | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const projects: CalendarProject[] = JSON.parse(stored);
      if (projects.length > 0) {
        const project = projects[projects.length - 1];
        // 兼容旧版本项目，添加缺失的属性默认值
        if (project.titleFontSize === undefined) {
          project.titleFontSize = DEFAULT_TITLE_FONT_SIZE;
        }
        if (project.subtitleFontSize === undefined) {
          project.subtitleFontSize = DEFAULT_SUBTITLE_FONT_SIZE;
        }
        if (project.presetColors === undefined) {
          project.presetColors = DEFAULT_PRESET_COLORS.map(c => ({ ...c }));
        }
        if (project.weekNoteColor === undefined) {
          project.weekNoteColor = DEFAULT_WEEK_NOTE_COLOR;
        }
        if (project.showScreenshotMode === undefined) {
          project.showScreenshotMode = DEFAULT_SHOW_SCREENSHOT_MODE;
        }
        if (project.semesterStart.day === undefined) {
          project.semesterStart.day = 1;
        }
        if (project.semesterEnd.day === undefined) {
          const daysInMonth = new Date(project.semesterEnd.year, project.semesterEnd.month, 0).getDate();
          project.semesterEnd.day = daysInMonth;
        }
        if (project.dateColumnWidth === undefined) {
          project.dateColumnWidth = DEFAULT_DATE_COLUMN_WIDTH;
        }
        if (project.courseNumberWidth === undefined) {
          project.courseNumberWidth = DEFAULT_COURSE_NUMBER_WIDTH;
        }
        if (project.courseNumberHeight === undefined) {
          project.courseNumberHeight = DEFAULT_COURSE_NUMBER_HEIGHT;
        }
        if (project.courseNumberFontSize === undefined) {
          project.courseNumberFontSize = DEFAULT_COURSE_NUMBER_FONT_SIZE;
        }
        return project;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

function App() {
  const [project, setProject] = useState<CalendarProject>(() => {
    const saved = loadSavedProject();
    return saved || createDefaultProject(2026, 9, 1, 2027, 1, 31);
  });
  const [editingCellKey, setEditingCellKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });

  const {
    selection,
    handleCellMouseDown,
    handleCellMouseEnter,
    handleMouseUp,
    clearSelection,
    selectSingle,
  } = useCellSelection();

  const calendarAreaRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const { saveProject } = useLocalStorage();

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  }, []);

  const handleProjectUpdate = useCallback((updates: Partial<CalendarProject>) => {
    setProject((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleCellUpdate = useCallback((cellKey: string, updates: Partial<CalendarCell>) => {
    setProject((prev) => {
      const [year, month, day] = cellKey.split('_').map(Number);
      return {
        ...prev,
        months: prev.months.map((m) => {
          if (m.year !== year || m.month !== month) return m;
          return {
            ...m,
            cells: m.cells.map((c) =>
              c.dayOfMonth === day ? { ...c, ...updates } : c
            ),
          };
        }),
      };
    });
  }, []);

  const handleWeekNoteUpdate = useCallback((year: number, month: number, weekNumber: number, note: string) => {
    setProject((prev) => {
      const newMonths = prev.months.map((m) => {
        if (m.year !== year || m.month !== month) return m;
        const existingNote = m.weekNotes.find((w) => w.weekNumber === weekNumber);
        let newWeekNotes: WeekNote[];
        if (existingNote) {
          newWeekNotes = m.weekNotes.map((w) =>
            w.weekNumber === weekNumber ? { ...w, note } : w
          );
        } else {
          newWeekNotes = [...m.weekNotes, { weekNumber, note }];
        }
        return { ...m, weekNotes: newWeekNotes };
      });
      return { ...prev, months: newMonths };
    });
    showToast('周备注已更新');
  }, [showToast]);

  const handleAddWeekNote = useCallback((year: number, month: number, weekNumber: number) => {
    setProject((prev) => {
      const newMonths = prev.months.map((m) => {
        if (m.year !== year || m.month !== month) return m;
        if (m.weekNotes.some((w) => w.weekNumber === weekNumber)) return m;
        return { ...m, weekNotes: [...m.weekNotes, { weekNumber, note: '' }] };
      });
      return { ...prev, months: newMonths };
    });
  }, []);

  const handleBatchColorChange = useCallback((color: string) => {
    if (selection.cellKeys.length === 0) return;
    setProject((prev) => {
      const newMonths = prev.months.map((m) => ({
        ...m,
        cells: m.cells.map((c) => {
          const key = generateCellKey(c.year, c.month, c.dayOfMonth);
          if (selection.cellKeys.includes(key)) {
            return { ...c, bgColor: color };
          }
          return c;
        }),
      }));
      return { ...prev, months: newMonths };
    });
    showToast(`已更新 ${selection.cellKeys.length} 个单元格背景色`);
  }, [selection.cellKeys, showToast]);

  const handleBatchClearColor = useCallback(() => {
    if (selection.cellKeys.length === 0) return;
    handleBatchColorChange('#ffffff');
  }, [selection.cellKeys, handleBatchColorChange]);

  const handleBatchClearNotes = useCallback(() => {
    if (selection.cellKeys.length === 0) return;
    setProject((prev) => {
      const newMonths = prev.months.map((m) => ({
        ...m,
        cells: m.cells.map((c) => {
          const key = generateCellKey(c.year, c.month, c.dayOfMonth);
          if (selection.cellKeys.includes(key)) {
            return { ...c, note: '' };
          }
          return c;
        }),
      }));
      return { ...prev, months: newMonths };
    });
    showToast(`已清除 ${selection.cellKeys.length} 个单元格备注`);
  }, [selection.cellKeys, showToast]);

  const handleBatchClearCourseNumbers = useCallback(() => {
    if (selection.cellKeys.length === 0) return;
    setProject((prev) => {
      const newCourseGroups = prev.courseGroups.map((g) => {
        const remainingDates = g.courseDates.filter((date) => {
          const key = `${date.year}_${date.month}_${date.day}`;
          return !selection.cellKeys.includes(key);
        });
        const sortedDates = [...remainingDates].sort((a, b) =>
          a.year - b.year || a.month - b.month || a.day - b.day
        );
        return { ...g, courseDates: sortedDates };
      });

      const groupNumberMaps = new Map<string, Map<string, number>>();
      newCourseGroups.forEach((g) => {
        const dateMap = new Map<string, number>();
        g.courseDates.forEach((date, idx) => {
          const key = `${date.year}_${date.month}_${date.day}`;
          dateMap.set(key, idx + 1);
        });
        groupNumberMaps.set(g.id, dateMap);
      });

      const newMonths = prev.months.map((m) => ({
        ...m,
        cells: m.cells.map((c) => {
          const key = generateCellKey(c.year, c.month, c.dayOfMonth);
          if (selection.cellKeys.includes(key)) {
            return { ...c, courseNumbers: [], isCourseDay: false, bgColor: '#ffffff' };
          } else {
            const existingNumbers = c.courseNumbers || [];
            let needUpdate = false;
            const updatedNumbers = existingNumbers.map((n) => {
              const dateMap = groupNumberMaps.get(n.groupId);
              if (dateMap) {
                const newNum = dateMap.get(key);
                if (newNum && newNum !== n.number) {
                  needUpdate = true;
                  return { ...n, number: newNum };
                }
              }
              return n;
            });
            if (needUpdate) {
              return { ...c, courseNumbers: updatedNumbers };
            }
            return c;
          }
        }),
      }));

      return { ...prev, months: newMonths, courseGroups: newCourseGroups };
    });
    showToast(`已清除 ${selection.cellKeys.length} 个课程编号`);
  }, [selection.cellKeys, showToast]);

  const handleCellContextMenu = useCallback((cellKey: string, x: number, y: number) => {
    if (!selection.cellKeys.includes(cellKey)) {
      selectSingle(cellKey);
    }
    setContextMenu({ x, y, visible: true });
  }, [selection.cellKeys, selectSingle]);

  const handleContextMenuClose = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
  }, []);

  const handleAddToCourse = useCallback((groupId: string) => {
    if (selection.cellKeys.length === 0) return;

    setProject((prev) => {
      const activeGroup = prev.courseGroups.find((g) => g.id === groupId);
      if (!activeGroup) return prev;

      const newCourseGroups = prev.courseGroups.map((g) => {
        if (g.id !== groupId) return g;
        const newDates = selection.cellKeys.map((key) => {
          const parts = key.split('_').map(Number);
          return { year: parts[0], month: parts[1], day: parts[2] };
        });
        const allDates = [...g.courseDates, ...newDates];
        const sortedDates = [...allDates].sort((a, b) => 
          a.year - b.year || a.month - b.month || a.day - b.day
        );
        return { ...g, courseDates: sortedDates };
      });

      const groupAfterUpdate = newCourseGroups.find((g) => g.id === groupId);
      const allSortedDates = groupAfterUpdate?.courseDates || [];

      const dateToNumberMap = new Map<string, number>();
      allSortedDates.forEach((date, idx) => {
        const key = `${date.year}_${date.month}_${date.day}`;
        dateToNumberMap.set(key, idx + 1);
      });

      const newMonths = prev.months.map((m) => ({
        ...m,
        cells: m.cells.map((c) => {
          const key = generateCellKey(c.year, c.month, c.dayOfMonth);
          const existingNumbers = c.courseNumbers || [];
          const otherGroupNumbers = existingNumbers.filter((n) => n.groupId !== groupId);
          
          if (selection.cellKeys.includes(key)) {
            const courseNumber = dateToNumberMap.get(key);
            const newNumbers = courseNumber 
              ? [...otherGroupNumbers, { groupId, number: courseNumber }]
              : otherGroupNumbers;
            return {
              ...c,
              courseNumbers: newNumbers,
              isCourseDay: true,
              bgColor: activeGroup.color + '20',
            };
          } else {
            const groupNumber = existingNumbers.find((n) => n.groupId === groupId);
            if (groupNumber) {
              const newNumber = dateToNumberMap.get(key);
              if (newNumber && newNumber !== groupNumber.number) {
                const newNumbers = [...otherGroupNumbers, { groupId, number: newNumber }];
                return { ...c, courseNumbers: newNumbers };
              }
            }
            return c;
          }
        }),
      }));

      return { ...prev, months: newMonths, courseGroups: newCourseGroups };
    });

    const groupName = project.courseGroups.find((g) => g.id === groupId)?.name || '';
    showToast(`已添加 ${selection.cellKeys.length} 个单元格到${groupName}`);
  }, [selection.cellKeys, project.courseGroups, showToast]);

  const handleRemoveCourse = useCallback(() => {
    if (selection.cellKeys.length === 0) return;
    handleBatchClearCourseNumbers();
  }, [selection.cellKeys, handleBatchClearCourseNumbers]);

  const handleToggleMonthStart = useCallback(() => {
    if (selection.cellKeys.length === 0) return;
    setProject((prev) => {
      const newMonths = prev.months.map((m) => ({
        ...m,
        cells: m.cells.map((c) => {
          const key = generateCellKey(c.year, c.month, c.dayOfMonth);
          if (selection.cellKeys.includes(key)) {
            return { ...c, isMonthStart: !c.isMonthStart };
          }
          return c;
        }),
      }));
      return { ...prev, months: newMonths };
    });
    showToast(`已切换 ${selection.cellKeys.length} 个单元格的月首标记`);
  }, [selection.cellKeys, showToast]);

  const handleCourseGroupColorChange = useCallback((groupId: string, color: string) => {
    setProject((prev) => {
      const newCourseGroups = prev.courseGroups.map((g) => {
        if (g.id !== groupId) return g;
        return { ...g, color };
      });

      const newMonths = prev.months.map((m) => ({
        ...m,
        cells: m.cells.map((c) => {
          const hasGroup = c.courseNumbers?.some((n) => n.groupId === groupId);
          if (hasGroup) {
            const activeGroup = newCourseGroups.find((g) => g.id === groupId);
            return { ...c, bgColor: (activeGroup?.color || '#ffffff') + '20' };
          }
          return c;
        }),
      }));

      return { ...prev, courseGroups: newCourseGroups, months: newMonths };
    });
  }, []);

  const totalCourseDays = project.months.reduce((total, m) => {
    return total + m.cells.filter((c) => c.isCourseDay).length;
  }, 0);

  const handleDateRangeChange = useCallback((startYear: number, startMonth: number, startDay: number, endYear: number, endMonth: number, endDay: number) => {
    if (!confirm('修改学期范围将清空表格中的所有排课、备注、背景色等数据，确认继续？')) return;

    const newProject = createDefaultProject(startYear, startMonth, startDay, endYear, endMonth, endDay);
    setProject({
      ...newProject,
      title: `${startYear}年秋季学期校历`,
      sideNotes: project.sideNotes,
      footerNotes: project.footerNotes,
      teacherName: project.teacherName,
      contact: project.contact,
      dateColumnWidth: project.dateColumnWidth,
      tableHeight: project.tableHeight,
      noteColor: project.noteColor,
      weekNoteColor: project.weekNoteColor,
      noteFontSize: project.noteFontSize,
      dateFontSize: project.dateFontSize,
      titleFontSize: project.titleFontSize,
      subtitleFontSize: project.subtitleFontSize,
      presetColors: project.presetColors,
      weekStartNumber: project.weekStartNumber,
      titleBgColor: project.titleBgColor,
      titleTextColor: project.titleTextColor,
      courseGroups: project.courseGroups,
      courseNumberWidth: project.courseNumberWidth,
      courseNumberHeight: project.courseNumberHeight,
      courseNumberFontSize: project.courseNumberFontSize,
    });
    clearSelection();
    showToast('学期范围已更新');
  }, [project.sideNotes, project.footerNotes, project.teacherName, project.contact, project.dateColumnWidth, project.tableHeight, project.noteColor, project.weekNoteColor, project.noteFontSize, project.dateFontSize, project.titleFontSize, project.subtitleFontSize, project.weekStartNumber, project.titleBgColor, project.titleTextColor, project.courseGroups, project.courseNumberWidth, project.courseNumberHeight, project.courseNumberFontSize, clearSelection, showToast]);

  const handleSave = useCallback(() => {
    saveProject(project);
    showToast('项目已保存');
  }, [project, saveProject, showToast]);

  const handleExportConfig = useCallback(() => {
    const configToExport = {
      ...project,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };
    const jsonStr = JSON.stringify(configToExport, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `校历配置_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('配置导出成功');
  }, [project, showToast]);

  const handleImportConfig = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedConfig = JSON.parse(e.target?.result as string);
        if (importedConfig && importedConfig.title && importedConfig.months) {
          if (importedConfig.semesterStart.day === undefined) {
            importedConfig.semesterStart.day = 1;
          }
          if (importedConfig.semesterEnd.day === undefined) {
            const daysInMonth = new Date(importedConfig.semesterEnd.year, importedConfig.semesterEnd.month, 0).getDate();
            importedConfig.semesterEnd.day = daysInMonth;
          }
          if (importedConfig.showScreenshotMode === undefined) {
            importedConfig.showScreenshotMode = DEFAULT_SHOW_SCREENSHOT_MODE;
          }
          if (importedConfig.dateColumnWidth === undefined) {
            importedConfig.dateColumnWidth = DEFAULT_DATE_COLUMN_WIDTH;
          }
          if (importedConfig.courseNumberWidth === undefined) {
            importedConfig.courseNumberWidth = DEFAULT_COURSE_NUMBER_WIDTH;
          }
          if (importedConfig.courseNumberHeight === undefined) {
            importedConfig.courseNumberHeight = DEFAULT_COURSE_NUMBER_HEIGHT;
          }
          if (importedConfig.courseNumberFontSize === undefined) {
            importedConfig.courseNumberFontSize = DEFAULT_COURSE_NUMBER_FONT_SIZE;
          }
          setProject(importedConfig);
          clearSelection();
          showToast('配置导入成功');
        } else {
          showToast('配置文件格式不正确');
        }
      } catch {
        showToast('导入失败，请检查文件格式');
      }
    };
    reader.readAsText(file);
  }, [clearSelection, showToast]);

  const handleNewProject = useCallback(() => {
    if (confirm('创建新项目将清除当前编辑内容，确定继续？')) {
      setProject(createDefaultProject(2026, 9, 1, 2027, 1, 31));
      clearSelection();
      showToast('已创建新项目');
    }
  }, [clearSelection, showToast]);

  const handleExportPNG = useCallback(async () => {
    setIsLoading(true);
    const originalScreenshotMode = project.showScreenshotMode;
    setProject(prev => ({ ...prev, showScreenshotMode: true }));
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      await exportToPNG('calendar-content', `${project.title}.png`);
      showToast('图片导出成功');
    } catch (error) {
      showToast('导出失败，请重试');
    } finally {
      setProject(prev => ({ ...prev, showScreenshotMode: originalScreenshotMode }));
      setIsLoading(false);
    }
  }, [project.title, project.showScreenshotMode, showToast]);

  const handleExportPDF = useCallback(async () => {
    setIsLoading(true);
    const originalScreenshotMode = project.showScreenshotMode;
    setProject(prev => ({ ...prev, showScreenshotMode: true }));
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      await exportToPDF('calendar-content', `${project.title}.pdf`);
    } catch (error) {
      showToast('导出失败，请重试');
    } finally {
      setProject(prev => ({ ...prev, showScreenshotMode: originalScreenshotMode }));
      setIsLoading(false);
    }
  }, [project.title, project.showScreenshotMode, showToast]);

  const handleDateColumnWidthChange = useCallback((width: number) => {
    setProject((prev) => ({ ...prev, dateColumnWidth: width }));
  }, []);

  const handleTableHeightChange = useCallback((height: number) => {
    setProject((prev) => ({ ...prev, tableHeight: height }));
  }, []);

  const handleNoteColumnWidthChange = useCallback((width: number) => {
    setProject((prev) => ({ ...prev, noteColumnWidth: width }));
  }, []);

  const handleNoteColorChange = useCallback((color: string) => {
    setProject((prev) => ({ ...prev, noteColor: color }));
  }, []);

  const handleWeekNoteColorChange = useCallback((color: string) => {
    setProject((prev) => ({ ...prev, weekNoteColor: color }));
  }, []);

  const handleDateFontSizeChange = useCallback((size: number) => {
    setProject((prev) => ({ ...prev, dateFontSize: size }));
  }, []);

  const handleNoteFontSizeChange = useCallback((size: number) => {
    setProject((prev) => ({ ...prev, noteFontSize: size }));
  }, []);

  const handleTitleFontSizeChange = useCallback((size: number) => {
    setProject((prev) => ({ ...prev, titleFontSize: size }));
  }, []);

  const handleSubtitleFontSizeChange = useCallback((size: number) => {
    setProject((prev) => ({ ...prev, subtitleFontSize: size }));
  }, []);

  const handlePresetColorChange = useCallback((name: string, color: string) => {
    setProject((prev) => ({
      ...prev,
      presetColors: prev.presetColors.map((c) =>
        c.name === name ? { ...c, colors: [color] } : c
      ),
    }));
  }, []);

  const handleWeekStartNumberChange = useCallback((num: number) => {
    setProject((prev) => ({ ...prev, weekStartNumber: num }));
  }, []);

  const handleTitleBgColorChange = useCallback((color: string) => {
    setProject((prev) => ({ ...prev, titleBgColor: color }));
  }, []);

  const handleTitleTextColorChange = useCallback((color: string) => {
    setProject((prev) => ({ ...prev, titleTextColor: color }));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearSelection();
        setEditingCellKey(null);
        setContextMenu((prev) => ({ ...prev, visible: false }));
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearSelection, handleSave]);

  useEffect(() => {
    saveProject(project);
  }, [project, saveProject]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInCalendar = calendarAreaRef.current?.contains(target);
      const isInToolbar = toolbarRef.current?.contains(target);
      const isInFooter = footerRef.current?.contains(target);
      const isInContextMenu = contextMenuRef.current?.contains(target);
      if (!isInCalendar && !isInToolbar && !isInFooter && !isInContextMenu) {
        if (selection.cellKeys.length > 0) {
          clearSelection();
          setEditingCellKey(null);
          setContextMenu((prev) => ({ ...prev, visible: false }));
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [clearSelection, selection.cellKeys.length]);

  return (
    <div className="app-container">
      <div ref={toolbarRef}>
        <Toolbar
        selectedCount={selection.cellKeys.length}
        onBatchColorChange={handleBatchColorChange}
        onBatchClearColor={handleBatchClearColor}
        onBatchClearNotes={handleBatchClearNotes}
        onBatchClearCourseNumbers={handleBatchClearCourseNumbers}
        onExportPNG={handleExportPNG}
        onExportPDF={handleExportPDF}
        onSave={handleSave}
        onExportConfig={handleExportConfig}
        onImportConfig={handleImportConfig}
        onNewProject={handleNewProject}
        startYear={project.semesterStart.year}
        startMonth={project.semesterStart.month}
        startDay={project.semesterStart.day}
        endYear={project.semesterEnd.year}
        endMonth={project.semesterEnd.month}
        endDay={project.semesterEnd.day}
        onDateRangeChange={handleDateRangeChange}
        totalCourseDays={totalCourseDays}
        dateColumnWidth={project.dateColumnWidth}
        onDateColumnWidthChange={handleDateColumnWidthChange}
        tableHeight={project.tableHeight}
        onTableHeightChange={handleTableHeightChange}
        noteColumnWidth={project.noteColumnWidth}
        onNoteColumnWidthChange={handleNoteColumnWidthChange}
        noteColor={project.noteColor}
        onNoteColorChange={handleNoteColorChange}
        weekNoteColor={project.weekNoteColor}
        onWeekNoteColorChange={handleWeekNoteColorChange}
        dateFontSize={project.dateFontSize}
        onDateFontSizeChange={handleDateFontSizeChange}
        noteFontSize={project.noteFontSize}
        onNoteFontSizeChange={handleNoteFontSizeChange}
        titleFontSize={project.titleFontSize}
        onTitleFontSizeChange={handleTitleFontSizeChange}
        subtitleFontSize={project.subtitleFontSize}
        onSubtitleFontSizeChange={handleSubtitleFontSizeChange}
        weekStartNumber={project.weekStartNumber}
        onWeekStartNumberChange={handleWeekStartNumberChange}
        titleBgColor={project.titleBgColor}
        onTitleBgColorChange={handleTitleBgColorChange}
        titleTextColor={project.titleTextColor}
        onTitleTextColorChange={handleTitleTextColorChange}
        courseGroups={project.courseGroups}
        onCourseGroupColorChange={handleCourseGroupColorChange}
        presetColors={project.presetColors}
        onPresetColorChange={handlePresetColorChange}
        showScreenshotMode={project.showScreenshotMode}
        onToggleScreenshotMode={() => handleProjectUpdate({ showScreenshotMode: !project.showScreenshotMode })}
        courseNumberWidth={project.courseNumberWidth}
        onCourseNumberWidthChange={(w) => setProject(prev => ({ ...prev, courseNumberWidth: w }))}
        courseNumberHeight={project.courseNumberHeight}
        onCourseNumberHeightChange={(h) => setProject(prev => ({ ...prev, courseNumberHeight: h }))}
        courseNumberFontSize={project.courseNumberFontSize}
        onCourseNumberFontSizeChange={(f) => setProject(prev => ({ ...prev, courseNumberFontSize: f }))}
      />
      </div>

      <div id="calendar-content" className="calendar-content">
        <div className="calendar-main">
          <div ref={calendarAreaRef} className="calendar-area-wrapper" style={{ margin: '0 auto' }}>
            <TitleBar project={project} onUpdate={handleProjectUpdate} />
            <CalendarGrid
              months={project.months}
              selectedCellKeys={selection.cellKeys}
              editingCellKey={editingCellKey}
              noteColor={project.noteColor}
              weekNoteColor={project.weekNoteColor}
              dateFontSize={project.dateFontSize}
              noteFontSize={project.noteFontSize}
              tableHeight={project.tableHeight}
              noteColumnWidth={project.noteColumnWidth}
              dateColumnWidth={project.dateColumnWidth}
              weekStartNumber={project.weekStartNumber}
              courseGroups={project.courseGroups}
              onCellMouseDown={handleCellMouseDown}
              onCellMouseEnter={handleCellMouseEnter}
              onCellMouseUp={handleMouseUp}
              onCellDoubleClick={(key) => setEditingCellKey(key)}
              onCellContextMenu={handleCellContextMenu}
              onUpdateCell={handleCellUpdate}
              onUpdateWeekNote={handleWeekNoteUpdate}
              onAddWeekNote={handleAddWeekNote}
              showScreenshotMode={project.showScreenshotMode}
              courseNumberWidth={project.courseNumberWidth}
              courseNumberHeight={project.courseNumberHeight}
              courseNumberFontSize={project.courseNumberFontSize}
            />
          </div>
        </div>

        <div ref={footerRef}>
          <FooterNotes
            project={project}
            onUpdateNotes={(notes) => handleProjectUpdate({ footerNotes: notes })}
            showScreenshotMode={project.showScreenshotMode}
          />
        </div>
      </div>

      {contextMenu.visible && (
        <div ref={contextMenuRef}>
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            selectedCount={selection.cellKeys.length}
            courseGroups={project.courseGroups}
            onAddToCourse={handleAddToCourse}
            onRemoveCourse={handleRemoveCourse}
            onToggleMonthStart={handleToggleMonthStart}
            onClose={handleContextMenuClose}
          />
        </div>
      )}

      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner">导出中...</div>
        </div>
      )}

      {toast && <div className="toast-message">{toast}</div>}

      <div className="keyboard-hints">
        <span>💡 快捷键：</span>
        <span>点击选中 | 拖拽多选 | Ctrl+点击多选 | Shift+点击范围选择 | 右键菜单排课 | Esc 取消选择 | Ctrl+S 保存</span>
      </div>
    </div>
  );
}

export default App;
