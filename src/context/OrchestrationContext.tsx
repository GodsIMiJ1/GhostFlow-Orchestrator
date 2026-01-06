import React, { createContext, useContext, useReducer, useCallback, useEffect, ReactNode } from 'react';
import type {
  Agent,
  AgentTerminalEntry,
  LogEntry,
  AgentRole,
  AgentCategory,
  Phase,
  PhaseType,
  Project,
  FileOpProposal,
  Settings,
  Task,
  UIState,
} from '@/types';
import type { MCPServer } from '@/types/mcp';
import {
  DEFAULT_SETTINGS,
  DEFAULT_MCP_SERVERS,
  DEFAULT_AGENTS,
  generateId,
  createMockLogEntry,
  PHASE_ORDER,
} from '@/data/mock-data';
import { PHASE_AGENT_MAP } from '@/constants/phaseAgentMap';
import {
  loadTasks,
  saveTasks,
  loadSettings,
  saveSettings,
  loadAgents,
  saveAgents,
  loadUIState,
  saveUIState,
} from '@/hooks/use-persistence';
import { persistenceService } from '@/services/persistence-service';
import { useOrchestrationBootstrap } from '@/hooks/use-orchestration-bootstrap';
import { llmService } from '@/services/llm-service';

// ============================================
// State Types
// ============================================

export interface OrchestrationState {
  // Data
  projects: Project[];
  tasks: Task[];
  agents: Agent[];
  settings: Settings;
  mcpServers: MCPServer[];
  
  // UI State
  ui: UIState;
  
  // Active Context
  activeProject: Project | null;
  activeTask: Task | null;
  
  // Streaming State
  streamingLogs: LogEntry[];
  isStreaming: boolean;
  
  // Terminal Entries
  terminalEntries: AgentTerminalEntry[];
  
  // Connection State
  ollamaConnected: boolean;
  gitAvailable: boolean;

  // File operation proposals
  fileOpProposals: FileOpProposal[];
}

// ============================================
// Action Types
// ============================================

type OrchestrationAction =
  | { type: 'SET_PROJECTS'; payload: Project[] }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'SET_ACTIVE_PROJECT'; payload: string | null }
  | { type: 'SET_ACTIVE_TASK'; payload: string | null }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: { id: string; updates: Partial<Task> } }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'SET_TASK_PHASE'; payload: { taskId: string; phase: PhaseType } }
  | { type: 'UPDATE_PHASE'; payload: { taskId: string; phaseId: PhaseType; updates: Partial<Phase> } }
  | { type: 'ADD_LOG_ENTRY'; payload: LogEntry }
  | { type: 'CLEAR_LOGS'; payload?: string }
  | { type: 'SET_STREAMING'; payload: boolean }
  | { type: 'APPEND_STREAMING_TOKEN'; payload: { taskId: string; agentId: string; token: string } }
  | { type: 'UPDATE_AGENT'; payload: { id: string; updates: Partial<Agent> } }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<Settings> }
  | { type: 'TOGGLE_LEFT_SIDEBAR' }
  | { type: 'TOGGLE_RIGHT_SIDEBAR' }
  | { type: 'OPEN_RIGHT_SIDEBAR_WITH_TAB'; payload: UIState['rightSidebarActiveTab'] }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' | 'system' }
  | { type: 'SET_LOG_FILTERS'; payload: Partial<UIState['logFilters']> }
  | { type: 'SET_CONNECTION_STATUS'; payload: { ollamaConnected?: boolean; gitAvailable?: boolean } }
  | { type: 'ADD_TERMINAL_ENTRY'; payload: AgentTerminalEntry }
  | { type: 'CLEAR_TERMINAL_ENTRIES'; payload?: string }
  | { type: 'TOGGLE_MCP_SERVER'; payload: string }
  | { type: 'UPDATE_AGENT_MCP_BINDINGS'; payload: { agentId: string; mcpIds: string[] } }
  | { type: 'END_STREAMING_LOG'; payload?: { agentId?: string } }
  | { type: 'ADD_FILE_OP_PROPOSAL'; payload: FileOpProposal }
  | { type: 'UPDATE_FILE_OP_PROPOSAL'; payload: { id: string; updates: Partial<FileOpProposal> } }
  | { type: 'HYDRATE_STATE'; payload: Partial<OrchestrationState> };

