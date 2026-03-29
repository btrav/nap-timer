// Color tokens — from the "Drowsy Cozy" design system
// Dark by default, warm amber + dusty lavender palette

export const Colors = {
  // Backgrounds
  sleepBg: '#0F0D1A',        // Deep indigo — default sleep screen
  wakeBg: '#1A1020',         // Slightly warmer, wake screen base

  // Amber sunrise ramp (used in gradual wake animation)
  amberGlowSoft: '#3D2200',  // First hint of warmth
  amberGlowMid: '#7A3D00',   // Mid-sunrise
  amberGlowPeak: '#C46A00',  // Full alarm brightness

  // Text + UI elements
  lavenderMist: '#C9B8E8',   // Primary text at mid-brightness
  lavenderDim: '#6B5F8A',    // Subdued text, pre-wake state
  creamWarm: '#F5DEB3',      // Primary text at full brightness

  // Surfaces
  dismissSurface: '#2A1F3D', // Button backgrounds

  // Preset accent (used for active state, borders)
  accent: '#C46A00',         // Same as amberGlowPeak
};

// Preset nap durations
export const NAP_PRESETS = [
  { label: 'The Reboot', subtext: 'Just enough', minutes: 15 },
  { label: 'The Classic', subtext: 'Time-tested', minutes: 30 },
  { label: 'The Sweet Spot', subtext: 'Deep but not drowsy', minutes: 45 },
  { label: 'The Luxury', subtext: "You've earned it", minutes: 60 },
  { label: 'Full Cycle', subtext: 'One complete sleep loop', minutes: 90 },
] as const;

export type NapPreset = (typeof NAP_PRESETS)[number];

// Alarm sounds (filenames match assets/sounds/ directory)
export const ALARM_SOUNDS = [
  {
    id: 'morning_water',
    label: 'Morning Water',
    description: 'Stream + gentle bowl chimes',
    filename: 'morning_water.mp3',
  },
  {
    id: 'soft_return',
    label: 'Soft Return',
    description: 'Sparse minimalist piano',
    filename: 'soft_return.mp3',
  },
  {
    id: 'still_morning',
    label: 'Still Morning',
    description: 'Curated birdsong, early light',
    filename: 'still_morning.mp3',
  },
] as const;

export type AlarmSoundId = (typeof ALARM_SOUNDS)[number]['id'];

// Notification channel ID — must match throughout the app
export const ALARM_CHANNEL_ID = 'nap-alarm';
