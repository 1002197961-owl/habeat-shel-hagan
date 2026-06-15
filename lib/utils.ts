import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function fmt(secs: number): string {
  const m = String(Math.floor(secs / 60)).padStart(2, '0')
  const s = String(secs % 60).padStart(2, '0')
  return m + ':' + s
}

export function fmtShort(secs: number): string {
  return String(Math.floor(secs / 60)) + ':' + String(secs % 60).padStart(2, '0')
}
