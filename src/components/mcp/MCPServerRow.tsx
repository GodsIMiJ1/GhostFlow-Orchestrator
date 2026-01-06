import { MCPServer } from '@/types/mcp';
import { Switch } from '@/components/ui/switch';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MCPServerRowProps {
  server: MCPServer;
  onToggle: (id: string) => void;
}

const iconMap: Record<string, string> = {
  context7: '📚',
  graphiti: '🧠',
  linear: '📋',
  electron: '🖥️',
  puppeteer: '🌐',
  'auto-claude-tools': '⚡',
};

export function MCPServerRow({ server, onToggle }: MCPServerRowProps) {
  const restrictionLabel = server.restrictedTo?.length
    ? `(${server.restrictedTo.map(r => r.toUpperCase()).join(', ')} agents only)`
    : null;

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4 transition-all",
        !server.enabled && !server.locked && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl" role="img" aria-label={server.name}>
            {iconMap[server.id] || '🔧'}
          </span>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{server.name}</h3>
              {restrictionLabel && (
                <span className="text-xs text-muted-foreground">{restrictionLabel}</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{server.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {server.locked ? (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Lock className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">ON</span>
            </div>
          ) : (
            <Switch
              checked={server.enabled}
              onCheckedChange={() => onToggle(server.id)}
              aria-label={`Toggle ${server.name}`}
            />
          )}
        </div>
      </div>

      {!server.enabled && !server.locked && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <p className="text-xs text-muted-foreground/60">
            Disabled servers reduce context usage and startup time
          </p>
        </div>
      )}
    </div>
  );
}
