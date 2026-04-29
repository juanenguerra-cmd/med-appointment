import { motion } from "motion/react";
import { Database, Plus, ClipboardList } from "lucide-react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import type { Appointment, Facility, Resident } from "../types";

type AppointmentsFilter = {
  dateRange: string;
  month: string;
  status: string;
};

type AppointmentsPageProps = {
  appointmentsFilter: AppointmentsFilter;
  setAppointmentsFilter: React.Dispatch<React.SetStateAction<AppointmentsFilter>>;
  appointments: Appointment[];
  filteredTabAppointments: Appointment[];
  residents: Resident[];
  currentFacility: Facility | undefined;
  handleOpenAdd: () => void;
  handleOpenEdit: (appointment: Appointment) => void;
  handleSaveAllAppointments: (updates: Record<string, Partial<Appointment>>) => void;
  handleDuplicateAppt: (appointment: Appointment) => void;
  handleGenerateForm: (appointment: Appointment, formType: string) => void;
  getAppointmentSortTime: (appointment: Partial<Appointment>) => number;
  EmptyState: (props: {
    icon: React.ReactNode;
    title: string;
    text: string;
  }) => JSX.Element;
  WideAppointmentTable: (props: {
    appointments: Appointment[];
    residents: Resident[];
    currentFacility?: Facility;
    selectedColumns?: string[];
    onEdit: (appointment: Appointment) => void;
    onSaveAll: (updates: Record<string, Partial<Appointment>>) => void;
    onDuplicate: (appointment: Appointment) => void;
    onGenerateForm: (appointment: Appointment, formType: string) => void;
  }) => JSX.Element;
};

const SCHEDULING_QUEUE_STATUS = "Pending Scheduling Review";

export function AppointmentsPage({
  appointmentsFilter,
  setAppointmentsFilter,
  appointments,
  filteredTabAppointments,
  residents,
  currentFacility,
  handleOpenAdd,
  handleOpenEdit,
  handleSaveAllAppointments,
  handleDuplicateAppt,
  handleGenerateForm,
  getAppointmentSortTime,
  EmptyState,
  WideAppointmentTable,
}: AppointmentsPageProps) {
  const schedulingQueueCount = appointments.filter(
    (appointment) => appointment.status === SCHEDULING_QUEUE_STATUS,
  ).length;

  const showSchedulingQueue = () => {
    setAppointmentsFilter((prev) => ({
      ...prev,
      dateRange: "all",
      status: SCHEDULING_QUEUE_STATUS,
    }));
  };

  return (
    <motion.section
      key="appointments"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.18 }}
      className="space-y-5"
    >
      <Card
        title="Consolidated Appointment Log"
        subtitle="High-definition tabular view of all medical visits and logistics."
        actions={
          <Button size="sm" onClick={handleOpenAdd}>
            <Plus size={15} /> Add Record
          </Button>
        }
        className="overflow-hidden"
      >
        <div className="mx-4 mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-xl bg-amber-100 p-2 text-amber-700">
                <ClipboardList size={18} />
              </div>
              <div>
                <p className="font-black text-amber-950">
                  Scheduling Coordinator Review Queue
                </p>
                <p className="mt-1 text-xs font-semibold leading-relaxed text-amber-800">
                  Use this queue for new appointment requests submitted without a confirmed appointment date. Open the request, add the final date/time, then update or save so it becomes scheduled.
                </p>
              </div>
            </div>
            <Button size="sm" variant="secondary" onClick={showSchedulingQueue}>
              View Queue{schedulingQueueCount > 0 ? ` (${schedulingQueueCount})` : ""}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 px-4 py-3 bg-slate-50 border-y border-slate-100 mt-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">
              Date Range
            </span>

            <select
              className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand/20 transition-all cursor-pointer shadow-sm text-slate-700"
              value={appointmentsFilter.dateRange}
              onChange={(e) =>
                setAppointmentsFilter({
                  ...appointmentsFilter,
                  dateRange: e.target.value,
                })
              }
            >
              <option value="next7days">Today + Next 7 Days</option>
              <option value="month">Specific Month</option>
              <option value="all">All Dates</option>
            </select>

            {appointmentsFilter.dateRange === "month" && (
              <input
                type="month"
                className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-brand/20 transition-all shadow-sm text-slate-700 h-[34px]"
                value={appointmentsFilter.month}
                onChange={(e) =>
                  setAppointmentsFilter({
                    ...appointmentsFilter,
                    month: e.target.value,
                  })
                }
              />
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase ml-2">
              Status
            </span>

            <select
              className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand/20 transition-all cursor-pointer shadow-sm text-slate-700"
              value={appointmentsFilter.status}
              onChange={(e) =>
                setAppointmentsFilter({
                  ...appointmentsFilter,
                  status: e.target.value,
                })
              }
            >
              <option value="All">All Statuses</option>
              <option value={SCHEDULING_QUEUE_STATUS}>Pending Scheduling Review</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Discontinued">Discontinued</option>
              <option value="Deferred">Deferred</option>
              <option value="Rescheduled">Rescheduled</option>
            </select>
          </div>
        </div>

        <div className="mt-2">
          {filteredTabAppointments.length > 0 ? (
            <WideAppointmentTable
              appointments={[...filteredTabAppointments].sort(
                (a, b) => getAppointmentSortTime(a) - getAppointmentSortTime(b),
              )}
              residents={residents}
              currentFacility={currentFacility}
              onEdit={handleOpenEdit}
              onSaveAll={handleSaveAllAppointments}
              onDuplicate={handleDuplicateAppt}
              onGenerateForm={handleGenerateForm}
            />
          ) : (
            <EmptyState
              icon={<Database size={44} />}
              title="No entries found"
              text="No appointments match the current filters."
            />
          )}
        </div>
      </Card>
    </motion.section>
  );
}
