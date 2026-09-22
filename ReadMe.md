# Church Pledge Management System

A secure, responsive system for church staff to manage members, campaigns, pledges, collections, SMS notifications and reports.

## Stack

- React, TypeScript and Tailwind CSS
- NestJS REST API with Swagger
- Prisma ORM and Neon PostgreSQL
- Twilio-ready SMS adapter (mock mode for demonstration)

## Security

JWT-protected API endpoints, bcrypt password hashing, request validation, Helmet headers, CORS, auth/request rate limiting, payment idempotency keys, unique transaction references and overpayment protection are included.

## Setup

1. Copy `.env.example` to `Backend/.env`, set `DATABASE_URL` to Supabase PostgreSQL and use a long unique `JWT_SECRET`.
2. Run `npm install` from the repository root.
3. Run `npm run prisma:generate -w Backend`, then `npm run prisma:migrate -w Backend`.
