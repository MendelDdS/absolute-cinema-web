import { CircleCheckIcon, CircleXIcon, SearchXIcon, TriangleAlertIcon } from 'lucide-react'
import { useRef, useState } from 'react'
import { useValidateTicket } from '@/features/tickets'
import { getErrorMessage, isApiError } from '@/shared/api'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'

type Tone = 'ok' | 'used' | 'missing' | 'error'
interface Result {
  tone: Tone
  title: string
  detail: string
}

const TONE: Record<Tone, { icon: typeof CircleCheckIcon; className: string }> = {
  ok: {
    icon: CircleCheckIcon,
    className: 'border-green-600 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200',
  },
  used: {
    icon: TriangleAlertIcon,
    className: 'border-amber-600 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
  },
  missing: {
    icon: SearchXIcon,
    className: 'border-destructive bg-destructive/10 text-destructive',
  },
  error: { icon: CircleXIcon, className: 'border-destructive bg-destructive/10 text-destructive' },
}

export function ValidateTicketPage() {
  const [code, setCode] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const validate = useValidateTicket()

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const value = code.trim()
    if (!value) return
    validate.mutate(value, {
      onSuccess: (t) =>
        setResult({
          tone: 'ok',
          title: 'Ingresso válido',
          detail: `Assento ${t.seatCode}. Entrada liberada.`,
        }),
      onError: (err) =>
        setResult(
          isApiError(err, 409)
            ? { tone: 'used', title: 'Ingresso já utilizado', detail: err.message }
            : isApiError(err, 404)
              ? {
                  tone: 'missing',
                  title: 'Ingresso não encontrado',
                  detail: `Nenhum ingresso com o código ${value}.`,
                }
              : { tone: 'error', title: 'Falha ao validar', detail: getErrorMessage(err) },
        ),
      onSettled: () => {
        setCode('')
        inputRef.current?.focus()
      },
    })
  }

  const tone = result && TONE[result.tone]

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-xl font-bold">Portaria — validar ingresso</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="code">Código do ingresso</Label>
          <Input
            ref={inputRef}
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Digite ou cole o código"
            autoComplete="off"
            className="font-mono"
          />
        </div>
        <Button type="submit" size="lg" disabled={validate.isPending || !code.trim()}>
          {validate.isPending ? 'Validando…' : 'Validar'}
        </Button>
      </form>

      <div aria-live="assertive" aria-atomic="true">
        {result && tone && (
          <div
            className={cn(
              'flex flex-col items-center gap-3 rounded-2xl border-2 p-10 text-center',
              tone.className,
            )}
          >
            <tone.icon className="size-20" aria-hidden />
            <p className="text-3xl font-bold">{result.title}</p>
            <p className="text-lg">{result.detail}</p>
          </div>
        )}
      </div>
    </div>
  )
}
