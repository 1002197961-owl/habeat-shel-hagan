/** Lossless FRONT-only extracts. Complete reference sheets must never be publicly served. */
export const STATIC_CHARACTERS = {
  R: { name: 'קצב', file: 'Front_R_v1.png', x: 20, y: 112, width: 335, height: 333 },
  G: { name: 'נגינה', file: 'Front_G_v1.png', x: 58, y: 88, width: 255, height: 420 },
  M: { name: 'צלילים', file: 'Front_M_v1.png', x: 80, y: 53, width: 244, height: 415 },
} as const

export type StaticCharacterId = keyof typeof STATIC_CHARACTERS

export function staticCharacterViewport(character: StaticCharacterId) {
  if (!Object.hasOwn(STATIC_CHARACTERS, character)) return null
  const source = STATIC_CHARACTERS[character]
  return { ...source, src: `/assets/characters/front/${source.file}` }
}
