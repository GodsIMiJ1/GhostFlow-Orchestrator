import { AgentTerminalEntry } from '@/types/terminals';
import { cn } from '@/lib/utils';

interface TerminalEntryProps {
  entry: AgentTerminalEntry;
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function TerminalEntry({ entry }: TerminalEntryProps) {
  const timestamp = formatTimestamp(entry.timestamp);

  if (entry.type === 'boundary') {
    return (
      <div className="flex items-center gap-4 py-2 px-4">
        <div className="flex-1 border-t border-dashed border-border/50" />
        <span className="text-xs text-muted-foreground/60 uppercase tracking-wider">
          {entry.content}
        </span>
        <div className="flex-1 border-t border-dashed border-border/50" />
      </div>
    );
  }

  return (
    <div className="flex gap-3 px-4 py-1 font-mono text-sm">
      <span className="text-muted-foreground/50 text-xs w-20 shrink-0">
        {timestamp}
      </span>
      <span
        className={cn(
          "flex-1",
          entry.type === 'output' && "terminal-text",
          entry.type === 'tool' && "text-accent pl-2",
          entry.type === 'error' && "text-status-error",
          entry.type === 'human-note' && "text-muted-foreground italic"
        )}
      >
        {entry.type === 'tool' && (
          <span className="text-muted-foreground mr-2">▸</span>
        )}
        {entry.type === 'tool' && entry.toolName && (
          <span className="text-primary mr-2">{entry.toolName}:</span>
        )}
        {entry.content}
      </span>
    </div>
  );
}
