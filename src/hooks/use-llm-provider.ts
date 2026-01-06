import { useCallback, useRef, useState } from 'react';
import { useOrchestration } from '@/context/OrchestrationContext';
import { llmService, type ChatPayload, type HealthResponse } from '@/services/llm-service';
import type { ProviderId } from '@/types';
import type { TokenChunk } from '@/providers/types';

// ============================================
// Hook Return Type
// ============================================

interface UseLLMProviderReturn {
  // Connection
  checkConnection: () => Promise<HealthResponse | null>;
  isChecking: boolean;
  
  // Models
  fetchModels: (provider: ProviderId) => Promise<string[]>;
  isFetchingModels: boolean;
  
  // Streaming
  streamChat: (payload: ChatPayload) => AsyncGenerator<TokenChunk, void, unknown>;
  cancelStream: () => void;
  isStreaming: boolean;
}

// ============================================
// Hook Implementation
// ============================================

export function useLLMProvider(): UseLLMProviderReturn {
  const { state, dispatch } = useOrchestration();
  const { settings } = state;
  const [isChecking, setIsChecking] = useState(false);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const streamingRef = useRef(false);

  /**
   * Check connection to GhostVault and update provider status
   */
  const checkConnection = useCallback(async (): Promise<HealthResponse | null> => {
    setIsChecking(true);
    try {
      const health = await llmService.checkHealth();
      
      // Update connection status and provider availability
      dispatch({
        type: 'UPDATE_SETTINGS',
        payload: {
          executionEngine: {
            ...settings.executionEngine,
            ollama: {
              ...settings.executionEngine.ollama,
              isConnected: health.providers.ollama.available,
            },
            openrouter: {
              ...settings.executionEngine.openrouter,
              isConnected: health.providers.openrouter.available,
            },
          },
        },
      });

      dispatch({
        type: 'SET_CONNECTION_STATUS',
        payload: {
          ollamaConnected: health.providers.ollama.available,
        },
      });

      return health;
    } catch {
      // Silent failure - just update status
      dispatch({
        type: 'SET_CONNECTION_STATUS',
        payload: { ollamaConnected: false },
      });
      dispatch({
        type: 'UPDATE_SETTINGS',
        payload: {
          executionEngine: {
            ...settings.executionEngine,
            ollama: { ...settings.executionEngine.ollama, isConnected: false },
            openrouter: { ...settings.executionEngine.openrouter, isConnected: false },
          },
        },
      });

      return null;
    } finally {
      setIsChecking(false);
    }
  }, [dispatch, settings.executionEngine]);

  /**
   * Fetch available models for a provider
   */
  const fetchModels = useCallback(async (provider: ProviderId) => {
    setIsFetchingModels(true);
    try {
      const models = await llmService.listModels(provider);

      dispatch({
        type: 'UPDATE_SETTINGS',
        payload: {
          executionEngine: {
            ...settings.executionEngine,
            availableModels: models.map((m) => m.id || m.name),
          },
        },
      });

      return models.map((m) => m.id || m.name);
    } catch {
      dispatch({
        type: 'UPDATE_SETTINGS',
        payload: {
          executionEngine: {
            ...settings.executionEngine,
            availableModels: [],
          },
        },
      });
      return [];
    } finally {
      setIsFetchingModels(false);
    }
  }, [dispatch, settings.executionEngine]);

  /**
   * Async stream chat - streams from GhostVault
   */
  const streamChatAsync = useCallback(async function* (payload: ChatPayload): AsyncGenerator<TokenChunk, void, unknown> {
    setIsStreaming(true);
    streamingRef.current = true;
    
    try {
      for await (const chunk of llmService.streamChat(payload)) {
        if (!streamingRef.current) break;
        yield chunk;
        if (chunk.done) return;
      }
      throw new Error('Stream ended unexpectedly');
    } finally {
      setIsStreaming(false);
      streamingRef.current = false;
    }
  }, []);

  /**
   * Cancel ongoing stream
   */
  const cancelStream = useCallback(() => {
    streamingRef.current = false;
    llmService.cancelStream();
    setIsStreaming(false);
  }, []);

  return {
    checkConnection,
    isChecking,
    fetchModels,
    isFetchingModels,
    streamChat: streamChatAsync,
    cancelStream,
    isStreaming,
  };
}
