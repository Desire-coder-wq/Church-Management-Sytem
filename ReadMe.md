Church Pledge Manager

A church can register its own workspace, add members and groups, run campaigns, assign pledges and track collections. Staff can send SMS reminders and export reports to Excel or PDF. Members can use a payment link to pay through Pesapal.

Technology

The frontend uses React, TypeScript, Vite and Tailwind CSS. The backend uses NestJS, Prisma and Neon PostgreSQL. Swagger documents the API. Twilio can send SMS when it is configured. Jest checks backend calculations, validation, authentication and API behavior.

Getting started

Install dependencies from the project root with npm install. Copy Backend/.env.example to Backend/.env and add your Neon database URLs and a long JWT secret. Never commit this file. From Backend, run npx prisma generate and npx prisma db push. Then run npm run start:dev in Backend and npm run dev in Frontend. Register a church in the app. No sample data is added.

Live Pesapal payments

Put your live consumer key and secret only in Backend/.env and in the Render backend environment. Set PESAPAL_CHURCH_ID to the ID returned when the church administrator registers or signs in. The app limits these merchant credentials to that church. Set API_PUBLIC_URL to https://church-management-sytem.onrender.com/api and FRONTEND_URL to https://church-management-sytem.pages.dev. Read Backend/PESAPAL_SETUP.txt before accepting payments. Confirm that the Pesapal merchant settlement account belongs to the church. This app does not automatically connect a different merchant account for each church.

The church administrator creates a payment link for a pledge. The member completes payment on Pesapal. The backend checks the transaction with Pesapal before recording a collection and prevents duplicate records. Cash and other offline collections can still be recorded separately.

Running and checking the project

Use npm run build in Backend and Frontend before deployment. Run npm test and npm run test:e2e in Backend for automated tests. Swagger is available at https://church-management-sytem.onrender.com/api/docs. The frontend is hosted at https://church-management-sytem.pages.dev. Frontend/README.txt explains the frontend build and pages.

Security and privacy

The API uses JWT authentication, password hashing, church scoped data access, input validation, rate limiting and security headers. Payment card details and mobile money PINs are entered with Pesapal, not stored by this app. The public site includes privacy, terms and cookies information.

License

MIT
