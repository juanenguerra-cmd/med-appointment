import { motion } from "motion/react";
import type { Appointment } from "../types";
import { TrendsTabContent } from "../components/TrendsTabContent";
import { TransportUtilizationPanel } from "../components/TransportUtilizationPanel";

type TrendsPageProps = {
  appointments: Appointment[];
};

export function TrendsPage({ appointments }: TrendsPageProps) {
  return (
    <motion.section
      key="trends"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.18 }}
      className="space-y-6"
    >
      <TrendsTabContent appointments={appointments} />

      <TransportUtilizationPanel appointments={appointments} />
    </motion.section>
  );
}