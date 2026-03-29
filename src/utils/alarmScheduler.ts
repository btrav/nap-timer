import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ALARM_CHANNEL_ID, AlarmSoundId } from '../constants/theme';
import { saveActiveAlarm, clearActiveAlarm, getActiveAlarm } from './storage';

/**
 * Schedule the nap alarm.
 * Backed by AlarmManager.setExactAndAllowWhileIdle() on Android via expo-notifications.
 * Also persists state to AsyncStorage for reboot recovery.
 */
export async function scheduleAlarm(
  durationMinutes: number,
  soundId: AlarmSoundId = 'morning_water',
  overrideSeconds?: number  // used by test mode to fire in exactly N seconds
): Promise<string> {
  // Cancel any existing alarm first to avoid phantom alarms
  await cancelAlarm();

  const durationMs = durationMinutes * 60 * 1000;
  const triggerAtMs = Date.now() + durationMs;

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Nap Over',
      body: 'Time to wake up',
      sound: `${soundId}.mp3`,
      priority: 'max',
      sticky: false,
      data: {
        type: 'nap-alarm',
        durationMinutes,
        soundId,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: overrideSeconds ?? durationMinutes * 60,
      channelId: ALARM_CHANNEL_ID, // required on Android 8+
    },
  });

  // Persist for reboot recovery
  await saveActiveAlarm({
    notificationId,
    triggerAtMs,
    durationMinutes,
  });

  return notificationId;
}

/**
 * Cancel the active nap alarm.
 */
export async function cancelAlarm(): Promise<void> {
  const existing = await getActiveAlarm();
  if (existing) {
    await Notifications.cancelScheduledNotificationAsync(existing.notificationId);
  }
  // Cancel all scheduled nap notifications as a safety net
  const all = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of all) {
    if (n.content.data?.type === 'nap-alarm') {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }
  await clearActiveAlarm();
}

/**
 * Check if there is an active alarm scheduled at the OS level.
 * Compares AsyncStorage state vs. actual scheduled notifications
 * to detect reboot-wiped alarms.
 */
export async function checkAndRecoverAlarm(): Promise<{
  wasLost: boolean;
  alarm: Awaited<ReturnType<typeof getActiveAlarm>>;
}> {
  const stored = await getActiveAlarm();
  if (!stored) return { wasLost: false, alarm: null };

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const stillLive = scheduled.find((n) => n.identifier === stored.notificationId);

  if (!stillLive) {
    // Alarm was lost (likely a reboot). Reschedule if still in the future.
    const remaining = stored.triggerAtMs - Date.now();
    if (remaining > 5000) {
      // More than 5 seconds remain — reschedule
      await scheduleAlarm(
        stored.durationMinutes,
        (stored as any).soundId ?? 'morning_water'
      );
      return { wasLost: true, alarm: stored };
    } else {
      // Alarm time has passed — clear stale state
      await clearActiveAlarm();
      return { wasLost: false, alarm: null };
    }
  }

  return { wasLost: false, alarm: stored };
}

/**
 * Returns remaining time in milliseconds for the active alarm, or null.
 */
export async function getRemainingMs(): Promise<number | null> {
  const stored = await getActiveAlarm();
  if (!stored) return null;
  const remaining = stored.triggerAtMs - Date.now();
  return remaining > 0 ? remaining : null;
}
