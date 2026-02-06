import { SuperAppVisitorDetailView } from "@/components/modules/car-park/pages/SuperAppVisitorDetailView"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function HRVisitorPage({ params }: PageProps) {
  const { id } = await params
  
  return (
    <SuperAppVisitorDetailView 
        accId={id}
        backPath="/portal/hr/staff-listing-cp"
        backLabel="Staff Parking List"
        moduleName="HR Management"
        seasonPassBasePath="/portal/hr/season-parking" // Important for conflict redirect
    />
  )
}