// app/portal/packages/[id]/page.tsx
import PackageDetailView from "@/components/modules/packages/PackageDetailView";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LivePackageDetailPage({ params }: PageProps) {
  const { id } = await params;

  // Render the reusable view, forcing source to "active"
  return <PackageDetailView id={id} source="active" />;
}