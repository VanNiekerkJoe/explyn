import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Upload as UploadIcon, FileCode, FolderOpen, ClipboardPaste, Trash2, ChevronRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export interface UploadedFile {
  path: string;
  content: string;
  language: string;
}

const MAX_FILES = 200;
const MAX_FILE_SIZE = 500 * 1024; // 500KB per file

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
          if (file.size > MAX_FILE_SIZE || file.name.startsWith(".")) {
            resolve([]);
            return;
          }
          const lang = detectLanguage(file.name);
          if (lang === "Unknown" && !file.name.includes(".")) {
            resolve([]);
            return;
          }
          const reader = new FileReader();
          reader.onload = () => {
            resolve([{ path: entry.fullPath, content: reader.result as string, language: lang }]);
          };
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
      toast({ title: "Too many files", description: `Limited to ${MAX_FILES} files. Only first ${MAX_FILES} were added.`, variant: "destructive" });
      setFiles(allFiles.slice(0, MAX_FILES));
    } else {
      setFiles(allFiles);
      toast({ title: `${allFiles.length} files loaded`, description: "Ready for analysis" });
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
      allFiles.push({
        path: (file as any).webkitRelativePath || file.name,
        content,
        language: lang,
      });
    }

    if (allFiles.length > MAX_FILES) {
      setFiles(allFiles.slice(0, MAX_FILES));
    } else {
      setFiles(allFiles);
    }
    toast({ title: `${Math.min(allFiles.length, MAX_FILES)} files loaded` });
  }, [toast]);

  const handlePasteAdd = () => {
    if (!pasteCode.trim()) return;
    setFiles((prev) => [
      ...prev,
      { path: `/pasted-code-${prev.length + 1}.txt`, content: pasteCode, language: pasteLang },
    ]);
    setPasteCode("");
    toast({ title: "Code snippet added" });
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = () => {
    if (files.length === 0) {
      toast({ title: "No files to analyze", description: "Upload files or paste code first", variant: "destructive" });
      return;
    }
    // Store in sessionStorage for the report page
    sessionStorage.setItem("explyn_files", JSON.stringify(files));
    sessionStorage.setItem("explyn_level", level);
    navigate("/report");
  };

  const langCounts = files.reduce<Record<string, number>>((acc, f) => {
    acc[f.language] = (acc[f.language] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> <span className="text-gradient font-bold">Explyn</span>
          </button>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Upload Your Code</h1>
        <p className="text-muted-foreground mb-8">Drag & drop a folder or paste code snippets</p>

        <Tabs defaultValue="upload" className="mb-8">
          <TabsList className="bg-secondary">
            <TabsTrigger value="upload" className="gap-2"><FolderOpen className="h-4 w-4" /> Upload Folder</TabsTrigger>
            <TabsTrigger value="paste" className="gap-2"><ClipboardPaste className="h-4 w-4" /> Paste Code</TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`mt-4 border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
                isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
            >
              <UploadIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-1">Drop your project folder here</p>
              <p className="text-sm text-muted-foreground">or click to browse • Max {MAX_FILES} files, {MAX_FILE_SIZE / 1024}KB each</p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                {...({ webkitdirectory: "", directory: "" } as any)}
                multiple
                onChange={handleFileInput}
              />
            </div>
          </TabsContent>

          <TabsContent value="paste">
            <div className="mt-4 space-y-4">
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-sm text-muted-foreground mb-1 block">Language</label>
                  <Select value={pasteLang} onValueChange={setPasteLang}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PASTE_LANGUAGES.map((l) => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handlePasteAdd} disabled={!pasteCode.trim()}>Add Snippet</Button>
              </div>
              <Textarea
                value={pasteCode}
                onChange={(e) => setPasteCode(e.target.value)}
                placeholder="Paste your code here..."
                className="min-h-[200px] font-mono text-sm bg-card"
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* File Tree */}
        {files.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">{files.length} Files Loaded</h2>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(langCounts).map(([lang, count]) => (
                  <Badge key={lang} variant="secondary" className="text-xs">{lang}: {count}</Badge>
                ))}
              </div>
            </div>
            <div className="border border-border rounded-xl bg-card max-h-64 overflow-y-auto">
              {files.map((file, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2 border-b border-border/50 last:border-0 hover:bg-secondary/50 group">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileCode className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm truncate">{file.path}</span>
                    <Badge variant="outline" className="text-xs shrink-0">{file.language}</Badge>
                  </div>
                  <button onClick={() => removeFile(i)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Level Selector */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Explanation Level</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(["beginner", "intermediate", "advanced"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  level === l
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/30"
                }`}
              >
                <span className="text-sm font-medium capitalize">{l}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Analyze */}
        <Button size="lg" className="w-full text-base" onClick={handleAnalyze} disabled={files.length === 0}>
          Analyze {files.length} file{files.length !== 1 ? "s" : ""} <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default Upload;
