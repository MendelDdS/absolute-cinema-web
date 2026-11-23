import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { useCreateMovie, useMovies } from '@/features/catalog'
import { getErrorMessage } from '@/shared/api'
import { ErrorState } from '@/shared/components/state'
import { formatDuration } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Skeleton } from '@/shared/ui/skeleton'

const schema = z.object({
  title: z.string().trim().min(1, 'Informe o título'),
  durationMinutes: z
    .number({ error: 'Informe a duração em minutos' })
    .int('Use minutos inteiros')
    .min(1, 'Mínimo de 1 minuto')
    .max(600, 'Máximo de 600 minutos'),
})
type FormValues = z.infer<typeof schema>

export function AdminMoviesPage() {
  const movies = useMovies()
  const create = useCreateMovie()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', durationMinutes: 120 },
  })
  const { errors } = form.formState

  const onSubmit = (values: FormValues) =>
    create.mutate(values, {
      onSuccess: (m) => {
        toast.success(`"${m.title}" cadastrado.`)
        form.reset()
      },
      onError: (e) => toast.error(getErrorMessage(e)),
    })

  return (
    <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Novo filme</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <FieldGroup>
              <Field data-invalid={Boolean(errors.title)}>
                <FieldLabel htmlFor="title">Título</FieldLabel>
                <Input
                  id="title"
                  aria-invalid={Boolean(errors.title)}
                  {...form.register('title')}
                />
                <FieldError errors={[errors.title]} />
              </Field>
              <Field data-invalid={Boolean(errors.durationMinutes)}>
                <FieldLabel htmlFor="duration">Duração (minutos)</FieldLabel>
                <Input
                  id="duration"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  aria-invalid={Boolean(errors.durationMinutes)}
                  {...form.register('durationMinutes', { valueAsNumber: true })}
                />
                <FieldError errors={[errors.durationMinutes]} />
              </Field>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? 'Salvando…' : 'Cadastrar'}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <section aria-labelledby="movies-heading" className="space-y-3">
        <h1 id="movies-heading" className="text-xl font-bold">
          Filmes
        </h1>
        {movies.isPending ? (
          <Skeleton className="h-40" aria-busy />
        ) : movies.isError ? (
          <ErrorState error={movies.error} onRetry={() => void movies.refetch()} />
        ) : movies.data.length === 0 ? (
          <p className="text-muted-foreground">Nenhum filme cadastrado.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-muted-foreground text-left">
              <tr>
                <th className="py-2 font-medium">Título</th>
                <th className="py-2 font-medium">Duração</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {movies.data.map((m) => (
                <tr key={m.id}>
                  <td className="py-2 font-medium">{m.title}</td>
                  <td className="py-2">{formatDuration(m.durationMinutes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
