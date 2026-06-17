# STRIPARCO for Android

Android port of the STRIPARCO content filter & screen-time guard. It keeps **all**
features of the Windows build, re-implemented with native Android mechanisms.

## Feature parity

| Windows (Electron) | Android equivalent |
|---|---|
| Domain blocking via `hosts` file | `FilterVpnService` — local DNS filter (no root) |
| PowerShell browser-title monitor | `MonitorAccessibilityService` |
| Redirect tab → `blocked.html` (SendKeys) | global BACK + `BlockedActivity` |
| Kill browsers when limit reached | full-screen `LockoutActivity` re-raised by the service |
| Screen-time counting + idle/lock pause | `ScreenTimeService` (pauses when screen off) |
| Tray + notifications | foreground-service notifications + alerts |
| Password protection (SHA-256 `pw+cb_v1`) | identical hashing in `Config` |
| Add time (+15 min, max 120) | `ScreenTimeActivity` / `LockoutActivity` |
| Auto-start (scheduled task / Run key) | `BootReceiver` on `BOOT_COMPLETED` |
| Anti-uninstall (registry, watchdog) | Device Admin (`AdminReceiver`) + sticky FGS |
| `nativeTheme` light/dark | AppCompat DayNight (auto + manual) |
| Hungarian / English | `values/` + `values-hu/` string resources |
| Custom blocklist | `Config.customBlocked`, applied to DNS + titles |
| Built-in domains / allow-list / keywords | ported verbatim in `Blocklist` / `TitleEvaluator` |

## Build

Requires Android SDK (platform 34, build-tools 34) and JDK 17.

```bash
cd Android
# generates the pinned Gradle 8.7 wrapper (first time only)
gradle wrapper --gradle-version 8.7
./gradlew assembleRelease      # unsigned APK in app/build/outputs/apk/release
./gradlew assembleDebug        # debug APK
```

Or open the `Android/` folder in Android Studio.

## Required permissions (granted on first run via the **Enable protection** button)

1. **VPN consent** — for the local DNS content filter.
2. **Accessibility service** — to read browser titles/URLs for keyword blocking.
3. **Display over other apps** — for the lockout and blocked screens.
4. **Notifications** (Android 13+) and, optionally, **Device admin** for anti-uninstall.

## Notes / limitations

- The DNS filter blocks plain DNS lookups. Apps that use DoH/DoT with hard-coded
  servers can bypass it — the same class of limitation as a desktop `hosts` file.
- Browser monitoring covers the major Android browsers listed in
  `accessibility_service_config.xml`; add more package names there if needed.
- Everything runs on-device; no data leaves the phone.
