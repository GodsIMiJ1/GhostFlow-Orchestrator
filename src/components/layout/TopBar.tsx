import { PanelLeftClose, PanelRightClose, Settings, Moon, Sun, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOrchestration } from '@/context/OrchestrationContext';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';

export function TopBar() {
  const { state, toggleLeftSidebar, toggleRightSidebar, setTheme } = useOrchestration();
  const { leftSidebarOpen, rightSidebarOpen, theme } = state.ui;
  const { ollamaConnected } = state;
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/tasks', label: 'Tasks' },
    { path: '/agents', label: 'Agents' },
    { path: '/terminals', label: 'Terminals' },
    { path: '/mcp', label: 'MCP Overview' },
    { path: '/settings', label: 'Settings' },
  ];

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleLeftSidebar}
          className="text-muted-foreground hover:text-foreground"
        >
          <PanelLeftClose className={cn("h-5 w-5 transition-transform", !leftSidebarOpen && "rotate-180")} />
        </Button>

        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-mono font-bold text-sm">GF</span>
          </div>
          <span className="font-semibold text-lg tracking-tight">GhostFlow</span>
        </div>
      </div>

      {/* Center Navigation */}
      <nav className="flex items-center gap-1">
        {navItems.map((item) => (
          <Button
            key={item.path}
            variant="ghost"
            size="sm"
            onClick={() => navigate(item.path)}
            className={cn(
              "text-muted-foreground hover:text-foreground",
              location.pathname === item.path && "bg-accent text-accent-foreground"
            )}
          >
            {item.label}
          </Button>
        ))}
      </nav>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Ollama Connection Status */}
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border",
            ollamaConnected
              ? "status-success border-status-success/30"
              : "status-error border-status-error/30"
          )}
        >
          {ollamaConnected ? (
            <>
              <Wifi className="h-3 w-3" />
              <span>Ollama</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3" />
              <span>Offline</span>
            </>
          )}
        </div>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="text-muted-foreground hover:text-foreground"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        {/* Settings */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/settings')}
          className="text-muted-foreground hover:text-foreground"
        >
          <Settings className="h-5 w-5" />
        </Button>

        {/* Right Panel Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleRightSidebar}
          className="text-muted-foreground hover:text-foreground"
        >
          <PanelRightClose className={cn("h-5 w-5 transition-transform", !rightSidebarOpen && "rotate-180")} />
        </Button>
      </div>
    </header>
  );
}
