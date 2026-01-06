import { useState, useMemo, useEffect } from 'react';
import { ThreePaneLayout } from '@/components/layout/ThreePaneLayout';
import { AgentSelector, AgentTerminal } from '@/components/agents';
import { MCPBindingsPanel } from '@/components/agents/MCPBindingsPanel';
import { useOrchestration } from '@/context/OrchestrationContext';

export default function AgentTerminalsPage() {
  const { state, dispatch } = useOrchestration();
  const { agents, terminalEntries, activeTask, mcpServers, settings } = state;
  
  // Find first agent with activity or default to first agent
  const defaultAgent = useMemo(() => {
    const agentWithActivity = agents.find(
      (a) => a.status !== 'idle' || terminalEntries.some((e) => e.agentRole === a.role)
    );
    return agentWithActivity?.id || agents[0]?.id || null;
  }, [agents, terminalEntries]);

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(defaultAgent);
  const [mcpPanelOpen, setMcpPanelOpen] = useState(false);

  const selectedAgent = agents.find((a) => a.id === selectedAgentId) || null;
  
  useEffect(() => {
    const workingAgent = agents.find((a) => a.status === 'working');
    if (workingAgent && workingAgent.id !== selectedAgentId) {
      setSelectedAgentId(workingAgent.id);
    }
  }, [agents, selectedAgentId]);
  
  const filteredEntries = useMemo(() => {
    if (!selectedAgent) return [];
    return terminalEntries.filter((e) => e.agentRole === selectedAgent.role);
  }, [terminalEntries, selectedAgent]);

  const currentPhase = useMemo(() => {
    return activeTask?.currentPhase;
  }, [activeTask]);

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
              agents={agents}
              selectedAgentId={selectedAgentId}
              onSelectAgent={setSelectedAgentId}
            />
          </div>
          <AgentTerminal
            agent={selectedAgent}
            entries={filteredEntries}
            currentPhase={currentPhase}
            onToggleMCPPanel={() => setMcpPanelOpen(!mcpPanelOpen)}
            mcpPanelOpen={mcpPanelOpen}
          />
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
