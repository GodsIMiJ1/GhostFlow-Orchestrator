import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, Trash2, Download, Pause, Play } from 'lucide-react';
import type { LogEntry, LogLevel, PhaseType } from '@/types';
import { PHASE_NAMES } from '@/data/mock-data';

interface StreamingLogProps {
  logs: LogEntry[];
  isStreaming?: boolean;
  onClear?: () => void;
  onPause?: () => void;
  isPaused?: boolean;
}

const LOG_LEVEL_STYLES: Record<LogLevel, { className: string; label: string }> = {
  info: { className: 'text-muted-foreground', label: 'INFO' },
  warn: { className: 'text-status-warning', label: 'WARN' },
  error: { className: 'text-status-error', label: 'ERROR' },
  debug: { className: 'text-muted-foreground/60', label: 'DEBUG' },
  agent: { className: 'text-primary', label: 'AGENT' },
};

export function StreamingLog({ logs, isStreaming, onClear, onPause, isPaused }: StreamingLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevels, setFilterLevels] = useState<LogLevel[]>(['info', 'warn', 'error', 'agent']);

  // Auto-scroll when new logs arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // Detect manual scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isAtBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 50;
    setAutoScroll(isAtBottom);
  };

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    if (!filterLevels.includes(log.level)) return false;
    if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex h-full flex-col terminal-bg rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-border/30 p-2 bg-card/50">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search logs..."
            className="h-8 pl-8 bg-background/50 border-border/50 text-sm"
          />
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onPause}
        >
          {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onClear}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Log Content */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-auto p-3 font-mono text-sm"
      >
        <div className="space-y-1">
          {filteredLogs.map((log) => (
            <LogLine key={log.id} log={log} />
          ))}
        </div>

        {/* Streaming cursor */}
        {isStreaming && (
          <span className="typing-cursor inline-block ml-1" />
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between border-t border-border/30 px-3 py-1.5 text-xs text-muted-foreground bg-card/50">
        <span>{filteredLogs.length} entries</span>
        {!autoScroll && (
          <button
            onClick={() => {
              setAutoScroll(true);
              scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
            }}
            className="text-primary hover:underline"
          >
            Jump to bottom
          </button>
        )}
        {isStreaming && (
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-status-active animate-pulse" />
            Streaming
          </span>
        )}
      </div>
    </div>
  );
}

interface LogLineProps {
  log: LogEntry;
}

function LogLine({ log }: LogLineProps) {
  const levelStyle = LOG_LEVEL_STYLES[log.level];
  const timestamp = formatTimestamp(log.timestamp);

  return (
    <div className={cn("flex gap-2 leading-relaxed animate-stream-in", log.isStreaming && "opacity-90")}>
      {/* Timestamp */}
      <span className="text-muted-foreground/50 flex-shrink-0 w-20">
        {timestamp}
      </span>

      {/* Level */}
      <span className={cn("flex-shrink-0 w-12 font-semibold", levelStyle.className)}>
        [{levelStyle.label}]
      </span>

      {/* Source/Agent */}
      {log.agentId && (
        <span className={cn("flex-shrink-0 font-medium", getAgentColor(log.agentId))}>
          {log.source}:
        </span>
      )}

      {/* Phase */}
      {log.phase && (
        <span className={cn("flex-shrink-0 text-xs px-1.5 py-0.5 rounded", `phase-${log.phase}`, "bg-muted/50")}>
          {PHASE_NAMES[log.phase]}
        </span>
      )}

      {/* Message */}
      <span className="terminal-text flex-1 whitespace-pre-wrap break-words">
        {formatMessage(log.message)}
      </span>
    </div>
  );
}

function formatTimestamp(date: Date): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function getAgentColor(agentId: string): string {
  if (agentId.includes('spec')) return 'text-agent-spec';
  if (agentId.includes('planner')) return 'text-agent-planner';
  if (agentId.includes('coder')) return 'text-agent-coder';
  if (agentId.includes('reviewer')) return 'text-agent-reviewer';
  if (agentId.includes('qa')) return 'text-agent-qa';
  return 'text-primary';
}

function formatMessage(message: string): string {
  // Could add syntax highlighting or markdown parsing here
  return message;
}
