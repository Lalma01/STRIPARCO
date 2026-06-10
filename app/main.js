'use strict';
const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, Notification, screen, powerMonitor } = require('electron');
const path = require('path');
const fs   = require('fs');
const crypto = require('crypto');
const { exec, spawn } = require('child_process');

// ── Paths ──────────────────────────────────────────────────────────────────
const HOSTS_FILE    = 'C:\\Windows\\System32\\drivers\\etc\\hosts';
const MARKER_START  = '# === ContentBlocker START ===';
const MARKER_END    = '# === ContentBlocker END ===';
const CONFIG_PATH   = path.join(app.getPath('userData'), 'config.json');
const PRELOAD       = path.join(__dirname, 'preload.js');
const BLOCKED_HTML_PATH = path.join(app.getPath('userData'), 'blocked.html');
const PID_FILE          = path.join(app.getPath('userData'), 'cb.pid');

// ── Built-in blocked domains ───────────────────────────────────────────────
const BUILTIN_DOMAINS = [
  // NSFW Porn
  'pornhub.com','xvideos.com','xnxx.com','xhamster.com','redtube.com',
  'youporn.com','tube8.com','beeg.com','spankbang.com','eporner.com',
  'brazzers.com','bangbros.com','naughtyamerica.com','chaturbate.com',
  'cam4.com','myfreecams.com','livejasmin.com','stripchat.com',
  'bongacams.com','onlyfans.com','nhentai.net','hentaihaven.xxx',
  'e621.net','gelbooru.com','rule34.xxx','danbooru.donmai.us',
  'jerkmate.com','camsoda.com','flirt4free.com','adulttime.com',
  'realitykings.com','mofos.com','tnaflix.com','porndig.com',
  'drtuber.com','slutload.com','xtube.com','pornmd.com','keezmovies.com',
  // NSFW AI Chat
  'spicychat.ai','crushon.ai','janitorai.com','candy.ai','muah.ai',
  'dreamgf.ai','dreambf.ai','erogen.ai','intimateai.com',
  'character.ai','naughtydog.ai','kindroid.ai','soulgen.ai','venus.chub.ai',
  // NSFW AI Image generators
  'civitai.com','pornpen.ai','aiporncreator.ai','nudify.online',
  'seduced.ai','promptchan.ai','undress.app','deepnude.cc','nsfwgenerator.ai',
  // AI Chat & Image Generators (Blocked)
  'perchance.org', 'midjourney.com', 'leonardo.ai', 'nightcafe.studio',
  'lexica.art', 'playgroundai.com', 'craiyon.com', 'stablediffusionweb.com',
  'mage.space', 'tensor.art', 'runwayml.com', 'ideogram.ai', 'chatgpt.com',
  'poe.com', 'you.com', 'pi.ai', 'replika.com', 'yodayo.com', 'krea.ai',
  'designer.microsoft.com', 'chat.openai.com', 'copilot.microsoft.com',
];

const ALLOWED_DOMAINS = ['grok.com', 'claude.ai', 'perplexity.ai', 'gemini.google.com', 'x.com'];

const BLOCKED_KEYWORDS = [
  'pornhub','xvideos','xnxx','xhamster','redtube','youporn','onlyfans',
  'chaturbate','spankbang','stripchat','spicychat','crushon','janitorai',
  'character.ai','nudify','pornpen','civitai','nhentai','rule34',
  'porn','xxx','nsfw','hentai', 'sex', 'sexy', 'nude', 'naked',
  'dating', 'hookup', 'free date', 'meet singles', 'meet girls', 'hot women',
  'live sex', 'sex chat', 'adult content', 'escort', 'sugar daddy', 'megismerkedés',
  'perchance', 'midjourney', 'leonardo.ai', 'nightcafe', 'lexica.art', 'playgroundai',
  'craiyon', 'mage.space', 'tensor.art', 'ideogram', 'chatgpt', 'poe.com', 'replika',
  'ai generator', 'ai chat', 'képgenerátor', 'image generator'
];

const WHITELIST_AI_KEYWORDS = ['grok', 'claude', 'perplexity', 'gemini'];

