// ============================================
// Persistence Hook - localStorage for GhostFlow
// ============================================

import type { Task, Settings, Agent } from '@/types';

const STORAGE_KEYS = {
  TASKS: 'ghostflow:tasks',
  SETTINGS: 'ghostflow:settings',
  AGENTS: 'ghostflow:agents',
  UI_STATE: 'ghostflow:ui',
} as const;

// ============================================
// Serialization Helpers
// ============================================

/**
 * Serialize dates to ISO strings for JSON storage
 */
function serializeDates<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj.toISOString() as unknown as T;
  if (Array.isArray(obj)) return obj.map(serializeDates) as unknown as T;
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeDates(value);
    }
    return result as T;
  }
  return obj;
}

/**
 * Deserialize ISO strings back to Date objects
 */
function deserializeDates<T>(obj: T, dateFields: string[]): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => deserializeDates(item, dateFields)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (dateFields.includes(key) && typeof value === 'string') {
        result[key] = new Date(value);
      } else if (typeof value === 'object') {
        result[key] = deserializeDates(value, dateFields);
      } else {
        result[key] = value;
      }
    }
    return result as T;
  }
  return obj;
}

// ============================================
// Storage Operations
// ============================================

export function saveTasks(tasks: Task[]): void {
  try {
    const serialized = serializeDates(tasks);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(serialized));
  } catch (error) {
    console.warn('Failed to save tasks to localStorage:', error);
  }
}

export function loadTasks(): Task[] | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return deserializeDates(parsed, ['createdAt', 'updatedAt', 'startedAt', 'completedAt']);
  } catch (error) {
    console.warn('Failed to load tasks from localStorage:', error);
    return null;
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.warn('Failed to save settings to localStorage:', error);
  }
}

export function loadSettings(): Settings | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (error) {
    console.warn('Failed to load settings from localStorage:', error);
    return null;
  }
}

export function saveAgents(agents: Agent[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.AGENTS, JSON.stringify(agents));
  } catch (error) {
    console.warn('Failed to save agents to localStorage:', error);
  }
}

export function loadAgents(): Agent[] | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.AGENTS);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (error) {
    console.warn('Failed to load agents from localStorage:', error);
    return null;
  }
}

interface PersistedUIState {
  theme: 'light' | 'dark' | 'system';
  leftSidebarOpen: boolean;
}

export function saveUIState(ui: PersistedUIState): void {
  try {
    localStorage.setItem(STORAGE_KEYS.UI_STATE, JSON.stringify(ui));
  } catch (error) {
    console.warn('Failed to save UI state to localStorage:', error);
  }
}

export function loadUIState(): PersistedUIState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.UI_STATE);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (error) {
    console.warn('Failed to load UI state from localStorage:', error);
    return null;
  }
}

// ============================================
// Clear All Persistence
// ============================================

export function clearAllPersistence(): void {
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
}
