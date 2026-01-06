import { ThreePaneLayout } from '@/components/layout';
import { PhaseTimeline, StreamingLog, ExecutionControls, ArtifactList, ApprovalGate } from '@/components/orchestration';
import { useOrchestration } from '@/context/OrchestrationContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { PHASE_ORDER } from '@/data/mock-data';
import type { PhaseType } from '@/types';
import { useAgentExecution } from '@/hooks/use-agent-execution';

export default function Dashboard() {
  const { state, dispatch, startPhase, completePhase } = useOrchestration();
  const { activeTask, streamingLogs } = state;
  const { executeAgent, cancelExecution, isStreaming } = useAgentExecution();
  const [isPaused, setIsPaused] = useState(false);

  const handleStart = () => {
    if (activeTask) {
      executeAgent({
        taskId: activeTask.id,
        phase: activeTask.currentPhase,
      });
      setIsPaused(false);
    }
  };

  const handleAdvancePhase = () => {
    if (!activeTask) return;
    const currentIndex = PHASE_ORDER.indexOf(activeTask.currentPhase);
    if (currentIndex < PHASE_ORDER.length - 1) {
      completePhase(activeTask.id, activeTask.currentPhase);
      const nextPhase = PHASE_ORDER[currentIndex + 1];
      startPhase(activeTask.id, nextPhase);
    }
  };

  const handleViewChanges = () => {
    dispatch({ type: 'OPEN_RIGHT_SIDEBAR_WITH_TAB', payload: 'git' });
  };

  if (!activeTask) {
    return (
      <ThreePaneLayout>
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">No Task Selected</h2>
            <p className="text-muted-foreground">Select a task from the sidebar to view details</p>
          </div>
        </div>
      </ThreePaneLayout>
    );
  }

  // Check if approval is required for current phase
  const currentPhaseData = activeTask.phases.find(p => p.id === activeTask.currentPhase);
  const isPhaseComplete = currentPhaseData?.status === 'completed';
  const isAwaitingApproval = activeTask.humanApprovalRequired && 
    activeTask.humanApprovalPhase === activeTask.currentPhase &&
    isPhaseComplete;

  const hasLogs = streamingLogs.length > 0;
  const hasArtifacts = activeTask.phases.some(p => p.artifact);
  const showContent = hasLogs || hasArtifacts || isStreaming;
  const defaultTab = (hasLogs || isStreaming) ? 'logs' : 'artifacts';

  // Approval Gate takes over the center pane
  if (isAwaitingApproval) {
    return (
      <ThreePaneLayout>
        <div className="flex h-full flex-col">
          {/* Dimmed header */}
          <div className="border-b px-4 py-3 opacity-50">
            <h1 className="text-lg font-semibold">{activeTask.title}</h1>
          </div>

          {/* Subtle Phase Timeline */}
          <div className="border-b bg-card/30 opacity-50">
            <PhaseTimeline
              phases={activeTask.phases}
              currentPhase={activeTask.currentPhase}
              onPhaseClick={() => {}}
            />
          </div>

          {/* Approval Gate - The Ritual */}
          <div className="flex-1 p-6">
            <ApprovalGate
              task={activeTask}
              phase={activeTask.currentPhase}
              onApprove={handleAdvancePhase}
              onReject={() => {}}
              onViewChanges={handleViewChanges}
            />
          </div>
        </div>
      </ThreePaneLayout>
    );
  }

  return (
    <ThreePaneLayout>
      <div className="flex h-full flex-col">
        {/* Minimal Task Header */}
        <div className="border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">{activeTask.title}</h1>
            <ExecutionControls
              task={activeTask}
              isRunning={isStreaming}
              isPaused={isPaused}
              onStart={handleStart}
              onPause={() => { cancelExecution(); setIsPaused(true); }}
              onResume={handleStart}
              onCancel={cancelExecution}
              onRetry={(phase) => {
                executeAgent({ taskId: activeTask.id, phase });
              }}
              onAdvancePhase={handleAdvancePhase}
              onApprove={() => handleAdvancePhase()}
              onReject={() => {}}
              requiresApproval={activeTask.humanApprovalRequired}
            />
          </div>
        </div>

        {/* Minimal Phase Timeline */}
        <div className="border-b bg-card/30">
          <PhaseTimeline
            phases={activeTask.phases}
            currentPhase={activeTask.currentPhase}
          />
        </div>

        {/* Main Content - Progressive Disclosure */}
        <div className="flex-1 overflow-hidden">
          {!showContent ? (
            // Empty state - just show the start action
            <div className="flex h-full items-center justify-center">
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">Ready to execute</p>
                  <ExecutionControls
                    task={activeTask}
                    isRunning={isStreaming}
                    isPaused={isPaused}
                    onStart={handleStart}
                    onPause={() => { cancelExecution(); setIsPaused(true); }}
                    onResume={handleStart}
                    onCancel={cancelExecution}
                    onRetry={(phase) => {
                      executeAgent({ taskId: activeTask.id, phase });
                    }}
                    onAdvancePhase={handleAdvancePhase}
                    onApprove={() => handleAdvancePhase()}
                    onReject={() => {}}
                    requiresApproval={activeTask.humanApprovalRequired}
                  />
              </div>
            </div>
          ) : (
            // Content appears only when there's something to show
            <Tabs defaultValue={defaultTab} className="h-full flex flex-col">
              <div className="border-b px-4">
                <TabsList className="h-9 bg-transparent">
                  {(hasLogs || isStreaming) && (
                    <TabsTrigger value="logs" className="text-sm">Output</TabsTrigger>
                  )}
                  {hasArtifacts && (
                    <TabsTrigger value="artifacts" className="text-sm">Artifacts</TabsTrigger>
                  )}
                </TabsList>
              </div>

                  {(hasLogs || isStreaming) && (
                    <TabsContent value="logs" className="flex-1 m-0 p-4 overflow-hidden">
                      <StreamingLog
                        logs={streamingLogs}
                        isStreaming={isStreaming}
                        onClear={() => dispatch({ type: 'CLEAR_LOGS' })}
                        onPause={() => setIsPaused(!isPaused)}
                        isPaused={isPaused}
                      />
                    </TabsContent>
                  )}

              {hasArtifacts && (
                <TabsContent value="artifacts" className="flex-1 m-0 overflow-hidden">
                  <ScrollArea className="h-full p-4">
                    <ArtifactList phases={activeTask.phases} />
                  </ScrollArea>
                </TabsContent>
              )}
            </Tabs>
          )}
        </div>
      </div>
    </ThreePaneLayout>
  );
}
