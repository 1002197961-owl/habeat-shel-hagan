import { clsx, type ClassValue } from 'clsx'
export function cn(...inputs: ClassValue[]) { return clsx(inputs) }
export function fmt(secs: number): string { return `${String(Math.floor(secs / 60)).padStart(2,'0')}:${String(secs 