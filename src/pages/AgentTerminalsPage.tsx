import { useEffect, useState } from 'react';
import { ThreePaneLayout } from '@/components/layout/ThreePaneLayout';
import { AgentSelector, AgentTerminal } from '@/components/agents';
import { MCPBindingsPanel } from '@/components/agents/MCPBindingsPanel';
import { useOrchestration } from '@/context/OrchestrationContext';
import { useAgentRegistry } from '@/hooks/use-agent-registry';
import { PHASE_AGENT_MAP } from '@/constants/phaseAgentMap';
import { cn } from '@/lib/utils';

export default function AgentTerminalsPage() {
  const { state, dispatch } = useOrchestration();
  const { registry } = useAgentRegistry();
  const { agents, activeTask, mcpServers } = state;

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [mcpPanelOpen, setMcpPanelOpen] = useState(false);

  useEffect(() => {
    if (!registry.length) return;
    if (!selectedAgentId || !registry.some((agent) => agent.id === selectedAgentId)) {
      setSelectedAgentId(registry[0].id);
    }
  }, [registry, selectedAgentId]);

  const selectedAgent = registry.find((agent) => agent.id === selectedAgentId) || null;

  const handleToggleBinding = (agentId: string, mcpId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) return;
    
    const currentBindings = agent.mcpBindings || [];
    const newBindings = currentBindings.includes(mcpId)
      ? currentBindings.filter((id) => id !== mcpId)
      : [...currentBindings, mcpId];
    
    dispatch({
      type: 'UPDATE_AGENT_MCP_BINDINGS',
      payload: { agentId, mcpIds: newBindings },
    });
  };

  return (
    <ThreePaneLayout>
      <div className="flex flex-col h-full">
        <div className="p-6 border-b border-border/50">
          <h1 className="text-2xl font-semibold tracking-tight">Agent Terminals</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Read-only view of agent execution
          </p>
        </div>

        <div className="flex-1 flex min-h-0">
          <div className="w-56 shrink-0">
            <AgentSelector
              agents={registry}
              selectedAgentId={selectedAgentId}
              onSelectAgent={setSelectedAgentId}
            />
          </div>
          <div className="flex-1 flex min-h-0">
            {registry.map((agent) => {
              const agentPhase =
                activeTask && PHASE_AGENT_MAP[activeTask.currentPhase] === agent.role
                  ? activeTask.currentPhase
                  : undefined;

              return (
                <div
                  key={agent.id}
                  className={cn(
                    "flex-1 min-w-0",
                    selectedAgentId === agent.id ? "flex" : "hidden"
                  )}
                >
                  <AgentTerminal
                    agent={agent}
                    entries={agent.terminalBuffer}
                    currentPhase={agentPhase}
                    onToggleMCPPanel={() => setMcpPanelOpen(!mcpPanelOpen)}
                    mcpPanelOpen={mcpPanelOpen}
                  />
                </div>
              );
            })}
          </div>
          {mcpPanelOpen && selectedAgent && (
            <MCPBindingsPanel
              agent={selectedAgent}
              mcpServers={mcpServers}
              onClose={() => setMcpPanelOpen(false)}
              onToggleBinding={handleToggleBinding}
            />
          )}
        </div>
      </div>
    </ThreePaneLayout>
  );
}
