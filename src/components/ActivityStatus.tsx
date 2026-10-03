import { useEffect, useState } from "react";
import ExplynMascot from "@/components/ExplynMascot";

const DEFAULT_WORDS = ["CONTEMPLATING", "TESTING", "TRACKING", "ABSORBING"];

interface ActivityStatusProps {
  words?: string[];
  compact?: boolean;
  showMascot?: boolean;
  className?: string;
}

const ActivityStatus = ({
  words = DEFAULT_WORDS,
  compact = false,
  showMascot = false,
  className = "",
}: ActivityStatusProps) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (words.length < 2) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % words.length), 1350);
    return () => window.clearInterval(timer);
  }, [words]);

  const word = words[index] ?? "WORKING";

  return (
    <div className={`inline-flex items-center gap-3 font-mono text-muted-foreground ${className}`} role="status" aria-live="polite">
      {showMascot && <ExplynMascot active className={compact ? "h-9 w-9" : "h-14 w-14"} />}
      <span className="inline-flex items-center gap-2 text-[10px] uppercase sm:text-xs">
        <span className="activity-bracket" aria-hidden="true">[</span>
        <span key={word} className="activity-word">{word}</span>
        <span className="activity-dots" aria-hidden="true"><i /><i /><i /></span>
        <span className="activity-bracket" aria-hidden="true">]</span>
      </span>
    </div>
  );
};

export default ActivityStatus;