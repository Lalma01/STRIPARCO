const { spawn } = require('child_process');

// A watchdog argumentumként kapja meg a fő program elérési útját, opcionális flag-eket, és a folyamat azonosítóját (PID)
const args = process.argv.slice(2);
if (args.length < 2) process.exit(1);

const exePath = args[0];
const mainPidStr = args[args.length - 1]; // PID is always the last argument
const mainPid = parseInt(mainPidStr, 10);
const extraArgs = args.slice(1, -1); // Any flags between exePath and PID (e.g., --hidden)

if (!exePath || isNaN(mainPid)) process.exit(1);

setInterval(() => {
  try {
    // A process.kill 0-ás szignállal csak azt ellenőrzi, hogy a folyamat létezik-e.
    // Nem állítja le a folyamatot. Ha nem létezik, hibát dob.
    process.kill(mainPid, 0);
  } catch (e) {
    // Ha ide jutunk, a fő program leállt (összeomlott vagy kilőtték a Feladatkezelőben).
    // Újraindítjuk a programot a megőrzött flag-ekkel (pl. --hidden).
    const child = spawn(exePath, extraArgs, {
      detached: true,
      stdio: 'ignore'
    });
    child.unref(); // Elengedjük az új folyamatot, hogy függetlenül fusson

    // A watchdog befejezi a működését, mert az új fő program majd indít magának egy új watchdogot.
    process.exit(0);
  }
}, 2000); // 2 másodpercenként ellenőriz
