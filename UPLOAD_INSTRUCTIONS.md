# Upload Instructions

Upload these files into your repo exactly as shown:

1. `migrations/0001_init.sql`
   - Adds the required D1 database tables.
   - Adds one default facility.
   - Adds one first-time admin user.

2. `public/favicon.svg`
   - Fixes the `/favicon.ico` or missing favicon browser warning.

3. `index.html`
   - Replaces the existing root `index.html`.
   - Updates the title and points to the SVG favicon.

After upload, run:

```bash
npm install
npm run build
wrangler d1 migrations apply med_appointment_db --local
wrangler d1 migrations apply med_appointment_db --remote
npm run deploy
```

First-time login email:

```text
admin@healthsync.local
```

Because the password is NULL, the app should trigger first-time password setup.
