export type CourseLesson = {
  id: string;
  title: string;
  topic: string; // prompt sent to AI
  duration: string;
};

export type Course = {
  id: string;
  language: string;
  title: string;
  tagline: string;
  description: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  color: string; // tailwind gradient classes
  emoji: string;
  lessons: CourseLesson[];
};

export const COURSES: Course[] = [
  {
    id: "python-101",
    language: "Python",
    title: "Python 101",
    tagline: "From zero to writing real Python.",
    description:
      "A complete intro to Python. Learn the syntax, build real little programs, and finish comfortable reading any beginner Python codebase.",
    level: "Beginner",
    color: "from-blue-500/20 to-cyan-500/10",
    emoji: "🐍",
    lessons: [
      { id: "py-1", title: "What is Python & how to run it", topic: "What is Python, where it's used, and how to run a Python script", duration: "8 min" },
      { id: "py-2", title: "Variables, numbers & strings", topic: "Python variables, numbers, strings, f-strings and basic types", duration: "10 min" },
      { id: "py-3", title: "If statements & booleans", topic: "Python if/elif/else, comparison operators, and boolean logic", duration: "10 min" },
      { id: "py-4", title: "Loops: for & while", topic: "Python for loops, while loops, range(), break and continue", duration: "12 min" },
      { id: "py-5", title: "Lists, tuples & dictionaries", topic: "Python lists, tuples, dictionaries — when to use each, with examples", duration: "14 min" },
      { id: "py-6", title: "Functions & arguments", topic: "Python functions, parameters, default args, keyword args, return values", duration: "12 min" },
      { id: "py-7", title: "Classes & objects", topic: "Python classes, __init__, methods, attributes, simple OOP example", duration: "15 min" },
      { id: "py-8", title: "Files & error handling", topic: "Python file I/O with open(), and try/except error handling", duration: "12 min" },
    ],
  },
  {
    id: "js-essentials",
    language: "JavaScript",
    title: "JavaScript Essentials",
    tagline: "The language that runs the web.",
    description:
      "Modern JavaScript from the ground up. Variables, functions, async, the DOM — everything you need to build for the browser.",
    level: "Beginner",
    color: "from-yellow-500/20 to-orange-500/10",
    emoji: "✨",
    lessons: [
      { id: "js-1", title: "How JavaScript runs", topic: "How JavaScript runs in the browser and Node, plus a basic Hello World", duration: "8 min" },
      { id: "js-2", title: "let, const & types", topic: "JavaScript let vs const vs var, primitive types, and type coercion gotchas", duration: "10 min" },
      { id: "js-3", title: "Functions & arrow functions", topic: "JavaScript function declarations, expressions, arrow functions, and `this`", duration: "12 min" },
      { id: "js-4", title: "Arrays & objects", topic: "JavaScript arrays, objects, destructuring, spread/rest", duration: "12 min" },
      { id: "js-5", title: "Array methods (map/filter/reduce)", topic: "JavaScript map, filter, reduce, find, some, every with realistic examples", duration: "14 min" },
      { id: "js-6", title: "DOM & events", topic: "DOM querying, event listeners, and updating the page with JavaScript", duration: "12 min" },
      { id: "js-7", title: "Promises & async/await", topic: "JavaScript Promises, async/await, fetch, and handling async errors", duration: "15 min" },
      { id: "js-8", title: "Modules & tooling", topic: "ES modules (import/export), npm basics, and how modern JS projects are structured", duration: "10 min" },
    ],
  },
  {
    id: "ts-fast",
    language: "TypeScript",
    title: "TypeScript, Fast",
    tagline: "Add types to JavaScript without the pain.",
    description:
      "Already know JavaScript? This course gets you productive in TypeScript fast — types, generics, narrowing, and how to actually configure it.",
    level: "Intermediate",
    color: "from-blue-600/20 to-indigo-500/10",
    emoji: "🔷",
    lessons: [
      { id: "ts-1", title: "Why TypeScript", topic: "Why TypeScript exists, what problems it solves over JavaScript", duration: "6 min" },
      { id: "ts-2", title: "Basic types & inference", topic: "TypeScript primitive types, arrays, objects, and type inference", duration: "10 min" },
      { id: "ts-3", title: "Interfaces vs types", topic: "TypeScript interfaces vs type aliases — when to use which", duration: "10 min" },
      { id: "ts-4", title: "Unions, narrowing & guards", topic: "TypeScript union types, type narrowing, and user-defined type guards", duration: "12 min" },
      { id: "ts-5", title: "Generics", topic: "TypeScript generics — functions, constraints, and reusable types", duration: "14 min" },
      { id: "ts-6", title: "Utility types", topic: "TypeScript utility types: Partial, Pick, Omit, Record, ReturnType", duration: "12 min" },
      { id: "ts-7", title: "tsconfig & strict mode", topic: "TypeScript tsconfig essentials and what strict mode actually does", duration: "10 min" },
    ],
  },
  {
    id: "web-foundations",
    language: "Web",
    title: "Web Foundations",
    tagline: "HTML, CSS & how the web actually works.",
    description:
      "The fundamentals every web dev needs. Semantic HTML, modern CSS layout, responsive design, and how browsers fetch data.",
    level: "Beginner",
    color: "from-pink-500/20 to-rose-500/10",
    emoji: "🌐",
    lessons: [
      { id: "web-1", title: "How the web works", topic: "How the web works: DNS, HTTP, browsers, and what loads when you visit a URL", duration: "10 min" },
      { id: "web-2", title: "Semantic HTML", topic: "Semantic HTML elements and why they matter for accessibility and SEO", duration: "10 min" },
      { id: "web-3", title: "CSS basics & the box model", topic: "CSS selectors, specificity, and the box model with examples", duration: "12 min" },
      { id: "web-4", title: "Flexbox & Grid", topic: "CSS Flexbox and Grid — when to use each, with layout examples", duration: "15 min" },
      { id: "web-5", title: "Responsive design", topic: "Responsive design with media queries, fluid units, and mobile-first CSS", duration: "12 min" },
      { id: "web-6", title: "Fetching data", topic: "Using fetch() to call APIs from the browser and rendering the result", duration: "12 min" },
      { id: "web-7", title: "Forms & validation", topic: "HTML forms, inputs, and client-side validation patterns", duration: "10 min" },
    ],
  },
  {
    id: "sql-basics",
    language: "SQL",
    title: "SQL for Everyone",
    tagline: "Talk to databases like you mean it.",
    description:
      "SQL is the most useful skill almost no one teaches you. Learn to query, filter, join, and aggregate data confidently.",
    level: "Beginner",
    color: "from-emerald-500/20 to-teal-500/10",
    emoji: "🗄️",
    lessons: [
      { id: "sql-1", title: "What SQL is & SELECT", topic: "What SQL is and the SELECT statement with WHERE, ORDER BY, LIMIT", duration: "10 min" },
      { id: "sql-2", title: "Filtering & operators", topic: "SQL WHERE filters, comparison and logical operators, LIKE, IN, BETWEEN", duration: "10 min" },
      { id: "sql-3", title: "Aggregates & GROUP BY", topic: "SQL aggregates COUNT, SUM, AVG, plus GROUP BY and HAVING", duration: "12 min" },
      { id: "sql-4", title: "JOINs", topic: "SQL JOINs: INNER, LEFT, RIGHT, FULL — with concrete examples", duration: "14 min" },
      { id: "sql-5", title: "Subqueries & CTEs", topic: "SQL subqueries and CTEs (WITH clause) for cleaner queries", duration: "12 min" },
      { id: "sql-6", title: "Indexes & performance", topic: "How SQL indexes work and basic query performance intuition", duration: "10 min" },
    ],
  },
  {
    id: "dsa-intro",
    language: "Data Structures",
    title: "Data Structures & Algorithms",
    tagline: "Pass interviews, write better code.",
    description:
      "The classic CS toolkit, taught practically. Understand the data structures you'll actually use — and Big-O without the headache.",
    level: "Intermediate",
    color: "from-purple-500/20 to-fuchsia-500/10",
    emoji: "🧠",
    lessons: [
      { id: "dsa-1", title: "Big-O without tears", topic: "Big-O notation explained simply with realistic examples", duration: "12 min" },
      { id: "dsa-2", title: "Arrays & dynamic arrays", topic: "Arrays, dynamic arrays, and common operations with complexity", duration: "10 min" },
      { id: "dsa-3", title: "Hash maps", topic: "Hash maps / dictionaries — how they work and when to reach for them", duration: "12 min" },
      { id: "dsa-4", title: "Linked lists", topic: "Linked lists — singly, doubly, and when they beat arrays", duration: "12 min" },
      { id: "dsa-5", title: "Stacks & queues", topic: "Stacks and queues with real use cases (undo, BFS, scheduling)", duration: "10 min" },
      { id: "dsa-6", title: "Trees & traversals", topic: "Trees, binary trees, and DFS / BFS traversals with code", duration: "14 min" },
      { id: "dsa-7", title: "Graphs & search", topic: "Graphs, adjacency lists, BFS and DFS for shortest paths", duration: "15 min" },
      { id: "dsa-8", title: "Sorting & searching", topic: "Common sorting algorithms and binary search — when each is used", duration: "14 min" },
    ],
  },
];

export const getCourse = (id: string) => COURSES.find((c) => c.id === id);
