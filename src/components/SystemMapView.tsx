import { useMemo, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

interface SystemMapViewProps {
  files: { path: string; content: string; language: string }[];
  onNodeClick?: (filePath: string) => void;
}

function extractImports(content: string, language: string): string[] {
  const imports: string[] = [];
  const lines = content.split("\n");
  for (const line of lines) {
    // JS/TS imports
    let match = line.match(/(?:import|require)\s*\(?['"](\.\/[^'"]+|\.\.\/[^'"]+)['"]\)?/);
    if (match) { imports.push(match[1]); continue; }
    // Python imports
    match = line.match(/^(?:from|import)\s+([\w.]+)/);
    if (match && language === "Python") { imports.push(match[1].replace(/\./g, "/")); continue; }
    // Go imports
    match = line.match(/^\s*"([^"]+)"/);
    if (match && language === "Go") { imports.push(match[1]); }
  }
  return imports;
}

function resolveImport(from: string, imp: string, allPaths: string[]): string | null {
  if (!imp.startsWith(".")) return null;
  const fromDir = from.split("/").slice(0, -1).join("/");
  const parts = imp.split("/");
  let resolved = fromDir.split("/");
  for (const p of parts) {
    if (p === ".") continue;
    if (p === "..") { resolved.pop(); continue; }
    resolved.push(p);
  }
  const target = resolved.join("/");
  // Try exact match or with extensions
  const exts = ["", ".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.tsx", "/index.js"];
  for (const ext of exts) {
    const full = target + ext;
    if (allPaths.includes(full)) return full;
  }
  return null;
}

const SystemMapView = ({ files, onNodeClick }: SystemMapViewProps) => {
  const { initialNodes, initialEdges } = useMemo(() => {
    const paths = files.map((f) => f.path);
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const cols = Math.ceil(Math.sqrt(files.length));

    files.forEach((file, i) => {
      const name = file.path.split("/").pop() || file.path;
      const col = i % cols;
      const row = Math.floor(i / cols);
      nodes.push({
        id: file.path,
        position: { x: col * 250, y: row * 120 },
        data: { label: name },
        style: {
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
          borderRadius: "0.75rem",
          padding: "8px 16px",
          color: "hsl(var(--foreground))",
          fontSize: "12px",
          cursor: "pointer",
        },
      });

      const imports = extractImports(file.content, file.language);
      for (const imp of imports) {
        const resolved = resolveImport(file.path, imp, paths);
        if (resolved) {
          edges.push({
            id: `${file.path}->${resolved}`,
            source: file.path,
            target: resolved,
            style: { stroke: "hsl(var(--muted-foreground))", strokeWidth: 1 },
            animated: true,
          });
        }
      }
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [files]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const handleNodeClick = useCallback((_: any, node: Node) => {
    onNodeClick?.(node.id);
  }, [onNodeClick]);

  return (
    <div className="w-full h-[500px] rounded-2xl overflow-hidden border border-border bg-card">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background color="hsl(var(--border))" gap={20} />
        <Controls
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.5rem" }}
        />
      </ReactFlow>
    </div>
  );
};

export default SystemMapView;
