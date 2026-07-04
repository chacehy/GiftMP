# GiftMP — Admin/RBAC Lockdown + Etsy Feature Build

## Context

GiftMP is a Next.js 16 / Prisma / Postgres / Better Auth / Chargily marketplace intended to be a full Etsy-equivalent for the Algerian market. The codebase is a working MVP but has two problems the client cares about:

1. **Anyone can become a seller.** `createShop` self-promotes any logged-in user BUYER→SELLER, there's a public "Open a Shop" page + navbar link, and dashboard pages/actions gate by *shop-ownership*, never by *role*. The `ADMIN` role exists in the enum but nothing uses it. The client requires **role-based access control**: buyers self-register freely, but **only admins create seller/shop accounts**.
2. **It's missing most of what makes Etsy Etsy** — product variations, favorites/wishlist, interactive image galleries, real image uploads, rich reviews, buyer↔seller messaging, coupons, order-detail pages, real search/pagination, richer shops.

This plan locks down access control first (the core requirement), then builds the Etsy feature set in reviewable phases. Payment internals (Chargily) and shipping/logistics promises are explicitly **left for the client later** — we build the surfaces but don't invent carrier/payment logic beyond what exists.

### Confirmed decisions
- **Seller onboarding:** admin creates the account; seller receives an email to set their own password (reuses existing Resend `sendResetPassword` flow). Admin can **also** promote an existing buyer. Admin never handles a plaintext password.
- **Image uploads:** wire **real multi-image uploads** now via the existing-but-unused `src/lib/storage.ts` (Supabase Storage).
- **Delivery:** **phased**, admin/RBAC first. Each phase is committed & pushed to `claude/codebase-analysis-95sywa` and left usable.

### Ground rules
- Copy must be **generic marketplace language** — never reference Etsy or "clone" in UI/code/commits.
- This is a **modified Next.js** (`AGENTS.md`): before writing code, `npm install`, then read the relevant guide in `node_modules/next/dist/docs/` — its APIs may differ from stock Next 16. Heed deprecation notices.
- Tailwind is **v4, CSS-config** (`globals.css`, no config file). Reuse brand tokens: `bg-brand`, `bg-brand-dark`, `bg-brand-cream`, `text-brand`, `border-border`, radius/shadow tokens, and animations `animate-fade-in-up`/`animate-slide-down`/`animate-scale-in`, `.glass`. No Shadcn — components are hand-rolled. Reuse `@/lib/utils` (`cn`, `formatCurrency`, `slugify`, `getInitials`, `timeAgo`).

---

## Phase 0 — Bootstrap (do first, every session)

