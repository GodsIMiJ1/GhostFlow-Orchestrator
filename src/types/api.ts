// ============================================
// GhostFlow Orchestrator - API Contract Types
// Backend Implementation Reference
// ============================================

import type {
  AgentRole,
  GitDiff,
  GitStatus,
  LogEntry,
  Phase,
  PhaseType,
  Project,
  Settings,
  Task,
  ToolInvocation,
  ToolName,
} from './orchestrator';

// ============================================
// REST API Endpoints
// ============================================

// Health Check
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  ollamaConnected: boolean;
  gitAvailable: boolean;
  timestamp: string;
}

// Projects
export interface ListProjectsResponse {
  projects: Project[];
}

export interface CreateProjectRequest {
  name: string;
  path: string;
  description?: string;
}

export interface CreateProjectResponse {
  project: Project;
}

// Tasks
export interface ListTasksRequest {
  projectId: string;
  status?: Task['status'][];
}

export interface ListTasksResponse {
  tasks: Task[];
}

export interface CreateTaskRequest {
  projectId: string;
  title: string;
  description: string;
  humanApprovalGates?: PhaseType[];
}

export interface CreateTaskResponse {
  task: Task;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: Task['status'];
  humanApprovalRequired?: boolean;
}

export interface UpdateTaskResponse {
  task: Task;
}

// Task Execution
export interface StartTaskRequest {
  taskId: string;
  startFromPhase?: PhaseType;
}

export interface StartTaskResponse {
  task: Task;
  streamId: string; // WebSocket stream ID to listen to
}

export interface PauseTaskRequest {
  taskId: string;
}

export interface PauseTaskResponse {
  task: Task;
}

export interface CancelTaskRequest {
  taskId: string;
}

export interface CancelTaskResponse {
  task: Task;
}

export interface ApprovePhaseRequest {
  taskId: string;
  phase: PhaseType;
  approved: boolean;
  feedback?: string;
}

export interface ApprovePhaseResponse {
  task: Task;
}

export interface RetryPhaseRequest {
  taskId: string;
  phase: PhaseType;
}

export interface RetryPhaseResponse {
  task: Task;
}

// Ollama Integration
export interface OllamaModelsResponse {
  models: OllamaModel[];
}

export interface OllamaModel {
  name: string;
  size: number;
  digest: string;
  modifiedAt: string;
}

export interface OllamaChatRequest {
  model: string;
  messages: OllamaChatMessage[];
  stream: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    num_ctx?: number;
  };
}

export interface OllamaChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OllamaChatResponse {
  model: string;
  message: OllamaChatMessage;
  done: boolean;
  totalDuration?: number;
  promptEvalCount?: number;
  evalCount?: number;
}

// Streaming response (Server-Sent Events)
export interface OllamaStreamChunk {
  model: string;
  message: {
    role: 'assistant';
    content: string;
  };
  done: boolean;
}

// Git Operations
export interface GitStatusRequest {
  projectPath: string;
}

export interface GitStatusResponse {
  status: GitStatus;
}

export interface GitDiffRequest {
  projectPath: string;
  staged?: boolean;
  file?: string;
}

export interface GitDiffResponse {
  diff: GitDiff;
}

export interface GitBranchRequest {
  projectPath: string;
  branchName: string;
  checkout?: boolean;
}

export interface GitBranchResponse {
  branch: string;
  created: boolean;
}

export interface GitCommitRequest {
  projectPath: string;
  message: string;
  files?: string[]; // If empty, commit all staged
}

export interface GitCommitResponse {
  commitHash: string;
  message: string;
  filesCommitted: number;
}

export interface GitStageRequest {
  projectPath: string;
  files: string[];
}

export interface GitStageResponse {
  stagedFiles: string[];
}

// File Operations
export interface ReadFileRequest {
  path: string;
  encoding?: 'utf-8' | 'base64';
}

export interface ReadFileResponse {
  content: string;
  encoding: string;
  size: number;
}

