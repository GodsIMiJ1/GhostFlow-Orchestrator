// ============================================
// GhostVault LLM Service Layer
// ============================================

import type { ProviderId } from '@/types';
import type { ModelInfo, ChatMessage, TokenChunk } from '@/providers/types';

// ============================================
// Configuration
// ============================================

const DEFAULT_GHOSTVAULT_URL =
  (import.meta.env.DEV ? '/api/llm' : 'http://localhost:3001/api/llm');
const GHOSTVAULT_URL = (import.meta.env.VITE_GHOSTVAULT_URL as string | undefined) || DEFAULT_GHOSTVAULT_URL;

// ============================================
// Types
// ============================================

export interface HealthResponse {
  status: 'ok' | 'error';
  providers: {
    ollama: { available: boolean };
    openrouter: { available: boolean };
  };
}

export interface ModelsResponse {
  provider: ProviderId;
  models: ModelInfo[];
}

export interface ChatPayload {
  provider: ProviderId;
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  metadata?: {
    taskId?: string;
    agent?: string;
    phase?: string;
    projectId?: string | null;
    repoPath?: string | null;
    hasGit?: boolean;
  };
}

export interface StreamError {
  message: string;
}

// ============================================
// LLM Service
// ============================================

class LLMService {
  private baseUrl: string;
  private abortController: AbortController | null = null;

  constructor(baseUrl: string = GHOSTVAULT_URL) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  /**
   * Check health and availability of providers
   */
  async checkHealth(): Promise<HealthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return {
          status: 'error',
          providers: {
            ollama: { available: false },
            openrouter: { available: false },
          },
        };
      }

      const data = await response.json();
      // Normalize to expected shape
      const ollamaAvailable =
        (typeof data?.ok === 'boolean' && data.ok && data?.ollama?.ok !== false) ||
        data?.providers?.ollama?.available === true;
      const openrouterAvailable = data?.providers?.openrouter?.available === true;

      return {
        status: data?.ok === false ? 'error' : 'ok',
        providers: {
          ollama: { available: ollamaAvailable },
          openrouter: { available: openrouterAvailable },
        },
      };
    } catch (error) {
      // GhostVault not reachable
      return {
        status: 'error',
        providers: {
          ollama: { available: false },
          openrouter: { available: false },
        },
      };
    }
  }

  /**
   * List available models for a provider
   */
  async listModels(provider: ProviderId): Promise<ModelInfo[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models?provider=${provider}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return [];
      }

      const data: ModelsResponse = await response.json();
      return (data.models || []).map((model) => ({
        provider,
        ...model,
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Stream chat completion from GhostVault
   * Parses SSE events and yields TokenChunks
   */
  async *streamChat(payload: ChatPayload): AsyncGenerator<TokenChunk, void, unknown> {
    this.abortController = new AbortController();

    try {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify(payload),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`GhostVault returned ${response.status}`);
      }

      if (!response.body) {
        throw new Error('GhostVault response body missing');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          // Process any remaining buffer
          if (buffer.trim()) {
            const chunk = this.parseSSEBuffer(buffer);
            if (chunk) yield chunk;
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE events (double newline separated)
        const events = buffer.split('\n\n');
        buffer = events.pop() || ''; // Keep incomplete event in buffer

        for (const event of events) {
          const chunk = this.parseSSEEvent(event);
          if (chunk) {
            yield chunk;
            if (chunk.done) {
              return;
            }
          }
        }
      }

      // Final done signal if not already sent
      yield { content: '', done: true };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      throw error;
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Cancel ongoing stream
   */
  cancelStream(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Parse a single SSE event
   * Format:
   *   event: token
   *   data: {"content":"...", "done":false}
   */
  private parseSSEEvent(event: string): TokenChunk | null {
    const lines = event.trim().split('\n');
    let eventType = '';
    let data = '';

    for (const line of lines) {
      if (line.startsWith('event:')) {
        eventType = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        data = line.slice(5).trim();
      }
    }

    // Handle error events
    if (eventType === 'error') {
      try {
        const parsed = JSON.parse(data) as StreamError;
        return { content: `Error: ${parsed.message}`, done: true };
      } catch {
        return { content: `Error: ${data}`, done: true };
      }
    }

    // Handle end events
    if (eventType === 'end') {
      return { content: '', done: true };
    }

    // Handle token events
    if (eventType === 'token' || data) {
      try {
        const parsed = JSON.parse(data) as TokenChunk & { token?: string };
        // Normalize token field to content
        if (parsed.token && !parsed.content) {
          return { content: parsed.token, done: Boolean((parsed as any).done) };
        }
        return parsed;
      } catch {
        // If not JSON, treat as raw content
        if (data && data !== '[DONE]') {
          return { content: data, done: false };
        }
      }
    }

    return null;
  }

  /**
   * Parse remaining buffer content
   */
  private parseSSEBuffer(buffer: string): TokenChunk | null {
    return this.parseSSEEvent(buffer);
  }
}

// Export singleton instance
export const llmService = new LLMService();

// Export class for testing or custom instances
export { LLMService };
