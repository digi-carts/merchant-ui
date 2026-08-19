# merchant-ui

Merchant (store admin) dashboard. Next.js App Router SPA that talks to **api-gateway**.

Platform design: [System design](https://github.com/digi-carts/doc/blob/main/architecture/system-design.md)

## Purpose

Operators with role `merchant` manage catalog, stock, orders/returns/bills, storefront theme, shipping/payment/discounts, notifications, domains, support, and subscription. First-run uses `(setup)/setup` driven by `setup_status` / `setup_wizard_page` on the user.

## Tech stack

| Item | Version / lib |
|------|----------------|
| Next.js | 16.3.0 (App Router) |
| React | 19.2.8 |
| Data | axios, TanStack Query, Zustand persist `auth-store-v3` |
| UI | Tailwind 4, shadcn, lucide, recharts, react-colorful |
| PDF | jspdf + autotable |
| Container | Node 20 Alpine, port **8080** |

## Auth

`lib/api.ts` attaches `Authorization: Bearer` and `x-store-id` from Zustand. On `401`/`403` it posts `${NEXT_PUBLIC_API_URL}/auth/refresh`. Default API base: `http://localhost:4000/api` (override with `NEXT_PUBLIC_API_URL` pointing at gateway, typically `http://localhost:3000/api`).

Roles: `superadmin` | `merchant` | `user` (`lib/auth-store.ts`).

## Routes

| Group | Paths |
|-------|--------|
| Auth | `/login`, `/register`, `/forgot-password`, `/signed-out` |
| Setup | `/setup` |
| Admin | `/dashboard`, `/catalog`, `/stock`, `/orders`, `/orders/returns`, `/orders/bills` |
| Store | `/store`, `/pages`, `/reports` |
| Customize | `/customize`, theme/home/navbar/footer/about/products/orders/icons/mail |
| Settings | shop, shipping, payment, discounts, payment-options, notifications, domain, profile, AI |
| Comms | `/notifications/*`, `/customer-alerts`, `/templates/bills`, `/templates/messages` |
| Account | `/support`, `/subscription` |

Layouts: `app/(auth)`, `app/(setup)`, `app/(admin)`.

## Env

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | Gateway API prefix |
| `NEXT_PUBLIC_STOREFRONT_URL` | Link to customer shop (Docker ARG default set in `Dockerfile`) |

## Local run

```bash
export NEXT_PUBLIC_API_URL=http://localhost:3000/api
npm ci
npm run dev
```

## CI/CD

Cloud Run `digi-cart-merchant-ui-dev` / `digi-cart-merchant-ui`. `cloudbuild.yaml` + GitHub Actions on `stage` / `main`.

## Related

- [api-gateway](https://github.com/digi-carts/api-gateway/blob/stage/doc/README.md)
- [store-service](https://github.com/digi-carts/store-service/blob/stage/doc/README.md)
- [catalog-service](https://github.com/digi-carts/catalog-service/blob/stage/doc/README.md)
- [order-service](https://github.com/digi-carts/order-service/blob/stage/doc/README.md)
- AI map: [docs/ai/KNOWLEDGE_GRAPH.md](../docs/ai/KNOWLEDGE_GRAPH.md)
