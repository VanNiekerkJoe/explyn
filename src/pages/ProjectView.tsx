import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MessageCircle, Send, X, Loader2, Plus, Trash2, FileCode } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import InteractiveCodeViewer from "@/components/InteractiveCodeViewer";
import ProjectFileTree from "@/components/ProjectFileTree";
import SystemMapView from "@/components/SystemMapView";
import { streamAnalysis, streamCodeChat } from "@/lib/stream";
import { useAuth } from "@/lib/auth";
import {
  appendProjectChat,
  createNote,
  deleteNote as removeNote,
  getProject,
  listNotes,
  listProjectChat,
  listProjectFiles,
  setFileExplanation,
  type Project,
  type ProjectFile,
  type ProjectNote,
} from "@/lib/localdb";

type ChatMessage = { role: "user" | "assistant"; content: string };

const ProjectView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
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
    if (!id || authLoading) return;
    if (!user) { navigate("/auth"); return; }

    const proj = getProject(id);
    if (!proj) { navigate("/dashboard"); return; }
    setProject(proj);

    const projectFiles = listProjectFiles(id);
    setFiles(projectFiles);
    if (projectFiles.length > 0) setSelectedPath(projectFiles[0].path);
    setChatMessages(listProjectChat(id).map((m) => ({ role: m.role, content: m.content })));
    setNotes(listNotes(id));
  }, [id, user, authLoading, navigate]);

  const selectedFile = files.find((f) => f.path === selectedPath);

  const explainFile = async () => {
    if (!selectedFile) return;
    setExplainLoading(true);
    try {
      let explanation = "";
      await streamAnalysis(
        [{ path: selectedFile.path, language: selectedFile.language, content: selectedFile.content.slice(0, 8000) }],
        "intermediate",
        "explain",
        (chunk) => { explanation += chunk; },
      );
      setFileExplanation(selectedFile.id, explanation);
      setFiles((prev) => prev.map((f) => (f.id === selectedFile.id ? { ...f, explanation } : f)));
      setActiveTab("explanation");
    } catch (err: any) {
      toast({ title: "Explanation failed", description: err.message, variant: "destructive" });
    } finally {
      setExplainLoading(false);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading || !id) return;

    const userMsg: ChatMessage = { role: "user", content: chatInput };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);
    appendProjectChat(id, "user", userMsg.content);

    const allMessages = [...chatMessages, userMsg];
    let assistantContent = "";
    try {
      await streamCodeChat(
        allMessages,
        files.slice(0, 20).map((f) => ({ path: f.path, content: f.content.slice(0, 4000) })),
        "intermediate",
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
      appendProjectChat(id, "assistant", assistantContent);
    } catch (err: any) {
      toast({ title: "Chat error", description: err.message, variant: "destructive" });
    } finally {
      setChatLoading(false);
    }
  };

  const addNote = () => {
    if (!newNote.trim() || !user || !id) return;
    const note = createNote(id, user.id, selectedPath || null, newNote);
    setNotes((prev) => [note, ...prev]);
    setNewNote("");
  };

  const deleteNote = (noteId: string) => {
    removeNote(noteId);
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
