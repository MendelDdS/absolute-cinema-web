import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { useCreateRoom, useRooms } from '@/features/catalog'
import { getErrorMessage } from '@/shared/api'
import { ErrorState } from '@/shared/components/state'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Skeleton } from '@/shared/ui/skeleton'

const schema = z.object({
  name: z.string().trim().min(1, 'Informe o nome da sala'),
  rows: z
    .number({ error: 'Informe o número de fileiras' })
    .int()
    .min(1, 'Mínimo 1')
    .max(26, 'Máximo 26 (A–Z)'),
  seatsPerRow: z
    .number({ error: 'Informe os assentos por fileira' })
    .int()
    .min(1, 'Mínimo 1')
    .max(40, 'Máximo 40'),
})
type FormValues = z.infer<typeof schema>

const rowLetter = (i: number) => String.fromCharCode(65 + i)

export function AdminRoomsPage() {
  const rooms = useRooms()
  const create = useCreateRoom()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', rows: 8, seatsPerRow: 12 },
  })
  const { errors } = form.formState
  const [rows, seatsPerRow] = useWatch({ control: form.control, name: ['rows', 'seatsPerRow'] })
  const previewRows = Math.min(Math.max(rows || 0, 0), 26)
  const previewCols = Math.min(Math.max(seatsPerRow || 0, 0), 40)

  const onSubmit = (values: FormValues) =>
    create.mutate(values, {
      onSuccess: (r) => {
        toast.success(`Sala "${r.name}" criada.`)
        form.reset()
      },
      onError: (e) => toast.error(getErrorMessage(e)),
    })

  return (
    <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Nova sala</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <FieldGroup>
              <Field data-invalid={Boolean(errors.name)}>
                <FieldLabel htmlFor="name">Nome</FieldLabel>
                <Input id="name" aria-invalid={Boolean(errors.name)} {...form.register('name')} />
                <FieldError errors={[errors.name]} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field data-invalid={Boolean(errors.rows)}>
                  <FieldLabel htmlFor="rows">Fileiras</FieldLabel>
                  <Input
                    id="rows"
                    type="number"
                    min={1}
                    max={26}
                    aria-invalid={Boolean(errors.rows)}
                    {...form.register('rows', { valueAsNumber: true })}
                  />
                  <FieldError errors={[errors.rows]} />
                </Field>
                <Field data-invalid={Boolean(errors.seatsPerRow)}>
                  <FieldLabel htmlFor="seatsPerRow">Assentos por fileira</FieldLabel>
                  <Input
                    id="seatsPerRow"
                    type="number"
                    min={1}
                    max={40}
                    aria-invalid={Boolean(errors.seatsPerRow)}
                    {...form.register('seatsPerRow', { valueAsNumber: true })}
                  />
                  <FieldError errors={[errors.seatsPerRow]} />
                </Field>
              </div>
              <Field>
                <FieldLabel>Pré-visualização</FieldLabel>
                <FieldDescription>
                  {previewRows * previewCols} assentos ({previewRows} × {previewCols})
                </FieldDescription>
                <div className="bg-background overflow-x-auto rounded-lg border p-3" aria-hidden>
                  <div className="bg-foreground/60 mx-auto mb-2 h-1 w-2/3 rounded-full" />
                  <div className="flex w-max flex-col gap-1">
                    {Array.from({ length: previewRows }, (_, r) => (
                      <div key={r} className="flex items-center gap-1">
                        <span className="text-muted-foreground w-4 text-[10px]">
                          {rowLetter(r)}
                        </span>
                        {Array.from({ length: previewCols }, (_, c) => (
                          <span
                            key={c}
                            className="border-foreground/40 size-3 rounded-t-sm border"
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </Field>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? 'Salvando…' : 'Criar sala'}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <section aria-labelledby="rooms-heading" className="space-y-3">
        <h1 id="rooms-heading" className="text-xl font-bold">
          Salas
        </h1>
        {rooms.isPending ? (
          <Skeleton className="h-40" aria-busy />
        ) : rooms.isError ? (
          <ErrorState error={rooms.error} onRetry={() => void rooms.refetch()} />
        ) : rooms.data.length === 0 ? (
          <p className="text-muted-foreground">Nenhuma sala cadastrada.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-muted-foreground text-left">
              <tr>
                <th className="py-2 font-medium">Nome</th>
                <th className="py-2 font-medium">Capacidade</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rooms.data.map((r) => (
                <tr key={r.id}>
                  <td className="py-2 font-medium">{r.name}</td>
                  <td className="py-2">{r.capacity} lugares</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
