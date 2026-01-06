import type {
  Agent,
  AgentRole,
  AgentTerminalEntry,
  AgentCategory,
  LogEntry,
  Phase,
  PhaseType,
  Project,
  Settings,
  Task,
  Tool,
  ToolName,
} from '@/types';
import type { MCPServer } from '@/types/mcp';

// ============================================
// Default MCP Servers
// ============================================

export const DEFAULT_MCP_SERVERS: MCPServer[] = [
  {
    id: 'context7',
    name: 'Context7',
    description: 'Documentation lookup',
    icon: '📚',
    enabled: true,
  },
  {
    id: 'graphiti',
    name: 'Graphiti Memory',
    description: 'Memory backend',
    icon: '🧠',
    enabled: true,
  },
  {
    id: 'linear',
    name: 'Linear',
    description: 'Project integration',
    icon: '📋',
    enabled: false,
  },
  {
    id: 'electron',
    name: 'Electron',
    description: 'Desktop QA automation',
    icon: '🖥️',
    enabled: true,
    restrictedTo: ['qa', 'qa-reviewer', 'qa-fixer'],
  },
  {
    id: 'puppeteer',
    name: 'Puppeteer',
    description: 'Browser QA automation',
    icon: '🌐',
    enabled: true,
    restrictedTo: ['qa', 'qa-reviewer', 'qa-fixer'],
  },
  {
    id: 'auto-claude-tools',
    name: 'Auto-Claude Tools',
    description: 'Core tooling (always enabled)',
    icon: '⚡',
    enabled: true,
    locked: true,
  },
];

// ============================================
// Default Agents (Expanded Roster)
// ============================================

