import React, { useMemo, useState } from 'react';
import { Activity, CheckCircle2, ClipboardCheck, Database, Download, RefreshCw, ShieldCheck, AlertTriangle } from 'lucide-react';
import { getLocalAuditEvents } from '../utils/auditLog';

type ChecklistItem = {
  id: string;
  category: string;
  label: string;
  description: string;
  status: 'Ready' | 'Review' | 'Pending';
  evidence: string;
};

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: 'runtime-error-boundary',
    category: 'Runtime Safety',
    label: 'Error Boundary installed',
    description: 'React render crashes should show a recovery screen instead of a blank page.',
    status: 'Ready',
    evidence: 'src/components/ErrorBoundary.tsx + src/main.tsx wrapper',
  },
  {
    id: 'runtime-logging',
    category: 'Runtime Safety',
    label: 'Runtime error logging enabled',
    description: 'Window errors and unhandled promise rejections are captured locally for troubleshooting.',
    status: 'Ready',
    evidence: 'med_appointment_runtime_errors_v1 localStorage key',
  },
  {
    id: 'client-validation',
    category: 'Data Integrity',
    label: 'Client validation layer active',
    description: 'Appointments, residents, and facilities are normalized before save.',
    status: 'Ready',
    evidence: 'src/utils/dataValidation.ts',
  },
  {
    id: 'write-boundary',
    category: 'D1 Efficiency',
    label: 'Write boundary guard active',
    description: 'Invalid saves are blocked and updates use dirty-checking before API calls.',
    status: 'Ready',
    evidence: 'useHealthData write functions validate before write',
  },
  {
    id: 'server-validation',
    category: 'Data Integrity',
    label: 'Server validation before D1 writes',
    description: 'Worker API rejects invalid facility, resident, and appointment payloads before D1.',
    status: 'Ready',
    evidence: 'src/worker.ts validation helpers',
  },
  {
    id: 'audit-local',
    category: 'Audit / Compliance',
    label: 'Local audit logging enabled',
    description: 'Appointment, resident, and census actions are logged locally without D1 cost.',
    status: 'Ready',
    evidence: 'med_appointment_audit_log_v1 localStorage key',
  },
  {
    id: 'audit-viewer',
    category: 'Audit / Compliance',
    label: 'Audit viewer available',
    description: 'Audit events can be reviewed, filtered, and exported from the UI.',
    status: 'Ready',
    evidence: 'src/components/AuditViewerPanel.tsx',
  },
  {
    id: 'd1-health',
    category: 'Deployment',
    label: 'API health check route available',
    description: 'The Worker exposes a health route to confirm D1 connectivity.',
    status: 'Review',
    evidence: 'GET /api/health should return status ok and database Connected',
  },
  {
    id: 'build-test',
    category: 'Deployment',
    label: 'Production build passes',
    description: 'Run npm run build locally and confirm Cloudflare build succeeds.',
    status: 'Review',
    evidence: 'npm run build',
  },
  {
    id: 'user-guide-version-history',
    category: 'Documentation',
    label: 'User guide and version history updated',
    description: 'Document workflow additions before production release.',
    status: 'Pending',
    evidence: 'VersionHistoryPanel / Help section update needed',
  },
];

const STATUS_STYLES: Record<ChecklistItem['status'], string> = {
  Ready: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Review: 'bg-amber-50 text-amber-700 border-amber-200',
  Pending: 'bg-slate-50 text-slate-600 border-slate-200',
};

function countByStatus(items: ChecklistItem[], status: ChecklistItem['status']) {
  return items.filter((item) => item.status === status).length;
}

function getRuntimeErrorCount() {
  try {
    const events = JSON.parse(localStorage.getItem('med_appointment_runtime_errors_v1') || '[]');
    return Array.isArray(events) ? events.length : 0;
  } catch {
    return 0;
  }
}

function buildChecklistCsv(items: ChecklistItem[]) {
  const rows = [
    ['Category', 'Item', 'Status', 'Description', 'Evidence'],
    ...items.map((item) => [item.category, item.label, item.status, item.description, item.evidence]),
  ];
  return rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
}

