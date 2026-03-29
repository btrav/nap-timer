const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Config plugin that adds Android-specific permissions and activity flags
 * required for a reliable alarm/timer app.
 *
 * Handles:
 * - showWhenLocked + turnScreenOn on MainActivity (required for wake screen on lock screen)
 * - Ensures all alarm-critical permissions are declared in the manifest
 */
module.exports = function withAlarmPermissions(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;

    // Ensure uses-permission array exists
    if (!manifest.manifest['uses-permission']) {
      manifest.manifest['uses-permission'] = [];
    }

    const requiredPermissions = [
      'android.permission.USE_EXACT_ALARM',
      'android.permission.SCHEDULE_EXACT_ALARM',
      'android.permission.RECEIVE_BOOT_COMPLETED',
      'android.permission.USE_FULL_SCREEN_INTENT',
      'android.permission.WAKE_LOCK',
      'android.permission.VIBRATE',
      'android.permission.POST_NOTIFICATIONS',
      'android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
      'android.permission.ACCESS_NOTIFICATION_POLICY',
      'android.permission.FOREGROUND_SERVICE',
    ];

    requiredPermissions.forEach((permission) => {
      const exists = manifest.manifest['uses-permission'].some(
        (p) => p.$?.['android:name'] === permission
      );
      if (!exists) {
        manifest.manifest['uses-permission'].push({
          $: { 'android:name': permission },
        });
      }
    });

    // Add showWhenLocked and turnScreenOn to MainActivity
    // These allow the wake screen to appear over the lock screen
    const application = manifest.manifest.application?.[0];
    if (application?.activity) {
      const mainActivity = application.activity.find(
        (a) => a.$?.['android:name'] === '.MainActivity'
      );
      if (mainActivity) {
        mainActivity.$['android:showWhenLocked'] = 'true';
        mainActivity.$['android:turnScreenOn'] = 'true';
      }
    }

    return config;
  });
};
