import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useOrchestration } from '@/context/OrchestrationContext';
import { PHASE_ORDER, PHASE_NAMES, createDefaultPhases } from '@/data/mock-data';
import type { PhaseType } from '@/types';

interface TaskCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskCreationDialog({ open, onOpenChange }: TaskCreationDialogProps) {
  const { addTask, state } = useOrchestration();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [enabledPhases, setEnabledPhases] = useState<PhaseType[]>([...PHASE_ORDER]);

  const handlePhaseToggle = (phase: PhaseType) => {
    if (phase === 'done') return; // Done phase is always required
    
    setEnabledPhases((prev) =>
      prev.includes(phase)
        ? prev.filter((p) => p !== phase)
        : [...prev, phase].sort((a, b) => PHASE_ORDER.indexOf(a) - PHASE_ORDER.indexOf(b))
    );
  };

  const handleSubmit = () => {
    if (!title.trim()) return;

    const phases = createDefaultPhases().filter((p) => enabledPhases.includes(p.id));

    addTask({
      title: title.trim(),
      description: description.trim(),
      status: 'backlog',
      currentPhase: enabledPhases[0] || 'spec',
      phases,
      projectId: state.activeProject?.id || state.projects[0]?.id || '',
      assignedAgents: [],
      logs: [],
      humanApprovalRequired: true,
    });
    
    // Reset form
    setTitle('');
    setDescription('');
    setEnabledPhases([...PHASE_ORDER]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Create New Task</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Define a new task and configure which phases it should go through.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-foreground">Title</Label>
            <Input
              id="title"
              placeholder="Enter task title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what this task should accomplish..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="bg-background border-border resize-none"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-foreground">Phase Configuration</Label>
            <p className="text-xs text-muted-foreground">
              Select which phases this task should include in its workflow.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {PHASE_ORDER.map((phase) => (
                <div
                  key={phase}
                  className="flex items-center space-x-2 p-2 rounded-md bg-background border border-border"
                >
                  <Checkbox
                    id={`phase-${phase}`}
                    checked={enabledPhases.includes(phase)}
                    onCheckedChange={() => handlePhaseToggle(phase)}
                    disabled={phase === 'done'}
                    className="border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <Label
                    htmlFor={`phase-${phase}`}
                    className={`text-sm cursor-pointer flex-1 ${
                      phase === 'done' ? 'text-muted-foreground' : 'text-foreground'
                    }`}
                  >
                    <span className={`phase-${phase}`}>{PHASE_NAMES[phase]}</span>
                    {phase === 'done' && (
                      <span className="text-xs text-muted-foreground ml-1">(required)</span>
                    )}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-border"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Create Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
