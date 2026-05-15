# Features — toggle + configure

Every feature in this starter is **opt-in**. You can disable any of them by flipping a single boolean, and customize their behaviour by editing a single config file per feature. **No code changes required** — just edit, restart, ship.

---

## 1. Toggle a feature on / off

Open `apps/web/src/config/features.ts`. Each feature has an `enabled` flag:

```ts
export const features = {
  billing: { enabled: true, label: "Billing", ... },
  affiliate: { enabled: false, label: "Affiliate program", ... },
  // ...
};
```

Flip `enabled: false` and restart `pnpm dev` (or rebuild). The result:

- the matching **tab in `/dashboard/settings`** disappears
- the **sidebar link** disappears (where applicable)
- the **API routes** for that feature return 404 / 410 (where wired)

The default ships with the boring-but-essential features on (auth, billing, security, files, organizations, search, notifications, GDPR) and the growth features off (affiliate, referrals) — flip them on when you're ready.

---

## 2. Configure a feature's values

Each feature keeps **one config file** with all editable values (plans, limits, retry budgets, cookie names, etc.). Edit values, never logic.

| Feature | Config file |
|---|---|
| Billing — plans, pricing, features | `packages/billing/src/plans.ts` |
| Auth — rate-limit, RP name, plugins | `packages/auth/src/index.ts` (top of `createAuth()`) |
| Webhooks — timeout, max attempts, backoff | `packages/api/src/webhooks.ts` (top constants) |
| API keys — prefix, default scopes | `packages/api/src/api-keys.ts` (top constants) |
| Affiliate — payout min, default rate | `apps/web/.env` (`AFFILIATE_*`) — these can change per-deploy |
| Referrals — credit amount, max pending | `apps/web/.env` (`REFERRAL_*`) — same |
| GDPR — grace period, export TTL | `packages/api/src/gdpr.ts` (`DELETION_GRACE_DAYS`, `EXPORT_LINK_TTL_SECONDS`) |
| Notifications — poll interval | `apps/web/src/components/app/notification-bell.tsx` (`POLL_MS`) |
| Files — max bytes, MIME allowlist | `apps/web/src/app/(app)/dashboard/files/page.tsx` (`DEFAULT_MAX_BYTES`, `ACCEPT`) |
| Storage prefix — per-user isolation | `packages/storage/src/upload.ts` (`userPrefix()`) |

The rule of thumb: anything you'd expect to change **per project** lives in a single file marked with a top comment. Anything you'd change **per deployment** lives in `.env`. Anything that's actually code (handlers, types, queries) lives where you'd expect.

---

## 3. Add a new feature

If you're adding a new feature that should be toggleable:

1. Add an entry to `apps/web/src/config/features.ts`
2. Gate the settings tab + sidebar link with `isFeatureEnabled("yourFeature")`
3. Gate API routes (server-side):
   ```ts
   import { isFeatureEnabled } from "@/config/features";
   if (!isFeatureEnabled("yourFeature")) return new Response(null, { status: 404 });
   ```
4. Put per-feature config in `packages/<area>/src/<feature>.ts` near the implementation, with a top comment marking it as the user-editable surface
5. Add a row to the table above

---

## 4. Why some configs live in `packages/` instead of `apps/web/src/config/`

Multiple apps (`apps/web`, `apps/marketing`, `apps/admin`) share the same plans / auth / webhook code via the workspace packages. Putting the config inside the package means **all three apps stay in sync automatically** — change billing plans once, the pricing page, the dashboard, and the admin all see the new values on next reload. The feature *toggle* registry stays in `apps/web/src/config/` because only the web app's settings hub renders it.
