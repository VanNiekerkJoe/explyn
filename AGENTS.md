# Project Architecture

- Keep Explyn. local-first: accounts, AI configuration, and saved work remain in browser storage so a clone runs without hosted services.
- Treat the homepage command bar as a route launcher; conversational prompts are handed to the dedicated console to keep one AI interaction surface.