"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Key, RefreshCw } from "lucide-react"

interface PasswordDisplayProps {
  invoiceNo: string
  currentPassword: string
  onReset: () => void
  isResetting: boolean
  resetSuccess: boolean
}

export function PasswordDisplay({
  invoiceNo,
  currentPassword,
  onReset,
  isResetting,
  resetSuccess,
}: PasswordDisplayProps) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="text-lg font-semibold">Security Password</div>

        {resetSuccess && (
          <Alert className="bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">Password has been successfully reset!</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label className="text-sm font-medium">Invoice Number</Label>
          <div className="text-lg font-semibold">{invoiceNo}</div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Current Password</Label>
          <div className="flex items-center gap-4">
            <div className="flex-1 p-3 bg-muted rounded-lg border">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-lg font-semibold">{currentPassword}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <Button onClick={onReset} disabled={isResetting} variant="destructive">
            <RefreshCw className={`h-4 w-4 mr-2 ${isResetting ? "animate-spin" : ""}`} />
            {isResetting ? "Resetting..." : "Reset Password"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
