import { motion } from "motion/react";
import { Database, Plus } from "lucide-react";
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

export function AppointmentsPage({
  appointmentsFilter,
  setAppointmentsFilter,
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
        <div className="flex flex-wrap items-center gap-4 px-4 py-3 bg-slate-50 border-y border-slate-100">
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
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Discontinued">Discontinued</option>
              <option value="Deferred">Deferred</option>
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