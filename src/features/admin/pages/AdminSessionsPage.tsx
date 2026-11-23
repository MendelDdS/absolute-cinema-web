import { zodResolver } from '@hookform/resolvers/zod'
import { addMinutes, format, isValid } from 'date-fns'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { useCreateSession, useMovies, useRooms, useSessions } from '@/features/catalog'
import { getErrorMessage, isApiError } from '@/shared/api'
import { formatBRL, formatTime } from '@/shared/lib/format'
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Skeleton } from '@/shared/ui/skeleton'

const CLEANUP_MINUTES = 15

const schema = z.object({
  movieId: z.string().min(1, 'Selecione o filme'),
  roomId: z.string().min(1, 'Selecione a sala'),
  startsAt: z.string().min(1, 'Informe data e hora'),
  price: z.number({ error: 'Informe o preço' }).min(0, 'Preço não pode ser negativo'),
})
type FormValues = z.infer<typeof schema>

export function AdminSessionsPage() {
  const movies = useMovies()
  const rooms = useRooms()
  const create = useCreateSession()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { movieId: '', roomId: '', startsAt: '', price: 30 },
  })
  const { errors } = form.formState
  const [movieId, startsAt] = useWatch({ control: form.control, name: ['movieId', 'startsAt'] })

  const movie = movies.data?.find((m) => m.id === movieId)
  const start = startsAt ? new Date(startsAt) : undefined
  const end =
    movie && start && isValid(start)
      ? addMinutes(start, movie.durationMinutes + CLEANUP_MINUTES)
      : undefined
  const day = start && isValid(start) ? format(start, 'yyyy-MM-dd') : undefined
  const daySessions = useSessions({ date: day })
  const conflict = create.error && isApiError(create.error, 409) ? create.error.message : null

  const onSubmit = (values: FormValues) =>
    create.mutate(
      { ...values, startsAt: new Date(values.startsAt).toISOString() },
      {
        onSuccess: () => {
          toast.success('Sessão agendada.')
          form.reset({ ...values, startsAt: '' })
        },
        onError: (e) => {
          if (!isApiError(e, 409)) toast.error(getErrorMessage(e))
        },
      },
    )

  return (
    <div className="grid gap-6 lg:grid-cols-[24rem_1fr]">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Agendar sessão</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} onChange={() => create.reset()} noValidate>
            <FieldGroup>
              <Controller
                control={form.control}
                name="movieId"
                render={({ field }) => (
                  <Field data-invalid={Boolean(errors.movieId)}>
                    <FieldLabel htmlFor="movieId">Filme</FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        field.onChange(v)
                        create.reset()
                      }}
                    >
                      <SelectTrigger
                        id="movieId"
                        aria-invalid={Boolean(errors.movieId)}
                        className="w-full"
                      >
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {movies.data?.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError errors={[errors.movieId]} />
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="roomId"
                render={({ field }) => (
                  <Field data-invalid={Boolean(errors.roomId)}>
                    <FieldLabel htmlFor="roomId">Sala</FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        field.onChange(v)
                        create.reset()
                      }}
                    >
                      <SelectTrigger
                        id="roomId"
                        aria-invalid={Boolean(errors.roomId)}
                        className="w-full"
                      >
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms.data?.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError errors={[errors.roomId]} />
                  </Field>
                )}
              />
              <Field data-invalid={Boolean(errors.startsAt)}>
                <FieldLabel htmlFor="startsAt">Início</FieldLabel>
                <Input
                  id="startsAt"
                  type="datetime-local"
                  aria-invalid={Boolean(errors.startsAt)}
                  {...form.register('startsAt')}
                />
                <FieldDescription>
                  {end
                    ? `Término previsto: ${format(end, 'HH:mm')} (duração de ${movie?.durationMinutes} min + ${CLEANUP_MINUTES} min de limpeza)`
                    : 'Escolha o filme e o horário para ver o término calculado.'}
                </FieldDescription>
                <FieldError errors={[errors.startsAt]} />
              </Field>
              <Field data-invalid={Boolean(errors.price)}>
                <FieldLabel htmlFor="price">Preço (R$)</FieldLabel>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min={0}
                  inputMode="decimal"
                  aria-invalid={Boolean(errors.price)}
                  {...form.register('price', { valueAsNumber: true })}
                />
                <FieldError errors={[errors.price]} />
              </Field>
              {conflict && (
                <Alert variant="destructive">
                  <AlertTitle>Conflito de horário</AlertTitle>
                  <AlertDescription>{conflict}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? 'Agendando…' : 'Agendar'}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <section aria-labelledby="sessions-heading" className="space-y-3">
        <h1 id="sessions-heading" className="text-xl font-bold">
          {day ? `Sessões em ${format(new Date(day + 'T00:00'), 'dd/MM/yyyy')}` : 'Sessões do dia'}
        </h1>
        {!day ? (
          <p className="text-muted-foreground">
            Informe um horário no formulário para ver a ocupação das salas nesse dia.
          </p>
        ) : daySessions.isPending ? (
          <Skeleton className="h-40" aria-busy />
        ) : daySessions.data?.length === 0 ? (
          <p className="text-muted-foreground">Nenhuma sessão agendada neste dia.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-muted-foreground text-left">
              <tr>
                <th className="py-2 font-medium">Sala</th>
                <th className="py-2 font-medium">Horário</th>
                <th className="py-2 font-medium">Filme</th>
                <th className="py-2 font-medium">Preço</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {[...(daySessions.data ?? [])]
                .sort(
                  (a, b) =>
                    a.roomName.localeCompare(b.roomName) || a.startsAt.localeCompare(b.startsAt),
                )
                .map((s) => (
                  <tr key={s.id}>
                    <td className="py-2 font-medium">{s.roomName}</td>
                    <td className="py-2 tabular-nums">
                      {formatTime(s.startsAt)}–{formatTime(s.endsAt)}
                    </td>
                    <td className="py-2">{s.movieTitle}</td>
                    <td className="py-2">{formatBRL(s.price)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
