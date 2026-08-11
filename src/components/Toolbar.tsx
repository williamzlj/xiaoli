import React, { useState } from 'react';
import type { CourseGroup, ColorScheme } from '../types';
import { PRESET_NOTE_COLORS, DEFAULT_DATE_COLUMN_WIDTH, DEFAULT_TABLE_HEIGHT, DEFAULT_NOTE_COLUMN_WIDTH, DEFAULT_COURSE_NUMBER_WIDTH, DEFAULT_COURSE_NUMBER_HEIGHT, DEFAULT_COURSE_NUMBER_FONT_SIZE } from '../types';

interface ToolbarProps {
  selectedCount: number;
  onBatchColorChange: (color: string) => void;
  onBatchClearColor: () => void;
  onBatchClearNotes: () => void;
  onBatchClearCourseNumbers: () => void;
  onExportPNG: () => void;
  onExportPDF: () => void;
  onSave: () => void;
  onExportConfig: () => void;
  onImportConfig: (file: File) => void;
  onNewProject: () => void;
  startYear: number;
  startMonth: number;
  startDay: number;
  endYear: number;
  endMonth: number;
  endDay: number;
  onDateRangeChange: (startYear: number, startMonth: number, startDay: number, endYear: number, endMonth: number, endDay: number) => void;
  totalCourseDays: number;
  dateColumnWidth: number;
  onDateColumnWidthChange: (width: number) => void;
  tableHeight: number;
  onTableHeightChange: (height: number) => void;
  noteColumnWidth: number;
  onNoteColumnWidthChange: (width: number) => void;
  noteColor: string;
  onNoteColorChange: (color: string) => void;
  weekNoteColor: string;
  onWeekNoteColorChange: (color: string) => void;
  dateFontSize: number;
  onDateFontSizeChange: (size: number) => void;
  noteFontSize: number;
  onNoteFontSizeChange: (size: number) => void;
  titleFontSize: number;
  onTitleFontSizeChange: (size: number) => void;
  subtitleFontSize: number;
  onSubtitleFontSizeChange: (size: number) => void;
  weekStartNumber: number;
  onWeekStartNumberChange: (num: number) => void;
  titleBgColor: string;
  onTitleBgColorChange: (color: string) => void;
  titleTextColor: string;
  onTitleTextColorChange: (color: string) => void;
  courseGroups: CourseGroup[];
  onCourseGroupColorChange: (groupId: string, color: string) => void;
  presetColors: ColorScheme[];
  onPresetColorChange: (name: string, color: string) => void;
  showScreenshotMode: boolean;
  onToggleScreenshotMode: () => void;
  courseNumberWidth: number;
  onCourseNumberWidthChange: (w: number) => void;
  courseNumberHeight: number;
  onCourseNumberHeightChange: (h: number) => void;
  courseNumberFontSize: number;
  onCourseNumberFontSizeChange: (f: number) => void;
}

type MenuKey = 'file' | 'semester' | 'course' | 'table' | 'title' | 'batch';

const menuItems: { key: MenuKey; label: string; icon: string }[] = [
  { key: 'file', label: '文件', icon: '📁' },
  { key: 'semester', label: '学期设置', icon: '📅' },
  { key: 'course', label: '排课设置', icon: '📚' },
  { key: 'table', label: '表格设置', icon: '📐' },
  { key: 'title', label: '标题设置', icon: '🎨' },
  { key: 'batch', label: '批量操作', icon: '📝' },
];

