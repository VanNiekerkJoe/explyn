import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Zap, Crown, Rocket, Building2 } from "lucide-react";

const tiers = [
  {
    name: "Free",
    icon: Zap,
    priceZAR: "R0",
    priceUSD: "$0",
    period: "/month",
    description: "Get started with AI-powered code explanations",
    credits: "50 credits/month",
    features: [
      "10–15 explanations/day",
      "Basic explain mode",
      "No history or saving",
      "Community support",
    ],
    cta: "Get started",
    popular: false,
    gradient: "",
  },
  {
    name: "Pro",
    icon: Crown,
    priceZAR: "R199",
    priceUSD: "$12",
    period: "/month",
    description: "For developers who want the full picture",
    credits: "500 credits/month",
    features: [
      "Unlimited explanations (fair use)",
      "Debug & Learn modes",
      "Explain Like I'm 5",
      "Snippet saving & history",
      "Faster responses",
      "Priority support",
    ],
    cta: "Upgrade to Pro",
    popular: true,
    gradient: "from-foreground/10 to-foreground/5",
  },
  {
    name: "Power",
    icon: Rocket,
    priceZAR: "R399",
    priceUSD: "$24",
    period: "/month",
    description: "For power users and serious devs",
    credits: "1,500 credits/month",
    features: [
      "Everything in Pro",
      "GitHub repo analysis",
      "Full codebase explanations",
      "\"Ask your codebase\" chat",
      "Project memory",
      "Advanced refactoring tips",
    ],
    cta: "Go Power",
    popular: false,
    gradient: "",
  },
  {
    name: "Team",
    icon: Building2,
    priceZAR: "R149/user",
    priceUSD: "$9/user",
    period: "/month",
    description: "For engineering teams",
    credits: "3,000 credits/team",
    features: [
      "Everything in Power",
      "Shared workspaces",
      "Team knowledge base",
      "Onboarding assistant",
      "Admin controls & API access",
      "Dedicated support",
    ],
    cta: "Contact us",
    popular: false,
    gradient: "",
  },
];

const Pricing = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <div className="noise" aria-hidden="true" />
      <div className="bg-orb orb-1" aria-hidden="true" />
      <div className="bg-orb orb-2" aria-hidden="true" />

      <div className="relative z-10">
        <nav className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <button onClick={() => navigate("/")} className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="font-bold text-foreground tracking-tight">Explyn<span className="text-muted-foreground">.</span></span>
            </button>
          </div>
        </nav>

        <section className="pt-32 pb-8 px-6 text-center">
          <p className="eyebrow mb-4">Pricing</p>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Start free. Upgrade when you need more power. Cancel anytime.
          </p>
        </section>

        <section className="pb-24 px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tiers.map((tier) => {
              const Icon = tier.icon;
              return (
                <div
                  key={tier.name}
                  className={`relative glass-panel rounded-2xl p-6 flex flex-col ${
                    tier.popular ? "border-foreground/30 ring-1 ring-foreground/10" : ""
                  }`}
                >
                  {tier.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-foreground text-background text-[10px] font-semibold uppercase tracking-wider">
                      Most popular
                    </span>
                  )}
                  <div className="mb-4">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center mb-3">
                      <Icon className="h-5 w-5 text-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold">{tier.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{tier.description}</p>
                  </div>

                  <div className="mb-1">
                    <span className="text-3xl font-bold">{tier.priceZAR}</span>
                    <span className="text-muted-foreground text-sm">{tier.period}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-5">
                    ≈ {tier.priceUSD}{tier.period} · {tier.credits}
                  </p>

                  <ul className="space-y-2.5 mb-6 flex-1">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 shrink-0 mt-0.5 text-foreground/60" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => navigate(tier.name === "Team" ? "/auth" : "/auth")}
                    className={tier.popular ? "btn-primary w-full text-sm" : "btn-ghost w-full text-sm"}
                  >
                    {tier.cta}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Extra credits */}
          <div className="max-w-2xl mx-auto mt-12 glass-panel rounded-2xl p-6 text-center">
            <p className="eyebrow mb-2">Need more?</p>
            <h3 className="text-lg font-semibold mb-1">Top-up credits</h3>
            <p className="text-sm text-muted-foreground">
              Exceeded your plan's credits? Purchase additional credits at <span className="text-foreground">R20 / 100 credits</span>{" "}
              <span className="text-muted-foreground">(≈ $1.20 / 100 credits)</span>. Available on any paid plan.
            </p>
          </div>
        </section>

        <footer className="border-t border-border/30 py-10 px-6">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground tracking-tight">explyn</span>
            <span>AI-powered code analysis</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Pricing;
