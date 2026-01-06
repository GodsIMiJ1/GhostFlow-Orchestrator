import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { OrchestrationProvider } from "@/context/OrchestrationContext";
import Dashboard from "./pages/Dashboard";
import TasksPage from "./pages/TasksPage";
import AgentsPage from "./pages/AgentsPage";
import AgentTerminalsPage from "./pages/AgentTerminalsPage";
import MCPOverviewPage from "./pages/MCPOverviewPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <OrchestrationProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/agents" element={<AgentsPage />} />
            <Route path="/terminals" element={<AgentTerminalsPage />} />
            <Route path="/mcp" element={<MCPOverviewPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </OrchestrationProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
