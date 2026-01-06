import { useState, useEffect, useCallback, useRef } from 'react';
import type { LogEntry, PhaseType } from '@/types';
import type { TokenChunk } from '@/providers/types';
import { generateId } from '@/data/mock-data';

// Simulated agent outputs for demo mode
const MOCK_AGENT_OUTPUTS: Record<string, string[]> = {
  spec: [
    "Analyzing repository structure...\n",
    "Found 24 TypeScript files, 12 React components\n",
    "Identifying dependencies: react, react-router-dom, tailwindcss\n\n",
    "## Requirements Analysis\n\n",
    "### Functional Requirements\n",
    "1. Shopping cart must persist across sessions\n",
    "2. Users can add/remove items with quantity controls\n",
    "3. Cart displays subtotal with real-time updates\n\n",
    "### Technical Requirements\n",
    "- Use localStorage for persistence\n",
    "- Integrate with existing product catalog\n",
    "- Follow atomic design principles\n",
  ],
  plan: [
    "## Implementation Plan\n\n",
    "### Phase 1: Data Layer\n",
    "- [ ] Create CartItem interface\n",
    "- [ ] Implement useCart hook with localStorage\n",
    "- [ ] Add cart context provider\n\n",
    "### Phase 2: Components\n",
    "- [ ] CartButton - header cart icon with count\n",
    "- [ ] CartDrawer - slide-out cart panel\n",
    "- [ ] CartItem - individual item display\n",
    "- [ ] CartSummary - subtotal and checkout\n\n",
    "### Phase 3: Integration\n",
    "- [ ] Add to product cards\n",
    "- [ ] Connect checkout flow\n",
  ],
  code: [
    "Creating src/hooks/useCart.ts...\n",
    "```typescript\n",
    "export function useCart() {\n",
    "  const [items, setItems] = useState<CartItem[]>([]);\n",
    "  \n",
    "  const addItem = (product: Product) => {\n",
    "    setItems(prev => [...prev, { ...product, quantity: 1 }]);\n",
    "  };\n",
    "  \n",
    "  return { items, addItem, removeItem, updateQuantity };\n",
    "}\n",
    "```\n\n",
    "Creating src/components/CartDrawer.tsx...\n",
  ],
  review: [
    "## Code Review Summary\n\n",
    "### ✅ Strengths\n",
    "- Clean separation of concerns\n",
    "- Proper TypeScript types\n",
    "- Follows existing patterns\n\n",
    "### ⚠️ Suggestions\n",
    "- Consider debouncing quantity updates\n",
    "- Add error boundary for cart operations\n",
    "- Missing unit tests for edge cases\n\n",
    "### Approval: **CONDITIONAL**\n",
    "Address suggestions before merging.\n",
  ],
  qa: [
    "## QA Validation Report\n\n",
    "### Test Results\n",
    "- ✅ Add item to cart: PASS\n",
    "- ✅ Remove item from cart: PASS\n",
    "- ✅ Update quantity: PASS\n",
    "- ✅ Persistence across refresh: PASS\n",
    "- ✅ Empty cart state: PASS\n\n",
    "### Performance\n",
    "- Initial render: 12ms\n",
    "- Add item: 3ms\n",
    "- Memory usage: Stable\n\n",
    "### Verdict: **APPROVED** ✅\n",
  ],
};

interface UseMockStreamingOptions {
  enabled?: boolean;
  delayMin?: number;
  delayMax?: number;
}

export function useMockStreaming(options: UseMockStreamingOptions = {}) {
  const { enabled = true, delayMin = 20, delayMax = 80 } = options;
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<PhaseType | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const streamPhase = useCallback(async (phase: PhaseType, agentId: string) => {
    if (!enabled) return;
    
    // Abort any existing stream
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    setIsStreaming(true);
    setCurrentPhase(phase);
    
    const tokens = MOCK_AGENT_OUTPUTS[phase] || ['Processing...'];
    const logId = generateId('log');
    
    // Create initial log entry
    const initialLog: LogEntry = {
      id: logId,
      timestamp: new Date(),
      level: 'agent',
      source: agentId,
      agentId,
      phase,
      message: '',
      isStreaming: true,
    };
    
    setLogs(prev => [...prev, initialLog]);
    
    // Stream tokens
    for (const token of tokens) {
      if (signal.aborted) break;
      
      for (const char of token) {
        if (signal.aborted) break;
        
        await new Promise(resolve => 
          setTimeout(resolve, delayMin + Math.random() * (delayMax - delayMin))
        );
        
        setLogs(prev => 
          prev.map(log => 
            log.id === logId 
              ? { ...log, message: log.message + char }
              : log
          )
        );
      }
    }
    
    // Mark streaming complete
    setLogs(prev => 
      prev.map(log => 
        log.id === logId 
          ? { ...log, isStreaming: false }
          : log
      )
    );
    
    setIsStreaming(false);
    setCurrentPhase(null);
  }, [enabled, delayMin, delayMax]);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setCurrentPhase(null);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return {
    logs,
    isStreaming,
    currentPhase,
    streamPhase,
    stopStreaming,
    clearLogs,
  };
}

// Mock token stream for fallback scenarios (no UI side effects)
export async function* streamMockTokens(
  phase: PhaseType,
  options: { delayMin?: number; delayMax?: number; signal?: AbortSignal } = {}
): AsyncGenerator<TokenChunk, void, unknown> {
  const { delayMin = 20, delayMax = 80, signal } = options;
  const tokens = MOCK_AGENT_OUTPUTS[phase] || ['Processing...'];

  for (const token of tokens) {
    for (const char of token) {
      if (signal?.aborted) return;

      await new Promise((resolve) =>
        setTimeout(resolve, delayMin + Math.random() * (delayMax - delayMin))
      );

      if (signal?.aborted) return;
      yield { content: char, done: false };
    }
  }

  yield { content: '', done: true };
}
