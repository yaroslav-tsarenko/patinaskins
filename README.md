# Patinaskins

Storefront and admin for Patinaskins (patinaskins.com), a Counter-Strike 2 skins store built with Next.js 16. The store sells weapon skins, knives and gloves it sources from an item supplier and delivers each item to the buyer's Steam account as a trade offer. It is a store, not a marketplace: customers cannot sell or list items.

## Tech stack

- Next.js 16 (App Router), TypeScript, Tailwind CSS 4
- PostgreSQL with Prisma ORM 7 (`@prisma/adapter-pg`)
- JWT session cookie plus Steam OpenID sign-in and account linking
- Transfermit hosted card payments
- Item supplier: api.sih.market (catalogue, live price, purchase and delivery)
- next-intl (messages in `messages/en/*.json`), Nodemailer, pdf-lib invoices

## How it works

### Catalogue

`src/lib/sih/sync.ts` pulls the supplier catalogue, parses each `market_hash_name` (`src/lib/sih/parse.ts`) and builds one storefront product per unique market hash name, which already encodes weapon, finish, exterior and StatTrak/Souvenir. When the supplier has several offers for the same name, the cheapest in-stock offer is kept (lowest float on a price tie) and its details are stored server-side only in `SihItem.offer`.

`src/lib/sih/catalog-select.ts` then picks a balanced set across weapon types, weapons, rarities, exteriors and price bands. Caps, price limits, margin defaults and price bands live in `src/config/catalog.ts`. Products already listed are preferred on re-sync, and every write is an upsert keyed by the market hash name (deterministic product ids), so re-running the sync never duplicates products. Items that drop out are archived, never deleted.

Data model: `Product` (storefront) ↔ `Skin` (public filter attributes: weapon type, weapon, rarity, exterior, float range, StatTrak, Souvenir, collection, phase) ↔ `SihItem` (supplier cost, stock and offer metadata). Categories are weapon type → weapon.

### Steam

- `/api/auth/steam` starts Steam OpenID sign-in or, with `link=1`, links Steam to the signed-in account. Return URLs always use `APP_URL`.
- `/account/steam` saves the trade URL; it is accepted only when its partner id matches the linked SteamID64.
- Checkout requires a linked Steam account with a saved trade URL.

### Money flow

1. `POST /api/checkout` re-confirms each item's live supplier price. If a price rose beyond `SIH_PRICE_TOLERANCE`, the product is re-priced and the buyer sees the new total before paying (`TOTAL_CHANGED`).
2. One `Order` is created with one `OrderItem` and one `SihOrder` (status `awaiting_payment`) per skin, plus the buyer's consent to immediate delivery (timestamp, text and version).
3. The buyer pays on Transfermit's hosted page.
4. `POST /api/webhooks/transfermit` (HMAC-verified) claims the order as paid once, checks the amount and currency, emails the confirmation and invoice, and submits each `SihOrder` to the supplier with a single-flight `paid → submitted` claim. Supplier failures park the item as `refund_pending` and raise a critical alert.
5. `POST /api/webhooks/sih?secret=…` re-fetches the authoritative supplier state and moves items through `processing → sent → finished`, or `failed`/`rolled_back` → `refund_pending`.
6. Refunds are operator-driven: `/admin/sih` lists the refund backlog with "Mark refunded".

A bag can hold several skins; they are paid together and delivered item by item. Each item's status is visible on `/account/orders/[id]`, which also triggers a rate-limited refresh from the supplier while items are in flight.

### Crons

`vercel.json` runs four daily jobs (Vercel Hobby allows daily schedules only): catalogue sync, in-flight order poll, deep reconcile, and balance/stuck-order monitor. Webhooks remain the primary path; the daily poll and the on-view refresh are backstops. On a plan that allows it, change the poll schedule to every few minutes. All cron routes require `Authorization: Bearer $CRON_SECRET`.

## Local setup

```bash
npm install
cp .env.example .env        # fill in values, at least JWT_SECRET
npm run local:setup         # creates the patinaskins database, pushes the schema, seeds, syncs the catalogue
npm run dev
```

`local:setup` needs a local PostgreSQL. It writes `DATABASE_URL`/`DIRECT_URL` into `.env` if they are empty (override the server with `LOCAL_PG_URL`). The catalogue sync runs against the live supplier when `SIH_API_KEY` is set, or against a JSON file in the supplier's `get-items` shape when `SIH_FIXTURE_FILE` is set.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm run build` | `prisma generate` + production build |
| `npm run local:setup` | Local database, schema, seed and first catalogue sync |
| `npm run catalog:sync` | Sync the catalogue now (`-- --fixture <file>` to use a local file) |
| `npm run sih:smoke` | Read-only supplier check: auth, balance, catalogue, one live price. Buys nothing |
| `npm run sih:webhook` | Register the supplier webhook at `$APP_URL/api/webhooks/sih?secret=…` (`-- clear` removes it) |

## Configuration

- `src/config/catalog.ts` — catalogue quotas per weapon type, price limits, margin defaults, price bands.
- `src/config/store-policy.ts` — currencies, delivery wording, refund timeframes, order limits, the withdrawal waiver text. Policy pages, FAQ, emails and checkout read from here.
- `src/lib/company.ts` — company particulars (placeholders until provided).
- `.env.example` — every environment variable, grouped by service.

## Deployment

Deploy on Vercel with the variables from `.env.example`. Set `APP_URL` and `NEXT_PUBLIC_SITE_URL` to the main domain; the `*.vercel.app` address should redirect there so Steam sign-in and payment returns never show the technical URL. After the first deploy run `npm run sih:webhook` once with production variables.