// ============================================
// Initial State with Persistence
// ============================================
// Load persisted state or fall back to defaults
const persistedTasks = loadTasks();
const persistedSettings = loadSettings();
const persistedAgents = loadAgents();
const persistedUI = loadUIState();
const initialTasks = persistedTasks ?? [];
const initialAgents = ensureMappedAgents(persistedAgents ?? DEFAULT_AGENTS);

const initialState: OrchestrationState = {
  projects: [],
  tasks: initialTasks,
  agents: initialAgents,
  settings: persistedSettings ?? DEFAULT_SETTINGS,
  mcpServers: DEFAULT_MCP_SERVERS,
  ui: {
    leftSidebarOpen: persistedUI?.leftSidebarOpen ?? true,
    rightSidebarOpen: false,
    rightSidebarActiveTab: 'git',
    activeTaskId: initialTasks[0]?.id || null,
    activeProjectId: null,
    theme: persistedUI?.theme ?? 'dark',
    logFilters: {
      levels: ['info', 'warn', 'error', 'agent'],
      agents: [],
      search: '',
    },
  },
  activeProject: null,
  activeTask: initialTasks[0] || null,
  streamingLogs: [],
  isStreaming: false,
  terminalEntries: [],
  ollamaConnected: true,
  gitAvailable: true,
  fileOpProposals: [],
};

// ============================================
// Reducer
// ============================================

