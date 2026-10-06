# Brasmora

Storefront and admin for Brasmora (brasmora.com), a kitchen, cookware and tableware store, built with Next.js 16. Includes product catalog, shopping cart, checkout, order management and analytics.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL with Prisma ORM 7
- **UI:** HeroUI + Tailwind CSS 4
- **Auth:** JWT-based sessions (HTTP-only cookies)
- **Animations:** Framer Motion
- **Forms:** React Hook Form + Zod
- **Email:** SMTP via Nodemailer (Spacemail mailbox)
- **i18n:** next-intl
- **Charts:** Recharts
- **Rich Text:** Tiptap

## Features

### Storefront

- Product catalog with category filtering and search
- Product detail pages with image gallery, variants, and reviews
- Shopping cart with validation
- Checkout flow with address management
- Order history and tracking
- User registration and authentication
- Wishlist
- Responsive design with page transitions
- Multi-language support

### Admin Dashboard

- Product management (CRUD, bulk CSV/Excel import)
- Order management with status tracking
- Customer and user management
- Category management
- Banner and CMS page management
- Store settings (branding, tax, shipping, social links)
- Product feed generation (Google Shopping, Facebook)
- Analytics dashboard with KPIs and revenue charts
- Review moderation

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
cd brasmora
npm install
```

The repository has its own history and no remote. Create a new **private** GitHub repository for it before pushing.

### Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | Prisma Postgres protocol URL | Yes |
| `DIRECT_URL` | Direct PostgreSQL connection URL | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `NEXT_PUBLIC_SITE_URL` | Public site URL | Yes |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` | SMTP server for transactional email (emails are skipped when unset) | Yes, for email |
| `SMTP_USER`, `SMTP_PASSWORD` | Mailbox credentials on the brasmora.com domain | Yes, for email |
| `SMTP_FROM`, `SMTP_REPLY_TO` | Sender and reply-to addresses on the brasmora.com domain | Yes, for email |
| `PAYBYLINK_BASE_URL` | OPPWA host (`https://eu-test.oppwa.com` sandbox, `https://eu-prod.oppwa.com` live) | Yes, for checkout |
| `PAYBYLINK_ENTITY_ID` | OPPWA entity id | Yes, for checkout |
| `PAYBYLINK_AUTH_TOKEN` | OPPWA bearer token | Yes, for checkout |
| `PAYBYLINK_WEBHOOK_SECRET` | 64-character hex decryption key of the OPPWA webhook | Yes, for the payment webhook |

### Database Setup

```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

The seed script writes the store settings (name, contact email, currency, VAT rate and free-delivery threshold) from `src/lib/brand.ts`, `src/lib/company.ts` and `src/config/store-policy.ts`. It creates an admin only when `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` (12+ characters) are set. Categories and products come from `npm run catalog:import`.

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the storefront and [http://localhost:3000/admin](http://localhost:3000/admin) for the admin dashboard.

## Project Structure

```
src/
├── app/
│   ├── (store)/           # Storefront routes (route group, no URL prefix)
│   │   ├── auth/          # Login, register
│   │   ├── catalog/       # Product catalog
│   │   ├── product/[slug] # Product detail
│   │   ├── cart/          # Shopping cart
│   │   ├── checkout/      # Checkout
│   │   └── account/       # Profile, orders, wishlist, addresses
│   ├── admin/             # Admin dashboard
│   └── api/               # 30+ REST API endpoints
├── components/
│   ├── admin/             # Admin-specific components
│   ├── home/              # Homepage components
│   ├── product/           # Product display
│   ├── catalog/           # Catalog components
│   ├── cart/              # Cart components
│   ├── checkout/          # Checkout components
│   ├── layout/            # Header, footer, navigation
│   └── shared/            # Reusable UI components
├── lib/                   # Utilities, API clients, auth, Prisma client
├── providers/             # React context (Auth, Cart, Theme, Toast)
├── types/                 # TypeScript type definitions
├── validators/            # Zod validation schemas
└── i18n/                  # Locale config, request config, client locale helpers
prisma/
├── schema.prisma          # Database schema (14 models)
└── seed.ts                # Seed data
scripts/                   # Dev server orchestration, data generation
```

## Localization

URLs carry no locale segment. The active locale is kept in `localStorage` (`brasmora.locale`) and mirrored into the `NEXT_LOCALE` cookie, which `src/i18n/request.ts` reads on the server. English is the only locale today. To add one, append its code to `locales` (and a label to `localeLabels`) in `src/i18n/config.ts` and add a `messages/<code>/` folder with one JSON file per namespace listed in `src/i18n/messages.ts` (copy `messages/en/` and translate); the language switcher appears automatically once more than one locale exists.

Brand values live in `src/lib/brand.ts` and legal entity details in `src/lib/company.ts`.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server (Prisma + Next.js) |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

## API Overview

The API provides endpoints for:

- **Auth** — register, login, logout, session management
- **Products** — CRUD, search, filtering, bulk operations
- **Categories** — hierarchy management
- **Orders** — creation, status updates, history
- **Cart** — add, update, remove, validate
- **Checkout** — process orders with address selection
- **Customers & Users** — management endpoints
- **Reviews** — submission and moderation
- **Wishlist** — add/remove items
- **Settings** — store configuration
- **Feeds** — Google Shopping, Facebook product feeds
- **Import** — CSV/Excel product import with preview
- **Analytics** — KPIs and revenue data
- **Upload** — Image upload
- **Payments** — PayByLink server-to-server notifications

Admin endpoints (product, category, settings, homepage, import, upload, orders, customers, users, analytics and review moderation) require a session whose user role is `ADMIN` or `SUPER_ADMIN`; they answer `401` without a session and `403` for other roles. Contact, newsletter, login, registration and password-reset requests are rate limited per client IP and answer `429` with a `Retry-After` header.

### Payment webhook

Configure the webhook in the OPPWA (PayByLink) back office:

- URL: `https://<your-domain>/api/payments/webhook` (POST, notification type Payments)
- Decryption key: copy it into `PAYBYLINK_WEBHOOK_SECRET`

