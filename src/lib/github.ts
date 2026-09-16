/**
 * GitHub import — runs entirely in the browser against the public GitHub API.
 * No server, no token needed for public repositories.
 */

const LANGUAGE_MAP: Record<string, string> = {
  js: "JavaScript", jsx: "JavaScript", ts: "TypeScript", tsx: "TypeScript",
  py: "Python", java: "Java", cpp: "C++", c: "C", cs: "C#", go: "Go",
  rs: "Rust", swift: "Swift", kt: "Kotlin", rb: "Ruby", php: "PHP",
  dart: "Dart", scala: "Scala", r: "R", lua: "Lua", hs: "Haskell",
  ex: "Elixir", clj: "Clojure", fs: "F#", m: "Objective-C",
  html: "HTML", css: "CSS", scss: "SCSS", json: "JSON", xml: "XML",
  yaml: "YAML", yml: "YAML", md: "Markdown", sql: "SQL", sh: "Shell",
  vue: "Vue", svelte: "Svelte",
};

const IGNORE_DIRS = new Set([
  "node_modules", ".git", "dist", "build", "out", ".next", "__pycache__",
  ".venv", "venv", "vendor", "coverage", ".turbo", "target", "bin", "obj",
]);

export interface ImportedFile {
  path: string;
  content: string;
  language: string;
}

export function parseRepoUrl(input: string) {
  const cleaned = input.trim().replace(/\.git$/, "").replace(/\/+$/, "");
  const match = cleaned.match(/github\.com[/:]([^/]+)\/([^/]+)/) || cleaned.match(/^([^/\s]+)\/([^/\s]+)$/);
  if (!match) throw new Error("That doesn't look like a GitHub repository address.");
  return { owner: match[1], repo: match[2] };
}

export async function importGithubRepo(
  url: string,
  maxFiles = 60,
): Promise<{ owner: string; repo: string; files: ImportedFile[] }> {
  const { owner, repo } = parseRepoUrl(url);

  const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
  if (!repoRes.ok) {
    throw new Error(
      repoRes.status === 404
        ? "Repository not found. It must be public."
        : "GitHub rejected the request. Try again in a minute.",
    );
  }
  const repoInfo = await repoRes.json();
  const branch = repoInfo.default_branch || "main";

  const treeRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
  );
  if (!treeRes.ok) throw new Error("Could not read the repository file list.");
  const tree = await treeRes.json();

  const candidates = (tree.tree || [])
    .filter((n: any) => n.type === "blob" && n.size && n.size < 200_000)
    .filter((n: any) => !n.path.split("/").some((p: string) => IGNORE_DIRS.has(p) || p.startsWith(".")))
    .filter((n: any) => LANGUAGE_MAP[n.path.split(".").pop()?.toLowerCase() || ""])
    .slice(0, maxFiles);

  const files: ImportedFile[] = [];
  for (const node of candidates) {
    try {
      const raw = await fetch(
        `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${node.path}`,
      );
      if (!raw.ok) continue;
      const content = await raw.text();
      if (content.includes("\0")) continue;
      files.push({
        path: `/${node.path}`,
        content,
        language: LANGUAGE_MAP[node.path.split(".").pop()?.toLowerCase() || ""] || "Unknown",
      });
    } catch {
      // skip unreadable file
    }
  }

  return { owner, repo, files };
}
