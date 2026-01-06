import type { AgentRole, PhaseType } from '@/types';

export const PHASE_AGENT_MAP: Record<PhaseType | 'fix', AgentRole | null> = {
  // Specification → spec-writer
  spec: 'spec-writer',
  // Planning → planner
  plan: 'planner',
  // Implementation → coder
  code: 'coder',
  // QA → qa
  qa: 'qa',
  // Review → qa-reviewer
  review: 'qa-reviewer',
  // Fix → qa-fixer (phase not currently in PHASE_ORDER)
  fix: 'qa-fixer',
};
