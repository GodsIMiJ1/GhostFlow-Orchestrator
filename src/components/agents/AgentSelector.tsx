import { Agent, AgentCategory } from '@/types/orchestrator';
import { cn } from '@/lib/utils';
import { AgentCategoryGroup } from './AgentCategoryGroup';

interface AgentSelectorProps {
  agents: Agent[];
  selectedAgentId: string | null;
  onSelectAgent: (agentId: string) => void;
}

function getStatusColor(status: Agent['status']): string {
  switch (status) {
    case 'working':
      return 'bg-status-active';
    case 'error':
      return 'bg-status-error';
    case 'idle':
    default:
      return 'bg-muted-foreground/30';
  }
}

const CATEGORY_ORDER: AgentCategory[] = ['spec-creation', 'build', 'utility', 'insights', 'ideation'];

export function AgentSelector({ agents, selectedAgentId, onSelectAgent }: AgentSelectorProps) {
  const groupedAgents = agents.reduce((acc, agent) => {
    if (!acc[agent.category]) {
      acc[agent.category] = [];
    }
    acc[agent.category].push(agent);
    return acc;
  }, {} as Record<AgentCategory, Agent[]>);

  return (
    <div className="flex flex-col h-full border-r border-border/50">
      <div className="p-4 border-b border-border/50">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Agents
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {CATEGORY_ORDER.map((category) => {
          const categoryAgents = groupedAgents[category];
          if (!categoryAgents || categoryAgents.length === 0) return null;

          return (
            <AgentCategoryGroup key={category} category={category} defaultOpen={category === 'build'}>
              {categoryAgents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => onSelectAgent(agent.id)}
                  className={cn(
                    "w-full flex items-center justify-between gap-2 px-4 py-2 text-left transition-colors",
                    "hover:bg-accent/10",
                    selectedAgentId === agent.id && "bg-accent/20 border-l-2 border-primary"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full shrink-0",
                        getStatusColor(agent.status),
                        agent.status === 'working' && "animate-pulse"
                      )}
                    />
                    <span className="text-sm text-foreground truncate">
                      {agent.name}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground/50 font-mono shrink-0">
                    {agent.mcpBindings?.length || 0}
                  </span>
                </button>
              ))}
            </AgentCategoryGroup>
          );
        })}
      </div>
    </div>
  );
}