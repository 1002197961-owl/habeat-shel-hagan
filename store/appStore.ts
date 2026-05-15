import { create } from 'zustand'
import { PILOT_STATIONS, MOCK_CLIPS, type Station, type Clip } from '@/lib/mockData'

interface AppState {
  // ── Teacher mode ──────────────────────────────
  isTeacherMode: boolean
  teacherName: string
  gardenName: string
  toggleTeacherMode: () => void

  // ── Active station ────────────────────────────
  activeStationIndex: number
  setActiveStationIndex: (i: number) => void

  // ── Activity timer ────────────────────────────
  timerSecs: number
  timerRunning: boolean
  setTimerSecs: (s: number) => void
  setTimerRunning: (r: boolean) => void

  // ── Pilot stations ────────────────────────────
  stations: Station[]
  toggleStation: (id: number) => void

  // ── Activity log ──────────────────────────────
  activityLog: string[]
  addLog: (entry: string) => void

  // ── Recordings ────────────────────────────────
  clips: Clip[]
  addClip: (name: string, duration: string) => void

  // ── Teacher settings ──────────────────────────
  settings: {
    lockScreens:      boolean
    quietMode:        boolean
    groupRecording:   boolean
    aiSongs:          boolean
    activityTimer:    boolean
  }
  toggleSetting: (key: keyof AppState['settings']) => void
  timerMinutes: number
  setTimerMinutes: (m: number) => void
  activeGroup: string
  setActiveGroup: (g: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  // Teacher mode
  isTeacherMode: false,
  teacherName:   'שרה לוי',
  gardenName:    'גן שושנים',
  toggleTeacherMode: () => set((s) => ({ isTeacherMode: !s.isTeacherMode })),

  // Active station
  activeStationIndex: 0,
  setActiveStationIndex: (i) => set({ activeStationIndex: i }),

  // Timer
  timerSecs:    600,
  timerRunning: false,
  setTimerSecs:    (timerSecs)    => set({ timerSecs }),
  setTimerRunning: (timerRunning) => set({ timerRunning }),

  // Stations
  stations: PILOT_STATIONS,
  toggleStation: (id) =>
    set((s) => ({
      stations: s.stations.map((st) =>
        st.id === id ? { ...st, active: !st.active } : st
      ),
    })),

  // Activity log
  activityLog: [
    '10:00 — נפתחה פעילות הביט 🎵',
    '09:55 — כל הילדים בתחנות ✅',
  ],
  addLog: (entry) =>
    set((s) => ({ activityLog: [entry, ...s.activityLog.slice(0, 9)] })),

  // Clips
  clips: MOCK_CLIPS,
  addClip: (name, duration) =>
    set((s) => ({
      clips: [
        { id: Date.now(), name, duration, date: 'עכשיו', emoji: '🆕' },
        ...s.clips,
      ],
    })),

  // Teacher settings
  settings: {
    lockScreens:    false,
    quietMode:      true,
    groupRecording: true,
    aiSongs:        true,
    activityTimer:  true,
  },
  toggleSetting: (key) =>
    set((s) => ({ settings: { ...s.settings, [key]: !s.settings[key] } })),
  timerMinutes: 10,
  setTimerMinutes: (timerMinutes) => set({ timerMinutes }),
  activeGroup: 'כל הגן',
  setActiveGroup: (activeGroup) => set({ activeGroup }),
}))