// ── Main-process translations ──────────────────────────────────────────────
const MSG = {
  hu: {
    tray_open: 'ContentBlocker megnyitása', tray_screentime: 'Képernyőidő',
    tray_settings: 'Beállítások', tray_exit: 'Kilépés',
    tray_unlimited: 'Korlátlan', tray_left: 'maradt',
    notif_time_title: '⏱ Képernyőidő',
    notif_15: '15 perc maradt!', notif_5: '5 perc maradt!', notif_1: '1 perc maradt!',
    notif_limit: 'A napi képernyőidő-korlát elérve.',
    exit_prompt: 'Jelszó szükséges a kilépéshez', exit_ph: 'Jelszó',
    exit_ok: 'OK', exit_cancel: 'Mégse', exit_wrong: 'Hibás jelszó',
    err_pw_time: 'Jelszó szükséges a képernyőidő-korlát módosításához',
    err_pw_old: 'Hibás régi jelszó', err_pw_min: 'Min. 4 karakter szükséges',
    err_pw_wrong: 'Hibás jelszó',
  },
  en: {
    tray_open: 'Open ContentBlocker', tray_screentime: 'Screen Time',
    tray_settings: 'Settings', tray_exit: 'Exit',
    tray_unlimited: 'Unlimited', tray_left: 'left',
    notif_time_title: '⏱ Screen Time',
    notif_15: '15 minutes left!', notif_5: '5 minutes left!', notif_1: '1 minute left!',
    notif_limit: 'Daily screen time limit reached.',
    exit_prompt: 'Password required to exit', exit_ph: 'Password',
    exit_ok: 'OK', exit_cancel: 'Cancel', exit_wrong: 'Wrong password',
    err_pw_time: 'Password required to change the screen time limit',
    err_pw_old: 'Wrong current password', err_pw_min: 'Minimum 4 characters required',
    err_pw_wrong: 'Wrong password',
  },
};
const tr = key => (MSG[config.lang] || MSG.hu)[key] || (MSG.hu[key] || key);

// ── State ──────────────────────────────────────────────────────────────────
let tray = null, mainWindow = null, settingsWindow = null;
let notifWindow = null, screenTimeWindow = null;
let config = {};
let screenTimeSecondsUsed = 0;
let limitReached = false;
let screenTimePaused = false;
let lastNotifKey = '', lastNotifTime = 0;
let lastCloseOthers = 0;
let watchdogProcess = null;

// ── Helpers ────────────────────────────────────────────────────────────────
const todayDate  = () => new Date().toISOString().slice(0,10);
const hashPw     = pw  => crypto.createHash('sha256').update(pw + 'cb_v1').digest('hex');
const escRx      = s   => s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const fmtTime    = sec => {
  if (sec < 0) return '∞';
  sec = Math.floor(sec);
  const h = Math.floor(sec/3600), m = Math.floor((sec%3600)/60), s = sec%60;
  return h > 0 ? `${h}ó ${m}p` : `${m}p ${String(s).padStart(2,'0')}mp`;
};

// ── Config ─────────────────────────────────────────────────────────────────
function defConfig() {
  return {
    password_protected: false, password_hash: '',
    screen_time_limit: 0,      // minutes, 0=unlimited
    screen_time_used: 0,       // seconds used today
    screen_time_date: todayDate(),
    auto_start: true,
    custom_blocked_sites: [],
    blocked_count: 0,
    lang: (app.getLocale && app.getLocale().startsWith('hu')) ? 'hu' : 'en',
  };
}

function loadConfig() {
  try {
    config = fs.existsSync(CONFIG_PATH)
      ? { ...defConfig(), ...JSON.parse(fs.readFileSync(CONFIG_PATH,'utf8')) }
      : defConfig();
  } catch { config = defConfig(); }

  if (config.screen_time_date !== todayDate()) {
    config.screen_time_used = 0;
    config.screen_time_date = todayDate();
  }
  screenTimeSecondsUsed = config.screen_time_used || 0;

  if (!config.password_protected) {
    allowUninstallation();
  }
}

