// ============================================
// Persistence Service
// Primary: GhostVault (optional endpoint)
// Fallback: IndexedDB, then localStorage
// ============================================

import type { Agent, Settings, Task, Project, FileOpProposal } from '@/types';
import type { AgentTerminalEntry } from '@/types/terminals';
import type { LogEntry } from '@/types/orchestrator';

const DEFAULT_REMOTE_URL = (import.meta.env.VITE_GHOSTVAULT_PERSIST_URL as string | undefined) || '';

const DB_NAME = 'ghostflow_persistence';
const DB_VERSION = 1;
const STORE_NAME = 'snapshot';
const LOCAL_KEY = 'ghostflow:persistence:snapshot';

export interface PersistenceSnapshot {
  tasks?: Task[];
  agents?: Agent[];
  settings?: Settings;
  terminalEntries?: AgentTerminalEntry[];
  streamingLogs?: LogEntry[];
  projects?: Project[];
  fileOpProposals?: FileOpProposal[];
  ui?: {
    activeTaskId?: string | null;
    activeProjectId?: string | null;
  };
}

interface StoredSnapshot {
  snapshot: PersistenceSnapshot;
  updatedAt: number;
}

class PersistenceService {
  private remoteUrl: string;
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor(remoteUrl: string = DEFAULT_REMOTE_URL) {
    this.remoteUrl = remoteUrl;
    if (typeof indexedDB !== 'undefined') {
      this.dbPromise = this.initIndexedDB();
    }
  }

  async loadSnapshot(): Promise<PersistenceSnapshot | null> {
    // Remote (optional)
    const remote = await this.loadFromRemote();
    if (remote) return remote;

    // IndexedDB
    const idb = await this.loadFromIndexedDB();
    if (idb) return idb;

    // LocalStorage
    const local = this.loadFromLocalStorage();
    if (local) return local;

    return null;
  }

  async saveSnapshot(snapshot: PersistenceSnapshot): Promise<void> {
    const stored: StoredSnapshot = {
      snapshot,
      updatedAt: Date.now(),
    };

    // Remote (optional)
    try {
      await this.saveToRemote(stored);
      return;
    } catch {
      // Silent fallback
    }

    // IndexedDB
    try {
      await this.saveToIndexedDB(stored);
      return;
    } catch {
      // Silent fallback
    }

    // LocalStorage
    this.saveToLocalStorage(stored);
  }

  // ============================================
  // Remote (GhostVault)
  // ============================================

  private async loadFromRemote(): Promise<PersistenceSnapshot | null> {
    if (!this.remoteUrl) return null;
    try {
      const res = await fetch(this.remoteUrl, { method: 'GET', headers: { 'Accept': 'application/json' } });
      if (!res.ok) return null;
      const data = await res.json();
      return (data?.snapshot || data) as PersistenceSnapshot;
    } catch {
      return null;
    }
  }

  private async saveToRemote(payload: StoredSnapshot): Promise<void> {
    if (!this.remoteUrl) throw new Error('No remote persistence URL configured');
    const res = await fetch(this.remoteUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error('Remote persistence failed');
    }
  }

  // ============================================
  // IndexedDB
  // ============================================

  private initIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async loadFromIndexedDB(): Promise<PersistenceSnapshot | null> {
    if (!this.dbPromise) return null;
    try {
      const db = await this.dbPromise;
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get('latest');
        request.onsuccess = () => {
          const value = request.result as StoredSnapshot | undefined;
          resolve(value?.snapshot ?? null);
        };
        request.onerror = () => reject(request.error);
      });
    } catch {
      return null;
    }
  }

  private async saveToIndexedDB(payload: StoredSnapshot): Promise<void> {
    if (!this.dbPromise) throw new Error('IndexedDB unavailable');
    const db = await this.dbPromise;
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(payload, 'latest');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ============================================
  // Local Storage (boot hint fallback)
  // ============================================

  private loadFromLocalStorage(): PersistenceSnapshot | null {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (!raw) return null;
      const parsed: StoredSnapshot = JSON.parse(raw);
      return parsed.snapshot || null;
    } catch {
      return null;
    }
  }

  private saveToLocalStorage(payload: StoredSnapshot): void {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }
}

export const persistenceService = new PersistenceService();
