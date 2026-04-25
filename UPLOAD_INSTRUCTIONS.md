# HealthSync Login Fix

Your repo already has a migration chain:

- migrations/0001_initial.sql
- migrations/0002_facilities.sql
- migrations/0003_rbac.sql
- migrations/0004_consult_reason.sql
- migrations/0004_appointment_details.sql
- migrations/0005_additional_fields.sql
- migrations/0005_appointment_reason_consultation.sql
- migrations/0006_user_passwords.sql
- migrations/0007_appointment_transport_details.sql

The duplicate file `migrations/0001_init.sql` should be deleted because it competes with the existing `0001_initial.sql`.

## Upload this file

Upload:

```text
migrations/0008_seed_healthsync_admin.sql
```

## Delete this file from the repo

Delete:

```text
migrations/0001_init.sql
```

Do NOT delete:

```text
migrations/0001_initial.sql
```

## Then apply migration to Cloudflare D1

```bash
wrangler d1 migrations apply med_appointment_db --remote
npm run deploy
```

## First login email

```text
admin@healthsync.local
```

Because password is NULL, the app should show first-time password setup.

## If still failing

Open Cloudflare D1 Console and run:

```sql
SELECT id, email, fullName, role, password, lastLogin FROM users;
```

You should see:

```text
admin@healthsync.local
```
