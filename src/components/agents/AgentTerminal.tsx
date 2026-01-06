import { useEffect, useRef, useState } from 'react';
import type { RegistryAgent } from '@/hooks/use-agent-registry';
import { AgentTerminalEntry } from '@/types/terminals';
import { TerminalEntry } from './TerminalEntry';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PanelRightClose } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentTerminalProps {
  agent: RegistryAgent | null;
  entries: AgentTerminalEntry[];
  currentPhase?: string;
  onToggleMCPPanel?: () => void;
  mcpPanelOpen?: boolean;
}

export function AgentTerminal({ 
  agent, 
  entries, 
  currentPhase,
  onToggleMCPPanel,
  mcpPanelOpen = false 
}: AgentTerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries, autoScroll]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isAtBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 50;
    setAutoScroll(isAtBottom);
  };

  if (!agent) {
    return (
      <div className="flex-1 flex items-center justify-center terminal-bg">
        <p className="text-muted-foreground/50 font-mono text-sm">
          Select an agent to view terminal
        </p>
      </div>
    );
  }

  const mcpCount = agent.mcpBindings?.length || 0;
  const statusLabel = getStatusLabel(agent);

  return (
    <div className="flex-1 flex flex-col terminal-bg">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-mono text-sm font-medium uppercase tracking-wider">
              {agent.name} Terminal
            </h2>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[11px] font-semibold",
                agent.runtimeStatus === 'running' && "bg-status-active/20 text-status-active",
                agent.runtimeStatus === 'done' && "bg-status-success/20 text-status-success",
                agent.runtimeStatus === 'error' && "bg-status-error/20 text-status-error",
                agent.runtimeStatus === 'idle' && "bg-muted/40 text-muted-foreground"
              )}
            >
              {statusLabel}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground/60">
            {currentPhase && (
              <span>Phase: <span className="text-muted-foreground">{currentPhase}</span></span>
            )}
            <span>Model: <span className="text-muted-foreground/40">{agent.model}</span></span>
            <span className="text-muted-foreground font-mono">{mcpCount} MCP</span>
            {onToggleMCPPanel && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onToggleMCPPanel}
              >
                <PanelRightClose className={`h-4 w-4 transition-transform ${mcpPanelOpen ? '' : 'rotate-180'}`} />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Terminal Body */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto py-2"
      >
        {entries.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground/30 font-mono text-sm">
              No activity yet
            </p>
          </div>
        ) : (
          entries.map((entry) => (
            <TerminalEntry key={entry.id} entry={entry} />
          ))
        )}
        
        {/* Blinking cursor when agent is working */}
        {(agent.status === 'working' || agent.runtimeStatus === 'running') && (
          <div className="px-4 py-1 font-mono text-sm">
            <span className="terminal-text animate-pulse">▌</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border/30 flex items-center justify-between">
        <span className="text-xs text-muted-foreground/40 font-mono">
          [ Terminal Locked ]
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled
              className="text-xs text-muted-foreground/30 font-mono"
            >
              [Enter Intervention Mode]
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Coming soon</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

function getStatusLabel(agent: RegistryAgent): string {
  switch (agent.runtimeStatus) {
    case 'running':
      return 'Running';
    case 'done':
      return 'Done';
    case 'error':
      return 'Error';
    default:
      return 'Idle';
  }
}
