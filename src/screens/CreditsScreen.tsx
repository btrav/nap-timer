import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ScrollView,
  Switch,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../constants/theme';
import { getTestMode, setTestMode } from '../utils/storage';
import { openBatterySettingsNow } from '../utils/batteryOptimization';

interface CreditsScreenProps {
  onClose: () => void;
  onTestModeChange: (enabled: boolean) => void;
}

export default function CreditsScreen({ onClose, onTestModeChange }: CreditsScreenProps) {
  const [testMode, setTestModeState] = useState(false);

  useEffect(() => {
    getTestMode().then(setTestModeState);
  }, []);

  async function handleTestModeToggle(value: boolean) {
    setTestModeState(value);
    await setTestMode(value);
    onTestModeChange(value);
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>← back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>about</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {/* ── Developer ── */}
        <Text style={styles.sectionLabel}>developer</Text>

        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>Test mode</Text>
            <Text style={styles.rowSub}>Adds a 10-second preset for testing</Text>
          </View>
          <Switch
            value={testMode}
            onValueChange={handleTestModeToggle}
            trackColor={{ false: Colors.dismissSurface, true: Colors.amberGlowMid }}
            thumbColor={testMode ? Colors.amberGlowPeak : Colors.lavenderDim}
          />
        </View>

        {Platform.OS === 'android' && (
          <>
            <View style={styles.divider} />
            <Text style={styles.sectionLabel}>alarm reliability</Text>
            <Text style={styles.body}>
              If your alarm didn't fire with the screen off, Android's battery optimizer
              may have blocked it. Tap below to fix it.
            </Text>
            <TouchableOpacity style={styles.fixButton} onPress={openBatterySettingsNow}>
              <Text style={styles.fixButtonText}>Fix alarm reliability →</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.divider} />

        {/* ── Music ── */}
        <Text style={styles.sectionLabel}>music</Text>

        <Text style={styles.body}>
          The alarm sounds in Napwise are adapted from works by{' '}
          <Text
            style={styles.link}
            onPress={() => Linking.openURL('https://ccmixter.org/people/Javolenus')}
          >
            Javolenus
          </Text>
          , available on ccmixter.org.
        </Text>

        <View style={styles.trackList}>
          {[
            { appName: 'Morning Water', originalTitle: 'No Plan A' },
            { appName: 'Soft Return', originalTitle: 'Service-charge Blues' },
            { appName: 'Still Morning', originalTitle: 'Weather Or Not' },
          ].map((track) => (
            <View key={track.appName} style={styles.trackRow}>
              <Text style={styles.trackAppName}>{track.appName}</Text>
              <Text style={styles.trackOriginal}>"{track.originalTitle}"</Text>
            </View>
          ))}
        </View>

        <Text style={styles.body}>
          Licensed under{' '}
          <Text
            style={styles.link}
            onPress={() => Linking.openURL('https://creativecommons.org/licenses/by-nc/4.0/')}
          >
            CC BY-NC 4.0
          </Text>
          . Tracks were renamed and used as gradual-wake alarm sounds.
        </Text>

        <View style={styles.divider} />

        {/* ── App ── */}
        <Text style={styles.sectionLabel}>app</Text>
        <Text style={styles.body}>
          Napwise is a simple nap timer with a 45-second gradual wake-up.
          No accounts. No ads. Works offline.
        </Text>

        <Text style={styles.version}>v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.sleepBg,
  },
  header: {
    paddingTop: 64,
    paddingHorizontal: 24,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  closeButton: {
    paddingVertical: 8,
  },
  closeText: {
    color: Colors.lavenderDim,
    fontSize: 14,
    letterSpacing: 1,
  },
  title: {
    color: Colors.lavenderDim,
    fontSize: 14,
    letterSpacing: 4,
    textTransform: 'uppercase',
    fontWeight: '300',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    gap: 16,
  },
  sectionLabel: {
    color: Colors.lavenderDim,
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.dismissSurface,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowText: {
    flex: 1,
    marginRight: 12,
  },
  rowLabel: {
    color: Colors.lavenderMist,
    fontSize: 15,
    fontWeight: '400',
  },
  rowSub: {
    color: Colors.lavenderDim,
    fontSize: 12,
    marginTop: 2,
  },
  body: {
    color: Colors.lavenderMist,
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '300',
  },
  fixButton: {
    backgroundColor: Colors.dismissSurface,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.amberGlowMid,
  },
  fixButtonText: {
    color: Colors.amberGlowPeak,
    fontSize: 15,
    fontWeight: '500',
  },
  link: {
    color: Colors.amberGlowPeak,
    textDecorationLine: 'underline',
  },
  trackList: {
    gap: 10,
    paddingLeft: 8,
  },
  trackRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackAppName: {
    color: Colors.lavenderMist,
    fontSize: 14,
    fontWeight: '400',
  },
  trackOriginal: {
    color: Colors.lavenderDim,
    fontSize: 13,
    fontWeight: '300',
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.dismissSurface,
    marginVertical: 8,
  },
  version: {
    color: Colors.lavenderDim,
    fontSize: 12,
    opacity: 0.4,
    marginTop: 32,
  },
});
