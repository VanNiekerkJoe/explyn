import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Upload as UploadIcon, FileCode, FolderOpen, ClipboardPaste, Trash2, ArrowLeft, ArrowRight } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

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

const detectLanguage = (filename: string): string => {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return LANGUAGE_MAP[ext] || "Unknown";
};

const PASTE_LANGUAGES = [
  "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Rust",
  "Swift", "Kotlin", "Ruby", "PHP", "HTML", "CSS", "SQL", "Shell", "Other",
];

const Upload = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [pasteCode, setPasteCode] = useState("");
  const [pasteLang, setPasteLang] = useState("JavaScript");
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      toast({ title: "Too many files", description: `Limited to ${MAX_FILES}. First ${MAX_FILES} added.`, variant: "destructive" });
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

  const handlePasteAdd = () => {
    if (!pasteCode.trim()) return;
    setFiles((prev) => [...prev, { path: `/pasted-code-${prev.length + 1}.txt`, content: pasteCode, language: pasteLang }]);
    setPasteCode("");
    toast({ title: "Code snippet added" });
  };

  const removeFile = (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index));

  const handleAnalyze = () => {
    if (files.length === 0) {
      toast({ title: "No files to analyse", description: "Upload files or paste code first.", variant: "destructive" });
      return;
    }
    sessionStorage.setItem("explyn_files", JSON.stringify(files));
    sessionStorage.setItem("explyn_level", level);
    navigate("/report");
  };

  const langCounts = files.reduce<Record<string, number>>((acc, f) => {
    acc[f.language] = (acc[f.language] || 0) + 1;
    return acc;
  }, {});

  const levelDescriptions = {
    beginner: "Simple analogies, no jargon, plain English",
    intermediate: "Technical but accessible, patterns & best practices",
    advanced: "Deep internals, performance, edge cases",
  };

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <div className="noise" aria-hidden="true" />
      <div className="bg-orb orb-2" aria-hidden="true" />

      <div className="relative z-10">
        {/* Nav */}
        <nav className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl">
          <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
            <button onClick={() => navigate("/")} className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="font-bold text-foreground tracking-tight">explyn</span>
            </button>
          </div>
        </nav>

        <div className="pt-28 pb-16 px-6 max-w-4xl mx-auto">
          <p className="eyebrow mb-4">Upload</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">Add your code</h1>
          <p className="text-muted-foreground mb-10">Drop a folder or paste snippets. Everything is read locally.</p>

          {/* Tabs */}
          <Tabs defaultValue="upload" className="mb-10">
            <TabsList className="bg-card border border-border rounded-full p-1">
              <TabsTrigger value="upload" className="rounded-full gap-2 data-[state=active]:bg-foreground data-[state=active]:text-background">
                <FolderOpen className="h-3.5 w-3.5" /> Upload folder
              </TabsTrigger>
              <TabsTrigger value="paste" className="rounded-full gap-2 data-[state=active]:bg-foreground data-[state=active]:text-background">
                <ClipboardPaste className="h-3.5 w-3.5" /> Paste code
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`mt-6 glass-panel rounded-2xl p-16 text-center cursor-pointer transition-all ${
                  isDragging ? "border-foreground/30 bg-foreground/5" : "hover:border-foreground/20"
                }`}
              >
                <UploadIcon className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-1">Drop your project folder here</p>
                <p className="text-sm text-muted-foreground">or click to browse · max {MAX_FILES} files, {MAX_FILE_SIZE / 1024}KB each</p>
                <input ref={fileInputRef} type="file" className="hidden" {...({ webkitdirectory: "", directory: "" } as any)} multiple onChange={handleFileInput} />
              </div>
            </TabsContent>

            <TabsContent value="paste">
              <div className="mt-6 space-y-4">
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wider">Language</label>
                    <Select value={pasteLang} onValueChange={setPasteLang}>
                      <SelectTrigger className="bg-card border-border rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PASTE_LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                      </SelectContent>
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
            <div className="mb-10">
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
          <div className="mb-10">
            <p className="eyebrow mb-4">Explanation level</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(["beginner", "intermediate", "advanced"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={`step-card text-left transition-all ${
                    level === l ? "border-foreground/40 bg-foreground/5" : "hover:border-foreground/20"
                  }`}
                >
                  <p className="text-sm font-semibold capitalize mb-1">{l}</p>
                  <p className="text-xs text-muted-foreground">{levelDescriptions[l]}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Analyse button */}
          <button
            onClick={handleAnalyze}
            disabled={files.length === 0}
            className="btn-primary w-full py-4 text-base disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Analyse {files.length} file{files.length !== 1 ? "s" : ""} <ArrowRight className="ml-2 h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Upload;