function allowUninstallation() {
  const appId = 'com.contentblocker.app';
  const keys = [
    `HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${appId}`,
    `HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${appId}`
  ];
  keys.forEach(key => {
    exec(`reg delete "${key}" /v "NoRemove" /f`, () => {});
    exec(`reg delete "${key}" /v "NoModify" /f`, () => {});
    exec(`reg delete "${key}" /v "SystemComponent" /f`, () => {});
  });
}

function saveConfig() {
  config.screen_time_used = screenTimeSecondsUsed;
  config.screen_time_date = todayDate();
  try { fs.writeFileSync(CONFIG_PATH, JSON.stringify(config,null,2),'utf8'); } catch(e) { console.error(e); }
}

// ── Hosts file ─────────────────────────────────────────────────────────────
function updateHosts() {
  let content;
  try { content = fs.readFileSync(HOSTS_FILE,'utf8'); } catch { return false; }
  const rx = new RegExp(`\\r?\\n?${escRx(MARKER_START)}[\\s\\S]*?${escRx(MARKER_END)}\\r?\\n?`,'g');
  let clean = content.replace(rx,'');
  const allowed = new Set(ALLOWED_DOMAINS);
  const all = [...new Set([...BUILTIN_DOMAINS, ...config.custom_blocked_sites])]
    .filter(d => !allowed.has(d) && !ALLOWED_DOMAINS.some(a => d === a || d.endsWith('.' + a)));
  const lines = ['\n'+MARKER_START];
  for (const d of all) {
    lines.push(`127.0.0.1 ${d}`);
    if (!d.startsWith('www.')) lines.push(`127.0.0.1 www.${d}`);
  }
  lines.push(MARKER_END);
  try {
    try { require('child_process').execSync(`attrib -r "${HOSTS_FILE}"`); } catch(e) {}
    fs.writeFileSync(HOSTS_FILE, clean.trimEnd() + lines.join('\n') + '\n','utf8');
    exec('ipconfig /flushdns');
    return true;
  } catch(e) { console.error('Hosts write failed (no admin?):', e.message); return false; }
}

function cleanHosts() {
  try {
    const c = fs.readFileSync(HOSTS_FILE,'utf8');
    const rx = new RegExp(`\\r?\\n?${escRx(MARKER_START)}[\\s\\S]*?${escRx(MARKER_END)}\\r?\\n?`,'g');
    fs.writeFileSync(HOSTS_FILE, c.replace(rx,''),'utf8');
  } catch {}
}

// ── Auto-start ─────────────────────────────────────────────────────────────
function setAutoStart(enabled) {
  const exe = `\"${process.execPath}\" --hidden`;
  if (enabled) {
    exec(`schtasks /create /tn "ContentBlocker" /tr "${exe.replace(/"/g, '\\"')}" /sc onlogon /rl highest /f`, err => {
      if (err) exec(`reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v "ContentBlocker" /t REG_SZ /d "${exe.replace(/"/g, '\\"')}" /f`);
    });
    preventUninstallation();
  } else {
    exec('schtasks /delete /tn "ContentBlocker" /f');
    exec('reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v "ContentBlocker" /f');
  }
}

function preventUninstallation() {
  const appId = 'com.contentblocker.app';
  const keys = [
    `HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${appId}`,
    `HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${appId}`
  ];
  // Remove entire uninstall registry keys so app is invisible in Control Panel & Settings
  keys.forEach(key => {
    exec(`reg delete "${key}" /f`, () => {});
  });

  // Delete uninstaller exe from install directory
  deleteUninstallerExe();
}

function deleteUninstallerExe() {
  const installDir = path.dirname(process.execPath);
  try {
    const files = fs.readdirSync(installDir);
    for (const f of files) {
      const lo = f.toLowerCase();
      if (lo.includes('uninstall') && lo.endsWith('.exe')) {
        const fp = path.join(installDir, f);
        try { fs.unlinkSync(fp); } catch(e) {
          // If locked, try renaming then deleting on reboot
          try {
            const tmp = fp + '.del';
            fs.renameSync(fp, tmp);
            exec(`cmd /c del /f /q "${tmp}"`);
          } catch(e2) {}
        }
      }
    }
  } catch(e) {}
}

// ── Browser title monitor ──────────────────────────────────────────────────
let psMonitor = null;
let psMonitorBuffer = '';

