import type { AgentRole } from './orchestrator';

export interface MCPServer {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  locked?: boolean;
  restrictedTo?: AgentRole[];
}

export interface MCPState {
  servers: MCPServer[];
}
