import { useState } from "react";

const sampleCode = `class UserService {
  private db: Database;
  private cache: Map<string, User>;

  constructor(database: Database) {
    this.db = database;
    this.cache = new Map();
  }

  async getUser(id: string): Promise<User> {
    if (this.cache.has(id)) {
      return this.cache.get(id)!;
    }
    const user = await this.db.query('users', id);
    this.cache.set(id, user);
    return user;
  }

  async updateUser(id: string, data: Partial<User>) {
    await this.db.update('users', id, data);
    this.cache.delete(id);
  }
}`;

interface CodeSegment {
  text: string;
  type: "class" | "property" | "method" | "keyword" | "string" | "comment" | "plain";
  explanation?: {
    what: string;
    does: string;
    why: string;
  };
}

const segments: CodeSegment[] = [
  {
    text: "class UserService",
    type: "class",
    explanation: {
      what: "A class definition",
      does: "Creates a blueprint for managing users",
      why: "Organizes user-related logic into one reusable module",
    },
  },
  { text: " {\n", type: "plain" },
  {
    text: "  private db: Database;",
    type: "property",
    explanation: {
      what: "A private property",
      does: "Stores the database connection for this service",
      why: "Keeps the database reference hidden from outside code",
    },
  },
  { text: "\n", type: "plain" },
  {
    text: "  private cache: Map<string, User>;",
    type: "property",
    explanation: {
      what: "An in-memory cache",
      does: "Stores recently fetched users to avoid repeated DB queries",
      why: "Improves performance by reducing database calls",
    },
  },
  { text: "\n\n", type: "plain" },
  {
    text: "  constructor(database: Database)",
    type: "method",
    explanation: {
      what: "The constructor method",
      does: "Initializes the service with a database and empty cache",
      why: "Sets up the service so it's ready to handle user requests",
    },
  },
  { text: " {\n    this.db = database;\n    this.cache = new Map();\n  }\n\n", type: "plain" },
  {
    text: "  async getUser(id: string): Promise<User>",
    type: "method",
    explanation: {
      what: "An async method",
      does: "Fetches a user by ID, checking cache first then database",
      why: "Provides fast user lookups with automatic caching",
    },
  },
  { text: " {\n    if (this.cache.has(id)) {\n      return this.cache.get(id)!;\n    }\n    const user = await this.db.query(", type: "plain" },
  { text: "'users'", type: "string" },
  { text: ", id);\n    this.cache.set(id, user);\n    return user;\n  }\n\n", type: "plain" },
  {
    text: "  async updateUser(id: string, data: Partial<User>)",
    type: "method",
    explanation: {
      what: "An async update method",
      does: "Updates user data in the database and clears the cache",
      why: "Ensures data consistency by invalidating stale cache entries",
    },
  },
  { text: " {\n    await this.db.update(", type: "plain" },
  { text: "'users'", type: "string" },
  { text: ", id, data);\n    this.cache.delete(id);\n  }\n}", type: "plain" },
];

interface OnboardingCodeDemoProps {
  onInteract: () => void;
  highlightEnabled: boolean;
}

const typeColors: Record<string, string> = {
  class: "text-foreground font-bold",
  property: "text-muted-foreground",
  method: "text-foreground",
  keyword: "text-muted-foreground",
  string: "text-muted-foreground/80",
  comment: "text-muted-foreground/50 italic",
  plain: "text-muted-foreground/70",
};

const OnboardingCodeDemo = ({ onInteract, highlightEnabled }: OnboardingCodeDemoProps) => {
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null);

  const handleClick = (index: number, segment: CodeSegment) => {
    if (!segment.explanation) return;
    setSelectedSegment(index === selectedSegment ? null : index);
    onInteract();
  };

  return (
    <div className="rounded-xl border border-border bg-background/80 overflow-hidden">
      {/* Code window chrome */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-card/50">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-destructive/40" />
          <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20" />
          <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20" />
        </div>
        <span className="text-[10px] text-muted-foreground font-mono ml-2">UserService.ts</span>
      </div>

      {/* Code body */}
      <div className="p-4 overflow-x-auto">
        <pre className="text-xs sm:text-sm font-mono leading-relaxed whitespace-pre-wrap">
          {segments.map((seg, i) => {
            const isClickable = !!seg.explanation;
            const isSelected = selectedSegment === i;
            return (
              <span key={i}>
                <span
                  onClick={() => handleClick(i, seg)}
                  className={`${typeColors[seg.type]} transition-all duration-200 ${
                    isClickable
                      ? `cursor-pointer rounded px-0.5 -mx-0.5 ${
                          highlightEnabled
                            ? "hover:bg-foreground/10 ring-1 ring-foreground/10"
                            : ""
                        } ${isSelected ? "bg-foreground/15 ring-1 ring-foreground/20" : ""}`
                      : ""
                  }`}
                >
                  {seg.text}
                </span>
                {/* Inline explanation */}
                {isSelected && seg.explanation && (
                  <span className="block ml-4 my-2 pl-3 border-l-2 border-foreground/20 text-xs space-y-1 animate-fade-in">
                    <span className="block text-foreground font-medium">
                      📌 {seg.explanation.what}
                    </span>
                    <span className="block text-muted-foreground">
                      → {seg.explanation.does}
                    </span>
                    <span className="block text-muted-foreground/70 italic">
                      💡 {seg.explanation.why}
                    </span>
                  </span>
                )}
              </span>
            );
          })}
        </pre>
      </div>
    </div>
  );
};

export default OnboardingCodeDemo;
