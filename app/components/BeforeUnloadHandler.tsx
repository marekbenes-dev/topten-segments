"use client";

import { useEffect, ReactNode } from "react";

interface BeforeUnloadHandlerProps {
  children: ReactNode;
  message?: string;
}

export default function BeforeUnloadHandler({
  children,
  message = "Are you sure you want to leave? Changes you made may not be saved.",
}: BeforeUnloadHandlerProps) {
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      console.log(e);
      e.preventDefault();
      // Modern browsers will ignore this string and show a generic message
      e.returnValue = message;
      return message;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [message]);

  return <>{children}</>;
}
