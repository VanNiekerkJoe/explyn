import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import IntroSplash, { shouldShowIntro } from "@/components/IntroSplash";
import OnboardingTutorial, { shouldShowOnboarding } from "@/components/onboarding/OnboardingTutorial";

const languages = [
  "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust",
  "Swift", "Kotlin", "Ruby", "PHP", "Dart", "Scala", "R", "Haskell",
  "Elixir", "Lua", "Perl", "Objective-C", "Assembly", "SQL", "Shell",
];

const steps = [
  { num: "01", title: "Upload", desc: "Drop your project folder or paste code snippets. We read everything client-side." },
  { num: "02", title: "Choose mode & depth", desc: "Explain, Debug, or Learn mode — at beginner, intermediate, or advanced level." },
  { num: "03", title: "Analyse", desc: "AI scans every file — imports, classes, data structures, views, patterns — and builds a structured report." },
  { num: "04", title: "Ask follow-ups", desc: "Open the context-aware chat. The AI remembers your entire codebase." },
];

const stats = [
  { label: "Languages", value: "30+" },
  { label: "Modes", value: "3 modes" },
  { label: "Follow-up", value: "AI chat" },
];

const Index = () => {
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState(false);
  const [showIntro, setShowIntro] = useState(() => shouldShowIntro());
  const [introDone, setIntroDone] = useState(!shouldShowIntro());
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const isLoggedIn = !!session;
      setLoggedIn(isLoggedIn);
      if (isLoggedIn) {
        // Mark onboarding done forever once logged in
        localStorage.setItem("explyn_onboarding_done", "true");
        setShowOnboarding(false);
      } else if (!shouldShowIntro() && shouldShowOnboarding()) {
        setShowOnboarding(true);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      const isLoggedIn = !!session;
      setLoggedIn(isLoggedIn);
      if (isLoggedIn) {
        localStorage.setItem("explyn_onboarding_done", "true");
        setShowOnboarding(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {showIntro && !introDone && (
        <IntroSplash onComplete={() => {
          setShowIntro(false);
          setIntroDone(true);
          if (!loggedIn && shouldShowOnboarding()) {
            setShowOnboarding(true);
          }
        }} />
      )}
      {showOnboarding && (
        <OnboardingTutorial onComplete={() => setShowOnboarding(false)} />
      )}
      <div className="noise" aria-hidden="true" />
      <div className="bg-orb orb-1" aria-hidden="true" />
      <div className="bg-orb orb-2" aria-hidden="true" />
      <div className="bg-orb orb-3" aria-hidden="true" />

      <div className="relative z-10">
        <nav className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <span className="text-base font-bold tracking-tight">Explyn<span className="text-muted-foreground">.</span></span>
            <div className="flex items-center gap-2">
              <button onClick={() => navigate("/pricing")} className="text-xs text-muted-foreground hover:text-foreground transition-colors hidden sm:block">Pricing</button>
              {loggedIn ? (
                <button onClick={() => navigate("/dashboard")} className="px-3 py-1.5 rounded-full border border-border text-xs font-medium text-foreground hover:bg-foreground hover:text-background transition-all">Dashboard</button>
              ) : (
                <button onClick={() => navigate("/auth")} className="px-3 py-1.5 rounded-full border border-border text-xs font-medium text-foreground hover:bg-foreground hover:text-background transition-all">Sign in</button>
              )}
              <button onClick={() => navigate("/upload")} className="px-4 py-1.5 rounded-full bg-foreground text-background text-xs font-medium transition-all hover:bg-foreground/90 flex items-center gap-1.5">
                Get started <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="pt-32 sm:pt-40 pb-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="animate-fade-in-up">
              <p className="eyebrow mb-6">Explyn / Code Explainer</p>
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] max-w-4xl">
                Understand any codebase,{" "}
                <span className="text-muted-foreground">deeply.</span>
              </h1>
            </div>
            <div className="animate-fade-in-up-delay-1">
              <p className="text-base sm:text-lg text-muted-foreground max-w-xl mt-6 leading-relaxed">
                Upload your project and get a comprehensive breakdown of every class, function,
                import and data structure — explained, debugged, or turned into a lesson.
              </p>
            </div>
            <div className="animate-fade-in-up-delay-2 flex flex-wrap gap-3 mt-10">
              <button onClick={() => navigate("/upload")} className="btn-primary">
                Upload your code <ArrowUpRight className="ml-2 h-4 w-4" />
              </button>
              <button onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })} className="btn-ghost">
                How it works
              </button>
            </div>

            <div className="animate-fade-in-up-delay-3 mt-16 flex flex-wrap gap-4">
              {stats.map((s) => (
                <div key={s.label} className="glass-panel rounded-xl px-6 py-4 min-w-[140px]">
                  <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                  <p className="text-lg font-semibold">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Marquee */}
        <section className="py-8 border-y border-border/30 overflow-hidden">
          <div className="flex animate-marquee whitespace-nowrap">
            {[...languages, ...languages].map((lang, i) => (
              <span key={i} className="mx-3 px-4 py-1.5 rounded-full border border-border text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors cursor-default">
                {lang}
              </span>
            ))}
          </div>
        </section>

        {/* Feature bento */}
        <section className="py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="bento-grid">
              <div className="bento-span-2 glass-panel rounded-2xl p-8 sm:p-10">
                <div className="flex gap-2 mb-6">
                  <span className="signal-dot bg-red-400" />
                  <span className="signal-dot bg-yellow-400" />
                  <span className="signal-dot bg-green-400" />
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold mb-3">Three powerful modes</h3>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-md mb-6">
                  Explain code line-by-line, debug bugs with fix suggestions, or convert code into interactive learning lessons.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Explain", "Debug", "Learn", "Imports", "Classes", "Functions", "Patterns", "Architecture"].map((chip) => (
                    <span key={chip} className="px-3 py-1 rounded-full border border-border text-xs text-muted-foreground">{chip}</span>
                  ))}
                </div>
              </div>
              <div className="glass-panel rounded-2xl p-8 flex flex-col justify-between">
                <div>
                  <p className="eyebrow mb-4">Levels</p>
                  <h3 className="text-xl font-semibold mb-3">3 explanation depths</h3>
                </div>
                <div className="space-y-2 mt-4">
                  {["Beginner", "Intermediate", "Advanced"].map((l) => (
                    <div key={l} className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-border bg-background/50">
                      <div className="w-1.5 h-1.5 rounded-full bg-foreground/60" />
                      <span className="text-sm">{l}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pipeline */}
        <section id="how-it-works" className="py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <p className="eyebrow mb-4">Pipeline</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-12">
              A simple flow to <span className="text-muted-foreground">deep understanding</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {steps.map((step) => (
                <div key={step.num} className="step-card hover-lift">
                  <p className="text-sm text-muted-foreground font-mono mb-2">{step.num} —</p>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <p className="eyebrow mb-4">Ready?</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Upload your code and start learning</h2>
            <p className="text-muted-foreground mb-10 max-w-md mx-auto">Any language. Any framework. Three modes. Three levels. AI chat included.</p>
            <button onClick={() => navigate("/upload")} className="btn-primary text-base px-10 py-4">
              Get started <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </div>
        </section>

        <footer className="border-t border-border/30 py-10 px-6">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground tracking-tight">Explyn<span className="text-muted-foreground">.</span></span>
            <span>AI-powered code analysis</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
