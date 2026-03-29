import { Platform, Alert, Linking } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import { hasBatteryPromptBeenShown, markBatteryPromptShown } from './storage';

/**
 * Shows the OEM-agnostic battery optimization prompt.
 *
 * On Android, aggressive battery optimizers can prevent alarms from firing.
 * This prompt walks the user through granting the battery exemption.
 * Shown once on first launch, never again.
 */
export async function promptBatteryOptimizationIfNeeded(): Promise<void> {
  if (Platform.OS !== 'android') return;

  const alreadyShown = await hasBatteryPromptBeenShown();
  if (alreadyShown) return;

  Alert.alert(
    'One quick thing',
    "Android's battery optimizer can prevent your alarm from firing while you sleep. Tap \"Fix it\" to allow this app to run normally in the background — this takes about 10 seconds.",
    [
      {
        text: 'Fix it',
        onPress: async () => {
          await openBatteryOptimizationSettings();
          await markBatteryPromptShown();
        },
      },
      {
        text: 'Skip for now',
        style: 'cancel',
        onPress: () => markBatteryPromptShown(),
      },
    ]
  );
}

/**
 * Opens battery optimization settings immediately, no prompt.
 * Called directly from the About screen's "Fix alarm reliability" button.
 */
export async function openBatterySettingsNow(): Promise<void> {
  await openBatteryOptimizationSettings();
  await markBatteryPromptShown();
}

/**
 * Opens the most appropriate battery optimization settings screen.
 *
 * Tries in order:
 * 1. Standard Android "ignore battery optimizations" dialog (stock Android + most OEMs)
 * 2. General app settings as fallback
 */
async function openBatteryOptimizationSettings(): Promise<void> {
  const packageName = Application.applicationId ?? 'com.napwise.app';

  try {
    // Standard Android API — opens "Allow background activity" dialog
    // Works on stock Android and most OEMs (including Samsung One UI)
    await IntentLauncher.startActivityAsync(
      'android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
      { data: `package:${packageName}` }
    );
    return;
  } catch {
    // Fallback: open general app settings
  }

  try {
    await IntentLauncher.startActivityAsync(
      'android.settings.APPLICATION_DETAILS_SETTINGS',
      { data: `package:${packageName}` }
    );
  } catch {
    // Last resort: open general settings
    await Linking.openSettings();
  }
}

/**
 * For debugging: returns manufacturer info.
 * Useful to confirm which OEM path we're on during testing.
 */
export function getDeviceManufacturer(): string {
  return Device.manufacturer ?? 'unknown';
}
