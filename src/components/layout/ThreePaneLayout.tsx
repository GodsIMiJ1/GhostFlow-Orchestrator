import { ReactNode, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useOrchestration } from '@/context/OrchestrationContext';
import { LeftSidebar } from './LeftSidebar';
import { RightPanel } from './RightPanel';
import { TopBar } from './TopBar';

interface ThreePaneLayoutProps {
  children: ReactNode;
}

export function ThreePaneLayout({ children }: ThreePaneLayoutProps) {
  const { state, dispatch, toggleRightSidebar } = useOrchestration();
  const { leftSidebarOpen, rightSidebarOpen, rightSidebarActiveTab, theme } = state.ui;

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  const handleTabChange = (tab: 'git' | 'agents' | 'config') => {
    dispatch({ type: 'OPEN_RIGHT_SIDEBAR_WITH_TAB', payload: tab });
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Top Bar */}
      <TopBar />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside
          className={cn(
            "flex-shrink-0 border-r border-border bg-sidebar transition-all duration-300 ease-in-out",
            leftSidebarOpen ? "w-72" : "w-0"
          )}
        >
          {leftSidebarOpen && <LeftSidebar />}
        </aside>

        {/* Center Panel */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>

        {/* Right Panel - Slide-in Drawer */}
        <div
          className={cn(
            "fixed right-0 top-12 bottom-0 z-40 border-l border-border bg-sidebar transition-transform duration-300 ease-in-out w-80",
            rightSidebarOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          <RightPanel 
            activeTab={rightSidebarActiveTab} 
            onTabChange={handleTabChange}
          />
        </div>
        {/* Overlay when drawer is open */}
        {rightSidebarOpen && (
          <div 
            className="fixed inset-0 z-30 bg-background/50 backdrop-blur-sm"
            onClick={toggleRightSidebar}
          />
        )}
      </div>
    </div>
  );
}
