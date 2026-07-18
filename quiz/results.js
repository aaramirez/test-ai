import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { execSync } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const resultsDir = join(__dirname, "results");

function getResultsForBank(bankId) {
  const bankDir = join(resultsDir, bankId);
  if (!existsSync(bankDir)) return [];
  return readdirSync(bankDir)
    .filter(f => f.endsWith(".json") && !f.includes(".enc."))
    .map(f => join(bankDir, f));
}

function getAllResults() {
  if (!existsSync(resultsDir)) return [];
  const banks = readdirSync(resultsDir).filter(d => d !== "_index.json");
  return banks.flatMap(bankId => getResultsForBank(bankId));
}

function getLatestResult() {
  const all = getAllResults();
  return all.length > 0 ? all.sort().reverse()[0] : null;
}

function encryptWithSops(filePath) {
  try {
    execSync(`sops -e -i "${filePath}"`, { stdio: "pipe" });
    console.log(`Encrypted: ${filePath}`);
  } catch {
    try {
      execSync(`sops --age $(age-keygen -y <<< "$SOPS_AGE_KEY") -e -i "${filePath}"`, {
        stdio: "pipe",
        env: { ...process.env },
      });
      console.log(`Encrypted with age: ${filePath}`);
    } catch {
      console.log(`Encryption skipped (sops/age not configured): ${filePath}`);
    }
  }
}

function gitCommit(filePath) {
  try {
    execSync(`git add "${filePath}"`, { stdio: "pipe" });
    execSync(`git commit -m "chore(quiz): add results ${filePath.split("/").pop()}"`, {
      stdio: "pipe",
    });
    console.log(`Committed: ${filePath}`);
  } catch (err) {
    console.log(`Git commit skipped: ${err.message}`);
  }
}

function updateIndex(sessionFile) {
  const indexPath = join(resultsDir, "_index.json");
  const index = existsSync(indexPath)
    ? JSON.parse(readFileSync(indexPath, "utf-8"))
    : { sessions: [] };

  const session = JSON.parse(readFileSync(sessionFile, "utf-8"));
  const existing = index.sessions.find(s => s.session_id === session.session_id);
  if (!existing) {
    index.sessions.push({
      session_id: session.session_id,
      date: session.date,
      mode: session.mode,
      bank: session.bank,
      participant_id: session.participant?.id,
      participant_name: session.participant?.name,
    });
    writeFileSync(indexPath, JSON.stringify(index, null, 2));
    console.log(`Index updated: ${session.session_id}`);
  }
}

function processResults(files) {
  for (const file of files) {
    const session = JSON.parse(readFileSync(file, "utf-8"));
    if (session.mode === "live") {
      encryptWithSops(file);
    }
    updateIndex(file);
    gitCommit(file);
  }
}

const args = process.argv.slice(2);
const bankArg = args.find(a => a.startsWith("--bank="));

if (bankArg) {
  const bankId = bankArg.split("=")[1].replace(".json", "");
  const files = getResultsForBank(bankId);
  if (files.length === 0) {
    console.log(`No results found for bank: ${bankId}`);
    process.exit(0);
  }
  console.log(`Found ${files.length} results for ${bankId}`);
  processResults(files);
} else {
  const latest = getLatestResult();
  if (!latest) {
    console.log("No results found to process.");
    process.exit(0);
  }
  processResults([latest]);
}
