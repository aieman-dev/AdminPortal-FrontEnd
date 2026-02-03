import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useBeforeUnload(isDirty: boolean) {
  const router = useRouter();

  useEffect(() => {
    // Handle Browser-level events (Refresh/Close Tab)
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = ""; // Standard for modern browsers
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);
}