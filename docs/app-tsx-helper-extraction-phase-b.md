# App.tsx Helper Extraction Phase B

Current baseline: v3.1.0

Phase A import cleanup is complete. Phase B begins the next cleanup stage: moving low-risk helper logic out of App.tsx in small build-tested commits.

## Purpose

App.tsx is still large. Phase B should reduce size and improve maintainability without changing user-facing behavior.

## Safety rules

1. Extract one helper group at a time.
2. Do not combine helper extraction with UI changes.
3. Do not change D1 schema or migrations during helper extraction.
4. Run the build after every extraction.
5. Commit only after the build passes.

## Recommended extraction order

1. Date/time display helpers
2. Status and badge display helpers
3. Search/filter formatting helpers
4. Modal label/title helpers
5. Report/export label helpers
6. Appointment workflow helpers
7. Census workflow helpers
8. Final unused import cleanup

## New helper location

Use this folder for extracted App.tsx helpers:

```text
src/utils/appHelpers/
```

Use this barrel for imports:

```ts
import { helperName } from "./utils/appHelpers";
```

## Required command after each extraction

```bash
npm run build
```

## Recommended local workflow

```bash
git pull
npm run build
git status
git diff
git add .
git commit -m "Extract App date time helpers"
git push
```

## First recommended extraction

Start with date/time helpers because they are low-risk and easier to verify.

Suggested file:

```text
src/utils/appHelpers/dateTimeHelpers.ts
```

Suggested next version:

```text
v3.1.1 — Extract App Date Time Helpers
```

## D1 migration

No D1 migration is required for Phase B helper extraction.
