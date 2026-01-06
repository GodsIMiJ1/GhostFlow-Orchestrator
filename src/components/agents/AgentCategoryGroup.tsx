import { ReactNode } from 'react';
import { AgentCategory } from '@/types/orchestrator';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface AgentCategoryGroupProps {
  category: AgentCategory;
  children: ReactNode;
  defaultOpen?: boolean;
}

const CATEGORY_LABELS: Record<AgentCategory, string> = {
  'spec-creation': 'Spec Creation',
  'build': 'Build',
  'utility': 'Utility',
  'insights': 'Insights',
  'ideation': 'Ideation',
};

export function AgentCategoryGroup({ category, children, defaultOpen = true }: AgentCategoryGroupProps) {
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:bg-accent/10 transition-colors group">
        <ChevronDown className="h-3 w-3 transition-transform group-data-[state=closed]:-rotate-90" />
        {CATEGORY_LABELS[category]}
      </CollapsibleTrigger>
      <CollapsibleContent>
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