export const Toolbar: React.FC<ToolbarProps> = ({
  selectedCount,
  onBatchColorChange,
  onBatchClearColor,
  onBatchClearNotes,
  onBatchClearCourseNumbers,
  onExportPNG,
  onExportPDF,
  onSave,
  onExportConfig,
  onImportConfig,
  onNewProject,
  startYear,
  startMonth,
  startDay,
  endYear,
  endMonth,
  endDay,
  onDateRangeChange,
  totalCourseDays,
  dateColumnWidth,
  onDateColumnWidthChange,
  tableHeight,
  onTableHeightChange,
  noteColumnWidth,
  onNoteColumnWidthChange,
  noteColor,
  onNoteColorChange,
  weekNoteColor,
  onWeekNoteColorChange,
  dateFontSize,
  onDateFontSizeChange,
  noteFontSize,
  onNoteFontSizeChange,
  titleFontSize,
  onTitleFontSizeChange,
  subtitleFontSize,
  onSubtitleFontSizeChange,
  weekStartNumber,
  onWeekStartNumberChange,
  titleBgColor,
  onTitleBgColorChange,
  titleTextColor,
  onTitleTextColorChange,
  courseGroups,
  onCourseGroupColorChange,
  presetColors,
  onPresetColorChange,
  showScreenshotMode,
  onToggleScreenshotMode,
  courseNumberWidth,
  onCourseNumberWidthChange,
  courseNumberHeight,
  onCourseNumberHeightChange,
  courseNumberFontSize,
  onCourseNumberFontSizeChange,
}) => {
  const [activeMenu, setActiveMenu] = useState<MenuKey>('file');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [draftDateRange, setDraftDateRange] = useState({
    startYear, startMonth, startDay,
    endYear, endMonth, endDay,
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  React.useEffect(() => {
    setDraftDateRange({ startYear, startMonth, startDay, endYear, endMonth, endDay });
    setHasUnsavedChanges(false);
  }, [startYear, startMonth, startDay, endYear, endMonth, endDay]);

  const updateDraft = (field: string, value: number) => {
    const newDraft = { ...draftDateRange, [field]: value };
    const isBackToOriginal = newDraft.startYear === startYear && newDraft.startMonth === startMonth && newDraft.startDay === startDay
      && newDraft.endYear === endYear && newDraft.endMonth === endMonth && newDraft.endDay === endDay;
    setDraftDateRange(newDraft);
    setHasUnsavedChanges(!isBackToOriginal);
  };

  const handleApplyDateRange = () => {
    const { startYear: sy, startMonth: sm, startDay: sd, endYear: ey, endMonth: em, endDay: ed } = draftDateRange;
    onDateRangeChange(sy, sm, sd, ey, em, ed);
    setHasUnsavedChanges(false);
  };

  const handleResetDateRange = () => {
    setDraftDateRange({ startYear, startMonth, startDay, endYear, endMonth, endDay });
    setHasUnsavedChanges(false);
  };

  const renderMonthOptions = () => {
    const months = [];
    for (let i = 1; i <= 12; i++) {
      months.push(<option key={i} value={i}>{i}月</option>);
    }
    return months;
  };

  const renderDayOptions = (year: number, month: number) => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(<option key={i} value={i}>{i}日</option>);
    }
    return days;
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportConfig(file);
      e.target.value = '';
    }
  };

  const renderContent = () => {
    switch (activeMenu) {
      case 'file':
        return (
          <div className="settings-panel">
            <h3 className="panel-title">文件操作</h3>
            <div className="file-actions-grid">
              <button onClick={onSave} className="action-btn">
                <span className="btn-icon">💾</span>
                <span>保存项目</span>
              </button>
              <button onClick={onNewProject} className="action-btn">
                <span className="btn-icon">🆕</span>
                <span>新建项目</span>
              </button>
              <button onClick={onExportPNG} className="action-btn">
                <span className="btn-icon">🖼</span>
                <span>导出图片</span>
              </button>
              <button onClick={onExportPDF} className="action-btn">
                <span className="btn-icon">📄</span>
                <span>导出PDF</span>
              </button>
              <button onClick={onExportConfig} className="action-btn">
                <span className="btn-icon">📤</span>
                <span>导出配置</span>
              </button>
              <button onClick={handleImportClick} className="action-btn">
                <span className="btn-icon">📥</span>
                <span>导入配置</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>
            <div className="screenshot-setting-row">
              <label className="screenshot-label">
                <input
                  type="checkbox"
                  checked={showScreenshotMode}
                  onChange={onToggleScreenshotMode}
                />
                <span>截图模式（隐藏提示词和控件，方便导出）</span>
              </label>
            </div>
          </div>
        );

      case 'semester':
        return (
          <div className="settings-panel">
            <h3 className="panel-title">学期设置</h3>
            <div className="setting-row">
              <label>开始日期:</label>
              <div className="date-range-row">
                <select
                  value={draftDateRange.startYear}
                  onChange={(e) => updateDraft('startYear', parseInt(e.target.value))}
                >
                  {[2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035, 2036].map((y) => (
                    <option key={y} value={y}>{y}年</option>
                  ))}
                </select>
                <select
                  value={draftDateRange.startMonth}
                  onChange={(e) => updateDraft('startMonth', parseInt(e.target.value))}
                >
                  {renderMonthOptions()}
                </select>
                <select
                  value={draftDateRange.startDay}
                  onChange={(e) => updateDraft('startDay', parseInt(e.target.value))}
                >
                  {renderDayOptions(draftDateRange.startYear, draftDateRange.startMonth)}
                </select>
              </div>
            </div>
            <div className="setting-row">
              <label>结束日期:</label>
              <div className="date-range-row">
                <select
                  value={draftDateRange.endYear}
                  onChange={(e) => updateDraft('endYear', parseInt(e.target.value))}
                >
                  {[2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035, 2036].map((y) => (
                    <option key={y} value={y}>{y}年</option>
                  ))}
                </select>
                <select
                  value={draftDateRange.endMonth}
                  onChange={(e) => updateDraft('endMonth', parseInt(e.target.value))}
                >
                  {renderMonthOptions()}
                </select>
                <select
                  value={draftDateRange.endDay}
                  onChange={(e) => updateDraft('endDay', parseInt(e.target.value))}
                >
                  {renderDayOptions(draftDateRange.endYear, draftDateRange.endMonth)}
                </select>
              </div>
            </div>
            <div className="semester-actions">
              <button
                className="apply-btn"
                onClick={handleApplyDateRange}
                disabled={!hasUnsavedChanges}
              >
                确认修改
              </button>
              <button
                className="reset-btn"
                onClick={handleResetDateRange}
                disabled={!hasUnsavedChanges}
              >
                重置
              </button>
            </div>
            <div className="setting-row">
              <label>起始周编号:</label>
              <input
                type="number"
                min="1"
                max="999"
                value={weekStartNumber}
                onChange={(e) => onWeekStartNumberChange(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
        );

      case 'course':
        return (
          <div className="settings-panel">
            <h3 className="panel-title">排课设置（右键单元格排课）</h3>
            <div className="course-settings-two-col">
              <div className="course-col-left">
                <div className="course-groups-container">
                  {courseGroups.map((group) => (
                    <div key={group.id} className="course-group-color-row">
                      <div className="group-name">{group.name}</div>
                      <div className="group-color-control">
                        <span className="color-label">颜色:</span>
                        <input
                          type="color"
                          value={group.color}
                          onChange={(e) => onCourseGroupColorChange(group.id, e.target.value)}
                          title="修改圆圈颜色"
                        />
                        <span className="color-preview" style={{ backgroundColor: group.color }} />
                      </div>
                    </div>
                  ))}
                </div>
                {totalCourseDays > 0 && (
                  <div className="course-stats">
                    已设置 <strong>{totalCourseDays}</strong> 个上课日期
                  </div>
                )}
              </div>
              <div className="course-col-right">
                <div className="setting-row">
                  <label>圆圈宽度:</label>
                  <input
                    type="range"
                    min="16"
                    max="80"
                    value={courseNumberWidth}
                    onChange={(e) => onCourseNumberWidthChange(parseInt(e.target.value))}
                  />
                  <span className="width-value">{courseNumberWidth}px</span>
                  <button className="mini-reset-btn" onClick={() => onCourseNumberWidthChange(DEFAULT_COURSE_NUMBER_WIDTH)} title="重置为默认值">↺</button>
                </div>
                <div className="setting-row">
                  <label>圆圈高度:</label>
                  <input
                    type="range"
                    min="16"
                    max="80"
                    value={courseNumberHeight}
                    onChange={(e) => onCourseNumberHeightChange(parseInt(e.target.value))}
                  />
                  <span className="width-value">{courseNumberHeight}px</span>
                  <button className="mini-reset-btn" onClick={() => onCourseNumberHeightChange(DEFAULT_COURSE_NUMBER_HEIGHT)} title="重置为默认值">↺</button>
                </div>
                <div className="setting-row">
                  <label>圆内字号:</label>
                  <input
                    type="range"
                    min="8"
                    max="48"
                    value={courseNumberFontSize}
                    onChange={(e) => onCourseNumberFontSizeChange(parseInt(e.target.value))}
                  />
                  <span className="width-value">{courseNumberFontSize}px</span>
                  <button className="mini-reset-btn" onClick={() => onCourseNumberFontSizeChange(DEFAULT_COURSE_NUMBER_FONT_SIZE)} title="重置为默认值">↺</button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'table':
        return (
          <div className="settings-panel">
            <h3 className="panel-title">表格设置</h3>
            <div className="setting-row">
              <label>日期列宽:</label>
              <input
                type="range"
                min="30"
                max="150"
                value={dateColumnWidth}
                onChange={(e) => onDateColumnWidthChange(parseInt(e.target.value))}
              />
              <span className="width-value">{dateColumnWidth}px</span>
              <button className="mini-reset-btn" onClick={() => onDateColumnWidthChange(DEFAULT_DATE_COLUMN_WIDTH)} title="重置为默认值">↺</button>
            </div>
            <div className="setting-row">
              <label>表格高度:</label>
              <input
                type="range"
                min="30"
                max="120"
                value={tableHeight}
                onChange={(e) => onTableHeightChange(parseInt(e.target.value))}
              />
              <span className="width-value">{tableHeight}px</span>
              <button className="mini-reset-btn" onClick={() => onTableHeightChange(DEFAULT_TABLE_HEIGHT)} title="重置为默认值">↺</button>
            </div>
            <div className="setting-row">
              <label>备注列宽:</label>
              <input
                type="range"
                min="60"
                max="300"
                value={noteColumnWidth}
                onChange={(e) => onNoteColumnWidthChange(parseInt(e.target.value))}
              />
              <span className="width-value">{noteColumnWidth}px</span>
              <button className="mini-reset-btn" onClick={() => onNoteColumnWidthChange(DEFAULT_NOTE_COLUMN_WIDTH)} title="重置为默认值">↺</button>
            </div>
            <div className="setting-row-pair">
              <div className="setting-row">
                <label>日期字号:</label>
                <input
                  type="number"
                  min="10"
                  max="64"
                  value={dateFontSize}
                  onChange={(e) => onDateFontSizeChange(parseInt(e.target.value) || 16)}
                />
                <span>px</span>
              </div>
              <div className="setting-row">
                <label>备注字号:</label>
                <input
                  type="number"
                  min="8"
                  max="20"
                  value={noteFontSize}
                  onChange={(e) => onNoteFontSizeChange(parseInt(e.target.value) || 12)}
                />
                <span>px</span>
              </div>
            </div>
            <div className="setting-row">
              <label>备注颜色:</label>
              <div className="note-color-presets">
                {PRESET_NOTE_COLORS.map((color) => (
                  <button
                    key={color.name}
                    className="color-swatch"
                    style={{ backgroundColor: color.colors[0] }}
                    onClick={() => onNoteColorChange(color.colors[0])}
                    title={color.name}
                  />
                ))}
                <input
                  type="color"
                  value={noteColor}
                  onChange={(e) => onNoteColorChange(e.target.value)}
                  title="自定义颜色"
                />
              </div>
            </div>
            <div className="setting-row">
              <label>备注列文字颜色:</label>
              <div className="note-color-presets">
                {PRESET_NOTE_COLORS.map((color) => (
                  <button
                    key={color.name}
                    className="color-swatch"
                    style={{ backgroundColor: color.colors[0] }}
                    onClick={() => onWeekNoteColorChange(color.colors[0])}
                    title={color.name}
                  />
                ))}
                <input
                  type="color"
                  value={weekNoteColor}
                  onChange={(e) => onWeekNoteColorChange(e.target.value)}
                  title="自定义颜色"
                />
              </div>
            </div>
          </div>
        );

      case 'title':
        return (
          <div className="settings-panel">
            <h3 className="panel-title">标题设置</h3>
            <div className="setting-row">
              <label>背景颜色:</label>
              <input
                type="color"
                value={titleBgColor}
                onChange={(e) => onTitleBgColorChange(e.target.value)}
              />
            </div>
            <div className="setting-row">
              <label>文字颜色:</label>
              <input
                type="color"
                value={titleTextColor}
                onChange={(e) => onTitleTextColorChange(e.target.value)}
              />
            </div>
            <div className="setting-row-pair">
              <div className="setting-row">
                <label>标题字号:</label>
                <input
                  type="number"
                  min="12"
                  max="60"
                  value={titleFontSize}
                  onChange={(e) => onTitleFontSizeChange(parseInt(e.target.value) || 24)}
                />
                <span>px</span>
              </div>
              <div className="setting-row">
                <label>副标题字号:</label>
                <input
                  type="number"
                  min="10"
                  max="60"
                  value={subtitleFontSize}
                  onChange={(e) => onSubtitleFontSizeChange(parseInt(e.target.value) || 14)}
                />
                <span>px</span>
              </div>
            </div>
          </div>
        );

      case 'batch':
        return (
          <div className="settings-panel">
            <h3 className="panel-title">批量操作 {selectedCount > 0 && <span className="selected-count">(已选 {selectedCount} 个)</span>}</h3>
            <div className="preset-colors-container">
              {presetColors.map((scheme) => (
                <div key={scheme.name} className="preset-color-row">
                  <button
                    className="preset-color-btn"
                    style={{ backgroundColor: scheme.colors[0] }}
                    disabled={selectedCount === 0}
                    onClick={() => onBatchColorChange(scheme.colors[0])}
                    title={`设置为${scheme.name}`}
                  >
                    {scheme.name}
                  </button>
                  <input
                    type="color"
                    value={scheme.colors[0]}
                    onChange={(e) => onPresetColorChange(scheme.name, e.target.value)}
                    title={`修改${scheme.name}颜色`}
                  />
                </div>
              ))}
            </div>
            <div className="batch-actions">
              <button disabled={selectedCount === 0} onClick={onBatchClearColor}>
                清除背景色
              </button>
              <button disabled={selectedCount === 0} onClick={onBatchClearNotes}>
                清除备注
              </button>
              <button disabled={selectedCount === 0} onClick={onBatchClearCourseNumbers}>
                清除课程编号
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="toolbar-two-column">
      <nav className="toolbar-sidebar">
        {menuItems.map((item) => (
          <button
            key={item.key}
            className={`sidebar-item ${activeMenu === item.key ? 'active' : ''}`}
            onClick={() => setActiveMenu(item.key)}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="toolbar-content">
        {renderContent()}
      </div>
    </div>
  );
};
