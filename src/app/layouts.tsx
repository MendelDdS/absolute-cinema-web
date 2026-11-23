import { ClapperboardIcon } from 'lucide-react'
import { isRouteErrorResponse, Link, Outlet, useRouteError } from 'react-router'
import { ThemeToggle } from '@/shared/components/theme-toggle'
import { Button, buttonVariants } from '@/shared/ui/button'

export function CustomerLayout() {
  return (
    <div className="min-h-svh">
      <a
        href="#main"
        className="focus:bg-background sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:px-3 focus:py-2"
      >
        Pular para o conteúdo
      </a>
      <header className="bg-background/95 sticky top-0 z-20 border-b backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <ClapperboardIcon className="size-5" aria-hidden /> Absolute Cinema
          </Link>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <Link to="/admin" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
              Admin
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

export function RouteErrorPage() {
  const error = useRouteError()
  const notFound = isRouteErrorResponse(error) && error.status === 404
  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-3xl font-bold">
        {notFound ? 'Página não encontrada' : 'Algo deu errado'}
      </h1>
      <p className="text-muted-foreground">
        {notFound ? 'O endereço que você acessou não existe.' : 'Tente recarregar a página.'}
      </p>
      <Button asChild>
        <Link to="/">Ir para o início</Link>
      </Button>
    </div>
  )
}
