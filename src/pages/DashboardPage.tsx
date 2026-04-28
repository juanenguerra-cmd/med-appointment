import type { ReactNode } from "react";

type DashboardPageProps = {
  children?: ReactNode;
};

export function DashboardPage({ children }: DashboardPageProps) {
  return <>{children}</>;
}