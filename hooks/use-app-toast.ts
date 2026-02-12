// hooks/use-app-toast.ts
import { useToast } from "@/hooks/use-toast";

export const useAppToast = () => {
  const { toast } = useToast();

  const success = (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "success", 
      duration: 5000,
    });
  };

  const error = (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "destructive",
      duration: 5000, 
    });
  };

  const info = (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "default",
      duration: 5000,
    });
  };

  return { success, error, info, toast }; 
};