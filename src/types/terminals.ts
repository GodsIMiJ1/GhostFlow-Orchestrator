import { AgentRole, PhaseType, ToolName } from './orchestrator';

export type TerminalEntryType = 'output' | 'tool' | 'error' | 'boundary' | 'human-note';

export interface AgentTerminalEntry {
  id: string;
  agentRole: AgentRole;
  phase: PhaseType;
  type: TerminalEntryType;
  content: string;
  timestamp: number;
  toolName?: ToolName;
  toolArgs?: string;
}
