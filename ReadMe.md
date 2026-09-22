# Church Pledge Management System

A secure, responsive system for church staff to manage members, campaigns, pledges, collections, SMS notifications and reports.

## Stack

- React, TypeScript and Tailwind CSS
- NestJS REST API with Swagger
- Prisma ORM and Supabase PostgreSQL
- Twilio-ready SMS adapter (mock mode for demonstration)
- Jest for testing (unit, e2e)

## Security

JWT-protected API endpoints, bcrypt password hashing, request validation, Helmet headers, CORS, auth/request rate limiting, payment idempotency keys, unique transaction references and overpayment protection are included.

## Features

### Backend (NestJS)
- **Authentication**: JWT-based auth with signup/login, password hashing
- **Authorization**: Role-based access control (ADMIN, STAFF)
- **Members Management**: CRUD operations for church members with group assignment
- **Campaigns Management**: Create and manage fundraising campaigns with targets
- **Pledges Management**: Assign pledges to members with due dates
- **Collections Management**: Record payments with idempotency protection
- **Dashboard**: Real-time totals, upcoming/overdue pledges, recent collections
- **Reports**: Filterable reports with Excel and PDF export
- **Notifications**: SMS notifications via Twilio (mock mode available) with rate limiting
- **Rate Limiting**: Throttler for API protection
- **Payment Gateway**: Extensible payment gateway service (mock/Stripe/Flutterwave/Paystack)

### Frontend (React + Vite)
- **Landing Page**: Public landing with signup/login
- **Authentication**: Secure login/signup with validation
- **Dashboard**: Visual cards for totals, tables for upcoming/overdue
- **Members/Campaigns/Pledges/Collections**: Full CRUD with modal forms
- **Notifications**: View SMS history with status
- **Reports**: Filterable table with Excel/PDF export
- **Responsive Design**: Mobile-first with Tailwind CSS
- **Color Palette**: Navy/Gold professional theme

## Setup

1. Copy `.env.example` to `Backend/.env`, set `DATABASE_URL` to Supabase PostgreSQL and use a long unique `JWT_SECRET`.
2. Run `npm install` from the repository root.
3. Run `npm run prisma:generate -w Backend`, then `npm run prisma:migrate -w Backend`.
4. Run `npm run prisma:seed -w Backend` to seed sample data.
5. Start backend: `npm run start:dev -w Backend`
6. Start frontend: `npm run dev -w Frontend`

## API Documentation

Swagger UI available at `http://localhost:3000/api/docs`

## Testing

```bash
# Run all tests
npm run test -w Backend

# Run with coverage
npm run test:cov -w Backend
```

## Environment Variables

See `.env.example` for all required variables:

- `DATABASE_URL`: Supabase PostgreSQL connection string
- `DIRECT_URL`: Direct connection for migrations
- `JWT_SECRET`: Long random string (32+ chars)
- `SMS_PROVIDER`: `mock` or `twilio`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`: Twilio credentials
- `PAYMENT_GATEWAY`: `mock`, `stripe`, `flutterwave`, `paystack`
- `FRONTEND_URL`: Frontend origin for CORS
- `PORT`: Backend port (default 3000)

## Color Palette

| Purpose | Color | Hex |
|---------|-------|-----|
| Primary | Deep Navy | #1E3A5F |
| Secondary | Warm Gold | #D4A017 |
| Background | Light | #F8FAFC |
| Cards | White | #FFFFFF |
| Main Text | Dark Slate | #1E293B |
| Secondary Text | Gray | #64748B |
| Success | Green | #16A34A |
| Warning | Amber | #F59E0B |
| Danger | Red | #DC2626 |
| Borders | Light Gray | #E2E8F0 |

## Font

Inter (400, 500, 600, 700) from Google Fonts

## License

MIT