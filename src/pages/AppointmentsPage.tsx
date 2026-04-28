import type { ReactNode } from "react";

type AppointmentsPageProps = {
  children?: ReactNode;
};

export function AppointmentsPage({ children }: AppointmentsPageProps) {
  return <>{children}</>;
}