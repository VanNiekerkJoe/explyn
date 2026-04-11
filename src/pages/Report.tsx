import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircle, Loader2, ChevronDown, ChevronRight, Send, X, Save, BookOpen, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useCredits } from "@/hooks/useCredits";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { supabase } from "@/integrations/supabase/client";
import type { UploadedFile } from "./Upload";

type ChatMessage = { role: "user" | "assistant"; content: string };

const MODE_LABELS = { explain: "Analysis Report", debug: "Debug Report", learn: "Learning Lesson" };

const Report = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
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
  const { hasCredits, useCredit, remaining } = useCredits();
  const [creditGated, setCreditGated] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("explyn_files");
    const level = sessionStorage.getItem("explyn_level") || "beginner";
    const mode = sessionStorage.getItem("explyn_mode") || "explain";
    if (!raw) { navigate("/upload"); return; }
    const files: UploadedFile[] = JSON.parse(raw);
    filesRef.current = files;
    levelRef.current = level;
    modeRef.current = mode;
    analyzeCode(files, level, mode);
  }, []);

  const streamSSE = async (url: string, body: any, onDelta: (text: string) => void) => {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Request failed (${response.status})`);
    }
    if (!response.body) throw new Error("No response body");
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let ni: number;
      while ((ni = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, ni);
        buffer = buffer.slice(ni + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line.startsWith("data: ")) continue;
        const js = line.slice(6).trim();
        if (js === "[DONE]") return;
        try {
          const p = JSON.parse(js);
          const c = p.choices?.[0]?.delta?.content;
          if (c) onDelta(c);
        } catch {
          buffer = line + "\n" + buffer;
          break;
        }
      }
    }
  };

  const analyzeCode = async (files: UploadedFile[], level: string, mode: string) => {
    setLoading(true);
    setProgress(10);

    // Check credits (allow unauthenticated users a free pass for now)
    const { data: { session } } = await supabase.auth.getSession();
    if (session && !hasCredits) {
      setCreditGated(true);
      setLoading(false);
      return;
    }

    // Deduct credit for authenticated users
    if (session) {
      const success = await useCredit(1, `${mode} analysis`);
      if (!success) {
        setCreditGated(true);
        setLoading(false);
        return;
      }
    }

    try {
      const filesSummary = files.map((f) => ({
        path: f.path, language: f.language, content: f.content.slice(0, 8000),
      }));
      setProgress(30);
      let fullReport = "";
      await streamSSE(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-code`,
        { files: filesSummary, level, mode },
        (chunk) => {
          fullReport += chunk;
          setReport(fullReport);
          setProgress(Math.min(30 + (fullReport.length / 500) * 5, 95));
        },
      );
      setProgress(100);
    } catch (err: any) {
      toast({ title: "Analysis failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const saveSnippet = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({ title: "Sign in to save", description: "Create an account to save snippets to your library." });
      navigate("/auth");
      return;
    }
    setSaving(true);
    const firstFile = filesRef.current[0];
    const title = firstFile?.path?.split("/").pop() || "Untitled snippet";
    const { error } = await supabase.from("snippets").insert({
      user_id: session.user.id,
      title,
      code: filesRef.current.map((f) => `// ${f.path}\n${f.content}`).join("\n\n"),
      language: firstFile?.language || "Unknown",
      explanation: report,
      level: levelRef.current,
      mode: modeRef.current,
    });
    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved to library!" });
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
      await streamSSE(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-code`,
        {
          messages: allMessages,
          codeContext: filesRef.current.map((f) => ({ path: f.path, content: f.content.slice(0, 4000) })),
          level: levelRef.current,
        },
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
        <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div" customStyle={{ borderRadius: "0.75rem", fontSize: "0.8rem", background: "hsl(0 0% 8%)" }}>
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      ) : (
        <code className="bg-muted px-1.5 py-0.5 rounded text-sm" {...props}>{children}</code>
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
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <button onClick={() => navigate("/upload")} className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="font-bold text-foreground tracking-tight">explyn</span>
            </button>
            <div className="flex items-center gap-2">
              <button onClick={saveSnippet} disabled={saving || loading} className="btn-ghost text-sm gap-2 disabled:opacity-40">
                <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save"}
              </button>
              <button onClick={() => setChatOpen(!chatOpen)} className="btn-ghost text-sm gap-2">
                <MessageCircle className="h-4 w-4" /> Ask
              </button>
            </div>
          </div>
        </nav>

        <div className="pt-28 pb-16 px-6 max-w-6xl mx-auto flex gap-6">
          <div className={`flex-1 min-w-0 transition-all duration-300 ${chatOpen ? "max-w-[58%]" : ""}`}>
            {/* Mode badge */}
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="eyebrow">{MODE_LABELS[currentMode] || "Report"}</span>
              <span className="px-2 py-0.5 rounded-full border border-border text-[10px] text-muted-foreground capitalize">{levelRef.current}</span>
            </div>

            {creditGated && (
              <div className="glass-panel rounded-2xl p-8 text-center mb-8">
                <Zap className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                <h3 className="font-semibold text-lg mb-2">Out of credits</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  You've used all your credits this month. Upgrade your plan or wait for the reset.
                </p>
                <button onClick={() => navigate("/pricing")} className="btn-primary">View plans</button>
              </div>
            )}

            {loading && (
              <div className="glass-panel rounded-2xl p-6 mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    {modeRef.current === "debug" ? "Scanning for bugs…" : modeRef.current === "learn" ? "Creating lesson…" : "Analysing your code…"}
                  </span>
                </div>
                <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-foreground rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            {sections.length > 0 ? (
              <div className="space-y-3">
                {sections.map((section, i) => {
                  const lines = section.split("\n");
                  const title = lines[0]?.replace(/^#{1,3}\s*/, "") || `Section ${i + 1}`;
                  const body = lines.slice(1).join("\n");
                  const isOpen = expandedSections.has(i);
                  return (
                    <div key={i} className="glass-panel rounded-xl overflow-hidden">
                      <button onClick={() => toggleSection(i)} className="w-full flex items-center justify-between p-5 text-left hover:bg-foreground/[0.03] transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground font-mono">{String(i + 1).padStart(2, "0")}</span>
                          <span className="font-semibold">{title}</span>
                        </div>
                        {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5 prose prose-sm prose-invert max-w-none">
                          <ReactMarkdown components={mdComponents}>{body}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : !loading ? (
              <div className="glass-panel rounded-2xl p-12 text-center">
                <p className="text-muted-foreground">No report generated yet.</p>
              </div>
            ) : null}
          </div>

          {/* Chat panel */}
          {chatOpen && (
            <div className="w-[40%] shrink-0 glass-panel rounded-2xl flex flex-col max-h-[calc(100vh-8rem)] sticky top-24">
              <div className="p-5 border-b border-border/50 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm">Ask about your code</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Context-aware AI assistant</p>
                </div>
                <button onClick={() => setChatOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {chatMessages.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">Ask anything about your codebase</p>
                      <div className="mt-4 space-y-2">
                        {["Why is this code structured this way?", "Can this be optimised?", "What pattern is used here?"].map((q) => (
                          <button key={q} onClick={() => { setChatInput(q); }} className="block w-full text-left text-xs text-muted-foreground px-3 py-2 rounded-lg border border-border hover:border-foreground/20 transition-colors">
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${msg.role === "user" ? "bg-foreground text-background" : "bg-card border border-border"}`}>
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
              <div className="p-4 border-t border-border/50">
                <form onSubmit={(e) => { e.preventDefault(); sendChatMessage(); }} className="flex gap-2">
                  <Input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask a question…" className="bg-card border-border rounded-full text-sm" />
                  <button type="submit" disabled={chatLoading || !chatInput.trim()} className="btn-primary p-3 rounded-full disabled:opacity-30">
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Report;
