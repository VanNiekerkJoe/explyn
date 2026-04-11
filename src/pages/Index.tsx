import { useNavigate } from "react-router-dom";
import { ArrowRight, Code2, BookOpen, Cpu, Layers, Zap, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

const languages = [
  "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust",
  "Swift", "Kotlin", "Ruby", "PHP", "Dart", "Scala", "R", "MATLAB",
  "Perl", "Lua", "Haskell", "Elixir", "Clojure", "F#", "Objective-C", "Assembly",
];

const levels = [
  {
    title: "Beginner",
    icon: BookOpen,
    description: "Simple analogies, no jargon. Understand what your code does in plain English.",
    color: "from-green-400 to-emerald-500",
  },
  {
    title: "Intermediate",
    icon: Layers,
    description: "Technical but accessible. Covers patterns, best practices, and architecture.",
    color: "from-blue-400 to-cyan-500",
  },
  {
    title: "Advanced",
    icon: Cpu,
    description: "Deep internals, performance implications, edge cases, and optimization.",
    color: "from-purple-400 to-pink-500",
  },
];

const features = [
  { icon: Code2, title: "Any Language", desc: "Supports every programming language and framework" },
  { icon: Eye, title: "Deep Analysis", desc: "Imports, classes, data structures, views — everything explained" },
  { icon: Zap, title: "AI Powered", desc: "Intelligent analysis that adapts to your knowledge level" },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-bold text-gradient">Explyn</span>
          <Button onClick={() => navigate("/upload")} size="sm">
            Get Started <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-secondary/50 text-sm text-muted-foreground mb-8">
            <Zap className="h-3.5 w-3.5 text-primary" />
            AI-Powered Code Analysis
          </div>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            Understand any
            <br />
            <span className="text-gradient">codebase, deeply.</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Upload your project files and get a comprehensive breakdown of every class,
            function, import, and data structure — explained at your level.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="text-base px-8 animate-pulse-glow"
              onClick={() => navigate("/upload")}
            >
              Upload Your Code <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base px-8"
              onClick={() => {
                document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Language Marquee */}
      <section className="py-10 border-y border-border/50 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...languages, ...languages].map((lang, i) => (
            <span
              key={i}
              className="mx-4 px-4 py-1.5 rounded-full border border-border bg-secondary/30 text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
            >
              {lang}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
            {features.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors"
              >
                <f.icon className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Explanation Levels */}
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            Three Levels of <span className="text-gradient">Understanding</span>
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            Choose the depth that matches your experience
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {levels.map((level) => (
              <div
                key={level.title}
                className="group p-6 rounded-2xl border border-border bg-card hover:border-primary/30 transition-all hover:-translate-y-1"
              >
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${level.color} mb-4`}>
                  <level.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{level.title}</h3>
                <p className="text-muted-foreground text-sm">{level.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center p-12 rounded-3xl border border-border bg-card">
          <h2 className="text-3xl font-bold mb-4">Ready to understand your code?</h2>
          <p className="text-muted-foreground mb-8">
            Upload any project and get a deep, structured explanation in seconds.
          </p>
          <Button size="lg" className="text-base px-8" onClick={() => navigate("/upload")}>
            Start Analyzing <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <span className="text-gradient font-semibold">Explyn</span>
          <span>AI-powered code analysis</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
