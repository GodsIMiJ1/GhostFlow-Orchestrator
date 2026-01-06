import { cn } from '@/lib/utils';
import { PHASE_ORDER, PHASE_NAMES } from '@/data/mock-data';
import type { Phase, PhaseType } from '@/types';
import { Check, Circle, Loader2, X, Clock } from 'lucide-react';

interface PhaseTimelineProps {
  phases: Phase[];
  currentPhase: PhaseType;
  onPhaseClick?: (phase: PhaseType) => void;
}

export function PhaseTimeline({ phases, currentPhase, onPhaseClick }: PhaseTimelineProps) {
  return (
    <div className="flex items-center justify-between px-4 py-4">
      {PHASE_ORDER.map((phaseId, index) => {
        const phase = phases.find((p) => p.id === phaseId);
        const isLast = index === PHASE_ORDER.length - 1;

        return (
          <div key={phaseId} className="flex items-center flex-1">
            <PhaseNode
              phase={phase}
              phaseId={phaseId}
              isCurrent={currentPhase === phaseId}
              onClick={() => onPhaseClick?.(phaseId)}
            />
            {!isLast && <PhaseConnector phase={phase} />}
          </div>
        );
      })}
    </div>
  );
}

interface PhaseNodeProps {
  phase?: Phase;
  phaseId: PhaseType;
  isCurrent: boolean;
  onClick?: () => void;
}

function PhaseNode({ phase, phaseId, isCurrent, onClick }: PhaseNodeProps) {
  const status = phase?.status || 'pending';
  const phaseColorVar = `var(--phase-${phaseId})`;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1.5 group transition-all relative",
        onClick && "cursor-pointer"
      )}
    >
      {/* Icon Circle - Smaller */}
      <div
        className={cn(
          "relative flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all",
          status === 'pending' && "border-muted bg-background",
          status === 'active' && "border-status-active bg-status-active/10 pulse-active",
          status === 'completed' && "border-status-success bg-status-success/10",
          status === 'failed' && "border-status-error bg-status-error/10",
          status === 'skipped' && "border-muted-foreground/50 bg-muted"
        )}
        style={isCurrent ? { borderColor: phaseColorVar } : undefined}
      >
        {status === 'pending' && <Circle className="h-3 w-3 text-muted-foreground" />}
        {status === 'active' && <Loader2 className="h-3 w-3 text-status-active animate-spin" />}
        {status === 'completed' && <Check className="h-3 w-3 text-status-success" />}
        {status === 'failed' && <X className="h-3 w-3 text-status-error" />}
        {status === 'skipped' && <Clock className="h-3 w-3 text-muted-foreground" />}
      </div>

      {/* Label - Only show for current phase, or on hover */}
      <div className={cn(
        "text-center transition-opacity",
        isCurrent ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      )}>
        <span
          className={cn(
            "text-[10px] font-medium transition-colors whitespace-nowrap",
            status === 'pending' && "text-muted-foreground",
            status === 'active' && "text-foreground",
            status === 'completed' && "text-status-success",
            status === 'failed' && "text-status-error",
            status === 'skipped' && "text-muted-foreground"
          )}
          style={isCurrent ? { color: phaseColorVar } : undefined}
        >
          {PHASE_NAMES[phaseId]}
        </span>
      </div>

      {/* Hover tooltip with duration */}
      {phase?.completedAt && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-muted-foreground whitespace-nowrap">
          {formatDuration(phase.startedAt, phase.completedAt)}
        </div>
      )}
    </button>
  );
}

interface PhaseConnectorProps {
  phase?: Phase;
}

function PhaseConnector({ phase }: PhaseConnectorProps) {
  const status = phase?.status || 'pending';

  return (
    <div className="flex-1 px-2">
      <div
        className={cn(
          "h-0.5 w-full rounded-full transition-all",
          status === 'pending' && "bg-muted",
          status === 'active' && "bg-gradient-to-r from-status-active to-muted",
          status === 'completed' && "bg-status-success",
          status === 'failed' && "bg-gradient-to-r from-status-error to-muted",
          status === 'skipped' && "bg-muted-foreground/30"
        )}
      />
    </div>
  );
}

function formatDuration(start?: Date, end?: Date): string {
  if (!start || !end) return '';
  
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const seconds = Math.floor(ms / 1000);
  
  if (seconds < 60) return `${seconds}s`;
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  return `${minutes}m ${remainingSeconds}s`;
}
