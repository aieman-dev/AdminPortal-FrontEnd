import { SuperAppVisitorDetailView } from "@/components/modules/car-park/pages/SuperAppVisitorDetailView"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CarParkSuperAppVisitorPage({ params }: PageProps) {
  const { id } = await params
  
  return (
    <SuperAppVisitorDetailView 
        accId={id}
        backPath="/portal/car-park/superapp-visitor"
        backLabel="SuperApp Visitor"
        moduleName="Car Park"
        seasonPassBasePath="/portal/car-park/season-parking"
    />
  )
}