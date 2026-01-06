import { useEffect, useRef } from 'react';
import { persistenceService, type PersistenceSnapshot } from '@/services/persistence-service';
import type { Agent, Project } from '@/types';
import type { OrchestrationState } from '@/context/OrchestrationContext';
import type { Task } from '@/types';
import type { LogEntry } from '@/types/orchestrator';

interface BootstrapOptions {
  onHydrate: (snapshot: PersistenceSnapshot) => void;
}

export function useOrchestrationBootstrap(_state: OrchestrationState, { onHydrate }: BootstrapOptions) {
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    if (hasHydratedRef.current) return;
    hasHydratedRef.current = true;

    let cancelled = false;
    persistenceService.loadSnapshot().then((snapshot) => {
      if (cancelled || !snapshot) return;

      reviveSnapshotDates(snapshot);

      // Reset any agents that might be mid-run
      if (snapshot.agents) {
        snapshot.agents = snapshot.agents.map((agent: Agent) => ({
          ...agent,
          status: 'idle',
          currentTaskId: undefined,
        }));
      }

      onHydrate(snapshot);
    });

    return () => {
      cancelled = true;
    };
  }, [_state, onHydrate]);
}

function reviveSnapshotDates(snapshot: PersistenceSnapshot) {
  if (snapshot.tasks) {
    snapshot.tasks = snapshot.tasks.map((task: Task) => ({
      ...task,
      createdAt: task.createdAt ? new Date(task.createdAt) : undefined,
      updatedAt: task.updatedAt ? new Date(task.updatedAt) : undefined,
      phases: task.phases.map((phase) => ({
        ...phase,
        startedAt: phase.startedAt ? new Date(phase.startedAt as unknown as string) : undefined,
        completedAt: phase.completedAt ? new Date(phase.completedAt as unknown as string) : undefined,
      })),
    }));
  }

  if (snapshot.streamingLogs) {
    snapshot.streamingLogs = snapshot.streamingLogs.map((log: LogEntry) => ({
      ...log,
      timestamp: new Date(log.timestamp as unknown as string),
      isStreaming: false, // never resume mid-stream
    }));
  }

  if (snapshot.projects) {
    snapshot.projects = snapshot.projects.map((project: Project) => ({
      ...project,
      createdAt: project.createdAt ? new Date(project.createdAt as unknown as string) : new Date(),
      lastOpenedAt: project.lastOpenedAt ? new Date(project.lastOpenedAt as unknown as string) : new Date(),
    }));
  }

  if (snapshot.fileOpProposals) {
    snapshot.fileOpProposals = snapshot.fileOpProposals.map((p) => ({
      ...p,
      createdAt: typeof p.createdAt === 'string' ? new Date(p.createdAt as unknown as string).getTime() : p.createdAt,
    }));
  }
}
