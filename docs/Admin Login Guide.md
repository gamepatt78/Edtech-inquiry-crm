# Admin login

## Login page

Open the live site and choose **Team login**, or go directly to:

<https://stately-elf-d17f12.netlify.app/admin>

The login username is the admin email address. There is no separate username.

## Which credentials to use

Use these credentials on the live Team login page:

- **Email:** `admin@example.com`
- **Password:**

The password is intentionally left blank in this guide. Use the `ADMIN_PASSWORD` value configured in Render under **Web Service → Environment**. Do not commit the password to GitHub or share it in chat.

## Create or reset the admin account

Set `DATABASE_URL`, `ADMIN_EMAIL=admin@example.com`, and your private `ADMIN_PASSWORD` in the local `.env` file, then run the command from the project root. The password must be at least 12 characters. In Windows PowerShell, use `npm.cmd` to avoid the script execution policy blocking `npm.ps1`:

```powershell
npm.cmd run create-admin --workspace backend
```

On macOS/Linux, use:

```sh
npm run create-admin --workspace backend
```

The command creates the admin account or updates its password in the database. Make sure Render has the same email and password values as your local `.env`, then redeploy the service after changing production credentials.

## Dashboard

After signing in, the inquiry dashboard is at:

<https://stately-elf-d17f12.netlify.app/dashboard>
