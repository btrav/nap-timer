import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Audio } from 'expo-av';
import { Colors } from '../constants/theme';
import { clearActiveAlarm } from '../utils/storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Ramp timing (ms) — the 45-second gradual wake sequence
const RAMP = {
  SCREEN_ON: 10_000,
  SOFT_DAWN: 15_000,
  MORNING_WARMTH: 25_000,
  FULL_PRESENCE: 35_000,
  FULL_ALARM: 45_000,
  SUSTAIN_VOLUME: 0.85,
};

const SNOOZE_MINUTES = 10;

// Require() map — bundled assets must be loaded this way, not via URI string
const SOUND_MAP: Record<string, any> = {
  morning_water: require('../../assets/sounds/morning_water.mp3'),
  soft_return: require('../../assets/sounds/soft_return.mp3'),
  still_morning: require('../../assets/sounds/still_morning.mp3'),
};

interface WakeScreenProps {
  durationMinutes: number;
  soundId?: string;
  onDismiss: () => void;
  onSnooze: (newTriggerAtMs: number) => void;
}

export default function WakeScreen({
  durationMinutes,
  soundId = 'morning_water',
  onDismiss,
  onSnooze,
}: WakeScreenProps) {
  const [showDismiss, setShowDismiss] = useState(false);
  const [showSnooze, setShowSnooze] = useState(false);
  const [snoozeCount, setSnoozeCount] = useState(0);

  // useNativeDriver: false — animating backgroundColor, width, height (not supported by native driver)
  const screenBrightness = useRef(new Animated.Value(0)).current;
  const floorGlowProgress = useRef(new Animated.Value(0)).current; // drives size + color + opacity together

  // useNativeDriver: true — pure opacity only
  const haloOpacity = useRef(new Animated.Value(0)).current;
  const timeOpacity = useRef(new Animated.Value(0)).current;
  const dismissOpacity = useRef(new Animated.Value(0)).current;
  const snoozeOpacity = useRef(new Animated.Value(0)).current;

  const soundRef = useRef<Audio.Sound | null>(null);
  const volumeInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    startGradualWake();
    return () => { cleanup(); };
  }, []);

  async function startGradualWake() {
    // Background brightens over full ramp — JS driver (backgroundColor)
    Animated.timing(screenBrightness, {
      toValue: 1,
      duration: RAMP.FULL_ALARM,
      useNativeDriver: false,
    }).start();

    // Floor glow: size + color driven by one value — JS driver (width/height/backgroundColor)
    setTimeout(() => {
      Animated.timing(floorGlowProgress, {
        toValue: 1,
        duration: RAMP.FULL_ALARM - RAMP.SCREEN_ON,
        useNativeDriver: false,
      }).start();
    }, RAMP.SCREEN_ON);

    // Center halo fade — native driver (opacity only)
    setTimeout(() => {
      Animated.timing(haloOpacity, {
        toValue: 0.8,
        duration: RAMP.FULL_ALARM - 12_000,
        useNativeDriver: true,
      }).start();
    }, 12_000);

    // Time display fades in — native driver (opacity only)
    setTimeout(() => {
      Animated.timing(timeOpacity, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }).start();
    }, RAMP.SOFT_DAWN);

    // Dismiss button appears — native driver (opacity only)
    setTimeout(() => {
      setShowDismiss(true);
      Animated.timing(dismissOpacity, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }).start();
    }, RAMP.MORNING_WARMTH);

    // Snooze appears — native driver (opacity only)
    setTimeout(() => {
      setShowSnooze(true);
      Animated.timing(snoozeOpacity, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }).start();
    }, RAMP.FULL_PRESENCE);

    await startAudioRamp(soundId);
  }

  async function startAudioRamp(sound: string) {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
      });

      const asset = SOUND_MAP[sound] ?? SOUND_MAP['morning_water'];
      const { sound: audioSound } = await Audio.Sound.createAsync(
        asset,
        { shouldPlay: true, volume: 0.05, isLooping: true }
      );
      soundRef.current = audioSound;

      // Ramp volume from 5% → 85% over 45 seconds
      let currentVolume = 0.05;
      const increment = (RAMP.SUSTAIN_VOLUME - currentVolume) / 45;

      volumeInterval.current = setInterval(async () => {
        currentVolume = Math.min(currentVolume + increment, RAMP.SUSTAIN_VOLUME);
        await soundRef.current?.setVolumeAsync(currentVolume);
        if (currentVolume >= RAMP.SUSTAIN_VOLUME) {
          clearInterval(volumeInterval.current!);
        }
      }, 1000);
    } catch (e) {
      console.warn('Audio ramp failed:', e);
      // Visual ramp continues even if audio fails
    }
  }

  async function cleanup() {
    if (volumeInterval.current) clearInterval(volumeInterval.current);
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (_) {}
    }
  }

  async function handleDismiss() {
    await cleanup();
    await clearActiveAlarm();
    setTimeout(onDismiss, 300);
  }

  async function handleSnooze() {
    await cleanup();
    const newTriggerAtMs = Date.now() + SNOOZE_MINUTES * 60 * 1000;
    setSnoozeCount((c) => c + 1);
    onSnooze(newTriggerAtMs);
  }

  // All interpolations from JS-driver values
  const bgColor = screenBrightness.interpolate({
    inputRange: [0, 0.3, 0.7, 1],
    outputRange: ['#0F0D1A', '#1A1020', '#2A1A0A', '#2A1A0A'],
  });

  const floorGlowSize = floorGlowProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCREEN_HEIGHT * 1.4],
  });

  const floorGlowColor = floorGlowProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [Colors.amberGlowSoft, Colors.amberGlowMid, Colors.amberGlowPeak],
  });

  const floorGlowOpacity = floorGlowProgress.interpolate({
    inputRange: [0, 0.1, 1],
    outputRange: [0, 0.6, 0.95],
  });

  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <Animated.View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar style="light" hidden />

      {/* Floor glow — all animated props use JS driver, borderRadius is static large number */}
      <Animated.View
        style={[
          styles.floorGlow,
          {
            width: floorGlowSize,
            height: floorGlowSize,
            backgroundColor: floorGlowColor,
            opacity: floorGlowOpacity,
          },
        ]}
      />

      {/* Center halo — opacity only, native driver */}
      <Animated.View style={[styles.halo, { opacity: haloOpacity }]} />

      {/* Time display — opacity only, native driver */}
      <Animated.View style={[styles.timeContainer, { opacity: timeOpacity }]}>
        <Text style={styles.timeText}>{timeString}</Text>
        <Text style={styles.wakeLabel}>nap over</Text>
      </Animated.View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        {showSnooze && snoozeCount < 1 && (
          <Animated.View style={{ opacity: snoozeOpacity }}>
            <TouchableOpacity onPress={handleSnooze} style={styles.snoozeButton}>
              <Text style={styles.snoozeText}>10 more</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {showDismiss && (
          <Animated.View style={[styles.dismissWrapper, { opacity: dismissOpacity }]}>
            <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
              <Text style={styles.dismissText}>I'm up</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floorGlow: {
    position: 'absolute',
    bottom: -SCREEN_HEIGHT * 0.7,
    alignSelf: 'center',
    borderRadius: 9999, // static large number — always a circle
  },
  halo: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_WIDTH * 0.9,
    borderRadius: (SCREEN_WIDTH * 0.9) / 2,
    backgroundColor: Colors.amberGlowMid,
    top: SCREEN_HEIGHT * 0.3,
  },
  timeContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  timeText: {
    color: Colors.creamWarm,
    fontSize: 56,
    fontWeight: '300',
    letterSpacing: -1,
  },
  wakeLabel: {
    color: Colors.lavenderMist,
    fontSize: 14,
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginTop: 12,
    fontWeight: '300',
    opacity: 0.7,
  },
  actionsContainer: {
    paddingBottom: 56,
    paddingHorizontal: 24,
    width: '100%',
    gap: 16,
    alignItems: 'center',
  },
  snoozeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  snoozeText: {
    color: Colors.lavenderDim,
    fontSize: 15,
    letterSpacing: 1,
  },
  dismissWrapper: {
    width: '100%',
  },
  dismissButton: {
    backgroundColor: Colors.dismissSurface,
    borderRadius: 20,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.amberGlowPeak,
  },
  dismissText: {
    color: Colors.creamWarm,
    fontSize: 20,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
