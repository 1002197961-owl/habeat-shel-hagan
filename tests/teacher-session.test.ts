import { describe, expect, it } from 'vitest'
import {
  DEMO_CHILDREN,
  SESSION_STATIONS,
  applySavedHistory,
  buildSavedSession,
  createBalancedAssignments,
  validateAssignments,
} from '../lib/teacherSession'

describe('teacher session assignment', () => {
  it('assigns every selected child exactly once', () => {
    const assignments = createBalancedAssignments(DEMO_CHILDREN)
    expect(assignments).toHaveLength(DEMO_CHILDREN.length)
    expect(new Set(assignments.map(item => item.childId)).size).toBe(DEMO_CHILDREN.length)
  })

  it('respects station capacity for a full demo group', () => {
    const assignments = createBalancedAssignments(DEMO_CHILDREN)
    for (const station of SESSION_STATIONS) {
      expect(assignments.filter(item => item.stationId === station.id).length)
        .toBeLessThanOrEqual(station.capacity)
    }
  })

  it('prefers a station the child has not experienced', () => {
    const child = { ...DEMO_CHILDREN[0], history: ['rhythm', 'melody', 'voice'] }
    expect(createBalancedAssignments([child])[0].stationId).toBe('digital')
  })

  it('rejects a manual assignment that exceeds capacity', () => {
    const children = DEMO_CHILDREN.slice(0, 3)
    const assignments = children.map(child => ({ childId: child.id, stationId: 'voice' }))
    expect(validateAssignments(children, assignments).valid).toBe(false)
  })

  it('creates a stable serializable session record', () => {
    const assignments = createBalancedAssignments(DEMO_CHILDREN.slice(0, 4))
    const saved = buildSavedSession({
      assignments,
      group: 'a',
      durationMinutes: 10,
      startedAt: new Date('2026-09-17T08:00:00.000Z'),
      completedAt: new Date('2026-09-17T08:10:00.000Z'),
    })
    expect(saved.id).toBe('session-1789632600000')
    expect(JSON.parse(JSON.stringify(saved))).toEqual(saved)
  })

  it('adds saved station history to the matching child only', () => {
    const session = buildSavedSession({
      assignments: [{ childId: 'noa', stationId: 'digital' }],
      group: 'a',
      durationMinutes: 10,
      startedAt: new Date('2026-09-17T08:00:00.000Z'),
      completedAt: new Date('2026-09-17T08:10:00.000Z'),
    })
    const updated = applySavedHistory(DEMO_CHILDREN.slice(0, 2), [session])
    expect(updated[0].history.at(-1)).toBe('digital')
    expect(updated[1].history).toEqual(DEMO_CHILDREN[1].history)
  })
})
