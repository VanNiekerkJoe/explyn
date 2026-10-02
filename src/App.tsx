import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import Upload from "./pages/Upload";
import Report from "./pages/Report";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import SnippetView from "./pages/SnippetView";
import ProjectView from "./pages/ProjectView";
import ShareView from "./pages/ShareView";
import Learn from "./pages/Learn";
import Practice from "./pages/Practice";
import Tutor from "./pages/Tutor";
import Courses from "./pages/Courses";
import Course from "./pages/Course";
import NotFound from "./pages/NotFound";
import Console from "./pages/Console";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/report" element={<Report />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/snippet/:id" element={<SnippetView />} />
          <Route path="/project/:id" element={<ProjectView />} />
          <Route path="/share/:slug" element={<ShareView />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/tutor" element={<Tutor />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:id" element={<Course />} />
          <Route path="/console" element={<Console />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
