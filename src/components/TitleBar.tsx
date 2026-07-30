import React from 'react';
import type { CalendarProject } from '../types';

interface TitleBarProps {
  project: CalendarProject;
  onUpdate: (updates: Partial<CalendarProject>) => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({ project, onUpdate }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [tempValues, setTempValues] = React.useState({
    title: project.title,
    subtitle: project.subtitle,
    teacherName: project.teacherName,
    contact: project.contact,
  });

  const handleOpenDialog = () => {
    setTempValues({
      title: project.title,
      subtitle: project.subtitle,
      teacherName: project.teacherName,
      contact: project.contact,
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    onUpdate({
      title: tempValues.title,
      subtitle: tempValues.subtitle,
      teacherName: tempValues.teacherName,
      contact: tempValues.contact,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const titleStyle: React.CSSProperties = {
    backgroundColor: project.titleBgColor,
    color: project.titleTextColor,
  };

  return (
    <div className="title-bar" style={titleStyle}>
      <div className="title-display" onClick={handleOpenDialog} style={{ color: project.titleTextColor }}>
        <div className="title-main">
          <h1 style={{ fontSize: `${project.titleFontSize}px`, color: project.titleTextColor }}>{project.title}</h1>
          {project.subtitle && <span className="subtitle" style={{ color: project.titleTextColor, fontSize: `${project.subtitleFontSize}px` }}>{project.subtitle}</span>}
        </div>
        <div className="title-info">
          <span className="teacher-name">{project.teacherName}</span>
          <span className="contact">{project.contact}</span>
        </div>
        <div className="edit-hint" style={{ backgroundColor: project.titleTextColor, color: project.titleBgColor }}>✎ 点击编辑</div>
      </div>

      {isEditing && (
        <div className="dialog-overlay" onClick={handleCancel}>
          <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h3>编辑标题信息</h3>
            </div>
            <div className="dialog-body">
              <div className="dialog-field">
                <label>标题</label>
                <input
                  type="text"
                  value={tempValues.title}
                  onChange={(e) => setTempValues((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="输入校历标题"
                  autoFocus
                />
              </div>
              <div className="dialog-field">
                <label>副标题</label>
                <input
                  type="text"
                  value={tempValues.subtitle}
                  onChange={(e) => setTempValues((prev) => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="副标题（可选）"
                />
              </div>
              <div className="dialog-field">
                <label>教师姓名</label>
                <input
                  type="text"
                  value={tempValues.teacherName}
                  onChange={(e) => setTempValues((prev) => ({ ...prev, teacherName: e.target.value }))}
                  placeholder="输入教师姓名"
                />
              </div>
              <div className="dialog-field">
                <label>联系方式</label>
                <input
                  type="text"
                  value={tempValues.contact}
                  onChange={(e) => setTempValues((prev) => ({ ...prev, contact: e.target.value }))}
                  placeholder="输入联系方式"
                />
              </div>
            </div>
            <div className="dialog-footer">
              <button className="dialog-btn dialog-btn-cancel" onClick={handleCancel}>取消</button>
              <button className="dialog-btn dialog-btn-save" onClick={handleSave}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
