"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertTriangle } from "lucide-react"

interface NavigationGuardProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function NavigationGuard({ isOpen, onConfirm, onCancel }: NavigationGuardProps) {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="max-w-[400px]">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <AlertTriangle className="h-6 w-6" />
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            You have unsaved changes in your form. If you leave now, your progress will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Stay on Page</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            Discard & Leave
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}