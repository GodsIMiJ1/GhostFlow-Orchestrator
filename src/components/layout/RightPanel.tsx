import { GitBranch, GitCommit, FileCode, FilePlus, FileMinus, FileEdit, Settings2, Bot, ShieldCheck, XCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrchestration } from '@/context/OrchestrationContext';
import { cn } from '@/lib/utils';
import type { Agent, GitFileStatus, FileOpProposal } from '@/types';
import { PHASE_ORDER } from '@/data/mock-data';

// Mock git status for demo
const MOCK_GIT_STATUS = {
  branch: 'ghostflow/cart-feature/code',
  ahead: 3,
  behind: 0,
  files: [
    { path: 'src/hooks/useCart.ts', status: 'added' as GitFileStatus, staged: true, additions: 45, deletions: 0 },
    { path: 'src/components/CartDrawer.tsx', status: 'added' as GitFileStatus, staged: true, additions: 78, deletions: 0 },
    { path: 'src/components/CartItem.tsx', status: 'added' as GitFileStatus, staged: false, additions: 32, deletions: 0 },
    { path: 'src/context/CartContext.tsx', status: 'modified' as GitFileStatus, staged: false, additions: 12, deletions: 5 },
  ],
  isClean: false,
  hasConflicts: false,
};

const FILE_STATUS_ICONS: Record<GitFileStatus, typeof FileCode> = {
  added: FilePlus,
  modified: FileEdit,
  deleted: FileMinus,
  renamed: FileCode,
  untracked: FileCode,
};

const FILE_STATUS_COLORS: Record<GitFileStatus, string> = {
  added: 'text-status-success',
  modified: 'text-status-warning',
  deleted: 'text-status-error',
  renamed: 'text-status-active',
  untracked: 'text-muted-foreground',
};

interface RightPanelProps {
  activeTab?: 'git' | 'agents' | 'config';
  onTabChange?: (tab: 'git' | 'agents' | 'config') => void;
}