export const DEFAULT_AGENTS: Agent[] = [
  // Spec Creation
  {
    id: 'agent-spec-gatherer',
    name: 'Spec Gatherer',
    role: 'spec-gatherer',
    category: 'spec-creation',
    model: 'llama3.2',
    description: 'Collects requirements and context from stakeholders.',
    constraints: ['Read-only access', 'Cannot modify code'],
    allowedTools: ['readFile', 'searchFiles', 'gitStatus'],
    mcpBindings: ['context7', 'graphiti', 'auto-claude-tools'],
    isActive: true,
    status: 'idle',
  },
  {
    id: 'agent-spec-researcher',
    name: 'Spec Researcher',
    role: 'spec-researcher',
    category: 'spec-creation',
    model: 'llama3.2',
    description: 'Researches similar solutions and best practices.',
    constraints: ['Read-only access'],
    allowedTools: ['readFile', 'searchFiles'],
    mcpBindings: ['context7', 'graphiti', 'auto-claude-tools'],
    isActive: true,
    status: 'idle',
  },
  {
    id: 'agent-spec-writer',
    name: 'Spec Writer',
    role: 'spec-writer',
    category: 'spec-creation',
    model: 'llama3.2',
    description: 'Writes detailed specifications from gathered info.',
    constraints: ['Read-only access', 'Structured output only'],
    allowedTools: ['readFile', 'searchFiles'],
    mcpBindings: ['context7', 'graphiti', 'auto-claude-tools'],
    isActive: true,
    status: 'idle',
  },
  {
    id: 'agent-spec-critic',
    name: 'Spec Critic',
    role: 'spec-critic',
    category: 'spec-creation',
    model: 'llama3.2',
    description: 'Reviews and critiques specifications for gaps.',
    constraints: ['Read-only access'],
    allowedTools: ['readFile', 'searchFiles'],
    mcpBindings: ['context7', 'auto-claude-tools'],
    isActive: true,
    status: 'idle',
  },
  {
    id: 'agent-spec-discovery',
    name: 'Spec Discovery',
    role: 'spec-discovery',
    category: 'spec-creation',
    model: 'llama3.2',
    description: 'Discovers edge cases and unknowns.',
    constraints: ['Read-only access'],
    allowedTools: ['readFile', 'searchFiles'],
    mcpBindings: ['context7', 'auto-claude-tools'],
    isActive: true,
    status: 'idle',
  },
  {
    id: 'agent-spec-context',
    name: 'Spec Context',
    role: 'spec-context',
    category: 'spec-creation',
    model: 'llama3.2',
    description: 'Gathers project and repository context.',
    constraints: ['Read-only access'],
    allowedTools: ['readFile', 'searchFiles', 'gitStatus'],
    mcpBindings: ['context7', 'graphiti', 'auto-claude-tools'],
    isActive: true,
    status: 'idle',
  },
  {
    id: 'agent-spec-validation',
    name: 'Spec Validation',
    role: 'spec-validation',
    category: 'spec-creation',
    model: 'llama3.2',
    description: 'Validates spec completeness and feasibility.',
    constraints: ['Read-only access'],
    allowedTools: ['readFile', 'searchFiles'],
    mcpBindings: ['context7', 'auto-claude-tools'],
    isActive: true,
    status: 'idle',
  },
  // Build
  {
    id: 'agent-planner',
    name: 'Planner',
    role: 'planner',
    category: 'build',
    model: 'llama3.2',
    description: 'Creates implementation plans from specifications.',
    constraints: ['Read-only access', 'Must break work into atomic tasks'],
    allowedTools: ['readFile', 'searchFiles'],
    mcpBindings: ['context7', 'graphiti', 'linear', 'auto-claude-tools'],
    isActive: true,
    status: 'idle',
  },
  {
    id: 'agent-coder',
    name: 'Coder',
    role: 'coder',
    category: 'build',
    model: 'codellama',
    description: 'Implements code changes. Only agent with write permissions.',
    constraints: ['Must follow plan exactly', 'Create atomic commits'],
    allowedTools: ['readFile', 'searchFiles', 'writeFile', 'applyPatch', 'runCommand', 'gitDiff', 'gitStatus', 'gitBranch', 'gitCommit'],
    mcpBindings: ['context7', 'graphiti', 'linear', 'auto-claude-tools'],
    isActive: true,
    status: 'idle',
  },
  {
    id: 'agent-qa',
    name: 'QA',
    role: 'qa',
    category: 'build',
    model: 'llama3.2',
    description: 'Runs quality checks and validates implementation.',
    constraints: ['Can run test commands', 'Must verify acceptance criteria'],
    allowedTools: ['readFile', 'searchFiles', 'runCommand', 'gitDiff'],
    mcpBindings: ['context7', 'electron', 'puppeteer', 'auto-claude-tools'],
    isActive: true,
    status: 'idle',
  },
  {
    id: 'agent-qa-reviewer',
    name: 'QA Reviewer',
    role: 'qa-reviewer',
    category: 'build',
    model: 'llama3.2',
    description: 'Reviews QA results and test coverage.',
    constraints: ['Read-only access'],
    allowedTools: ['readFile', 'searchFiles', 'gitDiff'],
    mcpBindings: ['context7', 'electron', 'puppeteer', 'auto-claude-tools'],
    isActive: true,
    status: 'idle',
  },
  {
    id: 'agent-qa-fixer',
    name: 'QA Fixer',
    role: 'qa-fixer',
    category: 'build',
    model: 'codellama',
    description: 'Fixes QA failures and failing tests.',
    constraints: ['Limited write access for fixes only'],
    allowedTools: ['readFile', 'searchFiles', 'writeFile', 'runCommand', 'gitDiff'],
    mcpBindings: ['context7', 'electron', 'puppeteer', 'auto-claude-tools'],
    isActive: true,
    status: 'idle',
  },
  // Utility
  {
    id: 'agent-pr-reviewer',
    name: 'PR Reviewer',
    role: 'pr-reviewer',
    category: 'utility',
    model: 'llama3.2',
    description: 'Reviews pull requests and suggests improvements.',
    constraints: ['Read-only access', 'Must provide actionable feedback'],
    allowedTools: ['readFile', 'searchFiles', 'gitDiff'],
    mcpBindings: ['context7', 'linear', 'auto-claude-tools'],
    isActive: true,
    status: 'idle',
  },
  {
    id: 'agent-commit',
    name: 'Commit Message Agent',
    role: 'commit-agent',
    category: 'utility',
    model: 'llama3.2',
    description: 'Writes clear, conventional commit messages.',
    constraints: ['Read-only access', 'Conventional commit format'],
    allowedTools: ['gitDiff', 'gitStatus'],
    mcpBindings: ['auto-claude-tools'],
    isActive: true,
    status: 'idle',
  },
  {
    id: 'agent-merge-resolver',
    name: 'Merge Resolver',
    role: 'merge-resolver',
    category: 'utility',
    model: 'codellama',
    description: 'Resolves merge conflicts intelligently.',
    constraints: ['Conflict resolution only'],
    allowedTools: ['readFile', 'searchFiles', 'writeFile', 'gitDiff', 'gitStatus'],
    mcpBindings: ['context7', 'auto-claude-tools'],
    isActive: true,
    status: 'idle',
  },
  // Insights
  {
    id: 'agent-analysis',
    name: 'Analysis',
    role: 'analysis',
    category: 'insights',
    model: 'llama3.2',
    description: 'Analyzes codebase patterns and architecture.',
    constraints: ['Read-only access'],
    allowedTools: ['readFile', 'searchFiles', 'gitDiff'],
    mcpBindings: ['context7', 'graphiti', 'auto-claude-tools'],
    isActive: true,
    status: 'idle',
  },
  {
    id: 'agent-batch-analysis',
    name: 'Batch Analysis',
    role: 'batch-analysis',
    category: 'insights',
    model: 'llama3.2',
    description: 'Bulk code analysis across multiple files.',
    constraints: ['Read-only access', 'Batch processing'],
    allowedTools: ['readFile', 'searchFiles'],
    mcpBindings: ['context7', 'graphiti', 'auto-claude-tools'],
    isActive: true,
    status: 'idle',
  },
  // Ideation
  {
    id: 'agent-ideation',
    name: 'Ideation Agent',
    role: 'ideation',
    category: 'ideation',
    model: 'llama3.2',
    description: 'Generates feature ideas and improvements.',
    constraints: ['Read-only access', 'Creative output'],
    allowedTools: ['readFile', 'searchFiles'],
    mcpBindings: ['context7', 'graphiti', 'auto-claude-tools'],
    isActive: true,
    status: 'idle',
  },
  {
    id: 'agent-roadmap',
    name: 'Roadmap Discovery',
    role: 'roadmap-discovery',
    category: 'ideation',
    model: 'llama3.2',
    description: 'Discovers and prioritizes roadmap items.',
    constraints: ['Read-only access'],
    allowedTools: ['readFile', 'searchFiles'],
    mcpBindings: ['context7', 'graphiti', 'linear', 'auto-claude-tools'],
    isActive: true,
    status: 'idle',
  },
];

