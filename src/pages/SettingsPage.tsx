import { ThreePaneLayout } from '@/components/layout';
import { useOrchestration } from '@/context/OrchestrationContext';
import { useLLMProvider } from '@/hooks/use-llm-provider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ChevronDown, Zap, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { ProviderId, AgentRole } from '@/types';

export default function SettingsPage() {
  const { state, dispatch } = useOrchestration();
  const { settings } = state;
  const { executionEngine } = settings;
  
  const { checkConnection, isChecking, fetchModels, isFetchingModels } = useLLMProvider();
  
  const [activeProvider, setActiveProvider] = useState<ProviderId>(executionEngine.activeProvider);
  const [showModelAssignments, setShowModelAssignments] = useState(false);
  const [ollamaEndpoint, setOllamaEndpoint] = useState(executionEngine?.ollama?.endpoint ?? '');

  const isConnected = activeProvider === 'ollama' 
    ? executionEngine.ollama.isConnected 
    : executionEngine.openrouter.isConnected;

  // Note: Auto-fetching models disabled to prevent render loops
  // Models are fetched on-demand when user clicks Connect

  const handleProviderSwitch = (provider: ProviderId) => {
    setActiveProvider(provider);
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: {
        executionEngine: {
          ...executionEngine,
          activeProvider: provider,
        },
      },
    });
  };

  const handleTestConnection = async () => {
    // Update endpoint before testing
    if (activeProvider === 'ollama') {
      dispatch({
        type: 'UPDATE_SETTINGS',
        payload: {
          executionEngine: {
            ...executionEngine,
            ollama: {
              ...executionEngine.ollama,
              endpoint: ollamaEndpoint,
            },
          },
        },
      });
    }
    const health = await checkConnection();
    const providerAvailable = health
      ? activeProvider === 'ollama'
        ? health.providers.ollama.available
        : health.providers.openrouter.available
      : false;

    if (providerAvailable) {
      await fetchModels(activeProvider);
    }
  };

  const handleModelAssignment = (role: AgentRole, model: string) => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: {
        executionEngine: {
          ...executionEngine,
          modelAssignments: {
            ...executionEngine.modelAssignments,
            [role]: model,
          },
        },
      },
    });
  };

  const availableModels = executionEngine.availableModels.length > 0 
    ? executionEngine.availableModels 
    : ['llama3.2', 'codellama']; // Fallback for display

  return (
    <ThreePaneLayout>
      <div className="h-full p-6 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        
        <div className="space-y-6">
          {/* Execution Engine */}
          <section className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Execution Engine</h2>
            </div>
            
            <div className="space-y-4">
              {/* Provider Selector */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Provider</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleProviderSwitch('ollama')}
                    className={cn(
                      "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors",
                      activeProvider === 'ollama'
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    )}
                  >
                    Ollama
                  </button>
                  <button
                    onClick={() => handleProviderSwitch('openrouter')}
                    className={cn(
                      "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors",
                      activeProvider === 'openrouter'
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    )}
                  >
                    OpenRouter
                  </button>
                </div>
              </div>

              {/* Conditional Fields */}
              {activeProvider === 'ollama' ? (
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Endpoint URL</label>
                  <div className="flex gap-2">
                    <Input 
                      value={ollamaEndpoint}
                      onChange={(e) => setOllamaEndpoint(e.target.value)}
                      className="font-mono flex-1" 
                      placeholder="http://localhost:11434"
                    />
                    <Button 
                      variant={isConnected ? "outline" : "default"} 
                      className="gap-2"
                      onClick={handleTestConnection}
                      disabled={isChecking}
                    >
                      {isChecking ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <div className={cn(
                          "h-2 w-2 rounded-full",
                          isConnected ? "bg-status-success" : "bg-status-error"
                        )} />
                      )}
                      {isConnected ? "Connected" : "Connect"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Connects via GhostVault backend
                  </p>
                </div>
              ) : (
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">API Key</label>
                  <div className="flex gap-2">
                    <Input 
                      type="password"
                      disabled
                      className="font-mono flex-1" 
                      placeholder="Managed by GhostVault"
                    />
                    <Button 
                      variant={isConnected ? "outline" : "default"} 
                      className="gap-2"
                      onClick={handleTestConnection}
                      disabled={isChecking}
                    >
                      {isChecking ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <div className={cn(
                          "h-2 w-2 rounded-full",
                          isConnected ? "bg-status-success" : "bg-status-error"
                        )} />
                      )}
                      {isConnected ? "Connected" : "Verify"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    API key stored securely in GhostVault
                  </p>
                </div>
              )}

              {/* Model Assignments (Collapsed) */}
              <div className="pt-2">
                <button
                  onClick={() => setShowModelAssignments(!showModelAssignments)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
                >
                  <ChevronDown className={cn(
                    "h-4 w-4 transition-transform",
                    showModelAssignments && "rotate-180"
                  )} />
                  Model Assignments ({Object.keys(executionEngine.modelAssignments).length} agents)
                  {isFetchingModels && <Loader2 className="h-3 w-3 animate-spin ml-2" />}
                </button>
                
                {showModelAssignments && (
                  <div className="mt-3 space-y-2 pl-6 border-l-2 border-border">
                    {Object.entries(executionEngine.modelAssignments).map(([role, model]) => (
                      <div key={role} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{role.replace(/-/g, ' ')}</span>
                        <Select 
                          value={model} 
                          onValueChange={(value) => handleModelAssignment(role as AgentRole, value)}
                        >
                          <SelectTrigger className="w-40 h-8 text-xs font-mono">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {availableModels.map((m) => (
                              <SelectItem key={m} value={m} className="text-xs font-mono">
                                {m}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Approval Gates */}
          <section className="rounded-lg border bg-card p-4">
            <h2 className="font-semibold mb-4">Human Approval Gates</h2>
            <div className="space-y-3">
              {['spec', 'plan', 'code', 'review', 'qa'].map((phase) => (
                <div key={phase} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{phase} Phase</span>
                  <Switch defaultChecked={settings.project.humanApprovalGates.includes(phase as any)} />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </ThreePaneLayout>
  );
}
