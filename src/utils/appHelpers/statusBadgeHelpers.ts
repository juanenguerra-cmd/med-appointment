export type StatusTone = "slate" | "sky" | "emerald" | "amber" | "rose" | "violet";

export interface StatusBadgeMeta {
  label: string;
  tone: StatusTone;
}

const normalizeStatus = (value?: string | null): string =>
  String(value ?? "")
    .trim()
    .toLowerCase();

export function getAppointmentStatusMeta(status?: string | null): StatusBadgeMeta {
  const normalized = normalizeStatus(status);

  if (!normalized) return { label: "Unknown", tone: "slate" };

  if (["scheduled", "confirmed", "booked"].includes(normalized)) {
    return { label: "Scheduled", tone: "sky" };
  }

  if (["completed", "done", "seen"].includes(normalized)) {
    return { label: "Completed", tone: "emerald" };
  }

  if (["cancelled", "canceled", "declined"].includes(normalized)) {
    return { label: "Cancelled", tone: "rose" };
  }

  if (["rescheduled", "changed"].includes(normalized)) {
    return { label: "Rescheduled", tone: "violet" };
  }

  if (["pending", "needs follow-up", "follow up", "follow-up"].includes(normalized)) {
    return { label: "Pending", tone: "amber" };
  }

  return { label: status ?? "Unknown", tone: "slate" };
}

export function getTransportReadinessMeta(isReady?: boolean | null): StatusBadgeMeta {
  if (isReady === true) return { label: "Transport Ready", tone: "emerald" };
  if (isReady === false) return { label: "Transport Not Ready", tone: "amber" };
  return { label: "Transport Unknown", tone: "slate" };
}

export function getServiceLocationMeta(isInHouse?: boolean | string | null): StatusBadgeMeta {
  const normalized = normalizeStatus(String(isInHouse ?? ""));

  if (isInHouse === true || ["yes", "y", "in house", "in-house"].includes(normalized)) {
    return { label: "In-House", tone: "emerald" };
  }

  if (isInHouse === false || ["no", "n", "outside", "external"].includes(normalized)) {
    return { label: "Outside", tone: "sky" };
  }

  return { label: "Not Specified", tone: "slate" };
}

export function getRoundTripMeta(isRoundTrip?: boolean | string | null): StatusBadgeMeta {
  const normalized = normalizeStatus(String(isRoundTrip ?? ""));

  if (isRoundTrip === true || ["yes", "y", "round trip", "round-trip"].includes(normalized)) {
    return { label: "Round Trip", tone: "emerald" };
  }

  if (isRoundTrip === false || ["no", "n", "one way", "one-way"].includes(normalized)) {
    return { label: "One Way", tone: "sky" };
  }

  return { label: "Trip Not Specified", tone: "slate" };
}

export function getEscortMeta(hasEscort?: boolean | string | null): StatusBadgeMeta {
  const normalized = normalizeStatus(String(hasEscort ?? ""));

  if (hasEscort === true || ["yes", "y", "escort"].includes(normalized)) {
    return { label: "Escort Needed", tone: "amber" };
  }

  if (hasEscort === false || ["no", "n", "none"].includes(normalized)) {
    return { label: "No Escort", tone: "emerald" };
  }

  return { label: "Escort Unknown", tone: "slate" };
}

export function getStatusBadgeClassName(tone: StatusTone): string {
  const classes: Record<StatusTone, string> = {
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
    sky: "bg-sky-50 text-sky-700 ring-sky-100",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    rose: "bg-rose-50 text-rose-700 ring-rose-100",
    violet: "bg-violet-50 text-violet-700 ring-violet-100",
  };

  return classes[tone];
}
