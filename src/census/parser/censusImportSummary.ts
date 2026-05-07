import type { ParsedCensusResult, ParsedResidentDuplicate } from "./censusTypes";

export interface CensusImportSummaryItem {
  label: string;
  value: number;
  tone: "slate" | "sky" | "emerald" | "amber" | "rose";
  description: string;
}

export interface CensusImportSummary {
  importId: string;
  reportDate?: string;
  parsedAt: string;
  totalBlocksDetected: number;
  totalResidentsParsed: number;
  activeResidents: number;
  duplicateGroups: number;
  residentsWithWarnings: number;
  missingMrn: number;
  missingDob: number;
  missingRoom: number;
  missingUnit: number;
  readyToPreview: number;
  needsReview: number;
  criticalIssues: number;
  canProceedToPreview: boolean;
  canProceedToSave: boolean;
  safeSaveRecommendation: "ready" | "review_required" | "blocked";
  summaryItems: CensusImportSummaryItem[];
  duplicateGroupsDetail: ParsedResidentDuplicate[];
  warnings: string[];
  errors: string[];
}

export function createCensusImportSummary(parsed: ParsedCensusResult): CensusImportSummary {
  const residentsWithWarnings = parsed.residents.filter((resident) => resident.warnings.length > 0).length;
  const criticalIssues = parsed.errors.length;
  const needsReview = residentsWithWarnings + parsed.duplicates.length + parsed.errors.length;
  const readyToPreview = Math.max(parsed.residents.length - residentsWithWarnings, 0);

  const canProceedToPreview = parsed.residents.length > 0 && criticalIssues === 0;
  const canProceedToSave = parsed.residents.length > 0 && criticalIssues === 0;

  const safeSaveRecommendation: CensusImportSummary["safeSaveRecommendation"] =
    criticalIssues > 0 ? "blocked" : needsReview > 0 ? "review_required" : "ready";

  return {
    importId: parsed.importId,
    reportDate: parsed.reportDate,
    parsedAt: parsed.parsedAt,
    totalBlocksDetected: parsed.summary.totalBlocksDetected,
    totalResidentsParsed: parsed.summary.totalResidentsParsed,
    activeResidents: parsed.summary.activeResidents,
    duplicateGroups: parsed.summary.duplicateResidents,
    residentsWithWarnings,
    missingMrn: parsed.summary.missingMrn,
    missingDob: parsed.summary.missingDob,
    missingRoom: parsed.summary.missingRoom,
    missingUnit: parsed.summary.missingUnit,
    readyToPreview,
    needsReview,
    criticalIssues,
    canProceedToPreview,
    canProceedToSave,
    safeSaveRecommendation,
    summaryItems: [
      {
        label: "Parsed Residents",
        value: parsed.summary.totalResidentsParsed,
        tone: parsed.summary.totalResidentsParsed > 0 ? "emerald" : "rose",
        description: "Residents extracted from the raw census text.",
      },
      {
        label: "Warnings",
        value: residentsWithWarnings,
        tone: residentsWithWarnings > 0 ? "amber" : "emerald",
        description: "Residents with missing or incomplete census details.",
      },
      {
        label: "Duplicate Groups",
        value: parsed.summary.duplicateResidents,
        tone: parsed.summary.duplicateResidents > 0 ? "amber" : "emerald",
        description: "Potential duplicate residents detected by MRN or identity key.",
      },
      {
        label: "Critical Errors",
        value: criticalIssues,
        tone: criticalIssues > 0 ? "rose" : "emerald",
        description: "Parser errors that should be resolved before save.",
      },
    ],
    duplicateGroupsDetail: parsed.duplicates,
    warnings: parsed.warnings,
    errors: parsed.errors,
  };
}

export function getCensusImportSummaryMessage(summary: CensusImportSummary): string {
  if (summary.safeSaveRecommendation === "blocked") {
    return "Census import is blocked until parser errors are reviewed.";
  }

  if (summary.safeSaveRecommendation === "review_required") {
    return "Census import can be previewed, but warnings or duplicates should be reviewed before saving.";
  }

  return "Census import is ready for preview and save review.";
}
