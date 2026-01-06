// ============================================
// GhostFlow Orchestrator - Core Type Definitions
// ============================================

// Provider Types
export type ProviderId = 'ollama' | 'openrouter';

// Phase Types
export type PhaseType = 'spec' | 'plan' | 'code' | 'qa' | 'review';

export type PhaseStatus = 'pending' | 'active' | 'completed' | 'failed' | 'skipped';

export interface Phase {
  id: PhaseType;
  name: string;
  status: PhaseStatus;
  startedAt?: Date;
  completedAt?: Date;
  artifact?: PhaseArtifact;
  error?: string;
}

export interface PhaseArtifact {
  type: 'markdown' | 'json' | 'code' | 'diff';
  content: string;
  metadata?: Record<string, unknown>;
}

// Task Types
export type TaskStatus = 'backlog' | 'ready' | 'in_progress' | 'blocked' | 'completed' | 'failed';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  currentPhase: PhaseType;
  phases: Phase[];
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
  assignedAgents: string[];
  logs: LogEntry[];
  branch?: string;
  humanApprovalRequired: boolean;
  humanApprovalPhase?: PhaseType;
}

// Agent Types
export type AgentRole = 
  // Spec Creation
  | 'spec-gatherer' | 'spec-researcher' | 'spec-writer' | 'spec-critic'
  | 'spec-discovery' | 'spec-context' | 'spec-validation'
  // Build
  | 'planner' | 'coder' | 'qa' | 'qa-reviewer' | 'qa-fixer'
  // Utility
  | 'pr-reviewer' | 'commit-agent' | 'merge-resolver'
  // Insights
  | 'analysis' | 'batch-analysis'
  // Ideation
  | 'ideation' | 'roadmap-discovery'
  // Legacy (keep for compatibility)
  | 'spec' | 'reviewer';

export type AgentCategory = 'spec-creation' | 'build' | 'utility' | 'insights' | 'ideation';

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  category: AgentCategory;
  model: string;
  description: string;
  constraints: string[];
  allowedTools: ToolName[];
  mcpBindings: string[];
  isActive: boolean;
  status: 'idle' | 'working' | 'waiting' | 'error';
  currentTaskId?: string;
}

// Tool Types
export type ToolName = 
  | 'readFile'
  | 'searchFiles'
  | 'writeFile'
  | 'applyPatch'
  | 'runCommand'
  | 'gitDiff'
  | 'gitStatus'
  | 'gitBranch'
  | 'gitCommit';

export interface Tool {
  name: ToolName;
  description: string;
  parameters: ToolParameter[];
  restrictedTo?: AgentRole[];
}

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
}

export interface ToolInvocation {
  id: string;
  timestamp: Date;
  agentId: string;
  toolName: ToolName;
  arguments: Record<string, unknown>;
  result?: unknown;
  error?: string;
  duration?: number;
}

// Git Types
export type GitFileStatus = 'added' | 'modified' | 'deleted' | 'renamed' | 'untracked';

export interface GitFile {
  path: string;
  status: GitFileStatus;
  staged: boolean;
  additions?: number;
  deletions?: number;
}

export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  files: GitFile[];
  isClean: boolean;
  hasConflicts: boolean;
}

export interface GitDiff {
  files: GitDiffFile[];
  totalAdditions: number;
  totalDeletions: number;
}

export interface GitDiffFile {
  path: string;
  oldPath?: string;
  status: GitFileStatus;
  hunks: DiffHunk[];
}

export interface DiffHunk {
  header: string;
  lines: DiffLine[];
}

export interface DiffLine {
  type: 'addition' | 'deletion' | 'context';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

// Log Types
export type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'agent';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  source: string;
  message: string;
  agentId?: string;
  phase?: PhaseType;
  toolInvocation?: ToolInvocation;
  isStreaming?: boolean;
}

// Project Types
export interface Project {
  id: string;
  name: string;
  path: string;
  hasGit?: boolean;
  description?: string;
  createdAt: Date;
  lastOpenedAt: Date;
  tasks: Task[];
  gitStatus?: GitStatus;
}

// File Operations (proposals only)
export type FileOpType = 'create' | 'modify' | 'delete';

export interface FileOp {
  type: FileOpType;
  path: string;
  diff: string;
}

export interface FileOpProposal {
  id: string;
  ops: FileOp[];
  taskId?: string;
  agentRole?: AgentRole;
  projectId?: string | null;
  repoPath?: string | null;
  hasGit?: boolean;
  createdAt: number;
  status: 'pending' | 'applied' | 'rejected' | 'error';
  error?: string;
}

// Settings Types
export interface ExecutionEngineSettings {
  activeProvider: ProviderId;
  ollama: {
    endpoint: string;
    isConnected: boolean;
  };
  openrouter: {
    apiKey: string;
    isConnected: boolean;
  };
  availableModels: string[];
  modelAssignments: Record<AgentRole, string>;
}

export interface ToolPermissions {
  agentPermissions: Record<string, ToolName[]>;
  commandWhitelist: string[];
  pathRestrictions: string[];
}

export interface ProjectSettings {
  branchNamingPattern: string;
  autoCommit: boolean;
  phaseTimeouts: Record<PhaseType, number>;
  humanApprovalGates: PhaseType[];
}

export interface Settings {
  executionEngine: ExecutionEngineSettings;
  toolPermissions: ToolPermissions;
  project: ProjectSettings;
}

// API Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface StreamEvent {
  type: 'token' | 'tool_call' | 'phase_change' | 'complete' | 'error';
  payload: unknown;
  timestamp: Date;
}

// WebSocket Event Types
export type WebSocketEventType = 
  | 'agent:output'
  | 'phase:change'
  | 'tool:invoked'
  | 'git:updated'
  | 'task:updated'
  | 'connection:status';

export interface WebSocketEvent {
  type: WebSocketEventType;
  payload: unknown;
  timestamp: Date;
}

// UI State Types
export type RightSidebarTab = 'git' | 'agents' | 'config';

export interface UIState {
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  rightSidebarActiveTab: RightSidebarTab;
  activeTaskId: string | null;
  activeProjectId: string | null;
  theme: 'light' | 'dark' | 'system';
  logFilters: {
    levels: LogLevel[];
    agents: string[];
    search: string;
  };
}