- `npm install` (node_modules is absent in this clone). Confirm the app builds: `npm run build` / `npx tsc --noEmit`.
- Read `node_modules/next/dist/docs/` guides relevant to what each phase touches (routing, middleware, server actions, metadata, image).
- Confirm required env: `DATABASE_URL`, `DIRECT_URL`, `BETTER_AUTH_SECRET`, `RESEND_API_KEY`, Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`), Chargily. Note any missing to the user.
- Remove scratch file `test.ts` at repo root (stray duplicate auth config).

---

## Phase 1 — Admin dashboard + RBAC lockdown  *(core requirement)* — ✅ DONE

Implemented: `src/lib/auth-guard.ts` (`requireRole`/`assertRole`), `src/actions/admin.actions.ts` (`createSellerWithShop` with email-invite password reset, `promoteBuyerToSeller`, `listSellers`, `getAdminStats`), admin UI under `src/app/(main)/admin/*`, `scripts/create-admin.ts` bootstrap (`npm run seed:admin`), role gating in `src/proxy.ts` (renamed from `middleware.ts` — Next.js 16 deprecated the `middleware` file convention) and `dashboard/layout.tsx`, and removal of self-serve shop creation (`createShop` self-promotion, `/dashboard/shop/create` page, navbar/footer/home CTAs).

Also fixed along the way: a missing `/reset-password` page (the invite-email link had nowhere to land) and a pre-existing production-build bug where `sign-in`/`reset-password` used `useSearchParams()` without a Suspense boundary (`next build` was failing before this work started).

Verified end-to-end against a real local Postgres + a real dev server: buyer signup → blocked from `/dashboard` and `/admin`; admin → reaches both; admin creates a seller → seller receives a working invite link → sets password → signs in → reaches `/dashboard` → blocked from `/admin`. `tsc --noEmit`, `prisma validate`, and `next build` all pass clean.


**Goal:** buyers self-register (BUYER); only ADMINs mint sellers/shops; real role gates everywhere.

### Role model — keep the custom `UserRole` enum (do NOT adopt Better Auth `admin` plugin)
The plugin assumes a 2-tier user/admin world with lowercase role values that clash with the `UserRole { BUYER, SELLER, ADMIN }` Postgres enum, and forces unused `banned/*` columns. We only need create-user / set-role / list — a few dozen lines of Prisma. **Hard rule:** server-side user creation must go through Better Auth (`auth.api.signUpEmail`) so password hashing + the `Account` row are correct; raw Prisma is used only for the `role` update and `Shop` row.

**Verify after install** (reason from the installed Better Auth docs, then confirm): `role` is present in `/api/auth/get-session` + `auth.$Infer.Session["user"]`; `auth.api.signUpEmail` signature and that calling it in a server action does **not** hijack the admin's session cookie (discard its `Set-Cookie`); `input:false` blocks `role` in the sign-up body (so role is applied via a follow-up update); the password-reset/invite method name in 1.6.x (`requestPasswordReset` vs `forgetPassword`).

### New files
- `src/lib/auth-guard.ts` — reusable guards over the existing `auth.api.getSession({ headers: await headers() })` pattern:
  - `requireRole(allowed: Role[])` for Server Components/layouts/pages → redirect on no-session / wrong role; returns `{ session, role }`.
  - `assertRole(allowed: Role[])` for server actions → throws so it fits the existing `try/catch → { success, error }` convention.
  - shared `type Role = "BUYER" | "SELLER" | "ADMIN"`.
- `src/actions/admin.actions.ts` (all `assertRole(["ADMIN"])`):
  - `createSellerWithShop({ name, email, shop:{name,slug,description?} })`: pre-check email + slug free → `auth.api.signUpEmail` (random throwaway password admin never sees) → `$transaction`(user.update role=SELLER + shop.create) → trigger password-reset email so seller sets their own password. **Compensation:** if the transaction throws after the Better Auth user was created, `prisma.user.delete` to avoid an orphan (documented atomicity boundary).
  - `promoteBuyerToSeller({ email, shop:{...} })`: assert user exists & role BUYER & no shop → fully atomic `$transaction`(role=SELLER + shop.create).
  - `listSellers()` / `listUsers()` for admin tables.
- `src/app/(main)/admin/layout.tsx` — admin shell (mirror dashboard sidebar styling), top-level `await requireRole(["ADMIN"])`.
- `src/app/(main)/admin/page.tsx` — overview: counts of buyers/sellers/shops/products/orders.
- `src/app/(main)/admin/sellers/page.tsx` — seller/shop list.
- `src/app/(main)/admin/sellers/new/page.tsx` — client form, two modes ("Create new seller" / "Promote existing buyer"), styled from `dashboard/shop/create/page.tsx` (brand tokens, `slugify`, spinner button).
- `src/app/(main)/admin/users/page.tsx` — user list + promote entry point.
- `scripts/create-admin.ts` + `package.json` script `"seed:admin"` (add `tsx` devDep) — standalone bootstrap: `signUpEmail` then `prisma.user.update({ role:"ADMIN", emailVerified:true })`; idempotent on existing email. Verify `@/*`/`src/generated/prisma` resolution under `tsx` (use relative imports or `tsconfig-paths`).

### Modified files
- `src/middleware.ts` — add `"/admin/:path*"` to matcher; gate `/admin` (ADMIN only) and `/dashboard` (SELLER|ADMIN) reading `session.user.role`; leave `/checkout`,`/orders` existence-only. (Middleware is UX/defense-in-depth; the server guards are the real boundary.)
- `src/app/(main)/dashboard/layout.tsx` — replace the unused `userRole` read with `await requireRole(["SELLER","ADMIN"])`.
- `src/actions/shop.actions.ts` — remove the BUYER→SELLER self-promotion in `createShop`; delete the public `createShop` path (shops now come from admin); keep `updateShop` (sellers edit own shop by ownership). Add `assertRole(["SELLER","ADMIN"])` hardening to seller actions (product/order/shop) as belt-and-suspenders atop existing ownership checks.
- `src/app/(main)/dashboard/shop/create/page.tsx` — delete (or `redirect("/dashboard")`).
- `src/components/layout/navbar.tsx` — remove the BUYER "Open a Shop" link; keep "Seller Dashboard" for SELLER/ADMIN; add an "Admin" link when role === ADMIN.
- Home page `src/app/(main)/page.tsx` + footer `src/components/layout/footer.tsx` — drop the self-serve "start selling / open a shop" CTAs that point at the removed page.

**Phase 1 verification:** seed an admin; log in → `/admin` reachable, buyer hitting `/admin` or `/dashboard` is redirected; admin creates a seller → seller gets set-password email, logs in, sees `/dashboard`, can create products; the old `/dashboard/shop/create` and navbar "Open a Shop" are gone; direct POST to `createShop` as a buyer is rejected.

---

## Phase 2 — Product depth (listings that feel like Etsy)

**Schema additions** (`prisma/schema.prisma`, one migration):
- `Product`: add `tags String[]`, `materials String[]`, `type ProductType` (`PHYSICAL`/`DIGITAL` or `HANDMADE`/`VINTAGE`/`SUPPLY`), `processingTime String?`, `personalization String?` (buyer note prompt), `isActive`/`quantity` already covered by `stock`.
- New `ProductVariant { id, productId, name, options String[] }` **or** the simpler Etsy model: `VariationType`/`VariationOption` + per-combination `sku/price/stock`. Recommend starting with single-dimension variations (e.g. Size, Color) with per-option price delta + stock, expandable later.
- `Category`: add self-relation `parentId`/`parent`/`children` for subcategories; seed a real category tree.
- `Review`: add `ReviewImage` relation + `sellerResponse String?` + `sellerRespondedAt`.

**Image uploads (wire `src/lib/storage.ts`):**
- New `src/app/api/uploads/route.ts` (or a server action) guarded by `assertRole(["SELLER","ADMIN"])` that validates file type/size and calls `uploadFile(bucket, path, ...)`; buckets `product-images`, `shop-assets`.
- New `src/components/forms/image-uploader.tsx` — multi-file picker + preview thumbnails + drag-reorder + delete; outputs ordered URLs. Replace the URL text inputs in `dashboard/products/new/page.tsx` (and the edit page) and add logo/banner upload to `dashboard/shop/page.tsx`.

**Product detail (`src/app/(main)/product/[id]/page.tsx`):**
- Extract an interactive **client gallery** component (thumbnail click swaps main image; the current thumbnails are static). Render shop `logoUrl` (currently fetched but shown as a letter avatar).
- Add variation selector wired into `add-to-cart-button.tsx` (variant must be chosen before add); surface tags/materials/processing-time/personalization; add "More from this shop" + related items.
- `review-section.tsx`: rating-distribution histogram, photo reviews, seller responses, verified-purchase badge, live update after submit (currently says "refresh to see it").

**Seller dashboard:** listings manager with the richer fields; product create/edit uses the uploader + variations; keep the existing `_count`/stats.

**Phase 2 verification:** create a listing with 4 uploaded photos + 2 variations + tags; product page gallery swaps images, variation gating works, add-to-cart respects variant stock; submit a review with a photo and see it appear; seller replies to a review.

---

## Phase 3 — Buyer experience & discovery

- **Favorites/Wishlist:** new `Favorite { userId, productId, @@unique }` model; heart toggle on `product-card.tsx` + product detail (server action `toggleFavorite`); `/favorites` page. (Optionally Etsy "lists/collections" later.)
- **Search & discovery (`products/page.tsx`):** real **pagination** (replace `take:40`), price-range filter, rating filter, in-stock filter, sort by rating/popularity, search across tags/materials (not just title/description); category landing pages using the new category tree.
- **Cart/checkout:** per-shop grouping in `cart/page.tsx` + line-item subtotals; order summary on `checkout/page.tsx` (currently shows none); structured Algerian address (wilaya/commune selects + phone) replacing the single free-text field — **stop before** inventing shipping-rate/carrier logic (client's later item).
- **Orders:** dedicated **order-detail page** `/orders/[id]` (thumbnails currently link to products, not the order) with per-item breakdown, status timeline, reorder, and "leave a review" from a delivered order; status filter on the list.
- **Storefront (`shop/[slug]`):** render banner + logo, shop announcement, policies/about, aggregate shop rating, shop sections, per-shop search/sort/pagination.

**Phase 3 verification:** favorite a product and see it on `/favorites`; browse with pagination + price/rating filters; place an order and open its detail page + reorder; view a fully-branded storefront.

---

## Phase 4 — Messaging, coupons, shop polish

- **Messaging ("convos"):** `Conversation { buyerId, shopId }` + `Message { conversationId, senderId, body, createdAt, readAt }`; inbox + thread UI for buyers and sellers; "Message shop/seller" buttons on product & storefront; server actions guarded by participant checks. (Real-time can be polling first.)
- **Coupons/discounts:** `Coupon { shopId, code, type, value, minSpend?, expiresAt, usageLimit }`; seller create/manage UI; buyer applies at cart/checkout; validation in the order action.
- **Admin moderation:** product/review moderation (flag/remove), user suspend, category management, platform stats/commission reporting.
- **Reliability fixes surfaced during exploration:** webhook idempotency + guard against double stock-decrement and negative stock (`api/webhooks/chargily/route.ts`); order status-transition rules in `order.actions.ts`/`order-status-updater.tsx`; Zod-parse the bare-string input in `removeCartItem`; replace silent `catch {}` blocks in dashboard pages with surfaced errors.
- **SEO/polish:** metadata across pages, `next/image`, loading skeletons (`.skeleton` exists), responsive QA.

**Phase 4 verification:** buyer↔seller message thread round-trips; a coupon reduces an order total and respects limits; admin removes a flagged listing; replayed Chargily webhook doesn't double-decrement stock.

---

## Cross-cutting verification
- After each phase: `npx tsc --noEmit`, `npm run lint`, `npx prisma validate`, `npx prisma migrate dev` for schema changes, and `npm run build`.
- Drive the actual flows in a running dev server (`npm run dev`) per the `/verify` skill — not just types. Seed data via `scripts/create-admin.ts` + an admin-created seller + a listing.
- Commit + push each phase to `claude/codebase-analysis-95sywa` with clear messages; no PR unless requested.

## Key risks / notes
- `node_modules` and the modified Next.js docs are unavailable until `npm install`; several Better Auth specifics (Phase 1 "verify" list) can only be confirmed then — do that before writing the admin flow.
- Chargily/Supabase/Resend need real credentials to exercise end-to-end; where absent, verify logic paths and flag to the user.
- Scope is large; phases are independently shippable so the client sees the RBAC lockdown working before later features land.
