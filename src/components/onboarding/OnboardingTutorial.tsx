import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SpeechBubble from "./SpeechBubble";
import { OptionButton, BubbleAvatar, ContinueButton } from "./OnboardingWidgets";
import OnboardingCodeDemo from "./OnboardingCodeDemo";

type SkillLevel = "beginner" | "intermediate" | "advanced";

interface OnboardingTutorialProps {
  onComplete: (skillLevel: SkillLevel) => void;
}

const ONBOARDING_KEY = "explyn_onboarding_done";

export function shouldShowOnboarding(): boolean {
  return !localStorage.getItem(ONBOARDING_KEY);
}

const OnboardingTutorial = ({ onComplete }: OnboardingTutorialProps) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [skillLevel, setSkillLevel] = useState<SkillLevel | null>(null);
  const [choice, setChoice] = useState<"sample" | "paste" | null>(null);
  const [interacted, setInteracted] = useState(false);
  const [interactCount, setInteractCount] = useState(0);
  const [exiting, setExiting] = useState(false);

  // Lock body scroll while tutorial is active
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const finish = useCallback(() => {
    setExiting(true);
    localStorage.setItem(ONBOARDING_KEY, "true");
    setTimeout(() => onComplete(skillLevel || "beginner"), 600);
  }, [onComplete, skillLevel]);

  const next = () => setStep((s) => s + 1);

  const handleInteract = () => {
    if (!interacted) setInteracted(true);
    setInteractCount((c) => c + 1);
  };

  const skillDescriptions: Record<SkillLevel, string> = {
    beginner: "Explyn takes any code and explains it like a patient teacher — breaking down every class, function, and pattern into simple language you can understand.",
    intermediate: "Explyn analyzes your code's architecture — imports, class hierarchies, design patterns, and data flow — giving you technical explanations with clear context.",
    advanced: "Explyn maps your codebase's dependency graph, architectural patterns, and implementation trade-offs — focusing on efficiency, scalability, and design decisions.",
  };

  return (
    <div
      className={`fixed inset-0 z-[9000] flex flex-col transition-all duration-600 ${
        exiting ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Dimmed background */}
      <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" />

      {/* Main content area — flex centered, scrollable */}
      <div className="relative z-10 flex-1 flex items-center justify-center overflow-y-auto px-4 py-12">
        {/* Step 0: Welcome */}
        {step === 0 && (
          <SpeechBubble animate>
            <BubbleAvatar />
            <p className="text-foreground text-sm leading-relaxed mb-1">
              Welcome to Explyn 👋
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              I'm going to help you understand your code like never before. Let's get you set up in under 2 minutes.
            </p>
            <ContinueButton onClick={next} label="Let's go" />
          </SpeechBubble>
        )}

        {/* Step 1: Skill level */}
        {step === 1 && (
          <SpeechBubble animate>
            <BubbleAvatar />
            <p className="text-foreground text-sm leading-relaxed mb-4">
              What's your experience level with programming?
            </p>
            <div className="space-y-2">
              <OptionButton
                icon="🌱"
                label="Beginner"
                description="Just starting out"
                selected={skillLevel === "beginner"}
                onClick={() => setSkillLevel("beginner")}
              />
              <OptionButton
                icon="⚡"
                label="Intermediate"
                description="Comfortable with code"
                selected={skillLevel === "intermediate"}
                onClick={() => setSkillLevel("intermediate")}
              />
              <OptionButton
                icon="🚀"
                label="Advanced"
                description="Professional developer"
                selected={skillLevel === "advanced"}
                onClick={() => setSkillLevel("advanced")}
              />
            </div>
            {skillLevel && <ContinueButton onClick={next} />}
          </SpeechBubble>
        )}

        {/* Step 2: Personalized explanation */}
        {step === 2 && skillLevel && (
          <SpeechBubble animate>
            <BubbleAvatar />
            <p className="text-foreground text-sm leading-relaxed mb-2">
              Perfect! Here's what Explyn does for you:
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {skillDescriptions[skillLevel]}
            </p>
            <ContinueButton onClick={next} label="Show me" />
          </SpeechBubble>
        )}

        {/* Step 3: First interaction choice */}
        {step === 3 && (
          <SpeechBubble animate>
            <BubbleAvatar />
            <p className="text-foreground text-sm leading-relaxed mb-4">
              Would you like to try your first code explanation?
            </p>
            <div className="space-y-2">
              <OptionButton
                icon="🧪"
                label="Try a sample"
                description="Explore a pre-loaded code example"
                selected={choice === "sample"}
                onClick={() => { setChoice("sample"); }}
              />
              <OptionButton
                icon="📋"
                label="Upload my own code"
                description="Jump straight into your project"
                selected={choice === "paste"}
                onClick={() => { setChoice("paste"); }}
              />
            </div>
            {choice && (
              <ContinueButton
                onClick={() => {
                  if (choice === "paste") {
                    setStep(7);
                  } else {
                    next();
                  }
                }}
              />
            )}
          </SpeechBubble>
        )}

        {/* Step 4: Interactive code demo */}
        {step === 4 && (
          <div className="flex flex-col items-center w-full max-w-[420px] gap-3 max-h-[90vh] overflow-y-auto">
            <div className="w-full">
              <div className="rounded-2xl border border-border bg-card p-4 shadow-xl animate-fade-in-up">
                <BubbleAvatar />
                <p className="text-foreground text-sm leading-relaxed">
                  {!interacted
                    ? "This is a small code snippet. Tap on any highlighted element to see what it does 👇"
                    : interactCount < 3
                    ? "Nice! Try tapping another part of the code to explore more."
                    : "You're getting it! Let's move on."}
                </p>
                {interactCount >= 2 && (
                  <ContinueButton onClick={next} label="Continue" />
                )}
              </div>
            </div>
            <div className="w-full animate-fade-in-up" style={{ animationDelay: "200ms" }}>
              <OnboardingCodeDemo
                onInteract={handleInteract}
                highlightEnabled={true}
              />
            </div>
          </div>
        )}

        {/* Step 5: Code tree concept */}
        {step === 5 && (
          <SpeechBubble animate>
            <BubbleAvatar />
            <p className="text-foreground text-sm leading-relaxed mb-3">
              Explyn also turns your code into a <span className="font-semibold">structure map</span>.
            </p>
            <div className="rounded-xl border border-border bg-background/80 p-4 font-mono text-xs text-muted-foreground space-y-1 mb-3">
              <p className="text-foreground font-semibold">📁 Project</p>
              <p className="ml-4">├── 📄 UserService.ts</p>
              <p className="ml-8">├── <span className="text-foreground">class</span> UserService</p>
              <p className="ml-12">├── <span className="text-foreground">getUser()</span></p>
              <p className="ml-12">├── <span className="text-foreground">updateUser()</span></p>
              <p className="ml-12">└── <span className="text-muted-foreground/70">cache logic</span></p>
              <p className="ml-4">└── 📄 Database.ts</p>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Every file, class, and method — mapped and explained. You can navigate your entire codebase visually.
            </p>
            <ContinueButton onClick={next} />
          </SpeechBubble>
        )}

        {/* Step 6: Upload feature intro */}
        {step === 6 && (
          <SpeechBubble animate>
            <BubbleAvatar />
            <p className="text-foreground text-sm leading-relaxed mb-3">
              Would you like to see how your own projects look like this?
            </p>
            <div className="space-y-2 mb-3">
              <OptionButton
                icon="📂"
                label="Upload a project"
                description="Via GitHub, ZIP, or folder upload"
                onClick={() => setStep(7)}
              />
              <OptionButton
                icon="⏭️"
                label="Not yet — show me more"
                description="Continue the tour first"
                onClick={next}
              />
            </div>
          </SpeechBubble>
        )}

        {/* Step 7: Value proposition + upload */}
        {step === 7 && (
          <SpeechBubble animate>
            <BubbleAvatar />
            <p className="text-foreground text-sm leading-relaxed mb-3">
              Once your code is uploaded, Explyn will:
            </p>
            <div className="space-y-2 mb-4">
              {[
                { icon: "🗺️", text: "Map your entire project structure" },
                { icon: "📖", text: "Explain every file and function" },
                { icon: "💬", text: "Let you ask questions like a tutor" },
                { icon: "🐛", text: "Help you debug issues instantly" },
              ].map((item) => (
                <div key={item.text} className="flex items-start gap-2.5 text-sm">
                  <span>{item.icon}</span>
                  <span className="text-muted-foreground">{item.text}</span>
                </div>
              ))}
            </div>
            <ContinueButton onClick={next} label="I'm ready" />
          </SpeechBubble>
        )}

        {/* Step 8: Completion */}
        {step === 8 && (
          <SpeechBubble animate>
            <BubbleAvatar />
            <p className="text-foreground text-sm leading-relaxed mb-1">
              You're all set! 🚀
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              Explyn is now your AI code companion. Start by uploading your first project or exploring the dashboard.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => {
                  finish();
                  setTimeout(() => navigate("/upload"), 700);
                }}
                className="w-full py-2.5 rounded-xl bg-foreground text-background text-sm font-medium transition-all duration-200 hover:bg-foreground/90 active:scale-[0.98]"
              >
                Upload my code →
              </button>
              <button
                onClick={finish}
                className="w-full py-2.5 rounded-xl border border-border text-foreground text-sm font-medium transition-all duration-200 hover:bg-foreground/5"
              >
                Go to dashboard
              </button>
            </div>
          </SpeechBubble>
        )}
      </div>

      {/* Skip button */}
      {step < 8 && (
        <button
          onClick={finish}
          className="absolute bottom-6 right-6 text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors duration-200 z-[70]"
        >
          Skip tutorial →
        </button>
      )}

      {/* Step indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-[70]">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              i === step ? "bg-foreground w-4" : i < step ? "bg-foreground/40" : "bg-foreground/15"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default OnboardingTutorial;
