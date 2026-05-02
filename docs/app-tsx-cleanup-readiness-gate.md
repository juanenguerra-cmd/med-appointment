# App.tsx Cleanup Readiness Guide

Current baseline: v3.0.0

This guide prepares the next direct App.tsx import cleanup phase.

## Purpose

App.tsx is large and should be cleaned in small groups only. Each group should build successfully before continuing.

## Stable foundations already added

- `src/hooks/index.ts`
- `src/components/index.ts`
- `src/utils/appointment/index.ts`
- `src/utils/index.ts`
- `src/utils/data/index.ts`
- `src/services/index.ts`
- `src/typeExports.ts`
- `docs/import-cleanup-guide.md`

## Recommended import cleanup order

1. Components
2. Types
3. Hooks
4. Services
5. Data utilities
6. Appointment utilities

## Required command after each cleanup group

```bash
npm run build
```

Continue to the next import group only after the build passes.

## D1 migration

No D1 migration is required for App.tsx import cleanup.

## Next recommended change

Start with the smallest group:

```ts
import { Button, Card } from "./components";
```

This should replace:

```ts
import { Card } from "./components/Card";
import { Button } from "./components/Button";
```

Do not combine this with other import cleanup in the same patch.
