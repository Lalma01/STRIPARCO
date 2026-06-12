'use strict';
const { spawn } = require('child_process');
const fs = require('fs');

// Args: <exePath> [extra flags...] <pidFile>
const args = process.argv.slice(2);
if (args.length < 2) process.exit(1);

const exePath = args[0];
const pidFile = args[args.length - 1];
const extraArgs = args.slice(1, -1); // flags between exePath and pidFile (e.g. --hidden)

if (!exePath || !pidFile) process.exit(1);

function mainAlive() {
  try {
    const pid = parseInt(fs.readFileSync(pidFile, 'utf8').trim(), 10);
    if (!pid) return false;
    // Signal 0 only checks existence, it does not terminate the process.
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return false;
  }
}

setInterval(() => {
  if (mainAlive()) return;
  // Main process is gone (crashed or killed in Task Manager) → relaunch it with the kept flags.
  const child = spawn(exePath, extraArgs, { detached: true, stdio: 'ignore' });
  child.unref();
  // The freshly started main spawns its own watchdog, so this one can stop.
  process.exit(0);
}, 1000);
