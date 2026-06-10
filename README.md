# 🛡 ContentBlocker

[Magyar leírás lejjebb](#magyar)

A lightweight, powerful Windows-based content filtering and screen time management application.

---

## 🇬🇧 English Documentation

### 🌟 Features
- **NSFW & AI Blocker**: Automatically blocks thousands of adult websites and AI-powered chat/image generator services using system-level DNS/Hosts filtering.
- **Screen Time Management**: Set a daily limit. Once the limit is reached, the system is locked, and all other applications are automatically closed.
- **Vanguard-Style Persistence**:
  - **Self-Repairing**: Automatically restores the blocklist every 5 minutes if tampered with.
  - **Watchdog Protection**: If the main process is killed, it is immediately restarted.
  - **Hidden & Protected**: Does not appear in the standard "Apps & Features" list and disables uninstallation through the Control Panel.
  - **Password Protected Exit**: Requires an administrator password to close the protection.
- **Browser Monitoring**: Real-time monitoring of browser window titles to block specific keywords and AI tools.
- **Allowlisted AI**: Selected AI assistants (Claude.ai, Grok.com, Perplexity.ai, Gemini) stay accessible while other AI chat/image generators are blocked.
- **Bilingual UI**: Switchable English / Hungarian interface (auto-detected on first run).
- **Privacy First**: No data is sent to external servers. All filtering happens locally.

### 🚀 Installation
1. Download the latest installer from the `dist` folder.
2. Run `ContentBlocker Setup *.exe` as Administrator.
3. The app will automatically start in hidden mode (Tray icon).

### ⚙ Settings
- Access settings via the Tray icon (Right-click).
- Choose the interface language (English / Hungarian).
- Set an administrator password to prevent unauthorized changes.
- Add custom domains or keywords to the blocklist.

---

## 🇭🇺 Magyar Dokumentáció

### 🌟 Funkciók
- **NSFW és AI blokkoló**: Több ezer felnőtt tartalmú weboldal és AI csevegő/képgeneráló szolgáltatás automatikus tiltása rendszerszintű szűréssel.
- **Képernyőidő kezelés**: Napi időkeret állítható be. Ha az idő lejár, a program zárolja a számítógépet és automatikusan bezárja az összes többi futó programot.
- **Vanguard-stílusú védelem**:
  - **Öngyógyító**: 5 percenként ellenőrzi és visszaállítja a tiltólistát, ha valaki módosítaná.
  - **Watchdog (Őrkutya)**: Ha a folyamatot leállítják, azonnal újraindul.
  - **Rejtett és védett**: Nem látszik a "Gépház -> Alkalmazások" listában, és a Vezérlőpultban sem távolítható el.
  - **Jelszóval védett leállítás**: Csak jelszó megadásával lehet kikapcsolni a védelmet.
- **Böngésző figyelés**: Valós időben figyeli a böngészők címsorát a tiltott kulcsszavak kiszűréséhez.
- **Engedélyezett AI**: Kiválasztott AI asszisztensek (Claude.ai, Grok.com, Perplexity.ai, Gemini) elérhetők maradnak, miközben a többi AI chat/képgenerátor tiltott.
- **Kétnyelvű felület**: Váltható angol / magyar nyelv (első indításkor automatikus felismerés).
- **Adatvédelem**: Semmilyen adatot nem küld külső szerverre, minden szűrés helyben történik.

### 🚀 Telepítés
1. Töltsd le a legfrissebb telepítőt a `dist` mappából.
2. Futtasd a `ContentBlocker Setup *.exe` fájlt Rendszergazdaként.
3. A program automatikusan elindul rejtett módban (Tálca ikon).

### ⚙ Beállítások
- A beállításokat a Tálca ikonra (Jobb klikk) kattintva érheted el.
- Válaszd ki a felület nyelvét (angol / magyar).
- Állíts be egy adminisztrátori jelszót, hogy mások ne tudják módosítani a szűrést.
- Adj hozzá egyéni domaineket vagy kulcsszavakat a tiltólistához.

---

## 🛠 Technical Details / Technikai adatok
- **Tech Stack**: Electron, Node.js, PowerShell.
- **Method**: Modifies `C:\Windows\System32\drivers\etc\hosts` and monitors process window titles.
- **Registry**: Modifies `HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall` for persistence.

*Created by Lalma01 using Google Antigravity IDE*
