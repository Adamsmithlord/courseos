import { useEffect, useMemo, useState } from "react";
import coursepack from "./data/coursepack.sit182.json";

// --------------------
// Helpers
// --------------------
function parseDateMaybe(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function hoursUntil(date) {
  if (!date) return null;
  const ms = date.getTime() - Date.now();
  return ms / (1000 * 60 * 60);
}

function formatLocal(date) {
  if (!date) return "—";
  return date.toLocaleString();
}

function calculateCurrentWeek(startDateStr) {
  if (!startDateStr) return null;

  const [y, m, d] = startDateStr.split("-").map(Number);
  if (!y || !m || !d) return null;

  const start = new Date(y, m - 1, d, 0, 0, 0, 0);
  const now = new Date();

  const diffMs = now.getTime() - start.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 0) return 0; // before course starts
  return Math.floor(diffDays / 7) + 1;
}

// --------------------
// Task Engine (MVP)
// --------------------
// Minimal status model
const TASK_STATUS = /** @type {const} */ ([
  "not_started",
  "in_progress",
  "ready_to_submit",
  "submitted",
  "complete",
]);

function isValidStatus(s) {
  return TASK_STATUS.includes(s);
}

function storageKey(courseId) {
  return `courseos.taskProgress.v1.${courseId || "unknown"}`;
}

