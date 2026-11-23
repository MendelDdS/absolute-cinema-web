import { ArmchairIcon, CalendarDaysIcon, FilmIcon, ShieldCheckIcon } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router'
import { ThemeToggle } from '@/shared/components/theme-toggle'
import { cn } from '@/shared/lib/utils'
import { buttonVariants } from '@/shared/ui/button'

const nav = [
  { to: '/admin/movies', label: 'Filmes', icon: FilmIcon },
  { to: '/admin/rooms', label: 'Salas', icon: ArmchairIcon },
  { to: '/admin/sessions', label: 'Sessões', icon: CalendarDaysIcon },
  { to: '/admin/validate', label: 'Portaria', icon: ShieldCheckIcon },
]

/** Layout isolado da área administrativa (sem login por enquanto; ponto único para plugar auth). */
export function AdminLayout() {
  return (
    <div className="bg-muted/30 min-h-svh">
      <a
        href="#main"
        className="focus:bg-background sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:px-3 focus:py-2"
      >
        Pular para o conteúdo
      </a>
      <header className="bg-background border-b">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <Link to="/admin" className="font-bold">
            Absolute Cinema <span className="text-muted-foreground">· Admin</span>
          </Link>
          <nav
            aria-label="Administração"
            className="order-last flex w-full gap-1 overflow-x-auto sm:order-none sm:ml-auto sm:w-auto"
          >
            {nav.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    buttonVariants({ variant: isActive ? 'secondary' : 'ghost', size: 'sm' }),
                    'shrink-0',
                  )
                }
              >
                <Icon aria-hidden /> {label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1 sm:ml-0">
            <ThemeToggle />
            <Link to="/" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              Ver site
            </Link>
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
