import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, CheckCircle2, Circle, Clock, Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { getCourse, type CourseLesson } from "@/data/courses";
import { streamLearn } from "@/lib/stream";
import { toast } from "@/hooks/use-toast";

type Level = "beginner" | "intermediate" | "advanced";

const LEVELS: { id: Level; label: string }[] = [
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
];

const Course = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const course = useMemo(() => (id ? getCourse(id) : undefined), [id]);

  const [activeLesson, setActiveLesson] = useState<CourseLesson | null>(null);
  const [level, setLevel] = useState<Level>("beginner");
  const [lesson, setLesson] = useState("");
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const storageKey = `course-progress-${id}`;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setCompleted(new Set(JSON.parse(saved)));
    } catch {}
  }, [storageKey]);

  const markDone = (lessonId: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      next.add(lessonId);
      try { localStorage.setItem(storageKey, JSON.stringify(Array.from(next))); } catch {}
      return next;
    });
  };

  const generate = async (l: CourseLesson) => {
    if (!course || loading) return;
    setActiveLesson(l);
    setLesson("");
    setLoading(true);
    try {
      await streamLearn(
        {
          mode: "lesson",
          messages: [{ role: "user", content: `Teach me: ${l.topic}` }],
          language: course.language,
          level,
          topic: l.topic,
        },
        (chunk) => setLesson((prev) => prev + chunk),
      );
      markDone(l.id);
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

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Course not found.</p>
          <button onClick={() => navigate("/courses")} className="text-sm underline">Back to courses</button>
        </div>
      </div>
    );
  }

  const progress = Math.round((completed.size / course.lessons.length) * 100);

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <div className="noise" aria-hidden="true" />
      <div className="bg-orb orb-1" aria-hidden="true" />

      <div className="relative z-10">
        <nav className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <button onClick={() => navigate("/courses")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Courses</span>
            </button>
            <span className="text-sm font-bold tracking-tight truncate max-w-[50%]">{course.title}</span>
            <div className="w-16" />
          </div>
        </nav>

        <div className="pt-20 pb-16 px-4 sm:px-6 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <aside className="space-y-5">
            <div className={`relative overflow-hidden glass-panel rounded-2xl p-5`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${course.color} opacity-60 pointer-events-none`} />
              <div className="relative">
                <div className="text-2xl mb-3">{course.emoji}</div>
                <p className="eyebrow mb-1">{course.language} · {course.level}</p>
                <h1 className="text-xl font-semibold tracking-tight mb-1.5">{course.title}</h1>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">{course.description}</p>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
                  <span>Progress</span>
                  <span>{completed.size}/{course.lessons.length}</span>
                </div>
                <div className="h-1.5 rounded-full bg-foreground/10 overflow-hidden">
                  <div className="h-full bg-foreground transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-5">
              <p className="eyebrow mb-3">Level</p>
              <div className="grid grid-cols-3 gap-1.5">
                {LEVELS.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setLevel(l.id)}
                    className={`px-2 py-1.5 rounded-lg text-[11px] border transition-all ${level === l.id ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-3">
              <p className="eyebrow mb-2 px-2 pt-2">Lessons</p>
              <div className="space-y-0.5">
                {course.lessons.map((l, i) => {
                  const done = completed.has(l.id);
                  const active = activeLesson?.id === l.id;
                  return (
                    <button
                      key={l.id}
                      onClick={() => generate(l)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg flex items-start gap-2.5 transition-all ${active ? "bg-foreground/10" : "hover:bg-foreground/5"}`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {done ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground/50" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium leading-tight ${active ? "text-foreground" : "text-foreground/90"}`}>
                          <span className="text-muted-foreground mr-1.5">{i + 1}.</span>
                          {l.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1 inline-flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" /> {l.duration}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          <main className="min-h-[60vh]">
            {!activeLesson && !loading && (
              <div className="glass-panel rounded-2xl p-8 sm:p-14 text-center">
                <div className="w-12 h-12 rounded-2xl border border-border bg-background/60 flex items-center justify-center mx-auto mb-5">
                  <BookOpen className="h-5 w-5" strokeWidth={1.6} />
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold mb-2">Start lesson 1</h2>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                  Pick a lesson from the sidebar. Lessons adapt to the level you choose.
                </p>
                <button
                  onClick={() => generate(course.lessons[0])}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-foreground text-background text-xs font-medium"
                >
                  <Sparkles className="h-3 w-3" /> Begin {course.lessons[0].title}
                </button>
              </div>
            )}

            {(activeLesson && (lesson || loading)) && (
              <article className="glass-panel rounded-2xl p-6 sm:p-8">
                <div className="flex items-center justify-between mb-5 pb-4 border-b border-border/50">
                  <div className="min-w-0">
                    <p className="eyebrow">{course.language} · {level}</p>
                    <h2 className="text-lg font-semibold mt-1 truncate">{activeLesson.title}</h2>
                  </div>
                  {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />}
                </div>
                <div className="prose prose-invert prose-sm sm:prose-base max-w-none prose-headings:tracking-tight prose-headings:font-semibold prose-h2:text-lg prose-h2:mt-6 prose-p:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                    {lesson || "_Generating lesson…_"}
                  </ReactMarkdown>
                </div>

                {!loading && lesson && (
                  <div className="mt-8 pt-6 border-t border-border/50 flex flex-col sm:flex-row gap-3 justify-between">
                    <button
                      onClick={() => markDone(activeLesson.id)}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full border border-border text-xs font-medium hover:bg-foreground/5"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Mark complete
                    </button>
                    {(() => {
                      const idx = course.lessons.findIndex((l) => l.id === activeLesson.id);
                      const next = course.lessons[idx + 1];
                      if (!next) return (
                        <span className="text-xs text-muted-foreground self-center">🎉 You finished the course!</span>
                      );
                      return (
                        <button
                          onClick={() => generate(next)}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-foreground text-background text-xs font-medium"
                        >
                          Next: {next.title}
                        </button>
                      );
                    })()}
                  </div>
                )}
              </article>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Course;
