import { MoonIcon, SunIcon } from 'lucide-react'
import { useTheme } from '@/shared/hooks/useTheme'
import { Button } from '@/shared/ui/button'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={dark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      aria-pressed={dark}
    >
      {dark ? <SunIcon aria-hidden /> : <MoonIcon aria-hidden />}
    </Button>
  )
}