function startBrowsersMonitor() {
  if (psMonitor) return;
  const psScript = `
    $browsers = "chrome","firefox","msedge","opera","brave","vivaldi","iexplore","waterfox","librewolf","thorium","arc","sidekick","ghostery","whale"
    while($true) {
      $p = Get-Process $browsers -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle };
      if ($p) {
        $json = $p | Select-Object -Property Id, MainWindowTitle | ConvertTo-Json -Compress
        Write-Output $json
      }
      Start-Sleep -Seconds 2
    }
  `;
  psMonitor = spawn('powershell', ['-NoProfile', '-NonInteractive', '-Command', psScript]);
  
  psMonitor.stdout.on('data', (data) => {
    psMonitorBuffer += data.toString();
    const lines = psMonitorBuffer.split('\n');
    // Keep the last (potentially incomplete) line in the buffer
    psMonitorBuffer = lines.pop() || '';
    for (let line of lines) {
      line = line.trim();
      if (!line || (!line.startsWith('[') && !line.startsWith('{'))) continue;
      try {
        let processes = JSON.parse(line);
        if (!Array.isArray(processes)) processes = [processes];
        for (const p of processes) {
          if (!p || !p.MainWindowTitle) continue;
          const title = p.MainWindowTitle;
          const lo = title.toLowerCase();
          
          let isWhitelistedAI = false;
          for (const w of WHITELIST_AI_KEYWORDS) {
            if (lo.includes(w)) { isWhitelistedAI = true; break; }
          }

          const allKw = [...BLOCKED_KEYWORDS, ...config.custom_blocked_sites.map(s=>s.toLowerCase())];
          for (const kw of allKw) {
            let matched = false;
            if (kw.length <= 4) {
              // Word boundary check for short keywords to avoid false positives (e.g., Essex)
              const rx = new RegExp('\\b' + escRx(kw) + '\\b', 'i');
              matched = rx.test(title);
            } else {
              matched = lo.includes(kw);
            }

            if (matched) {
              if (isWhitelistedAI && ['ai generator', 'ai chat', 'képgenerátor', 'image generator', 'chatgpt'].includes(kw)) {
                continue;
              }
              triggerBlock(title, kw, p.Id); return;
            }
          }
        }
      } catch(e) {}
    }
  });

  psMonitor.on('exit', () => {
    psMonitor = null;
    psMonitorBuffer = '';
    setTimeout(startBrowsersMonitor, 5000); // Auto-restart if crashed
  });
}

function triggerBlock(title, keyword, pid) {
  const now = Date.now();
  if (keyword === lastNotifKey && now - lastNotifTime < 3000) return;
  lastNotifKey = keyword; lastNotifTime = now;
  config.blocked_count = (config.blocked_count||0)+1;
  saveConfig();
  
  redirectBrowser(pid);
  showNotifWindow(title, keyword);
}

