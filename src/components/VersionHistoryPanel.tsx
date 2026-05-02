import { History, CheckCircle2 } from "lucide-react";

interface VersionEntry {
  version: string;
  releaseDate: string;
  title: string;
  summary: string;
  capabilities: string[];
  processFlow: string[];
  userImpact: string[];
}

const CURRENT_VERSION = "2.9.0";

const VERSION_HISTORY: VersionEntry[] = [
  {
    version: "2.9.0",
    releaseDate: "2026-04-30",
    title: "Appointment Modal Save Payload Helper Foundation",
    summary:
      "This release adds reusable appointment modal save-payload helpers for future appointment modal and App.tsx cleanup.",
    capabilities: [
      "Added appointment modal save helpers at src/utils/appointmentModalSaveHelpers.ts.",
      "Added a helper to normalize appointment draft values before save.",
      "Added a save-payload helper that combines mode, normalized appointment data, safety messages, duplicate count, and validation counts.",
      "Added a helper to determine when appointment save should be blocked.",
      "Exported the appointment modal save helpers through the appointment modal toolkit.",
      "Kept App.tsx behavior unchanged in this patch to avoid a broad rewrite.",
      "No D1 migration is required for this modular cleanup patch.",
    ],
    processFlow: [
      "Pull the latest main branch.",
      "Run npm run build before deployment.",
      "Use appointment modal save helpers in the next narrow appointment modal or App.tsx replacement patch.",
      "Continue replacing duplicated appointment modal save logic in small build-tested steps.",
    ],
    userImpact: [
      "Keeps appointment workflows stable while cleanup continues.",
      "Creates a shared save-payload foundation for appointment modal workflows.",
      "Makes future appointment modal save cleanup smaller and easier to review.",
    ],
  },
  {
    version: "2.8.9",
    releaseDate: "2026-04-30",
    title: "Appointment Modal Field Update Helper Foundation",
    summary:
      "This release adds reusable appointment modal field-update helpers for future appointment modal and App.tsx cleanup.",
    capabilities: [
      "Added appointment modal field helpers at src/utils/appointmentModalFieldHelpers.ts.",
      "Added helpers to update a single appointment draft field or multiple draft fields at once.",
      "Added workflow-state field update helpers that automatically refresh safety summaries and safety messages after field changes.",
      "Exported the appointment modal field helpers through the appointment modal toolkit.",
      "Kept App.tsx behavior unchanged in this patch to avoid a broad rewrite.",
    ],
    processFlow: [
      "Use appointment modal field helpers in the next narrow appointment modal or App.tsx replacement patch.",
      "Continue replacing duplicated appointment modal field update logic in small build-tested steps.",
    ],
    userImpact: [
      "Keeps appointment workflows stable while cleanup continues.",
      "Creates a shared field-update foundation for appointment modal workflows.",
      "Makes future appointment modal field cleanup smaller and easier to review.",
    ],
  },
  {
    version: "2.8.8",
    releaseDate: "2026-04-30",
    title: "Appointment Modal Workflow Helper Foundation",
    summary:
      "This release adds reusable appointment modal workflow helpers for new, edit, duplicate, and resident-selection workflows.",
    capabilities: [
      "Added appointment modal workflow helpers at src/utils/appointmentModalWorkflowHelpers.ts.",
      "Added helpers to create new, edit, and duplicate appointment modal draft states.",
      "Added a reusable workflow-state helper that combines draft setup, safety summary, and safety messages.",
      "Added a resident-application helper that updates the modal workflow state after selecting a resident.",
      "Exported the appointment modal workflow helpers through the appointment modal toolkit.",
      "Kept App.tsx behavior unchanged in this patch to avoid a broad rewrite.",
    ],
    processFlow: [
      "Use appointment modal workflow helpers in the next narrow appointment modal or App.tsx replacement patch.",
      "Continue replacing duplicated appointment modal workflow logic in small build-tested steps.",
    ],
    userImpact: [
      "Keeps appointment workflows stable while cleanup continues.",
      "Creates a shared workflow foundation for new, edit, duplicate, and resident-selection appointment modal actions.",
      "Makes future appointment modal workflow cleanup smaller and easier to review.",
    ],
  },
  {
    version: "2.8.7",
    releaseDate: "2026-04-30",
    title: "Appointment Modal Safety Helper Foundation",
    summary:
      "This release adds reusable appointment modal safety helpers that combine validation and duplicate-check summaries.",
    capabilities: [
      "Added appointment modal safety helpers at src/utils/appointmentModalSafetyHelpers.ts.",
      "Added a combined safety summary helper that brings together appointment validation results and possible duplicate appointment results.",
      "Added a reusable safety message helper for required items, warnings, and possible duplicate alerts.",
      "Exported the appointment modal safety helpers through the appointment modal toolkit.",
    ],
    processFlow: [
      "Use appointment modal safety helpers in the next narrow appointment modal or App.tsx replacement patch.",
      "Continue replacing duplicated appointment modal safety logic in small build-tested steps.",
    ],
    userImpact: [
      "Keeps appointment workflows stable while cleanup continues.",
      "Creates a shared safety foundation for appointment creation and editing.",
      "Makes future appointment modal safety cleanup smaller and easier to review.",
    ],
  },
];

export function VersionHistoryPanel() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm font-black text-slate-800">
          <History size={18} className="text-sky-700" /> Version History
        </div>
        <span className="inline-flex w-fit items-center rounded-full bg-sky-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-sky-800 ring-1 ring-sky-100">
          Current v{CURRENT_VERSION}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {VERSION_HISTORY.map((entry) => (
          <details key={entry.version} className="rounded-2xl border border-slate-100 bg-slate-50 p-4" open={entry.version === CURRENT_VERSION}>
            <summary className="cursor-pointer text-sm font-black text-slate-800">
              v{entry.version} — {entry.title}
              {entry.version === CURRENT_VERSION && (
                <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-100">
                  Current
                </span>
              )}
            </summary>
            <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-600">{entry.summary}</p>
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <VersionSection title="Capabilities" items={entry.capabilities} />
              <VersionSection title="Workflow" items={entry.processFlow} />
              <VersionSection title="User Impact" items={entry.userImpact} />
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

const VersionSection = ({ title, items }: { title: string; items: string[] }) => (
  <div className="rounded-2xl border border-slate-100 bg-white p-3">
    <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-500">{title}</p>
    <ul className="space-y-2 text-xs font-semibold leading-relaxed text-slate-600">
      {items.map((item, index) => (
        <li key={`${title}-${index}`} className="flex gap-2">
          <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-600" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </div>
);
