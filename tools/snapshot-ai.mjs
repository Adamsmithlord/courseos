import fs from "fs";
import path from "path";

const DATA_DIR = "C:\\Users\\Josh\\courseos\\src\\data";
const OUT = path.join(DATA_DIR, "ai_snapshot.json");

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function generateSnapshot() {
  const studypro = readJson(path.join(DATA_DIR, "studypro_snapshot.json"));
  const courseos = readJson(path.join(DATA_DIR, "courseos_snapshot.json"));

  const snapshot = {
    generatedAt: new Date().toISOString(),
    type: "uniRPG_ai_snapshot",
    studypro,
    courseos
  };

  fs.writeFileSync(OUT, JSON.stringify(snapshot, null, 2));

  console.log("AI snapshot generated:");
  console.log(OUT);
}

generateSnapshot();