import { useState, useRef, useCallback, useEffect } from "react";
import { X, Loader2, Lightbulb, Zap, HelpCircle, ChevronDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import ActivityStatus from "@/components/ActivityStatus";

interface ExplainPopupData {
  whatThisIs: string;
  whatItDoesHere: string;
  whyItsUsed: string;
  example: string | null;
  proInsight: string | null;
}

interface InteractiveCodeViewerProps {
  code: string;
  language: string;
  fileName?: string;
  level: string;
  onAskFollowUp?: (question: string) => void;
}

/** Expand a clicked token index to the full logical expression boundaries */
function expandToExpression(line: string, clickOffset: number): { start: number; end: number; text: string } {
  const leftBoundaries = new Set([';', '{', ',', '(', '[', '=', ' ', '\t']);
  const rightBoundaries = new Set([';', '{', '}', ',', ')', ']']);

  // Find the start: walk left until we hit a boundary or start of line
  let start = clickOffset;
  while (start > 0) {
    const ch = line[start - 1];
    if (leftBoundaries.has(ch)) break;
    start--;
  }

  // Find the end: walk right, respecting balanced parens/brackets
  let end = clickOffset;
  let parenDepth = 0;
  let bracketDepth = 0;
  let inString: string | null = null;

  // First scan from start to properly track nesting
  for (let i = start; i < line.length; i++) {
    const ch = line[i];

    // Handle string literals
    if (inString) {
      if (ch === inString && line[i - 1] !== '\\') inString = null;
      if (i >= clickOffset) end = i + 1;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inString = ch;
      if (i >= clickOffset) end = i + 1;
      continue;
    }

    if (ch === '(') { parenDepth++; if (i >= clickOffset) end = i + 1; continue; }
    if (ch === ')') {
      parenDepth--;
      if (i >= clickOffset) end = i + 1;
      if (parenDepth <= 0 && i >= clickOffset) { end = i + 1; break; }
      continue;
    }
    if (ch === '[') { bracketDepth++; if (i >= clickOffset) end = i + 1; continue; }
    if (ch === ']') {
      bracketDepth--;
      if (i >= clickOffset) end = i + 1;
      if (bracketDepth <= 0 && i >= clickOffset) { end = i + 1; break; }
      continue;
    }

    if (parenDepth > 0 || bracketDepth > 0) {
      if (i >= clickOffset) end = i + 1;
      continue;
    }

    if (i >= clickOffset) {
      if (rightBoundaries.has(ch)) break;
      end = i + 1;
    }
  }

  const text = line.slice(start, end).trim();
  return { start, end, text };
}

const InteractiveCodeViewer = ({ code, language, fileName, level, onAskFollowUp }: InteractiveCodeViewerProps) => {
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [selectedToken, setSelectedToken] = useState<string>("");
  const [selectedRange, setSelectedRange] = useState<{ line: number; start: number; end: number } | null>(null);
  const [explanation, setExplanation] = useState<ExplainPopupData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const lines = code.split("\n");

  // Auto-position popup within viewport
  useEffect(() => {
    if (!popupRef.current || !containerRef.current) return;
    const popup = popupRef.current;
    const rect = popup.getBoundingClientRect();
    // If popup goes above viewport, flip below
    if (rect.top < 8) {
      popup.style.transform = "translateY(0)";
      popup.style.top = `${(selectedRange ? (selectedRange.line + 1) * 24 + 16 : 0)}px`;
    }
  }, [loading, explanation, selectedRange]);

  const handleTokenClick = useCallback(async (lineIndex: number, charOffset: number, event: React.MouseEvent) => {
    const line = lines[lineIndex];
    const { text, start, end } = expandToExpression(line, charOffset);

    if (!text || text.length < 2) return;

    setSelectedLine(lineIndex);
    setSelectedToken(text);
    setSelectedRange({ line: lineIndex, start, end });
    setExplanation(null);
    setLoading(true);
    setExpanded(false);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/explain-element`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            selectedText: text,
            lineContent: line,
            lineNumber: lineIndex + 1,
            fullCode: code,
            fileName,
            language,
            level,
          }),
        }
      );
      if (!response.ok) throw new Error("Failed to explain");
      const data = await response.json();
      setExplanation(data);
    } catch {
      setExplanation({
        whatThisIs: "Could not generate explanation. Try again.",
        whatItDoesHere: "",
        whyItsUsed: "",
        example: null,
        proInsight: null,
      });
    } finally {
      setLoading(false);
    }
  }, [code, fileName, language, level, lines]);

  const closePopup = () => {
    setSelectedLine(null);
    setSelectedToken("");
    setSelectedRange(null);
    setExplanation(null);
    setExpanded(false);
  };

  // Render a line with clickable characters, highlighting the selected expression
  const renderLine = (line: string, lineIndex: number) => {
    const isSelectedLine = selectedRange && selectedRange.line === lineIndex;
    const chars: React.ReactNode[] = [];
    let i = 0;

    while (i < line.length) {
      const ch = line[i];
      const isHighlighted = isSelectedLine && i >= selectedRange.start && i < selectedRange.end;
      const isWhitespace = ch === ' ' || ch === '\t';

      if (isWhitespace) {
        chars.push(<span key={i} className="text-foreground/50">{ch}</span>);
        i++;
        continue;
      }

      // Group consecutive non-whitespace chars for better click targets
      let wordEnd = i + 1;
      while (wordEnd < line.length && line[wordEnd] !== ' ' && line[wordEnd] !== '\t') {
        wordEnd++;
      }
      const word = line.slice(i, wordEnd);
      const wordStart = i;

      const isAnyHighlighted = isSelectedLine &&
        wordStart < selectedRange.end && wordEnd > selectedRange.start;

      chars.push(
        <span
          key={i}
          onClick={(e) => handleTokenClick(lineIndex, wordStart, e)}
          className={`cursor-pointer transition-colors rounded-sm px-px ${
            isAnyHighlighted
              ? "bg-primary/20 text-primary ring-1 ring-primary/30"
              : "hover:bg-foreground/10 text-foreground/80 hover:text-foreground"
          }`}
          title="Click to explain"
        >
          {word}
        </span>
      );
      i = wordEnd;
    }

    return chars;
  };

  const hasMoreContent = explanation && (explanation.example || explanation.proInsight);

  return (
    <div className="relative" ref={containerRef}>
      {/* Explanation popup - positioned relative to container */}
      {(loading || explanation) && selectedRange && (
        <div
          ref={popupRef}
          className="absolute z-50 left-2 right-2 sm:left-10 sm:right-auto sm:w-[360px]"
          style={{
            top: `${selectedRange.line * 24}px`,
            transform: "translateY(-100%)",
          }}
        >
          <div className="glass-panel rounded-xl border border-border/60 shadow-2xl overflow-hidden mb-2 animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/40 bg-foreground/[0.03]">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Lightbulb className="h-3.5 w-3.5 text-primary shrink-0" />
                <code className="text-[11px] font-mono text-foreground truncate max-w-[240px]">{selectedToken}</code>
              </div>
              <button onClick={closePopup} className="text-muted-foreground hover:text-foreground transition-colors shrink-0 ml-2">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center gap-2 px-4 py-6 justify-center">
                <ActivityStatus compact words={["TRACKING", "PARSING", "ABSORBING", "EXPLAINING"]} />
              </div>
            ) : explanation ? (
              <ScrollArea className={expanded ? "h-[70vh]" : "h-[40vh] sm:h-[45vh]"}>
                <div className="p-3 space-y-2.5">
                  {/* What This Is */}
                  {explanation.whatThisIs && (
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">What this is</span>
                      <p className="text-xs text-foreground/90 leading-relaxed mt-0.5">{explanation.whatThisIs}</p>
                    </div>
                  )}

                  {/* What It Does Here */}
                  {explanation.whatItDoesHere && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Zap className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">In this code</span>
                      </div>
                      <p className="text-xs text-foreground/90 leading-relaxed">{explanation.whatItDoesHere}</p>
                    </div>
                  )}

                  {/* Why It's Used */}
                  {explanation.whyItsUsed && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <HelpCircle className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Why it's used</span>
                      </div>
                      <p className="text-xs text-foreground/90 leading-relaxed">{explanation.whyItsUsed}</p>
                    </div>
                  )}

                  {/* Expandable section */}
                  {!expanded && hasMoreContent && (
                    <button
                      onClick={() => setExpanded(true)}
                      className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 transition-colors w-full justify-center py-1"
                    >
                      <ChevronDown className="h-3 w-3" />
                      Show more
                    </button>
                  )}

                  {expanded && (
                    <>
                      {/* Example */}
                      {explanation.example && (
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Example</span>
                          <pre className="mt-1 p-2 rounded-lg bg-muted/50 text-[11px] font-mono text-foreground/80 overflow-x-auto whitespace-pre">
                            {explanation.example}
                          </pre>
                        </div>
                      )}

                      {/* Pro Insight */}
                      {explanation.proInsight && (
                        <div className="pt-2 border-t border-border/40">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">💡 Pro insight</span>
                          <p className="text-xs text-foreground/80 leading-relaxed mt-1">{explanation.proInsight}</p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Actions */}
                  {onAskFollowUp && (
                    <div className="pt-2 border-t border-border/40 flex gap-2 flex-wrap">
                      <button
                        onClick={() => { onAskFollowUp(`Explain "${selectedToken}" in more depth`); closePopup(); }}
                        className="text-[10px] px-2.5 py-1.5 rounded-full border border-border hover:border-foreground/30 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Explain deeper
                      </button>
                      <button
                        onClick={() => { onAskFollowUp(`What are alternatives to "${selectedToken}"?`); closePopup(); }}
                        className="text-[10px] px-2.5 py-1.5 rounded-full border border-border hover:border-foreground/30 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Alternatives?
                      </button>
                    </div>
                  )}
                </div>
              </ScrollArea>
            ) : null}
          </div>
        </div>
      )}

      {/* Code block */}
      <div className="rounded-xl overflow-hidden bg-[hsl(0,0%,8%)] border border-border/30">
        {fileName && (
          <div className="px-4 py-2 border-b border-border/20 flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-mono">{fileName}</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] text-muted-foreground border border-border/40">{language}</span>
          </div>
        )}
        <div className="overflow-x-auto">
          <pre className="p-4 text-sm leading-6 font-mono">
            {lines.map((line, lineIndex) => (
              <div
                key={lineIndex}
                className={`flex hover:bg-foreground/[0.04] transition-colors ${
                  selectedLine === lineIndex ? "bg-foreground/[0.08]" : ""
                }`}
              >
                <span className="select-none w-10 shrink-0 text-right pr-4 text-muted-foreground/40 text-xs leading-6">
                  {lineIndex + 1}
                </span>
                <span className="flex-1">
                  {renderLine(line, lineIndex)}
                </span>
              </div>
            ))}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default InteractiveCodeViewer;
