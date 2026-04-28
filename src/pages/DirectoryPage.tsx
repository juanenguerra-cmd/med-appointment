import { motion } from "motion/react";
import { TransportationDirectory } from "../components/TransportationDirectory";

export function DirectoryPage() {
  return (
    <motion.section
      key="directory"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.18 }}
      className="space-y-6"
    >
      <TransportationDirectory />
    </motion.section>
  );
}