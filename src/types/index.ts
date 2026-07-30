export interface CourseGroup {
  id: string;
  name: string;
  color: string;
  courseDates: { year: number; month: number; day: number }[];
}

export interface CalendarCell {
  date: string;
  dayOfMonth: number;
  month: number;
  year: number;
  weekDay: number;
  bgColor: string;
  note: string;
  courseNumbers: { groupId: string; number: number }[];
  isCourseDay: boolean;
  isMonthStart?: boolean;
}

export interface WeekNote {
  weekNumber: number;
  note: string;
}

export interface MonthConfig {
  year: number;
  month: number;
  cells: CalendarCell[];
  weekNotes: WeekNote[];
}

export interface CalendarProject {
  id: string;
  title: string;
  subtitle: string;
  teacherName: string;
  contact: string;
  semesterStart: { year: number; month: number; day: number };
  semesterEnd: { year: number; month: number; day: number };
  months: MonthConfig[];
  courseGroups: CourseGroup[];
  activeGroupId: string;
  sideNotes: string[];
  footerNotes: string[];
  dateColumnWidth: number;
  tableHeight: number;
  noteColumnWidth: number;
  noteColor: string;
  weekNoteColor: string;
  noteFontSize: number;
  dateFontSize: number;
  titleFontSize: number;
  subtitleFontSize: number;
  weekStartNumber: number;
  titleBgColor: string;
  titleTextColor: string;
  presetColors: ColorScheme[];
  showScreenshotMode: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ColorScheme {
  name: string;
  colors: string[];
}

export type CellSelectionMode = 'single' | 'multiple' | 'drag';

export interface SelectedCells {
  cellKeys: string[];
  anchorKey: string | null;
}

export const CELL_KEY_SEPARATOR = '_';

export function generateCellKey(year: number, month: number, day: number): string {
  return `${year}${CELL_KEY_SEPARATOR}${month}${CELL_KEY_SEPARATOR}${day}`;
}

export function parseCellKey(key: string): { year: number; month: number; day: number } {
  const parts = key.split(CELL_KEY_SEPARATOR);
  return {
    year: parseInt(parts[0], 10),
    month: parseInt(parts[1], 10),
    day: parseInt(parts[2], 10),
  };
}

export const DEFAULT_PRESET_COLORS: ColorScheme[] = [
  { name: '工作日', colors: ['#ffffff'] },
  { name: '周末', colors: ['#e8e8e8'] },
  { name: '节假日', colors: ['#ffe4e6'] },
  { name: '特殊', colors: ['#db91fd'] },
  { name: '考试', colors: ['#f2d354'] },
  { name: '放假', colors: ['#96f5a8'] },
];

export const PRESET_COLORS: ColorScheme[] = [
  { name: '工作日', colors: ['#ffffff'] },
  { name: '周末', colors: ['#e8e8e8'] }, /* 周末表格背景色 */
  { name: '节假日', colors: ['#ffe4e6'] },
  { name: '特殊', colors: ['#db91fd'] },
  { name: '考试', colors: ['#f2d354'] },
  { name: '放假', colors: ['#96f5a8'] },
];

export const PRESET_NOTE_COLORS: ColorScheme[] = [
  { name: '红色', colors: ['#dc2626'] },
  { name: '蓝色', colors: ['#2563eb'] },
  { name: '绿色', colors: ['#16a34a'] },
  { name: '橙色', colors: ['#ea580c'] },
  { name: '紫色', colors: ['#9333ea'] },
  { name: '黑色', colors: ['#000000'] },
];

export const DEFAULT_DATE_COLUMN_WIDTH = 110;/*日期列默认宽度,日期列宽*/
export const DEFAULT_TABLE_HEIGHT = 70;/*表格高度*/
export const DEFAULT_NOTE_COLUMN_WIDTH = 250;/*备注列宽*/
export const DEFAULT_NOTE_COLOR = '#dc2626';
export const DEFAULT_WEEK_NOTE_COLOR = '#000000';
export const DEFAULT_NOTE_FONT_SIZE = 16;
export const DEFAULT_DATE_FONT_SIZE = 26;/*日期字号*/
export const DEFAULT_TITLE_FONT_SIZE = 48;
export const DEFAULT_SUBTITLE_FONT_SIZE = 20;
export const DEFAULT_WEEK_START_NUMBER = 1;
export const DEFAULT_SHOW_SCREENSHOT_MODE = false;
export const DEFAULT_TITLE_BG_COLOR = '#ffffff';
export const DEFAULT_TITLE_TEXT_COLOR = '#000000';
export const DEFAULT_COURSE_GROUPS: CourseGroup[] = [
  { id: 'fri', name: '周五班', color: '#10b981', courseDates: [] },
  { id: 'sat', name: '周六班', color: '#3b82f6', courseDates: [] },
  { id: 'sun', name: '周日班', color: '#f59e0b', courseDates: [] },
];
export const DEFAULT_FRI_GROUP = DEFAULT_COURSE_GROUPS[0];
export const DEFAULT_SAT_GROUP = DEFAULT_COURSE_GROUPS[1];
export const DEFAULT_SUN_GROUP = DEFAULT_COURSE_GROUPS[2];

export const CHINESE_MONTHS = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
export const SIMPLE_CHINESE_MONTHS = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

export function getChineseMonthLabel(month: number): string {
  return SIMPLE_CHINESE_MONTHS[month - 1] || `${month}月`;
}
