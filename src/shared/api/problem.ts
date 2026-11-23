import { z } from 'zod'

/** RFC 9457 Problem Details. Campos extras (ex.: unavailableSeats) são preservados. */
export const problemSchema = z
  .object({
    type: z.string().optional(),
    title: z.string().optional(),
    status: z.number().optional(),
    detail: z.string().optional(),
    instance: z.string().optional(),
  })
  .loose()

export type ProblemDetails = z.infer<typeof problemSchema>

export class ApiError extends Error {
  readonly status: number
  readonly problem: ProblemDetails

  constructor(status: number, problem: ProblemDetails) {
    super(problem.detail ?? problem.title ?? `Erro ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.problem = problem
  }
}

export const isApiError = (e: unknown, status?: number): e is ApiError =>
  e instanceof ApiError && (status === undefined || e.status === status)

export const getErrorMessage = (e: unknown, fallback = 'Algo deu errado. Tente novamente.') =>
  e instanceof ApiError ? e.message : fallback
