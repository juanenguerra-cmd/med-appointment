import type { ReactNode } from "react";

type ReportsPageProps = {
  children?: ReactNode;
};

export function ReportsPage({ children }: ReportsPageProps) {
  return <>{children}</>;
}