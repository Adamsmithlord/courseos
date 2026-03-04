// src/engines/coach.js
// CoachAgent: returns Smallest Next Action + teach bullets + draft scaffold.
// Pure + deterministic (MVP).

function hasUsefulText(s) {
  return typeof s === "string" && s.trim().length > 20;
}

export function CoachAgent({ task, organized, planned }) {
  if (!task || !organized || !planned) return null;

  const title = organized.title || "Task";

  const hasPrompt = hasUsefulText(organized.prompt);
  const hasDescription = hasUsefulText(organized.description);

  // If we don't have enough content to produce a real draft,
  // the correct next action is: capture the prompt/rubric into the CoursePack.
  if (!hasPrompt && !hasDescription) {
    const bestRes = Array.isArray(organized.resourcesToUse) ? organized.resourcesToUse[0] : null;

    return {
      sna: bestRes?.url
        ? `Open the resource for "${title}" and paste the exact task prompt into uniRPG (add task.prompt).`
        : `Open "${title}" instructions and paste the exact task prompt into uniRPG (add task.prompt).`,
      teach: [
        "We can’t draft accurately without the exact prompt text.",
        "Once the prompt is stored, uniRPG can generate an outline + a first-draft scaffold automatically.",
      ],
      draft: null,
      questions: ["Paste the task prompt text (and rubric if available)."],
    };
  }

  const checklist =
    Array.isArray(organized.requirements) && organized.requirements.length
      ? organized.requirements
      : ["(Add checklist items from the prompt/rubric)"];

  const submissionLine = organized?.constraints?.submission
    ? `- ${organized.constraints.submission}`
    : "- (Add format/word count if required)";

  const draft = [
    `# ${title}`,
    "",
    "## Interpret the prompt",
    "(Write 2–3 sentences explaining what the task is asking)",
    "",
    "## Requirements checklist",
    ...checklist.map((r) => `- [ ] ${r}`),
    "",
    "## Outline / Structure",
    "- Intro: context + goal",
    "- Body: main points + evidence/examples",
    "- Conclusion: summary + next steps",
    "",
    "## Submission notes",
    submissionLine,
  ].join("\n");

  return {
    sna: `Timebox ${planned.timeboxMin} min: write “Interpret the prompt” + tick off 3 checklist items for "${title}".`,
    teach: [
      "Convert the prompt into a checklist—this becomes your win-condition.",
      "Draft ugly first. Polish only after checklist coverage.",
      `Autopilot mode is ${planned.autopilot.mode}: follow the timebox and move forward.`,
    ],
    draft,
    questions: [],
  };
}