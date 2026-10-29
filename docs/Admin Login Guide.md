# Admin login

## Login page

Open the live site and choose **Team login**, or go directly to:

<https://stately-elf-d17f12.netlify.app/admin>

The login username is the admin email address. There is no separate username.

## Which credentials to use

Use the values configured in Render under **Web Service → Environment**:

- `ADMIN_EMAIL` — the email address used to sign in
- `ADMIN_PASSWORD` — the corresponding password

These are private credentials and are intentionally not written in this file. Do not commit them to GitHub or share them in chat.

## Create or reset the admin account

Set `DATABASE_URL`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in the local `.env` file, then run the command from the project root. In Windows PowerShell, use `npm.cmd` to avoid the script execution policy blocking `npm.ps1`:

```powershell
npm.cmd run create-admin --workspace backend
```

On macOS/Linux, use:

```sh
npm run create-admin --workspace backend
```

The command creates the admin account or updates its password in the database. The password must be at least 12 characters. After changing production credentials, make sure Render has the same `ADMIN_EMAIL` and `ADMIN_PASSWORD` values and redeploy the service.

## Dashboard

After signing in, the inquiry dashboard is at:

<https://stately-elf-d17f12.netlify.app/dashboard>
