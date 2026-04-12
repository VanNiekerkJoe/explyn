import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Upload as UploadIcon, FileCode, FolderOpen, ClipboardPaste, Trash2, ArrowLeft, ArrowRight, Code2, Bug, GraduationCap, Github, Archive, Loader2, Link, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import JSZip from "jszip";

export interface UploadedFile {
  path: string;
  content: string;
  language: string;
}

const MAX_FILES = 200;
const MAX_FILE_SIZE = 500 * 1024;

const LANGUAGE_MAP: Record<string, string> = {
  js: "JavaScript", jsx: "JavaScript", ts: "TypeScript", tsx: "TypeScript",
  py: "Python", java: "Java", cpp: "C++", c: "C", cs: "C#", go: "Go",
  rs: "Rust", swift: "Swift", kt: "Kotlin", rb: "Ruby", php: "PHP",
  dart: "Dart", scala: "Scala", r: "R", lua: "Lua", hs: "Haskell",
  ex: "Elixir", clj: "Clojure", fs: "F#", m: "Objective-C", asm: "Assembly",
  html: "HTML", css: "CSS", scss: "SCSS", json: "JSON", xml: "XML",
  yaml: "YAML", yml: "YAML", md: "Markdown", sql: "SQL", sh: "Shell",
  bat: "Batch", ps1: "PowerShell", vue: "Vue", svelte: "Svelte",
};

const IGNORE_DIRS = new Set([
  "node_modules", ".git", ".svn", "dist", "build", "out", ".next",
  "__pycache__", ".venv", "venv", "env", ".idea", ".vscode",
  "bin", "obj", "target", ".gradle", "vendor", ".cache",
  "coverage", ".nyc_output", ".turbo", "__MACOSX",
]);

const detectLanguage = (filename: string): string => {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return LANGUAGE_MAP[ext] || "Unknown";
};

const shouldIgnorePath = (path: string): boolean => {
  const parts = path.split("/");
  return parts.some((p) => IGNORE_DIRS.has(p) || p.startsWith("."));
};

const isCodeFile = (filename: string): boolean => {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const name = filename.split("/").pop()?.toLowerCase() || "";
  if (["dockerfile", "makefile", "gemfile", "rakefile"].includes(name)) return true;
  return Object.keys(LANGUAGE_MAP).includes(ext);
};

const PASTE_LANGUAGES = [
  "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Rust",
  "Swift", "Kotlin", "Ruby", "PHP", "HTML", "CSS", "SQL", "Shell", "Other",
];

const modes = [
  { id: "explain" as const, icon: Code2, title: "Explain", desc: "Deep-dive explanation of every line, class, and import" },
  { id: "debug" as const, icon: Bug, title: "Debug", desc: "Find bugs, explain why they occur, suggest fixes" },
  { id: "learn" as const, icon: GraduationCap, title: "Learn", desc: "Mini-lesson with concepts, analogies, and quizzes" },
];

