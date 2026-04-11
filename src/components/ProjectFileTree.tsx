import { useState } from "react";
import { ChevronRight, ChevronDown, FileCode, Folder, FolderOpen } from "lucide-react";

interface TreeNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: TreeNode[];
  language?: string;
}

interface ProjectFileTreeProps {
  files: { path: string; language: string }[];
  onSelectFile: (path: string) => void;
  selectedPath?: string;
}

function buildTree(files: { path: string; language: string }[]): TreeNode[] {
  const root: TreeNode[] = [];
  for (const file of files) {
    const parts = file.path.replace(/^\//, "").split("/");
    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const isFile = i === parts.length - 1;
      const existing = current.find((n) => n.name === name);
      if (existing) {
        current = existing.children || [];
      } else {
        const node: TreeNode = {
          name,
          path: "/" + parts.slice(0, i + 1).join("/"),
          type: isFile ? "file" : "folder",
          language: isFile ? file.language : undefined,
          children: isFile ? undefined : [],
        };
        current.push(node);
        if (!isFile) current = node.children!;
      }
    }
  }
  // Sort: folders first, then files
  const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((n) => { if (n.children) sortNodes(n.children); });
    return nodes;
  };
  return sortNodes(root);
}

const TreeItem = ({ node, onSelectFile, selectedPath, depth = 0 }: { node: TreeNode; onSelectFile: (p: string) => void; selectedPath?: string; depth?: number }) => {
  const [open, setOpen] = useState(depth < 2);
  const isSelected = node.path === selectedPath;

  if (node.type === "folder") {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center gap-1.5 px-2 py-1 text-xs hover:bg-foreground/5 rounded transition-colors text-muted-foreground hover:text-foreground"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {open ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
          {open ? <FolderOpen className="h-3.5 w-3.5 shrink-0" /> : <Folder className="h-3.5 w-3.5 shrink-0" />}
          <span className="truncate">{node.name}</span>
        </button>
        {open && node.children?.map((child) => (
          <TreeItem key={child.path} node={child} onSelectFile={onSelectFile} selectedPath={selectedPath} depth={depth + 1} />
        ))}
      </div>
    );
  }

  return (
    <button
      onClick={() => onSelectFile(node.path)}
      className={`w-full flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors ${
        isSelected ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
      }`}
      style={{ paddingLeft: `${depth * 12 + 20}px` }}
    >
      <FileCode className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{node.name}</span>
    </button>
  );
};

const ProjectFileTree = ({ files, onSelectFile, selectedPath }: ProjectFileTreeProps) => {
  const tree = buildTree(files);

  return (
    <div className="py-2 space-y-0.5">
      {tree.map((node) => (
        <TreeItem key={node.path} node={node} onSelectFile={onSelectFile} selectedPath={selectedPath} />
      ))}
    </div>
  );
};

export default ProjectFileTree;
