import { motion } from "motion/react";
import { CurrentReleaseNote } from "../components/CurrentReleaseNote";
import { VersionHistoryPanel } from "../components/VersionHistoryPanel";
import { AdminGuideTools } from "../components/AdminGuideTools";
import { AdminRecoveryPanel } from "../components/AdminRecoveryPanel";
import { UserAccessMatrixPanel } from "../components/UserAccessMatrixPanel";
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

const isAdminRole = (role: unknown) => {
  const normalized = String(role || "").trim().toLowerCase();
  return normalized === "admin" || normalized === "administrator" || normalized === "super admin" || normalized === "superadmin";
};

export function HelpPage({
  currentUserRole,
  facilities,
  currentFacilityId,
  setCurrentFacilityId,
  setEditingFac,
  setIsFacModalOpen,
  deleteFacility,
  users,
  setEditingUser,
  setIsUserModalOpen,
  currentUser,
}: HelpPageProps) {
  const showAdminTools = isAdminRole(currentUserRole || currentUser?.role);

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

      <AdminGuideTools
        currentUserRole={currentUserRole}
        facilities={facilities}
        currentFacilityId={currentFacilityId}
        setCurrentFacilityId={setCurrentFacilityId}
        setEditingFac={setEditingFac}
        setIsFacModalOpen={setIsFacModalOpen}
        deleteFacility={deleteFacility}
        users={users}
        setEditingUser={setEditingUser}
        setIsUserModalOpen={setIsUserModalOpen}
        currentUser={currentUser}
      />

      {showAdminTools && (
        <>
          <UserAccessMatrixPanel
            users={users}
            facilities={facilities}
            currentFacilityId={currentFacilityId || null}
            currentUser={currentUser}
          />
          <AdminRecoveryPanel
            currentFacilityId={currentFacilityId || null}
            currentUser={currentUser}
          />
        </>
      )}
    </motion.div>
  );
}
