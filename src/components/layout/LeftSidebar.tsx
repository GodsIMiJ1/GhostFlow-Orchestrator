import { useEffect, useRef, useState } from 'react';
import { Plus, FolderOpen, ChevronDown, RefreshCw, FolderSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useOrchestration } from '@/context/OrchestrationContext';
import { cn } from '@/lib/utils';
import { TaskCreationDialog } from '@/components/orchestration/TaskCreationDialog';
import type { Task, TaskStatus } from '@/types';

const STATUS_CONFIG: Record<TaskStatus, { label: string; className: string }> = {
  backlog: { label: 'Backlog', className: 'status-pending' },
  ready: { label: 'Ready', className: 'status-pending' },
  in_progress: { label: 'In Progress', className: 'status-active' },
  blocked: { label: 'Blocked', className: 'status-warning' },
  completed: { label: 'Completed', className: 'status-success' },
  failed: { label: 'Failed', className: 'status-error' },
};

export function LeftSidebar() {
  const { state, setActiveTask, setActiveProject, addProject } = useOrchestration();
  const { activeProject, activeTask, tasks, projects } = state;
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectPath, setNewProjectPath] = useState('');
  const [newProjectHasGit, setNewProjectHasGit] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  const groupedTasks = tasks.reduce((acc, task) => {
    if (!acc[task.status]) acc[task.status] = [];
    acc[task.status].push(task);
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

  const statusOrder: TaskStatus[] = ['in_progress', 'ready', 'blocked', 'backlog', 'completed', 'failed'];

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setProjectMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div className="flex h-full flex-col">
      {/* Project Selector */}
      <div className="border-b border-sidebar-border p-4 relative" ref={menuRef}>
        <button
          className="flex w-full items-center justify-between rounded-lg bg-sidebar-accent px-3 py-2 text-left hover:bg-sidebar-accent/80 transition-colors"
          onClick={() => setProjectMenuOpen((prev) => !prev)}
        >
          <div className="flex items-center gap-2 min-w-0">
            <FolderOpen className="h-4 w-4 flex-shrink-0 text-sidebar-primary" />
            <span className="truncate font-medium text-sm">{activeProject?.name || 'Select Project'}</span>
          </div>
          <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        </button>
        {projectMenuOpen && (
          <div className="absolute z-10 mt-2 w-full rounded-md border bg-card shadow-lg">
            <div className="max-h-60 overflow-auto py-1">
              {projects.length === 0 && (
                <div className="px-3 py-2 text-sm text-muted-foreground">No projects yet</div>
              )}
              {projects.map((project) => (
                <button
                  key={project.id}
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm hover:bg-sidebar-accent",
                    activeProject?.id === project.id && "bg-sidebar-accent"
                  )}
                  onClick={() => {
                    setActiveProject(project.id);
                    setProjectMenuOpen(false);
                  }}
                >
                  {project.name}
                </button>
              ))}
            </div>
            <div className="border-t p-3 space-y-2">
              <input
                ref={folderInputRef}
                type="file"
                className="hidden"
                webkitdirectory="true"
                directory="true"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  // webkitRelativePath gives "<folder>/file"; take folder segment
                  const rel = file?.webkitRelativePath || '';
                  const folder = rel.split('/')[0] || file?.name || '';
                  const absPath = (file as File & { path?: string }).path || folder;
                  if (absPath) setNewProjectPath(absPath);
                  const hasGit = Array.from(e.target.files || []).some((f) =>
                    f.webkitRelativePath?.includes('.git/')
                  );
                  setNewProjectHasGit(hasGit);
                }}
              />
              <input
                className="w-full rounded-md border bg-background px-2 py-1 text-sm"
                placeholder="Project name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
              />
              <input
                className="w-full rounded-md border bg-background px-2 py-1 text-sm"
                placeholder="Repo path (connect local repo)"
                value={newProjectPath}
                onChange={(e) => setNewProjectPath(e.target.value)}
              />
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-sidebar-accent/40 transition-colors"
                onClick={() => folderInputRef.current?.click()}
              >
                <FolderSearch className="h-4 w-4" />
                Connect repo folder
              </button>
              <button
                className="w-full rounded-md bg-sidebar-accent px-3 py-1.5 text-sm font-medium hover:bg-sidebar-accent/80 transition-colors disabled:opacity-50"
                disabled={!newProjectName.trim()}
                onClick={() => {
                  if (!newProjectName.trim()) return;
                  addProject({
                    name: newProjectName.trim(),
                    path: newProjectPath.trim() || 'local',
                    description: '',
                    hasGit: newProjectHasGit,
                  });
                  setNewProjectName('');
                  setNewProjectPath('');
                  setNewProjectHasGit(false);
                  setProjectMenuOpen(false);
                }}
              >
                Create Project
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2 border-b border-sidebar-border p-3">
        <Button size="sm" className="flex-1 gap-2" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          New Task
        </Button>
        <Button size="sm" variant="outline" className="px-2">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Task Creation Dialog */}
      <TaskCreationDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

      {/* Task List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {statusOrder.map((status) => {
            const statusTasks = groupedTasks[status];
            if (!statusTasks?.length) return null;

            const config = STATUS_CONFIG[status];

            return (
              <div key={status}>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className={cn("text-xs font-semibold uppercase tracking-wider", config.className)}>
                    {config.label}
                  </span>
                  <span className="text-xs text-muted-foreground">({statusTasks.length})</span>
                </div>

                <div className="space-y-1">
                  {statusTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      isActive={activeTask?.id === task.id}
                      onClick={() => setActiveTask(task.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        <div className="text-xs text-muted-foreground">
          {tasks.length} tasks • {tasks.filter(t => t.status === 'completed').length} completed
        </div>
      </div>
    </div>
  );
}

interface TaskItemProps {
  task: Task;
  isActive: boolean;
  onClick: () => void;
}

function TaskItem({ task, isActive, onClick }: TaskItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-lg px-3 py-2.5 transition-all",
        "hover:bg-sidebar-accent",
        isActive && "bg-sidebar-accent ring-1 ring-sidebar-primary/50"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-sm text-sidebar-foreground line-clamp-1">
          {task.title}
        </span>
        {task.status === 'in_progress' && (
          <div className="h-2 w-2 rounded-full bg-status-active animate-pulse-subtle flex-shrink-0" />
        )}
      </div>
    </button>
  );
}
