import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Code2, Bug, GraduationCap, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const modeIcons = { explain: Code2, debug: Bug, learn: GraduationCap };

const ShareView = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [snippet, setSnippet] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from("snippets")
      .select("*")
      .eq("share_slug", slug)
      .eq("is_public", true)
      .single()
      .then(({ data, error }) => {
        if (data) setSnippet(data);
        else setNotFound(true);
      });
  }, [slug]);

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

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Not found</h1>
          <p className="text-muted-foreground mb-6">This shared snippet doesn't exist or is no longer public.</p>
          <button onClick={() => navigate("/")} className="btn-primary">Go to Explyn</button>
        </div>
      </div>
    );
  }

  if (!snippet) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading…</div>;
  }

  const ModeIcon = modeIcons[snippet.mode as keyof typeof modeIcons] || Code2;

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <div className="noise" aria-hidden="true" />
      <div className="bg-orb orb-1" aria-hidden="true" />

      <div className="relative z-10">
        <nav className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl">
          <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
            <span className="font-bold tracking-tight">Explyn<span className="text-muted-foreground">.</span></span>
            <button onClick={() => navigate("/upload")} className="btn-primary text-sm">
              Try Explyn <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        </nav>

        <div className="pt-28 pb-16 px-6 max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <ModeIcon className="h-5 w-5 text-muted-foreground" />
            <span className="eyebrow capitalize">{snippet.mode} · {snippet.level}</span>
            <span className="px-2 py-0.5 rounded-full border border-border text-[10px] text-muted-foreground">Shared</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">{snippet.title}</h1>
          <div className="flex gap-2 mb-8">
            <span className="px-3 py-1 rounded-full border border-border text-xs text-muted-foreground">{snippet.language}</span>
          </div>

          {snippet.explanation && (
            <div className="glass-panel rounded-2xl p-6 prose prose-sm prose-invert max-w-none mb-8">
              <ReactMarkdown components={mdComponents}>{snippet.explanation}</ReactMarkdown>
            </div>
          )}

          <div className="glass-panel rounded-2xl p-6">
            <p className="eyebrow mb-3">Source Code</p>
            <SyntaxHighlighter
              style={oneDark}
              language={snippet.language.toLowerCase()}
              customStyle={{ borderRadius: "0.75rem", fontSize: "0.8rem", background: "hsl(0 0% 8%)" }}
            >
              {snippet.code}
            </SyntaxHighlighter>
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground mb-4">Want to analyze your own code?</p>
            <button onClick={() => navigate("/upload")} className="btn-primary">
              Get started with Explyn <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareView;
