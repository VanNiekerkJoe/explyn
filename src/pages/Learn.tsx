import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, GraduationCap, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { streamLearn } from "@/lib/stream";
import { toast } from "@/hooks/use-toast";
import ActivityStatus from "@/components/ActivityStatus";

type Level = "beginner" | "intermediate" | "advanced";

const TRACKS: { language: string; topics: string[] }[] = [
  { language: "Python", topics: ["Variables & types", "Loops & conditionals", "Functions", "Lists & dictionaries", "Classes & OOP", "File I/O", "Error handling"] },
  { language: "JavaScript", topics: ["let/const & scope", "Arrow functions", "Arrays & objects", "Async/await", "DOM basics", "Promises", "ES modules"] },
  { language: "TypeScript", topics: ["Types vs interfaces", "Generics", "Utility types", "Narrowing", "Modules", "tsconfig basics"] },
  { language: "Web", topics: ["HTML semantics", "CSS flex & grid", "Responsive design", "Fetch & APIs", "LocalStorage", "Forms"] },
  { language: "Data structures", topics: ["Arrays", "Linked lists", "Hash maps", "Stacks & queues", "Trees", "Graphs", "Big-O basics"] },
  { language: "SQL", topics: ["SELECT basics", "JOINs", "GROUP BY & aggregates", "Subqueries", "Indexes", "Window functions"] },
];

const LEVELS: { id: Level; label: string; desc: string }[] = [
  { id: "beginner", label: "Beginner", desc: "Plain words, analogies" },
  { id: "intermediate", label: "Intermediate", desc: "Real examples, technical" },
  { id: "advanced", label: "Advanced", desc: "Deep, tradeoffs, internals" },
];

const Learn = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState("Python");
  const [topic, setTopic] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [level, setLevel] = useState<Level>("beginner");
  const [lesson, setLesson] = useState("");
  const [loading, setLoading] = useState(false);

  const activeTrack = TRACKS.find((t) => t.language === language)!;

  const generate = async (selectedTopic: string) => {
    if (!selectedTopic.trim() || loading) return;
    setTopic(selectedTopic);
    setLesson("");
    setLoading(true);
    try {
      await streamLearn(
        {
          mode: "lesson",
          messages: [{ role: "user", content: `Teach me: ${selectedTopic}` }],
          language,
          level,
          topic: selectedTopic,
        },
        (chunk) => setLesson((prev) => prev + chunk),
      );
    } catch (e) {
      toast({ title: "Couldn't load lesson", description: e instanceof Error ? e.message : "Try again", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const mdComponents = {
    code({ className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || "");
      return match ? (
        <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div" customStyle={{ borderRadius: "0.75rem", fontSize: "0.8rem", background: "hsl(0 0% 8%)" }}>
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      ) : (
        <code className="bg-muted px-1.5 py-0.5 rounded text-xs sm:text-sm" {...props}>{children}</code>
      );
    },
  };

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <div className="noise" aria-hidden="true" />
      <div className="bg-orb orb-1" aria-hidden="true" />

      <div className="relative z-10">
        <nav className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Hub</span>
            </button>
            <span className="text-sm font-bold tracking-tight">Learn</span>
            <div className="w-12" />
          </div>
        </nav>

        <div className="pt-20 pb-16 px-4 sm:px-6 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Sidebar */}
          <aside className="space-y-5">
            <div className="glass-panel rounded-2xl p-5">
              <p className="eyebrow mb-3">Track</p>
              <div className="flex flex-wrap gap-1.5">
                {TRACKS.map((t) => (
                  <button
                    key={t.language}
                    onClick={() => setLanguage(t.language)}
                    className={`px-2.5 py-1 rounded-full text-xs border transition-all ${language === t.language ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}
                  >
                    {t.language}
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-5">
              <p className="eyebrow mb-3">Level</p>
              <div className="space-y-1.5">
                {LEVELS.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setLevel(l.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg border transition-all ${level === l.id ? "border-foreground bg-foreground/5" : "border-border hover:border-foreground/30"}`}
                  >
                    <p className="text-sm font-medium">{l.label}</p>
                    <p className="text-[11px] text-muted-foreground">{l.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-5">
              <p className="eyebrow mb-3">Topics</p>
              <div className="space-y-1">
                {activeTrack.topics.map((t) => (
                  <button
                    key={t}
                    onClick={() => generate(t)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${topic === t ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-5">
              <p className="eyebrow mb-3">Custom topic</p>
              <input
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") generate(customTopic); }}
                placeholder="e.g. Recursion, decorators…"
                className="w-full px-3 py-2 rounded-lg bg-background/60 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40"
              />
              <button
                onClick={() => generate(customTopic)}
                disabled={!customTopic.trim() || loading}
                className="mt-2 w-full px-3 py-2 rounded-lg bg-foreground text-background text-xs font-medium disabled:opacity-40 inline-flex items-center justify-center gap-1.5"
              >
                <Sparkles className="h-3 w-3" /> Generate lesson
              </button>
            </div>
          </aside>

          {/* Lesson */}
          <main className="min-h-[60vh]">
            {!lesson && !loading && (
              <div className="glass-panel rounded-2xl p-10 sm:p-14 text-center">
                <div className="w-12 h-12 rounded-2xl border border-border bg-background/60 flex items-center justify-center mx-auto mb-5">
                  <GraduationCap className="h-5 w-5" strokeWidth={1.6} />
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold mb-2">Pick a topic to start</h2>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Choose a track and topic on the left, or type any topic you're curious about.
                  Lessons adapt to your level.
                </p>
              </div>
            )}

            {(lesson || loading) && (
              <article className="glass-panel rounded-2xl p-6 sm:p-8">
                <div className="flex items-center justify-between mb-5 pb-4 border-b border-border/50">
                  <div>
                    <p className="eyebrow">{language} · {level}</p>
                    <h2 className="text-lg font-semibold mt-1">{topic}</h2>
                  </div>
                  {loading && <ActivityStatus compact words={["ABSORBING", "CONNECTING", "TEACHING", "CLARIFYING"]} />}
                </div>
                <div className="prose prose-invert prose-sm sm:prose-base max-w-none prose-headings:tracking-tight prose-headings:font-semibold prose-h2:text-lg prose-h2:mt-6 prose-p:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                    {lesson || ""}
                  </ReactMarkdown>
                </div>
              </article>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Learn;
