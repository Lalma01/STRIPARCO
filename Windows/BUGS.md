# STRIPARCO (Windows) – code analysis / bugs found

Severity: 🔴 high · 🟠 medium · 🟡 low

> **Status: all items below are FIXED** (commit history). The password is now enforced in the
> main process for `screen_time_limit`, `auto_start` and `custom_blocked_sites`; **theme and
> language remain changeable without a password** by design. Time units are localised, the
> clipboard is preserved on redirect, warnings use one-shot flags, and the watchdog/notification
> timer/version-newline issues are resolved.

## 🔴 Settings IPC bypasses the password for everything except the time limit
`save-config` (main.js) only verifies the password when `screen_time_limit` is present.
`custom_blocked_sites`, `auto_start`, `theme` and `lang` can be changed with **no** password,
even when protection is on. The settings window's lock overlay is renderer-side only, so the
IPC channel (e.g. via DevTools) lets a user clear the blocklist or disable auto-start. For a
parental-control app this defeats the protection. Fix: require the password in `save-config`
for *any* protected field, validated in the main process.

## 🟠 `remove-password` ignores the "no password set" case
`remove-password` compares `hashPw(pw) === config.password_hash` without checking
`config.password_protected`. When no password is set, `password_hash` is `''`, so the call
just fails silently instead of being a no-op/clear. Harmless today but fragile.

## 🟠 Browser redirect via SendKeys is unreliable
`redirectBrowser()` activates the window by PID and sends `Ctrl+L / Ctrl+A / Ctrl+V / Enter`.
This breaks if the window isn't focusable, the address-bar shortcut differs, the clipboard is
busy, or a different control has focus — and it silently clobbers the user's clipboard. There
is no verification that the navigation happened.

## 🟠 Hard-coded Hungarian time units leak into English UI
`fmtTime()` (tray tooltip), `index.html` (`${h}ó ${m}p`) and `screentime.html` (`fmtMin`,
clock label) always render `ó/p/mp` regardless of `config.lang`. In English mode the screen
still shows Hungarian units. (The Android port fixes this with localized `unit_*` strings.)

## 🟡 Screen-time warning thresholds are race-prone
The 15/5/1-minute notifications fire on `rem === N*60` or a narrow `rem < N*60 && rem > N*60-3`
window gated by `screenTimeSecondsUsed % 10 === 1`. When counting is paused (lock/idle) exactly
on a boundary, or after `add-time`, a notification can be missed or repeated. A one-shot
"already warned" flag per threshold (as used in the Android `ScreenTimeService`) is more robust.

## 🟡 `add-time` doesn't reset the warning state
After adding time, `limitReached` is cleared but `lastNotifKey/lastNotifTime` and the implicit
15/5/1 thresholds aren't, so warnings may not re-fire on the next descent.

## 🟡 Possible transient double-watchdog
`ensureWatchdog()` respawns a watchdog when it exits; the watchdog, on relaunching main, lets
the *new* main spawn another watchdog before the old one exits. Brief overlap is possible. Not
harmful but can momentarily run two watchdogs.

## 🟡 `showNotifWindow` timer accumulation
Each call schedules an 8s `setTimeout` to close the window; rapid re-shows stack multiple timers
on the same window object. Minor.

## 🟡 `version_bump.js` writes `package.json` without a trailing newline
Cosmetic; causes a one-line diff churn.

## Note (by design, not a bug)
`requestedExecutionLevel: requireAdministrator`, registry edits and the watchdog are intentional
anti-tamper for the parental-control use case.
