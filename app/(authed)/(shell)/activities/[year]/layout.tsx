import type { ReactNode } from "react";

export default function ActivitiesLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div>
      {children} {/* page.tsx or loading.tsx will render here */}
    </div>
  );
}