function orchestrationReducer(state: OrchestrationState, action: OrchestrationAction): OrchestrationState {
  switch (action.type) {
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload };

    case 'ADD_PROJECT': {
      const projects = [...state.projects, action.payload];
      return {
        ...state,
        projects,
        activeProject: action.payload,
        ui: { ...state.ui, activeProjectId: action.payload.id },
      };
    }

    case 'SET_ACTIVE_PROJECT': {
      const project = action.payload ? state.projects.find((p) => p.id === action.payload) || null : null;
      return {
        ...state,
        activeProject: project,
        ui: { ...state.ui, activeProjectId: action.payload },
      };
    }

    case 'SET_ACTIVE_TASK': {
      const task = action.payload ? state.tasks.find((t) => t.id === action.payload) || null : null;
      return {
        ...state,
        activeTask: task,
        ui: { ...state.ui, activeTaskId: action.payload },
      };
    }

    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };

    case 'UPDATE_TASK': {
      const tasks = state.tasks.map((t) =>
        t.id === action.payload.id ? { ...t, ...action.payload.updates, updatedAt: new Date() } : t
      );
      const activeTask = state.activeTask?.id === action.payload.id
        ? { ...state.activeTask, ...action.payload.updates, updatedAt: new Date() }
        : state.activeTask;
      return { ...state, tasks, activeTask };
    }

    case 'DELETE_TASK': {
      const tasks = state.tasks.filter((t) => t.id !== action.payload);
      const activeTask = state.activeTask?.id === action.payload ? null : state.activeTask;
      return { ...state, tasks, activeTask };
    }

    case 'SET_TASK_PHASE': {
      const tasks = state.tasks.map((t) => {
        if (t.id !== action.payload.taskId) return t;
        return { ...t, currentPhase: action.payload.phase, updatedAt: new Date() };
      });
      const activeTask = state.activeTask?.id === action.payload.taskId
        ? { ...state.activeTask, currentPhase: action.payload.phase, updatedAt: new Date() }
        : state.activeTask;
      return { ...state, tasks, activeTask };
    }

    case 'UPDATE_PHASE': {
      const tasks = state.tasks.map((t) => {
        if (t.id !== action.payload.taskId) return t;
        const phases = t.phases.map((p) =>
          p.id === action.payload.phaseId ? { ...p, ...action.payload.updates } : p
        );
        return { ...t, phases, updatedAt: new Date() };
      });
      const activeTask = state.activeTask?.id === action.payload.taskId
        ? {
            ...state.activeTask,
            phases: state.activeTask.phases.map((p) =>
              p.id === action.payload.phaseId ? { ...p, ...action.payload.updates } : p
            ),
            updatedAt: new Date(),
          }
        : state.activeTask;
      return { ...state, tasks, activeTask };
    }

    case 'ADD_LOG_ENTRY':
      return { ...state, streamingLogs: [...state.streamingLogs, action.payload] };

    case 'CLEAR_LOGS':
      return { ...state, streamingLogs: action.payload 
        ? state.streamingLogs.filter((l) => l.source !== action.payload)
        : []
      };

    case 'SET_STREAMING':
      return { ...state, isStreaming: action.payload };

    case 'APPEND_STREAMING_TOKEN': {
      const existingLog = state.streamingLogs.find(
        (l) => l.agentId === action.payload.agentId && l.isStreaming
      );
      if (existingLog) {
        return {
          ...state,
          streamingLogs: state.streamingLogs.map((l) =>
            l.id === existingLog.id ? { ...l, message: l.message + action.payload.token } : l
          ),
        };
      }
      return {
        ...state,
        streamingLogs: [
          ...state.streamingLogs,
          createMockLogEntry({
            agentId: action.payload.agentId,
            level: 'agent',
            source: action.payload.agentId,
            message: action.payload.token,
            isStreaming: true,
          }),
        ],
      };
    }
    
    case 'END_STREAMING_LOG': {
      const agentId = action.payload?.agentId;
      return {
        ...state,
        streamingLogs: state.streamingLogs.map((log) =>
          log.isStreaming && (!agentId || log.agentId === agentId)
            ? { ...log, isStreaming: false }
            : log
        ),
      };
    }

    case 'UPDATE_AGENT': {
      const agents = state.agents.map((a) =>
        a.id === action.payload.id ? { ...a, ...action.payload.updates } : a
      );
      return { ...state, agents };
    }

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };

    case 'TOGGLE_LEFT_SIDEBAR':
      return { ...state, ui: { ...state.ui, leftSidebarOpen: !state.ui.leftSidebarOpen } };

    case 'TOGGLE_RIGHT_SIDEBAR':
      return { ...state, ui: { ...state.ui, rightSidebarOpen: !state.ui.rightSidebarOpen } };

    case 'OPEN_RIGHT_SIDEBAR_WITH_TAB':
      return { 
        ...state, 
        ui: { 
          ...state.ui, 
          rightSidebarOpen: true, 
          rightSidebarActiveTab: action.payload 
        } 
      };

    case 'SET_THEME':
      return { ...state, ui: { ...state.ui, theme: action.payload } };

    case 'SET_LOG_FILTERS':
      return {
        ...state,
        ui: { ...state.ui, logFilters: { ...state.ui.logFilters, ...action.payload } },
      };

    case 'SET_CONNECTION_STATUS':
      return {
        ...state,
        ollamaConnected: action.payload.ollamaConnected ?? state.ollamaConnected,
        gitAvailable: action.payload.gitAvailable ?? state.gitAvailable,
      };

    case 'ADD_TERMINAL_ENTRY':
      return { ...state, terminalEntries: [...state.terminalEntries, action.payload] };

    case 'CLEAR_TERMINAL_ENTRIES':
      return {
        ...state,
        terminalEntries: action.payload
          ? state.terminalEntries.filter((e) => e.agentRole !== action.payload)
          : [],
      };

    case 'TOGGLE_MCP_SERVER':
      return {
        ...state,
        mcpServers: state.mcpServers.map((s) =>
          s.id === action.payload && !s.locked
            ? { ...s, enabled: !s.enabled }
            : s
        ),
      };

    case 'UPDATE_AGENT_MCP_BINDINGS':
      return {
        ...state,
        agents: state.agents.map((a) =>
          a.id === action.payload.agentId
            ? { ...a, mcpBindings: action.payload.mcpIds }
            : a
        ),
      };

    case 'ADD_FILE_OP_PROPOSAL':
      return {
        ...state,
        fileOpProposals: [...state.fileOpProposals, action.payload],
      };

    case 'UPDATE_FILE_OP_PROPOSAL':
      return {
        ...state,
        fileOpProposals: state.fileOpProposals.map((p) =>
          p.id === action.payload.id ? { ...p, ...action.payload.updates } : p
        ),
      };

    case 'HYDRATE_STATE': {
      const nextAgents = ensureMappedAgents(action.payload.agents ?? state.agents);
      const nextProjects = action.payload.projects ?? state.projects;
      const nextActiveProject = action.payload.activeProject
        ?? (action.payload.ui?.activeProjectId
          ? nextProjects.find((p) => p.id === action.payload.ui?.activeProjectId) || null
          : state.activeProject);
      const nextTasks = action.payload.tasks ?? state.tasks;
      const nextActiveTask = action.payload.activeTask
        ?? (action.payload.ui?.activeTaskId
          ? nextTasks.find((t) => t.id === action.payload.ui?.activeTaskId) || null
          : state.activeTask);

      return {
        ...state,
        ...action.payload,
        agents: nextAgents,
        projects: nextProjects,
        activeProject: nextActiveProject,
        activeTask: nextActiveTask,
        ui: {
          ...state.ui,
          ...action.payload.ui,
        },
      };
    }

    default:
      return state;
  }
}

