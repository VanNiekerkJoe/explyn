import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Braces,
  ChevronRight,
  CircleUserRound,
  Code2,
  FolderKanban,
  Github,
  GraduationCap,
  MessageSquareText,
  Settings,
  TerminalSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { getAIConfig, isAIConfigured } from "@/lib/ai";

const quickCommands = [
  { command: "/console", label: "Open the AI console", route: "/console" },
  { command: "/analyze", label: "Analyze a file or codebase", route: "/upload" },
  { command: "/courses", label: "Browse coding courses", route: "/courses" },
  { command: "/learn", label: "Start a focused lesson", route: "/learn" },
  { command: "/practice", label: "Solve a coding challenge", route: "/practice" },
  { command: "/tutor", label: "Ask the AI tutor", route: "/tutor" },
  { command: "/projects", label: "Open saved work", route: "/dashboard" },
  { command: "/settings", label: "Connect or change your AI", route: "/settings" },
];

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const commandRef = useRef<HTMLInputElement>(null);
  const [command, setCommand] = useState("");
  const [aiConnected, setAiConnected] = useState(() => isAIConfigured());

  useEffect(() => {
    const syncAI = () => setAiConnected(isAIConfigured());
    const focusCommand = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        commandRef.current?.focus();
      }
    };
    window.addEventListener("explyn:ai-config-changed", syncAI);
    window.addEventListener("storage", syncAI);
    window.addEventListener("keydown", focusCommand);
    return () => {
      window.removeEventListener("explyn:ai-config-changed", syncAI);
      window.removeEventListener("storage", syncAI);
      window.removeEventListener("keydown", focusCommand);
    };
  }, []);

  const matches = useMemo(() => {
    const value = command.trim().toLowerCase();
    if (!value) return [];
    return quickCommands.filter(
      (item) => item.command.includes(value) || item.label.toLowerCase().includes(value),
    ).slice(0, 4);
  }, [command]);

  const runCommand = (event: FormEvent) => {
    event.preventDefault();
    const value = command.trim().toLowerCase();
    const exact = quickCommands.find((item) => item.command === value);
    const destination = exact ?? matches[0];
    navigate(destination?.route ?? `/console${command.trim() ? `?prompt=${encodeURIComponent(command.trim())}` : ""}`);
  };

  const model = aiConnected ? getAIConfig().model : "not connected";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 opacity-[0.045] [background-image:linear-gradient(hsl(var(--border))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border))_1px,transparent_1px)] [background-size:28px_28px]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <header className="flex min-h-14 items-center justify-between border-b border-border pb-4">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="font-mono text-lg font-bold text-foreground sm:text-xl"
              aria-label="Explyn home"
            >
              Explyn.
            </button>
            <span className="hidden rounded-sm border border-border px-2 py-1 font-mono text-[10px] uppercase text-muted-foreground sm:inline-flex">
              open source / local first
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-3">
            <button
              type="button"
              onClick={() => navigate("/settings")}
              className="hidden items-center gap-2 px-2 py-2 font-mono text-[10px] uppercase text-muted-foreground transition-colors hover:text-foreground sm:flex"
            >
              <span className={`h-1.5 w-1.5 ${aiConnected ? "bg-foreground" : "border border-muted-foreground"}`} />
              AI {aiConnected ? "connected" : "offline"}
            </button>
            <Button variant="ghost" size="icon" onClick={() => navigate("/settings")} aria-label="AI settings">
              <Settings />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate(user ? "/dashboard" : "/auth")} aria-label={user ? "Open workspace" : "Open local account"}>
              <CircleUserRound />
            </Button>
          </div>
        </header>

        <main className="flex flex-1 flex-col justify-center py-8 sm:py-12">
          <section className="mb-7 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="mb-3 font-mono text-[10px] uppercase text-muted-foreground">// your code. your model. your machine.</p>
              <h1 className="max-w-3xl font-mono text-3xl font-bold leading-tight sm:text-5xl">
                The open-source classroom for understanding code.
              </h1>
            </div>
            <div className="hidden font-mono text-[10px] leading-5 text-muted-foreground lg:block" aria-hidden="true">
              ┌─ LOCAL WORKSPACE ─────┐<br />
              │ data stays here&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│<br />
              │ model belongs to you │<br />
              └───────────────────────┘
            </div>
          </section>

          <form onSubmit={runCommand} className="relative z-20 mb-4">
            <label htmlFor="home-command" className="sr-only">Run a command</label>
            <div className="flex min-h-14 items-center border border-border bg-card transition-colors focus-within:border-foreground/50">
              <span className="pl-4 font-mono text-muted-foreground" aria-hidden="true">›</span>
              <input
                ref={commandRef}
                id="home-command"
                value={command}
                onChange={(event) => setCommand(event.target.value)}
                placeholder="Type /console, /analyze, /learn or ask anything…"
                className="h-14 min-w-0 flex-1 bg-transparent px-3 font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground sm:text-sm"
              />
              <kbd className="mr-3 hidden border border-border px-2 py-1 font-mono text-[9px] text-muted-foreground sm:block">CTRL K</kbd>
              <Button type="submit" size="icon" className="mr-2 h-10 w-10" aria-label="Run command">
                <ArrowRight />
              </Button>
            </div>
            {matches.length > 0 && (
              <div className="absolute inset-x-0 top-[calc(100%+4px)] border border-border bg-popover p-1 shadow-2xl">
                {matches.map((item) => (
                  <button
                    type="button"
                    key={item.command}
                    onClick={() => navigate(item.route)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-accent"
                  >
                    <span className="font-mono text-xs text-foreground">{item.command}</span>
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </form>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-12" aria-label="Workspace tools">
            <div className="grid grid-cols-2 gap-4 md:col-span-7">
              <button
                type="button"
                onClick={() => navigate("/console")}
                className="group col-span-2 min-h-52 border border-border bg-card/60 p-5 text-left transition-colors hover:bg-accent sm:p-6"
              >
                <div className="mb-8 flex items-start justify-between">
                  <span className="flex h-10 w-10 items-center justify-center border border-border bg-background">
                    <TerminalSquare className="h-5 w-5" />
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">/console</span>
                </div>
                <h2 className="mb-2 font-mono text-lg font-bold">OpenCode Console</h2>
                <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                  Talk to your own AI with slash commands for models, skill modes, explanation depth, debugging, tests, and refactors.
                </p>
                <div className="mt-5 flex flex-wrap gap-2 font-mono text-[9px] text-muted-foreground">
                  <span className="border border-border px-2 py-1">/model</span>
                  <span className="border border-border px-2 py-1">/skills</span>
                  <span className="border border-border px-2 py-1">/beginner</span>
                </div>
              </button>

              <button type="button" onClick={() => navigate("/upload")} className="group min-h-40 border border-border bg-card/60 p-4 text-left transition-colors hover:bg-accent sm:p-5">
                <Braces className="mb-7 h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                <h2 className="mb-1 font-mono text-sm font-bold">Analyze code</h2>
                <p className="text-xs leading-relaxed text-muted-foreground">Import files or a public repository. Build a code tree and inspect each expression.</p>
              </button>

              <button type="button" onClick={() => navigate(user ? "/dashboard" : "/auth")} className="group min-h-40 border border-border bg-card/60 p-4 text-left transition-colors hover:bg-accent sm:p-5">
                <FolderKanban className="mb-7 h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                <h2 className="mb-1 font-mono text-sm font-bold">Local workspace</h2>
                <p className="text-xs leading-relaxed text-muted-foreground">Projects, snippets, notes, and history saved only inside your browser.</p>
              </button>
            </div>

            <div className="flex flex-col gap-4 md:col-span-5">
              <div className="flex-1 border border-border bg-card/60 p-5 sm:p-6">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="font-mono text-[10px] font-bold uppercase text-muted-foreground">Learning system</h2>
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="divide-y divide-border border-y border-border">
                  {[
                    ["01", "Coding courses", "/courses", BookOpen],
                    ["02", "Topic lab", "/learn", Code2],
                    ["03", "Practice mode", "/practice", Braces],
                  ].map(([number, label, route, Icon]) => (
                    <button key={String(route)} type="button" onClick={() => navigate(String(route))} className="group flex w-full items-center gap-3 py-4 text-left">
                      <span className="font-mono text-[10px] text-muted-foreground">{String(number)}</span>
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 text-sm font-medium">{String(label)}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
                    </button>
                  ))}
                </div>
              </div>

              <button type="button" onClick={() => navigate("/tutor")} className="group flex min-h-28 items-center gap-4 border border-border bg-card/60 p-5 text-left transition-colors hover:bg-accent">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-border bg-background">
                  <MessageSquareText className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="mb-1 block font-mono text-sm font-bold">Ask tutor</span>
                  <span className="block text-xs leading-relaxed text-muted-foreground">A patient, context-aware guide that teaches at your level.</span>
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </section>
        </main>

        <footer className="flex flex-col gap-3 border-t border-border py-4 font-mono text-[10px] uppercase text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="inline-flex items-center gap-1.5"><Github className="h-3 w-3" /> open source</span>
            <span>browser storage</span>
            <span>bring your own AI</span>
          </div>
          <button type="button" onClick={() => navigate("/settings")} className="text-left transition-colors hover:text-foreground sm:text-right">
            model: {model}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default Index;