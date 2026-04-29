import React from "react";
import { Button } from "../../Button";

type AppointmentModalFooterProps = {
  editingId: string | null;
  deleteAppointment: (id: string) => void;
  handleSaveAppointment: () => void;
  onClose: () => void;
};

export function AppointmentModalFooter({
  editingId,
  deleteAppointment,
  handleSaveAppointment,
  onClose,
}: AppointmentModalFooterProps) {
  return (
    <div className="p-6 border-t border-[#d6deeb] bg-white flex items-center justify-between shrink-0">
      <div>
        {editingId && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              if (confirm("Delete this record?")) {
                deleteAppointment(editingId);
                onClose();
              }
            }}
          >
            Delete Record
          </Button>
        )}
      </div>

      <div>
        <Button variant="secondary" className="mr-3" onClick={() => onClose()}>
          Cancel
        </Button>
        <Button onClick={handleSaveAppointment}>
          {editingId ? "Update Appointment Record" : "Save Appointment Record"}
        </Button>
      </div>
    </div>
  );
}
