# Absolute Cinema — frontend

Frontend do sistema de reserva de assentos para cinema (projeto de estudo/portfólio). Conversa com 4 microsserviços Spring Boot (`catalog`, `booking`, `transactions`, `ticket`); enquanto o backend não existe, roda inteiro sobre mocks com MSW.

Stack: React 19 + TypeScript (strict) · Vite · Tailwind CSS v4 · shadcn/ui (Radix) · React Router · TanStack Query · React Hook Form + Zod · date-fns (pt-BR) · qrcode.react · MSW · Vitest + Testing Library · Playwright · ESLint + Prettier.

## Rodando com mocks (padrão)

```bash
npm install
cp .env.example .env   # VITE_USE_MOCKS=true
npm run dev            # http://localhost:5173
```

Cenários simulados pelo MSW (`src/mocks`):

| Cenário                                         | Como reproduzir                                                                                                                          |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Assento tomado por outro cliente (409)          | Selecione o assento **E5** em qualquer sessão e clique em Reservar. Ele passa a "reservado por outro cliente" por 90 s.                  |
| Pagamento aprovado / recusado                   | No checkout escolha "Cartão de teste — aprovar" ou "— recusar". O status muda ~3 s depois (`PAYMENT_PENDING` → `CONFIRMED`/`CANCELLED`). |
| Expiração da reserva                            | Holds duram 10 min (`HOLD_SECONDS` em `src/mocks/data.ts`); diminua para ver o checkout expirar.                                         |
| Sobreposição de sessões (409)                   | Em `/admin/sessions`, agende na mesma sala em um horário já ocupado.                                                                     |
| Ingresso já utilizado (409) / inexistente (404) | Em `/admin/validate`, valide o mesmo código duas vezes ou digite um código qualquer.                                                     |

Os dados vivem em memória: recarregar a página zera tudo.

## Apontando para o backend real

1. `VITE_USE_MOCKS=false` no `.env`.
2. Em dev, o proxy do Vite (`vite.config.ts`) encaminha:
   - `/api/catalog` → `http://localhost:8080`
   - `/api/booking` → `http://localhost:8081`
   - `/api/tickets` → `http://localhost:8084`

   O ticket-service ainda não tem porta definida no plano; `8084` é suposição. Os alvos podem ser trocados por `CATALOG_URL`, `BOOKING_URL`, `TICKET_URL` no `.env`.

3. Os prefixos usados pelo cliente HTTP vêm de `VITE_CATALOG_API`, `VITE_BOOKING_API`, `VITE_TICKETS_API` (padrão `/api/...`).
4. O cliente envia `X-Customer-Id` com `VITE_CUSTOMER_ID` (autenticação está fora do escopo).
5. `POST` de filme/sala/sessão responde `201` sem corpo e com `Location`; o cliente HTTP faz o `GET` seguinte automaticamente.
6. Erros seguem RFC 9457 (Problem Details); `detail` é exibido ao usuário. Em 409 de reserva o frontend lê o campo extra `unavailableSeats: string[]`.

Quando o backend expuser o OpenAPI (springdoc), gere os tipos com `npm run api:types` (usa `openapi-typescript`, saída em `src/shared/api/generated/`) e troque os schemas manuais de `features/*/api.ts` pelos tipos gerados.

## Scripts

| Script             | O que faz                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------ |
| `npm run dev`      | Dev server com HMR                                                                               |
| `npm run build`    | `tsc -b` + build de produção em `dist/`                                                          |
| `npm run preview`  | Serve o build                                                                                    |
| `npm test`         | Testes unitários/componentes (Vitest + Testing Library)                                          |
| `npm run test:e2e` | Playwright: fluxo de compra (feliz, recusado, 409). Na 1ª vez: `npx playwright install chromium` |
| `npm run lint`     | ESLint (react-hooks, jsx-a11y, typescript-eslint)                                                |
| `npm run format`   | Prettier                                                                                         |

## Estrutura

```
src/
├── app/            providers (QueryClient, toasts), layouts, rotas
├── features/
│   ├── catalog/        filmes, sessões, salas (api + hooks + páginas)
│   ├── seat-selection/ mapa de assentos (polling 5 s, teclado, 409)
│   ├── booking/        checkout, contagem regressiva, status do pagamento (polling 2 s)
│   ├── tickets/        ingressos com QR Code e impressão
│   └── admin/          filmes, salas, sessões e portaria
├── shared/
│   ├── api/        cliente fetch + Problem Details (ApiError)
│   ├── components/ estados de erro/vazio, alternador de tema
│   ├── ui/         componentes shadcn/ui
│   ├── hooks/      useTheme
│   └── lib/        env, formatação (BRL, datas pt-BR)
├── mocks/          MSW: banco em memória + handlers
└── test/           setup do Vitest
```

Cada feature expõe sua API pública em `index.ts`; features só importam umas das outras por esse arquivo.

## Docker

```bash
docker build -t absolute-cinema-web .
# imagem de demonstração sem backend:
docker build --build-arg VITE_USE_MOCKS=true -t absolute-cinema-web:demo .
docker run -p 8080:80 absolute-cinema-web
```

O `nginx.conf` serve a SPA e faz proxy de `/api/catalog`, `/api/booking` e `/api/tickets` para `catalog-service:8080`, `booking-service:8081` e `ticket-service:8084`. No `docker-compose.yml` do projeto:

```yaml
web:
  build: ../absolute-cinema-web
  ports:
    - '8080:80'
  depends_on: [catalog-service, booking-service, ticket-service]
```
