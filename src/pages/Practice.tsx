import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Dumbbell, Loader2, Sparkles, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { streamLearn } from "@/lib/stream";
import { toast } from "@/hooks/use-toast";

type Level = "beginner" | "intermediate" | "advanced";

const LANGUAGES = ["Python", "JavaScript", "TypeScript", "Java", "C++", "SQL"];
const TOPICS = ["Fundamentals", "Strings", "Arrays", "Loops", "Recursion", "Hash maps", "Sorting", "Trees"];

const Practice = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState("Python");
  const [topic, setTopic] = useState("Fundamentals");
  const [level, setLevel] = useState<Level>("beginner");
  const [challenge, setChallenge] = useState("");
  const [solution, setSolution] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loadingChallenge, setLoadingChallenge] = useState(false);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  const newChallenge = async () => {
    if (loadingChallenge) return;
    setChallenge("");
    setFeedback("");
    setSolution("");
    setLoadingChallenge(true);
    try {
      await streamLearn(
        {
          mode: "challenge",
          messages: [{ role: "user", content: `Generate a ${level} ${language} challenge on ${topic}` }],
          language, level, topic,
        },
        (c) => setChallenge((p) => p + c),
      );
    } catch (e) {
      toast({ title: "Couldn't generate", description: e instanceof Error ? e.message : "Try again", variant: "destructive" });
    } finally {
      setLoadingChallenge(false);
    }
  };

  const submitSolution = async () => {
    if (!solution.trim() || !challenge || loadingFeedback) return;
    setFeedback("");
    setLoadingFeedback(true);
    try {
      await streamLearn(
        {
          mode: "feedback",
          messages: [
            { role: "user", content: `Here is the challenge:\n\n${challenge}\n\nMy solution:\n\n\`\`\`${language.toLowerCase()}\n${solution}\n\`\`\`` },
          ],
          language, level, topic,
        },
        (c) => setFeedback((p) => p + c),
      );
    } catch (e) {
      toast({ title: "Couldn't review", description: e instanceof Error ? e.message : "Try again", variant: "destructive" });
    } finally {
      setLoadingFeedback(false);
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
        <code className="bg-muted px-1.5 py-0.5 rounded text-xs" {...props}>{children}</code>
      );
    },
  };

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <div className="noise" aria-hidden="true" />
      <div className="bg-orb orb-2" aria-hidden="true" />

      <div className="relative z-10">
        <nav className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> <span className="text-sm">Hub</span>
            </button>
            <span className="text-sm font-bold tracking-tight">Practice</span>
            <div className="w-12" />
          </div>
        </nav>

        <div className="pt-20 pb-16 px-4 sm:px-6 max-w-5xl mx-auto space-y-5">
          {/* Controls */}
          <div className="glass-panel rounded-2xl p-5 flex flex-wrap items-end gap-4">
            <div>
              <p className="eyebrow mb-2">Language</p>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="bg-background/60 border border-border rounded-lg px-3 py-2 text-sm">
                {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <p className="eyebrow mb-2">Topic</p>
              <select value={topic} onChange={(e) => setTopic(e.target.value)} className="bg-background/60 border border-border rounded-lg px-3 py-2 text-sm">
                {TOPICS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <p className="eyebrow mb-2">Level</p>
              <select value={level} onChange={(e) => setLevel(e.target.value as Level)} className="bg-background/60 border border-border rounded-lg px-3 py-2 text-sm">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <button
              onClick={newChallenge}
              disabled={loadingChallenge}
              className="ml-auto px-4 py-2 rounded-lg bg-foreground text-background text-xs font-medium inline-flex items-center gap-1.5 disabled:opacity-40"
            >
              {loadingChallenge ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              New challenge
            </button>
          </div>

          {/* Challenge */}
          {!challenge && !loadingChallenge && (
            <div className="glass-panel rounded-2xl p-10 text-center">
              <div className="w-12 h-12 rounded-2xl border border-border bg-background/60 flex items-center justify-center mx-auto mb-4">
                <Dumbbell className="h-5 w-5" strokeWidth={1.6} />
              </div>
              <h2 className="text-xl font-semibold mb-2">Ready to practice?</h2>
              <p className="text-sm text-muted-foreground">Pick your settings and tap "New challenge" to start.</p>
            </div>
          )}

          {(challenge || loadingChallenge) && (
            <article className="glass-panel rounded-2xl p-6 sm:p-8">
              <div className="prose prose-invert prose-sm sm:prose-base max-w-none prose-h2:text-lg prose-h3:text-base prose-p:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                  {challenge || "_Generating challenge…_"}
                </ReactMarkdown>
              </div>
            </article>
          )}

          {/* Solution */}
          {challenge && (
            <div className="glass-panel rounded-2xl p-5 sm:p-6">
              <p className="eyebrow mb-3">Your solution</p>
              <textarea
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                placeholder={`# Write your ${language} solution here…`}
                rows={10}
                spellCheck={false}
                className="w-full font-mono text-sm bg-background/60 border border-border rounded-lg p-3 focus:outline-none focus:border-foreground/40 resize-y"
              />
              <div className="flex justify-end mt-3">
                <button
                  onClick={submitSolution}
                  disabled={!solution.trim() || loadingFeedback}
                  className="px-4 py-2 rounded-lg bg-foreground text-background text-xs font-medium inline-flex items-center gap-1.5 disabled:opacity-40"
                >
                  {loadingFeedback ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Submit for review
                </button>
              </div>
            </div>
          )}

          {(feedback || loadingFeedback) && (
            <article className="glass-panel rounded-2xl p-6 sm:p-8">
              <p className="eyebrow mb-3">Feedback</p>
              <div className="prose prose-invert prose-sm sm:prose-base max-w-none prose-h2:text-lg prose-p:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                  {feedback || "_Reviewing…_"}
                </ReactMarkdown>
              </div>
            </article>
          )}
        </div>
      </div>
    </div>
  );
};

export default Practice;
