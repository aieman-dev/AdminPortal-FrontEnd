import { BackendPackageDTO, Package, PackageItem } from "@/type/packages";

export interface AgeCategoryMapData {
    displayText: string; 
    description: string; 
}

export const transformToFrontend = (pkg: BackendPackageDTO, ageMap: Record<string, AgeCategoryMapData> = {}): Package => {
  const finalName = pkg.name || "Untitled";
  const pType = (pkg.packageType || '').trim();
  const isPointType = pType.toLowerCase().includes('point') && !pType.toLowerCase().includes('reward');
  
  // Price Logic: prefer 'point' field if point type, otherwise price/totalPrice
  let finalPrice = 0;
  let finalPoint = 0;

  if (isPointType) {
      finalPoint = pkg.point ?? 0;
      finalPrice = 0; 
  } else {
      finalPrice = pkg.price ?? 0;
      finalPoint = 0;
  }

  const rawAgeCode = pkg.ageCategory || "";
  const mappedAge = ageMap[rawAgeCode];

  const displayAgeCat = mappedAge?.displayText || rawAgeCode || "N/A";
  const displayAgeDesc = mappedAge?.description || "";

  const rawItems = pkg.items || [];
  const finalItems: PackageItem[] = rawItems.map(item => ({
      attractionId: item.attractionId,
      itemName: item.itemName || "Unknown Item",
      price: item.price ?? 0,
      point: item.point ?? 0,
      entryQty: item.entryQty ?? 1,
      nationality: item.nationality,
      category: item.category,
      itemType: item.itemType
  }));

  return {
    id: pkg.id,
    name: finalName,
    price: finalPrice,
    point: finalPoint,
    packageType: pType || "N/A",
    
    status: pkg.status || "Draft",
    imageUrl: pkg.imageUrl || "",
    nationality: pkg.nationality || "N/A",
    ageCategory: displayAgeCat,
    ageDescription: displayAgeDesc,
    effectiveDate: pkg.effectiveDate ||  "",
    lastValidDate: pkg.lastValidDate || "",
    createdDate: pkg.createdDate || "",
    
    submittedBy: pkg.submittedBy || "System",
    reviewedBy: pkg.approvedBy,
    reviewedDate: pkg.reviewedDate,
    
    remark: pkg.remark || "",
    remark2: pkg.remark2 || "",
    
    durationDays: pkg.validDays ?? 0,
    dayPass: pkg.dayPass ? String(pkg.dayPass) : undefined,
    items: finalItems
  };
};