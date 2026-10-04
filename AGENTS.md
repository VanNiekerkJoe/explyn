# Project Architecture

- Keep Explyn. local-first: accounts, AI configuration, and saved work remain in browser storage so a clone runs without hosted services.
- Treat the homepage command bar as a route launcher; conversational prompts are handed to the dedicated console to keep one AI interaction surface.
- Reuse the shared mascot and activity-status components for brand presence and AI waiting states so motion stays consistent and accessible.
- Keep console conversations route-backed and persist their messages, model, level, and active skills together in browser storage so sessions remain isolated.