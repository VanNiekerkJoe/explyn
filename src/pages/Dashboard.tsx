import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Code2, Bug, GraduationCap, Library, LogOut, Plus, Search, Trash2, FolderOpen, Zap, Layers } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useCredits } from "@/hooks/useCredits";
import type { Database } from "@/integrations/supabase/types";

type Snippet = Database["public"]["Tables"]["snippets"]["Row"];
type Collection = Database["public"]["Tables"]["collections"]["Row"];

const modeIcons = { explain: Code2, debug: Bug, learn: GraduationCap };
const modeLabels = { explain: "Explained", debug: "Debugged", learn: "Lesson" };

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"projects" | "snippets" | "collections">("projects");
  const [loading, setLoading] = useState(true);
  const { credits, remaining, planLimit } = useCredits();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) { navigate("/auth"); return; }
      setUser(session.user);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/auth"); return; }
      setUser(session.user);
      loadData();
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [snippetsRes, collectionsRes, projectsRes] = await Promise.all([
      supabase.from("snippets").select("*").order("created_at", { ascending: false }),
      supabase.from("collections").select("*").order("created_at", { ascending: false }),
      supabase.from("projects").select("*").order("created_at", { ascending: false }),
    ]);
    if (snippetsRes.data) setSnippets(snippetsRes.data);
    if (collectionsRes.data) setCollections(collectionsRes.data);
    if (projectsRes.data) setProjects(projectsRes.data);
    setLoading(false);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/"); };
  const deleteSnippet = async (id: string) => {
    await supabase.from("snippets").delete().eq("id", id);
    setSnippets((prev) => prev.filter((s) => s.id !== id));
    toast({ title: "Snippet deleted" });
  };
  const createCollection = async () => {
    const name = prompt("Collection name:");
    if (!name) return;
    const { data, error } = await supabase.from("collections").insert({ name, user_id: user.id }).select().single();
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    if (data) setCollections((prev) => [data, ...prev]);
  };
  const deleteCollection = async (id: string) => {
    await supabase.from("collections").delete().eq("id", id);
    setCollections((prev) => prev.filter((c) => c.id !== id));
  };
  const deleteProject = async (id: string) => {
    await supabase.from("projects").delete().eq("id", id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    toast({ title: "Project deleted" });
  };

  const filtered = snippets.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.language.toLowerCase().includes(search.toLowerCase()) ||
    s.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <div className="noise" aria-hidden="true" />
      <div className="bg-orb orb-1" aria-hidden="true" />
      <div className="bg-orb orb-2" aria-hidden="true" />
      <div className="bg-orb orb-3" aria-hidden="true" />
      <div className="relative z-10">
        <nav className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <button onClick={() => navigate("/")} className="text-lg font-bold tracking-tight">Explyn<span className="text-muted-foreground">.</span></button>
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/upload")} className="btn-primary text-sm">
                <Plus className="h-4 w-4 mr-1" /> New analysis
              </button>
              <button onClick={handleLogout} className="btn-ghost text-sm px-3 py-2">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </nav>

        <div className="pt-28 pb-16 px-6 max-w-6xl mx-auto">
          {/* Hero header */}
          <div className="mb-10">
            <div className="animate-fade-in-up">
              <p className="eyebrow mb-3">Dashboard</p>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Your library
              </h1>
              <p className="text-muted-foreground text-sm mt-2">{user?.email}</p>
            </div>
          </div>

          {/* Credits bar */}
          {credits && (
            <div className="animate-fade-in-up-delay-1 glass-panel rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
                  <Zap className="h-4 w-4 text-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{remaining} credits remaining</p>
                  <p className="text-xs text-muted-foreground capitalize">{credits.plan} plan · {planLimit} credits/month</p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="flex-1 sm:w-40 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-foreground rounded-full transition-all" style={{ width: `${Math.min((remaining / planLimit) * 100, 100)}%` }} />
                </div>
                <button onClick={() => navigate("/pricing")} className="btn-ghost text-xs px-3 py-1.5">Upgrade</button>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="animate-fade-in-up-delay-2 flex gap-1 mb-8 p-1 glass-panel rounded-full w-fit">
            <button onClick={() => setActiveTab("projects")} className={`px-5 py-2 rounded-full text-sm transition-all duration-200 ${activeTab === "projects" ? "bg-foreground text-background font-medium" : "text-muted-foreground hover:text-foreground"}`}>
              <Layers className="h-3.5 w-3.5 inline mr-2" />Projects ({projects.length})
            </button>
            <button onClick={() => setActiveTab("snippets")} className={`px-5 py-2 rounded-full text-sm transition-all duration-200 ${activeTab === "snippets" ? "bg-foreground text-background font-medium" : "text-muted-foreground hover:text-foreground"}`}>
              <Library className="h-3.5 w-3.5 inline mr-2" />Snippets ({snippets.length})
            </button>
            <button onClick={() => setActiveTab("collections")} className={`px-5 py-2 rounded-full text-sm transition-all duration-200 ${activeTab === "collections" ? "bg-foreground text-background font-medium" : "text-muted-foreground hover:text-foreground"}`}>
              <FolderOpen className="h-3.5 w-3.5 inline mr-2" />Collections ({collections.length})
            </button>
          </div>

          {/* Projects tab */}
          {activeTab === "projects" && (
            <>
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading...</div>
              ) : projects.length === 0 ? (
                <div className="glass-panel rounded-2xl p-12 text-center">
                  <Layers className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">No projects yet</h3>
                  <p className="text-sm text-muted-foreground mb-6">Upload code and save it as a project to explore it here</p>
                  <button onClick={() => navigate("/upload")} className="btn-primary">Upload code</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.map((proj) => {
                    const fileCount = Array.isArray(proj.file_structure) ? proj.file_structure.length : 0;
                    return (
                      <div key={proj.id} className="step-card hover-lift group cursor-pointer" onClick={() => navigate(`/project/${proj.id}`)}>
                        <div className="flex items-center justify-between mb-3">
                          <Layers className="h-4 w-4 text-muted-foreground" />
                          <button onClick={(e) => { e.stopPropagation(); deleteProject(proj.id); }} className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                          </button>
                        </div>
                        <h3 className="font-semibold text-sm mb-1 truncate">{proj.name}</h3>
                        {proj.description && <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{proj.description}</p>}
                        <div className="flex items-center gap-2 mt-3">
                          <span className="px-2 py-0.5 rounded-full border border-border text-[10px] text-muted-foreground">{fileCount} files</span>
                          <span className="px-2 py-0.5 rounded-full border border-border text-[10px] text-muted-foreground">{new Date(proj.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Snippets tab */}
          {activeTab === "snippets" && (
            <>
              <div className="mb-6">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search snippets..." className="pl-10 bg-card border-border rounded-full" />
                </div>
              </div>
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading...</div>
              ) : filtered.length === 0 ? (
                <div className="glass-panel rounded-2xl p-12 text-center">
                  <Library className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">No snippets yet</h3>
                  <p className="text-sm text-muted-foreground mb-6">Analyse some code and save it to your library</p>
                  <button onClick={() => navigate("/upload")} className="btn-primary">Upload code</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map((snippet) => {
                    const ModeIcon = modeIcons[snippet.mode as keyof typeof modeIcons] || Code2;
                    return (
                      <div key={snippet.id} className="step-card hover-lift group cursor-pointer" onClick={() => navigate(`/snippet/${snippet.id}`)}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <ModeIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{modeLabels[snippet.mode as keyof typeof modeLabels] || "Explained"}</span>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); deleteSnippet(snippet.id); }} className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                          </button>
                        </div>
                        <h3 className="font-semibold text-sm mb-1 truncate">{snippet.title}</h3>
                        <div className="flex items-center gap-2 mt-3">
                          <span className="px-2 py-0.5 rounded-full border border-border text-[10px] text-muted-foreground">{snippet.language}</span>
                          <span className="px-2 py-0.5 rounded-full border border-border text-[10px] text-muted-foreground capitalize">{snippet.level}</span>
                        </div>
                        <pre className="mt-3 text-[11px] text-muted-foreground font-mono line-clamp-3 overflow-hidden">{snippet.code.slice(0, 150)}</pre>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Collections tab */}
          {activeTab === "collections" && (
            <>
              <button onClick={createCollection} className="btn-ghost mb-6 gap-2">
                <Plus className="h-4 w-4" /> New collection
              </button>
              {collections.length === 0 ? (
                <div className="glass-panel rounded-2xl p-12 text-center">
                  <FolderOpen className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">No collections yet</h3>
                  <p className="text-sm text-muted-foreground">Organise your snippets into collections</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {collections.map((col) => (
                    <div key={col.id} className="step-card hover-lift group">
                      <div className="flex items-center justify-between mb-2">
                        <FolderOpen className="h-5 w-5 text-muted-foreground" />
                        <button onClick={() => deleteCollection(col.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                        </button>
                      </div>
                      <h3 className="font-semibold">{col.name}</h3>
                      {col.description && <p className="text-xs text-muted-foreground mt-1">{col.description}</p>}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
