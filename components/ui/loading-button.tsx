import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import React from "react"

// Use React.ComponentProps to inherit all standard button and custom variant props
interface LoadingButtonProps extends React.ComponentProps<typeof Button> {
  isLoading: boolean
  loadingText?: string
  icon?: React.ElementType
}

export function LoadingButton({ 
  children, 
  isLoading, 
  loadingText = "Processing...", 
  icon: Icon, 
  className, 
  ...props 
}: LoadingButtonProps) {
  return (
    <Button 
      {...props} 
      disabled={isLoading || props.disabled} 
      className={cn("min-w-[140px]", className)} 
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        <>
          {Icon && <Icon className="mr-2 h-4 w-4" />}
          {children}
        </>
      )}
    </Button>
  )
}