# Make lessons and tutoring more effective

## Changes
- Strengthen the shared learning prompts so lessons use accurate, concrete examples, explain reasoning, address common misconceptions, and give practice that progresses from supported to independent work.
- Pass a course's lesson sequence and current position into lesson generation, so each lesson builds on prerequisites and avoids teaching future material too early.
- Make tutor replies conversational and adaptive: diagnose confusion, answer the student's actual question, and use one focused follow-up rather than repeating a generic challenge every time.
- Add focused tests for curriculum context and the tutor's teaching rules; keep the current screens and local-first AI setup unchanged.

## Technical details
- Extend the existing `learnSystemPrompt` and `streamLearn` data shape with optional course context; only the course lesson flow supplies it.
- Run the prompt tests and check preview build diagnostics after editing.