export function RightPanel({ activeTab = 'git', onTabChange }: RightPanelProps) {
  const { state } = useOrchestration();
  const { ollamaConnected, gitAvailable, agents } = state;

  return (
    <div className="flex h-full flex-col">
      <Tabs 
        value={activeTab} 
        onValueChange={(v) => onTabChange?.(v as 'git' | 'agents' | 'config')} 
        className="flex-1 flex flex-col"
      >
        <div className="border-b border-sidebar-border px-2">
          <TabsList className="w-full justify-start h-12 bg-transparent">
            <TabsTrigger value="git" className="gap-2 data-[state=active]:bg-sidebar-accent">
              <GitBranch className="h-4 w-4" />
              Git
            </TabsTrigger>
            <TabsTrigger value="agents" className="gap-2 data-[state=active]:bg-sidebar-accent">
              <Bot className="h-4 w-4" />
              Agents
            </TabsTrigger>
            <TabsTrigger value="config" className="gap-2 data-[state=active]:bg-sidebar-accent">
              <Settings2 className="h-4 w-4" />
              Config
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="git" className="flex-1 mt-0 overflow-hidden">
          <GitPanel />
        </TabsContent>

        <TabsContent value="agents" className="flex-1 mt-0 overflow-hidden">
          <AgentsPanel agents={agents} />
        </TabsContent>

        <TabsContent value="config" className="flex-1 mt-0 overflow-hidden">
          <ConfigPanel ollamaConnected={ollamaConnected} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GitPanel() {
  const { state, dispatch } = useOrchestration();
  const status = MOCK_GIT_STATUS;
  const stagedFiles = status.files.filter(f => f.staged);
  const unstagedFiles = status.files.filter(f => !f.staged);
  const proposals = state.fileOpProposals.filter((p) => p.status === 'pending');

  const handleReject = (id: string) => {
    dispatch({ type: 'UPDATE_FILE_OP_PROPOSAL', payload: { id, updates: { status: 'rejected' } } });
  };

  const handleApply = async (proposal: FileOpProposal) => {
    const repoPath = proposal.repoPath;
    if (!repoPath) {
      dispatch({
        type: 'UPDATE_FILE_OP_PROPOSAL',
        payload: { id: proposal.id, updates: { status: 'error', error: 'No repo path connected' } },
      });
      return;
    }

    const invalid = proposal.ops.find((op) => {
      const p = op.path || '';
      return p.startsWith('/') || p.includes('..');
    });
    if (invalid) {
      dispatch({
        type: 'UPDATE_FILE_OP_PROPOSAL',
        payload: { id: proposal.id, updates: { status: 'error', error: 'Invalid path in proposal' } },
      });
      return;
    }

    try {
      if (!window.ghostflow?.applyFileOps) {
        throw new Error('Apply API unavailable');
      }
      await window.ghostflow.applyFileOps(repoPath, proposal.ops);
      dispatch({
        type: 'UPDATE_FILE_OP_PROPOSAL',
        payload: { id: proposal.id, updates: { status: 'applied', error: undefined } },
      });
    } catch (err) {
      dispatch({
        type: 'UPDATE_FILE_OP_PROPOSAL',
        payload: {
          id: proposal.id,
          updates: { status: 'error', error: err instanceof Error ? err.message : 'Apply failed' },
        },
      });
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* Proposed Changes */}
        {proposals.length > 0 && (
          <div className="rounded-lg border border-sidebar-border/80 bg-card/80 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-sidebar-primary" />
                <span className="text-sm font-semibold">Review Proposed Changes</span>
              </div>
              <span className="text-xs text-muted-foreground">{proposals.length} set(s)</span>
            </div>
            <div className="space-y-3">
              {proposals.map((proposal) => (
                <div key={proposal.id} className="rounded-md border border-border/60 p-2 space-y-2">
                  <div className="text-xs text-muted-foreground">
                    Repo: {proposal.repoPath || 'unknown'} {proposal.hasGit ? '(git)' : ''}
                  </div>
                  <div className="space-y-1 max-h-40 overflow-auto">
                    {proposal.ops.map((op, idx) => (
                      <div key={idx} className="rounded bg-muted/40 p-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold capitalize">{op.type}</span>
                          <span className="font-mono text-[11px]">{op.path}</span>
                        </div>
                        <pre className="mt-1 whitespace-pre-wrap text-[11px] bg-background/60 p-2 rounded border">
{op.diff}
                        </pre>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" className="flex-1" onClick={() => handleApply(proposal)}>
                      Apply changes
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => handleReject(proposal.id)}>
                      Reject
                    </Button>
                  </div>
                  {proposal.error && (
                    <div className="flex items-center gap-1 text-xs text-status-error">
                      <XCircle className="h-3 w-3" />
                      {proposal.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Branch Info */}
        <div className="rounded-lg bg-sidebar-accent p-3">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-sidebar-primary" />
            <span className="font-mono text-sm font-medium">{status.branch}</span>
          </div>
          {(status.ahead > 0 || status.behind > 0) && (
            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
              {status.ahead > 0 && <span>↑ {status.ahead} ahead</span>}
              {status.behind > 0 && <span>↓ {status.behind} behind</span>}
            </div>
          )}
        </div>

        {/* Staged Changes */}
        {stagedFiles.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-status-success">
                Staged Changes
              </span>
              <span className="text-xs text-muted-foreground">{stagedFiles.length}</span>
            </div>
            <div className="space-y-1">
              {stagedFiles.map((file) => (
                <FileItem key={file.path} file={file} />
              ))}
            </div>
          </div>
        )}

        {/* Unstaged Changes */}
        {unstagedFiles.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Changes
              </span>
              <span className="text-xs text-muted-foreground">{unstagedFiles.length}</span>
            </div>
            <div className="space-y-1">
              {unstagedFiles.map((file) => (
                <FileItem key={file.path} file={file} />
              ))}
            </div>
          </div>
        )}

        {/* Commit Actions */}
        <div className="pt-2 space-y-2">
          <Button className="w-full gap-2" size="sm">
            <GitCommit className="h-4 w-4" />
            Review & Commit
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}

interface FileItemProps {
  file: typeof MOCK_GIT_STATUS.files[0];
}

function FileItem({ file }: FileItemProps) {
  const Icon = FILE_STATUS_ICONS[file.status];
  const colorClass = FILE_STATUS_COLORS[file.status];
  const fileName = file.path.split('/').pop();
  const dirPath = file.path.split('/').slice(0, -1).join('/');

  return (
    <button className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-sidebar-accent transition-colors group">
      <Icon className={cn("h-4 w-4 flex-shrink-0", colorClass)} />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium truncate block">{fileName}</span>
        <span className="text-xs text-muted-foreground truncate block">{dirPath}</span>
      </div>
      {(file.additions !== undefined || file.deletions !== undefined) && (
        <div className="flex items-center gap-1 text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity">
          {file.additions !== undefined && file.additions > 0 && (
            <span className="text-status-success">+{file.additions}</span>
          )}
          {file.deletions !== undefined && file.deletions > 0 && (
            <span className="text-status-error">-{file.deletions}</span>
          )}
        </div>
      )}
    </button>
  );
}

interface AgentsPanelProps {
  agents: Agent[];
}

function AgentsPanel({ agents }: AgentsPanelProps) {
  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-3">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className={cn(
              "rounded-lg border p-3 transition-all",
              agent.status === 'working' && "border-status-active/50 glow-accent",
              agent.status === 'idle' && "border-border",
              agent.status === 'error' && "border-status-error/50"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "h-2 w-2 rounded-full",
                    agent.status === 'working' && "bg-status-active animate-pulse",
                    agent.status === 'idle' && "bg-muted-foreground",
                    agent.status === 'error' && "bg-status-error"
                  )}
                />
                <span className="font-medium text-sm">{agent.name}</span>
              </div>
              <span className="text-xs text-muted-foreground font-mono">{agent.model}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{agent.description}</p>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

interface ConfigPanelProps {
  ollamaConnected: boolean;
}

function ConfigPanel({ ollamaConnected }: ConfigPanelProps) {
  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <div className="rounded-lg border p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Ollama Endpoint</span>
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                ollamaConnected ? "bg-status-success" : "bg-status-error"
              )}
            />
          </div>
          <input
            type="text"
            defaultValue="http://localhost:11434"
            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm font-mono"
          />
        </div>

        <div className="rounded-lg border p-3">
          <span className="text-sm font-medium">Human Approval Gates</span>
          <div className="mt-2 space-y-2">
            {PHASE_ORDER.filter((phase) => ['code', 'review'].includes(phase)).map((phase) => (
              <label key={phase} className="flex items-center gap-2">
                <input type="checkbox" defaultChecked={phase === 'code'} className="rounded" />
                <span className="text-sm capitalize">{phase}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
