# EdTech CRM & Inquiry System

A full-stack inquiry workflow with a public contact form and a JWT-protected admin dashboard. The backend uses Express and PostgreSQL; point it at a Supabase PostgreSQL connection string. Admin authentication is implemented in the backend with bcrypt password hashes and signed JWTs; Supabase Auth is not used.

## Requirements

- Node.js 20.19+ (or 22.12+)
- A Supabase project with PostgreSQL access

## Run locally

1. Copy `.env.example` to `.env` and set `DATABASE_URL` to your Supabase PostgreSQL connection string. Use the URI from **Project Settings → Database → Connection string** and retain `sslmode=require`.
2. Set `JWT_SECRET` to a random secret of at least 32 characters. Set `ADMIN_EMAIL` and an `ADMIN_PASSWORD` with at least 12 characters.
3. In the Supabase SQL editor, run the contents of `schema.sql`.
4. Install dependencies from the project root:

   ```sh
   npm install
   ```

5. Create or update the admin login:

   ```sh
   npm run create-admin --workspace backend
   ```

6. Start the frontend and API together:

   ```sh
   npm run dev
   ```

   Open `http://localhost:5173`. The API listens on `http://localhost:4000`; Vite proxies `/api` requests to it.

## Using the app

- Submit a test inquiry at `/`.
- The phone field lets you search countries by name or calling code (for example, `91` finds India `+91`); it limits digits to the selected country's mobile-number lengths and the API validates the full international number.
- Sign in at `/admin` using `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
- The dashboard at `/dashboard` requires a valid JWT. It supports category and user-type filters, name/phone search, and status updates.
- The admin token is kept in `sessionStorage` and sent as a Bearer token. Sign out clears it.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Supabase PostgreSQL connection URI |
| `JWT_SECRET` | Yes | Random signing key, minimum 32 characters |
| `JWT_EXPIRES_IN` | No | JWT lifetime; defaults to `8h` |
| `PORT` | No | API port; defaults to `4000` |
| `NODE_ENV` | No | Runtime mode |
| `FRONTEND_ORIGIN` | No | Allowed browser origin; defaults to `http://localhost:5173` |
| `ADMIN_EMAIL` | Admin setup | Email used by the `create-admin` command |
| `ADMIN_PASSWORD` | Admin setup | Password used by the `create-admin` command (minimum 12 characters) |
| `VITE_API_URL` | Deployment | Optional API origin when the frontend and API do not share an origin |

For separate production origins, configure `FRONTEND_ORIGIN` on the API and `VITE_API_URL` on the frontend. Deploy the backend and frontend over HTTPS, and allow the frontend origin in your hosting platform's network/CORS configuration.

## Database troubleshooting

- Check `http://localhost:4000/api/health`. A healthy API and database return `{"status":"ok"}`.
- If the health check reports a database connection error, replace the example `DATABASE_URL` with the actual connection URI from your Supabase project's **Connect** panel. Do not leave `project-ref` or `password` placeholders in the URI.
- If the API reports missing database tables, run `schema.sql` in the Supabase SQL Editor.

## API

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/inquiries` | Public | Validate and save an inquiry |
| `POST` | `/api/auth/login` | Public, rate-limited | Verify admin credentials and return a JWT |
| `GET` | `/api/inquiries` | Admin JWT | List inquiries; optional `category`, `userType`, and `search` filters |
| `PATCH` | `/api/inquiries/:id/status` | Admin JWT | Set status to `New`, `In Progress`, or `Resolved` |
| `GET` | `/api/health` | Public | API health check |

## Scripts

- `npm run dev` — run both development servers
- `npm run build` — build the frontend
- `npm start` — start the API
- `npm run create-admin --workspace backend` — create or reset the configured admin
- `npm test --workspace backend` — run backend tests
