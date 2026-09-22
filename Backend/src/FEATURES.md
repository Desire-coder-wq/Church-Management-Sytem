# Backend feature ownership

- `auth/`: account creation, login, JWT strategy and role checks
- `members/`: member and church-group management
- `campaigns/`: campaign lifecycle and campaign totals
- `pledges/`: pledge assignment, balance and status rules
- `collections/`: idempotent collection recording and overpayment protection
- `notifications/`: SMS provider abstraction and delivery logs
- `dashboard/`: aggregate metrics and recent activity
- `reports/`: filtered reports and Excel/PDF export
- `prisma/`: database client lifecycle
- `common/`: shared guards, decorators, filters and validation helpers

The existing `controllers.ts` and `services.ts` remain the running implementation during this safe refactor. Each feature will be moved into its own Nest module without breaking active API clients.
