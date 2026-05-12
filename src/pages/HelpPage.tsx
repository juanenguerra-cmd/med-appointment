import { motion } from "motion/react";
import { CurrentReleaseNote } from "../components/CurrentReleaseNote";
import { VersionHistoryPanel } from "../components/VersionHistoryPanel";
import type { Facility, User } from "../types";

type HelpPageProps = {
  currentUserRole?: string;
  facilities: Facility[];
  currentFacilityId: string | null | undefined;
  setCurrentFacilityId: (facilityId: string) => void;
  setEditingFac: (facility: Facility | null) => void;
  setIsFacModalOpen: (open: boolean) => void;
  deleteFacility: (facilityId: string) => void;
  users: any[];
  setEditingUser: (user: any) => void;
  setIsUserModalOpen: (open: boolean) => void;
  currentUser?: Pick<User, "id" | "fullName" | "role"> | null;
};

export function HelpPage(_props: HelpPageProps) {
  return (
    <motion.div
      key="help"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.22 }}
      className="space-y-6"
    >
      <CurrentReleaseNote />
      <VersionHistoryPanel />
    </motion.div>
  );
}