// ============================================
// Default Tools
// ============================================

export const DEFAULT_TOOLS: Tool[] = [
  {
    name: 'readFile',
    description: 'Read the contents of a file at the specified path',
    parameters: [
      { name: 'path', type: 'string', description: 'File path relative to project root', required: true },
      { name: 'encoding', type: 'string', description: 'File encoding (utf-8 or base64)', required: false },
    ],
  },
  {
    name: 'searchFiles',
    description: 'Search for files matching a glob or regex pattern',
    parameters: [
      { name: 'pattern', type: 'string', description: 'Search pattern', required: true },
      { name: 'type', type: 'string', description: 'Pattern type: glob or regex', required: false },
      { name: 'includeContent', type: 'boolean', description: 'Include matching content', required: false },
    ],
  },
  {
    name: 'writeFile',
    description: 'Write content to a file at the specified path',
    parameters: [
      { name: 'path', type: 'string', description: 'File path relative to project root', required: true },
      { name: 'content', type: 'string', description: 'File content to write', required: true },
      { name: 'createDirectories', type: 'boolean', description: 'Create parent directories if needed', required: false },
    ],
    restrictedTo: ['coder'],
  },
  {
    name: 'applyPatch',
    description: 'Apply a diff patch to the codebase',
    parameters: [
      { name: 'patch', type: 'string', description: 'Unified diff patch content', required: true },
    ],
    restrictedTo: ['coder'],
  },
  {
    name: 'runCommand',
    description: 'Execute a shell command (restricted to whitelisted commands)',
    parameters: [
      { name: 'command', type: 'string', description: 'Command to execute', required: true },
      { name: 'args', type: 'array', description: 'Command arguments', required: false },
      { name: 'cwd', type: 'string', description: 'Working directory', required: false },
    ],
    restrictedTo: ['coder', 'qa'],
  },
  {
    name: 'gitDiff',
    description: 'Get the current git diff',
    parameters: [
      { name: 'staged', type: 'boolean', description: 'Get staged changes only', required: false },
      { name: 'file', type: 'string', description: 'Get diff for specific file', required: false },
    ],
  },
  {
    name: 'gitStatus',
    description: 'Get the current git status',
    parameters: [],
  },
  {
    name: 'gitBranch',
    description: 'Create or checkout a git branch',
    parameters: [
      { name: 'branchName', type: 'string', description: 'Branch name', required: true },
      { name: 'checkout', type: 'boolean', description: 'Checkout after creation', required: false },
    ],
    restrictedTo: ['coder'],
  },
  {
    name: 'gitCommit',
    description: 'Commit staged changes',
    parameters: [
      { name: 'message', type: 'string', description: 'Commit message', required: true },
      { name: 'files', type: 'array', description: 'Files to stage and commit', required: false },
    ],
    restrictedTo: ['coder'],
  },
];

