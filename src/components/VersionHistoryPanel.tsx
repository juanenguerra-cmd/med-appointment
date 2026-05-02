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

const CURRENT_VERSION = "2.8.7";

const VERSION_HISTORY: VersionEntry[] = [
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
      "Kept App.tsx behavior unchanged in this patch to avoid a broad rewrite.",
      "No D1 migration is required for this modular cleanup patch.",
    ],
    processFlow: [
      "Pull the latest main branch.",
      "Run npm run build before deployment.",
      "Use appointment modal safety helpers in the next narrow appointment modal or App.tsx replacement patch.",
      "Continue replacing duplicated appointment modal safety logic in small build-tested steps.",
    ],
    userImpact: [
      "Keeps appointment workflows stable while cleanup continues.",
      "Creates a shared safety foundation for appointment creation and editing.",
      "Makes future appointment modal safety cleanup smaller and easier to review.",
    ],
  },
  {
    version: "2.8.6",
    releaseDate: "2026-04-30",
    title: "Appointment Duplicate Check Helper Foundation",
    summary:
      "This release adds reusable appointment duplicate-check helpers for future appointment modal, table, and App.tsx cleanup.",
    capabilities: [
      "Added appointment duplicate-check helpers at src/utils/appointmentDuplicateHelpers.ts.",
      "Added helpers for duplicate key generation, potential duplicate comparison, duplicate list detection, and boolean duplicate checks.",
      "Duplicate checks compare resident identity, date, time, specialty, provider, and location.",
      "Exported the appointment duplicate-check helpers through the appointment modal toolkit.",
      "Kept App.tsx behavior unchanged in this patch to avoid a broad rewrite.",
    ],
    processFlow: [
      "Use appointment duplicate-check helpers in the next narrow appointment modal, table, or App.tsx replacement patch.",
      "Continue replacing duplicated appointment duplicate-check logic in small build-tested steps.",
    ],
    userImpact: [
      "Keeps appointment workflows stable while cleanup continues.",
      "Creates a shared duplicate-check foundation for appointment creation and editing.",
      "Makes future appointment duplicate warning cleanup smaller and easier to review.",
    ],
  },
  {
    version: "2.8.5",
    releaseDate: "2026-04-30",
    title: "Appointment Validation Helper Foundation",
    summary:
      "This release adds reusable appointment validation helpers for future appointment modal, table, and App.tsx cleanup.",
    capabilities: [
      "Added appointment validation helpers at src/utils/appointmentValidationHelpers.ts.",
      "Added validation helpers for required appointment fields, schedule fields, and transportation fields.",
      "Added helpers to detect blocking validation errors and summarize validation results.",
      "Exported the appointment validation helpers through the appointment modal toolkit.",
      "Kept App.tsx behavior unchanged in this patch to avoid a broad rewrite.",
    ],
    processFlow: [
      "Use appointment validation helpers in the next narrow appointment modal, table, or App.tsx replacement patch.",
      "Continue replacing duplicated appointment validation logic in small build-tested steps.",
    ],
    userImpact: [
      "Keeps appointment workflows stable while cleanup continues.",
      "Creates a shared validation foundation for appointment modal and table workflows.",
      "Makes future appointment validation cleanup smaller and easier to review.",
    ],
  },
  {
    version: "2.8.4",
    releaseDate: "2026-04-30",
    title: "Appointment PDF Helper Foundation",
    summary:
      "This release adds reusable appointment PDF payload helpers for future PDF export, report, table, and App.tsx cleanup.",
    capabilities: [
      "Added appointment PDF helpers at src/utils/appointmentPdfHelpers.ts.",
      "Added helpers for PDF payload creation, safe PDF filename generation, and PDF footer text.",
      "PDF payloads combine print header metadata, summary counts, and table-ready report data in one reusable structure.",
      "Exported the appointment PDF helpers through the appointment modal toolkit.",
    ],
    processFlow: [
      "Use appointment PDF helpers in the next narrow PDF export, report, or App.tsx replacement patch.",
      "Continue replacing duplicated appointment PDF logic in small build-tested steps.",
    ],
    userImpact: [
      "Keeps appointment workflows stable while cleanup continues.",
      "Creates a shared PDF payload foundation for appointment reports and tables.",
      "Makes future appointment PDF cleanup smaller and easier to review.",
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
