import { ReactNode } from "react";
import { motion } from "motion/react";
import { Calendar, Users, ShieldCheck, Activity } from "lucide-react";
import { AppointmentCalendar } from "../components/AppointmentCalendar";
import type { Appointment, Resident } from "../types";
import { getResidentStatusGroup } from "../utils/residentStatus";

type DashboardPageProps = {
  appointments: Appointment[];
  residents: Resident[];
  completedAppointmentsCount: number;
  nextAppointmentDateLabel: string;
  nextAppointmentTimeLabel: string;
  getDoctorNameDisplay: (appointment: Appointment) => string;
  onNavigateAppointments: () => void;
  onNavigateCensus: () => void;
  onAppointmentClick: (appointment: Appointment) => void;
  StatCard: (props: {
    label: string;
    value: string;
    hint: string;
    icon: ReactNode;
    onClick?: () => void;
  }) => JSX.Element;
};

export function DashboardPage({
  appointments,
  residents,
  completedAppointmentsCount,
  nextAppointmentDateLabel,
  nextAppointmentTimeLabel,
  getDoctorNameDisplay,
  onNavigateAppointments,
  onNavigateCensus,
  onAppointmentClick,
  StatCard,
}: DashboardPageProps) {
  const activeResidentCount = residents.filter(
    (resident) => getResidentStatusGroup(resident) === "Active",
  ).length;

  return (
    <motion.section
      key="dashboard"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.18 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Appointments"
          value={appointments.length.toString()}
          hint="Total saved visits"
          icon={<Calendar />}
          onClick={onNavigateAppointments}
        />

        <StatCard
          label="Patient Census"
          value={activeResidentCount.toString()}
          hint="Active Registry"
          icon={<Users />}
          onClick={onNavigateCensus}
        />

        <StatCard
          label="Completed"
          value={completedAppointmentsCount.toString()}
          hint="Closed visit records"
          icon={<ShieldCheck />}
          onClick={onNavigateAppointments}
        />

        <StatCard
          label="Next Visit"
          value={nextAppointmentDateLabel}
          hint={nextAppointmentTimeLabel}
          icon={<Activity />}
          onClick={onNavigateAppointments}
        />
      </div>

      <div className="w-full">
        <div className="min-h-[620px]">
          <AppointmentCalendar
            appointments={appointments}
            residents={residents}
            getDoctorNameDisplay={getDoctorNameDisplay}
            onAppointmentClick={onAppointmentClick}
          />
        </div>
      </div>
    </motion.section>
  );
}
