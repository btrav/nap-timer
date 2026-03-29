import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { Colors } from '../constants/theme';
import { cancelAlarm } from '../utils/alarmScheduler';

interface TimerScreenProps {
  durationMinutes: number;
  triggerAtMs: number;
  onCancel: () => void;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function TimerScreen({ durationMinutes, triggerAtMs, onCancel }: TimerScreenProps) {
  const [remainingMs, setRemainingMs] = useState(triggerAtMs - Date.now());
  const breatheAnim = useRef(new Animated.Value(1)).current;
  const cancelPressProgress = useRef(new Animated.Value(0)).current;
  const cancelHoldTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep screen awake while timer is running
  useEffect(() => {
    activateKeepAwakeAsync();
    return () => { deactivateKeepAwake(); };
  }, []);

  // UI countdown (does NOT drive the alarm — AlarmManager handles that)
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = triggerAtMs - Date.now();
      setRemainingMs(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 500);
    return () => clearInterval(interval);
  }, [triggerAtMs]);

  // Breathing glow animation
  useEffect(() => {
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1.08,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    );
    breathe.start();
    return () => breathe.stop();
  }, [breatheAnim]);

  // Long-press cancel (1.5s hold required)
  function handleCancelPressIn() {
    Animated.timing(cancelPressProgress, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: false,
    }).start();

    cancelHoldTimer.current = setTimeout(async () => {
      await cancelAlarm();
      onCancel();
    }, 1500);
  }

  function handleCancelPressOut() {
    Animated.timing(cancelPressProgress, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();

    if (cancelHoldTimer.current) {
      clearTimeout(cancelHoldTimer.current);
      cancelHoldTimer.current = null;
    }
  }

  const cancelBorderColor = cancelPressProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.lavenderDim, Colors.amberGlowPeak],
  });

  const progress = 1 - remainingMs / (durationMinutes * 60 * 1000);

  return (
    <View style={styles.container}>
      <StatusBar style="light" hidden />

      {/* Breathing glow */}
      <Animated.View
        style={[
          styles.breatheGlow,
          { transform: [{ scale: breatheAnim }] },
        ]}
      />

      {/* Countdown */}
      <View style={styles.centerContent}>
        <Text style={styles.countdown}>{formatTime(remainingMs)}</Text>
        <Text style={styles.label}>resting</Text>
      </View>

      {/* Cancel — long press 1.5s */}
      <View style={styles.cancelArea}>
        <Text style={styles.cancelHint}>hold to cancel</Text>
        <Pressable
          onPressIn={handleCancelPressIn}
          onPressOut={handleCancelPressOut}
        >
          <Animated.View style={[styles.cancelButton, { borderColor: cancelBorderColor }]}>
            <Animated.View
              style={[
                styles.cancelFill,
                {
                  width: cancelPressProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
            <Text style={styles.cancelText}>cancel</Text>
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.sleepBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breatheGlow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: Colors.amberGlowSoft,
    opacity: 0.15,
  },
  centerContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  countdown: {
    color: Colors.lavenderMist,
    fontSize: 72,
    fontWeight: '200',
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  label: {
    color: Colors.lavenderDim,
    fontSize: 14,
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginTop: 12,
    fontWeight: '300',
  },
  cancelArea: {
    paddingBottom: 48,
    alignItems: 'center',
    gap: 12,
  },
  cancelHint: {
    color: Colors.lavenderDim,
    fontSize: 12,
    letterSpacing: 1,
    opacity: 0.5,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: Colors.lavenderDim,
    borderRadius: 24,
    height: 48,
    width: 160,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cancelFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Colors.amberGlowSoft,
    opacity: 0.4,
  },
  cancelText: {
    color: Colors.lavenderDim,
    fontSize: 14,
    letterSpacing: 2,
    textTransform: 'lowercase',
  },
});
