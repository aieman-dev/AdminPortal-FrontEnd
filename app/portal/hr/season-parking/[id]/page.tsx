import { SeasonParkingDetailView } from "@/components/modules/car-park/pages/SeasonParkingDetailView"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function HRSeasonParkingPage({ params }: PageProps) {
  const { id } = await params
  
  return (
    <SeasonParkingDetailView 
      qrId={id}
      backPath="/portal/hr/staff-listing-cp"   // <--- Points back to HR list
      backLabel="Staff Parking List"
      moduleName="HR Management"
    />
  )
}