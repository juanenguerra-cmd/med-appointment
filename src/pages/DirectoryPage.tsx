import type { ReactNode } from "react";

type DirectoryPageProps = {
  children?: ReactNode;
};

export function DirectoryPage({ children }: DirectoryPageProps) {
  return <>{children}</>;
}