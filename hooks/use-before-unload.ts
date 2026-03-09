import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function useBeforeUnload(isDirty: boolean) {
  const router = useRouter();

  // Track the latest value in a ref so we don't need to re-bind the event listener
  const isDirtyRef = useRef(isDirty);

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        e.preventDefault();
        e.returnValue = ""; // Standard requirement for modern browsers to show the prompt
      }
    };

    // Bound exactly ONCE
    window.addEventListener("beforeunload", handleBeforeUnload);
    
    // Cleaned up exactly ONCE on unmount
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []); 
}