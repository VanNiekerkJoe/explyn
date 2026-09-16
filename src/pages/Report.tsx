import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircle, Loader2, ChevronDown, ChevronRight, Send, X, Save, BookOpen, Cpu, Code2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import InteractiveCodeViewer from "@/components/InteractiveCodeViewer";
import { streamAnalysis, streamCodeChat } from "@/lib/stream";
import { isAIConfigured } from "@/lib/ai";
import { useAuth } from "@/lib/auth";
import { createSnippet } from "@/lib/localdb";
import type { UploadedFile } from "./Upload";

type ChatMessage = { role: "user" | "assistant"; content: string };

const MODE_LABELS = { explain: "Analysis Report", debug: "Debug Report", learn: "Learning Lesson" };

const Report = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]));
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const filesRef = useRef<UploadedFile[]>([]);
  const levelRef = useRef<string>("beginner");
  const modeRef = useRef<string>("explain");
  const [needsAI, setNeedsAI] = useState(false);
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("explyn_files");
    const level = sessionStorage.getItem("explyn_level") || "beginner";
    const mode = sessionStorage.getItem("explyn_mode") || "explain";
    if (!raw) { navigate("/upload"); return; }
    const files: UploadedFile[] = JSON.parse(raw);
    filesRef.current = files;
    levelRef.current = level;
    modeRef.current = mode;
    if (!isAIConfigured()) {
      setNeedsAI(true);
      setLoading(false);
      return;
    }
    analyzeCode(files, level, mode);
  }, []);

  const analyzeCode = async (files: UploadedFile[], level: string, mode: string) => {
    setLoading(true);
    setProgress(10);
    try {
      const filesSummary = files.map((f) => ({
        path: f.path, language: f.language, content: f.content.slice(0, 8000),
      }));
      setProgress(30);
      let fullReport = "";
      await streamAnalysis(filesSummary, level, mode, (chunk) => {
        fullReport += chunk;
        setReport(fullReport);
        setProgress(Math.min(30 + (fullReport.length / 500) * 5, 95));
      });
      setProgress(100);
    } catch (err: any) {
      toast({ title: "Analysis failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const saveSnippet = async () => {
    if (!user) {
      toast({ title: "Create a local account to save", description: "Your library is stored in this browser." });
      navigate("/auth");
      return;
    }
    setSaving(true);
    try {
      const firstFile = filesRef.current[0];
      createSnippet({
        user_id: user.id,
        title: firstFile?.path?.split("/").pop() || "Untitled snippet",
        code: filesRef.current.map((f) => `// ${f.path}\n${f.content}`).join("\n\n"),
        language: firstFile?.language || "Unknown",
        explanation: report,
        level: levelRef.current,
        mode: modeRef.current,
      });
      toast({ title: "Saved to library!" });
    } catch (err: any) {
      toast({ title: "Error saving", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };


  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg: ChatMessage = { role: "user", content: chatInput };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);
    const allMessages = [...chatMessages, userMsg];
    let assistantContent = "";
    try {
      await streamCodeChat(
        allMessages,
        filesRef.current.map((f) => ({ path: f.path, content: f.content.slice(0, 4000) })),
        levelRef.current,
        (chunk) => {
          assistantContent += chunk;
          setChatMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant") {
              return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantContent } : m));
            }
            return [...prev, { role: "assistant", content: assistantContent }];
          });
        },
      );
    } catch (err: any) {
      toast({ title: "Chat error", description: err.message, variant: "destructive" });
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const sections = report.split(/(?=^## )/m).filter(Boolean);
  const toggleSection = (i: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const mdComponents = {
    code({ className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || "");
      return match ? (
        <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div" customStyle={{ borderRadius: "0.75rem", fontSize: "0.75rem", background: "hsl(0 0% 8%)" }}>
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      ) : (
        <code className="bg-muted px-1.5 py-0.5 rounded text-xs sm:text-sm" {...props}>{children}</code>
      );
    },
  };

  const currentMode = modeRef.current as keyof typeof MODE_LABELS;

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <div className="noise" aria-hidden="true" />
      <div className="bg-orb orb-1" aria-hidden="true" />

      <div className="relative z-10">
        <nav className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
            <button onClick={() => navigate("/upload")} className="flex items-center gap-2 sm:gap-3 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="font-bold text-foreground tracking-tight text-sm sm:text-base">Explyn<span className="text-muted-foreground">.</span></span>
            </button>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button onClick={() => setShowCode(!showCode)} className={`btn-ghost text-xs sm:text-sm gap-1 sm:gap-2 px-2 sm:px-3 ${showCode ? "text-foreground" : ""}`}>
                <Code2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Code</span>
              </button>
              <button onClick={saveSnippet} disabled={saving || loading} className="btn-ghost text-xs sm:text-sm gap-1 sm:gap-2 px-2 sm:px-3 disabled:opacity-40">
                <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">{saving ? "Saving…" : "Save"}</span>
              </button>
              <button onClick={() => setChatOpen(!chatOpen)} className="btn-ghost text-xs sm:text-sm gap-1 sm:gap-2 px-2 sm:px-3">
                <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Ask</span>
              </button>
            </div>
          </div>
        </nav>

        <div className="pt-20 sm:pt-28 pb-16 px-4 sm:px-6 max-w-6xl mx-auto flex flex-col lg:flex-row gap-4 sm:gap-6">
          <div className={`flex-1 min-w-0 transition-all duration-300 ${chatOpen ? "lg:max-w-[58%]" : ""}`}>
            {/* Mode badge */}
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
              <span className="eyebrow text-[10px] sm:text-xs">{MODE_LABELS[currentMode] || "Report"}</span>
              <span className="px-2 py-0.5 rounded-full border border-border text-[9px] sm:text-[10px] text-muted-foreground capitalize">{levelRef.current}</span>
            </div>

            {creditGated && (
              <div className="glass-panel rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center mb-6 sm:mb-8">
                <Zap className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-3 text-muted-foreground" />
                <h3 className="font-semibold text-base sm:text-lg mb-2">Out of credits</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
                  You've used all your credits this month. Upgrade your plan or wait for the reset.
                </p>
                <button onClick={() => navigate("/pricing")} className="btn-primary text-sm">View plans</button>
              </div>
            )}

            {loading && (
              <div className="glass-panel rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {modeRef.current === "debug" ? "Scanning for bugs…" : modeRef.current === "learn" ? "Creating lesson…" : "Analysing your code…"}
                  </span>
                </div>
                <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-foreground rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            {sections.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {sections.map((section, i) => {
                  const lines = section.split("\n");
                  const title = lines[0]?.replace(/^#{1,3}\s*/, "") || `Section ${i + 1}`;
                  const body = lines.slice(1).join("\n");
                  const isOpen = expandedSections.has(i);
                  return (
                    <div key={i} className="glass-panel rounded-xl overflow-hidden">
                      <button onClick={() => toggleSection(i)} className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-foreground/[0.03] transition-colors">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <span className="text-[10px] sm:text-xs text-muted-foreground font-mono shrink-0">{String(i + 1).padStart(2, "0")}</span>
                          <span className="font-semibold text-sm sm:text-base truncate">{title}</span>
                        </div>
                        {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                      </button>
                      {isOpen && (
                        <div className="px-4 sm:px-5 pb-4 sm:pb-5 prose prose-sm prose-invert max-w-none text-sm">
                          <ReactMarkdown components={mdComponents}>{body}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : !loading ? (
              <div className="glass-panel rounded-2xl p-8 sm:p-12 text-center">
                <p className="text-muted-foreground text-sm">No report generated yet.</p>
              </div>
            ) : null}

            {/* Interactive source code viewer */}
            {showCode && filesRef.current.length > 0 && (
              <div className="mt-4 sm:mt-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Code2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                  <span className="eyebrow text-[10px] sm:text-xs">Interactive Source · Click any expression to explain</span>
                </div>
                {filesRef.current.map((file, i) => (
                  <InteractiveCodeViewer
                    key={i}
                    code={file.content}
                    language={file.language}
                    fileName={file.path}
                    level={levelRef.current}
                    onAskFollowUp={(question) => {
                      setChatOpen(true);
                      setChatInput(question);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Chat panel - full screen overlay on mobile, side panel on desktop */}
          {chatOpen && (
            <div className="fixed inset-0 z-50 lg:relative lg:inset-auto lg:z-auto lg:w-[40%] lg:shrink-0">
              <div className="h-full lg:h-auto glass-panel lg:rounded-2xl flex flex-col lg:max-h-[calc(100vh-8rem)] lg:sticky lg:top-24 bg-background lg:bg-transparent">
                <div className="p-4 sm:p-5 border-b border-border/50 flex items-center justify-between safe-area-top">
                  <div>
                    <h3 className="font-semibold text-sm">Ask about your code</h3>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Context-aware AI assistant</p>
                  </div>
                  <button onClick={() => setChatOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                    <X className="h-5 w-5 lg:h-4 lg:w-4" />
                  </button>
                </div>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    {chatMessages.length === 0 && (
                      <div className="text-center py-6 sm:py-8">
                        <p className="text-xs sm:text-sm text-muted-foreground">Ask anything about your codebase</p>
                        <div className="mt-4 space-y-2">
                          {["Why is this code structured this way?", "Can this be optimised?", "What pattern is used here?"].map((q) => (
                            <button key={q} onClick={() => { setChatInput(q); }} className="block w-full text-left text-xs text-muted-foreground px-3 py-2.5 rounded-lg border border-border hover:border-foreground/20 transition-colors">
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm ${msg.role === "user" ? "bg-foreground text-background" : "bg-card border border-border"}`}>
                          {msg.role === "assistant" ? (
                            <div className="prose prose-sm prose-invert max-w-none">
                              <ReactMarkdown components={mdComponents}>{msg.content}</ReactMarkdown>
                            </div>
                          ) : msg.content}
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-card border border-border rounded-2xl px-4 py-2.5">
                          <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse" />
                            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse" style={{ animationDelay: "0.15s" }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse" style={{ animationDelay: "0.3s" }} />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                </ScrollArea>
                <div className="p-4 border-t border-border/50 safe-area-bottom">
                  <form onSubmit={(e) => { e.preventDefault(); sendChatMessage(); }} className="flex gap-2">
                    <Input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask a question…" className="bg-card border-border rounded-full text-sm" />
                    <button type="submit" disabled={chatLoading || !chatInput.trim()} className="btn-primary p-2.5 rounded-full disabled:opacity-40">
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Report;
