import fs from "fs";
import path from "path";

const STUDYPRO_ROOT =
  "C:\\Users\\Josh\\Desktop\\StudyPRO\\SIT182 - Real World Practices For Cyber Security";

const OUTPUT_FILE =
  "C:\\Users\\Josh\\courseos\\src\\data\\studypro_snapshot.json";

const MAX_PREVIEW = 3000;

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
  console.log("Scanning StudyPRO folder...");

  if (!fs.existsSync(STUDYPRO_ROOT)) {
    console.error("StudyPRO folder not found.");
    process.exit(1);
  }

  const files = walkDirectory(STUDYPRO_ROOT);

  const snapshot = {
    generatedAt: new Date().toISOString(),
    root: STUDYPRO_ROOT,
    fileCount: files.length,
    files
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(snapshot, null, 2));

  console.log("StudyPRO snapshot created:");
  console.log(OUTPUT_FILE);
}

generateSnapshot();