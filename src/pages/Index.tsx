import { useNavigate } from "react-router-dom";
import { ArrowRight, Code2, GraduationCap, Dumbbell, MessageCircle, Sparkles, BookOpen } from "lucide-react";
import { COURSES } from "@/data/courses";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import IntroSplash, { shouldShowIntro } from "@/components/IntroSplash";

const hubCards = [
  {
    id: "console",
    icon: Code2,
    title: "Explyn Console",
    desc: "A terminal-style AI chat. Type /model to switch models, /skills to choose focus, /level to set depth.",
    cta: "Open console",
    route: "/console",
    accent: "from-slate-500/15 to-transparent",
  },
  {
    id: "courses",
    icon: BookOpen,
    title: "Courses",
    desc: "Structured, multi-lesson courses across Python, JavaScript, TypeScript, SQL, Web, and more — taught at your level.",
    cta: "Browse courses",
    route: "/courses",
    accent: "from-pink-500/15 to-transparent",
  },
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
    title: "Teach me a topic",
    desc: "Want a one-off lesson? Type any topic and get a structured walkthrough with examples and practice.",
    cta: "Start a lesson",
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

        {/* Featured courses */}
        <section className="pb-16 sm:pb-24 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-end justify-between mb-5 sm:mb-6">
              <div>
                <p className="eyebrow mb-1.5">Classroom in a box</p>
                <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Featured courses</h2>
              </div>
              <button onClick={() => navigate("/courses")} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {COURSES.slice(0, 6).map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/courses/${c.id}`)}
                  style={{ animationDelay: `${i * 50}ms` }}
                  className="animate-fade-in-up group relative overflow-hidden glass-panel rounded-2xl p-4 sm:p-5 text-left hover-lift transition-all"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${c.color} opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none`} />
                  <div className="relative">
                    <div className="text-2xl mb-3">{c.emoji}</div>
                    <p className="eyebrow mb-1 text-[10px]">{c.language} · {c.level}</p>
                    <h3 className="text-sm sm:text-base font-semibold tracking-tight mb-1 leading-tight">{c.title}</h3>
                    <p className="text-[11px] sm:text-xs text-muted-foreground leading-snug line-clamp-2">{c.tagline}</p>
                    <p className="text-[10px] text-muted-foreground mt-3">{c.lessons.length} lessons</p>
                  </div>
                </button>
              ))}
            </div>
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
