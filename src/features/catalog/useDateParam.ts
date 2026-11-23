import { useSearchParams } from 'react-router'
import { toDateParam } from '@/shared/lib/format'

/** Data selecionada (yyyy-MM-dd) persistida em ?date= para sobreviver ao botão voltar. */
export function useDateParam() {
  const [params, setParams] = useSearchParams()
  const date = params.get('date') ?? toDateParam(new Date())
  const setDate = (d: string) => setParams({ date: d }, { replace: true })
  return [date, setDate] as const
}
