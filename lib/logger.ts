import { File, Directory, Paths } from 'expo-file-system';
import { Share, Platform } from 'react-native';

const MAX_FILE_SIZE = 512 * 1024;
const MAX_BUFFER = 500;

type LogLevel = 'LOG' | 'WARN' | 'ERROR';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
}

let buffer: LogEntry[] = [];
let ready = false;
let original: { log: typeof console.log; warn: typeof console.warn; error: typeof console.error } | null = null;
let logDir: Directory;
let logFile: File;
let logFileOld: File;

function initPaths() {
  logDir = new Directory(Paths.document, 'logs');
  logFile = new File(logDir, 'app.log');
  logFileOld = new File(logDir, 'app.log.old');
}

function stamp(): string {
  return new Date().toISOString();
}

function fmt(entry: LogEntry): string {
  return `[${entry.timestamp}] [${entry.level}] ${entry.message}`;
}

function ensureDir() {
  try {
    if (!logDir.exists) {
      logDir.create({ intermediates: true });
    }
  } catch {}
}

function rotate() {
  try {
    if (logFile.exists && logFile.size && logFile.size > MAX_FILE_SIZE) {
      logFile.move(logFileOld);
    }
  } catch {}
}

function appendToFile(text: string) {
  try {
    ensureDir();
    rotate();
    const existing = logFile.exists ? logFile.textSync() : '';
    logFile.write(existing + text + '\n');
  } catch {}
}

function push(level: LogLevel, args: any[]) {
  const message = args.map(a =>
    typeof a === 'object'
      ? a instanceof Error
        ? a.stack || a.message
        : JSON.stringify(a, Object.getOwnPropertyNames(a), 2)
      : String(a)
  ).join(' ');

  const entry: LogEntry = { timestamp: stamp(), level, message };

  buffer.push(entry);
  if (buffer.length > MAX_BUFFER) buffer.shift();

  appendToFile(fmt(entry));

  if (original) {
    const fn = level === 'WARN' ? original.warn : level === 'ERROR' ? original.error : original.log;
    fn(...args);
  }
}

export function initLogger() {
  if (ready) return;

  original = {
    log: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
  };

  initPaths();
  ready = true;
  ensureDir();
  push('LOG', [`App launched — ${Platform.OS} ${Platform.Version}, ${stamp()}`]);

  console.log = (...args: any[]) => push('LOG', args);
  console.warn = (...args: any[]) => push('WARN', args);
  console.error = (...args: any[]) => push('ERROR', args);

  const GlobalErrorUtils = (global as any).ErrorUtils;
  if (GlobalErrorUtils?.setGlobalHandler) {
    GlobalErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
      push('ERROR', [`[${isFatal ? 'FATAL' : 'UNCAUGHT'}] ${error.message}\n${error.stack || ''}`]);
    });
  }
}

export async function getLogs(): Promise<string> {
  try {
    const recent = buffer.map(fmt).join('\n');
    let file = '';
    try {
      if (logFile.exists) file = await logFile.text();
    } catch {}
    return file || recent || 'No logs recorded.';
  } catch {
    return 'Unable to read logs.';
  }
}

export async function shareLogs(): Promise<boolean> {
  try {
    const logs = await getLogs();
    if (!logs || logs === 'No logs recorded.') return false;
    await Share.share({ message: logs, title: 'NEET Zymee Debug Logs' });
    return true;
  } catch {
    return false;
  }
}

export async function clearLogs(): Promise<boolean> {
  try {
    if (logFile.exists) logFile.delete();
    if (logFileOld.exists) logFileOld.delete();
    buffer = [];
    return true;
  } catch {
    return false;
  }
}
