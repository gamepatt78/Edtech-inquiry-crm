# Hoe to Run

## Before starting

- Make sure you have Node.js installed.
- In the project root, make sure `.env` contains your Supabase PostgreSQL connection string, a `JWT_SECRET` of at least 32 characters, and your admin email and password.
- Run `schema.sql` in the Supabase SQL Editor if you have not created the tables yet.

## Start the application

Open PowerShell in this project folder and run:

```powershell
npm.cmd run dev
```

This starts both servers:

- Public inquiry form: <http://localhost:5173>
- Admin login: <http://localhost:5173/admin>
- API health check: <http://localhost:4000/api/health>

The health check should return `{"status":"ok"}`. To log in, use the `ADMIN_EMAIL` and `ADMIN_PASSWORD` values from `.env`. If you have not created the admin account yet, run this once from the project folder:

```powershell
npm.cmd run create-admin --workspace backend
```

Stop the development servers with **Ctrl+C** in the terminal running them.

## If startup fails

- Check that `.env` is in the project root, beside `package.json`.
- Check that the database connection string and Supabase database password are correct, and that the tables exist.
- If a port is already in use, stop the other process using port `4000` or `5173`, then run the start command again.
- Keep `.env` private; do not upload it to GitHub or Netlify.
