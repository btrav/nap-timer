import React, { useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import { setupNotifications } from './src/utils/notifications';
import { checkAndRecoverAlarm, cancelAlarm, scheduleAlarm } from './src/utils/alarmScheduler';
import { clearActiveAlarm, getSelectedSound, getTestMode } from './src/utils/storage';
import PickerScreen from './src/screens/PickerScreen';
import TimerScreen from './src/screens/TimerScreen';
import WakeScreen from './src/screens/WakeScreen';
import CreditsScreen from './src/screens/CreditsScreen';

type AppScreen = 'picker' | 'timer' | 'wake' | 'credits';

interface TimerState {
  durationMinutes: number;
  triggerAtMs: number;
}

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('picker');
  const [timerState, setTimerState] = useState<TimerState | null>(null);
  const [soundId, setSoundId] = useState('morning_water');
  const [testMode, setTestMode] = useState(false);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // Initialize notification channel and recover any alarm lost to reboot
    async function init() {
      await setupNotifications();
      await getSelectedSound().then(setSoundId);
      await getTestMode().then(setTestMode);

      const { wasLost, alarm } = await checkAndRecoverAlarm();
      if (alarm) {
        setTimerState({ durationMinutes: alarm.durationMinutes, triggerAtMs: alarm.triggerAtMs });
        setScreen('timer');
      }
    }
    init();

    // Listen for alarm notification — transitions to wake screen
    const sub = Notifications.addNotificationReceivedListener((notification) => {
      if (notification.request.content.data?.type === 'nap-alarm') {
        const sId = notification.request.content.data?.soundId as string ?? 'morning_water';
        setSoundId(sId);
        setScreen('wake');
      }
    });

    // Handle notification tap (user taps from notification shade)
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      if (response.notification.request.content.data?.type === 'nap-alarm') {
        setScreen('wake');
      }
    });

    // Re-check alarm state when app comes to foreground
    const appStateSub = AppState.addEventListener('change', async (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        await checkAndRecoverAlarm();
      }
      appState.current = nextState;
    });

    return () => {
      sub.remove();
      responseSub.remove();
      appStateSub.remove();
    };
  }, []);

  function handleTimerStart(durationMinutes: number, triggerAtMs: number) {
    setTimerState({ durationMinutes, triggerAtMs });
    setScreen('timer');
  }

  async function handleTimerCancel() {
    await cancelAlarm();
    setTimerState(null);
    setScreen('picker');
  }

  async function handleWakeDismiss() {
    await clearActiveAlarm();
    setTimerState(null);
    setScreen('picker');
  }

  async function handleSnooze(newTriggerAtMs: number) {
    if (!timerState) return;
    const newDurationMinutes = Math.round((newTriggerAtMs - Date.now()) / 60000);
    await scheduleAlarm(newDurationMinutes, soundId as any);
    setTimerState({ durationMinutes: newDurationMinutes, triggerAtMs: newTriggerAtMs });
    setScreen('timer');
  }

  if (screen === 'timer' && timerState) {
    return (
      <TimerScreen
        durationMinutes={timerState.durationMinutes}
        triggerAtMs={timerState.triggerAtMs}
        onCancel={handleTimerCancel}
      />
    );
  }

  if (screen === 'wake' && timerState) {
    return (
      <WakeScreen
        durationMinutes={timerState.durationMinutes}
        soundId={soundId}
        onDismiss={handleWakeDismiss}
        onSnooze={handleSnooze}
      />
    );
  }

  if (screen === 'credits') {
    return (
      <CreditsScreen
        onClose={() => setScreen('picker')}
        onTestModeChange={setTestMode}
      />
    );
  }

  return (
    <PickerScreen
      onTimerStart={handleTimerStart}
      onOpenCredits={() => setScreen('credits')}
      testMode={testMode}
    />
  );
}
