import { CircleAlertIcon, type LucideIcon } from 'lucide-react'
import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'

interface ErrorStateProps {
  error: unknown
  onRetry?: () => void
  title?: string
}

export function ErrorState({
  error,
  onRetry,
  title = 'Não foi possível carregar',
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="border-destructive/40 bg-destructive/5 flex flex-col items-center gap-3 rounded-lg border p-8 text-center"
    >
      <CircleAlertIcon className="text-destructive size-8" aria-hidden />
      <p className="font-medium">{title}</p>
      <p className="text-muted-foreground text-sm">{getErrorMessage(error)}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </div>
  )
}

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  children?: React.ReactNode
}

export function EmptyState({ icon: Icon, title, description, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-10 text-center">
      <Icon className="text-muted-foreground size-8" aria-hidden />
      <p className="font-medium">{title}</p>
      {description && <p className="text-muted-foreground text-sm">{description}</p>}
      {children}
    </div>
  )
}
