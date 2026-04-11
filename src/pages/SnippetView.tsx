import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Code2, Bug, GraduationCap } from "lucide-react";
import ShareButton from "@/components/ShareButton";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import InteractiveCodeViewer from "@/components/InteractiveCodeViewer";
import type { Database } from "@/integrations/supabase/types";

type Snippet = Database["public"]["Tables"]["snippets"]["Row"];

const modeIcons = { explain: Code2, debug: Bug, learn: GraduationCap };

const SnippetView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [activeTab, setActiveTab] = useState<"code" | "explanation">("explanation");

  useEffect(() => {
    if (!id) return;
    supabase.from("snippets").select("*").eq("id", id).single().then(({ data }) => {
      if (data) setSnippet(data);
      else navigate("/dashboard");
    });
  }, [id]);

  if (!snippet) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading...</div>;

  const ModeIcon = modeIcons[snippet.mode as keyof typeof modeIcons] || Code2;
  const lang = snippet.language.toLowerCase();

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

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <div className="noise" aria-hidden="true" />
      <div className="bg-orb orb-1" aria-hidden="true" />

      <div className="relative z-10">
        <nav className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl">
          <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
            <button onClick={() => navigate("/dashboard")} className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="font-bold text-foreground tracking-tight">Explyn<span className="text-muted-foreground">.</span></span>
            </button>
            <ShareButton snippetId={snippet.id} isPublic={(snippet as any).is_public} shareSlug={(snippet as any).share_slug} />
          </div>
        </nav>

        <div className="pt-28 pb-16 px-6 max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <ModeIcon className="h-5 w-5 text-muted-foreground" />
            <span className="eyebrow capitalize">{snippet.mode} · {snippet.level}</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">{snippet.title}</h1>
          <div className="flex gap-2 mb-8">
            <span className="px-3 py-1 rounded-full border border-border text-xs text-muted-foreground">{snippet.language}</span>
            <span className="px-3 py-1 rounded-full border border-border text-xs text-muted-foreground">{new Date(snippet.created_at).toLocaleDateString()}</span>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 p-1 glass-panel rounded-full w-fit">
            <button
              onClick={() => setActiveTab("explanation")}
              className={`px-5 py-2 rounded-full text-sm transition-colors ${activeTab === "explanation" ? "bg-foreground text-background" : "text-muted-foreground"}`}
            >
              Explanation
            </button>
            <button
              onClick={() => setActiveTab("code")}
              className={`px-5 py-2 rounded-full text-sm transition-colors ${activeTab === "code" ? "bg-foreground text-background" : "text-muted-foreground"}`}
            >
              Source Code
            </button>
          </div>

          {activeTab === "explanation" && snippet.explanation && (
            <div className="glass-panel rounded-2xl p-6 prose prose-sm prose-invert max-w-none">
              <ReactMarkdown components={mdComponents}>{snippet.explanation}</ReactMarkdown>
            </div>
          )}

          {activeTab === "code" && (
            <InteractiveCodeViewer
              code={snippet.code}
              language={snippet.language}
              level={snippet.level}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default SnippetView;
