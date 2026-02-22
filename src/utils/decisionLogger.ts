import fs from 'fs';
import path from 'path';

// Directory where decision logs will be stored (root/logs)
const LOG_DIR = path.resolve(process.cwd(), 'logs');
let currentFile: string | null = null;

function ensureDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function sanitize(name: string): string {
  return name
    .replace(/[^a-z0-9_\-]/gi, '_')
    .replace(/_+/g, '_')
    .toLowerCase();
}

function pruneLogs() {
  try {
    const files = fs
      .readdirSync(LOG_DIR)
      .filter((f) => f.endsWith('.log'))
      .map((f) => ({
        name: f,
        mtime: fs.statSync(path.join(LOG_DIR, f)).mtime.getTime(),
      }));
    if (files.length <= 10) return;
    files
      .sort((a, b) => b.mtime - a.mtime)
      .slice(10)
      .forEach((f) => {
        try {
          fs.unlinkSync(path.join(LOG_DIR, f.name));
        } catch {}
      });
  } catch {}
}

function openTempLog() {
  ensureDir();
  if (!currentFile) {
    const ts = new Date().toISOString().replace(/[.:]/g, '-');
    // prefix timestamp so temp files sort chronologically
    currentFile = path.join(LOG_DIR, `${ts}-temp.log`);
    fs.writeFileSync(currentFile, `[Temporary log started at ${ts}]
`);
    pruneLogs();
  }
}

export function initLog(recipeName?: string) {
  if (recipeName) {
    ensureDir();
    const ts = new Date().toISOString().replace(/[.:]/g, '-');
    // put timestamp first so files sort by date when sorted alphabetically
    const newFile = path.join(LOG_DIR, `${ts}-${sanitize(recipeName)}.log`);
    // if a temp file exists, rename it
    if (currentFile && currentFile !== newFile) {
      try {
        fs.renameSync(currentFile, newFile);
      } catch {}
    }
    currentFile = newFile;
    if (!fs.existsSync(currentFile)) {
      fs.writeFileSync(
        currentFile,
        `[Log started for recipe: ${recipeName} at ${ts}]
`
      );
    }
    pruneLogs();
  } else {
    openTempLog();
  }
}

export function logDecision(line: string) {
  if (!currentFile) {
    openTempLog();
  }
  try {
    fs.appendFileSync(currentFile as string, `${new Date().toISOString()} ${line}
`);
  } catch {}
}

// Helpers for formatting
export function prettyPrint(str: string): string {
  // try to parse as JSON for nicer output
  try {
    const obj = JSON.parse(str);
    return JSON.stringify(obj, null, 2);
  } catch {
    return str;
  }
}

export function indentLines(str: string): string {
  return str
    .split('\n')
    .map((line) => '  ' + line)
    .join('\n');
}