// ============================================
// Phase Definitions
// ============================================

export const PHASE_ORDER: PhaseType[] = ['spec', 'plan', 'code', 'qa', 'review'];

export const PHASE_NAMES: Record<PhaseType, string> = {
  spec: 'Specification',
  plan: 'Planning',
  code: 'Implementation',
  qa: 'QA',
  review: 'Review',
};

export const PHASE_DESCRIPTIONS: Record<PhaseType, string> = {
  spec: 'Analyze requirements and produce detailed specifications',
  plan: 'Break down spec into actionable implementation tasks',
  code: 'Implement changes according to the plan',
  qa: 'Validate implementation against acceptance criteria',
  review: 'Review code changes and suggest improvements',
};

export function createDefaultPhases(): Phase[] {
  return PHASE_ORDER.map((id) => ({
    id,
    name: PHASE_NAMES[id],
    status: 'pending',
  }));
}

// ============================================
// Default Settings
// ============================================

export const DEFAULT_SETTINGS: Settings = {
  executionEngine: {
    activeProvider: 'ollama',
    ollama: {
      endpoint: 'http://localhost:11434',
      isConnected: false,
    },
    openrouter: {
      apiKey: '',
      isConnected: false,
    },
    availableModels: [],
    modelAssignments: {
      'spec-gatherer': 'llama3.2',
      'spec-researcher': 'llama3.2',
      'spec-writer': 'llama3.2',
      'spec-critic': 'llama3.2',
      'spec-discovery': 'llama3.2',
      'spec-context': 'llama3.2',
      'spec-validation': 'llama3.2',
      planner: 'llama3.2',
      coder: 'codellama',
      qa: 'llama3.2',
      'qa-reviewer': 'llama3.2',
      'qa-fixer': 'codellama',
      'pr-reviewer': 'llama3.2',
      'commit-agent': 'llama3.2',
      'merge-resolver': 'codellama',
      analysis: 'llama3.2',
      'batch-analysis': 'llama3.2',
      ideation: 'llama3.2',
      'roadmap-discovery': 'llama3.2',
      spec: 'llama3.2',
      reviewer: 'llama3.2',
    },
  },
  toolPermissions: {
    agentPermissions: {
      'agent-spec': ['readFile', 'searchFiles', 'gitStatus'],
      'agent-planner': ['readFile', 'searchFiles'],
      'agent-coder': ['readFile', 'searchFiles', 'writeFile', 'applyPatch', 'runCommand', 'gitDiff', 'gitStatus', 'gitBranch', 'gitCommit'],
      'agent-reviewer': ['readFile', 'searchFiles', 'gitDiff'],
      'agent-qa': ['readFile', 'searchFiles', 'runCommand', 'gitDiff'],
    },
    commandWhitelist: ['npm', 'npx', 'node', 'git', 'yarn', 'pnpm', 'bun'],
    pathRestrictions: ['.git', 'node_modules', '.env'],
  },
  project: {
    branchNamingPattern: 'ghostflow/{taskId}/{phase}',
    autoCommit: false,
    phaseTimeouts: {
      spec: 300000,
      plan: 300000,
      code: 600000,
      review: 300000,
      qa: 300000,
    },
    humanApprovalGates: ['code'],
  },
};

// ============================================
// Mock Data Generators
// ============================================

let mockIdCounter = 0;

