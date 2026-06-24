"use client"

import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light"
type ThemeContextValue = { theme: Theme; setTheme: (t: Theme) => void }

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  setTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem("hao-theme-v2") as Theme | null
    if (stored === "light" || stored === "dark") setThemeState(stored)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const root = document.documentElement
    root.classList.remove("dark", "light")
    root.classList.add(theme)
    localStorage.setItem("hao-theme-v2", theme)
  }, [theme, mounted])

  function setTheme(t: Theme) {
    setThemeState(t)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
