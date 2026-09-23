Church Pledge Manager frontend

This is a React and Vite application. It talks to the NestJS backend on Render. The data shown in the dashboard, lists and reports comes from the API, not from sample data.

To run it locally, install the root project dependencies and run npm run dev from the Frontend directory. The frontend defaults to the live backend. To use a different backend, put VITE_API_URL=https://your-backend.example.com in Frontend/.env.local. Do not include /api/docs. Vite reads this value when it builds the site.

The main pages are the landing page, church registration, sign in, dashboard, members, campaigns, pledges, collections, online payments, notifications and reports. The privacy, terms and cookies pages are public. Staff create a payment link from a pledge. The member follows the link and is redirected to Pesapal. The browser return alone does not mark a payment as received. The backend checks the transaction with Pesapal first.

The Cloudflare Pages build command is npm run build in the Frontend directory. The output folder is dist. The public/_headers file adds browser security headers when Cloudflare deploys the site.

The frontend never stores Pesapal keys. Those belong only in Backend/.env locally and Render backend environment variables. A church's settlement details must be verified with Pesapal before using live payment links.

Run npm run build in the Frontend directory to check TypeScript and the production bundle before pushing. Frontend automated tests are not configured yet. Backend unit and end to end tests run from the Backend directory with npm test and npm run test:e2e.
