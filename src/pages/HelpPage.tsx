import type { ReactNode } from "react";

type HelpPageProps = {
  children?: ReactNode;
};

export function HelpPage({ children }: HelpPageProps) {
  return <>{children}</>;
}