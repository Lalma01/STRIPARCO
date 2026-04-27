const { spawn } = require('child_process');

// A watchdog argumentumként kapja meg a fő program elérési útját és a folyamat azonosítóját (PID)
const [exePath, mainPidStr] = process.argv.slice(2);
const mainPid = parseInt(mainPidStr, 10);

if (!exePath || isNaN(mainPid)) process.exit(1);

setInterval(() => {
  try {
    // A process.kill 0-ás szignállal csak azt ellenőrzi, hogy a folyamat létezik-e.
    // Nem állítja le a folyamatot. Ha nem létezik, hibát dob.
    process.kill(mainPid, 0);
  } catch (e) {
    // Ha ide jutunk, a fő program leállt (összeomlott vagy kilőtték a Feladatkezelőben).
    // Újraindítjuk a programot.
    const child = spawn(exePath, [], {
      detached: true,
      stdio: 'ignore'
    });
    child.unref(); // Elengedjük az új folyamatot, hogy függetlenül fusson
    
    // A watchdog befejezi a működését, mert az új fő program majd indít magának egy új watchdogot.
    process.exit(0);
  }
}, 2000); // 2 másodpercenként ellenőriz