const Upload = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [pasteCode, setPasteCode] = useState("");
  const [pasteLang, setPasteLang] = useState("JavaScript");
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [mode, setMode] = useState<"explain" | "debug" | "learn">("explain");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  // GitHub import state
  const [githubUrl, setGithubUrl] = useState("");
  const [githubLoading, setGithubLoading] = useState(false);

  // ZIP upload state
  const [zipLoading, setZipLoading] = useState(false);

  const processFileEntry = async (entry: FileSystemEntry): Promise<UploadedFile[]> => {
    if (entry.isFile) {
      return new Promise((resolve) => {
        (entry as FileSystemFileEntry).file((file) => {
          if (file.size > MAX_FILE_SIZE || file.name.startsWith(".")) { resolve([]); return; }
          const lang = detectLanguage(file.name);
          if (lang === "Unknown" && !file.name.includes(".")) { resolve([]); return; }
          const reader = new FileReader();
          reader.onload = () => resolve([{ path: entry.fullPath, content: reader.result as string, language: lang }]);
          reader.onerror = () => resolve([]);
          reader.readAsText(file);
        });
      });
    } else if (entry.isDirectory) {
      const dirReader = (entry as FileSystemDirectoryEntry).createReader();
      return new Promise((resolve) => {
        dirReader.readEntries(async (entries) => {
          const results = await Promise.all(entries.map(processFileEntry));
          resolve(results.flat());
        });
      });
    }
    return [];
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const items = e.dataTransfer.items;
    const allFiles: UploadedFile[] = [];
    for (let i = 0; i < items.length; i++) {
      const entry = items[i].webkitGetAsEntry();
      if (entry) {
        const result = await processFileEntry(entry);
        allFiles.push(...result);
      }
    }
    if (allFiles.length > MAX_FILES) {
      toast({ title: "Too many files", description: `Limited to ${MAX_FILES}.`, variant: "destructive" });
      setFiles(allFiles.slice(0, MAX_FILES));
    } else {
      setFiles(allFiles);
      toast({ title: `${allFiles.length} files loaded` });
    }
  }, [toast]);

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputFiles = e.target.files;
    if (!inputFiles) return;
    const allFiles: UploadedFile[] = [];
    for (let i = 0; i < inputFiles.length; i++) {
      const file = inputFiles[i];
      if (file.size > MAX_FILE_SIZE || file.name.startsWith(".")) continue;
      const lang = detectLanguage(file.name);
      const content = await file.text();
      allFiles.push({ path: (file as any).webkitRelativePath || file.name, content, language: lang });
    }
    setFiles(allFiles.length > MAX_FILES ? allFiles.slice(0, MAX_FILES) : allFiles);
    toast({ title: `${Math.min(allFiles.length, MAX_FILES)} files loaded` });
  }, [toast]);

  // ZIP upload handler
  const handleZipUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".zip")) {
      toast({ title: "Invalid file", description: "Please upload a .zip file", variant: "destructive" });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max ZIP size is 50MB", variant: "destructive" });
      return;
    }

    setZipLoading(true);
    try {
      const zip = await JSZip.loadAsync(file);
      const allFiles: UploadedFile[] = [];

      const entries = Object.entries(zip.files);
      for (const [path, zipEntry] of entries) {
        if (zipEntry.dir) continue;
        if (shouldIgnorePath(path)) continue;
        if (!isCodeFile(path)) continue;
        if (allFiles.length >= MAX_FILES) break;

        try {
          const content = await zipEntry.async("string");
          if (content.length > MAX_FILE_SIZE) continue;
          // Skip binary content
          if (content.includes("\0")) continue;

          const language = detectLanguage(path);
          allFiles.push({ path: `/${path}`, content, language });
        } catch {
          // Skip files that can't be read as text
        }
      }

      if (allFiles.length === 0) {
        toast({ title: "No code files found", description: "The ZIP didn't contain recognizable code files.", variant: "destructive" });
      } else {
        setFiles(allFiles);
        toast({ title: `${allFiles.length} files extracted from ZIP` });
      }
    } catch (err) {
      toast({ title: "Failed to read ZIP", description: "The file may be corrupted or unsupported.", variant: "destructive" });
    } finally {
      setZipLoading(false);
      if (zipInputRef.current) zipInputRef.current.value = "";
    }
  }, [toast]);

  // GitHub import handler
  const handleGithubImport = useCallback(async () => {
    if (!githubUrl.trim()) return;

    setGithubLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/github-import`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ repoUrl: githubUrl.trim() }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast({ title: "Import failed", description: data.error || "Could not fetch repository", variant: "destructive" });
        return;
      }

      if (data.files && data.files.length > 0) {
        setFiles(data.files);
        toast({ title: `${data.fileCount} files imported from ${data.owner}/${data.repo}` });
      } else {
        toast({ title: "No code files found", description: "The repository didn't contain recognizable code files.", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
    } finally {
      setGithubLoading(false);
    }
  }, [githubUrl, toast]);

  const handlePasteAdd = () => {
    if (!pasteCode.trim()) return;
    setFiles((prev) => [...prev, { path: `/pasted-code-${prev.length + 1}.txt`, content: pasteCode, language: pasteLang }]);
    setPasteCode("");
    toast({ title: "Code snippet added" });
  };

  const removeFile = (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index));

  const [savingProject, setSavingProject] = useState(false);

  const handleAnalyze = () => {
    if (files.length === 0) {
      toast({ title: "No files to analyse", variant: "destructive" });
      return;
    }
    sessionStorage.setItem("explyn_files", JSON.stringify(files));
    sessionStorage.setItem("explyn_level", level);
    sessionStorage.setItem("explyn_mode", mode);
    navigate("/report");
  };

  const handleSaveAsProject = async () => {
    if (files.length === 0) {
      toast({ title: "No files to save", variant: "destructive" });
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/auth"); return; }

    setSavingProject(true);
    const name = prompt("Project name:") || files[0]?.path?.split("/")[1] || "Untitled Project";
    const fileStructure = files.map((f) => ({ path: f.path, language: f.language }));

    const { data: project, error: projErr } = await supabase
      .from("projects")
      .insert({ user_id: session.user.id, name, file_structure: fileStructure })
      .select()
      .single();

    if (projErr || !project) {
      toast({ title: "Error creating project", description: projErr?.message, variant: "destructive" });
      setSavingProject(false);
      return;
    }

    // Insert files in batches
    const batch = files.map((f) => ({
      project_id: project.id,
      path: f.path,
      content: f.content,
      language: f.language,
    }));
    const BATCH_SIZE = 50;
    for (let i = 0; i < batch.length; i += BATCH_SIZE) {
      await supabase.from("project_files").insert(batch.slice(i, i + BATCH_SIZE));
    }

    setSavingProject(false);
    toast({ title: "Project saved!" });
    navigate(`/project/${project.id}`);
  };

  const langCounts = files.reduce<Record<string, number>>((acc, f) => {
    acc[f.language] = (acc[f.language] || 0) + 1;
    return acc;
  }, {});

  const levelDescriptions = {
    beginner: "Simple analogies, plain English",
    intermediate: "Patterns & best practices",
    advanced: "Deep internals, edge cases",
  };

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <div className="noise" aria-hidden="true" />
      <div className="bg-orb orb-2" aria-hidden="true" />

      <div className="relative z-10">
        <nav className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
            <button onClick={() => navigate("/")} className="flex items-center gap-2 sm:gap-3 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="font-bold text-foreground tracking-tight text-sm sm:text-base">Explyn<span className="text-muted-foreground">.</span></span>
            </button>
          </div>
        </nav>

        <div className="pt-20 sm:pt-28 pb-16 px-4 sm:px-6 max-w-4xl mx-auto">
          <p className="eyebrow mb-3 sm:mb-4">Upload</p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-2">Add your code</h1>
          <p className="text-muted-foreground mb-8">Drop a folder, upload a ZIP, import from GitHub, or paste snippets.</p>

          {/* Mode selector */}
          <div className="mb-8">
            <p className="eyebrow mb-3">Analysis mode</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {modes.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`step-card text-left transition-all ${
                    mode === m.id ? "border-foreground/40 bg-foreground/5" : "hover:border-foreground/20"
                  }`}
                >
                  <m.icon className={`h-5 w-5 mb-2 ${mode === m.id ? "text-foreground" : "text-muted-foreground"}`} />
                  <p className="text-sm font-semibold mb-0.5">{m.title}</p>
                  <p className="text-xs text-muted-foreground">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Upload tabs */}
          <Tabs defaultValue="upload" className="mb-8">
            <TabsList className="bg-card border border-border rounded-full p-1 flex-wrap h-auto gap-0.5">
              <TabsTrigger value="upload" className="rounded-full gap-2 data-[state=active]:bg-foreground data-[state=active]:text-background text-xs sm:text-sm">
                <FolderOpen className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Upload</span> Folder
              </TabsTrigger>
              <TabsTrigger value="zip" className="rounded-full gap-2 data-[state=active]:bg-foreground data-[state=active]:text-background text-xs sm:text-sm">
                <Archive className="h-3.5 w-3.5" /> ZIP
              </TabsTrigger>
              <TabsTrigger value="github" className="rounded-full gap-2 data-[state=active]:bg-foreground data-[state=active]:text-background text-xs sm:text-sm">
                <Github className="h-3.5 w-3.5" /> GitHub
              </TabsTrigger>
              <TabsTrigger value="paste" className="rounded-full gap-2 data-[state=active]:bg-foreground data-[state=active]:text-background text-xs sm:text-sm">
                <ClipboardPaste className="h-3.5 w-3.5" /> Paste
              </TabsTrigger>
            </TabsList>

            {/* Folder upload */}
            <TabsContent value="upload">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`mt-6 glass-panel rounded-2xl p-16 text-center cursor-pointer transition-all ${isDragging ? "border-foreground/30 bg-foreground/5" : "hover:border-foreground/20"}`}
              >
                <UploadIcon className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-1">Drop your project folder here</p>
                <p className="text-sm text-muted-foreground">or click to browse · max {MAX_FILES} files</p>
                <input ref={fileInputRef} type="file" className="hidden" {...({ webkitdirectory: "", directory: "" } as any)} multiple onChange={handleFileInput} />
              </div>
            </TabsContent>

            {/* ZIP upload */}
            <TabsContent value="zip">
              <div className="mt-6 glass-panel rounded-2xl p-12 text-center">
                {zipLoading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Extracting files…</p>
                  </div>
                ) : (
                  <>
                    <Archive className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium mb-1">Upload a ZIP file</p>
                    <p className="text-sm text-muted-foreground mb-6">
                      Max 50MB · Auto-filters node_modules, .git, build folders
                    </p>
                    <button
                      onClick={() => zipInputRef.current?.click()}
                      className="btn-primary"
                    >
                      Choose ZIP file
                    </button>
                    <input
                      ref={zipInputRef}
                      type="file"
                      accept=".zip"
                      className="hidden"
                      onChange={handleZipUpload}
                    />
                  </>
                )}
              </div>
            </TabsContent>

            {/* GitHub import */}
            <TabsContent value="github">
              <div className="mt-6 glass-panel rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-4">
                  <Github className="h-6 w-6 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Import from GitHub</p>
                    <p className="text-xs text-muted-foreground">Public repositories only · Paste the repo URL</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/user/repo"
                      className="bg-card border-border rounded-lg pl-10"
                      onKeyDown={(e) => { if (e.key === "Enter") handleGithubImport(); }}
                    />
                  </div>
                  <button
                    onClick={handleGithubImport}
                    disabled={githubLoading || !githubUrl.trim()}
                    className="btn-primary disabled:opacity-40 flex items-center gap-2"
                  >
                    {githubLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {githubLoading ? "Importing…" : "Import"}
                  </button>
                </div>
                <div className="mt-4 space-y-1.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Try these</p>
                  {[
                    "https://github.com/expressjs/express",
                    "https://github.com/sindresorhus/is",
                  ].map((url) => (
                    <button
                      key={url}
                      onClick={() => setGithubUrl(url)}
                      className="block text-xs text-muted-foreground hover:text-foreground transition-colors truncate"
                    >
                      {url}
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Paste code */}
            <TabsContent value="paste">
              <div className="mt-6 space-y-4">
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wider">Language</label>
                    <Select value={pasteLang} onValueChange={setPasteLang}>
                      <SelectTrigger className="bg-card border-border rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent>{PASTE_LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <button onClick={handlePasteAdd} disabled={!pasteCode.trim()} className="btn-primary disabled:opacity-40">Add snippet</button>
                </div>
                <Textarea
                  value={pasteCode}
                  onChange={(e) => setPasteCode(e.target.value)}
                  placeholder="Paste your code here..."
                  className="min-h-[220px] font-mono text-sm bg-card border-border rounded-xl"
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* File list */}
          {files.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">{files.length} files loaded</h2>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(langCounts).map(([lang, count]) => (
                    <span key={lang} className="px-3 py-1 rounded-full border border-border text-xs text-muted-foreground">{lang}: {count}</span>
                  ))}
                </div>
              </div>
              <div className="glass-panel rounded-xl max-h-64 overflow-y-auto divide-y divide-border/50">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5 hover:bg-foreground/[0.03] group transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileCode className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate">{file.path}</span>
                      <span className="px-2 py-0.5 rounded-full border border-border text-[10px] text-muted-foreground shrink-0">{file.language}</span>
                    </div>
                    <button onClick={() => removeFile(i)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Level selector */}
          <div className="mb-8">
            <p className="eyebrow mb-3">Explanation level</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(["beginner", "intermediate", "advanced"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={`step-card text-left transition-all ${level === l ? "border-foreground/40 bg-foreground/5" : "hover:border-foreground/20"}`}
                >
                  <p className="text-sm font-semibold capitalize mb-0.5">{l}</p>
                  <p className="text-xs text-muted-foreground">{levelDescriptions[l]}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={handleAnalyze} disabled={files.length === 0} className="btn-primary flex-1 py-3 sm:py-4 text-sm sm:text-base disabled:opacity-30 disabled:cursor-not-allowed">
              {mode === "debug" ? "Debug" : mode === "learn" ? "Create lesson from" : "Analyse"} {files.length} file{files.length !== 1 ? "s" : ""} <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <button onClick={handleSaveAsProject} disabled={files.length === 0 || savingProject} className="btn-ghost py-3 sm:py-4 px-4 sm:px-6 text-sm sm:text-base disabled:opacity-30 gap-2">
              {savingProject ? <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" /> : <Save className="h-4 w-4 sm:h-5 sm:w-5" />}
              Save as Project
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
