import { useCallback, useMemo, useRef, useState } from 'react';
import { useOrchestration } from '@/context/OrchestrationContext';
import { useLLMProvider } from './use-llm-provider';
import type { AgentRole, FileOp, PhaseType } from '@/types';
import type { ChatPayload } from '@/services/llm-service';
import { generateId, PHASE_NAMES } from '@/data/mock-data';

interface ExecuteAgentParams {
  taskId: string;
  phase: PhaseType;
  agentRole: AgentRole;
}

const PHASE_AGENT_FALLBACK: Partial<Record<PhaseType, AgentRole>> = {
  spec: 'spec-writer',
  plan: 'planner',
  code: 'coder',
  review: 'pr-reviewer',
  qa: 'qa',
};

export function useAgentExecution() {
  const { state, dispatch, startPhase, completePhase, failPhase } = useOrchestration();
  const { streamChat, cancelStream, isStreaming } = useLLMProvider();
  const [isExecuting, setIsExecuting] = useState(false);
  const activeExecutionRef = useRef<string | null>(null);
  const activeAgentIdRef = useRef<string | null>(null);
  const [runOutput, setRunOutput] = useState<Record<string, string>>({});

  const agentsByRole = useMemo(() => {
    return state.agents.reduce<Partial<Record<AgentRole, typeof state.agents[number]>>>((acc, agent) => {
      acc[agent.role] = agent;
      return acc;
    }, {});
  }, [state]);

  const resolveAgentForRole = useCallback(
    (role: AgentRole) => agentsByRole[role],
    [agentsByRole]
  );

  const resolveAgentRoleForPhase = useCallback(
    (phase: PhaseType): AgentRole | null => {
      // Prefer a direct role match
      const direct = state.agents.find((a) => a.role === phase);
      if (direct) return direct.role;

      const mapped = PHASE_AGENT_FALLBACK[phase];
      if (mapped && resolveAgentForRole(mapped)) return mapped;

      // Fallback to first active agent
      const first = state.agents.find((a) => a.isActive);
      return first ? first.role : null;
    },
    [resolveAgentForRole, state.agents]
  );

  const buildSystemPrompt = useCallback(
    (agentName: string, agentRole: AgentRole, taskTitle: string, phase: PhaseType, description?: string) => {
      const phaseLabel = PHASE_NAMES[phase] || phase;
      const parts = [
        `You are the ${agentName} agent (role: ${agentRole}).`,
        `Current task: ${taskTitle}.`,
        `Current phase: ${phaseLabel}.`,
      ];
      if (description) parts.push(`Task context: ${description}`);
      return parts.join(' ');
    },
    []
  );

  const executeAgent = useCallback(
    async ({ taskId, phase, agentRole }: ExecuteAgentParams) => {
      if (isStreaming || isExecuting) return;

      const task = state.tasks.find((t) => t.id === taskId);
      const project = state.activeProject;
      if (!project) {
        throw new Error('No active project connected');
      }
      const resolvedRole = resolveAgentRoleForPhase(phase);
      const agent =
        resolveAgentForRole(agentRole) ||
        (resolvedRole ? resolveAgentForRole(resolvedRole as AgentRole) : null);
      if (!task || !agent) return;

      const provider = state.settings.executionEngine.activeProvider;
      const model =
        state.settings.executionEngine.modelAssignments[agent.role] ||
        agent.model ||
        'llama3.2';

      const systemPrompt = buildSystemPrompt(agent.name, agent.role, task.title, phase, task.description);
      const userPrompt = `Proceed with the ${PHASE_NAMES[phase] || phase} phase. Stream concise updates as tokens.`;

      const payload: ChatPayload = {
        provider,
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        metadata: {
          taskId,
          agent: agent.role,
          phase,
          projectId: project.id,
          repoPath: project.path,
          hasGit: project.hasGit,
        },
      };

      const streamId = generateId('stream');
      activeExecutionRef.current = streamId;
      activeAgentIdRef.current = agent.id;
      setIsExecuting(true);

      // Mark phase active and agent working
      startPhase(taskId, phase);
      dispatch({ type: 'CLEAR_LOGS', payload: agent.id });
      dispatch({
        type: 'UPDATE_AGENT',
        payload: { id: agent.id, updates: { status: 'working', currentTaskId: taskId } },
      });

      // Boundary marker
      dispatch({
        type: 'ADD_TERMINAL_ENTRY',
        payload: {
          id: generateId('term'),
          agentRole: agent.role,
          phase,
          type: 'boundary',
          content: `Phase: ${PHASE_NAMES[phase] || phase}`,
          timestamp: Date.now(),
        },
      });
      dispatch({
        type: 'ADD_LOG_ENTRY',
        payload: {
          id: generateId('log'),
          timestamp: new Date(),
          level: 'agent',
          source: agent.id,
          agentId: agent.id,
          phase,
          message: `Phase: ${PHASE_NAMES[phase] || phase}`,
          isStreaming: true,
        },
      });

      try {
        let counter = 0;
        let accumulated = '';
        for await (const chunk of streamChat(payload)) {
          if (activeExecutionRef.current !== streamId) break;
          accumulated += chunk.content;
          if (chunk.content) {
            dispatch({
              type: 'ADD_TERMINAL_ENTRY',
              payload: {
                id: `${streamId}-${counter++}`,
                agentRole: agent.role,
                phase,
                type: 'output',
                content: chunk.content,
                timestamp: Date.now(),
              },
            });
            dispatch({
              type: 'APPEND_STREAMING_TOKEN',
              payload: { taskId, agentId: agent.id, token: chunk.content },
            });
          }

          if (chunk.done) {
            break;
          }
        }

        if (activeExecutionRef.current === streamId) {
          setRunOutput((prev) => ({ ...prev, [streamId]: accumulated }));
          const parsedOps = extractFileOps(accumulated);
          if (parsedOps.length > 0) {
            dispatch({
              type: 'ADD_FILE_OP_PROPOSAL',
              payload: {
                id: generateId('fileops'),
                ops: parsedOps,
                taskId,
                agentRole: agent.role,
                projectId: project.id,
                repoPath: project.path,
                hasGit: project.hasGit,
                createdAt: Date.now(),
                status: 'pending',
              },
            });
          }
          completePhase(taskId, phase);
          dispatch({
            type: 'UPDATE_AGENT',
            payload: { id: agent.id, updates: { status: 'idle', currentTaskId: undefined } },
          });
          dispatch({ type: 'END_STREAMING_LOG', payload: { agentId: agent.id } });
          dispatch({
            type: 'ADD_LOG_ENTRY',
            payload: {
              id: generateId('log'),
              timestamp: new Date(),
              level: 'info',
              source: agent.id,
              agentId: agent.id,
              phase,
              message: 'Stream complete',
              isStreaming: false,
            },
          });
        }
      } catch (error) {
        dispatch({
          type: 'ADD_TERMINAL_ENTRY',
          payload: {
            id: generateId('term'),
            agentRole: agent.role,
            phase,
            type: 'error',
            content: error instanceof Error ? error.message : 'Execution failed',
            timestamp: Date.now(),
          },
        });
        dispatch({
          type: 'ADD_LOG_ENTRY',
          payload: {
            id: generateId('log'),
            timestamp: new Date(),
            level: 'error',
            source: agent.id,
            agentId: agent.id,
            phase,
            message: error instanceof Error ? error.message : 'Execution failed',
            isStreaming: false,
          },
        });
        dispatch({ type: 'END_STREAMING_LOG', payload: { agentId: agent.id } });
        failPhase(taskId, phase, error instanceof Error ? error.message : 'Execution failed');
        dispatch({
          type: 'UPDATE_AGENT',
          payload: { id: agent.id, updates: { status: 'error' } },
        });
      } finally {
        if (activeExecutionRef.current === streamId) {
          dispatch({
            type: 'UPDATE_AGENT',
            payload: { id: agent.id, updates: { status: 'idle', currentTaskId: undefined } },
          });
        }
        activeExecutionRef.current = null;
        activeAgentIdRef.current = null;
        setIsExecuting(false);
      }
    },
    [
      buildSystemPrompt,
      completePhase,
      dispatch,
      failPhase,
      isExecuting,
      isStreaming,
      resolveAgentForRole,
      resolveAgentRoleForPhase,
      startPhase,
      state.activeProject,
      state.settings.executionEngine.activeProvider,
      state.settings.executionEngine.modelAssignments,
      state.tasks,
      streamChat,
    ]
  );

  const cancelExecution = useCallback(() => {
    activeExecutionRef.current = null;
    cancelStream();
    const agentId = activeAgentIdRef.current;
    if (agentId) {
      dispatch({
        type: 'UPDATE_AGENT',
        payload: { id: agentId, updates: { status: 'idle', currentTaskId: undefined } },
      });
      dispatch({ type: 'ADD_LOG_ENTRY', payload: { id: generateId('log'), timestamp: new Date(), level: 'info', source: agentId, agentId, message: 'Execution cancelled', isStreaming: false } });
      dispatch({ type: 'END_STREAMING_LOG', payload: { agentId } });
    }
  }, [cancelStream, dispatch]);

  return {
    executeAgent,
    cancelExecution,
    isStreaming: isStreaming || isExecuting,
    resolveAgentRoleForPhase,
  };
}

function isFileOp(value: unknown): value is FileOp {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as { type?: unknown; path?: unknown; diff?: unknown };
  const validType = candidate.type === 'create' || candidate.type === 'modify' || candidate.type === 'delete';
  return validType && typeof candidate.path === 'string' && typeof candidate.diff === 'string';
}

function extractFileOps(text: string): FileOp[] {
  const matches = Array.from(text.matchAll(/\{[\s\S]*?"fileOps"[\s\S]*?\}/g));
  const candidate = matches.pop()?.[0];
  if (!candidate) return [];

  try {
    const parsed = JSON.parse(candidate) as unknown;
    if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as { fileOps?: unknown }).fileOps)) {
      return [];
    }
    const fileOps = (parsed as { fileOps: unknown[] }).fileOps;
    return fileOps.filter((op): op is FileOp => isFileOp(op));
  } catch {
    return [];
  }
}
