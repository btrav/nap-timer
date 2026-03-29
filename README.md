# Napwise — Nap Timer & Gentle Wake

A personal Android nap timer built around one idea: waking up shouldn't feel like an emergency.

Instead of a jarring alarm, Napwise eases you out of sleep with a 45-second gradual wake sequence — the screen slowly brightens from deep indigo to warm amber sunrise, audio ramps from a whisper to full volume, and the dismiss button only appears once you've had a moment to surface.

No accounts. No ads. No internet required.

---

## Presets

| Name | Duration | |
|---|---|---|
| The Reboot | 15 min | Just enough |
| The Classic | 30 min | Time-tested |
| The Sweet Spot | 45 min | Deep but not drowsy |
| The Luxury | 60 min | You've earned it |
| Full Cycle | 90 min | One complete sleep loop |

---

## Wake Ramp

The 45-second gradual wake sequence is the core feature:

| Time | What happens |
|---|---|
| T+0s | Screen begins brightening (deep indigo → warm amber) |
| T+10s | Floor glow rises from the bottom of the screen |
| T+15s | Audio starts at 5% volume and ramps upward |
| T+25s | "I'm up" dismiss button fades in |
| T+35s | "10 more" snooze option appears (one snooze allowed) |
| T+45s | Audio reaches 85% volume and holds |

---

## Alarm Sounds

- **Morning Water** — stream + gentle bowl chimes
- **Soft Return** — sparse minimalist piano
- **Still Morning** — curated birdsong, early light

Music by [Javolenus](https://ccmixter.org/people/Javolenus), licensed [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/). See [CREDITS.md](./CREDITS.md) for full attribution.

---

## Stack

- [Expo](https://expo.dev) managed workflow (TypeScript)
- `expo-notifications` — alarm trigger via Android's `AlarmManager.setExactAndAllowWhileIdle()`
- `expo-av` — audio playback with volume ramp
- `expo-keep-awake`, `react-native-reanimated`, `react-native-svg`
- `AsyncStorage` — alarm state persistence + reboot recovery
- Config plugin (`plugins/withAlarmPermissions.js`) — injects all required Android permissions and `showWhenLocked` / `turnScreenOn` into `MainActivity`

---

## Android Reliability Notes

Samsung (and other OEM) battery optimizers can kill scheduled alarms. The app prompts on first launch to open battery optimization settings, and the **About & Credits** screen includes a persistent "Fix alarm reliability" button that takes you directly there.

Tested on: Samsung Galaxy S25 (SM-S931U), One UI 7, Android 15.

---

## Build

```bash
cd ~/Projects/nap-timer
ANDROID_HOME=~/Library/Android/sdk npx expo run:android
```

Requires Android SDK and JDK 17+ (`brew install --cask temurin@17`).

---

## Status

Personal project, not yet on the Play Store. V1 features are complete. Deferred to V2: nap log, hard-stop "don't sleep past..." time, app icon.
