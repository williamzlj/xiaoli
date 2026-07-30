import React from 'react';
import type { CalendarProject } from '../types';

interface FooterNotesProps {
  project: CalendarProject;
  onUpdateNotes: (notes: string[]) => void;
  showScreenshotMode?: boolean;
}

export const FooterNotes: React.FC<FooterNotesProps> = ({ project, onUpdateNotes, showScreenshotMode = false }) => {
  const [newNote, setNewNote] = React.useState('');
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);
  const [confirmDeleteIndex, setConfirmDeleteIndex] = React.useState<number | null>(null);

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    onUpdateNotes([...project.footerNotes, newNote.trim()]);
    setNewNote('');
  };

  const handleDeleteNote = (index: number) => {
    if (confirmDeleteIndex !== index) {
      setConfirmDeleteIndex(index);
      return;
    }
    const updated = project.footerNotes.filter((_, i) => i !== index);
    onUpdateNotes(updated);
    setConfirmDeleteIndex(null);
  };

  const handleCancelDelete = () => {
    setConfirmDeleteIndex(null);
  };

  const handleUpdateNote = (index: number, value: string) => {
    const updated = [...project.footerNotes];
    updated[index] = value;
    onUpdateNotes(updated);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const updated = [...project.footerNotes];
    const [draggedItem] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, draggedItem);
    onUpdateNotes(updated);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="footer-notes-wrapper">
      <div className="footer-notes" style={{ margin: '0 auto' }}>
        <h3 className="footer-title">备注</h3>
        <div className="notes-content">
          {project.footerNotes.map((note, index) => (
            <div
              key={index}
              className={`note-item ${draggedIndex === index ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
              draggable={!showScreenshotMode}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
            >
              {!showScreenshotMode && (
                <span className="drag-handle" title="拖动排序">⋮⋮</span>
              )}
              <span className="note-number">{index + 1}、</span>
              {editingIndex === index ? (
                <input
                  type="text"
                  value={note}
                  onChange={(e) => handleUpdateNote(index, e.target.value)}
                  onBlur={() => setEditingIndex(null)}
                  autoFocus
                  className="note-edit-input"
                />
              ) : (
                <span className="note-text" onDoubleClick={() => setEditingIndex(index)}>
                  {note}
                </span>
              )}
              {!showScreenshotMode && (
                <div className="note-actions">
                  <button className="edit-btn" onClick={() => setEditingIndex(index)} title="修改">✎</button>
                  {confirmDeleteIndex === index ? (
                    <>
                      <button className="delete-confirm-btn" onClick={() => handleDeleteNote(index)} title="确认删除">确认</button>
                      <button className="delete-cancel-btn" onClick={handleCancelDelete} title="取消">取消</button>
                    </>
                  ) : (
                    <button className="delete-btn" onClick={() => handleDeleteNote(index)} title="删除">✕</button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        {!showScreenshotMode && (
          <div className="add-note-row">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="添加备注..."
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddNote(); }}
            />
            <button onClick={handleAddNote}>添加</button>
          </div>
        )}
      </div>
    </div>
  );
};
