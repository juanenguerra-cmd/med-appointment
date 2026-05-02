# Import Cleanup Guide

Current baseline: v2.9.9

This guide documents the stable import paths added before the next App.tsx cleanup phase.

## Stable import paths

### Hooks

Use this path for hook imports:

```ts
import { useHealthData } from "../hooks";
```

Current compatibility files:

- `src/hooks/useHealthData.ts`
- `src/hooks/index.ts`

### Components

Use this path for shared component imports:

```ts
import { Button, Card } from "../components";
```

Current compatibility file:

- `src/components/index.ts`

### Appointment utilities

Use this path for appointment utility imports:

```ts
import { buildAppointmentTableRows } from "../utils/appointment";
```

Current compatibility file:

- `src/utils/appointment/index.ts`

### Shared utilities

Use this path for shared utility imports:

```ts
import { buildAppointmentTableRows } from "../utils";
```

Current compatibility file:

- `src/utils/index.ts`

### Data utilities

Use this path for data validation, audit log, and census reconciliation imports:

```ts
import { normalizeResident, createAuditEvent } from "../utils/data";
```

Current compatibility file:

- `src/utils/data/index.ts`

### Services

Use this path for service imports:

```ts
import { reconcileCensusOnBackend } from "../services";
```

Current compatibility file:

- `src/services/index.ts`

### Types

Use this path for type-only imports:

```ts
import type { Appointment, Resident } from "../typeExports";
```

Current compatibility file:

- `src/typeExports.ts`

## Safe cleanup rule

Do not rewrite all App.tsx imports at once. Replace one import group at a time, then run:

```bash
npm run build
```

Only continue to the next group after the build passes.

## Recommended order

1. Components
2. Types
3. Hooks
4. Services
5. Data utilities
6. Appointment utilities

## D1 migration

No D1 migration is required for import cleanup.
