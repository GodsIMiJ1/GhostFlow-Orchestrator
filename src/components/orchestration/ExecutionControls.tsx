import { cn } from '@/lib/utils';
import { Play, Pause, Square, RotateCcw, ChevronRight, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Task, PhaseType } from '@/types';
import { PHASE_NAMES, PHASE_ORDER } from '@/data/mock-data';

interface ExecutionControlsProps {
  task: Task;
  isRunning: boolean;
  isPaused: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onRetry: (phase: PhaseType) => void;
  onAdvancePhase: () => void;
  onApprove: (phase: PhaseType) => void;
  onReject: (phase: PhaseType, feedback: string) => void;
  requiresApproval: boolean;
}

export function ExecutionControls({
  task,
  isRunning,
  isPaused,
  onStart,
  onPause,
  onResume,
  onCancel,
  onRetry,
  onAdvancePhase,
  onApprove,
  onReject,
  requiresApproval,
}: ExecutionControlsProps) {
  const currentPhase = task.phases.find((p) => p.id === task.currentPhase);
  const hasFailedPhase = task.phases.some((p) => p.status === 'failed');

  // Human approval takes priority
  if (requiresApproval && currentPhase?.status === 'active') {
    return (
      <div className="flex items-center gap-2">
        <Button onClick={() => onApprove(task.currentPhase)} size="sm" className="gap-2">
          <CheckCircle className="h-4 w-4" />
          Approve
        </Button>
        <Button
          onClick={() => onReject(task.currentPhase, 'Changes requested')}
          size="sm"
          variant="outline"
        >
          Request Changes
        </Button>
      </div>
    );
  }

  // Failed state - show retry
  if (hasFailedPhase && !isRunning) {
    return (
      <Button
        onClick={() => {
          const failedPhase = task.phases.find((p) => p.status === 'failed');
          if (failedPhase) onRetry(failedPhase.id);
        }}
        size="sm"
        variant="outline"
        className="gap-2"
      >
        <RotateCcw className="h-4 w-4" />
        Retry
      </Button>
    );
  }

  // Single primary action based on state
  if (task.status === 'completed') {
    return (
      <div className="flex items-center gap-2 text-sm text-status-success">
        <CheckCircle className="h-4 w-4" />
        Completed
      </div>
    );
  }

  if (isPaused) {
    return (
      <div className="flex items-center gap-2">
        <Button onClick={onResume} size="sm" className="gap-2">
          <Play className="h-4 w-4" />
          Resume
        </Button>
        <Button onClick={onCancel} size="sm" variant="ghost">
          <Square className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (isRunning) {
    return (
      <div className="flex items-center gap-2">
        <Button onClick={onPause} size="sm" variant="secondary" className="gap-2">
          <Pause className="h-4 w-4" />
          Pause
        </Button>
        <Button onClick={onCancel} size="sm" variant="ghost">
          <Square className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // Default: Start
  return (
    <Button onClick={onStart} size="sm" className="gap-2" disabled={isRunning}>
      <Play className="h-4 w-4" />
      Start
    </Button>
  );
}

interface HumanApprovalGateProps {
  phase: PhaseType;
  onApprove: () => void;
  onReject: (feedback: string) => void;
}

function HumanApprovalGate({ phase, onApprove, onReject }: HumanApprovalGateProps) {
  return (
    <div className="rounded-lg border-2 border-status-warning/50 bg-status-warning/5 p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-status-warning flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-sm">Human Approval Required</h4>
          <p className="text-sm text-muted-foreground mt-1">
            The <span className="font-medium">{PHASE_NAMES[phase]}</span> phase is waiting for your approval before proceeding.
          </p>
          
          <div className="flex items-center gap-2 mt-4">
            <Button onClick={onApprove} size="sm" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Approve & Continue
            </Button>
            <Button
              onClick={() => onReject('Changes requested')}
              size="sm"
              variant="outline"
              className="gap-2"
            >
              Request Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact version for inline use
interface CompactControlsProps {
  isRunning: boolean;
  isPaused: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
}

export function CompactControls({
  isRunning,
  isPaused,
  onStart,
  onPause,
  onResume,
  onCancel,
}: CompactControlsProps) {
  return (
    <div className="flex items-center gap-1">
      {!isRunning && !isPaused && (
        <Button onClick={onStart} size="icon" variant="ghost" className="h-8 w-8">
          <Play className="h-4 w-4" />
        </Button>
      )}

      {isRunning && !isPaused && (
        <Button onClick={onPause} size="icon" variant="ghost" className="h-8 w-8">
          <Pause className="h-4 w-4" />
        </Button>
      )}

      {isPaused && (
        <Button onClick={onResume} size="icon" variant="ghost" className="h-8 w-8">
          <Play className="h-4 w-4" />
        </Button>
      )}

      {(isRunning || isPaused) && (
        <Button onClick={onCancel} size="icon" variant="ghost" className="h-8 w-8 text-destructive">
          <Square className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
