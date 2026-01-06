// ============================================
// Provider Abstraction Layer - Type Definitions
// ============================================

export type ProviderId = 'ollama' | 'openrouter';

export interface ModelInfo {
  id: string;
  name: string;
  contextLength?: number;
  provider: ProviderId;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface RunPayload {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface TokenChunk {
  content: string;
  done: boolean;
}

export interface ModelProvider {
  id: ProviderId;
  name: string;
  isAvailable(): Promise<boolean>;
  listModels(): Promise<ModelInfo[]>;
  run(payload: RunPayload): AsyncGenerator<TokenChunk, void, unknown>;
}

// Settings structure for execution engine
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
  availableModels: ModelInfo[];
  modelAssignments: Record<string, string>;
}
