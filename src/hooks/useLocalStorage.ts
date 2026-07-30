import { useState, useCallback, useEffect } from 'react';
import type { CalendarProject } from '../types';

const STORAGE_KEY = 'school-calendar-projects';

export function useLocalStorage() {
  const [projects, setProjects] = useState<CalendarProject[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const saveProject = useCallback((project: CalendarProject) => {
    setProjects((prev) => {
      const index = prev.findIndex((p) => p.id === project.id);
      const updated = [...prev];
      if (index !== -1) {
        updated[index] = { ...project, updatedAt: new Date().toISOString() };
      } else {
        updated.push({ ...project, updatedAt: new Date().toISOString() });
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const loadProject = useCallback((id: string): CalendarProject | null => {
    return projects.find((p) => p.id === id) || null;
  }, [projects]);

  const deleteProject = useCallback((id: string) => {
    setProjects((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const exportProject = useCallback((project: CalendarProject): string => {
    return JSON.stringify(project, null, 2);
  }, []);

  const importProject = useCallback((jsonStr: string): CalendarProject | null => {
    try {
      const project = JSON.parse(jsonStr) as CalendarProject;
      if (project.id && project.months) {
        return project;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const handleMouseUp = () => {
      document.dispatchEvent(new CustomEvent('calendar-mouseup'));
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  return {
    projects,
    saveProject,
    loadProject,
    deleteProject,
    exportProject,
    importProject,
  };
}
