// hooks/use-app-toast.ts
import { useToast } from "@/hooks/use-toast";

export const useAppToast = () => {
  const { toast } = useToast();

  const success = (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "success", // Ensure 'success' variant is defined in toast.tsx or use default
      duration: 3000,
    });
  };

  const error = (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "destructive",
      duration: 5000, // Longer for errors
    });
  };

  const info = (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "default",
      duration: 3000,
    });
  };

  return { success, error, info, toast }; // Expose raw toast just in case
};