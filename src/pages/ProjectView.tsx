import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MessageCircle, Send, X, Loader2, StickyNote, Plus, Trash2, Map, FileCode, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useCredits } from "@/hooks/useCredits";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import InteractiveCodeViewer from "@/components/InteractiveCodeViewer";
import ProjectFileTree from "@/components/ProjectFileTree";
import SystemMapView from "@/components/SystemMapView";

type ChatMessage = { role: "user" | "assistant"; content: string };

interface ProjectFile {
  id: string;
  path: string;
  content: string;
  language: string;
  explanation: string | null;
}

interface ProjectNote {
  id: string;
  file_path: string | null;
  line_number: number | null;
  content: string;
  created_at: string;
}

const ProjectView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasCredits, useCredit } = useCredits();

  const [project, setProject] = useState<any>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [selectedPath, setSelectedPath] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"code" | "explanation" | "map" | "notes">("code");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [notes, setNotes] = useState<ProjectNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [explainLoading, setExplainLoading] = useState(false);
  const [showFileTree, setShowFileTree] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    loadProject();
  }, [id]);

  const loadProject = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/auth"); return; }

    const [projRes, filesRes, chatRes, notesRes] = await Promise.all([
      supabase.from("projects").select("*").eq("id", id).single(),
      supabase.from("project_files").select("*").eq("project_id", id),
      supabase.from("project_chat_history").select("*").eq("project_id", id).order("created_at"),
      supabase.from("project_notes").select("*").eq("project_id", id).order("created_at", { ascending: false }),
    ]);

    if (!projRes.data) { navigate("/dashboard"); return; }
    setProject(projRes.data);
    if (filesRes.data) {
      setFiles(filesRes.data);
      if (filesRes.data.length > 0) setSelectedPath(filesRes.data[0].path);
    }
    if (chatRes.data) setChatMessages(chatRes.data.map((m: any) => ({ role: m.role, content: m.content })));
    if (notesRes.data) setNotes(notesRes.data);
  };

  const selectedFile = files.find((f) => f.path === selectedPath);

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

  const explainFile = async () => {
    if (!selectedFile || !hasCredits) return;
    setExplainLoading(true);
    const success = await useCredit(1, "File explanation");
    if (!success) { setExplainLoading(false); return; }

    try {
      let explanation = "";
      await streamSSE(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-code`,
        { files: [{ path: selectedFile.path, language: selectedFile.language, content: selectedFile.content.slice(0, 8000) }], level: "intermediate", mode: "explain" },
        (chunk) => { explanation += chunk; },
      );
      // Cache in DB
      await supabase.from("project_files").update({ explanation }).eq("id", selectedFile.id);
      setFiles((prev) => prev.map((f) => f.id === selectedFile.id ? { ...f, explanation } : f));
      setActiveTab("explanation");
    } catch (err: any) {
      toast({ title: "Explanation failed", description: err.message, variant: "destructive" });
    } finally {
      setExplainLoading(false);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const userMsg: ChatMessage = { role: "user", content: chatInput };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    // Save user message
    await supabase.from("project_chat_history").insert({
      project_id: id!, user_id: session.user.id, role: "user", content: userMsg.content,
    });

    const allMessages = [...chatMessages, userMsg];
    let assistantContent = "";
    try {
      await streamSSE(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-code`,
        {
          messages: allMessages,
          codeContext: files.slice(0, 20).map((f) => ({ path: f.path, content: f.content.slice(0, 4000) })),
          level: "intermediate",
          projectId: id,
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
      // Save assistant message
      await supabase.from("project_chat_history").insert({
        project_id: id!, user_id: session.user.id, role: "assistant", content: assistantContent,
      });
    } catch (err: any) {
      toast({ title: "Chat error", description: err.message, variant: "destructive" });
    } finally {
      setChatLoading(false);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data, error } = await supabase.from("project_notes").insert({
      project_id: id!, user_id: session.user.id, file_path: selectedPath || null, content: newNote,
    }).select().single();
    if (data) { setNotes((prev) => [data, ...prev]); setNewNote(""); }
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
  };

  const deleteNote = async (noteId: string) => {
    await supabase.from("project_notes").delete().eq("id", noteId);
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

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

  const suggestedPrompts = [
    "Where is authentication handled?",
    "What's the architecture of this project?",
    "Who calls this method?",
    "Why is this function structured this way?",
  ];

  if (!project) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading…</div>;

  const [showFileTree, setShowFileTree] = useState(false);

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <div className="noise" aria-hidden="true" />
      <div className="relative z-10">
        <nav className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl">
          <div className="max-w-[90rem] mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-2">
            <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground hover:text-foreground transition-colors shrink-0">
              <ArrowLeft className="h-4 w-4" />
              <span className="font-bold text-foreground tracking-tight text-sm">Explyn<span className="text-muted-foreground">.</span></span>
            </button>
            <span className="text-xs sm:text-sm font-medium truncate max-w-[120px] sm:max-w-[200px]">{project.name}</span>
            <div className="flex items-center gap-1 shrink-0">
              {/* Mobile file tree toggle */}
              <button onClick={() => setShowFileTree(!showFileTree)} className="btn-ghost text-xs gap-1 px-2 py-1.5 lg:hidden">
                <FileCode className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setChatOpen(!chatOpen)} className="btn-ghost text-xs sm:text-sm gap-1 sm:gap-2 px-2 sm:px-3">
                <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Ask</span>
              </button>
            </div>
          </div>
        </nav>

        <div className="pt-14 flex flex-col lg:flex-row h-[calc(100vh-56px)]">
          {/* File tree sidebar - overlay on mobile, fixed on desktop */}
          {showFileTree && (
            <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden" onClick={() => setShowFileTree(false)} />
          )}
          <div className={`${showFileTree ? "fixed inset-y-0 left-0 z-50 w-64 pt-14" : "hidden"} lg:relative lg:block lg:w-60 shrink-0 border-r border-border/40 bg-card/50 overflow-y-auto`}>
            <div className="p-3 border-b border-border/40 flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Files ({files.length})</p>
              <button onClick={() => setShowFileTree(false)} className="lg:hidden text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <ProjectFileTree
              files={files.map((f) => ({ path: f.path, language: f.language }))}
              onSelectFile={(path) => { setSelectedPath(path); setShowFileTree(false); }}
              selectedPath={selectedPath}
            />
          </div>

          {/* Main content */}
          <div className={`flex-1 min-w-0 flex flex-col transition-all ${chatOpen ? "lg:mr-[380px]" : ""}`}>
            {/* Tabs */}
            <div className="border-b border-border/40 px-2 sm:px-4 py-2 flex items-center gap-0.5 sm:gap-1 bg-background/80 overflow-x-auto">
              {(["code", "explanation", "map", "notes"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-2.5 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-xs transition-colors capitalize whitespace-nowrap ${
                    activeTab === tab ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab === "map" ? "Map" : tab}
                </button>
              ))}
              {activeTab === "code" && selectedFile && !selectedFile.explanation && (
                <button onClick={explainFile} disabled={explainLoading} className="ml-auto btn-ghost text-[10px] sm:text-xs gap-1 sm:gap-1.5 shrink-0">
                  {explainLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileCode className="h-3 w-3" />}
                  <span className="hidden sm:inline">Explain this file</span><span className="sm:hidden">Explain</span>
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              {activeTab === "code" && selectedFile && (
                <InteractiveCodeViewer
                  code={selectedFile.content}
                  language={selectedFile.language}
                  fileName={selectedFile.path}
                  level="intermediate"
                  onAskFollowUp={(q) => { setChatOpen(true); setChatInput(q); }}
                />
              )}

              {activeTab === "explanation" && selectedFile && (
                selectedFile.explanation ? (
                  <div className="glass-panel rounded-2xl p-6 prose prose-sm prose-invert max-w-none">
                    <ReactMarkdown components={mdComponents}>{selectedFile.explanation}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="glass-panel rounded-2xl p-12 text-center">
                    <FileCode className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-4">No explanation cached yet</p>
                    <button onClick={explainFile} disabled={explainLoading} className="btn-primary text-sm">
                      {explainLoading ? "Generating…" : "Generate explanation"}
                    </button>
                  </div>
                )
              )}

              {activeTab === "map" && (
                <SystemMapView
                  files={files.map((f) => ({ path: f.path, content: f.content, language: f.language }))}
                  onNodeClick={(path) => { setSelectedPath(path); setActiveTab("code"); }}
                />
              )}

              {activeTab === "notes" && (
                <div className="max-w-2xl">
                  <div className="flex gap-2 mb-4">
                    <Input
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add a note…"
                      className="bg-card border-border rounded-lg text-sm"
                      onKeyDown={(e) => { if (e.key === "Enter") addNote(); }}
                    />
                    <button onClick={addNote} className="btn-primary text-sm px-4">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {notes.map((note) => (
                      <div key={note.id} className="glass-panel rounded-xl p-4 group">
                        <div className="flex justify-between items-start">
                          <div>
                            {note.file_path && (
                              <span className="text-[10px] text-muted-foreground font-mono">{note.file_path}</span>
                            )}
                            <p className="text-sm mt-1">{note.content}</p>
                          </div>
                          <button onClick={() => deleteNote(note.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                          </button>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-2">{new Date(note.created_at).toLocaleString()}</p>
                      </div>
                    ))}
                    {notes.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-8">No notes yet. Add one above.</p>
                    )}
                  </div>
                </div>
              )}

              {!selectedFile && activeTab !== "map" && activeTab !== "notes" && (
                <div className="text-center py-12 text-muted-foreground text-sm">Select a file from the tree</div>
              )}
            </div>
          </div>

          {/* Chat panel */}
          {chatOpen && (
            <div className="fixed inset-0 z-40 lg:inset-auto lg:right-0 lg:top-14 lg:bottom-0 lg:w-[380px] border-l border-border/40 bg-background flex flex-col pt-14 lg:pt-0">
              <div className="p-4 border-b border-border/40 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm">Ask your codebase</h3>
                  <p className="text-[10px] text-muted-foreground">Context-aware · History saved</p>
                </div>
                <button onClick={() => setChatOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {chatMessages.length === 0 && (
                    <div className="text-center py-6">
                      <p className="text-xs text-muted-foreground mb-3">Ask anything about your project</p>
                      <div className="space-y-1.5">
                        {suggestedPrompts.map((q) => (
                          <button key={q} onClick={() => setChatInput(q)} className="block w-full text-left text-xs text-muted-foreground px-3 py-2 rounded-lg border border-border hover:border-foreground/20 transition-colors">
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
              <div className="p-4 border-t border-border/40">
                <form onSubmit={(e) => { e.preventDefault(); sendChatMessage(); }} className="flex gap-2">
                  <Input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask a question…" className="bg-card border-border rounded-full text-sm" />
                  <button type="submit" disabled={chatLoading || !chatInput.trim()} className="btn-primary p-2.5 rounded-full disabled:opacity-40">
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

export default ProjectView;
