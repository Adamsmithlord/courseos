// src/engines/planner.js
// PlannerAgent: chooses Autopilot mode + timebox + generic step plan.
// Pure + deterministic (MVP).

export function PlannerAgent({ task }) {
  if (!task) return null;

  // Expecting your normalized task to include:
  // - isOverdue: boolean
  // - dueHours: number (hours until due, can be negative)
  const isOverdue = !!task.isOverdue;
  const dueHours = typeof task.dueHours === "number" ? task.dueHours : null;

  let mode = "MAINTENANCE";
  let reason = "No urgent deadlines detected.";
  let timeboxMin = 30;

  if (isOverdue) {
    mode = "FIRE";
    reason = "Task is overdue.";
    timeboxMin = 60;
  } else if (dueHours !== null && dueHours <= 72) {
    mode = "STEADY";
    reason = "Due within 3 days.";
    timeboxMin = 45;
  } else if (dueHours !== null && dueHours <= 168) {
    mode = "MAINTENANCE";
    reason = "Due within 7 days.";
    timeboxMin = 30;
  }

  // Generic plan (works for most tasks)
  const plan = [
    { step: "Clarify requirements (prompt + rubric)", estMin: 10 },
    { step: "Draft outline / solution skeleton", estMin: 15 },
    { step: "Write first rough pass", estMin: 20 },
    { step: "Check against rubric + submit format", estMin: 10 },
  ];

  return {
    autopilot: { mode, reason },
    timeboxMin,
    plan,
  };
}