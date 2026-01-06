import { ThreePaneLayout } from '@/components/layout';
import { useOrchestration } from '@/context/OrchestrationContext';
import { cn } from '@/lib/utils';
import { Bot, Settings } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { AgentCategory, Agent } from '@/types/orchestrator';

const CATEGORY_LABELS: Record<AgentCategory, string> = {
  'spec-creation': 'Spec Creation',
  'build': 'Build',
  'utility': 'Utility',
  'insights': 'Insights',
  'ideation': 'Ideation',
};

const CATEGORY_ORDER: AgentCategory[] = ['spec-creation', 'build', 'utility', 'insights', 'ideation'];

function getPhaseColor(role: string): string {
  if (role.startsWith('spec')) return 'phase-spec';
  if (role === 'planner') return 'phase-plan';
  if (role === 'coder' || role === 'qa-fixer' || role === 'merge-resolver') return 'phase-code';
  if (role.includes('review') || role === 'pr-reviewer' || role === 'commit-agent') return 'phase-review';
  if (role.startsWith('qa')) return 'phase-qa';
  if (role === 'analysis' || role === 'batch-analysis') return 'phase-spec';
  if (role === 'ideation' || role === 'roadmap-discovery') return 'phase-plan';
  return 'muted-foreground';
}

export default function AgentsPage() {
  const { state } = useOrchestration();
  const { agents } = state;
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);

  const groupedAgents = useMemo(() => {
    const groups: Record<AgentCategory, Agent[]> = {
      'spec-creation': [],
      'build': [],
      'utility': [],
      'insights': [],
      'ideation': [],
    };
    agents.forEach((agent) => {
      if (groups[agent.category]) {
        groups[agent.category].push(agent);
      }
    });
    return groups;
  }, [agents]);

  return (
    <ThreePaneLayout>
      <div className="h-full p-6 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-6">Agent Inspector</h1>
        
        <div className="space-y-8">
          {CATEGORY_ORDER.map((category) => {
            const categoryAgents = groupedAgents[category];
            if (!categoryAgents || categoryAgents.length === 0) return null;
            
            return (
              <div key={category}>
                <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  {CATEGORY_LABELS[category]}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {categoryAgents.map((agent) => {
                    const phaseColor = getPhaseColor(agent.role);
                    return (
                      <div
                        key={agent.id}
                        onMouseEnter={() => setHoveredAgent(agent.id)}
                        onMouseLeave={() => setHoveredAgent(null)}
                        className={cn(
                          "rounded-lg border bg-card p-3 transition-all relative",
                          agent.status === 'working' && "ring-2 ring-status-active"
                        )}
                      >
                        {/* Header Row */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className={cn("p-1.5 rounded-md", `bg-${phaseColor}/10`)}>
                              <Bot className={cn("h-4 w-4", `text-${phaseColor}`)} />
                            </div>
                            <h3 className="font-medium text-sm">{agent.name}</h3>
                          </div>
                          
                          {/* Status + MCP Badge */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground font-mono">
                              {agent.mcpBindings?.length || 0} MCP
                            </span>
                            <div className={cn(
                              "h-2 w-2 rounded-full",
                              agent.status === 'working' && "bg-status-active animate-pulse",
                              agent.status === 'idle' && "bg-muted-foreground/30",
                              agent.status === 'waiting' && "bg-status-warning",
                              agent.status === 'error' && "bg-status-error"
                            )} />
                          </div>
                        </div>

                        {/* Model name - appears on hover */}
                        <div className={cn(
                          "absolute bottom-2 right-2 flex items-center gap-1.5 text-xs text-muted-foreground/60 transition-opacity",
                          hoveredAgent === agent.id ? "opacity-100" : "opacity-0"
                        )}>
                          <span className="font-mono">{agent.model}</span>
                          <Link 
                            to="/settings" 
                            className="p-0.5 rounded hover:bg-secondary transition-colors"
                            title="Edit in Settings"
                          >
                            <Settings className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ThreePaneLayout>
  );
}