// ============================================
// Context
// ============================================

interface OrchestrationContextValue {
  state: OrchestrationState;
  dispatch: React.Dispatch<OrchestrationAction>;
  
  // Convenience Actions
  setActiveProject: (projectId: string | null) => void;
  setActiveTask: (taskId: string | null) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'lastOpenedAt' | 'tasks'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  startPhase: (taskId: string, phase: PhaseType) => void;
  completePhase: (taskId: string, phase: PhaseType) => void;
  failPhase: (taskId: string, phase: PhaseType, error: string) => void;
  addLogEntry: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

function ensureMappedAgents(existing: Agent[]): Agent[] {
  const roster = [...existing];
  const mappedRoles = Object.values(PHASE_AGENT_MAP).filter((role): role is AgentRole => Boolean(role) && role !== 'fix');

  mappedRoles.forEach((role) => {
    if (!roster.some((agent) => agent.role === role)) {
      roster.push({
        id: `agent-${role}`,
        name: role.split('-').map(capitalize).join(' '),
        role,
        category: inferCategory(role),
        model: 'llama3.2',
        description: 'Auto-registered mapped agent',
        constraints: [],
        allowedTools: [],
        mcpBindings: [],
        isActive: true,
        status: 'idle',
      });
    }
  });

  return roster;
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

const OrchestrationContext = createContext<OrchestrationContextValue | null>(null);

// ============================================
// Provider
// ============================================

interface OrchestrationProviderProps {
  children: ReactNode;
}

export function OrchestrationProvider({ children }: OrchestrationProviderProps) {
  const [state, dispatch] = useReducer(orchestrationReducer, initialState);
  useOrchestrationBootstrap(state, {
    onHydrate: (snapshot) => {
      dispatch({
        type: 'HYDRATE_STATE',
        payload: {
          tasks: snapshot.tasks ?? state.tasks,
          agents: snapshot.agents ?? state.agents,
          settings: snapshot.settings ?? state.settings,
          terminalEntries: snapshot.terminalEntries ?? state.terminalEntries,
          streamingLogs: snapshot.streamingLogs ?? state.streamingLogs,
          projects: snapshot.projects ?? state.projects,
          fileOpProposals: snapshot.fileOpProposals ?? state.fileOpProposals,
          activeTask: snapshot.ui?.activeTaskId
            ? (snapshot.tasks ?? state.tasks).find((t) => t.id === snapshot.ui?.activeTaskId) || state.activeTask
            : state.activeTask,
          activeProject: snapshot.ui?.activeProjectId
            ? state.projects.find((p) => p.id === snapshot.ui?.activeProjectId) || state.activeProject
            : state.activeProject,
          ui: {
            ...state.ui,
            activeTaskId: snapshot.ui?.activeTaskId ?? state.ui.activeTaskId,
            activeProjectId: snapshot.ui?.activeProjectId ?? state.ui.activeProjectId,
          },
        },
      });
    },
  });

  // Persist state (silent, debounced, skip mid-stream)
  useEffect(() => {
    const hasStreamingLogs = state.streamingLogs.some((l) => l.isStreaming);
    const hasWorkingAgents = state.agents.some((a) => a.status === 'working');
    if (hasStreamingLogs || hasWorkingAgents) return;

    const timeout = setTimeout(() => {
      persistenceService.saveSnapshot({
        tasks: state.tasks,
        agents: state.agents,
        settings: state.settings,
        terminalEntries: state.terminalEntries,
        streamingLogs: state.streamingLogs.filter((l) => !l.isStreaming),
        projects: state.projects,
        fileOpProposals: state.fileOpProposals,
        ui: {
          activeTaskId: state.ui.activeTaskId,
          activeProjectId: state.ui.activeProjectId,
        },
      });

      // Legacy hints (tiny) - keep existing hooks for theme/sidebar
      saveUIState({
        theme: state.ui.theme,
        leftSidebarOpen: state.ui.leftSidebarOpen,
      });

      // Local fallbacks to remain backward compatible
      saveTasks(state.tasks);
      saveSettings(state.settings);
      saveAgents(state.agents);
    }, 750);

    return () => clearTimeout(timeout);
  }, [state]);
  const setActiveProject = useCallback((projectId: string | null) => {
    dispatch({ type: 'SET_ACTIVE_PROJECT', payload: projectId });
  }, []);

  const setActiveTask = useCallback((taskId: string | null) => {
    dispatch({ type: 'SET_ACTIVE_TASK', payload: taskId });
  }, []);

  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...task,
      id: generateId('task'),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    dispatch({ type: 'ADD_TASK', payload: newTask });
  }, []);

