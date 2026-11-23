import { useSyncExternalStore } from 'react'

const listeners = new Set<() => void>()
const isDark = () => document.documentElement.classList.contains('dark')

export function setDarkTheme(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark)
  try {
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  } catch {
    /* localStorage indisponível */
  }
  listeners.forEach((l) => l())
}

export function useTheme() {
  const dark = useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    isDark,
    () => false,
  )
  return { theme: dark ? 'dark' : 'light', toggle: () => setDarkTheme(!dark) } as const
}