export interface WriteFileRequest {
  path: string;
  content: string;
  encoding?: 'utf-8' | 'base64';
  createDirectories?: boolean;
}

export interface WriteFileResponse {
  path: string;
  written: boolean;
}

export interface SearchFilesRequest {
  projectPath: string;
  pattern: string; // glob or regex
  type?: 'glob' | 'regex';
  includeContent?: boolean;
  maxResults?: number;
}

export interface SearchFilesResponse {
  files: SearchResult[];
  totalMatches: number;
  truncated: boolean;
}

export interface SearchResult {
  path: string;
  matches?: SearchMatch[];
}

export interface SearchMatch {
  line: number;
  content: string;
  column?: number;
}

// Tool Execution
export interface ExecuteToolRequest {
  agentId: string;
  toolName: ToolName;
  arguments: Record<string, unknown>;
}

export interface ExecuteToolResponse {
  invocation: ToolInvocation;
}

// Settings
export interface GetSettingsResponse {
  settings: Settings;
}

export interface UpdateSettingsRequest {
  settings: Partial<Settings>;
}

export interface UpdateSettingsResponse {
  settings: Settings;
}

// ============================================
// WebSocket Events
// ============================================

export interface WSAgentOutputEvent {
  type: 'agent:output';
  payload: {
    taskId: string;
    agentId: string;
    phase: PhaseType;
    token: string;
    isComplete: boolean;
  };
}

export interface WSPhaseChangeEvent {
  type: 'phase:change';
  payload: {
    taskId: string;
    previousPhase: PhaseType | null;
    currentPhase: PhaseType;
    phaseData: Phase;
  };
}

export interface WSToolInvokedEvent {
  type: 'tool:invoked';
  payload: {
    taskId: string;
    invocation: ToolInvocation;
  };
}

export interface WSGitUpdatedEvent {
  type: 'git:updated';
  payload: {
    projectId: string;
    status: GitStatus;
  };
}

export interface WSTaskUpdatedEvent {
  type: 'task:updated';
  payload: {
    task: Task;
  };
}

export interface WSConnectionStatusEvent {
  type: 'connection:status';
  payload: {
    ollamaConnected: boolean;
    gitAvailable: boolean;
  };
}

export type WSEvent =
  | WSAgentOutputEvent
  | WSPhaseChangeEvent
  | WSToolInvokedEvent
  | WSGitUpdatedEvent
  | WSTaskUpdatedEvent
  | WSConnectionStatusEvent;

// ============================================
// Error Types
// ============================================

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export const ApiErrorCodes = {
  // General
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',

  // Ollama
  OLLAMA_UNAVAILABLE: 'OLLAMA_UNAVAILABLE',
  OLLAMA_MODEL_NOT_FOUND: 'OLLAMA_MODEL_NOT_FOUND',
  OLLAMA_TIMEOUT: 'OLLAMA_TIMEOUT',

  // Git
  GIT_NOT_REPOSITORY: 'GIT_NOT_REPOSITORY',
  GIT_CONFLICT: 'GIT_CONFLICT',
  GIT_BRANCH_EXISTS: 'GIT_BRANCH_EXISTS',
  GIT_UNCOMMITTED_CHANGES: 'GIT_UNCOMMITTED_CHANGES',

  // File System
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  FILE_ACCESS_DENIED: 'FILE_ACCESS_DENIED',
  PATH_TRAVERSAL_DETECTED: 'PATH_TRAVERSAL_DETECTED',

  // Task
  TASK_ALREADY_RUNNING: 'TASK_ALREADY_RUNNING',
  TASK_NOT_RUNNING: 'TASK_NOT_RUNNING',
  PHASE_ALREADY_COMPLETED: 'PHASE_ALREADY_COMPLETED',

  // Agent
  AGENT_NOT_FOUND: 'AGENT_NOT_FOUND',
  TOOL_NOT_PERMITTED: 'TOOL_NOT_PERMITTED',
} as const;
