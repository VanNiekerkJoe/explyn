import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircle, Loader2, ChevronDown, ChevronRight, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { supabase } from "@/integrations/supabase/client";
import type { UploadedFile } from "./Upload";

type ChatMessage = { role: "user" | "assistant"; content: string };

const Report = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const filesRef = useRef<UploadedFile[]>([]);
  const levelRef = useRef<string>("beginner");

  useEffect(() => {
    const raw = sessionStorage.getItem("explyn_files");
    const level = sessionStorage.getItem("explyn_level") || "beginner";
    if (!raw) {
      navigate("/upload");
      return;
    }
    const files: UploadedFile[] = JSON.parse(raw);
    filesRef.current = files;
    levelRef.current = level;
    analyzeCode(files, level);
  }, []);

  const analyzeCode = async (files: UploadedFile[], level: string) => {
    setLoading(true);
    setProgress(10);

    try {
      const filesSummary = files.map((f) => ({
        path: f.path,
        language: f.language,
        content: f.content.slice(0, 8000),
      }));

      setProgress(30);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-code`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ files: filesSummary, level }),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Analysis failed");
      }

      if (!response.body) throw new Error("No response body");

      setProgress(50);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullReport = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullReport += content;
              setReport(fullReport);
              setProgress(Math.min(50 + (fullReport.length / 500) * 5, 95));
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      setProgress(100);
    } catch (err: any) {
      toast({ title: "Analysis failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
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
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-code`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: allMessages,
            codeContext: filesRef.current.map((f) => ({ path: f.path, content: f.content.slice(0, 4000) })),
            level: levelRef.current,
          }),
        }
      );

      if (!response.ok) throw new Error("Chat failed");
      if (!response.body) throw new Error("No body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        let ni: number;
        while ((ni = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, ni);
          buf = buf.slice(ni + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const js = line.slice(6).trim();
          if (js === "[DONE]") break;
          try {
            const p = JSON.parse(js);
            const c = p.choices?.[0]?.delta?.content;
            if (c) {
              assistantContent += c;
              setChatMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantContent } : m));
                }
                return [...prev, { role: "assistant", content: assistantContent }];
              });
            }
          } catch {}
        }
      }
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

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate("/upload")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <span className="text-gradient font-bold">Explyn</span>
          <Button variant="outline" size="sm" onClick={() => setChatOpen(!chatOpen)} className="gap-2">
            <MessageCircle className="h-4 w-4" /> Ask Questions
          </Button>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-6 max-w-5xl mx-auto flex gap-6">
        {/* Report */}
        <div className={`flex-1 min-w-0 ${chatOpen ? "max-w-[60%]" : ""}`}>
          {loading && (
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Analyzing your code...</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {sections.length > 0 ? (
            <div className="space-y-4">
              {sections.map((section, i) => {
                const lines = section.split("\n");
                const title = lines[0]?.replace(/^#{1,3}\s*/, "") || `Section ${i + 1}`;
                const body = lines.slice(1).join("\n");
                const isOpen = expandedSections.has(i) || i === 0;

                return (
                  <div key={i} className="border border-border rounded-xl bg-card overflow-hidden">
                    <button
                      onClick={() => toggleSection(i)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/50 transition-colors"
                    >
                      <span className="font-semibold">{title}</span>
                      {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown
                          components={{
                            code({ className, children, ...props }) {
                              const match = /language-(\w+)/.exec(className || "");
                              const inline = !match;
                              return inline ? (
                                <code className="bg-secondary px-1.5 py-0.5 rounded text-sm" {...props}>{children}</code>
                              ) : (
                                <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div" customStyle={{ borderRadius: "0.75rem", fontSize: "0.8rem" }}>
                                  {String(children).replace(/\n$/, "")}
                                </SyntaxHighlighter>
                              );
                            },
                          }}
                        >
                          {body}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : !loading ? (
            <p className="text-muted-foreground text-center py-12">No report generated yet.</p>
          ) : null}
        </div>

        {/* Chat Panel */}
        {chatOpen && (
          <div className="w-[38%] shrink-0 border border-border rounded-xl bg-card flex flex-col max-h-[calc(100vh-8rem)] sticky top-24">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold">Ask about your code</h3>
              <p className="text-xs text-muted-foreground">AI remembers your codebase context</p>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                      msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary"
                    }`}>
                      {msg.role === "assistant" ? (
                        <ReactMarkdown
                          components={{
                            code({ className, children, ...props }) {
                              const match = /language-(\w+)/.exec(className || "");
                              return match ? (
                                <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div" customStyle={{ borderRadius: "0.5rem", fontSize: "0.75rem" }}>
                                  {String(children).replace(/\n$/, "")}
                                </SyntaxHighlighter>
                              ) : (
                                <code className="bg-muted px-1 py-0.5 rounded text-xs" {...props}>{children}</code>
                              );
                            },
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-secondary rounded-xl px-3 py-2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </ScrollArea>
            <div className="p-4 border-t border-border">
              <form onSubmit={(e) => { e.preventDefault(); sendChatMessage(); }} className="flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="bg-secondary"
                />
                <Button type="submit" size="icon" disabled={chatLoading || !chatInput.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Report;
