import { useNavigate } from "react-router-dom";
import { ArrowRight, Code2, GraduationCap, Dumbbell, MessageCircle, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import IntroSplash, { shouldShowIntro } from "@/components/IntroSplash";

const hubCards = [
  {
    id: "analyse",
    icon: Code2,
    title: "Analyse my code",
    desc: "Upload a file, snippet, or whole project. Get a structured breakdown of every class, function, and pattern.",
    cta: "Upload code",
    route: "/upload",
    accent: "from-blue-500/15 to-transparent",
  },
  {
    id: "learn",
    icon: GraduationCap,
    title: "Teach me coding",
    desc: "Pick a track or any topic. Get a structured lesson with examples, walkthrough, and practice tasks.",
    cta: "Start learning",
    route: "/learn",
    accent: "from-emerald-500/15 to-transparent",
  },
  {
    id: "practice",
    icon: Dumbbell,
    title: "Practice challenges",
    desc: "Bite-sized coding challenges with hints. Submit your solution, get instant AI feedback.",
    cta: "Try a challenge",
    route: "/practice",
    accent: "from-orange-500/15 to-transparent",
  },
  {
    id: "tutor",
    icon: MessageCircle,
    title: "Ask a tutor",
    desc: "Stuck on something? Chat with an AI tutor that explains concepts at your level — beginner to advanced.",
    cta: "Open chat",
    route: "/tutor",
    accent: "from-purple-500/15 to-transparent",
  },
];

const Index = () => {
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState(false);
  const [showIntro, setShowIntro] = useState(() => shouldShowIntro());
  const [introDone, setIntroDone] = useState(!shouldShowIntro());

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setLoggedIn(!!session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {showIntro && !introDone && (
        <IntroSplash onComplete={() => {
          setShowIntro(false);
          setIntroDone(true);
        }} />
      )}
      <div className="noise" aria-hidden="true" />
      <div className="bg-orb orb-1" aria-hidden="true" />
      <div className="bg-orb orb-2" aria-hidden="true" />
      <div className="bg-orb orb-3" aria-hidden="true" />

      <div className="relative z-10">
        <nav className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <span className="text-base font-bold tracking-tight">
              Explyn<span className="text-muted-foreground">.</span>
            </span>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button onClick={() => navigate("/pricing")} className="text-xs text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
                Pricing
              </button>
              {loggedIn ? (
                <button onClick={() => navigate("/dashboard")} className="px-2.5 sm:px-3 py-1.5 rounded-full border border-border text-[11px] sm:text-xs font-medium hover:bg-foreground hover:text-background transition-all">
                  Dashboard
                </button>
              ) : (
                <button onClick={() => navigate("/auth")} className="px-2.5 sm:px-3 py-1.5 rounded-full border border-border text-[11px] sm:text-xs font-medium hover:bg-foreground hover:text-background transition-all">
                  Sign in
                </button>
              )}
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="pt-24 sm:pt-32 pb-10 sm:pb-14 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="animate-fade-in-up flex items-center gap-2 mb-5">
              <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="eyebrow">Explyn / Learning Hub</p>
            </div>
            <h1 className="animate-fade-in-up text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] max-w-3xl">
              Learn to code,{" "}
              <span className="text-muted-foreground">your way.</span>
            </h1>
            <p className="animate-fade-in-up-delay-1 text-base sm:text-lg text-muted-foreground max-w-xl mt-5 leading-relaxed">
              A hub for students. Analyse real code, follow guided lessons, practice with challenges,
              or just ask a tutor anything — at your level.
            </p>
          </div>
        </section>

        {/* Hub grid */}
        <section className="pb-16 sm:pb-24 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {hubCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.id}
                  onClick={() => navigate(card.route)}
                  style={{ animationDelay: `${i * 80}ms` }}
                  className={`animate-fade-in-up group relative overflow-hidden glass-panel rounded-2xl p-6 sm:p-8 text-left hover-lift transition-all`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none`} />
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl border border-border bg-background/60 flex items-center justify-center mb-5">
                      <Icon className="h-4.5 w-4.5" strokeWidth={1.6} />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold tracking-tight mb-2">
                      {card.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                      {card.desc}
                    </p>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground/80 group-hover:text-foreground transition-colors">
                      {card.cta}
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/30 py-8 px-6">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground tracking-tight">
              Explyn<span className="text-muted-foreground">.</span>
            </span>
            <span>Learn code. Understand code. Write better code.</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
