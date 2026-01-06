import { MCPServer } from '@/types/mcp';
import { MCPServerRow } from './MCPServerRow';

interface MCPServerListProps {
  servers: MCPServer[];
  onToggle: (id: string) => void;
}

export function MCPServerList({ servers, onToggle }: MCPServerListProps) {
  return (
    <div className="space-y-3">
      {servers.map((server) => (
        <MCPServerRow key={server.id} server={server} onToggle={onToggle} />
      ))}
    </div>
  );
}
