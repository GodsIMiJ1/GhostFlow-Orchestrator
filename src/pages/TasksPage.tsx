import { ThreePaneLayout } from '@/components/layout';
import { useOrchestration } from '@/context/OrchestrationContext';
import { cn } from '@/lib/utils';
import type { Task, PhaseType } from '@/types';

type ExecutionColumn = 'planning' | 'in_progress' | 'ai_review' | 'human_review' | 'completed';

const EXECUTION_COLUMNS: { id: ExecutionColumn; label: string }[] = [
  { id: 'planning', label: 'Planning' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'ai_review', label: 'AI Review' },
  { id: 'human_review', label: 'Human Review' },
  { id: 'completed', label: 'Completed' },
];

function getTaskColumn(task: Task): ExecutionColumn {
  // Human review takes precedence
  if (task.humanApprovalRequired && task.humanApprovalPhase === task.currentPhase) {
    const currentPhaseObj = task.phases.find(p => p.id === task.currentPhase);
    if (currentPhaseObj?.status === 'completed') {
      return 'human_review';
    }
  }
  
  // Map by current phase
  const phaseToColumn: Record<PhaseType, ExecutionColumn> = {
    spec: 'planning',
    plan: 'planning',
    code: 'in_progress',
    review: 'ai_review',
    qa: 'ai_review',
    done: 'completed',
  };
  
  return phaseToColumn[task.currentPhase];
}

export default function TasksPage() {
  const { state, setActiveTask } = useOrchestration();
  const { tasks } = state;

  return (
    <ThreePaneLayout>
      <div className="h-full p-6">
        <h1 className="text-2xl font-bold mb-6">Task Board</h1>
        
        <div className="grid grid-cols-5 gap-4 h-[calc(100%-4rem)]">
          {EXECUTION_COLUMNS.map((column) => {
            const columnTasks = tasks.filter((t) => getTaskColumn(t) === column.id);
            const isCompleted = column.id === 'completed';
            
            return (
              <div 
                key={column.id} 
                className={cn(
                  "flex flex-col rounded-lg border-t-2 border-border/30 bg-card/50",
                  isCompleted && "opacity-60"
                )}
              >
                <div className="p-3 border-b border-border/30">
                  <h3 className="font-medium text-sm text-muted-foreground">{column.label}</h3>
                </div>
                
                <div className="flex-1 p-2 space-y-2 overflow-auto">
                  {columnTasks.length === 0 ? (
                    <div className="h-16 rounded-lg border border-dashed border-border/30" />
                  ) : (
                    columnTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onClick={() => setActiveTask(task.id)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ThreePaneLayout>
  );
}

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

function TaskCard({ task, onClick }: TaskCardProps) {
  const isActive = task.currentPhase === 'code';
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full min-h-[3.5rem] p-3 rounded-lg text-left transition-all",
        "bg-background/80 border border-border/20",
        "shadow-[0_1px_3px_0_hsl(var(--foreground)/0.02)]",
        "hover:border-border/40 hover:shadow-[0_2px_6px_0_hsl(var(--foreground)/0.04)]"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
        {isActive && (
          <div className="h-2 w-2 rounded-full bg-status-active animate-pulse-subtle flex-shrink-0 mt-1" />
        )}
      </div>
    </button>
  );
}
