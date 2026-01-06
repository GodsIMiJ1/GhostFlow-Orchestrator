import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, FileCode, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import type { PhaseArtifact, PhaseType } from '@/types';
import { PHASE_NAMES } from '@/data/mock-data';

interface PhaseArtifactViewerProps {
  phase: PhaseType;
  artifact: PhaseArtifact;
}

export function PhaseArtifactViewer({ phase, artifact }: PhaseArtifactViewerProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(artifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-3 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <FileCode className={cn("h-4 w-4", `phase-${phase}`)} />
          <span className="font-medium text-sm">{PHASE_NAMES[phase]} Output</span>
          <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">
            {artifact.type}
          </span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            handleCopy();
          }}
        >
          {copied ? <Check className="h-4 w-4 text-status-success" /> : <Copy className="h-4 w-4" />}
        </Button>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t">
          <ArtifactContent artifact={artifact} />
        </div>
      )}
    </div>
  );
}

interface ArtifactContentProps {
  artifact: PhaseArtifact;
}

function ArtifactContent({ artifact }: ArtifactContentProps) {
  switch (artifact.type) {
    case 'markdown':
      return <MarkdownContent content={artifact.content} />;
    case 'code':
      return <CodeContent content={artifact.content} />;
    case 'json':
      return <JsonContent content={artifact.content} />;
    case 'diff':
      return <DiffContent content={artifact.content} />;
    default:
      return <PlainTextContent content={artifact.content} />;
  }
}

function MarkdownContent({ content }: { content: string }) {
  // Simple markdown rendering - could use react-markdown for full support
  return (
    <ScrollArea className="max-h-96">
      <div className="p-4 prose prose-sm dark:prose-invert max-w-none">
        <div className="whitespace-pre-wrap text-sm">{content}</div>
      </div>
    </ScrollArea>
  );
}

function CodeContent({ content }: { content: string }) {
  return (
    <ScrollArea className="max-h-96">
      <pre className="p-4 font-mono text-sm terminal-text overflow-x-auto">
        <code>{content}</code>
      </pre>
    </ScrollArea>
  );
}

function JsonContent({ content }: { content: string }) {
  let formatted = content;
  try {
    const parsed = JSON.parse(content);
    formatted = JSON.stringify(parsed, null, 2);
  } catch {
    // Use as-is if not valid JSON
  }

  return (
    <ScrollArea className="max-h-96">
      <pre className="p-4 font-mono text-sm terminal-text overflow-x-auto">
        <code>{formatted}</code>
      </pre>
    </ScrollArea>
  );
}

function DiffContent({ content }: { content: string }) {
  const lines = content.split('\n');

  return (
    <ScrollArea className="max-h-96">
      <div className="p-4 font-mono text-sm">
        {lines.map((line, index) => (
          <div
            key={index}
            className={cn(
              "px-2 -mx-2",
              line.startsWith('+') && !line.startsWith('+++') && "bg-status-success/10 text-status-success",
              line.startsWith('-') && !line.startsWith('---') && "bg-status-error/10 text-status-error",
              line.startsWith('@@') && "text-status-active bg-status-active/5",
              line.startsWith('diff') && "font-semibold text-foreground",
              !line.startsWith('+') && !line.startsWith('-') && !line.startsWith('@') && !line.startsWith('diff') && "text-muted-foreground"
            )}
          >
            {line || ' '}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

function PlainTextContent({ content }: { content: string }) {
  return (
    <ScrollArea className="max-h-96">
      <div className="p-4 text-sm whitespace-pre-wrap">{content}</div>
    </ScrollArea>
  );
}

// Multi-artifact viewer for task detail view
interface ArtifactListProps {
  phases: { id: PhaseType; artifact?: PhaseArtifact }[];
}

export function ArtifactList({ phases }: ArtifactListProps) {
  const phasesWithArtifacts = phases.filter((p) => p.artifact);

  if (phasesWithArtifacts.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        No artifacts yet. Start execution to generate phase outputs.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {phasesWithArtifacts.map((phase) => (
        <PhaseArtifactViewer
          key={phase.id}
          phase={phase.id}
          artifact={phase.artifact!}
        />
      ))}
    </div>
  );
}
