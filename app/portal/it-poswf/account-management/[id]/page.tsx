"use client"
import { Card, CardContent } from "@/components/ui/card"
import { AccountDetailsClient } from "./account-details-client"
import { mockAccountData } from "@/lib/mock-data/it-poswf"

type ActionType = "activate" | "inactive" | "reset-password" | "exchange" | "change-email" | null

export default async function AccountDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const account = mockAccountData.find((acc) => acc.id === id)

  if (!account) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">Account not found</CardContent>
        </Card>
      </div>
    )
  }

  return <AccountDetailsClient account={account} />
}
