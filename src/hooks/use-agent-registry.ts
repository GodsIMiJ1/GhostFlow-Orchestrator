import { useCallback, useMemo } from 'react';
import { useOrchestration } from '@/context/OrchestrationContext';
import { PHASE_AGENT_MAP } from '@/constants/phaseAgentMap';
import type { Agent, AgentCategory, AgentRole, PhaseType } from '@/types';
import type { AgentTerminalEntry } from '@/types/terminals';

export interface RegistryAgent extends Agent {
  phaseTypes: PhaseType[];
  terminalBuffer: AgentTerminalEntry[];
  runtimeStatus: 'idle' | 'running' | 'done' | 'error';
  isExecuting: boolean;
  isComplete: boolean;
}

export function useAgentRegistry() {
  const { state } = useOrchestration();
  const { agents, terminalEntries, activeTask } = state;

  const registry: RegistryAgent[] = useMemo(() => {
    const phasesByRole = Object.entries(PHASE_AGENT_MAP).reduce<Record<AgentRole, PhaseType[]>>(
      (acc, [phase, role]) => {
        if (!role) return acc;
        if (phase === 'fix') return acc;
        const phaseId = phase as PhaseType;
        acc[role] = acc[role] ? [...acc[role], phaseId] : [phaseId];
        return acc;
      },
      {}
    );

    const roster = [...agents];
    Object.values(PHASE_AGENT_MAP).forEach((role) => {
      if (!role) return;
      if (!roster.some((agent) => agent.role === role)) {
        roster.push({
          id: `agent-${role}`,
          name: role.split('-').map(capitalize).join(' '),
          role,
          category: inferCategory(role),
          model: 'llama3.2',
          description: 'Unregistered agent slot',
          constraints: [],
          allowedTools: [],
          mcpBindings: [],
          isActive: false,
          status: 'idle',
        });
      }
    });

    const sortedEntries = [...terminalEntries].sort((a, b) => a.timestamp - b.timestamp);

    return roster.map((agent) => {
      const phaseTypes = phasesByRole[agent.role] ?? [];
      const terminalBuffer = sortedEntries.filter((entry) => entry.agentRole === agent.role);
      const relevantPhases = activeTask
        ? activeTask.phases.filter((phase) => phaseTypes.includes(phase.id))
        : [];
      const isExecuting = agent.status === 'working' || relevantPhases.some((phase) => phase.status === 'active');
      const isComplete = relevantPhases.some((phase) => phase.status === 'completed');

      let runtimeStatus: RegistryAgent['runtimeStatus'] = 'idle';
      if (agent.status === 'error') {
        runtimeStatus = 'error';
      } else if (isExecuting) {
        runtimeStatus = 'running';
      } else if (isComplete) {
        runtimeStatus = 'done';
      }

      return {
        ...agent,
        phaseTypes,
        terminalBuffer,
        runtimeStatus,
        isExecuting,
        isComplete,
      };
    });
  }, [activeTask, agents, terminalEntries]);

  const getAgentByRole = useCallback(
    (role: AgentRole) => registry.find((agent) => agent.role === role),
    [registry]
  );

  const getAgentById = useCallback(
    (id: string) => registry.find((agent) => agent.id === id),
    [registry]
  );

  return { registry, getAgentByRole, getAgentById };
}

function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function inferCategory(role: AgentRole): AgentCategory {
  if (role.includes('spec')) return 'spec-creation';
  if (role.includes('qa') || role === 'coder' || role === 'planner' || role === 'merge-resolver') return 'build';
  if (role.includes('review') || role.includes('commit') || role === 'pr-reviewer') return 'utility';
  if (role.includes('analysis')) return 'insights';
  if (role.includes('ideation') || role.includes('roadmap')) return 'ideation';
  return 'build';
}
