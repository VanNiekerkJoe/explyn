import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Code2, Bug, GraduationCap, Library, LogOut, Plus, Search, Trash2, FolderOpen, Layers, Settings as SettingsIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import {
  countProjectFiles,
  createCollection,
  deleteCollection,
  deleteProject,
  deleteSnippet,
  listCollections,
  listProjects,
  listSnippets,
  type Collection,
  type Project,
  type Snippet,
} from "@/lib/localdb";

const modeIcons = { explain: Code2, debug: Bug, learn: GraduationCap };
const modeLabels = { explain: "Explained", debug: "Debugged", learn: "Lesson" };

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading, signOut } = useAuth();
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"projects" | "snippets" | "collections">("projects");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/auth"); return; }
    setSnippets(listSnippets(user.id));
    setCollections(listCollections(user.id));
    setProjects(listProjects(user.id));
  }, [authLoading, user, navigate]);

  const handleLogout = () => { signOut(); navigate("/"); };

  const removeSnippet = (id: string) => {
    deleteSnippet(id);
    setSnippets((prev) => prev.filter((s) => s.id !== id));
    toast({ title: "Snippet deleted" });
  };

  const addCollection = () => {
    const name = prompt("Collection name:");
    if (!name || !user) return;
    setCollections((prev) => [createCollection(user.id, name), ...prev]);
  };

  const removeCollection = (id: string) => {
    deleteCollection(id);
    setCollections((prev) => prev.filter((c) => c.id !== id));
  };

  const removeProject = (id: string) => {
    deleteProject(id);
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
      <div className="relative z-10">
        <nav className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
            <button onClick={() => navigate("/")} className="text-base sm:text-lg font-bold tracking-tight">Explyn<span className="text-muted-foreground">.</span></button>
            <div className="flex items-center gap-2 sm:gap-3">
              <button onClick={() => navigate("/upload")} className="btn-primary text-xs sm:text-sm">
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" /> <span className="hidden sm:inline">New </span>analysis
              </button>
              <button onClick={() => navigate("/settings")} className="btn-ghost text-sm px-2 sm:px-3 py-2">
                <SettingsIcon className="h-4 w-4" />
              </button>
              <button onClick={handleLogout} className="btn-ghost text-sm px-2 sm:px-3 py-2">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </nav>

        <div className="pt-20 sm:pt-28 pb-16 px-4 sm:px-6 max-w-6xl mx-auto">
          <div className="mb-8 sm:mb-10 animate-fade-in-up">
            <p className="eyebrow mb-2 sm:mb-3">Dashboard</p>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">Your library</h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1 sm:mt-2">
              {user?.username} · saved on this device
            </p>
          </div>

          <div className="animate-fade-in-up-delay-2 mb-6 sm:mb-8 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-1 p-1 glass-panel rounded-full w-fit min-w-0">
              <button onClick={() => setActiveTab("projects")} className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm transition-all duration-200 whitespace-nowrap ${activeTab === "projects" ? "bg-foreground text-background font-medium" : "text-muted-foreground hover:text-foreground"}`}>
                <Layers className="h-3 w-3 sm:h-3.5 sm:w-3.5 inline mr-1 sm:mr-2" />Projects ({projects.length})
              </button>
              <button onClick={() => setActiveTab("snippets")} className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm transition-all duration-200 whitespace-nowrap ${activeTab === "snippets" ? "bg-foreground text-background font-medium" : "text-muted-foreground hover:text-foreground"}`}>
                <Library className="h-3 w-3 sm:h-3.5 sm:w-3.5 inline mr-1 sm:mr-2" />Snippets ({snippets.length})
              </button>
              <button onClick={() => setActiveTab("collections")} className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm transition-all duration-200 whitespace-nowrap ${activeTab === "collections" ? "bg-foreground text-background font-medium" : "text-muted-foreground hover:text-foreground"}`}>
                <FolderOpen className="h-3 w-3 sm:h-3.5 sm:w-3.5 inline mr-1 sm:mr-2" /><span className="hidden sm:inline">Collections</span><span className="sm:hidden">Cols</span> ({collections.length})
              </button>
            </div>
          </div>

          {activeTab === "projects" && (
            projects.length === 0 ? (
              <div className="glass-panel rounded-2xl p-8 sm:p-12 text-center">
                <Layers className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2 text-sm sm:text-base">No projects yet</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-6">Upload code and save it as a project to explore it here</p>
                <button onClick={() => navigate("/upload")} className="btn-primary text-sm">Upload code</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {projects.map((proj) => (
                  <div key={proj.id} className="step-card hover-lift group cursor-pointer" onClick={() => navigate(`/project/${proj.id}`)}>
                    <div className="flex items-center justify-between mb-3">
                      <Layers className="h-4 w-4 text-muted-foreground" />
                      <button onClick={(e) => { e.stopPropagation(); removeProject(proj.id); }} className="opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                      </button>
                    </div>
                    <h3 className="font-semibold text-sm mb-1 truncate">{proj.name}</h3>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="px-2 py-0.5 rounded-full border border-border text-[10px] text-muted-foreground">{countProjectFiles(proj.id)} files</span>
                      <span className="px-2 py-0.5 rounded-full border border-border text-[10px] text-muted-foreground">{new Date(proj.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === "snippets" && (
            <>
              <div className="mb-4 sm:mb-6 relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search snippets..." className="pl-10 bg-card border-border rounded-full text-sm" />
              </div>
              {filtered.length === 0 ? (
                <div className="glass-panel rounded-2xl p-8 sm:p-12 text-center">
                  <Library className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2 text-sm sm:text-base">No snippets yet</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-6">Analyse some code and save it to your library</p>
                  <button onClick={() => navigate("/upload")} className="btn-primary text-sm">Upload code</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {filtered.map((snippet) => {
                    const ModeIcon = modeIcons[snippet.mode as keyof typeof modeIcons] || Code2;
                    return (
                      <div key={snippet.id} className="step-card hover-lift group cursor-pointer" onClick={() => navigate(`/snippet/${snippet.id}`)}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <ModeIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{modeLabels[snippet.mode as keyof typeof modeLabels] || "Explained"}</span>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); removeSnippet(snippet.id); }} className="opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
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

          {activeTab === "collections" && (
            <>
              <button onClick={addCollection} className="btn-ghost mb-4 sm:mb-6 gap-2 text-sm">
                <Plus className="h-4 w-4" /> New collection
              </button>
              {collections.length === 0 ? (
                <div className="glass-panel rounded-2xl p-8 sm:p-12 text-center">
                  <FolderOpen className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2 text-sm sm:text-base">No collections yet</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Organise your snippets into collections</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {collections.map((col) => (
                    <div key={col.id} className="step-card hover-lift group">
                      <div className="flex items-center justify-between mb-2">
                        <FolderOpen className="h-5 w-5 text-muted-foreground" />
                        <button onClick={() => removeCollection(col.id)} className="opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                        </button>
                      </div>
                      <h3 className="font-semibold text-sm">{col.name}</h3>
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