function loadProgress(courseId) {
  try {
    const raw = localStorage.getItem(storageKey(courseId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveProgress(courseId, progress) {
  try {
    localStorage.setItem(storageKey(courseId), JSON.stringify(progress || {}));
  } catch {
    // ignore
  }
}

function normalizeTasks(tasks, progressById) {
  return (tasks || []).map((t) => {
    const id = t?.id || t?.code || t?.title || crypto?.randomUUID?.() || String(Math.random());
    const statusRaw = progressById?.[id]?.status;
    const status = isValidStatus(statusRaw) ? statusRaw : "not_started";

    const dueDate = parseDateMaybe(t?.dueAt);
    const hrs = dueDate ? hoursUntil(dueDate) : null;

    return {
      ...t,
      id,
      status,
      dueDate,
      dueHours: hrs,
      isOverdue: typeof hrs === "number" ? hrs < 0 : false,
    };
  });
}

function pickNextActionableTask(normalizedTasks) {
  const open = (normalizedTasks || []).filter((t) => t.status !== "complete");

  if (open.length === 0) return null;

  // Sort rules:
  // 1) overdue first (most overdue first)
  // 2) then due soonest
  // 3) then tasks without due dates last
  return [...open].sort((a, b) => {
    const aHasDue = !!a.dueDate;
    const bHasDue = !!b.dueDate;

    // overdue bucket
    if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;

    // both have due dates -> earliest due first
    if (aHasDue && bHasDue) return a.dueDate.getTime() - b.dueDate.getTime();

    // only one has a due date -> the one with a due date first
    if (aHasDue !== bHasDue) return aHasDue ? -1 : 1;

    // neither has due date -> stable-ish
    return String(a.id).localeCompare(String(b.id));
  })[0];
}

function urgencyLabel(task) {
  if (!task) return "—";
  if (!task.dueDate) return "No due date";
  if (task.isOverdue) return "Overdue";

  const h = task.dueHours;
  if (typeof h !== "number") return "—";
  if (h <= 24) return "Due < 24h";
  if (h <= 72) return "Due < 3d";
  if (h <= 168) return "Due < 7d";
  return "Scheduled";
}

// --------------------
// App
// --------------------
export default function App() {
  const courseId = coursepack?.course?.id ?? "COURSE";
  const [progressById, setProgressById] = useState({});

  // Load progress once per course
  useEffect(() => {
    setProgressById(loadProgress(courseId));
  }, [courseId]);

  // Persist any changes
  useEffect(() => {
    saveProgress(courseId, progressById);
  }, [courseId, progressById]);

  const summary = useMemo(() => {
    const courseName = coursepack?.course?.name ?? "Untitled course";
    const weeks = coursepack?.weeks ?? [];
    const tasks = coursepack?.tasks ?? [];

    const currentWeek = calculateCurrentWeek(coursepack?.course?.startDate);

    const normalizedTasks = normalizeTasks(tasks, progressById);
    const next = pickNextActionableTask(normalizedTasks);
    const nextDueHours = next?.dueDate ? hoursUntil(next.dueDate) : null;

    const completedCount = normalizedTasks.filter((t) => t.status === "complete").length;

    return {
      courseName,
      weekCount: weeks.length,
      taskCount: tasks.length,
      completedCount,
      currentWeek,
      normalizedTasks,
      next,
      nextDueHours,
    };
  }, [progressById]);

  function setTaskStatus(taskId, status) {
    if (!taskId || !isValidStatus(status)) return;
    setProgressById((prev) => ({
      ...(prev || {}),
      [taskId]: {
        ...(prev?.[taskId] || {}),
        status,
        updatedAt: new Date().toISOString(),
      },
    }));
  }

  return (
    <div
      style={{
        padding: 16,
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        maxWidth: 960,
        margin: "0 auto",
        lineHeight: 1.4,
      }}
    >
      <h1 style={{ marginBottom: 6 }}>CourseOS</h1>
      <p style={{ marginTop: 0, opacity: 0.75 }}>
        Dev-only CoursePack import via local JSON file (Vite hot reload).
      </p>

      {/* Summary card */}
      <div
        style={{
          padding: 12,
          border: "1px solid #ddd",
          borderRadius: 10,
          marginBottom: 12,
        }}
      >
        <div>
          <b>Course:</b> {summary.courseName}
        </div>
        <div>
          <b>Weeks:</b> {summary.weekCount}
        </div>
        <div>
          <b>Tasks:</b> {summary.taskCount}{" "}
          <span style={{ opacity: 0.7 }}>
            ({summary.completedCount} complete)
          </span>
        </div>
        <div>
          <b>Current Academic Week:</b> {summary.currentWeek ?? "—"}
        </div>
      </div>

      {/* Next actionable task */}
      <div
        style={{
          padding: 12,
          border: "1px solid #ddd",
          borderRadius: 10,
          marginBottom: 12,
        }}
      >
        <h2 style={{ marginTop: 0 }}>Next actionable task</h2>

        {!summary.next && <p>All tasks are marked complete (or no tasks found).</p>}

        {summary.next && (
          <>
            <div style={{ display: "grid", gap: 6 }}>
              <div>
                <b>{summary.next.code || summary.next.id}</b> — {summary.next.title}
              </div>
              <div>
                <b>Status:</b> {summary.next.status}{" "}
                <span style={{ opacity: 0.7 }}>({urgencyLabel(summary.next)})</span>
              </div>
              <div>
                <b>Due:</b> {formatLocal(summary.next.dueDate)}
              </div>
              <div>
                <b>Hours remaining:</b>{" "}
                {summary.nextDueHours === null
                  ? "—"
                  : Math.round(summary.nextDueHours * 10) / 10}
              </div>
            </div>

            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {TASK_STATUS.map((s) => (
                <button
                  key={s}
                  onClick={() => setTaskStatus(summary.next.id, s)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 8,
                    border: "1px solid #ccc",
                    background: s === summary.next.status ? "#eee" : "white",
                    cursor: "pointer",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            {Array.isArray(summary.next.resources) && summary.next.resources.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <b>Resources:</b>
                <ul>
                  {summary.next.resources.map((r) => (
                    <li key={r} style={{ wordBreak: "break-word" }}>
                      {r}
                    </li>
                  ))}
                </ul>
                <p style={{ opacity: 0.7, marginTop: 6 }}>
                  Note: browser apps can’t open arbitrary local file paths directly.
                  For now we store paths as references.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Task list */}
      <div
        style={{
          padding: 12,
          border: "1px solid #ddd",
          borderRadius: 10,
        }}
      >
        <h2 style={{ marginTop: 0 }}>Task Engine</h2>

        {summary.normalizedTasks.length === 0 ? (
          <p>No tasks in CoursePack yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left" }}>
                  <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>Task</th>
                  <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>Due</th>
                  <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>Urgency</th>
                  <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {summary.normalizedTasks
                  .slice()
                  .sort((a, b) => {
                    // same sorting approach as "next task", but show all
                    const aOpen = a.status !== "complete";
                    const bOpen = b.status !== "complete";
                    if (aOpen !== bOpen) return aOpen ? -1 : 1;

                    if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;

                    const aHasDue = !!a.dueDate;
                    const bHasDue = !!b.dueDate;
                    if (aHasDue && bHasDue) return a.dueDate.getTime() - b.dueDate.getTime();
                    if (aHasDue !== bHasDue) return aHasDue ? -1 : 1;

                    return String(a.id).localeCompare(String(b.id));
                  })
                  .map((t) => (
                    <tr key={t.id}>
                      <td style={{ padding: 8, borderBottom: "1px solid #f4f4f4" }}>
                        <div>
                          <b>{t.code || t.id}</b> — {t.title}
                        </div>
                      </td>
                      <td style={{ padding: 8, borderBottom: "1px solid #f4f4f4" }}>
                        {formatLocal(t.dueDate)}
                      </td>
                      <td style={{ padding: 8, borderBottom: "1px solid #f4f4f4" }}>
                        {urgencyLabel(t)}
                      </td>
                      <td style={{ padding: 8, borderBottom: "1px solid #f4f4f4" }}>
                        <select
                          value={t.status}
                          onChange={(e) => setTaskStatus(t.id, e.target.value)}
                        >
                          {TASK_STATUS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer note */}
      <div style={{ marginTop: 16, opacity: 0.75 }}>
        <p style={{ marginBottom: 6 }}>
          <b>Live update:</b> edit <code>src/data/coursepack.sit182.json</code>{" "}
          while <code>npm run dev</code> is running — the UI should hot-reload.
        </p>
        <p style={{ marginTop: 0 }}>
          Task statuses persist in your browser via <code>localStorage</code>.
        </p>
      </div>
    </div>
  );
}