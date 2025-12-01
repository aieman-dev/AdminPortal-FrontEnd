// app/portal/page-3/[id]/page.tsx

import { StaffDetailsPage } from "@/components/staff-management/StaffDetailsPage";

interface PageProps {
  params: { id: string };
}

export default function StaffEditPage({ params }: PageProps) {
  // Pass the staff ID to the client component for fetching and editing
  return <StaffDetailsPage staffId={params.id} />;
}