// src/engines/organizer.js
// OrganizerAgent: turns a task into structured requirements/constraints/resources.
// Pure + deterministic (MVP).

function toText(v) {
  return typeof v === "string" ? v.trim() : "";
}

function inferResourceType(url) {
  if (!url || typeof url !== "string") return "file";
  const u = url.toLowerCase();
  if (u.endsWith(".pdf")) return "pdf";
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "video";
  if (u.endsWith(".doc") || u.endsWith(".docx")) return "doc";
  if (u.endsWith(".ppt") || u.endsWith(".pptx")) return "slides";
  if (u.endsWith(".xls") || u.endsWith(".xlsx")) return "sheet";
  if (u.startsWith("http")) return "link";
  return "file";
}

function normalizeResources(resources) {
  const arr = Array.isArray(resources) ? resources : [];
  return arr.map((r) => {
    if (typeof r === "string") {
      return {
        title: r.split("/").pop() || r,
        url: r,
        type: inferResourceType(r),
      };
    }
    // If CoursePack stores objects, keep fields if present
    const url = typeof r?.url === "string" ? r.url : typeof r?.href === "string" ? r.href : null;
    const title = typeof r?.title === "string" ? r.title : url ? url.split("/").pop() : "Resource";
    return {
      title,
      url,
      type: inferResourceType(url),
    };
  });
}

function extractChecklistLines(text) {
  if (!text) return [];
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  const bullets = [];
  for (const l of lines) {
    if (l.startsWith("-") || l.startsWith("•")) bullets.push(l.replace(/^(-|•)\s*/, ""));
    else if (/^\d+\.\s+/.test(l)) bullets.push(l.replace(/^\d+\.\s+/, ""));
  }
  // Keep it bounded so UI stays readable
  return bullets.slice(0, 15);
}

export function OrganizerAgent(task) {
  if (!task) return null;

  const title =
    task.title ||
    task.name ||
    task.code ||
    task.id ||
    "Task";

  // These fields are future-friendly; if not present, empty string
  const prompt = toText(task.prompt);
  const rubric = toText(task.rubric);
  const submission = toText(task.submission);
  const description = toText(task.description);

  const resourcesToUse = normalizeResources(task.resources);

  // Extract proto-requirements from prompt/description/rubric
  const sourceText = [prompt, description, rubric].filter(Boolean).join("\n");
  const requirements = extractChecklistLines(sourceText);

  const missingInfo = [];
  if (!prompt && !description) missingInfo.push("prompt/instructions text");
  if (!rubric) missingInfo.push("rubric/marking criteria (optional)");

  const constraints = {
    dueAt: task.dueAt || null,
    submission: submission || null,
  };

  return {
    title,
    prompt,
    rubric,
    description,
    requirements,
    constraints,
    resourcesToUse,
    missingInfo,
  };
}