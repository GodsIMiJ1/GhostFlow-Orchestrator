import type { ModelProvider, ModelInfo, RunPayload, TokenChunk } from './types';

export class OpenRouterProvider implements ModelProvider {
  id = 'openrouter' as const;
  name = 'OpenRouter';
  
  private apiKey: string = '';
  private baseUrl = 'https://openrouter.ai/api/v1';
  
  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false;
    
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
  
  async listModels(): Promise<ModelInfo[]> {
    if (!this.apiKey) return [];
    
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
      });
      
      if (!response.ok) return [];
      
      const data = await response.json();
      return (data.data || []).slice(0, 50).map((model: { id: string; name?: string; context_length?: number }) => ({
        id: model.id,
        name: model.name || model.id,
        contextLength: model.context_length,
        provider: 'openrouter' as const,
      }));
    } catch {
      return [];
    }
  }
  
  async *run(payload: RunPayload): AsyncGenerator<TokenChunk, void, unknown> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key not configured');
    }
    
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: payload.model,
        messages: payload.messages,
        stream: true,
        temperature: payload.temperature ?? 0.7,
        max_tokens: payload.maxTokens ?? 2048,
      }),
    });
    
    if (!response.ok || !response.body) {
      throw new Error(`OpenRouter request failed: ${response.statusText}`);
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    try {
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            yield { content: '', done: true };
            return;
          }
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            yield { content, done: false };
          } catch {
            // Skip malformed chunks
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

export const openRouterProvider = new OpenRouterProvider();
