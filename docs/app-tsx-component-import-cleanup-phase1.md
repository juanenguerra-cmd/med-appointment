# App.tsx Component Import Cleanup Phase 1

Current baseline: v3.0.1

This guide gives the exact first App.tsx import cleanup patch.

## Purpose

Replace only the Button and Card direct imports with the component barrel import.

## Current imports to replace

```ts
import { Card } from "./components/Card";
import { Button } from "./components/Button";
```

## Replacement import

```ts
import { Button, Card } from "./components";
```

## Do not change in this patch

Do not change these imports yet:

```ts
import { LockScreen } from "./components/LockScreen";
import { AppointmentModal } from "./components/appointments/AppointmentModal";
```

Those should remain direct imports until a later component barrel expansion includes them.

## Required build check

After this exact import change, run:

```bash
npm run build
```

Only continue to the next App.tsx import group after the build passes.

## D1 migration

No D1 migration is required for this import cleanup patch.
