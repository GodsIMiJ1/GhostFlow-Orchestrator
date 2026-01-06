import type { ProviderId, RunPayload, TokenChunk, ModelInfo } from './types';
import { llmService, type ChatPayload } from '@/services/llm-service';

class ProviderRegistry {
  private activeProviderId: ProviderId = 'ollama';
  
  setActiveProvider(id: ProviderId) {
    this.activeProviderId = id;
  }
  
  getActiveProviderId(): ProviderId {
    return this.activeProviderId;
  }
  
  async isActiveProviderAvailable(): Promise<boolean> {
    const health = await llmService.checkHealth();
    return this.activeProviderId === 'ollama' 
      ? health.providers.ollama.available 
      : health.providers.openrouter.available;
  }
  
  async listActiveModels(): Promise<ModelInfo[]> {
    return llmService.listModels(this.activeProviderId);
  }
  
  async *run(payload: RunPayload): AsyncGenerator<TokenChunk, void, unknown> {
    const chatPayload: ChatPayload = {
      provider: this.activeProviderId,
      model: payload.model,
      messages: payload.messages,
      temperature: payload.temperature,
      maxTokens: payload.maxTokens,
    };
    
    yield* llmService.streamChat(chatPayload);
  }

  cancelStream(): void {
    llmService.cancelStream();
  }
}

export const providerRegistry = new ProviderRegistry();
