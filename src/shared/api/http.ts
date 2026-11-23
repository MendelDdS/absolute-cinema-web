import type { z } from 'zod'
import { env } from '@/shared/lib/env'
import { ApiError, problemSchema } from './problem'

type Query = Record<string, string | number | undefined>
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  query?: Query
}

const parseJson = (text: string): unknown => {
  try {
    return text ? JSON.parse(text) : undefined
  } catch {
    return undefined
  }
}

/**
 * Cliente mínimo sobre fetch: monta URL, serializa JSON, converte erros em ApiError
 * (Problem Details) e valida a resposta com Zod.
 * ponytail: trocar por openapi-fetch + tipos gerados (npm run api:types) quando o backend expuser o OpenAPI.
 */
export function createClient(baseUrl: string) {
  return async function request<T>(
    path: string,
    schema: z.ZodType<T>,
    { method = 'GET', body, query }: RequestOptions = {},
  ): Promise<T> {
    const url = new URL(baseUrl + path, window.location.origin)
    for (const [k, v] of Object.entries(query ?? {})) {
      if (v !== undefined && v !== '') url.searchParams.set(k, String(v))
    }
    const res = await fetch(url, {
      method,
      headers: {
        Accept: 'application/json',
        'X-Customer-Id': env.customerId,
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    const json = parseJson(await res.text())
    if (!res.ok) {
      const problem = problemSchema.safeParse(json)
      throw new ApiError(
        res.status,
        problem.success ? problem.data : { status: res.status, title: res.statusText },
      )
    }
    // Spring devolve 201 vazio com Location; buscamos o recurso criado para manter o mesmo retorno.
    const location = res.headers.get('Location')
    if (res.status === 201 && json === undefined && location) {
      return request(new URL(location, url).pathname.replace(/^\/api\/[^/]+/, ''), schema)
    }
    return schema.parse(json)
  }
}
