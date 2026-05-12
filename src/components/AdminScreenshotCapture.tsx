import { useMemo, useState } from "react";
import html2canvas from "html2canvas";
import type { Facility, User } from "../types";
import { apiFetch } from "../api/apiClient";
import { appendLocalAuditEvent, createAuditEvent } from "../utils/auditLog";

type AdminScreenshotCaptureProps = {
  currentUser: Pick<User, "id" | "fullName" | "role"> | null | undefined;
  currentFacility: Facility | null | undefined;
  targetSelector?: string;
};

const isAdminRole = (role: unknown) => String(role || "").trim().toLowerCase() === "admin";

const SENSITIVE_TEXT_PATTERN = /\b(mrn|dob|date of birth|resident|room|diagnosis|allerg(y|ies)|patient)\b/i;

function createMaskOverlays(target: HTMLElement): HTMLDivElement[] {
  const overlays: HTMLDivElement[] = [];
  const allElements = Array.from(target.querySelectorAll<HTMLElement>("*"));
  const explicit = allElements.filter((el) =>
    el.matches('[data-phi="true"], [data-sensitive="true"], input, textarea, [contenteditable="true"]'),
  );
  const implicit = allElements.filter((el) => {
    if (explicit.includes(el)) return false;
    const text = el.textContent?.trim() || "";
    if (!text || text.length > 80) return false;
    return SENSITIVE_TEXT_PATTERN.test(text);
  });

  for (const el of [...explicit, ...implicit]) {
    const rect = el.getBoundingClientRect();
    if (rect.width < 8 || rect.height < 8) continue;
    const mask = document.createElement("div");
    mask.style.position = "fixed";
    mask.style.left = `${Math.max(rect.left - 2, 0)}px`;
    mask.style.top = `${Math.max(rect.top - 2, 0)}px`;
    mask.style.width = `${rect.width + 4}px`;
    mask.style.height = `${rect.height + 4}px`;
    mask.style.background = "rgba(15, 23, 42, 0.95)";
    mask.style.borderRadius = "6px";
    mask.style.pointerEvents = "none";
    mask.style.zIndex = "2147483647";
    mask.setAttribute("data-phi-mask", "true");
    document.body.appendChild(mask);
    overlays.push(mask);
  }

  return overlays;
}

function applyWatermark(
  sourceCanvas: HTMLCanvasElement,
  watermark: { facility: string; user: string; timestamp: string },
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = sourceCanvas.width;
  canvas.height = sourceCanvas.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return sourceCanvas;

  ctx.drawImage(sourceCanvas, 0, 0);
  const barHeight = Math.max(54, Math.round(canvas.height * 0.075));
  ctx.fillStyle = "rgba(11, 42, 111, 0.9)";
  ctx.fillRect(0, canvas.height - barHeight, canvas.width, barHeight);
  ctx.fillStyle = "#ffffff";
  ctx.font = `${Math.max(16, Math.round(canvas.height * 0.02))}px sans-serif`;
  ctx.textBaseline = "middle";
  const text = `${watermark.facility} • ${watermark.user} • ${watermark.timestamp}`;
  ctx.fillText(text, 16, canvas.height - barHeight / 2);
  return canvas;
}

export function AdminScreenshotCapture({
  currentUser,
  currentFacility,
  targetSelector = "#admin-guide-tools-root",
}: AdminScreenshotCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [message, setMessage] = useState<string>("");

  const canCapture = useMemo(
    () => Boolean(currentFacility?.id && currentUser?.id && isAdminRole(currentUser?.role)),
    [currentFacility?.id, currentUser?.id, currentUser?.role],
  );

  const handleCapture = async () => {
    if (!canCapture || !currentUser?.id || !currentFacility?.id) return;
    const consent = window.confirm(
      "Capture screenshot with automatic PHI masking and watermark? Confirm you have patient privacy consent before exporting.",
    );
    if (!consent) return;

    setIsCapturing(true);
    setMessage("");
    const target = document.querySelector(targetSelector) as HTMLElement | null;
    if (!target) {
      setMessage("Capture target not found.");
      setIsCapturing(false);
      return;
    }

    try {
      await apiFetch<{ success: boolean }>("/api/admin/screenshot-authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actorId: currentUser.id,
          facilityId: currentFacility.id,
          consentProvided: true,
        }),
      });

      const masks = createMaskOverlays(target);
      const rawCanvas = await html2canvas(target, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: false,
        logging: false,
        ignoreElements: (el) => (el as HTMLElement).dataset?.screenshotIgnore === "true",
      });
      masks.forEach((mask) => mask.remove());

      const watermarkCanvas = applyWatermark(rawCanvas, {
        facility: currentFacility.name || currentFacility.id,
        user: currentUser.fullName || currentUser.id,
        timestamp: new Date().toISOString(),
      });
      const dataUrl = watermarkCanvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `admin-screenshot-${currentFacility.id}-${Date.now()}.png`;
      a.click();

      appendLocalAuditEvent(
        createAuditEvent({
          action: "create",
          entity: "screenshot",
          facilityId: currentFacility.id,
          actor: { id: currentUser.id, role: currentUser.role },
          summary: "Admin captured screenshot with consent, PHI masking, and watermark.",
          changedFields: ["consent", "phi_masking", "watermark"],
        }),
      );

      await apiFetch<{ success: boolean }>("/api/admin/screenshot-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actorId: currentUser.id,
          facilityId: currentFacility.id,
          summary: "Screenshot captured",
        }),
      });

      setMessage("Screenshot captured and logged.");
    } catch (error) {
      console.error(error);
      setMessage("Screenshot capture failed.");
    } finally {
      setIsCapturing(false);
    }
  };

  if (!isAdminRole(currentUser?.role)) return null;

  return (
    <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4" data-screenshot-ignore="true">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-sky-900">Secure Screenshot</p>
          <p className="mt-1 text-xs font-semibold text-slate-600">
            Admin-only capture with consent confirmation, automatic PHI masking, watermark, and audit logging.
          </p>
        </div>
        <button
          type="button"
          onClick={handleCapture}
          disabled={!canCapture || isCapturing}
          className="rounded-full bg-[#0b2a6f] px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-[#123a8c] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isCapturing ? "Capturing..." : "Capture Screenshot"}
        </button>
      </div>
      {message && <p className="mt-3 text-xs font-semibold text-slate-600">{message}</p>}
    </div>
  );
}

