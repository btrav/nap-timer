import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Colors, NAP_PRESETS, NapPreset, AlarmSoundId } from '../constants/theme';
import { scheduleAlarm } from '../utils/alarmScheduler';
import { getSelectedSound, getTestMode } from '../utils/storage';
import { requestNotificationPermissions } from '../utils/notifications';
import { promptBatteryOptimizationIfNeeded } from '../utils/batteryOptimization';

const TEST_PRESET = {
  label: 'Quick Test',
  subtext: '10 seconds',
  minutes: 10 / 60, // stored as fractional minutes, scheduled as seconds
} as const;

interface PickerScreenProps {
  onTimerStart: (durationMinutes: number, triggerAtMs: number) => void;
  onOpenCredits: () => void;
  testMode: boolean;
}

export default function PickerScreen({ onTimerStart, onOpenCredits, testMode }: PickerScreenProps) {
  const [selected, setSelected] = useState<NapPreset>(NAP_PRESETS[1]); // Default: The Classic (30m)
  const [isTestSelected, setIsTestSelected] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [soundId, setSoundId] = useState<AlarmSoundId>('morning_water');

  const timeOfDay = new Date().getHours();
  const startLabel =
    timeOfDay < 14 ? 'Nap' : timeOfDay < 21 ? 'Rest' : 'Sleep a little';

  useEffect(() => {
    // Load user's preferred sound
    getSelectedSound().then(setSoundId);
    // Prompt for battery optimization on first launch
    promptBatteryOptimizationIfNeeded();
  }, []);

  async function handleStart() {
    if (isStarting) return;
    setIsStarting(true);

    try {
      const hasPermission = await requestNotificationPermissions();
      if (!hasPermission) {
        // TODO: show a user-friendly explanation why notifications are required
        setIsStarting(false);
        return;
      }

      const durationMinutes = isTestSelected ? TEST_PRESET.minutes : selected.minutes;
      const durationMs = isTestSelected ? 10_000 : selected.minutes * 60 * 1000;
      const triggerAtMs = Date.now() + durationMs;
      await scheduleAlarm(durationMinutes, soundId, isTestSelected ? 10 : undefined);
      onTimerStart(durationMinutes, triggerAtMs);
    } catch (e) {
      console.error('Failed to schedule alarm:', e);
      setIsStarting(false);
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appLabel}>nap</Text>
      </View>

      {/* Preset list */}
      <View style={styles.presets}>
        {testMode && (
          <Pressable
            style={[styles.presetCard, styles.presetCardTest, isTestSelected && styles.presetCardActive]}
            onPress={() => { setIsTestSelected(true); }}
            android_ripple={{ color: Colors.amberGlowSoft }}
          >
            <View style={styles.presetRow}>
              <Text style={[styles.presetName, isTestSelected && styles.presetNameActive]}>
                {TEST_PRESET.label}
              </Text>
              <Text style={[styles.presetDuration, isTestSelected && styles.presetDurationActive]}>
                10s
              </Text>
            </View>
            <Text style={[styles.presetSubtext, isTestSelected && styles.presetSubtextActive]}>
              {TEST_PRESET.subtext}
            </Text>
          </Pressable>
        )}
        {NAP_PRESETS.map((preset) => {
          const isActive = !isTestSelected && preset.minutes === selected.minutes;
          return (
            <Pressable
              key={preset.minutes}
              style={[styles.presetCard, isActive && styles.presetCardActive]}
              onPress={() => { setSelected(preset); setIsTestSelected(false); }}
              android_ripple={{ color: Colors.amberGlowSoft }}
            >
              <View style={styles.presetRow}>
                <Text style={[styles.presetName, isActive && styles.presetNameActive]}>
                  {preset.label}
                </Text>
                <Text style={[styles.presetDuration, isActive && styles.presetDurationActive]}>
                  {preset.minutes < 60
                    ? `${preset.minutes}m`
                    : `${preset.minutes / 60}h`}
                </Text>
              </View>
              <Text style={[styles.presetSubtext, isActive && styles.presetSubtextActive]}>
                {preset.subtext}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Credits link */}
      <TouchableOpacity onPress={onOpenCredits} style={styles.creditsLink}>
        <Text style={styles.creditsText}>about & credits</Text>
      </TouchableOpacity>

      {/* Start button */}
      <TouchableOpacity
        style={[styles.startButton, isStarting && styles.startButtonLoading]}
        onPress={handleStart}
        activeOpacity={0.85}
        disabled={isStarting}
      >
        <Text style={styles.startLabel}>{isStarting ? '...' : startLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.sleepBg,
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 40,
  },
  appLabel: {
    color: Colors.lavenderDim,
    fontSize: 14,
    letterSpacing: 4,
    textTransform: 'uppercase',
    fontWeight: '300',
  },
  presets: {
    flex: 1,
    gap: 12,
  },
  presetCard: {
    backgroundColor: Colors.dismissSurface,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  presetCardTest: {
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: Colors.lavenderDim,
    backgroundColor: 'transparent',
  },
  presetCardActive: {
    borderColor: Colors.amberGlowPeak,
    backgroundColor: '#1E1630',
  },
  presetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  presetName: {
    color: Colors.lavenderDim,
    fontSize: 17,
    fontWeight: '500',
  },
  presetNameActive: {
    color: Colors.lavenderMist,
  },
  presetDuration: {
    color: Colors.lavenderDim,
    fontSize: 17,
    fontWeight: '300',
  },
  presetDurationActive: {
    color: Colors.amberGlowPeak,
  },
  presetSubtext: {
    color: Colors.lavenderDim,
    fontSize: 13,
    fontWeight: '300',
    opacity: 0.6,
  },
  presetSubtextActive: {
    color: Colors.lavenderMist,
    opacity: 0.8,
  },
  startButton: {
    backgroundColor: Colors.amberGlowPeak,
    borderRadius: 20,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  startButtonLoading: {
    opacity: 0.6,
  },
  creditsLink: {
    alignSelf: 'center',
    paddingVertical: 8,
    marginTop: 8,
  },
  creditsText: {
    color: Colors.lavenderDim,
    fontSize: 12,
    letterSpacing: 1,
    opacity: 0.5,
  },
  startLabel: {
    color: Colors.sleepBg,
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
