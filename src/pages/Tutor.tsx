import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Loader2, MessageCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { streamSSE } from "@/lib/stream";
import { toast } from "@/hooks/use-toast";

type Level = "beginner" | "intermediate" | "advanced";
type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Explain recursion with an example",
  "What's the difference between let and var?",
  "How do Python decorators work?",
  "When should I use a hash map?",
];

const Tutor = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("Python");
  const [level, setLevel] = useState<Level>("beginner");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const send = async (text: string) => {
    const value = text.trim();
    if (!value || loading) return;
    const userMsg: Msg = { role: "user", content: value };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);
    let acc = "";
    try {
      await streamSSE(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/learn-ai`,
        { mode: "tutor", messages: next, language, level },
        (chunk) => {
          acc += chunk;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant") {
              return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: acc } : m));
            }
            return [...prev, { role: "assistant", content: acc }];
          });
        },
      );
    } catch (e) {
      toast({ title: "Tutor error", description: e instanceof Error ? e.message : "Try again", variant: "destructive" });
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const mdComponents = {
    code({ className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || "");
      return match ? (
        <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div" customStyle={{ borderRadius: "0.75rem", fontSize: "0.8rem", background: "hsl(0 0% 8%)" }}>
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      ) : (
        <code className="bg-muted px-1.5 py-0.5 rounded text-xs" {...props}>{children}</code>
      );
    },
  };

  return (
    <div className="relative min-h-screen bg-background overflow-hidden flex flex-col">
      <div className="noise" aria-hidden="true" />
      <div className="bg-orb orb-3" aria-hidden="true" />

      <div className="relative z-10 flex flex-col flex-1">
        <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
            <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> <span className="text-sm">Hub</span>
            </button>
            <span className="text-sm font-bold tracking-tight">Tutor</span>
            <div className="flex items-center gap-1.5">
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="bg-background/60 border border-border rounded-md px-2 py-1 text-[11px]">
                {["Python", "JavaScript", "TypeScript", "Java", "C++", "SQL", "General"].map((l) => <option key={l}>{l}</option>)}
              </select>
              <select value={level} onChange={(e) => setLevel(e.target.value as Level)} className="bg-background/60 border border-border rounded-md px-2 py-1 text-[11px]">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
        </nav>

        <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-10">
              <div className="w-12 h-12 rounded-2xl border border-border bg-background/60 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-5 w-5" strokeWidth={1.6} />
              </div>
              <h2 className="text-xl font-semibold mb-2">Ask anything about code</h2>
              <p className="text-sm text-muted-foreground mb-6">A patient AI tutor that explains at your level.</p>
              <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)} className="px-3 py-1.5 rounded-full border border-border text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[88%] rounded-2xl px-4 py-3 ${m.role === "user" ? "bg-foreground text-background" : "glass-panel"}`}>
                {m.role === "user" ? (
                  <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                ) : (
                  <div className="prose prose-invert prose-sm max-w-none prose-p:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground prose-headings:text-foreground">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                      {m.content || "…"}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start">
              <div className="glass-panel rounded-2xl px-4 py-3 inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
              </div>
            </div>
          )}
          <div ref={endRef} />
        </main>

        <div className="sticky bottom-0 border-t border-border/40 bg-background/80 backdrop-blur-xl">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={1}
              placeholder="Ask the tutor…"
              className="flex-1 bg-background/60 border border-border rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-foreground/40 max-h-40"
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              className="h-10 w-10 rounded-xl bg-foreground text-background flex items-center justify-center disabled:opacity-40"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tutor;
