import fs from "fs";
import path from "path";

const PROJECT_ROOT = "C:\\Users\\Josh\\courseos";
const OUTPUT_FILE = "C:\\Users\\Josh\\courseos\\src\\data\\courseos_snapshot.json";

const MAX_PREVIEW = 5000;

function readPreview(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return content.slice(0, MAX_PREVIEW);
  } catch {
    return null;
  }
}

function walkDirectory(dir, results = []) {
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      if (
        item.name === "node_modules" ||
        item.name === ".git" ||
        item.name === "dist"
      ) {
        continue;
      }

      walkDirectory(fullPath, results);
    } else {
      const stat = fs.statSync(fullPath);

      results.push({
        path: fullPath,
        size: stat.size,
        modified: stat.mtime,
        preview: readPreview(fullPath)
      });
    }
  }

  return results;
}

function generateSnapshot() {
  console.log("Scanning courseos project...");

  const files = walkDirectory(PROJECT_ROOT);

  const snapshot = {
    generatedAt: new Date().toISOString(),
    root: PROJECT_ROOT,
    fileCount: files.length,
    files
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(snapshot, null, 2));

  console.log("CourseOS snapshot created:");
  console.log(OUTPUT_FILE);
}

generateSnapshot();