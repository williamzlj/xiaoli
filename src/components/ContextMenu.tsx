import React, { useEffect, useRef } from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  selectedCount: number;
  courseGroups: { id: string; name: string; color: string }[];
  onAddToCourse: (groupId: string) => void;
  onRemoveCourse: () => void;
  onToggleMonthStart: () => void;
  onSetDateFontSize: () => void;
  onClearDateFontSize: () => void;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  selectedCount,
  courseGroups,
  onAddToCourse,
  onRemoveCourse,
  onToggleMonthStart,
  onSetDateFontSize,
  onClearDateFontSize,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    left: x,
    top: y,
    zIndex: 10000,
  };

  return (
    <div ref={menuRef} className="context-menu" style={menuStyle}>
      <div className="context-menu-header">
        已选 {selectedCount} 个单元格
      </div>
      <div className="context-menu-divider" />
      {courseGroups.map((group) => (
        <button
          key={group.id}
          className="context-menu-item"
          onClick={() => { onAddToCourse(group.id); onClose(); }}
        >
          <span className="context-menu-color" style={{ backgroundColor: group.color }} />
          添加到{group.name}
        </button>
      ))}
      <div className="context-menu-divider" />
      <button
        className="context-menu-item context-menu-danger"
        onClick={() => { onRemoveCourse(); onClose(); }}
      >
        移除排课
      </button>
      <div className="context-menu-divider" />
      <button
        className="context-menu-item"
        onClick={() => { onToggleMonthStart(); onClose(); }}
      >
        切换月首
      </button>
      <div className="context-menu-divider" />
      <button
        className="context-menu-item"
        onClick={() => { onSetDateFontSize(); onClose(); }}
      >
        设置日期字号...
      </button>
      <button
        className="context-menu-item"
        onClick={() => { onClearDateFontSize(); onClose(); }}
      >
        清除日期字号
      </button>
    </div>
  );
};
