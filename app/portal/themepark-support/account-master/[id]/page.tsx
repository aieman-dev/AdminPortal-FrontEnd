// app/portal/it-poswf/account-management/[id]/page.tsx
"use client"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { AccountDetailsClient } from "./account-details-client"
import { Account } from "@/type/themepark-support"
import { itPoswfService } from "@/services/themepark-support" 
import { LoaderState } from "@/components/ui/loader-state"


// FIX: Destructure 'id' directly from the params object in the function argument
export default function AccountDetailsPage({ params: { id } }: { params: { id: string } }) {
  // Line 11 is now fixed by destructuring above: const { id } = params
  // const { id } = params // This line is removed/fixed by the new signature

  const [account, setAccount] = useState<Account | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAccount = async () => {
      // The 'id' is now guaranteed to be a string here.
      const accId = id; 

      if (!accId) {
        setLoading(false);
        return;
      }
      
      const response = await itPoswfService.getAccountDetails(accId);

      if (response.success && response.data) {
        // The data is already mapped to the 'Account' interface in the service layer
        setAccount(response.data); 
      } else {
        // Handle failure to load account
        console.error("Failed to load account details:", response.error);
        setAccount(null);
      }
      setLoading(false);
    };

    fetchAccount();
  }, [id]) // Dependency array updated to rely on destructured 'id'


  if (loading) {
    return <LoaderState message="Loading Account Details..." className="min-h-[60vh] border-none bg-transparent" />
  }

  if (!account) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Account not found for ID: {id}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Pass the real account data to the client component
  return <AccountDetailsClient account={account} />
}