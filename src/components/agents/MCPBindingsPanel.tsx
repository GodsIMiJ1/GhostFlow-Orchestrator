import { Agent, AgentRole } from '@/types/orchestrator';
import { MCPServer } from '@/types/mcp';
import { Switch } from '@/components/ui/switch';
import { Lock, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface MCPBindingsPanelProps {
  agent: Agent;
  mcpServers: MCPServer[];
  onClose: () => void;
  onToggleBinding: (agentId: string, mcpId: string) => void;
}

const QA_ROLES: AgentRole[] = ['qa', 'qa-reviewer', 'qa-fixer'];

export function MCPBindingsPanel({ 
  agent, 
  mcpServers, 
  onClose,
  onToggleBinding 
}: MCPBindingsPanelProps) {
  const isQAAgent = QA_ROLES.includes(agent.role);

  return (
    <div className="w-64 border-l border-border/50 flex flex-col bg-card/50">
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        <h3 className="text-sm font-medium">MCP for {agent.name.split(' ')[0]}</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {mcpServers.map((server) => {
          const isRestricted = server.restrictedTo && !server.restrictedTo.includes(agent.role);
          const isDisabled = isRestricted || server.locked || !server.enabled;
          const isBound = agent.mcpBindings?.includes(server.id);

          return (
            <div
              key={server.id}
              className={cn(
                "flex items-center justify-between p-2 rounded-lg",
                isDisabled && "opacity-50"
              )}
            >
              <span className={cn(
                "text-sm",
                isBound && !isDisabled && "text-foreground",
                !isBound || isDisabled ? "text-muted-foreground" : ""
              )}>
                {isBound && !isDisabled && <span className="text-status-success mr-1.5">✓</span>}
                {server.name}
              </span>
              
              {server.locked ? (
                <Lock className="h-3 w-3 text-muted-foreground" />
              ) : isRestricted ? (
                <span className="text-xs text-muted-foreground/60">QA only</span>
              ) : !server.enabled ? (
                <span className="text-xs text-muted-foreground/60">disabled</span>
              ) : (
                <Switch
                  checked={isBound}
                  onCheckedChange={() => onToggleBinding(agent.id, server.id)}
                  className="scale-75"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