function downloadChecklist(items: ChecklistItem[]) {
  const blob = new Blob([buildChecklistCsv(items)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `production-readiness-checklist-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function SummaryTile({ label, value, sublabel, icon }: { label: string; value: string | number; sublabel: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#d6deeb] bg-white p-4 shadow-sm flex items-center gap-3">
      <div className="w-11 h-11 rounded-2xl bg-brand-light flex items-center justify-center text-[#0b2a6f]">{icon}</div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-black">{label}</p>
        <p className="text-2xl font-black text-[#0b2a6f] leading-tight">{value}</p>
        <p className="text-[11px] text-slate-500 font-semibold mt-0.5">{sublabel}</p>
      </div>
    </div>
  );
}

export function ProductionChecklistPanel() {
  const [refreshKey, setRefreshKey] = useState(0);

  const runtimeErrorCount = useMemo(() => getRuntimeErrorCount(), [refreshKey]);
  const auditEventCount = useMemo(() => getLocalAuditEvents().length, [refreshKey]);
  const readyCount = countByStatus(CHECKLIST_ITEMS, 'Ready');
  const reviewCount = countByStatus(CHECKLIST_ITEMS, 'Review');
  const pendingCount = countByStatus(CHECKLIST_ITEMS, 'Pending');
  const readinessPercent = Math.round((readyCount / CHECKLIST_ITEMS.length) * 100);

  return (
    <section className="transport-card overflow-hidden">
      <div className="p-5 border-b border-[#d6deeb] bg-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-light px-3 py-1 text-[10px] font-black uppercase tracking-wider text-brand mb-2">
              <ClipboardCheck size={14} />
              Production Readiness
            </div>
            <h3 className="font-black text-[#0b2a6f] text-lg">Production Checklist</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl">
              UI-only readiness dashboard for final go-live review. This panel reads local app status only and does not query Cloudflare D1.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setRefreshKey((value) => value + 1)} className="rounded-full border border-[#d6deeb] bg-white px-4 py-2 text-xs font-black text-[#0b2a6f] hover:bg-slate-50 inline-flex items-center gap-2">
              <RefreshCw size={14} /> Refresh
            </button>
            <button type="button" onClick={() => downloadChecklist(CHECKLIST_ITEMS)} className="rounded-full bg-[#0b2a6f] px-4 py-2 text-xs font-black text-white hover:opacity-90 inline-flex items-center gap-2">
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="p-5 bg-[#f8fbff] border-b border-[#d6deeb]">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
          <SummaryTile label="Readiness" value={`${readinessPercent}%`} sublabel={`${readyCount}/${CHECKLIST_ITEMS.length} ready`} icon={<ShieldCheck size={20} />} />
          <SummaryTile label="Review" value={reviewCount} sublabel="Needs verification" icon={<AlertTriangle size={20} />} />
          <SummaryTile label="Pending" value={pendingCount} sublabel="Documentation/tasks" icon={<ClipboardCheck size={20} />} />
          <SummaryTile label="Audit Events" value={auditEventCount} sublabel="Local browser log" icon={<Database size={20} />} />
          <SummaryTile label="Runtime Errors" value={runtimeErrorCount} sublabel="Local crash log" icon={<Activity size={20} />} />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-white text-[10px] uppercase tracking-wider text-slate-400 font-black">
            <tr>
              <th className="px-5 py-3 border-b border-[#eef2f7]">Status</th>
              <th className="px-5 py-3 border-b border-[#eef2f7]">Category</th>
              <th className="px-5 py-3 border-b border-[#eef2f7]">Checklist Item</th>
              <th className="px-5 py-3 border-b border-[#eef2f7]">Evidence / Verification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eef2f7]">
            {CHECKLIST_ITEMS.map((item) => (
              <tr key={item.id} className="bg-white hover:bg-brand-light/20 align-top transition-colors">
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${STATUS_STYLES[item.status]}`}>
                    {item.status === 'Ready' && <CheckCircle2 size={12} />}
                    {item.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-xs font-black text-[#0b2a6f] whitespace-nowrap">{item.category}</td>
                <td className="px-5 py-4 min-w-72">
                  <p className="text-sm font-black text-slate-800">{item.label}</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.description}</p>
                </td>
                <td className="px-5 py-4 text-xs text-slate-500 min-w-72 font-mono">{item.evidence}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
