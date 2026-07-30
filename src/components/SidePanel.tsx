import React from 'react';
import type { CalendarProject } from '../types';

interface SidePanelProps {
  project: CalendarProject;
  onUpdateNotes: (notes: string[]) => void;
}

export const SidePanel: React.FC<SidePanelProps> = ({ project, onUpdateNotes }) => {
  const [newNote, setNewNote] = React.useState('');
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    onUpdateNotes([...project.sideNotes, newNote.trim()]);
    setNewNote('');
  };

  const handleDeleteNote = (index: number) => {
    const updated = project.sideNotes.filter((_, i) => i !== index);
    onUpdateNotes(updated);
  };

  const handleUpdateNote = (index: number, value: string) => {
    const updated = [...project.sideNotes];
    updated[index] = value;
    onUpdateNotes(updated);
  };

  return (
    <div className="side-panel">
      <div className="panel-section">
        <h3 className="panel-title">课程说明</h3>
        <div className="notes-list">
          {project.sideNotes.map((note, index) => (
            <div key={index} className="note-item">
              {editingIndex === index ? (
                <div className="note-edit">
                  <textarea
                    value={note}
                    onChange={(e) => handleUpdateNote(index, e.target.value)}
                    onBlur={() => setEditingIndex(null)}
                    autoFocus
                  />
                </div>
              ) : (
                <>
                  <span className="note-text" onDoubleClick={() => setEditingIndex(index)}>
                    {note}
                  </span>
                  <button className="delete-btn" onClick={() => handleDeleteNote(index)}>
                    ✕
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
        <div className="add-note-form">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="添加课程说明..."
            rows={2}
          />
          <button onClick={handleAddNote}>添加</button>
        </div>
      </div>

      <div className="panel-section">
        <h3 className="panel-title">科目信息</h3>
        <div className="subjects">
          <div className="subject-item">初中：数学 · 物理 · 化学</div>
          <div className="subject-item">高中：数学 · 物理 · 化学</div>
        </div>
      </div>

      <div className="panel-section qrcode-section">
        <h3 className="panel-title">联系方式</h3>
        <div className="contact-info">
          <div className="qr-placeholder">
            <div className="qr-icon">📱</div>
            <span>扫码联系</span>
          </div>
          <div className="contact-details">
            <p>📞 177 5152 8868</p>
            <p>📍 无锡海岸城</p>
            <p>👤 {project.teacherName}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
