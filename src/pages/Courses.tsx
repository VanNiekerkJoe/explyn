import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, Clock } from "lucide-react";
import { COURSES } from "@/data/courses";

const Courses = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <div className="noise" aria-hidden="true" />
      <div className="bg-orb orb-1" aria-hidden="true" />
      <div className="bg-orb orb-2" aria-hidden="true" />

      <div className="relative z-10">
        <nav className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Hub</span>
            </button>
            <span className="text-sm font-bold tracking-tight">Courses</span>
            <div className="w-12" />
          </div>
        </nav>

        <section className="pt-20 sm:pt-24 pb-8 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="eyebrow">Classroom in a box</p>
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.05]">
              Structured courses,{" "}
              <span className="text-muted-foreground">built for students.</span>
            </h1>
            <p className="text-base text-muted-foreground max-w-xl mt-4 leading-relaxed">
              Pick a language, follow the lessons in order, and get explanations adapted to your level.
            </p>
          </div>
        </section>

        <section className="pb-20 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {COURSES.map((c, i) => {
              const totalMin = c.lessons.reduce((sum, l) => {
                const m = parseInt(l.duration);
                return sum + (isNaN(m) ? 0 : m);
              }, 0);
              return (
                <button
                  key={c.id}
                  onClick={() => navigate(`/courses/${c.id}`)}
                  style={{ animationDelay: `${i * 60}ms` }}
                  className="animate-fade-in-up group relative overflow-hidden glass-panel rounded-2xl p-6 text-left hover-lift transition-all"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${c.color} opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none`} />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-11 h-11 rounded-xl border border-border bg-background/60 flex items-center justify-center text-xl">
                        {c.emoji}
                      </div>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground border border-border rounded-full px-2 py-0.5">
                        {c.level}
                      </span>
                    </div>
                    <p className="eyebrow mb-1.5">{c.language}</p>
                    <h3 className="text-lg font-semibold tracking-tight mb-1.5">{c.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-5 line-clamp-2">
                      {c.tagline}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <BookOpen className="h-3 w-3" /> {c.lessons.length} lessons
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-3 w-3" /> ~{totalMin} min
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Courses;
