import { useCallback, useState } from 'react'

// The pre-hydration script in index.html applies the saved theme before
// React mounts; this hook just mirrors and toggles that state.
export function useTheme() {
  const [dark, setDark] = useState(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false,
  )

  const toggle = useCallback(() => {
    const next = !document.documentElement.classList.contains('dark')
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light')
    } catch {
      // storage unavailable (private mode) — theme still applies for the session
    }
    setDark(next)
  }, [])

  return { dark, toggle }
}
