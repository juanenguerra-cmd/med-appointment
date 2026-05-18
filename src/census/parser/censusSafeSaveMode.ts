import type { CensusImportSummary } from "./censusImportSummary";

export type CensusSafeSaveMode =
  | "review_only"
  | "append_new_only"
  | "update_existing_add_new"
  | "replace_active_census";

export interface CensusSafeSaveModeOption {
  value: CensusSafeSaveMode;
  label: string;
  description: string;
  requiresConfirmation: boolean;
  destructive: boolean;
}

export interface CensusSafeSaveDecision {
  mode: CensusSafeSaveMode;
  canSave: boolean;
  requiresConfirmation: boolean;
  destructive: boolean;
  blockedReason?: string;
  confirmationPhrase?: string;
}

export const CENSUS_SAFE_SAVE_MODE_OPTIONS: CensusSafeSaveModeOption[] = [
  {
    value: "review_only",
    label: "Review Only",
    description: "Parse and review the census without saving changes to the resident registry.",
    requiresConfirmation: false,
    destructive: false,
  },
  {
    value: "append_new_only",
    label: "Append New Only",
    description: "Add residents that are not already in the registry. Existing residents are left unchanged.",
    requiresConfirmation: false,
    destructive: false,
  },
  {
    value: "update_existing_add_new",
    label: "Update Existing + Add New",
    description: "Update matching residents and add new residents after review.",
    requiresConfirmation: false,
    destructive: false,
  },
  {
    value: "replace_active_census",
    label: "Replace Active Census",
    description: "Replace the active resident registry after confirmation. Missing residents must still go to possible discharge review.",
    requiresConfirmation: true,
    destructive: true,
  },
];

export function getCensusSafeSaveModeOption(mode: CensusSafeSaveMode): CensusSafeSaveModeOption {
  return CENSUS_SAFE_SAVE_MODE_OPTIONS.find((option) => option.value === mode) || CENSUS_SAFE_SAVE_MODE_OPTIONS[0];
}

export function getDefaultCensusSafeSaveMode(summary?: CensusImportSummary | null): CensusSafeSaveMode {
  if (!summary) return "review_only";
  if (summary.safeSaveRecommendation === "blocked") return "review_only";
  return "append_new_only";
}

export function getCensusSafeSaveDecision(
  mode: CensusSafeSaveMode,
  summary?: CensusImportSummary | null,
  confirmationText = "",
): CensusSafeSaveDecision {
  const option = getCensusSafeSaveModeOption(mode);

  if (!summary) {
    return {
      mode,
      canSave: false,
      requiresConfirmation: option.requiresConfirmation,
      destructive: option.destructive,
      blockedReason: "Parse and review a census before saving.",
      confirmationPhrase: option.destructive ? "REPLACE" : undefined,
    };
  }

  if (summary.safeSaveRecommendation === "blocked") {
    return {
      mode,
      canSave: false,
      requiresConfirmation: option.requiresConfirmation,
      destructive: option.destructive,
      blockedReason: "Parser errors must be resolved before saving.",
      confirmationPhrase: option.destructive ? "REPLACE" : undefined,
    };
  }

  if (mode === "review_only") {
    return {
      mode,
      canSave: false,
      requiresConfirmation: false,
      destructive: false,
      blockedReason: "Review Only mode does not save changes to the resident registry.",
    };
  }

  if (option.destructive) {
    const confirmationPhrase = "REPLACE";
    const confirmed = confirmationText.trim().toUpperCase() === confirmationPhrase;

    return {
      mode,
      canSave: confirmed,
      requiresConfirmation: true,
      destructive: true,
      blockedReason: confirmed ? undefined : `Type ${confirmationPhrase} to confirm this registry replacement mode.`,
      confirmationPhrase,
    };
  }

  return {
    mode,
    canSave: true,
    requiresConfirmation: option.requiresConfirmation,
    destructive: option.destructive,
  };
}

export function getCensusSafeSaveModeMessage(decision: CensusSafeSaveDecision): string {
  if (decision.canSave) return "Census import is ready for the selected save mode.";
  return decision.blockedReason || "Census import cannot be saved yet.";
}
