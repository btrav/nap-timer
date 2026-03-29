import AsyncStorage from '@react-native-async-storage/async-storage';
import { AlarmSoundId } from '../constants/theme';

const KEYS = {
  ACTIVE_ALARM: 'active_alarm',
  SELECTED_SOUND: 'selected_sound',
  BATTERY_PROMPT_SHOWN: 'battery_prompt_shown',
  TEST_MODE: 'test_mode',
};

export interface ActiveAlarm {
  notificationId: string;
  triggerAtMs: number;
  durationMinutes: number;
}

// ─── Alarm state ────────────────────────────────────────────────────────────

export async function saveActiveAlarm(alarm: ActiveAlarm): Promise<void> {
  await AsyncStorage.setItem(KEYS.ACTIVE_ALARM, JSON.stringify(alarm));
}

export async function getActiveAlarm(): Promise<ActiveAlarm | null> {
  const raw = await AsyncStorage.getItem(KEYS.ACTIVE_ALARM);
  if (!raw) return null;
  const alarm: ActiveAlarm = JSON.parse(raw);
  // Don't return stale alarms from the past
  if (alarm.triggerAtMs <= Date.now()) {
    await clearActiveAlarm();
    return null;
  }
  return alarm;
}

export async function clearActiveAlarm(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.ACTIVE_ALARM);
}

// ─── User preferences ────────────────────────────────────────────────────────

export async function getSelectedSound(): Promise<AlarmSoundId> {
  const raw = await AsyncStorage.getItem(KEYS.SELECTED_SOUND);
  return (raw as AlarmSoundId) ?? 'morning_water';
}

export async function setSelectedSound(soundId: AlarmSoundId): Promise<void> {
  await AsyncStorage.setItem(KEYS.SELECTED_SOUND, soundId);
}

export async function hasBatteryPromptBeenShown(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(KEYS.BATTERY_PROMPT_SHOWN);
  return raw === 'true';
}

export async function markBatteryPromptShown(): Promise<void> {
  await AsyncStorage.setItem(KEYS.BATTERY_PROMPT_SHOWN, 'true');
}

// ─── Test mode ───────────────────────────────────────────────────────────────

export async function getTestMode(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(KEYS.TEST_MODE);
  return raw === 'true';
}

export async function setTestMode(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.TEST_MODE, enabled ? 'true' : 'false');
}
