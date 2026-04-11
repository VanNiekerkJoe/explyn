import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALLOWED_EXTENSIONS = new Set([
  "js", "jsx", "ts", "tsx", "py", "java", "cpp", "c", "cs", "go", "rs",
  "swift", "kt", "rb", "php", "dart", "scala", "r", "lua", "hs", "ex",
  "clj", "fs", "m", "asm", "html", "css", "scss", "json", "xml", "yaml",
  "yml", "md", "sql", "sh", "bat", "ps1", "vue", "svelte", "toml", "cfg",
  "ini", "env", "txt", "dockerfile", "makefile",
]);

const IGNORE_DIRS = new Set([
  "node_modules", ".git", ".svn", "dist", "build", "out", ".next",
  "__pycache__", ".venv", "venv", "env", ".idea", ".vscode",
  "bin", "obj", "target", ".gradle", "vendor", ".cache",
  "coverage", ".nyc_output", ".turbo",
]);

const LANGUAGE_MAP: Record<string, string> = {
  js: "JavaScript", jsx: "JavaScript", ts: "TypeScript", tsx: "TypeScript",
  py: "Python", java: "Java", cpp: "C++", c: "C", cs: "C#", go: "Go",
  rs: "Rust", swift: "Swift", kt: "Kotlin", rb: "Ruby", php: "PHP",
  dart: "Dart", html: "HTML", css: "CSS", scss: "SCSS", json: "JSON",
  xml: "XML", yaml: "YAML", yml: "YAML", md: "Markdown", sql: "SQL",
  sh: "Shell", vue: "Vue", svelte: "Svelte", toml: "TOML",
};

const MAX_FILES = 200;
const MAX_FILE_SIZE = 500_000; // 500KB per file

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { repoUrl } = await req.json();
    if (!repoUrl || typeof repoUrl !== "string") {
      return new Response(JSON.stringify({ error: "Missing repoUrl" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse GitHub URL: support github.com/user/repo formats
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/\s#?]+)/);
    if (!match) {
      return new Response(JSON.stringify({ error: "Invalid GitHub URL. Use: https://github.com/user/repo" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const owner = match[1];
    const repo = match[2].replace(/\.git$/, "");
    const branch = "HEAD"; // default branch

    // Fetch repo tree recursively via GitHub API
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
    const treeRes = await fetch(apiUrl, {
      headers: { "Accept": "application/vnd.github.v3+json", "User-Agent": "Explyn" },
    });

    if (!treeRes.ok) {
      if (treeRes.status === 404) {
        return new Response(JSON.stringify({ error: "Repository not found or is private. Only public repos are supported." }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (treeRes.status === 403) {
        return new Response(JSON.stringify({ error: "GitHub API rate limit reached. Try again in a minute." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Failed to fetch repository" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const treeData = await treeRes.json();
    const tree = treeData.tree || [];

    // Filter to relevant files
    const relevantFiles = tree.filter((item: any) => {
      if (item.type !== "blob") return false;
      const path = item.path as string;

      // Skip ignored directories
      const parts = path.split("/");
      if (parts.some((p: string) => IGNORE_DIRS.has(p))) return false;

      // Skip hidden files/dirs
      if (parts.some((p: string) => p.startsWith("."))) return false;

      // Check extension
      const ext = path.split(".").pop()?.toLowerCase() || "";
      const fileName = parts[parts.length - 1].toLowerCase();

      // Allow known extensionless files
      if (["dockerfile", "makefile", "gemfile", "rakefile"].includes(fileName)) return true;

      return ALLOWED_EXTENSIONS.has(ext);
    }).slice(0, MAX_FILES);

    // Fetch file contents in parallel (batched)
    const files: Array<{ path: string; content: string; language: string }> = [];
    const batchSize = 10;

    for (let i = 0; i < relevantFiles.length; i += batchSize) {
      const batch = relevantFiles.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map(async (item: any) => {
          try {
            const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${item.path}`;
            const res = await fetch(rawUrl);
            if (!res.ok) return null;
            const content = await res.text();
            if (content.length > MAX_FILE_SIZE) return null;
            // Skip binary-looking content
            if (content.includes("\0")) return null;

            const ext = item.path.split(".").pop()?.toLowerCase() || "";
            const language = LANGUAGE_MAP[ext] || "Unknown";

            return { path: item.path, content, language };
          } catch {
            return null;
          }
        })
      );
      files.push(...results.filter(Boolean) as any[]);
    }

    return new Response(JSON.stringify({
      owner,
      repo,
      fileCount: files.length,
      files,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("github-import error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
