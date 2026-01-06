import { ThreePaneLayout } from '@/components/layout/ThreePaneLayout';
import { MCPServerList } from '@/components/mcp';
import { useOrchestration } from '@/context/OrchestrationContext';

export default function MCPOverviewPage() {
  const { state, dispatch } = useOrchestration();
  const { mcpServers } = state;

  const enabledCount = mcpServers.filter((s) => s.enabled).length;

  const handleToggle = (id: string) => {
    dispatch({ type: 'TOGGLE_MCP_SERVER', payload: id });
  };

  return (
    <ThreePaneLayout>
      <div className="h-full p-6 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">MCP Server Overview</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Configure which MCP servers are available for agents in this project
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{enabledCount}</span> servers enabled
            </div>
          </div>

          {/* Server List */}
          <MCPServerList servers={mcpServers} onToggle={handleToggle} />
        </div>
      </div>
    </ThreePaneLayout>
  );
}
