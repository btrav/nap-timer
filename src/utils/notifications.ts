import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ALARM_CHANNEL_ID } from '../constants/theme';

/**
 * Sets up the notification channel and foreground handler.
 * Must be called once at app startup (in App.tsx) before scheduling any alarms.
 */
export async function setupNotifications(): Promise<void> {
  // Configure how notifications behave when the app is in the foreground
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  if (Platform.OS !== 'android') return;

  // Create the alarm notification channel.
  // IMPORTANT: channel settings are locked after first creation.
  // If you need to change them, increment the channel ID (nap-alarm-v2, etc.)
  await Notifications.setNotificationChannelAsync(ALARM_CHANNEL_ID, {
    name: 'Nap Alarm',
    description: 'Fires when your nap timer ends',
    importance: Notifications.AndroidImportance.MAX,
    sound: 'morning_water.mp3', // default; overridden per-notification
    vibrationPattern: [0, 500, 300, 500, 300, 500],
    enableVibrate: true,
    enableLights: true,
    lightColor: '#C46A00',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: true,
    showBadge: false,
  });
}

/**
 * Requests notification permissions from the user.
 * Returns true if granted.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Checks if notification permissions are currently granted.
 */
export async function hasNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}
