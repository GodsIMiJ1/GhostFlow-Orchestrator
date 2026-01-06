import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrchestration } from '@/context/OrchestrationContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { state, addProject } = useOrchestration();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [path, setPath] = useState('');
  const hasProjects = state.projects.length > 0;

  const handleCreate = () => {
    if (!name.trim()) return;
    addProject({ name: name.trim(), path: path.trim() || 'local', description: '' });
    navigate('/tasks');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-4 p-6 rounded-lg border bg-card">
        <h1 className="text-2xl font-bold text-center">GhostFlow Projects</h1>
        {hasProjects ? (
          <div className="text-center space-y-3">
            <p className="text-muted-foreground">Projects detected. Continue to dashboard.</p>
            <Button className="w-full" onClick={() => navigate('/tasks')}>
              Open Dashboard
            </Button>
          </div>
        ) : (
          <>
            <p className="text-muted-foreground text-center">
              Create a project to begin. You can enter your repo path or keep it local.
            </p>
            <div className="space-y-2">
              <Input
                placeholder="Project name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                placeholder="Repository path (optional)"
                value={path}
                onChange={(e) => setPath(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={handleCreate}>
              Create Project
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