Notifications are AES-256-GCM encrypted; requests that do not decrypt with the key are rejected with `401`. The notification body is only used to find the order (`merchantTransactionId` is the order number) and the checkout id (`ndc`). The payment status, amount and currency are always re-queried from OPPWA and the order is settled through the same idempotent function as `/api/orders/verify` (the shopper return page), so a notification and a returning shopper can arrive in any order without double fulfilment. When OPPWA cannot be reached the endpoint answers `503` so the notification is retried.

## Product images

Product photos are served straight from Cloudflare R2 in sizes made at import time. Vercel image optimisation is switched off (`images.loader: "custom"` in `next.config.ts`), so it uses none of Vercel's image quota.

**At import.** `npm run catalog:import` copies each product image to R2 as `brasmora/products/<slug>/<n>.<ext>`, unchanged, and keeps it as the fallback. It also uses sharp to make WebP copies named `brasmora/products/<slug>/<n>-w<width>.webp`:

- **Widths:** 320, 480, 640, 960 and 1280.
- **No upscaling:** a photo narrower than 1280px gets one more copy at its own width. An 800px photo becomes 320, 480, 640 and 800.
- **Settings:** quality 78. Photos are rotated to their EXIF orientation and keep their aspect ratio.

The widths and quality are set in `catalogConfig.images.variants` (`src/config/catalog.ts`). The width list is `IMAGE_VARIANT_WIDTHS` in `src/lib/image-loader.ts`.

**How the site finds the copies.** `ProductImage.url` stays the original URL plus a `vw` query parameter that lists the widths uploaded for that photo, for example:

```
https://img.example.com/brasmora/products/cast-iron-casserole-24/1.jpg?vw=320-480-640-960-1280
```

R2 ignores the query string, so the URL still opens the original photo. That keeps feeds, the sitemap, JSON-LD, emails and the OG image routes working unchanged. The schema does not change.

**How pages pick a size.** `src/lib/image-loader.ts` is the `next/image` loader:

- A URL with a valid `vw` gets the smallest copy at least as wide as the requested width, or the largest copy if none is wide enough.
- Every other `src` is returned unchanged: local files (`/_dev`, `/payments`, SVGs, `/_next/static`), URLs without `vw` and other remote URLs.
- `deviceSizes` match the widths above, so each `srcset` entry points to a real file.

The marker is written only after every copy for that photo has been uploaded, so an image without it simply loads the original.

**Running the import**

| Command | Effect |
|---|---|
| `npm run catalog:import` | Uploads new or changed photos with their WebP copies. Photos already in R2 without copies are read back from the bucket (not the supplier), get their copies, and are re-saved with the marker. |
| `npm run catalog:import -- --skip-variants` | Quick run: originals only. Photos that already have copies keep their marker; new photos load the original. |
| `npm run catalog:import -- --skip-images` | Local testing only. Keeps the remote source URLs. |

Runs are idempotent and can be resumed. `data/r2-image-manifest.json` records each photo's source hash, widths and settings. The original object in R2 also stores `variant-sig` and `variant-widths` metadata, so a run with no manifest skips finished photos. Changing the widths or quality regenerates every copy on the next run; copies at widths no longer listed stay in the bucket.

A photo that sharp cannot decode keeps its original, with no marker, and is retried on the next run. Deleting an image in the admin also deletes its WebP copies.

**`sizes`.** Pass a `sizes` prop to every `next/image` or `Cubby` that does not fill the screen width; without it the browser assumes `100vw`.

## Deployment

Deploy to Vercel:

```bash
npm i -g vercel
vercel
```

Set the required environment variables in your Vercel project settings before deploying.

## License

MIT
