import type { ReactNode } from "react";

type CensusPageProps = {
  children?: ReactNode;
};

export function CensusPage({ children }: CensusPageProps) {
  return <>{children}</>;
}