# Knowledge graph — merchant-ui

```mermaid
flowchart LR
  subgraph UIs
    PUI[platform-ui]
    MUI[merchant-ui]
    SF[storefront]
  end
  GW[api-gateway :4000]
  PUI --> GW
  MUI --> GW
  SF --> GW
  GW --> AUTH[auth-service :3001]
  GW --> PLAT[platform-service :3002]
  GW --> STORE[store-service :3003]
  GW --> CAT[catalog-service :3004]
  GW --> ORD[order-service :3005]
  GW --> SFS[storefront-service :3006]
  GW --> NOTIF[notification-service :3007]
  GW --> PAY[payment-service :3008]
  GW --> SHIP[shipping-service :3009]
  GW --> OFF[offer-service :3010]
  GW --> BILL[billing-service :3011]
```


## This repo

```mermaid
flowchart TD
  APP[app/(admin) pages]
  APP --> API[lib/api.ts]
  API --> GW[api-gateway]
  AUTH[lib/auth-store.ts] --> API
  SIDE[components/layout/Sidebar.tsx] --> APP
```

## Route groups

| Group | Path | Purpose |
| --- | --- | --- |
| `(auth)` | `/login` `/register` `/forgot-password` `/signed-out` | Merchant auth |
| `(setup)` | `/setup` | Onboarding wizard |
| `(admin)` | `/dashboard` `/catalog` `/orders` `/customize/*` `/settings/*` `/store` `/stock` `/reports` `/notifications` `/subscription` `/support` | Authenticated merchant |

## Task → file

- New admin screen: `app/(admin)/<feature>/page.tsx` plus a link in `components/layout/Sidebar.tsx`.
- API call: `lib/api.ts` then the page.
- Auth/token bugs: `lib/api.ts` + `lib/auth-store.ts`.
