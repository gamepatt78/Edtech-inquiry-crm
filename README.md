# EdTech CRM & Inquiry System

A full-stack inquiry workflow with a public contact form and a JWT-protected admin dashboard. The frontend is React/Vite; the API is Express and PostgreSQL. Admin authentication is implemented by the backend with bcrypt password hashes and signed JWTs; Supabase Auth is not used.

## Project links and deliverables

- **Live demo:** <https://stately-elf-d17f12.netlify.app/>
- **GitHub repository:** <https://github.com/gamepatt78/Edtech-inquiry-crm>
- **Project report:** [`documents/report.pdf`](documents/report.pdf)
- **Database schema:** [`schema.sql`](schema.sql)
- **Environment template:** [`.env.example`](.env.example)
- **Additional setup guide, login guide, and inquiry examples:** [`docs/`](docs/)

The repository contains separate `frontend/` and `backend/` workspaces. The original assessment brief PDF is intentionally kept out of this repository.

## Requirements

- Node.js 20.19+ (or 22.12+)
- A Supabase project with PostgreSQL access

## Run locally

1. Copy `.env.example` to `.env`. Set `DATABASE_URL` to your Supabase PostgreSQL connection string from **Project Settings → Database → Connection string** and retain `sslmode=require`. Use the session pooler URI if your deployment platform cannot reach the direct database.
2. Set `JWT_SECRET` to a random secret of at least 32 characters. Set `ADMIN_EMAIL` and an `ADMIN_PASSWORD` with at least 12 characters.
3. In the Supabase SQL Editor, run the contents of `schema.sql`.
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

   Open <http://localhost:5173>. The API listens on <http://localhost:4000>; Vite proxies `/api` requests to it.

On Windows PowerShell, use `npm.cmd` instead of `npm` if script execution policy blocks `npm.ps1`.

## Using the app

- Submit an inquiry from `/`.
- The phone field lets you search countries by name or calling code (for example, `91` finds India `+91`); it limits digits to the selected country's mobile-number lengths, and the API validates the full international number.
- Sign in at `/admin` using `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
- The `/dashboard` route requires a valid JWT. The dashboard supports category and user-type filters, name/phone search, and status updates.
- The admin token is kept in `sessionStorage` and sent as a Bearer token for protected API requests. Signing out clears it.

## Team login

Open the live site's **Team login** link or visit <https://stately-elf-d17f12.netlify.app/admin>.

- **Email:** `admin@example.com`
- **Password:** 

The password is intentionally left blank here. Set your own password in the private `.env` file as `ADMIN_PASSWORD` (at least 12 characters), and use the same value in Render's environment settings for the live service. Do not commit or share the password. The login only works after an admin account has been created with `npm run create-admin --workspace backend`.

## Verify admin JWT authentication

1. Configure `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`, then run `npm run create-admin --workspace backend`.
2. Start the app and sign in at <http://localhost:5173/admin>.
3. Confirm that `/dashboard` is available after sign-in. Signing out or opening `/dashboard` without a token should return you to the login page.
4. Send `GET http://localhost:4000/api/inquiries` without an `Authorization` header; it should return HTTP `401`. After login, the frontend sends the signed JWT as `Authorization: Bearer <token>` for protected requests.
5. Run the backend test suite with `npm test --workspace backend`.

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

For separate production origins, configure `FRONTEND_ORIGIN` on the API and `VITE_API_URL` on the frontend. Deploy both over HTTPS and allow the frontend origin in the API's CORS configuration.

## Database troubleshooting

- Check <http://localhost:4000/api/health>. A healthy API and database return `{"status":"ok"}`.
- If the health check reports a database connection error, replace the example `DATABASE_URL` with the actual URI from your Supabase project's **Connect** panel. Do not leave placeholder values in the URI.
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
