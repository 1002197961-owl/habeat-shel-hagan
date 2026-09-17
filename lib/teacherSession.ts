export type GroupId = 'all' | 'a' | 'b'

export interface ChildProfile {
  id: string
  name: string
  avatar: string
  color: string
  group: Exclude<GroupId, 'all'>
  history: string[]
}

export interface SessionStation {
  id: string
  name: string
  role: string
  emoji: string
  color: string
  capacity: number
}

export interface Assignment {
  childId: string
  stationId: string
}

export interface SavedTeacherSession {
  id: string
  group: GroupId
  durationMinutes: number
  startedAt: string
  completedAt: string
  assignments: Assignment[]
}

export const TEACHER_SESSION_STORAGE_KEY = 'habeat-teacher-sessions-v1'

export const DEMO_CHILDREN: ChildProfile[] = [
  { id: 'noa',   name: 'נועה',   avatar: '🦊', color: '#FF4DA6', group: 'a', history: ['voice', 'rhythm'] },
  { id: 'yoav',  name: 'יואב',   avatar: '🐼', color: '#00B4E6', group: 'a', history: ['melody', 'voice'] },
  { id: 'maya',  name: 'מאיה',   avatar: '🦋', color: '#8B5CF6', group: 'a', history: ['digital', 'melody'] },
  { id: 'adam',  name: 'אדם',    avatar: '🦁', color: '#FFA500', group: 'a', history: ['rhythm', 'digital'] },
  { id: 'tamar', name: 'תמר',    avatar: '🐰', color: '#f43f5e', group: 'b', history: ['voice', 'melody'] },
  { id: 'omri',  name: 'עומרי',  avatar: '🐸', color: '#22C55E', group: 'b', history: ['digital', 'rhythm'] },
  { id: 'lia',   name: 'ליה',    avatar: '🦄', color: '#9333EA', group: 'b', history: ['melody', 'digital'] },
  { id: 'alon',  name: 'אלון',   avatar: '🐻', color: '#EAB308', group: 'b', history: ['rhythm', 'voice'] },
]

export const SESSION_STATIONS: SessionStation[] = [
  { id: 'rhythm',  name: 'רצפת הקצב', role: 'מוביל/ת קצב',   emoji: '🥁', color: '#FFA500', capacity: 2 },
  { id: 'melody',  name: 'גיטרה ורודה', role: 'נגן/ית מנגינה', emoji: '🎸', color: '#FF4DA6', capacity: 2 },
  { id: 'voice',   name: 'עמדת שירה',   role: 'קול מוביל',     emoji: '🎤', color: '#00B4E6', capacity: 2 },
  { id: 'digital', name: 'תחנת טאבלט',  role: 'יוצר/ת דיגיטלי/ת', emoji: '✨', color: '#8B5CF6', capacity: 2 },
]

const historyCount = (child: ChildProfile, stationId: string) =>
  child.history.filter(id => id === stationId).length

export function createBalancedAssignments(
  children: ChildProfile[],
  stations: SessionStation[] = SESSION_STATIONS,
): Assignment[] {
  const loads = new Map(stations.map(station => [station.id, 0]))

  return children.map((child, childIndex) => {
    const available = stations.filter(station => (loads.get(station.id) ?? 0) < station.capacity)
    const candidates = available.length > 0 ? available : stations

    const station = [...candidates].sort((a, b) => {
      const aLoad = loads.get(a.id) ?? 0
      const bLoad = loads.get(b.id) ?? 0
      const aScore = historyCount(child, a.id) * 100 + (aLoad / a.capacity) * 10
      const bScore = historyCount(child, b.id) * 100 + (bLoad / b.capacity) * 10
      if (aScore !== bScore) return aScore - bScore
      return (stations.indexOf(a) + childIndex) % stations.length
        - (stations.indexOf(b) + childIndex) % stations.length
    })[0]

    loads.set(station.id, (loads.get(station.id) ?? 0) + 1)
    return { childId: child.id, stationId: station.id }
  })
}

export function validateAssignments(
  children: ChildProfile[],
  assignments: Assignment[],
  stations: SessionStation[] = SESSION_STATIONS,
): { valid: boolean; message: string } {
  if (children.length === 0) return { valid: false, message: 'יש לבחור לפחות ילד או ילדה אחד.' }
  if (assignments.length !== children.length) return { valid: false, message: 'לא כל הילדים שובצו.' }

  const expected = new Set(children.map(child => child.id))
  const assigned = assignments.map(item => item.childId)
  if (new Set(assigned).size !== assigned.length || assigned.some(id => !expected.has(id))) {
    return { valid: false, message: 'כל ילד וילדה צריכים להופיע פעם אחת בלבד.' }
  }

  for (const station of stations) {
    const count = assignments.filter(item => item.stationId === station.id).length
    if (count > station.capacity) {
      return { valid: false, message: `בתחנת ${station.name} יש יותר מדי משתתפים.` }
    }
  }

  return { valid: true, message: 'החלוקה מאוזנת ומוכנה לאישור.' }
}

export function applySavedHistory(
  children: ChildProfile[],
  sessions: SavedTeacherSession[],
): ChildProfile[] {
  return children.map(child => ({
    ...child,
    history: [
      ...child.history,
      ...sessions.flatMap(session =>
        session.assignments
          .filter(item => item.childId === child.id)
          .map(item => item.stationId),
      ),
    ],
  }))
}

export function buildSavedSession(input: {
  assignments: Assignment[]
  group: GroupId
  durationMinutes: number
  startedAt: Date
  completedAt: Date
}): SavedTeacherSession {
  return {
    id: `session-${input.completedAt.getTime()}`,
    group: input.group,
    durationMinutes: input.durationMinutes,
    startedAt: input.startedAt.toISOString(),
    completedAt: input.completedAt.toISOString(),
    assignments: input.assignments.map(item => ({ ...item })),
  }
}

