// app/portal/requests/[id]/page.tsx
import PackageDetailView from "@/components/PackageDetailView";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RequestDetailPage({ params }: PageProps) {
  // Await params because Next.js 15+ treats params as a Promise
  const { id } = await params;

  // Render the reusable view, forcing source to "pending"
  return <PackageDetailView id={id} source="pending" />;
}