export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now()}-${++mockIdCounter}`;
}

export function createMockProject(overrides: Partial<Project> = {}): Project {
  const id = generateId('proj');
  return {
    id,
    name: 'My Project',
    path: '/home/user/projects/my-project',
    description: 'A sample project for GhostFlow',
    createdAt: new Date(),
    lastOpenedAt: new Date(),
    tasks: [],
    ...overrides,
  };
}

export function createMockTask(projectId: string, overrides: Partial<Task> = {}): Task {
  const id = generateId('task');
  return {
    id,
    title: 'Implement feature',
    description: 'Add a new feature to the application',
    status: 'ready',
    currentPhase: 'spec',
    phases: createDefaultPhases(),
    projectId,
    createdAt: new Date(),
    updatedAt: new Date(),
    assignedAgents: [],
    logs: [],
    humanApprovalRequired: true,
    ...overrides,
  };
}

export function createMockLogEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    id: generateId('log'),
    timestamp: new Date(),
    level: 'info',
    source: 'system',
    message: 'Log message',
    ...overrides,
  };
}

// ============================================
// Sample Mock Data
// ============================================

export function createSampleMockData() {
  const project = createMockProject({
    name: 'E-Commerce Platform',
    description: 'A full-featured e-commerce platform with React frontend',
  });

  const tasks: Task[] = [
    createMockTask(project.id, {
      title: 'Add shopping cart functionality',
      description: 'Implement a shopping cart with add/remove items, quantity updates, and persistent storage.',
      status: 'in_progress',
      currentPhase: 'code',
      phases: [
        { id: 'spec', name: 'Specification', status: 'completed', completedAt: new Date(Date.now() - 3600000) },
        { id: 'plan', name: 'Planning', status: 'completed', completedAt: new Date(Date.now() - 1800000) },
        { id: 'code', name: 'Implementation', status: 'active', startedAt: new Date(Date.now() - 900000) },
        { id: 'qa', name: 'QA', status: 'pending' },
        { id: 'review', name: 'Review', status: 'pending' },
      ],
      branch: 'ghostflow/cart-feature/code',
    }),
    createMockTask(project.id, {
      title: 'User authentication system',
      description: 'Implement user login, registration, and session management.',
      status: 'completed',
      currentPhase: 'review',
      phases: createDefaultPhases().map((p) => ({ ...p, status: 'completed' as const })),
    }),
    createMockTask(project.id, {
      title: 'Product search and filtering',
      description: 'Add search functionality with filters for category, price, and rating.',
      status: 'ready',
      currentPhase: 'spec',
    }),
    createMockTask(project.id, {
      title: 'Payment integration',
      description: 'Integrate Stripe for payment processing.',
      status: 'backlog',
      currentPhase: 'spec',
    }),
  ];

  project.tasks = tasks;

  return { project, tasks, agents: DEFAULT_AGENTS };
}

// ============================================
// Mock Terminal Entries
// ============================================

export function createMockTerminalEntries(): AgentTerminalEntry[] {
  const now = Date.now();
  return [
    {
      id: generateId('term'),
      agentRole: 'coder',
      phase: 'code',
      type: 'boundary',
      content: 'Implementation',
      timestamp: now - 120000,
    },
    {
      id: generateId('term'),
      agentRole: 'coder',
      phase: 'code',
      type: 'output',
      content: 'Analyzing repository structure...',
      timestamp: now - 115000,
    },
    {
      id: generateId('term'),
      agentRole: 'coder',
      phase: 'code',
      type: 'tool',
      content: 'src/**/*.tsx',
      timestamp: now - 110000,
      toolName: 'searchFiles',
    },
    {
      id: generateId('term'),
      agentRole: 'coder',
      phase: 'code',
      type: 'output',
      content: 'Found 12 TypeScript React files',
      timestamp: now - 105000,
    },
    {
      id: generateId('term'),
      agentRole: 'coder',
      phase: 'code',
      type: 'tool',
      content: 'src/components/Cart.tsx',
      timestamp: now - 100000,
      toolName: 'readFile',
    },
    {
      id: generateId('term'),
      agentRole: 'coder',
      phase: 'code',
      type: 'error',
      content: 'Warning: Cart.tsx has circular dependency',
      timestamp: now - 95000,
    },
    {
      id: generateId('term'),
      agentRole: 'coder',
      phase: 'code',
      type: 'output',
      content: 'Implementing addToCart function...',
      timestamp: now - 90000,
    },
    {
      id: generateId('term'),
      agentRole: 'spec',
      phase: 'spec',
      type: 'boundary',
      content: 'Specification',
      timestamp: now - 200000,
    },
    {
      id: generateId('term'),
      agentRole: 'spec',
      phase: 'spec',
      type: 'output',
      content: 'Reading project requirements...',
      timestamp: now - 195000,
    },
    {
      id: generateId('term'),
      agentRole: 'spec',
      phase: 'spec',
      type: 'tool',
      content: 'README.md',
      timestamp: now - 190000,
      toolName: 'readFile',
    },
  ];
}
