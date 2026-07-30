import type { CalendarCell } from '../types';

export function makeDate(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function getWeekStartOffset(year: number, month: number, firstDayOfWeek: number = 1): number {
  const date = makeDate(year, month, 1);
  const dayOfWeek = date.getDay();
  return (dayOfWeek - firstDayOfWeek + 7) % 7;
}

export function getWeekDayName(day: number): string {
  const names = ['日', '一', '二', '三', '四', '五', '六'];
  return names[day];
}

export function getWeekDayNameMondayStart(day: number): string {
  const names = ['一', '二', '三', '四', '五', '六', '日'];
  const mondayStartDay = day === 0 ? 6 : day - 1;
  return names[mondayStartDay];
}

export function getMonthName(month: number): string {
  const names = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
  return names[month - 1];
}

export function isWeekend(dayOfWeek: number): boolean {
  return dayOfWeek === 0 || dayOfWeek === 6;
}

export function isSunday(dayOfWeek: number): boolean {
  return dayOfWeek === 0;
}

export function isSaturday(dayOfWeek: number): boolean {
  return dayOfWeek === 6;
}

export function generateMonthCells(year: number, month: number, startDay?: number, endDay?: number): CalendarCell[] {
  const daysInMonth = getDaysInMonth(year, month);
  const cells: CalendarCell[] = [];
  const firstDay = startDay ?? 1;
  const lastDay = endDay ?? daysInMonth;

  for (let day = firstDay; day <= lastDay; day++) {
    const date = makeDate(year, month, day);
    const dayOfWeek = date.getDay();
    cells.push({
      date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      dayOfMonth: day,
      month,
      year,
      weekDay: dayOfWeek,
      bgColor: isWeekend(dayOfWeek) ? '#e8e8e8' : '#ffffff',
      note: '',
      courseNumbers: [],
      isCourseDay: false,
      isMonthStart: day === firstDay,
    });
  }

  return cells;
}

export function generateMonthsRange(startYear: number, startMonth: number, startDay: number, endYear: number, endMonth: number, endDay: number): { year: number; month: number; startDay?: number; endDay?: number }[] {
  const months: { year: number; month: number; startDay?: number; endDay?: number }[] = [];
  let year = startYear;
  let month = startMonth;
  let isFirst = true;

  while (year < endYear || (year === endYear && month <= endMonth)) {
    const entry: { year: number; month: number; startDay?: number; endDay?: number } = { year, month };
    if (isFirst) {
      entry.startDay = startDay;
      isFirst = false;
    }
    if (year === endYear && month === endMonth) {
      entry.endDay = endDay;
    }
    months.push(entry);
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }

  return months;
}

export function parseDateInput(dateStr: string): { year: number; month: number; day: number } | null {
  const patterns = [
    /(\d{4})[年/\-](\d{1,2})[月/\-](\d{1,2})[日号]?/,
    /(\d{1,2})[月/](\d{1,2})[日号]?/,
  ];

  for (const pattern of patterns) {
    const match = dateStr.match(pattern);
    if (match) {
      if (match.length === 4) {
        return { year: parseInt(match[1], 10), month: parseInt(match[2], 10), day: parseInt(match[3], 10) };
      } else if (match.length === 3) {
        return { year: new Date().getFullYear(), month: parseInt(match[1], 10), day: parseInt(match[2], 10) };
      }
    }
  }

  return null;
}

export function formatCourseNumber(num: number): string {
  return String(num);
}

export function calculateWeekNumbers(
  months: { year: number; month: number; cells: CalendarCell[] }[],
  startWeekNumber: number = 1
): { year: number; month: number; weekNumber: number; weekKey: string; weekStart: Date; weekEnd: Date }[] {
  if (months.length === 0) return [];

  const weekInfoList: { year: number; month: number; weekNumber: number; weekKey: string; weekStart: Date; weekEnd: Date }[] = [];
  let currentWeekNumber = startWeekNumber;
  const seenWeeks = new Set<string>();

  for (const monthData of months) {
    const cells = monthData.cells;
    if (cells.length === 0) continue;

    // 获取该月第一天
    const firstCell = cells[0];
    const firstDate = makeDate(firstCell.year, firstCell.month, firstCell.dayOfMonth);
    
    // 获取该月最后一天
    const lastCell = cells[cells.length - 1];
    const lastDate = makeDate(lastCell.year, lastCell.month, lastCell.dayOfMonth);

    // 计算该月所有日期所在的周
    const allWeeksInMonth: { start: Date; end: Date; weekKey: string; year: number; month: number }[] = [];
    
    // 从第一天开始，找到该周的周一
    let currentDate = new Date(firstDate);
    const firstDayOfWeek = currentDate.getDay(); // 0=Sunday, 1=Monday, ...
    const daysSinceMonday = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    // 该周的周一
    const firstMonday = new Date(currentDate);
    firstMonday.setDate(currentDate.getDate() - daysSinceMonday);
    firstMonday.setHours(0, 0, 0, 0);

    // 遍历所有周
    let weekStart = new Date(firstMonday);
    while (weekStart <= lastDate) {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // 周日
      weekEnd.setHours(23, 59, 59, 999);

      // 检查这周是否包含当前月的日期
      const hasCurrentMonthDate = cells.some(cell => {
        const cellDate = makeDate(cell.year, cell.month, cell.dayOfMonth);
        return cellDate >= weekStart && cellDate <= weekEnd;
      });

      if (hasCurrentMonthDate) {
        const weekKey = `${weekStart.getFullYear()}-${weekStart.getMonth()}-${weekStart.getDate()}`;
        allWeeksInMonth.push({
          start: weekStart,
          end: weekEnd,
          weekKey,
          year: monthData.year,
          month: monthData.month,
        });
      }

      // 移动到下一周
      const nextWeek = new Date(weekStart);
      nextWeek.setDate(weekStart.getDate() + 7);
      weekStart = nextWeek;
    }

    // 为这些周分配编号（如果还没有的话）
    for (const week of allWeeksInMonth) {
      if (!seenWeeks.has(week.weekKey)) {
        seenWeeks.add(week.weekKey);
        weekInfoList.push({
          year: week.year,
          month: week.month,
          weekNumber: currentWeekNumber,
          weekKey: week.weekKey,
          weekStart: week.start,
          weekEnd: week.end,
        });
        currentWeekNumber++;
      }
    }
  }

  return weekInfoList;
}

export function getWeekNumberForCell(
  year: number,
  month: number,
  day: number,
  allWeekInfo: { year: number; month: number; weekNumber: number; weekKey: string; weekStart: Date; weekEnd: Date }[]
): number | null {
  const cellDate = makeDate(year, month, day);
  
  for (const info of allWeekInfo) {
    if (cellDate >= info.weekStart && cellDate <= info.weekEnd) {
      return info.weekNumber;
    }
  }

  return null;
}

export function getWeekKeyForCell(
  year: number,
  month: number,
  day: number,
  allWeekInfo: { year: number; month: number; weekNumber: number; weekKey: string; weekStart: Date; weekEnd: Date }[]
): string | null {
  const cellDate = makeDate(year, month, day);
  
  for (const info of allWeekInfo) {
    if (cellDate >= info.weekStart && cellDate <= info.weekEnd) {
      return info.weekKey;
    }
  }

  return null;
}

export function getISOWeek(year: number, month: number, day: number): number {
  const date = makeDate(year, month, day);
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}
