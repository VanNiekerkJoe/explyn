import { describe, expect, it } from "vitest";
import { learnSystemPrompt } from "@/lib/prompts";

describe("learning prompts", () => {
  it("grounds course lessons in their place in the full sequence", () => {
    const prompt = learnSystemPrompt("lesson", "beginner", "Python", "Functions", {
      title: "Python 101",
      lessonIndex: 2,
      lessons: [
        { title: "Variables", topic: "Store and name values" },
        { title: "Conditions", topic: "Choose a path with if statements" },
        { title: "Functions", topic: "Define reusable blocks of code" },
        { title: "Lists", topic: "Store multiple values in order" },
      ],
    });

    expect(prompt).toContain("Course: Python 101");
    expect(prompt).toContain("Lesson 3 of 4: Functions");
    expect(prompt).toContain("4. Lists — Store multiple values in order");
    expect(prompt).toContain("do not teach later topics early");
  });

  it("keeps tutor replies adaptive instead of forcing a canned challenge", () => {
    const prompt = learnSystemPrompt("tutor", "beginner", "Python");

    expect(prompt).toContain("First understand and answer what the student actually asked");
    expect(prompt).toContain("change approach if the learner remains confused");
    expect(prompt).toContain("Do not append a challenge, quiz, or \"Try this\" to every reply");
    expect(prompt).not.toContain("Always end with a tiny \"Try this:\" challenge");
  });
});