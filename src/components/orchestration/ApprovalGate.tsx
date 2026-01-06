import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Eye, Check, X } from 'lucide-react';
import type { Task, PhaseType } from '@/types';
import { PHASE_NAMES } from '@/data/mock-data';

interface ApprovalGateProps {
  task: Task;
  phase: PhaseType;
  onApprove: () => void;
  onReject: () => void;
  onViewChanges: () => void;
  fileCount?: number;
  additions?: number;
  deletions?: number;
}

export function ApprovalGate({
  task,
  phase,
  onApprove,
  onReject,
  onViewChanges,
  fileCount = 12,
  additions = 340,
  deletions = 28,
}: ApprovalGateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full animate-fade-in">
      {/* Ritual Card */}
      <div className="w-full max-w-lg border border-border rounded-xl bg-card p-8 space-y-6 shadow-lg">
        {/* Phase Badge */}
        <div className="flex justify-center">
          <span className={cn(
            "px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider",
            `bg-phase-${phase}/10 text-phase-${phase}`
          )}>
            {PHASE_NAMES[phase]} Complete
          </span>
        </div>

        {/* Task Title */}
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold">{task.title}</h2>
          <p className="text-sm text-muted-foreground">
            Ready for review and approval
          </p>
        </div>

        {/* View Changes Button */}
        <button
          onClick={onViewChanges}
          className="w-full flex items-center justify-between rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors p-4 group"
        >
          <div className="flex items-center gap-3">
            <Eye className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">View Changes</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{fileCount} files</span>
            <span className="font-mono">
              <span className="text-status-success">+{additions}</span>
              {' / '}
              <span className="text-status-error">-{deletions}</span>
            </span>
            <span className="text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">→</span>
          </div>
        </button>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            size="lg"
            onClick={onReject}
            className="flex-1 gap-2 text-muted-foreground hover:text-destructive hover:border-destructive"
          >
            <X className="h-4 w-4" />
            Reject
          </Button>
          <Button
            size="lg"
            onClick={onApprove}
            className="flex-1 gap-2 bg-status-success hover:bg-status-success/90 text-status-success-foreground"
          >
            <Check className="h-4 w-4" />
            Approve
          </Button>
        </div>
      </div>
    </div>
  );
}
