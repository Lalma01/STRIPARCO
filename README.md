# 🛡 ContentBlocker

[Magyar leírás lejjebb](#magyar)

A lightweight, powerful Windows-based content filtering and screen time management application.

---

## 🇬🇧 English Documentation

### 🌟 Features
- **NSFW & AI Blocker**: Blocks adult websites, NSFW AI companion/chat sites (e.g. JanitorAI, CrushOn, SpicyChat) and AI image generators using system-level Hosts filtering. Mainstream AI chatbots are intentionally left accessible.
- **Smart keyword filtering**: Unambiguous terms block on a single match, while ambiguous words (e.g. "escort", "dating") only trigger when at least two of them appear together — minimizing false positives.
- **Screen Time Management**: Set a daily limit. Once the limit is reached, the system is locked, and all other applications are automatically closed.
- **Vanguard-Style Persistence**:
  - **Self-Repairing**: Automatically restores the blocklist every 5 minutes if tampered with.
  - **Watchdog Protection**: If the main process is killed, it is immediately restarted.
  - **Hidden & Protected**: Does not appear in the standard "Apps & Features" list and disables uninstallation through the Control Panel.
  - **Password Protected Exit**: Requires an administrator password to close the protection.
- **Browser Monitoring**: Real-time monitoring of browser window titles to block specific keywords and AI tools.
- **Allowlisted AI**: Mainstream AI assistants (ChatGPT, Claude, Gemini, Grok, Perplexity, Copilot, Poe, Pi, You.com) stay accessible; only NSFW AI companions and AI image generators are blocked.
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
- **NSFW és AI blokkoló**: Felnőtt tartalmú weboldalak, NSFW AI „barátnő"/chat oldalak (pl. JanitorAI, CrushOn, SpicyChat) és AI képgenerátorok tiltása rendszerszintű szűréssel. A normál AI chatbotok szándékosan elérhetők maradnak.
- **Okos kulcsszó-szűrés**: Az egyértelmű kifejezések egyetlen találatra is blokkolnak, míg a kétértelmű szavak (pl. „escort", „dating") csak akkor, ha legalább kettő együtt fordul elő — így minimalizálva a téves találatokat.
- **Képernyőidő kezelés**: Napi időkeret állítható be. Ha az idő lejár, a program zárolja a számítógépet és automatikusan bezárja az összes többi futó programot.
- **Vanguard-stílusú védelem**:
  - **Öngyógyító**: 5 percenként ellenőrzi és visszaállítja a tiltólistát, ha valaki módosítaná.
  - **Watchdog (Őrkutya)**: Ha a folyamatot leállítják, azonnal újraindul.
  - **Rejtett és védett**: Nem látszik a "Gépház -> Alkalmazások" listában, és a Vezérlőpultban sem távolítható el.
  - **Jelszóval védett leállítás**: Csak jelszó megadásával lehet kikapcsolni a védelmet.
- **Böngésző figyelés**: Valós időben figyeli a böngészők címsorát a tiltott kulcsszavak kiszűréséhez.
- **Engedélyezett AI**: A bevett AI asszisztensek (ChatGPT, Claude, Gemini, Grok, Perplexity, Copilot, Poe, Pi, You.com) elérhetők maradnak; csak az NSFW AI „barátnő" oldalak és AI képgenerátorok tiltottak.
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