function redirectBrowser(pid) {
  const blockedUrl = "file:///" + BLOCKED_HTML_PATH.replace(/\\/g, '/');
  // Escape single quotes for PowerShell string literal
  const safeUrl = blockedUrl.replace(/'/g, "''");
  const ps = `
    Add-Type -AssemblyName Microsoft.VisualBasic
    Start-Sleep -Milliseconds 50
    try { [Microsoft.VisualBasic.Interaction]::AppActivate(${pid}) } catch {}
    Start-Sleep -Milliseconds 200
    Set-Clipboard -Value '${safeUrl}'
    $wshell = New-Object -ComObject wscript.shell
    $wshell.SendKeys('^l')
    Start-Sleep -Milliseconds 100
    $wshell.SendKeys('^v')
    Start-Sleep -Milliseconds 50
    $wshell.SendKeys('{ENTER}')
  `;
  exec(`powershell -NoProfile -NonInteractive -Command "${ps.replace(/\n/g, '; ')}"`);
}

// ── Notification window ────────────────────────────────────────────────────
function showNotifWindow(title, keyword) {
  if (notifWindow && !notifWindow.isDestroyed()) {
    notifWindow.webContents.send('update-notification', { title, keyword });
    notifWindow.show(); notifWindow.focus(); return;
  }
  const { width } = screen.getPrimaryDisplay().workAreaSize;
  notifWindow = new BrowserWindow({
    width:380, height:180, x: width-400, y:20,
    frame:false, alwaysOnTop:true, skipTaskbar:true, resizable:false,
    transparent:true,
    webPreferences:{ nodeIntegration:false, contextIsolation:true, preload:PRELOAD }
  });
  notifWindow.loadFile(path.join(__dirname,'notification.html'));
  notifWindow.once('ready-to-show', () => {
    notifWindow.webContents.send('update-notification', { title, keyword });
    notifWindow.show();
  });
  notifWindow.on('closed', () => { notifWindow = null; });
  setTimeout(() => { if (notifWindow && !notifWindow.isDestroyed()) notifWindow.close(); }, 9000);
}

// ── Screen time ────────────────────────────────────────────────────────────
function getRemaining() {
  if (config.screen_time_limit <= 0) return -1;
  return Math.max(0, config.screen_time_limit * 60 - screenTimeSecondsUsed);
}

function updateTray() {
  if (!tray || tray.isDestroyed()) return;
  const rem = getRemaining();
  const timeStr = rem < 0 ? tr('tray_unlimited') : fmtTime(rem) + ' ' + tr('tray_left');
  tray.setToolTip(`ContentBlocker  ⏱ ${timeStr}`);
}

function startTimers() {
  // Pause screen time on lock/sleep, resume on unlock/wake
  // Register power monitor events only once to avoid duplicate listeners
  if (!global.__powerMonitorInitialized) {
    powerMonitor.on('lock-screen', () => { screenTimePaused = true; saveConfig(); });
    powerMonitor.on('unlock-screen', () => { screenTimePaused = false; });
    powerMonitor.on('suspend', () => { screenTimePaused = true; saveConfig(); });
    powerMonitor.on('resume', () => { screenTimePaused = false; });
    global.__powerMonitorInitialized = true;
  }
  // Ensure config is saved and app exits gracefully on user session end (logout or shutdown)
  app.on('session-end', () => {
    saveConfig();
    // Attempt to quit the app; if already quitting, this is a no-op
    if (!app.isQuitting) app.quit();
  });

  setInterval(() => {
    if (screenTimePaused) return;
    if (config.screen_time_date !== todayDate()) {
      config.screen_time_date = todayDate(); screenTimeSecondsUsed = 0; limitReached = false;
    }
    screenTimeSecondsUsed++;
    if (screenTimeSecondsUsed % 10 === 0) saveConfig();
    const rem = getRemaining();
    updateTray();
    
    if (rem === 15 * 60 || (rem < 15 * 60 && rem > 15 * 60 - 3 && screenTimeSecondsUsed % 10 === 1)) showTimeNotif(tr('notif_15'));
    if (rem === 5 * 60 || (rem < 5 * 60 && rem > 5 * 60 - 3 && screenTimeSecondsUsed % 10 === 1)) showTimeNotif(tr('notif_5'));
    if (rem === 60 || (rem < 60 && rem > 57 && screenTimeSecondsUsed % 10 === 1)) showTimeNotif(tr('notif_1'));
    
    if (rem === 0 && !limitReached) { limitReached = true; onLimitReached(); }
    // Re-enforce browser closing periodically (not every second) to keep CPU usage low
    if (limitReached && Date.now() - lastCloseOthers > 15000) closeOtherPrograms();
    
    if (screenTimeWindow && !screenTimeWindow.isDestroyed()) {
      screenTimeWindow.webContents.send('time-tick', { remaining: rem, used: screenTimeSecondsUsed, limit: config.screen_time_limit });
    }
  }, 1000);

  // Browser monitor
  startBrowsersMonitor();

  // Self-repair hosts file periodically (every 5 mins)
  setInterval(() => {
    updateHosts();
  }, 5 * 60 * 1000);
}

function onLimitReached() {
  showTimeNotif(tr('notif_limit'));
  lockSystem();
  closeOtherPrograms();
  openScreenTimeWindow();
}

function lockSystem() {
  exec('rundll32.exe user32.dll,LockWorkStation');
}

function closeOtherPrograms() {
  lastCloseOthers = Date.now();
  // Lezár minden böngészőt, de más programokat (Word, Excel stb.) békén hagy
  const browsers = ['chrome','firefox','msedge','opera','brave','vivaldi','iexplore','waterfox','librewolf','thorium','arc','sidekick','ghostery','whale'];
  const nameFilter = browsers.map(b => `$_.ProcessName -eq '${b}'`).join(' -or ');
  const ps = `
    Get-Process | Where-Object { $_.MainWindowTitle -and (${nameFilter}) -and $_.Id -ne ${process.pid} } | Stop-Process -Force -ErrorAction SilentlyContinue
  `;
  exec(`powershell -NoProfile -NonInteractive -Command "${ps.replace(/\n/g, '; ')}"`);
}

function showTimeNotif(body) {
  if (Notification.isSupported()) {
    new Notification({ title: tr('notif_time_title'), body }).show();
  }
}

// ── Window factory ─────────────────────────────────────────────────────────
function makeWindow(file, opts) {
  const w = new BrowserWindow({
    ...opts,
    webPreferences:{ nodeIntegration:false, contextIsolation:true, preload:PRELOAD }
  });
  w.loadFile(path.join(__dirname, file));
  w.setMenu(null);
  return w;
}

function openMainWindow() {
  if (limitReached) { openScreenTimeWindow(); return; }
  if (mainWindow && !mainWindow.isDestroyed()) { mainWindow.show(); mainWindow.focus(); return; }
  mainWindow = makeWindow('index.html', { width:700, height:540, resizable:false });
  mainWindow.on('close', e => { if (!app.isQuitting) { e.preventDefault(); mainWindow.hide(); } });
  mainWindow.on('closed', () => { mainWindow = null; });
}

function openSettingsWindow() {
  if (limitReached) { openScreenTimeWindow(); return; }
  if (settingsWindow && !settingsWindow.isDestroyed()) { settingsWindow.focus(); return; }
  settingsWindow = makeWindow('settings.html', { width:640, height:820, resizable:false });
  settingsWindow.on('closed', () => { settingsWindow = null; });
}

function openScreenTimeWindow() {
  const isTimeUp = getRemaining() === 0;

  if (screenTimeWindow && !screenTimeWindow.isDestroyed()) { 
    if (isTimeUp) {
      screenTimeWindow.setKiosk(true);
      screenTimeWindow.setAlwaysOnTop(true, 'screen-saver');
    } else {
      screenTimeWindow.setKiosk(false);
      screenTimeWindow.setAlwaysOnTop(false);
    }
    screenTimeWindow.show(); 
    screenTimeWindow.focus(); 
    return; 
  }
  
  screenTimeWindow = new BrowserWindow({
    width: 440, height: 600,
    resizable: false,
    kiosk: isTimeUp,
    alwaysOnTop: isTimeUp,
    frame: !isTimeUp,
    skipTaskbar: isTimeUp,
    webPreferences:{ nodeIntegration:false, contextIsolation:true, preload:PRELOAD }
  });
  
  if (isTimeUp) screenTimeWindow.setAlwaysOnTop(true, 'screen-saver');

  screenTimeWindow.loadFile(path.join(__dirname, 'screentime.html'));
  screenTimeWindow.setMenu(null);
  
  screenTimeWindow.on('close', (e) => {
    if (getRemaining() === 0 && !app.isQuitting) {
      e.preventDefault();
    }
  });

  screenTimeWindow.on('closed', () => { screenTimeWindow = null; });
}

// ── Tray ───────────────────────────────────────────────────────────────────
function createTray() {
  const iconPath = path.join(__dirname, '..', 'assets', 'icons', 'win', 'icon.ico');
  tray = new Tray(iconPath);
  tray.setToolTip('ContentBlocker');
  tray.on('click', openMainWindow);
  buildTrayMenu();
}

function buildTrayMenu() {
  if (!tray || tray.isDestroyed()) return;
  const menu = Menu.buildFromTemplate([
    { label:tr('tray_open'),       click: openMainWindow },
    { label:tr('tray_screentime'), click: openScreenTimeWindow },
    { label:tr('tray_settings'),   click: openSettingsWindow },
    { type:'separator' },
    { label:tr('tray_exit'), click: protectExit },
  ]);
  tray.setContextMenu(menu);
}

async function protectExit() {
  if (!config.password_protected) {
    doExit(); return;
  }
  
  // Open a small password prompt window
  let exitWindow = new BrowserWindow({
    width: 300, height: 180, resizable: false, frame: false, alwaysOnTop: true,
    webPreferences: { nodeIntegration: false, contextIsolation: true, preload: PRELOAD }
  });
  
  exitWindow.loadURL(`data:text/html;charset=utf-8,
    <style>
      body{background:%231a1a2e;color:white;font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;margin:0;height:100vh}
      input{padding:8px;margin:10px;border-radius:4px;border:none}
      button{padding:8px 16px;cursor:pointer;background:%2300d4ff;border:none;border-radius:4px;color:black;font-weight:bold}
    </style>
    <div>${tr('exit_prompt')}</div>
    <input type="password" id="p" placeholder="${tr('exit_ph')}" autofocus>
    <div id="e" style="color:red;font-size:12px;margin-bottom:5px"></div>
    <div style="display:flex;gap:10px">
      <button id="b">${tr('exit_ok')}</button>
      <button onclick="window.close()">${tr('exit_cancel')}</button>
    </div>
    <script>
      document.getElementById('b').onclick = async () => {
        const ok = await window.api.checkPassword(document.getElementById('p').value);
        if(ok.ok) window.api.confirmExit();
        else document.getElementById('e').innerText = '${tr('exit_wrong')}';
      };
      document.getElementById('p').onkeydown = e => { if(e.key==='Enter') document.getElementById('b').click(); };
    </script>
  `.replace(/%/g, '%25')); // Simple data URL prompt
}

function doExit() {
  app.isQuitting = true;
  // Kill the watchdog BEFORE quitting, so it doesn't restart us
  if (watchdogProcess) {
    try { process.kill(watchdogProcess.pid); } catch(e) {}
    watchdogProcess = null;
  }
  try { fs.unlinkSync(PID_FILE); } catch(e) {}
  cleanHosts();
  app.quit();
}

ipcMain.on('confirmed-exit', () => doExit());

// ── IPC handlers ───────────────────────────────────────────────────────────
ipcMain.handle('get-config', () => {
  const safe = { ...config };
  delete safe.password_hash;
  safe.screen_time_remaining = getRemaining();
  safe.screen_time_used_seconds = screenTimeSecondsUsed;
  return safe;
});

ipcMain.handle('get-version', () => {
  const pkg = require(path.join(__dirname, '..', 'package.json'));
  return pkg.version;
});

ipcMain.handle('save-config', (_, incoming) => {
  try {
    // Password-protected settings require password to change screen_time_limit
    if (config.password_protected && 'screen_time_limit' in incoming) {
      if (!incoming._password || hashPw(incoming._password) !== config.password_hash) {
        return { success:false, error:tr('err_pw_time') };
      }
    }
    if (incoming.custom_blocked_sites) {
       incoming.custom_blocked_sites = incoming.custom_blocked_sites
         .map(s => s.toLowerCase().replace(/[\s\r\n]/g, '').trim())
         .filter(s => s.length > 1 && s.length < 100);
    }
    const allowedKeys = ['screen_time_limit','auto_start','custom_blocked_sites','lang'];
    for (const k of allowedKeys) { if (k in incoming) config[k] = incoming[k]; }
    saveConfig();
    updateHosts();
    if ('auto_start' in incoming) setAutoStart(incoming.auto_start);
    if ('lang' in incoming) { buildTrayMenu(); updateTray(); }
    broadcastConfigChanged();
    return { success:true };
  } catch(e) { return { success:false, error:e.message }; }
});

ipcMain.handle('check-password', (_, pw) => {
  if (!config.password_protected) return { ok:true };
  return { ok: hashPw(pw) === config.password_hash };
});

ipcMain.handle('set-password', (_, data) => {
  // If password already set, require old password to change it
  if (config.password_protected) {
    const oldPw = typeof data === 'object' ? data.oldPassword : null;
    if (!oldPw || hashPw(oldPw) !== config.password_hash) {
      return { success:false, error:tr('err_pw_old') };
    }
  }
  const newPw = typeof data === 'object' ? data.newPassword : data;
  if (!newPw || newPw.length < 4) return { success:false, error:tr('err_pw_min') };
  config.password_protected = true;
  config.password_hash = hashPw(newPw);
  saveConfig();
  preventUninstallation();
  return { success:true };
});

ipcMain.handle('remove-password', (_, pw) => {
  if (hashPw(pw) !== config.password_hash) return { success:false, error:tr('err_pw_wrong') };
  config.password_protected = false;
  config.password_hash = '';
  saveConfig();
  return { success:true };
});

ipcMain.handle('open-settings',  () => openSettingsWindow());
ipcMain.handle('open-screentime',() => openScreenTimeWindow());

ipcMain.handle('get-screentime-status', () => ({
  remaining: getRemaining(),
  used: screenTimeSecondsUsed,
  limit: config.screen_time_limit,
  limitReached,
}));

ipcMain.handle('add-time', (_, data) => {
  // Password protection: require password if set
  if (config.password_protected) {
    const pw = typeof data === 'object' ? data.password : null;
    if (!pw || hashPw(pw) !== config.password_hash) {
      return { success:false, error:tr('err_pw_wrong') };
    }
  }
  const mins = typeof data === 'object' ? data.mins : data;
  // Validate minutes: must be a positive number, max 120 minutes at a time
  const safeMins = Math.min(120, Math.max(0, parseInt(mins) || 0));
  screenTimeSecondsUsed = Math.max(0, screenTimeSecondsUsed - safeMins * 60);
  limitReached = false;
  saveConfig();
  if (screenTimeWindow && !screenTimeWindow.isDestroyed()) {
    screenTimeWindow.setKiosk(false);
    screenTimeWindow.setAlwaysOnTop(false);
  }
  return { success:true, remaining: getRemaining() };
});

ipcMain.handle('close-notification', () => {
  if (notifWindow && !notifWindow.isDestroyed()) notifWindow.close();
});

ipcMain.handle('get-blocked-count', () => config.blocked_count || 0);

function broadcastConfigChanged() {
  for (const w of [mainWindow, settingsWindow, screenTimeWindow]) {
    if (w && !w.isDestroyed()) w.webContents.send('config-changed', {});
  }
}

// ── App lifecycle ──────────────────────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) { app.quit(); }
else {
  app.on('second-instance', () => { openMainWindow(); });

  app.whenReady().then(() => {
    try {
      fs.writeFileSync(BLOCKED_HTML_PATH, fs.readFileSync(path.join(__dirname, 'blocked.html')));
    } catch(e) {}
    
    loadConfig();
    updateHosts();
    if (config.auto_start) setAutoStart(true);
    if (config.password_protected) preventUninstallation();
    createTray();
    
    if (!process.argv.includes('--hidden')) {
      openMainWindow();
    }
    
    startTimers();
    updateTray();
    
    // Add signal handler for graceful termination (e.g., system shutdown)
    process.on('SIGTERM', () => { saveConfig(); });

    // Persistence: write our PID so the watchdog can track us, and keep a watchdog alive.
    try { fs.writeFileSync(PID_FILE, String(process.pid), 'utf8'); } catch(e) {}
    ensureWatchdog();
  });

  // Spawn the watchdog if one isn't running; respawn it automatically if it dies.
  function ensureWatchdog() {
    if (app.isQuitting) return;
    const watchdogPath = path.join(__dirname, 'watchdog.js');
    watchdogProcess = spawn(process.execPath, [watchdogPath, process.execPath, '--hidden', PID_FILE], {
      detached: true,
      stdio: 'ignore',
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }
    });
    watchdogProcess.on('exit', () => {
      watchdogProcess = null;
      // If the watchdog was killed (e.g. via Task Manager) and we're still running, bring it back.
      if (!app.isQuitting) setTimeout(ensureWatchdog, 1000);
    });
    watchdogProcess.unref();
  }

  app.on('window-all-closed', e => e.preventDefault());
  app.on('quit', () => { saveConfig(); });
  app.on('before-quit', () => { 
    app.isQuitting = true; 
    saveConfig(); 
    if (watchdogProcess) {
      try { process.kill(watchdogProcess.pid); } catch(e) {}
    }
  });
}