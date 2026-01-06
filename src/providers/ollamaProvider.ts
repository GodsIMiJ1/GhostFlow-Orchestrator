import type { ModelProvider, ModelInfo, RunPayload, TokenChunk } from './types';

export class OllamaProvider implements ModelProvider {
  id = 'ollama' as const;
  name = 'Ollama';
  
  private endpoint: string;
  
  constructor(endpoint: string = 'http://localhost:11434') {
    this.endpoint = endpoint;
  }
  
  setEndpoint(endpoint: string) {
    this.endpoint = endpoint;
  }
  
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.endpoint}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
  
  async listModels(): Promise<ModelInfo[]> {
    try {
      const response = await fetch(`${this.endpoint}/api/tags`);
      if (!response.ok) return [];
      
      const data = await response.json();
      return (data.models || []).map((model: { name: string; details?: { parameter_size?: string } }) => ({
        id: model.name,
        name: model.name,
        provider: 'ollama' as const,
      }));
    } catch {
      return [];
    }
  }
  
  async *run(payload: RunPayload): AsyncGenerator<TokenChunk, void, unknown> {
    const response = await fetch(`${this.endpoint}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: payload.model,
        messages: payload.messages,
        stream: true,
        options: {
          temperature: payload.temperature ?? 0.7,
          num_predict: payload.maxTokens ?? 2048,
        },
      }),
    });
    
    if (!response.ok || !response.body) {
      throw new Error(`Ollama request failed: ${response.statusText}`);
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const text = decoder.decode(value);
        const lines = text.split('\n').filter(Boolean);
        
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            yield {
              content: parsed.message?.content || '',
              done: parsed.done || false,
            };
          } catch {
            // Skip malformed lines
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

export const ollamaProvider = new OllamaProvider();