  const addProject = useCallback((project: Omit<Project, 'id' | 'createdAt' | 'lastOpenedAt' | 'tasks'>) => {
    const newProject: Project = {
      ...project,
      id: generateId('proj'),
      createdAt: new Date(),
      lastOpenedAt: new Date(),
      tasks: [],
    };
    dispatch({ type: 'ADD_PROJECT', payload: newProject });
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    dispatch({ type: 'UPDATE_TASK', payload: { id, updates } });
  }, []);

  const deleteTask = useCallback((id: string) => {
    dispatch({ type: 'DELETE_TASK', payload: id });
  }, []);

  const startPhase = useCallback((taskId: string, phase: PhaseType) => {
    dispatch({ type: 'SET_TASK_PHASE', payload: { taskId, phase } });
    dispatch({
      type: 'UPDATE_PHASE',
      payload: { taskId, phaseId: phase, updates: { status: 'active', startedAt: new Date() } },
    });
  }, []);

  const completePhase = useCallback((taskId: string, phase: PhaseType) => {
    dispatch({
      type: 'UPDATE_PHASE',
      payload: { taskId, phaseId: phase, updates: { status: 'completed', completedAt: new Date() } },
    });
  }, []);

  const failPhase = useCallback((taskId: string, phase: PhaseType, error: string) => {
    dispatch({
      type: 'UPDATE_PHASE',
      payload: { taskId, phaseId: phase, updates: { status: 'failed', error } },
    });
  }, []);

  const addLogEntry = useCallback((entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    dispatch({
      type: 'ADD_LOG_ENTRY',
      payload: { ...entry, id: generateId('log'), timestamp: new Date() },
    });
  }, []);

  const toggleLeftSidebar = useCallback(() => {
    dispatch({ type: 'TOGGLE_LEFT_SIDEBAR' });
  }, []);

  const toggleRightSidebar = useCallback(() => {
    dispatch({ type: 'TOGGLE_RIGHT_SIDEBAR' });
  }, []);

  const setTheme = useCallback((theme: 'light' | 'dark' | 'system') => {
    dispatch({ type: 'SET_THEME', payload: theme });
  }, []);

  const value: OrchestrationContextValue = {
    state,
    dispatch,
    setActiveProject,
    setActiveTask,
    addTask,
    addProject,
    updateTask,
    deleteTask,
    startPhase,
    completePhase,
    failPhase,
    addLogEntry,
    toggleLeftSidebar,
    toggleRightSidebar,
    setTheme,
  };

  useEffect(() => {
    let mounted = true;
    const provider = state.settings.executionEngine.activeProvider;
    (async () => {
      const models = await llmService.listModels(provider);
      if (!mounted) return;
      const modelNames = models.map((m) => m.id || m.name).filter(Boolean);
      const existingAssignments = state.settings.executionEngine.modelAssignments;
      const normalizedAssignments = { ...existingAssignments };
      if (modelNames[0]) {
        Object.keys(normalizedAssignments).forEach((roleKey) => {
          if (!normalizedAssignments[roleKey as keyof typeof normalizedAssignments]) {
            normalizedAssignments[roleKey as keyof typeof normalizedAssignments] = modelNames[0];
          }
        });
      }
      dispatch({
        type: 'UPDATE_SETTINGS',
        payload: {
          executionEngine: {
            ...state.settings.executionEngine,
            availableModels: modelNames,
            modelAssignments: normalizedAssignments,
          },
        },
      });
    })();

    return () => {
      mounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <OrchestrationContext.Provider value={value}>
      {children}
    </OrchestrationContext.Provider>
  );
}

// ============================================
// Hook
// ============================================

export function useOrchestration() {
  const context = useContext(OrchestrationContext);
  if (!context) {
    throw new Error('useOrchestration must be used within an OrchestrationProvider');
  }
  return context;
}
