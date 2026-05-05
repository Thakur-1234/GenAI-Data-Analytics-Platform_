'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark'
type ThemePreference = 'system' | 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  themePreference: ThemePreference
  setThemePreference: (preference: ThemePreference) => void
  toggleTheme: () => void
  isSystemPreference: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
  defaultPreference?: ThemePreference
}

export function ThemeProvider({ children, defaultPreference = 'system' }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>('dark')
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(defaultPreference)
  const [mounted, setMounted] = useState(false)

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    setMounted(true)
    
    // Get stored preference or use default
    const stored = localStorage.getItem('themePreference') as ThemePreference | null
    const preference = stored || defaultPreference
    setThemePreferenceState(preference)

    // Apply theme based on preference
    if (preference === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      setTheme(systemTheme)
      applyThemeToDocument(systemTheme)
    } else {
      setTheme(preference)
      applyThemeToDocument(preference)
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      const currentPreference = localStorage.getItem('themePreference') as ThemePreference | null
      if (currentPreference === 'system' || !currentPreference) {
        const newTheme = e.matches ? 'dark' : 'light'
        setTheme(newTheme)
        applyThemeToDocument(newTheme)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [defaultPreference])

  const applyThemeToDocument = (theme: Theme) => {
    const root = document.documentElement
    
    // Remove both classes first
    root.classList.remove('light', 'dark')
    
    // Add the appropriate class
    root.classList.add(theme)
    root.setAttribute('data-theme', theme)
  }

  const setThemePreference = (preference: ThemePreference) => {
    setThemePreferenceState(preference)
    localStorage.setItem('themePreference', preference)

    let newTheme: Theme
    if (preference === 'system') {
      newTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    } else {
      newTheme = preference
    }
    
    setTheme(newTheme)
    applyThemeToDocument(newTheme)
  }

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    setThemePreference(newTheme)
    applyThemeToDocument(newTheme)
  }

  // Prevent flash by rendering nothing until mounted
  if (!mounted) {
    return null
  }

  return (
    <ThemeContext.Provider 
      value={{ 
        theme, 
        themePreference, 
        setThemePreference, 
        toggleTheme,
        isSystemPreference: themePreference === 'system'
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Hook to get current theme-aware colors for charts
export function useChartTheme() {
  const { theme } = useTheme()
  
  return {
    gridColor: theme === 'dark' ? 'rgba(51, 65, 85, 0.5)' : 'rgba(209, 213, 219, 0.5)',
    axisColor: theme === 'dark' ? '#64748b' : '#9ca3af',
    tooltipBg: theme === 'dark' ? '#1e293b' : '#ffffff',
    tooltipText: theme === 'dark' ? '#f8fafc' : '#111827',
    legendColor: theme === 'dark' ? '#94a3b8' : '#6b7280',
    fontColor: theme === 'dark' ? '#e2e8f0' : '#374151',
  }
}
