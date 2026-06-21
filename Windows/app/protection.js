'use strict';
// ── STRIPARCO tamper-protection core ────────────────────────────────────────
// Pure Node module (no Electron deps) so it can run both inside the GUI process
// and inside the SYSTEM service (electron.exe started with ELECTRON_RUN_AS_NODE=1).
//
// Strategy (no kernel driver — that would need EV + MS attestation signing):
//   1) NTFS ACL lock on the install directory  → files cannot be deleted.
//   2) Hide the uninstall entry on the CORRECT registry key (matched by
//      DisplayName, not a guessed appId) → nothing to click in Settings / Control
//      Panel, and the "Uninstall" button is disabled even if the entry is shown.
//   3) A single per-minute guard task keeps the GUI alive (the SYSTEM service
//      re-creates it if removed, and re-applies 1) and 2) every cycle).
//
// Everything here is idempotent and best-effort: failures are swallowed so a
// partially-applied state on the next cycle simply gets completed.

const { exec, execSync } = require('child_process');
const path = require('path');

const PRODUCT       = 'STRIPARCO';
const SERVICE_NAME  = 'STRIPARCO_Service';
const GUARD_TASK    = 'STRIPARCO_Guard';
const EVERYONE_SID  = '*S-1-1-0';

const UNINSTALL_ROOTS = [
  'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
  'HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
];

const run  = cmd => new Promise(res => exec(cmd, { windowsHide: true }, (e, so) => res({ e, so })));
const runQ = cmd => { try { return execSync(cmd, { windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] }).toString(); } catch { return ''; } };

const installDir = () => path.dirname(process.execPath);

// ── 1) Install-directory ACL lock ──────────────────────────────────────────
// Deny DELETE + DELETE_CHILD to Everyone (inherited to all files/subfolders) so
// the folder and its contents cannot be removed from Explorer / Settings.
// An admin can still take ownership and override — that is the inherent limit
// without a kernel component — but casual removal is blocked.
function lockInstallDir() {
  const dir = installDir();
  return run(`icacls "${dir}" /deny "${EVERYONE_SID}:(OI)(CI)(DE,DC)" /T /C`);
}
function unlockInstallDir() {
  const dir = installDir();
  return run(`icacls "${dir}" /remove:d "${EVERYONE_SID}" /T /C`);
}

// ── 2) Uninstall registry entry ─────────────────────────────────────────────
// Find the real key(s) by matching DisplayName, regardless of the GUID name the
// NSIS installer chose.
function findUninstallKeys() {
  const keys = [];
  for (const root of UNINSTALL_ROOTS) {
    const out = runQ(`reg query "${root}" /s /v DisplayName`);
    if (!out) continue;
    let currentKey = null;
    for (const raw of out.split(/\r?\n/)) {
      const line = raw.trimEnd();
      if (/^HKEY_/i.test(line.trim())) { currentKey = line.trim(); continue; }
      const m = line.match(/DisplayName\s+REG_SZ\s+(.+)$/i);
      if (m && currentKey && m[1].trim().toLowerCase().includes(PRODUCT.toLowerCase())) {
        keys.push(currentKey);
        currentKey = null;
      }
    }
  }
  return [...new Set(keys)];
}

function hideUninstall() {
  const tasks = [];
  for (const key of findUninstallKeys()) {
    // SystemComponent=1 hides it from the Programs list entirely (honoured by both
    // the classic Control Panel and the modern Settings app). NoRemove/NoModify
    // additionally grey out the buttons if it is ever surfaced.
    tasks.push(run(`reg add "${key}" /v SystemComponent /t REG_DWORD /d 1 /f`));
    tasks.push(run(`reg add "${key}" /v NoRemove /t REG_DWORD /d 1 /f`));
    tasks.push(run(`reg add "${key}" /v NoModify /t REG_DWORD /d 1 /f`));
    tasks.push(run(`reg add "${key}" /v NoRepair /t REG_DWORD /d 1 /f`));
  }
  return Promise.all(tasks);
}

function restoreUninstall() {
  const tasks = [];
  for (const key of findUninstallKeys()) {
    tasks.push(run(`reg delete "${key}" /v SystemComponent /f`));
    tasks.push(run(`reg delete "${key}" /v NoRemove /f`));
    tasks.push(run(`reg delete "${key}" /v NoModify /f`));
    tasks.push(run(`reg delete "${key}" /v NoRepair /f`));
  }
  return Promise.all(tasks);
}

// ── 3) Guard task (keeps the GUI alive in the user session) ─────────────────
// The relaunched GUI must run in the interactive desktop session, not session 0
// (where the SYSTEM service lives), otherwise the lockout/notification windows
// would be invisible. We therefore pin the task to the console user with /it
// (interactive-only, no stored password). The single-instance lock makes a
// redundant launch a no-op while the app is already running.
function consoleUser() {
  // Works from both the GUI process (correct env) and the SYSTEM service (queries
  // the console session owner).
  const fromWmic = runQ('wmic computersystem get username /value');
  const m = fromWmic.match(/UserName=(.+)/i);
  if (m && m[1].trim()) return m[1].trim();
  const d = process.env.USERDOMAIN, u = process.env.USERNAME;
  return (d && u && u.toLowerCase() !== `${process.env.COMPUTERNAME || ''}$`.toLowerCase())
    ? `${d}\\${u}` : '';
}
function createGuardTask() {
  const user = consoleUser();
  if (!user) return Promise.resolve();   // no one logged on yet — retry next cycle
  const tr = `\\"${process.execPath}\\" --hidden`;
  return run(`schtasks /create /tn "${GUARD_TASK}" /tr "${tr}" /sc minute /mo 1 /rl highest /ru "${user}" /it /f`);
}
function deleteGuardTask() {
  return run(`schtasks /delete /tn "${GUARD_TASK}" /f`);
}

// ── Aggregate apply / remove ────────────────────────────────────────────────
async function applyProtection() {
  await createGuardTask();
  await hideUninstall();
  await lockInstallDir();
}
async function removeProtection() {
  await deleteGuardTask();
  await restoreUninstall();
  await unlockInstallDir();
}

module.exports = {
  PRODUCT, SERVICE_NAME, GUARD_TASK, installDir,
  lockInstallDir, unlockInstallDir,
  findUninstallKeys, hideUninstall, restoreUninstall,
  createGuardTask, deleteGuardTask,
  applyProtection, removeProtection,
};
