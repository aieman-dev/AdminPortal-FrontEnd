// hooks/use-app-toast.ts
import { useToast } from "@/hooks/use-toast";

// Global tracker outside the hook so it persists across renders
const activeToasts = new Set<string>();

export const useAppToast = () => {
  const { toast } = useToast();

  // Centralized, throttled dispatcher
  const showToast = (title: string, description?: string, variant: "default" | "destructive" | "success" = "default") => {
    // Create a unique fingerprint for this specific toast
    const toastKey = `${variant}-${title}-${description || ""}`;

    // If it's already on the screen in the last 2 seconds, ignore it!
    if (activeToasts.has(toastKey)) {
      return; 
    }

    activeToasts.add(toastKey);

    // Show the actual toast
    toast({
      title,
      description,
      variant,
      duration: 10000, 
    });

    // Clear the lock after 2 seconds (Cooldown period)
    setTimeout(() => {
      activeToasts.delete(toastKey);
    }, 2000);
  };


  // Update the exposed methods to use the throttler
  const success = (title: string, description?: string) => showToast(title, description, "success");
  const error = (title: string, description?: string) => showToast(title, description, "destructive");
  const info = (title: string, description?: string) => showToast(title, description, "default");

  return { success, error, info, toast }; 
};