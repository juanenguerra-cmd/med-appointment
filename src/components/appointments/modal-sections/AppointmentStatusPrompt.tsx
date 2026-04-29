import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../../Button";
import type { Appointment } from "../../../types";

type AppointmentStatusPromptProps = {
  modalStatusPrompt: { status: string; reason: string } | null;
  setModalStatusPrompt: React.Dispatch<
    React.SetStateAction<{ status: string; reason: string } | null>
  >;
  setNewAppt: React.Dispatch<React.SetStateAction<Partial<Appointment>>>;
};

export function AppointmentStatusPrompt({
  modalStatusPrompt,
  setModalStatusPrompt,
  setNewAppt,
}: AppointmentStatusPromptProps) {
  return (
    <AnimatePresence>
      {modalStatusPrompt && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg">Update Status</h3>
            </div>

            <div className="p-6">
              <p className="text-sm font-medium text-slate-600 mb-3 block">
                Reason for changing status to{" "}
                <span className="font-bold text-brand">
                  {modalStatusPrompt.status}
                </span>
                :
              </p>

              <textarea
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all resize-none mb-4"
                rows={3}
                placeholder="Enter reason..."
                value={modalStatusPrompt.reason}
                onChange={(e) =>
                  setModalStatusPrompt({
                    ...modalStatusPrompt,
                    reason: e.target.value,
                  })
                }
              />

              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={() => setModalStatusPrompt(null)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-100 transition-colors"
                >
                  Dismiss
                </button>

                <Button
                  onClick={() => {
                    setNewAppt((prev) => {
                      const existingNotes = prev.notes || "";
                      const val = modalStatusPrompt.status;
                      const reason = modalStatusPrompt.reason;

                      return {
                        ...prev,
                        notes: existingNotes
                          ? `${existingNotes}\n[${val} Reason]: ${reason}`
                          : `[${val} Reason]: ${reason}`,
                      };
                    });

                    setModalStatusPrompt(null);
                  }}
                >
                  Append to Notes
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
